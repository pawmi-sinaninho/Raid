import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { actorFromRequest, apiError } from "@/src/server/api";
import { getRuntime } from "@/src/server/runtime";
import { assertSameOrigin } from "@/src/server/security";
import { ROLES, TASK_STATUSES } from "@/src/core/types";

const Command = z.discriminatedUnion("type", [
  z.object({ type: z.literal("SET_READY"), participantId: z.string().uuid(), ready: z.boolean() }),
  z.object({ type: z.literal("CREATE_TEAM"), name: z.string().trim().min(1).max(80) }),
  z.object({ type: z.literal("ASSIGN_PARTICIPANT_TEAM"), participantId: z.string().uuid(), teamId: z.string().uuid().nullable() }),
  z.object({ type: z.literal("START_SESSION") }),
  z.object({ type: z.literal("CLAIM_TASK"), taskId: z.string().uuid(), expectedRevision: z.number().int().min(0) }),
  z.object({ type: z.literal("SAVE_TASK_RESULT"), taskId: z.string().uuid(), expectedRevision: z.number().int().min(0), resultData: z.record(z.string(), z.unknown()) }),
  z.object({ type: z.literal("SUBMIT_TASK_RESULT"), taskId: z.string().uuid(), expectedRevision: z.number().int().min(0), resultData: z.record(z.string(), z.unknown()) }),
  z.object({ type: z.literal("CONFIRM_TASK_RESULT"), taskId: z.string().uuid(), expectedRevision: z.number().int().min(0) }),
  z.object({ type: z.literal("ADJUST_RAID_LIFE"), delta: z.number().int().min(-20).max(20), cause: z.string().trim().min(1).max(240), relatedTaskId: z.string().uuid().nullable().optional(), correctionOf: z.string().uuid().nullable().optional() }),
  z.object({ type: z.literal("SET_CORRIDOR_TARGET"), target: z.number().int().min(1).max(500), confirmedInGame: z.boolean() }),
  z.object({ type: z.literal("SET_CORRIDOR_ASSIGNMENT"), participantId: z.string().uuid(), room: z.number().int().min(1).max(100), slot: z.number().int().min(1).max(20), status: z.enum(["ASSIGNED","ACTIVE","COMPLETED","FAILED"]) }),
  z.object({ type: z.literal("INCREMENT_CORRIDOR"), delta: z.number().int().min(-20).max(20).refine((value) => value !== 0) }),
  z.object({ type: z.literal("SET_GIGALODON_FLOOR1_TARGET"), target: z.number().int().min(1).max(100), confirmedInGame: z.boolean() }),
  z.object({ type: z.literal("INCREMENT_GIGALODON_FLOOR_GROUPS"), delta: z.number().int().min(-20).max(20).refine((value) => value !== 0) }),
  z.object({
    type: z.literal("SET_GIGALODON_LIGHT"),
    floor: z.number().int().min(-5).max(-1),
    level: z.number().int().min(0).max(4),
    observedAt: z.string().datetime().optional(),
    responsibleParticipantId: z.string().uuid().nullable().optional(),
    intervalSeconds: z.number().int().min(30).max(600).optional(),
    intervalSourceStatus: z.enum(["GUIDE_CONFIRMED", "LIVE_CONFIRMED", "LIVE_REQUIRED"]).optional(),
    saltCostSourceStatus: z.enum(["GUIDE_CONFIRMED", "LIVE_CONFIRMED", "LIVE_REQUIRED"]).optional()
  }),
  z.object({ type: z.literal("ADJUST_GIGALODON_SALT"), delta: z.number().int().min(-10_000).max(10_000).refine((value) => value !== 0), cause: z.string().trim().min(1).max(240), responsibleParticipantId: z.string().uuid().nullable().optional() }),
  z.object({ type: z.literal("REFILL_GIGALODON_LIGHT"), floor: z.number().int().min(-5).max(-1), targetLevel: z.number().int().min(1).max(4), responsibleParticipantId: z.string().uuid().nullable().optional() }),
  z.object({
    type: z.literal("UPDATE_GIGALODON_INVENTORY"),
    participantId: z.string().uuid(),
    resources: z.record(z.string(), z.unknown()),
    currentFloor: z.number().int().min(-6).max(0).nullable(),
    risk: z.enum(["LOW","MEDIUM","HIGH"]).optional(),
    confirmedAt: z.string().datetime().optional()
  }),
  z.object({ type: z.literal("DEPOSIT_GIGALODON_INVENTORY"), participantId: z.string().uuid() }),
  z.object({
    type: z.literal("RECORD_GIGALODON_LOSS"),
    participantId: z.string().uuid(),
    lostResources: z.record(z.string(), z.unknown()),
    uniqueResourceAffected: z.boolean(),
    uniqueLossSourceStatus: z.enum(["LIVE_CONFIRMED", "LIVE_REQUIRED", "PLAYER_CORRECTED"])
  }),
  z.object({ type: z.literal("SET_GIGALODON_FRAGMENT"), fragment: z.enum(["first","second","third","fourth"]), obtained: z.boolean() }),
  z.object({
    type: z.literal("CONFIRM_GIGALODON_FINAL_READINESS"),
    activeFights: z.number().int().min(0).max(20),
    activeFightsRuleSourceStatus: z.enum(["LIVE_CONFIRMED", "LIVE_REQUIRED", "PLAYER_CORRECTED"]),
    finalTeamReady: z.boolean(),
    captainConfirmed: z.boolean()
  }),
  z.object({ type: z.literal("START_GIGALODON_FINAL"), preparationSeconds: z.number().int().min(0).max(900).optional() }),
  z.object({
    type: z.literal("UPDATE_GIGALODON_FINAL"),
    combatRound: z.number().int().min(1).max(3),
    totalDamage: z.number().int().min(0),
    swallowedParticipantId: z.string().uuid().nullable().optional(),
    blackGlyphOccupied: z.boolean().optional(),
    completed: z.boolean().optional(),
    result: z.enum(["VICTORY", "DEFEAT"]).optional()
  }),
  z.object({ type: z.literal("FINISH_GIGALODON_RAID") }),
  z.object({ type: z.literal("REPORT_INFORMATION_INCORRECT"), reference: z.string().trim().min(1).max(160), note: z.string().trim().min(1).max(800) }),
  z.object({ type: z.literal("CONFIRM_PLAYER_CORRECTION"), reportId: z.string().uuid(), note: z.string().trim().min(1).max(800) }),
  z.object({
    type: z.literal("TRANSITION_TASK"),
    taskId: z.string().uuid(),
    expectedRevision: z.number().int().min(0),
    status: z.enum(TASK_STATUSES),
    resultData: z.record(z.string(), z.unknown()).optional(),
    blockedReason: z.string().max(500).nullable().optional()
  }),
  z.object({
    type: z.literal("ASSIGN_TASK"),
    taskId: z.string().uuid(),
    teamId: z.string().uuid().nullable().optional(),
    participantIds: z.array(z.string().uuid()).max(16).optional()
  }),
  z.object({ type: z.literal("INCREMENT_COUNTER"), taskId: z.string().uuid(), key: z.string(), delta: z.number().int() }),
  z.object({
    type: z.literal("ROTATE_INVITE"),
    role: z.enum(ROLES),
    scope: z.object({ teamIds: z.array(z.string().uuid()).optional(), taskDefinitionIds: z.array(z.string()).optional() }).optional()
  }),
  z.object({ type: z.literal("ROTATE_RECOVERY") })
]);

