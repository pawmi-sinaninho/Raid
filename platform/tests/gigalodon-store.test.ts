import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { createDatabase, migrateDatabase, type Database } from "@/src/server/db/database";
import { PlatformStore } from "@/src/server/platform-store";
import { getGigalodonState } from "@/src/core/gigalodon";
import { getDefinition } from "@/src/core/definition-loader";
import type { ActorContext } from "@/src/core/types";

let db: Database;
let store: PlatformStore;

beforeEach(async () => {
  process.env.RAIDWEAVE_DB_MODE = "pglite";
  process.env.RAIDWEAVE_PGLITE_PATH = "memory://";
  process.env.RAIDWEAVE_TOKEN_PEPPER = "test-pepper";
  db = await createDatabase();
  await migrateDatabase(db);
  store = new PlatformStore(db);
  await store.registerBundledDefinitions();
});

afterEach(async () => { await db.close(); });

async function createSession() {
  return store.createSession({ definitionId: "gouffre-gigalodon", name: "Gigalodon Integration", language: "fr" });
}

async function join(token: string, name: string) {
  const joined = await store.joinByInvite(token, name);
  const actor = await store.authenticateRecovery(joined.sessionId, joined.participant.id, joined.recoveryToken);
  return { ...joined, actor };
}

async function roster() {
  const created = await createSession();
  const captain = await join(created.invites.CAPTAIN.token, "Captain");
  const editor = await join(created.invites.EDITOR.token, "Editor");
  const players = [];
  for (let index = 1; index <= 6; index++) players.push(await join(created.invites.PARTICIPANT.token, `Diver ${index}`));
  for (const member of [captain, editor, ...players]) await store.setReady(captain.actor, member.participant.id, true);
  await store.startSession(captain.actor);
  return { created, captain, editor, players };
}

async function forceTaskActive(sessionId: string, definitionId: string) {
  await db.query(
    `UPDATE task_instances SET status='ACTIVE',started_at=now(),revision=revision+1,updated_at=now() WHERE session_id=$1 AND definition_id=$2`,
    [sessionId, definitionId]
  );
  return (await store.getSnapshot(sessionId)).tasks.find((task) => task.definitionId === definitionId)!;
}

