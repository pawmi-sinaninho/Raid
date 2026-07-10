import { describe, expect, test } from "vitest";
import { getDefinition } from "@/src/core/definition-loader";
import { createInitialRaidState } from "@/src/core/raid-state";
import type { ActorContext, ParticipantRecord, SessionSnapshot, TaskInstanceRecord } from "@/src/core/types";
import { deriveWowLayer } from "@/src/core/wow-layer";

function snapshotFor(slug: string): { snapshot: SessionSnapshot; actor: ActorContext } {
  const definition = getDefinition(slug);
  const sessionId = "session-wow";
  const participant: ParticipantRecord = {
    id: "captain-1",
    sessionId,
    displayName: "Capitaine",
    role: "CAPTAIN",
    teamId: null,
    readyState: "READY",
    connectionState: "ONLINE",
    currentTaskId: null,
    lastSeenAt: "2026-06-28T20:00:00.000Z"
  };
  const tasks: TaskInstanceRecord[] = definition.tasks.map((task, index) => ({
    id: `task-${task.id}`,
    sessionId,
    definitionId: task.id,
    phaseId: task.phaseId,
    order: task.order,
    status: index === 0 ? "READY" : task.initialStatus,
    assignedTeamId: null,
    assignedParticipantIds: [],
    ownerParticipantId: null,
    resultData: {},
    blockedReason: null,
    revision: 1,
    startedAt: null,
    completedAt: null,
    updatedAt: "2026-06-28T20:00:00.000Z"
  }));
  return {
    snapshot: {
      session: {
        id: sessionId,
        definitionId: definition.id,
        definitionVersion: definition.definitionVersion,
        name: "Wow test",
        language: "fr",
        status: "LIVE",
        captainParticipantId: participant.id,
        revision: 1,
        createdAt: "2026-06-28T20:00:00.000Z",
        startedAt: "2026-06-28T20:00:00.000Z",
        endedAt: null,
        timerStartedAt: "2026-06-28T20:00:00.000Z",
        timerDurationSeconds: definition.timer.durationSeconds,
        raidState: createInitialRaidState(definition)
      },
      participants: [participant],
      teams: [],
      tasks,
      events: [],
      definition
    },
    actor: { participantId: participant.id, role: "CAPTAIN", sessionId, scope: {} }
  };
}

describe("Phase 9B Wow Layer slice", () => {
  test("derives a deterministic read-only map and smart next action", () => {
    const { snapshot, actor } = snapshotFor("sanctuaire-jardins-eternels");
    const model = deriveWowLayer({ snapshot, actor, serverNowMs: Date.parse("2026-06-28T20:01:00.000Z"), locale: "fr", devicePreferences: { soundMode: "OFF", reducedMotion: true } });
    expect(model.map.nodes.length).toBe(snapshot.definition.phases.length);
    expect(model.nextAction).not.toBeNull();
    expect(model.criticalPath.title).toBe("Chemin critique structurel");
    expect(model.criticalPath.explanation).toContain("Aucune durée restante");
    expect(snapshot.tasks[0].status).toBe("READY");
  });

  test("keeps guide/live-required information visible in data quality", () => {
    const { snapshot, actor } = snapshotFor("gouffre-gigalodon");
    const model = deriveWowLayer({ snapshot, actor, serverNowMs: Date.parse("2026-06-28T20:01:00.000Z"), locale: "fr", devicePreferences: { soundMode: "OFF", reducedMotion: true } });
    expect(model.dataQuality.liveRequiredCount).toBeGreaterThan(0);
    expect(["LIVE_REQUIRED", "DERIVED", "PARTIAL"]).toContain(model.dataQuality.trust);
  });
});