export async function POST(request: NextRequest, context: { params: Promise<{ sessionId: string }> }) {
  try {
    assertSameOrigin(request);
    const { sessionId } = await context.params;
    const actor = await actorFromRequest(request, sessionId);
    const command = Command.parse(await request.json());
    const { store } = await getRuntime();
    let result: unknown = { ok: true };
    switch (command.type) {
      case "SET_READY":
        await store.setReady(actor, command.participantId, command.ready);
        break;
      case "CREATE_TEAM":
        result = await store.createTeam(actor, command.name);
        break;
      case "ASSIGN_PARTICIPANT_TEAM":
        await store.assignParticipantToTeam(actor, command.participantId, command.teamId);
        break;
      case "START_SESSION":
        await store.startSession(actor);
        break;
      case "CLAIM_TASK":
        result = await store.claimTask(actor, command.taskId, command.expectedRevision);
        break;
      case "SAVE_TASK_RESULT":
        result = await store.saveTaskResult(actor, command);
        break;
      case "SUBMIT_TASK_RESULT":
        result = await store.submitTaskResult(actor, command);
        break;
      case "CONFIRM_TASK_RESULT":
        result = await store.confirmTaskResult(actor, command);
        break;
      case "ADJUST_RAID_LIFE":
        result = await store.adjustRaidLife(actor, command);
        break;
      case "SET_CORRIDOR_TARGET":
        result = await store.setCorridorTarget(actor, command.target, command.confirmedInGame);
        break;
      case "SET_CORRIDOR_ASSIGNMENT":
        result = await store.setCorridorAssignment(actor, command);
        break;
      case "INCREMENT_CORRIDOR":
        result = await store.incrementCorridor(actor, command.delta);
        break;
      case "SET_GIGALODON_FLOOR1_TARGET":
        result = await store.setGigalodonFloor1Target(actor, command.target, command.confirmedInGame);
        break;
      case "INCREMENT_GIGALODON_FLOOR_GROUPS":
        result = await store.incrementGigalodonFloorGroups(actor, command.delta);
        break;
      case "SET_GIGALODON_LIGHT":
        result = await store.setGigalodonLight(actor, command);
        break;
      case "ADJUST_GIGALODON_SALT":
        result = await store.adjustGigalodonSalt(actor, command);
        break;
      case "REFILL_GIGALODON_LIGHT":
        result = await store.refillGigalodonLight(actor, command);
        break;
      case "UPDATE_GIGALODON_INVENTORY":
        result = await store.updateGigalodonInventory(actor, command);
        break;
      case "DEPOSIT_GIGALODON_INVENTORY":
        result = await store.depositGigalodonInventory(actor, command.participantId);
        break;
      case "RECORD_GIGALODON_LOSS":
        result = await store.recordGigalodonLoss(actor, command);
        break;
      case "SET_GIGALODON_FRAGMENT":
        result = await store.setGigalodonFragment(actor, command.fragment, command.obtained);
        break;
      case "CONFIRM_GIGALODON_FINAL_READINESS":
        result = await store.confirmGigalodonFinalReadiness(actor, command);
        break;
      case "START_GIGALODON_FINAL":
        result = await store.startGigalodonFinal(actor, command.preparationSeconds);
        break;
      case "UPDATE_GIGALODON_FINAL":
        result = await store.updateGigalodonFinal(actor, command);
        break;
      case "FINISH_GIGALODON_RAID":
        result = await store.finishGigalodonRaid(actor);
        break;
      case "REPORT_INFORMATION_INCORRECT":
        result = await store.reportInformationIncorrect(actor, command);
        break;
      case "CONFIRM_PLAYER_CORRECTION":
        result = await store.confirmPlayerCorrection(actor, command);
        break;
      case "TRANSITION_TASK":
        result = await store.transitionTask(actor, command);
        break;
      case "ASSIGN_TASK":
        result = await store.assignTask(actor, command);
        break;
      case "INCREMENT_COUNTER":
        result = await store.incrementTaskCounter(actor, command);
        break;
      case "ROTATE_INVITE":
        result = await store.rotateInvite(actor, command.role, command.scope ?? {});
        break;
      case "ROTATE_RECOVERY":
        result = { recoveryToken: await store.rotateRecovery(actor) };
        break;
    }
    return NextResponse.json({ result });
  } catch (error) {
    return apiError(error);
  }
}