describe("Gigalodon store", () => {
  test("startet die 8-Personen-Session über den generischen Systemstart", async () => {
    const setup = await roster();
    const snapshot = await store.getSnapshot(setup.created.session.id);
    expect(snapshot.session.status).toBe("LIVE");
    expect(snapshot.tasks.find((task) => task.definitionId === "G0-001")?.status).toBe("COMPLETED");
    expect(snapshot.tasks.find((task) => task.definitionId === "G0-010")?.status).toBe("READY");
    const state = getGigalodonState(snapshot.session.raidState);
    expect(state.saltPool.amount).toBe(0);
    expect(state.lightStates.find((light) => light.floor === -1)).toMatchObject({ level: 4, baselineLevel: 4, baselineSourceStatus: "GUIDE_CONFIRMED" });
    expect((await store.assertEventInvariant(setup.created.session.id)).valid).toBe(true);
  });

  test("führt Salz global und atomar, verbraucht kumulative Lichtkosten und hält Inventare salzfrei", async () => {
    const setup = await roster();
    const player = setup.players[0]!;
    await Promise.all([
      store.adjustGigalodonSalt(player.actor, { delta: 15, cause: "Fund A", responsibleParticipantId: player.participant.id }),
      store.adjustGigalodonSalt(setup.players[1]!.actor, { delta: 15, cause: "Fund B", responsibleParticipantId: setup.players[1]!.participant.id })
    ]);
    await store.setGigalodonLight(player.actor, { floor: -1, level: 0, intervalSeconds: 120, intervalSourceStatus: "GUIDE_CONFIRMED", saltCostSourceStatus: "GUIDE_CONFIRMED" });
    await store.refillGigalodonLight(player.actor, { floor: -1, targetLevel: 4, responsibleParticipantId: player.participant.id });
    await expect(store.updateGigalodonInventory(player.actor, {
      participantId: player.participant.id,
      resources: { salt: 5, quartz: 10, onyx: 2, uniteMureine: 1 },
      currentFloor: -1,
      risk: "HIGH"
    })).rejects.toMatchObject({ code: "PERSONAL_SALT_FORBIDDEN" });
    await store.updateGigalodonInventory(player.actor, {
      participantId: player.participant.id,
      resources: { quartz: 10, onyx: 2, uniteMureine: 1 },
      currentFloor: -1,
      risk: "HIGH"
    });
    let state = getGigalodonState((await store.getSnapshot(setup.created.session.id)).session.raidState);
    expect(state.projectedUnbankedScore).toBe(1080);
    expect(state.confirmedScore).toBe(0);
    expect(state.lightStates[0]).toMatchObject({ floor: -1, level: 4, intervalSourceStatus: "GUIDE_CONFIRMED" });
    expect(state.saltPool.amount).toBe(10);
    expect(state.saltPool.lastChange).toMatchObject({ kind: "REFILL", before: 30, after: 10, delta: -20 });
    expect(state.participantInventories[0]?.resources).not.toHaveProperty("salt");

    await store.depositGigalodonInventory(player.actor, player.participant.id);
    state = getGigalodonState((await store.getSnapshot(setup.created.session.id)).session.raidState);
    expect(state.confirmedScore).toBe(1080);
    expect(state.projectedUnbankedScore).toBe(0);
    expect(state.participantInventories[0]?.resources.quartz).toBe(0);
    expect(state.bossUniqueDrops.mureine.banked).toBe(true);
    expect((await store.assertEventInvariant(setup.created.session.id)).valid).toBe(true);
  });

  test("erzwingt die Exécrabe-Zweitbestätigung und überträgt Sequenz sowie Unique-Halter", async () => {
    const setup = await roster();
    const sequenceTask = await forceTaskActive(setup.created.session.id, "G4-030");
    const submitted = await store.submitTaskResult(setup.captain.actor, {
      taskId: sequenceTask.id,
      expectedRevision: sequenceTask.revision,
      resultData: {
        "gigalodon.execrabe.sequence.threshold80000": "COQUILLAGE",
        "gigalodon.execrabe.sequence.threshold60000": "OURSIN",
        "gigalodon.execrabe.sequence.threshold40000": "PERLE",
        "gigalodon.execrabe.sequence.threshold20000": "POULPE"
      }
    });
    await store.confirmTaskResult(setup.editor.actor, { taskId: submitted.id, expectedRevision: submitted.revision });
    let snapshot = await store.getSnapshot(setup.created.session.id);
    expect(snapshot.tasks.find((task) => task.definitionId === "G4-050")?.resultData.sequence).toEqual(["COQUILLAGE", "OURSIN", "PERLE", "POULPE"]);

    const dropTask = await forceTaskActive(setup.created.session.id, "G4-040");
    const dropSubmitted = await store.submitTaskResult(setup.captain.actor, {
      taskId: dropTask.id,
      expectedRevision: dropTask.revision,
      resultData: {
        "gigalodon.bosses.execrabe.rancuneHolder": setup.players[0]!.participant.id,
        "gigalodon.bosses.execrabe.pinceHolder": setup.players[1]!.participant.id
      }
    });
    await store.confirmTaskResult(setup.editor.actor, { taskId: dropSubmitted.id, expectedRevision: dropSubmitted.revision });
    snapshot = await store.getSnapshot(setup.created.session.id);
    const state = getGigalodonState(snapshot.session.raidState);
    expect(state.fragments.third).toBe(true);
    expect(state.bossUniqueDrops.execrabe.holderParticipantId).toBe(setup.players[0]!.participant.id);
    expect(state.pinceHolder).toBe(setup.players[1]!.participant.id);
  });

  test("unterscheidet unbestätigte Finalblockade und beendet den Schadenslauf konsistent", async () => {
    const setup = await roster();
    const holder = setup.players[0]!;
    await store.updateGigalodonInventory(setup.captain.actor, {
      participantId: holder.participant.id,
      resources: { uniteMureine: 1, rancuneExecrabe: 1, noirceurWillorque: 1 },
      currentFloor: 0,
      risk: "HIGH"
    });
    await store.depositGigalodonInventory(setup.captain.actor, holder.participant.id);
    await forceTaskActive(setup.created.session.id, "GF-030");
    await store.confirmGigalodonFinalReadiness(setup.captain.actor, {
      activeFights: 1,
      activeFightsRuleSourceStatus: "LIVE_REQUIRED",
      finalTeamReady: true,
      captainConfirmed: true
    });
    let snapshot = await store.getSnapshot(setup.created.session.id);
    expect(snapshot.session.status).toBe("FINAL_PREP");
    expect(snapshot.tasks.find((task) => task.definitionId === "GG-010")?.status).toBe("READY");

    await store.startGigalodonFinal(setup.captain.actor, 180);
    snapshot = await store.getSnapshot(setup.created.session.id);
    expect(snapshot.session.status).toBe("FINAL_ACTIVE");
    await store.updateGigalodonFinal(holder.actor, { combatRound: 3, totalDamage: 300_000, completed: true, result: "VICTORY" });
    snapshot = await store.getSnapshot(setup.created.session.id);
    expect(getGigalodonState(snapshot.session.raidState).final.bonusScore).toBe(10_000);
    expect(getGigalodonState(snapshot.session.raidState).final.result).toBe("VICTORY");
    await expect(store.startGigalodonFinal(setup.captain.actor, 180)).rejects.toMatchObject({ code: "FINAL_ALREADY_COMPLETED" });
    expect(snapshot.tasks.find((task) => task.definitionId === "GG-050")?.status).toBe("READY");
    await store.finishGigalodonRaid(setup.captain.actor);
    snapshot = await store.getSnapshot(setup.created.session.id);
    expect(snapshot.session.status).toBe("ENDED");
    expect((await store.assertEventInvariant(setup.created.session.id)).valid).toBe(true);
  });

  test("DEFEAT beendet den einzigen Finalversuch und erzeugt genau eine Revision sowie ein Event", async () => {
    const setup = await roster();
    const holder = setup.players[0]!;
    await store.updateGigalodonInventory(setup.captain.actor, {
      participantId: holder.participant.id,
      resources: { uniteMureine: 1, rancuneExecrabe: 1, noirceurWillorque: 1 },
      currentFloor: 0,
      risk: "HIGH"
    });
    await store.depositGigalodonInventory(setup.captain.actor, holder.participant.id);
    await forceTaskActive(setup.created.session.id, "GF-030");
    await store.confirmGigalodonFinalReadiness(setup.captain.actor, {
      activeFights: 2,
      activeFightsRuleSourceStatus: "LIVE_REQUIRED",
      finalTeamReady: true,
      captainConfirmed: true
    });
    await store.startGigalodonFinal(setup.captain.actor, 180);
    const before = await store.getSnapshot(setup.created.session.id);
    await store.updateGigalodonFinal(holder.actor, { combatRound: 2, totalDamage: 70_000, completed: true, result: "DEFEAT" });
    const after = await store.getSnapshot(setup.created.session.id);
    expect(after.session.revision).toBe(before.session.revision + 1);
    expect(after.events.at(-1)?.type).toBe("GIGALODON_FINAL_RESULT_RECORDED");
    expect(getGigalodonState(after.session.raidState).final).toMatchObject({ result: "DEFEAT", totalDamage: 70_000, finalBonusScore: 4_000 });
    await expect(store.startGigalodonFinal(setup.captain.actor, 180)).rejects.toMatchObject({ code: "FINAL_ALREADY_COMPLETED" });
    await store.finishGigalodonRaid(setup.captain.actor);
    expect((await store.getSnapshot(setup.created.session.id)).session.status).toBe("ENDED");
  });

  test("Teilnehmer melden Abweichungen, nur Captain oder Editor bestätigen PLAYER_CORRECTED mit Notiz", async () => {
    const setup = await roster();
    const reporter = setup.players[0]!;
    const report = await store.reportInformationIncorrect(reporter.actor, { reference: "GIG-LIGHT-COST-TO-LEVEL", note: "Im Client erschien ein anderer Wert." });
    await expect(store.confirmPlayerCorrection(reporter.actor, { reportId: report.id, note: "Selbstbestätigung" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(store.confirmPlayerCorrection(setup.editor.actor, { reportId: report.id, note: "Im Pilot gemeinsam reproduziert." })).resolves.toMatchObject({
      sourceStatus: "PLAYER_CORRECTED",
      correction: expect.objectContaining({ actorParticipantId: setup.editor.participant.id, note: "Im Pilot gemeinsam reproduziert." })
    });
    expect((await store.assertEventInvariant(setup.created.session.id)).valid).toBe(true);
  });

  test("initialisiert jede neu freigeschaltete tiefere Etage mit Licht 1 und Serverzeit", async () => {
    const setup = await roster();
    await db.query(`UPDATE task_instances SET status='COMPLETED',completed_at=now(),revision=revision+1,updated_at=now() WHERE session_id=$1 AND definition_id='G1-040'`, [setup.created.session.id]);
    const before = Date.now();
    await store.setGigalodonFragment(setup.captain.actor, "first", true);
    const state = getGigalodonState((await store.getSnapshot(setup.created.session.id)).session.raidState);
    const floor2 = state.lightStates.find((light) => light.floor === -2)!;
    expect(floor2).toMatchObject({ level: 1, baselineLevel: 1, baselineSourceStatus: "GUIDE_CONFIRMED", intervalSeconds: 120 });
    expect(Date.parse(floor2.observedAt)).toBeGreaterThanOrEqual(before);
    expect(Date.parse(floor2.nextDecayAt) - Date.parse(floor2.observedAt)).toBe(120_000);
  });

  test("migriert alte persönliche Salzbestände einmalig in den globalen Pool ohne Revisionsbruch", async () => {
    const setup = await roster();
    const definition = structuredClone(getDefinition("gouffre-gigalodon"));
    definition.definitionVersion = "0.2.0";
    await db.query(
      `INSERT INTO raid_definitions(id,definition_version,game_version,slug,payload) VALUES ($1,$2,$3,$4,$5::jsonb)`,
      [definition.id, definition.definitionVersion, definition.gameVersion, definition.slug, JSON.stringify(definition)]
    );
    const snapshot = await store.getSnapshot(setup.created.session.id);
    const legacy = structuredClone(snapshot.session.raidState);
    const gigalodon = legacy.gigalodon as Record<string, unknown>;
    delete gigalodon.saltPool;
    gigalodon.participantInventories = [
      { participantId: setup.players[0]!.participant.id, resources: { salt: 7, quartz: 2 }, currentFloor: -1, risk: "LOW", lastConfirmedAt: new Date().toISOString(), updatedBy: setup.players[0]!.participant.id },
      { participantId: setup.players[1]!.participant.id, resources: { salt: 5, onyx: 1 }, currentFloor: -1, risk: "LOW", lastConfirmedAt: new Date().toISOString(), updatedBy: setup.players[1]!.participant.id }
    ];
    await db.query(`UPDATE raid_sessions SET definition_version='0.2.0',raid_state=$2::jsonb WHERE id=$1`, [setup.created.session.id, JSON.stringify(legacy)]);
    const before = await store.getSession(setup.created.session.id);
    const migration = await store.migratePhase861Data();
    const after = await store.getSnapshot(setup.created.session.id);
    const state = getGigalodonState(after.session.raidState);
    expect(migration).toEqual({ migratedSessions: 1, aggregatedSalt: 12 });
    expect(after.session.definitionVersion).toBe("0.2.1");
    expect(after.session.revision).toBe(before.revision + 1);
    expect(state.saltPool.amount).toBe(12);
    expect(state.participantInventories.every((inventory) => !("salt" in inventory.resources))).toBe(true);
    expect(after.events.at(-1)?.type).toBe("PHASE_8_6_1_DATA_MIGRATED");
    expect((await store.assertEventInvariant(setup.created.session.id)).valid).toBe(true);
    expect(await store.migratePhase861Data()).toEqual({ migratedSessions: 0, aggregatedSalt: 0 });
  });
});
