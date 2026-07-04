import { writeFile } from "node:fs/promises";
import path from "node:path";
import { createDatabase, migrateDatabase } from "../src/server/db/database";
import { PlatformStore } from "../src/server/platform-store";
import { getSanctuaireState } from "../src/core/sanctuaire";
import type { ActorContext, InputFieldDefinition, TaskDefinition } from "../src/core/types";

process.env.RAIDWEAVE_DB_MODE = "pglite";
process.env.RAIDWEAVE_PGLITE_PATH = "memory://";
process.env.RAIDWEAVE_TOKEN_PEPPER = "sanctuaire-simulation";

function sampleValue(field: InputFieldDefinition, participants: string[]): unknown {
  if (field.type === "enum" && field.enumValues?.length) return field.enumValues[0];
  if (field.type === "boolean") return true;
  if (field.type === "integer" || field.type === "number") return typeof field.default === "number" ? field.default : field.minimum ?? 1;
  if (field.type === "object") return { board: "A", coordinate: "A1", confirmed: true };
  if (field.type === "array") {
    if (field.path.includes("boatCells")) return ["A1", "B2", "C3"];
    if (field.path.includes("flowerSequence")) return ["Crayon", "Kamas", "Bague", "Règle"];
    if (field.path.includes("teamParticipantIds")) return participants.slice(0, 8);
    if (field.path.includes("assignments")) return participants.slice(0, 4).map((participantId, index) => ({ participantId, target: index + 1 }));
    return ["TEST"];
  }
  return "TEST";
}

function resultFor(task: TaskDefinition, participants: string[]) {
  const result: Record<string, unknown> = {};
  for (const field of [...task.inputFields, ...task.completion.resultFields]) {
    result[field.path] = sampleValue(field, participants);
  }
  return result;
}

