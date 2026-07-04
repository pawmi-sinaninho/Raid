import { writeFile } from "node:fs/promises";
import path from "node:path";
import { createDatabase, migrateDatabase } from "../src/server/db/database";
import { PlatformStore } from "../src/server/platform-store";
import { getGigalodonState } from "../src/core/gigalodon";
import type { ActorContext, TaskDefinition } from "../src/core/types";

process.env.RAIDWEAVE_DB_MODE = "pglite";
process.env.RAIDWEAVE_PGLITE_PATH = "memory://";
process.env.RAIDWEAVE_TOKEN_PEPPER = "gigalodon-simulation";

async function main() {
  const db = await createDatabase();
  await migrateDatabase(db);
  const store = new PlatformStore(db);
  await store.registerBundledDefinitions();
  const created = await store.createSession({ definitionId: "gouffre-gigalodon", name: "Phase 8 full simulation", language: "fr" });

  async function join(token: string, name: string) {
    const joined = await store.joinByInvite(token, name);
    const actor = await store.authenticateRecovery(joined.sessionId, joined.participant.id, joined.recoveryToken);
    return { ...joined, actor };
  }

  const captain = await join(created.invites.CAPTAIN.token, "Captain");
  const editor = await join(created.invites.EDITOR.token, "Editor");
  const players = [];
  for (let index = 1; index <= 10; index++) players.push(await join(created.invites.PARTICIPANT.token, `Diver ${index}`));
  const roster = [captain, editor, ...players];
  const participantIds = roster.map((member) => member.participant.id);
  for (const member of roster) await store.setReady(captain.actor, member.participant.id, true);
  await store.startSession(captain.actor);

  async function taskDefinition(id: string): Promise<TaskDefinition> {
    const snapshot = await store.getSnapshot(created.session.id);
    const definition = snapshot.definition.tasks.find((item) => item.id === id);
    if (!definition) throw new Error(`Definition ${id} missing`);
    return definition;
  }

  async function complete(id: string, resultData: Record<string, unknown>, submitter: ActorContext = captain.actor) {
    let snapshot = await store.getSnapshot(created.session.id);
    let task = snapshot.tasks.find((item) => item.definitionId === id);
    if (!task) throw new Error(`Task ${id} missing`);
    if (task.status === "COMPLETED") return;
    if (task.status === "LOCKED") throw new Error(`Task ${id} still locked at revision ${snapshot.session.revision}`);
    const definition = await taskDefinition(id);
    if (definition.completion.confirmationPolicy === "SYSTEM") throw new Error(`Cannot manually complete system task ${id}`);
    if (task.status === "READY") {
      task = await store.claimTask(submitter, task.id, task.revision);
    }
    if (task.status === "CLAIMED") {
      task = await store.transitionTask(submitter, { taskId: task.id, expectedRevision: task.revision, status: "ACTIVE" });
    }
    if (task.status === "WAITING") {
      const confirmer = definition.completion.confirmationPolicy === "CAPTAIN" ? captain.actor : editor.actor;
      await store.confirmTaskResult(confirmer, { taskId: task.id, expectedRevision: task.revision });
      return;
    }
    const submitted = await store.submitTaskResult(submitter, { taskId: task.id, expectedRevision: task.revision, resultData });
    if (submitted.status === "WAITING") {
      const confirmer = definition.completion.confirmationPolicy === "CAPTAIN" ? captain.actor : editor.actor;
      await store.confirmTaskResult(confirmer, { taskId: submitted.id, expectedRevision: submitted.revision });
    }
  }

  await complete("G0-010", {
    "gigalodon.functionalRoles": participantIds.slice(0, 7).map((participantId, index) => ({ participantId, role: ["COMBAT", "LIGHT", "BANK", "LUMINARIUM", "SCRIBE", "PINCE", "FINAL"][index] })),
    backupEditorParticipantId: editor.participant.id
  });
  await complete("G0-020", {
    "session.readyParticipantIds": participantIds,
    "gigalodon.lightStates[-1]": { floor: -1, level: 4, observedAt: new Date().toISOString() }
  });

  await store.adjustGigalodonSalt(captain.actor, { delta: 100, cause: "Simulation: collecte commune", responsibleParticipantId: players[0]!.participant.id });
  await store.setGigalodonLight(captain.actor, { floor: -1, level: 0, intervalSeconds: 120, intervalSourceStatus: "GUIDE_CONFIRMED", saltCostSourceStatus: "GUIDE_CONFIRMED", responsibleParticipantId: players[0]!.participant.id });
  await store.refillGigalodonLight(captain.actor, { floor: -1, targetLevel: 4, responsibleParticipantId: players[0]!.participant.id });
  let snapshot = await store.getSnapshot(created.session.id);
  let lightTask = snapshot.tasks.find((item) => item.definitionId === "G-LIGHT-010")!;
  await store.submitTaskResult(captain.actor, {
    taskId: lightTask.id,
    expectedRevision: lightTask.revision,
    resultData: {
      "gigalodon.lightStates[].floor": -1,
      "gigalodon.lightStates[].level": 4,
      "gigalodon.lightStates[].observedAt": new Date().toISOString(),
      "gigalodon.lightStates[].nextDecayAt": new Date(Date.now() + 120_000).toISOString()
    }
  });
  await complete("G-LIGHT-030", {
    "gigalodon.lightAction.floor": -1,
    "gigalodon.lightAction.oldLevel": 0,
    "gigalodon.lightAction.targetLevel": 4,
    "gigalodon.lightAction.saltUsed": 20,
    "gigalodon.lightAction.participantId": players[0]!.participant.id
  });

  await store.updateGigalodonInventory(players[0]!.actor, { participantId: players[0]!.participant.id, resources: { quartz: 20, onyx: 2 }, currentFloor: -1, risk: "MEDIUM" });
  snapshot = await store.getSnapshot(created.session.id);
  let ledgerTask = snapshot.tasks.find((item) => item.definitionId === "G-LEDGER-010")!;
  await store.submitTaskResult(players[0]!.actor, {
    taskId: ledgerTask.id,
    expectedRevision: ledgerTask.revision,
    resultData: {
      "gigalodon.participantInventories[].resources": { quartz: 20, onyx: 2 },
      "gigalodon.participantInventories[].currentFloor": -1,
      "gigalodon.participantInventories[].lastConfirmedAt": new Date().toISOString(),
      "gigalodon.participantInventories[].risk": "MEDIUM"
    }
  });
  await complete("G-LEDGER-020", {
    "gigalodon.loss.participantId": players[1]!.participant.id,
    "gigalodon.loss.lostResources": {},
    "gigalodon.loss.uniqueResourceAffected": false
  });

  await complete("G1-010", {
    "gigalodon.floorStates[-1].groupTarget": 6,
    "gigalodon.floorStates[-1].groupsCompleted": 0
  });
  await store.setGigalodonFloor1Target(captain.actor, 6, false);
  await store.incrementGigalodonFloorGroups(players[0]!.actor, 6);
  await complete("G1-030", {
    "gigalodon.fragments.first": true,
    "gigalodon.fragments.first.reportedBy": players[1]!.participant.id
  });

  await store.refillGigalodonLight(captain.actor, { floor: -2, targetLevel: 4, responsibleParticipantId: players[1]!.participant.id });
  await complete("G2-010", { "gigalodon.lightStates[-2].level": 4 });
  await complete("G2-020", {});
  await complete("G2-030", {
    "gigalodon.bosses.mureine.uniqueResourceHolder": players[2]!.participant.id,
    "gigalodon.fragments.second": true
  });
  await store.adjustGigalodonSalt(captain.actor, { delta: 3, cause: "Simulation: sel Mureine", responsibleParticipantId: players[2]!.participant.id });
  await store.updateGigalodonInventory(captain.actor, { participantId: players[2]!.participant.id, resources: { uniteMureine: 1, quartz: 30 }, currentFloor: -2, risk: "HIGH" });

  await store.refillGigalodonLight(captain.actor, { floor: -3, targetLevel: 4, responsibleParticipantId: players[2]!.participant.id });
  await complete("G3-010", { "gigalodon.luminarium.cells": [
    [true, false, true, false], [false, true, false, true], [true, true, false, false], [false, false, true, true]
  ] });
  await complete("G3-020", { "gigalodon.luminarium.solutionClicks": [0, 3, 5, 10, 12] });
  await complete("G3-030", { "gigalodon.luminarium.executedClicks": 5, "gigalodon.luminarium.completed": true });

  await store.refillGigalodonLight(captain.actor, { floor: -4, targetLevel: 4, responsibleParticipantId: players[3]!.participant.id });
  await complete("G4-010", { "gigalodon.lightStates[-4].level": 4 });
  await complete("G4-020", { "gigalodon.execrabe.sequenceRecorderParticipantId": players[3]!.participant.id });
  await complete("G4-030", {
    "gigalodon.execrabe.sequence.threshold80000": "COQUILLAGE",
    "gigalodon.execrabe.sequence.threshold60000": "OURSIN",
    "gigalodon.execrabe.sequence.threshold40000": "PERLE",
    "gigalodon.execrabe.sequence.threshold20000": "POULPE"
  });
  await complete("G4-040", {
    "gigalodon.bosses.execrabe.rancuneHolder": players[4]!.participant.id,
    "gigalodon.bosses.execrabe.pinceHolder": players[5]!.participant.id,
    "gigalodon.fragments.third": true
  });
  await store.updateGigalodonInventory(captain.actor, { participantId: players[4]!.participant.id, resources: { rancuneExecrabe: 1, onyx: 20 }, currentFloor: -4, risk: "HIGH" });
  await store.adjustGigalodonSalt(captain.actor, { delta: 4, cause: "Simulation: sel Exécrabe", responsibleParticipantId: players[5]!.participant.id });
  await store.updateGigalodonInventory(captain.actor, { participantId: players[5]!.participant.id, resources: { pinceExecrabe: 1 }, currentFloor: -4, risk: "MEDIUM" });
  await complete("G4-050", { "gigalodon.execrabe.puzzle.progressIndex": 4, "gigalodon.execrabe.puzzle.failures": 1 });
  await complete("G4-060", { "gigalodon.shortcut.open": true });
  await complete("G4-070", { "gigalodon.depositDecision.securedScore": 6000, "gigalodon.depositDecision.estimatedMinutes": 2, "gigalodon.depositDecision.decision": "DEPOSIT_NOW" });

  await store.refillGigalodonLight(captain.actor, { floor: -5, targetLevel: 4, responsibleParticipantId: players[4]!.participant.id });

  await store.depositGigalodonInventory(captain.actor, players[0]!.participant.id);
  snapshot = await store.getSnapshot(created.session.id);
  const depositTask = snapshot.tasks.find((item) => item.definitionId === "G-LEDGER-030")!;
  await store.submitTaskResult(captain.actor, {
    taskId: depositTask.id,
    expectedRevision: depositTask.revision,
    resultData: {
      "gigalodon.deposit.participantId": players[0]!.participant.id,
      "gigalodon.deposit.resources": { quartz: 20, onyx: 2 },
      "gigalodon.deposit.confirmedScoreDelta": 100
    }
  });

  await complete("G5-010", { "gigalodon.fragments": { first: true, second: true, third: true, fourth: false } });
  await complete("G5-030", { "gigalodon.floorStates[-5].farmAssignments": participantIds.slice(2, 10), "gigalodon.floorStates[-5].activeFights": 3 });
  await store.setGigalodonFragment(captain.actor, "fourth", true);

  await complete("G6-010", { "gigalodon.willorque.teamReady": true, "gigalodon.willorque.teamParticipantIds": participantIds.slice(0, 8) });
  await complete("G6-020", { "gigalodon.willorque.hp": 0, "gigalodon.willorque.lightCount": 100, "gigalodon.willorque.lanternsOn": 10, "gigalodon.willorque.thresholdTriggered": true });
  await complete("G6-030", { "gigalodon.bosses.willorque.noirceurHolder": players[6]!.participant.id });
  await store.updateGigalodonInventory(captain.actor, { participantId: players[6]!.participant.id, resources: { noirceurWillorque: 1, onyx: 40 }, currentFloor: -6, risk: "HIGH" });

  await store.depositGigalodonInventory(captain.actor, players[2]!.participant.id);
  await store.depositGigalodonInventory(captain.actor, players[4]!.participant.id);
  await store.depositGigalodonInventory(captain.actor, players[6]!.participant.id);

  await complete("GF-010", {
    "gigalodon.finalReadiness.activeFights": 1,
    "gigalodon.finalReadiness.criticalUnbankedScore": 0,
    "gigalodon.finalReadiness.staleInventoryParticipantIds": []
  });
  await complete("GF-020", {
    "gigalodon.finalReadiness.mureineResourceBanked": true,
    "gigalodon.finalReadiness.execrabeResourceBanked": true,
    "gigalodon.finalReadiness.willorqueResourceBanked": true
  });
  await store.confirmGigalodonFinalReadiness(captain.actor, { activeFights: 1, activeFightsRuleSourceStatus: "LIVE_REQUIRED", finalTeamReady: true, captainConfirmed: true });
  await store.startGigalodonFinal(captain.actor, 180);
  await complete("GG-030", { "gigalodon.final.swallowedParticipantId": players[7]!.participant.id, "gigalodon.final.blackGlyphOccupied": false });
  await store.updateGigalodonFinal(players[0]!.actor, { combatRound: 1, totalDamage: 80_000, completed: false });
  await store.updateGigalodonFinal(players[0]!.actor, { combatRound: 2, totalDamage: 180_000, completed: false });
  await store.updateGigalodonFinal(players[0]!.actor, { combatRound: 3, totalDamage: 600_000, completed: true, result: "VICTORY" });
  await store.finishGigalodonRaid(captain.actor);

  const defeatSession = await store.createSession({ definitionId: "gouffre-gigalodon", name: "Phase 8.6.1 defeat final simulation", language: "fr" });
  const defeatCaptain = await join(defeatSession.invites.CAPTAIN.token, "Defeat Captain");
  const defeatEditor = await join(defeatSession.invites.EDITOR.token, "Defeat Editor");
  const defeatPlayers = [];
  for (let index = 1; index <= 6; index++) defeatPlayers.push(await join(defeatSession.invites.PARTICIPANT.token, `Defeat Diver ${index}`));
  const defeatRoster = [defeatCaptain, defeatEditor, ...defeatPlayers];
  for (const member of defeatRoster) await store.setReady(defeatCaptain.actor, member.participant.id, true);
  await store.startSession(defeatCaptain.actor);
  const defeatHolder = defeatPlayers[0]!;
  await store.updateGigalodonInventory(defeatCaptain.actor, {
    participantId: defeatHolder.participant.id,
    resources: { uniteMureine: 1, rancuneExecrabe: 1, noirceurWillorque: 1 },
    currentFloor: 0,
    risk: "HIGH"
  });
  await store.depositGigalodonInventory(defeatCaptain.actor, defeatHolder.participant.id);
  await store.confirmGigalodonFinalReadiness(defeatCaptain.actor, { activeFights: 1, activeFightsRuleSourceStatus: "LIVE_REQUIRED", finalTeamReady: true, captainConfirmed: true });
  await store.startGigalodonFinal(defeatCaptain.actor, 180);
  await store.updateGigalodonFinal(defeatHolder.actor, { combatRound: 1, totalDamage: 40_000, completed: false });
  const beforeDefeatResult = await store.getSession(defeatSession.session.id);
  await store.updateGigalodonFinal(defeatHolder.actor, { combatRound: 2, totalDamage: 70_000, completed: true, result: "DEFEAT" });
  const afterDefeatResult = await store.getSnapshot(defeatSession.session.id);
  let secondStartRejected = false;
  try { await store.startGigalodonFinal(defeatCaptain.actor, 180); }
  catch { secondStartRejected = true; }
  if (!secondStartRejected) throw new Error("Second Gigalodon final start was not rejected after DEFEAT");
  await store.finishGigalodonRaid(defeatCaptain.actor);
  const defeatFinalSnapshot = await store.getSnapshot(defeatSession.session.id);
  const defeatInvariant = await store.assertEventInvariant(defeatSession.session.id);
  const defeatClientSnapshots = await Promise.all(Array.from({ length: 8 }, () => store.getSnapshot(defeatSession.session.id)));
  const defeatFingerprints = new Set(defeatClientSnapshots.map((item) => JSON.stringify({ revision: item.session.revision, status: item.session.status, raidState: item.session.raidState })));
  if (!defeatInvariant.valid || defeatFingerprints.size !== 1) throw new Error("Defeat final clients or event stream did not converge");

  const finalSnapshot = await store.getSnapshot(created.session.id);
  const invariant = await store.assertEventInvariant(created.session.id);
  if (!invariant.valid) throw new Error(`Event invariant failed: ${JSON.stringify(invariant)}`);
  const clientSnapshots = await Promise.all(Array.from({ length: 12 }, () => store.getSnapshot(created.session.id)));
  const fingerprints = new Set(clientSnapshots.map((item) => JSON.stringify({ revision: item.session.revision, status: item.session.status, raidState: item.session.raidState, tasks: item.tasks.map((task) => [task.definitionId, task.status, task.resultData]) })));
  if (fingerprints.size !== 1) throw new Error("12 simulated clients did not converge");
  const gigalodon = getGigalodonState(finalSnapshot.session.raidState);
  const openTasks = finalSnapshot.tasks.filter((task) => !["COMPLETED", "SKIPPED"].includes(task.status)).map((task) => `${task.definitionId}:${task.status}`);
  if (openTasks.length) throw new Error(`Simulation ended with open tasks: ${openTasks.join(", ")}`);

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
    confirmedScore: gigalodon.confirmedScore,
    projectedUnbankedScore: gigalodon.projectedUnbankedScore,
    fragments: gigalodon.fragments,
    floor1: { completed: Number(gigalodon.floorStates["-1"]?.groupsCompleted ?? 0), target: gigalodon.floor1GroupTarget, sourceStatus: gigalodon.floor1GroupTargetSourceStatus },
    light: { trackedFloors: gigalodon.lightStates.length, intervalSeconds: gigalodon.lightIntervalSeconds, intervalSourceStatus: gigalodon.lightIntervalSourceStatus, saltCostSourceStatus: gigalodon.saltCostSourceStatus },
    sharedSaltPool: gigalodon.saltPool,
    uniqueDrops: gigalodon.bossUniqueDrops,
    pinceHolder: gigalodon.pinceHolder,
    final: gigalodon.final,
    finalScenarios: {
      victory: { result: gigalodon.final.result, totalDamage: gigalodon.final.totalDamage, finalBonusScore: gigalodon.final.finalBonusScore, status: finalSnapshot.session.status, convergedClients: clientSnapshots.length },
      defeat: { result: getGigalodonState(defeatFinalSnapshot.session.raidState).final.result, totalDamage: getGigalodonState(defeatFinalSnapshot.session.raidState).final.totalDamage, finalBonusScore: getGigalodonState(defeatFinalSnapshot.session.raidState).final.finalBonusScore, status: defeatFinalSnapshot.session.status, resultRevisionDelta: afterDefeatResult.session.revision - beforeDefeatResult.revision, secondStartRejected, eventInvariant: defeatInvariant.valid, convergedClients: defeatClientSnapshots.length }
    },
    totalScore: gigalodon.confirmedScore + gigalodon.final.bonusScore,
    finalStatus: finalSnapshot.session.status
  };
  await writeFile(path.join(process.cwd(), "artifacts/gigalodon-simulation.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await db.close();
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