async function main() {
  const db = await createDatabase();
  await migrateDatabase(db);
  const store = new PlatformStore(db);
  await store.registerBundledDefinitions();
  const created = await store.createSession({ definitionId: "sanctuaire-jardins-eternels", name: "Phase 7 full simulation", language: "fr" });

  async function join(token: string, name: string) {
    const joined = await store.joinByInvite(token, name);
    const actor = await store.authenticateRecovery(joined.sessionId, joined.participant.id, joined.recoveryToken);
    return { ...joined, actor };
  }

  const captain = await join(created.invites.CAPTAIN.token, "Captain");
  const editor = await join(created.invites.EDITOR.token, "Editor");
  const players = [];
  for (let index = 1; index <= 14; index++) players.push(await join(created.invites.PARTICIPANT.token, `Player ${index}`));
  const roster = [captain, editor, ...players];
  for (const member of roster) await store.setReady(captain.actor, member.participant.id, true);
  await store.startSession(captain.actor);
  await store.adjustRaidLife(captain.actor, { delta: -2, cause: "Simulation: combat perdu à deux" });
  await store.adjustRaidLife(captain.actor, { delta: 1, cause: "Simulation: énigme réussie" });

  const participantIds = roster.map((member) => member.participant.id);
  for (let index = 0; index < 6; index++) {
    await store.setCorridorAssignment(captain.actor, { participantId: participantIds[index + 2]!, room: index + 1, slot: 1, status: "ASSIGNED" });
  }

  const completedByCommands: string[] = [];
  for (let step = 0; step < 120; step++) {
    const snapshot = await store.getSnapshot(created.session.id);
    if (snapshot.session.status === "ENDED") break;
    const corridor = snapshot.tasks.find((task) => task.definitionId === "S3-COR-020");
    if (corridor?.status === "READY" || corridor?.status === "ACTIVE" || corridor?.status === "CLAIMED") {
      const state = snapshot.session.raidState.sanctuaire as { corridorCompleted?: number; corridorTarget?: number };
      const remaining = (state.corridorTarget ?? 60) - (state.corridorCompleted ?? 0);
      if (remaining > 0) {
        for (let pending = remaining; pending > 0; pending -= Math.min(20, pending)) {
          await store.incrementCorridor(players[0]!.actor, Math.min(20, pending));
        }
      }
      completedByCommands.push("S3-COR-020");
      continue;
    }

    const task = snapshot.tasks.find((candidate) => candidate.status === "READY" && candidate.definitionId !== "S3-COR-030");
    if (!task) {
      const open = snapshot.tasks.filter((candidate) => !["COMPLETED", "SKIPPED"].includes(candidate.status)).map((candidate) => `${candidate.definitionId}:${candidate.status}`);
      throw new Error(`Simulation stalled at revision ${snapshot.session.revision}: ${open.join(", ")}`);
    }
    const definition = snapshot.definition.tasks.find((candidate) => candidate.id === task.definitionId)!;
    if (definition.completion.confirmationPolicy === "SYSTEM") {
      throw new Error(`System task unexpectedly READY: ${definition.id}`);
    }
    const claimed = await store.claimTask(captain.actor, task.id, task.revision);
    const active = await store.transitionTask(captain.actor, { taskId: claimed.id, expectedRevision: claimed.revision, status: "ACTIVE" });
    const generatedResult = resultFor(definition, participantIds);
    let submitted;
    try {
      submitted = await store.submitTaskResult(captain.actor, {
        taskId: active.id,
        expectedRevision: active.revision,
        resultData: generatedResult
      });
    } catch (error) {
      console.error("SUBMIT_FAILED", definition.id, generatedResult, error);
      throw error;
    }
    if (submitted.status === "WAITING") {
      const confirmer: ActorContext = definition.completion.confirmationPolicy === "CAPTAIN" ? captain.actor : editor.actor;
      await store.confirmTaskResult(confirmer, { taskId: submitted.id, expectedRevision: submitted.revision });
    }
    completedByCommands.push(definition.id);
  }

  const finalSnapshot = await store.getSnapshot(created.session.id);
  if (finalSnapshot.session.status !== "ENDED") throw new Error("Sanctuaire simulation did not end the session");
  const invariant = await store.assertEventInvariant(created.session.id);
  if (!invariant.valid) throw new Error(`Event invariant failed: ${JSON.stringify(invariant)}`);
  const clientSnapshots = await Promise.all(Array.from({ length: 16 }, () => store.getSnapshot(created.session.id)));
  const fingerprints = new Set(clientSnapshots.map((snapshot) => JSON.stringify({ revision: snapshot.session.revision, status: snapshot.session.status, raidState: snapshot.session.raidState, tasks: snapshot.tasks.map((task) => [task.definitionId, task.status, task.resultData]) })));
  if (fingerprints.size !== 1) throw new Error("16 simulated clients did not converge");

  const sanctuaire = getSanctuaireState(finalSnapshot.session.raidState);
  const report = {
    generatedAt: new Date().toISOString(),
    sessionId: created.session.id,
    participantCount: roster.length,
    finalRevision: finalSnapshot.session.revision,
    eventCount: invariant.eventCount,
    eventInvariant: invariant.valid,
    convergedClients: clientSnapshots.length,
    completedTasks: finalSnapshot.tasks.filter((task) => task.status === "COMPLETED").length,
    totalTasks: finalSnapshot.tasks.length,
    completedByCommands,
    raidLife: sanctuaire.raidLife,
    corridor: { completed: sanctuaire.corridorCompleted, target: sanctuaire.corridorTarget, sourceStatus: sanctuaire.corridorTargetSourceStatus },
    finalBosses: {
      queen: finalSnapshot.tasks.find((task) => task.definitionId === "S4-QUE-050")?.status,
      princess: finalSnapshot.tasks.find((task) => task.definitionId === "S4-PRI-050")?.status,
      commonGate: finalSnapshot.tasks.find((task) => task.definitionId === "S4-ALL-900")?.status
    },
    transferred: {
      sentinelColor: finalSnapshot.tasks.find((task) => task.definitionId === "S2-SEN-010")?.resultData.monochromeColor,
      sentinelElement: finalSnapshot.tasks.find((task) => task.definitionId === "S2-SEN-010")?.resultData.targetElement,
      closMonster: finalSnapshot.tasks.find((task) => task.definitionId === "S1-CLO-040")?.resultData.expectedMonster,
      closMap: finalSnapshot.tasks.find((task) => task.definitionId === "S1-CLO-040")?.resultData.expectedMap
    }
  };
  await writeFile(path.join(process.cwd(), "artifacts/sanctuaire-simulation.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await db.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
