import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { createDatabase, migrateDatabase, type Database } from "@/src/server/db/database";
import { PlatformStore } from "@/src/server/platform-store";
import { hashSecret } from "@/src/server/security";
import { DomainError } from "@/src/server/errors";
import type { ActorContext, Role } from "@/src/core/types";

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

afterEach(async () => {
  await db.close();
});

async function createSession() {
  return store.createSession({
    definitionId: "sanctuaire-jardins-eternels",
    name: "Integration Raid",
    language: "fr"
  });
}

async function join(token: string, name: string) {
  const joined = await store.joinByInvite(token, name);
  const actor = await store.authenticateRecovery(joined.sessionId, joined.participant.id, joined.recoveryToken);
  return { ...joined, actor };
}

async function joinRoster(invites: Awaited<ReturnType<typeof createSession>>["invites"]) {
  const captain = await join(invites.CAPTAIN.token, "Captain");
  const editor = await join(invites.EDITOR.token, "Editor");
  const participants = [];
  for (let index = 1; index <= 14; index++) {
    participants.push(await join(invites.PARTICIPANT.token, `Player ${index}`));
  }
  return { captain, editor, participants };
}

async function forceTaskActive(sessionId: string, definitionId: string) {
  await db.query(
    `UPDATE task_instances SET status='ACTIVE',started_at=now(),revision=revision+1,updated_at=now()
     WHERE session_id=$1 AND definition_id=$2`,
    [sessionId, definitionId]
  );
  return (await store.getSnapshot(sessionId)).tasks.find((task) => task.definitionId === definitionId)!;
}

describe("PlatformStore PostgreSQL contract via PGlite", () => {
  test("erstellt Session, Tasks, getrennte Invites und speichert keine Klartextsecrets", async () => {
    const created = await createSession();
    expect(created.session.revision).toBe(1);
    expect(Object.keys(created.invites).sort()).toEqual(["CAPTAIN", "EDITOR", "PARTICIPANT", "SPECTATOR"]);
    const tasks = await db.query<{ count: string }>("SELECT count(*)::text AS count FROM task_instances WHERE session_id=$1", [created.session.id]);
    expect(Number(tasks.rows[0]?.count)).toBeGreaterThan(40);
    const invite = await db.query<{ token_hash: string }>("SELECT token_hash FROM invite_tokens WHERE session_id=$1 AND role='CAPTAIN'", [created.session.id]);
    expect(invite.rows[0]?.token_hash).toBe(hashSecret(created.invites.CAPTAIN.token));
    expect(invite.rows[0]?.token_hash).not.toContain(created.invites.CAPTAIN.token);
  });

  test("nimmt 16 Raidrollen auf, erfüllt Ready-Check und startet serverautoritativen Timer", async () => {
    const created = await createSession();
    const roster = await joinRoster(created.invites);
    const all = [roster.captain, roster.editor, ...roster.participants];
    expect(all).toHaveLength(16);
    for (const member of all) {
      await store.setReady(member.actor, member.participant.id, true);
    }
    const check = await store.getReadyCheck(created.session.id);
    expect(check).toMatchObject({ canStart: true, participantCount: 16, hasEditor: true });
    await store.startSession(roster.captain.actor);
    const snapshot = await store.getSnapshot(created.session.id);
    expect(snapshot.session.status).toBe("LIVE");
    expect(snapshot.session.timerStartedAt).not.toBeNull();
    expect((await store.assertEventInvariant(created.session.id)).valid).toBe(true);
  });

  test("entscheidet ein exklusives Claim-Race genau einmal", async () => {
    const created = await createSession();
    const captain = await join(created.invites.CAPTAIN.token, "Captain");
    const one = await join(created.invites.PARTICIPANT.token, "One");
    const two = await join(created.invites.PARTICIPANT.token, "Two");
    const ready = (await store.getSnapshot(created.session.id)).tasks.find((task) => task.status === "READY")!;
    const results = await Promise.allSettled([
      store.claimTask(one.actor, ready.id, ready.revision),
      store.claimTask(two.actor, ready.id, ready.revision)
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find((result) => result.status === "rejected") as PromiseRejectedResult;
    expect(rejected.reason).toBeInstanceOf(DomainError);
    expect((rejected.reason as DomainError).code).toBe("REVISION_CONFLICT");
    const after = (await store.getSnapshot(created.session.id)).tasks.find((task) => task.id === ready.id)!;
    expect([one.participant.id, two.participant.id]).toContain(after.ownerParticipantId);
    expect(after.status).toBe("CLAIMED");
    expect(captain.actor.role).toBe("CAPTAIN");
  });

  test("schliesst den Systemstart ab und schaltet Folgeaufgaben im selben Domainevent frei", async () => {
    const created = await createSession();
    const roster = await joinRoster(created.invites);
    const all = [roster.captain, roster.editor, ...roster.participants];
    for (const member of all) await store.setReady(roster.captain.actor, member.participant.id, true);
    expect((await store.getSnapshot(created.session.id)).tasks.find((task) => task.definitionId === "S0-010")?.status).toBe("LOCKED");
    await store.startSession(roster.captain.actor);
    const snapshot = await store.getSnapshot(created.session.id);
    expect(snapshot.tasks.find((task) => task.definitionId === "S0-001")?.status).toBe("COMPLETED");
    expect(snapshot.tasks.find((task) => task.definitionId === "S0-010")?.status).toBe("READY");
    const last = snapshot.events.at(-1)!;
    expect(last.type).toBe("SESSION_STARTED");
    expect((last.after as { unlockedDefinitionIds: string[] }).unlockedDefinitionIds).toContain("S0-010");
    expect((await store.assertEventInvariant(created.session.id)).valid).toBe(true);
  });

  test("inkrementiert Zähler atomar ohne Lost Update", async () => {
    const created = await createSession();
    const captain = await join(created.invites.CAPTAIN.token, "Captain");
    const task = (await store.getSnapshot(created.session.id)).tasks.find((item) => item.status === "READY")!;
    await Promise.all(Array.from({ length: 50 }, () => store.incrementTaskCounter(captain.actor, { taskId: task.id, key: "progress", delta: 1 })));
    const after = (await store.getSnapshot(created.session.id)).tasks.find((item) => item.id === task.id)!;
    expect(after.resultData.progress).toBe(50);
    expect((await store.assertEventInvariant(created.session.id)).valid).toBe(true);
  });

  test("erzwingt Editor-Scope und widerruft rotierte Links", async () => {
    const created = await createSession();
    const captain = await join(created.invites.CAPTAIN.token, "Captain");
    const teamA = await store.createTeam(captain.actor, "A");
    const teamB = await store.createTeam(captain.actor, "B");
    const scoped = await store.rotateInvite(captain.actor, "EDITOR", { teamIds: [teamA.id] });
    const editor = await join(scoped.token, "Scoped Editor");
    const target = await join(created.invites.PARTICIPANT.token, "Target");
    await expect(store.assignParticipantToTeam(editor.actor, target.participant.id, teamB.id)).rejects.toMatchObject({ code: "EDITOR_SCOPE_VIOLATION" });
    await store.assignParticipantToTeam(editor.actor, target.participant.id, teamA.id);

    const rotated = await store.rotateInvite(captain.actor, "PARTICIPANT", {});
    await expect(store.joinByInvite(created.invites.PARTICIPANT.token, "Old Link")).rejects.toMatchObject({ code: "INVITE_REVOKED" });
    const newJoin = await store.joinByInvite(rotated.token, "New Link");
    expect(newJoin.participant.role).toBe("PARTICIPANT");
  });

  test("liefert Reconnect-Cursor und Snapshot konsistent", async () => {
    const created = await createSession();
    const captain = await join(created.invites.CAPTAIN.token, "Captain");
    const cursor = (await store.getSession(created.session.id)).revision;
    await store.createTeam(captain.actor, "Cursor Team");
    const events = await store.getEventsSince(created.session.id, cursor);
    expect(events).toHaveLength(1);
    expect(events[0]?.type).toBe("TEAM_CREATED");
    expect(events[0]?.sessionRevision).toBe(cursor + 1);
    const saved = await store.saveSnapshot(created.session.id);
    expect(saved).toBe(cursor + 1);
  });

  test("erzwingt Zweitbestätigung und überträgt bestätigte Monochrome-Daten zum Wächter", async () => {
    const created = await createSession();
    const captain = await join(created.invites.CAPTAIN.token, "Captain");
    const editor = await join(created.invites.EDITOR.token, "Editor");
    const active = await forceTaskActive(created.session.id, "S1-OUV-040");
    const submitted = await store.submitTaskResult(captain.actor, {
      taskId: active.id, expectedRevision: active.revision,
      resultData: { "sanctuaire.monochromeColor": "AZURE_BLEU" }
    });
    expect(submitted.status).toBe("WAITING");
    await expect(store.confirmTaskResult(captain.actor, { taskId: submitted.id, expectedRevision: submitted.revision })).rejects.toMatchObject({ code: "SECOND_PERSON_REQUIRED" });
    const confirmed = await store.confirmTaskResult(editor.actor, { taskId: submitted.id, expectedRevision: submitted.revision });
    expect(confirmed.status).toBe("COMPLETED");
    const snapshot = await store.getSnapshot(created.session.id);
    const sentinel = snapshot.tasks.find((task) => task.definitionId === "S2-SEN-010")!;
    expect(sentinel.resultData.monochromeColor).toBe("AZURE_BLEU");
    expect(sentinel.resultData.targetElement).toBe("WATER");
    expect((confirmed.resultData._confirmation as { status: string }).status).toBe("CONFIRMED");
    expect((await store.assertEventInvariant(created.session.id)).valid).toBe(true);
  });

  test("führt Raid-Leben mit Ursache und Korrekturhistorie", async () => {
    const created = await createSession();
    const captain = await join(created.invites.CAPTAIN.token, "Captain");
    await store.adjustRaidLife(captain.actor, { delta: -3, cause: "Combat perdu" });
    await store.adjustRaidLife(captain.actor, { delta: 1, cause: "Énigme réussie" });
    const snapshot = await store.getSnapshot(created.session.id);
    const state = snapshot.session.raidState.sanctuaire as { raidLife: number; raidLifeHistory: Array<{ cause: string; after: number }> };
    expect(state.raidLife).toBe(18);
    expect(state.raidLifeHistory.map((entry) => entry.cause)).toEqual(["Combat perdu", "Énigme réussie"]);
    expect(state.raidLifeHistory.at(-1)?.after).toBe(18);
    expect((await store.assertEventInvariant(created.session.id)).valid).toBe(true);
  });

  test("hält das Korridorziel konfigurierbar, speichert Zuweisungen und öffnet beide Finale", async () => {
    const created = await createSession();
    const captain = await join(created.invites.CAPTAIN.token, "Captain");
    const player = await join(created.invites.PARTICIPANT.token, "Runner");
    await store.setCorridorTarget(captain.actor, 3, false);
    await store.setCorridorAssignment(captain.actor, { participantId: player.participant.id, room: 2, slot: 1, status: "ASSIGNED" });
    await forceTaskActive(created.session.id, "S3-COR-020");
    await store.incrementCorridor(player.actor, 1);
    await store.incrementCorridor(player.actor, 2);
    const snapshot = await store.getSnapshot(created.session.id);
    const state = snapshot.session.raidState.sanctuaire as { corridorTarget: number; corridorTargetSourceStatus: string; corridorCompleted: number; corridorAssignments: unknown[] };
    expect(state).toMatchObject({ corridorTarget: 3, corridorTargetSourceStatus: "GUIDE_CONFIRMED", corridorCompleted: 3 });
    expect(state.corridorAssignments).toHaveLength(1);
    expect(snapshot.tasks.find((task) => task.definitionId === "S3-COR-040")?.status).toBe("COMPLETED");
    expect(snapshot.tasks.find((task) => task.definitionId === "S4-QUE-010")?.status).toBe("READY");
    expect(snapshot.tasks.find((task) => task.definitionId === "S4-PRI-010")?.status).toBe("READY");
    await expect(store.setCorridorTarget(captain.actor, 4, true)).rejects.toMatchObject({ code: "CORRIDOR_ALREADY_COMPLETED" });
  });

  test("beendet die Session erst nach beiden getrennten Finalboss-Siegen", async () => {
    const created = await createSession();
    const captain = await join(created.invites.CAPTAIN.token, "Captain");
    const queen = await forceTaskActive(created.session.id, "S4-QUE-050");
    await store.submitTaskResult(captain.actor, { taskId: queen.id, expectedRevision: queen.revision, resultData: {} });
    expect((await store.getSession(created.session.id)).status).not.toBe("ENDED");
    const princess = await forceTaskActive(created.session.id, "S4-PRI-050");
    await store.submitTaskResult(captain.actor, { taskId: princess.id, expectedRevision: princess.revision, resultData: {} });
    const snapshot = await store.getSnapshot(created.session.id);
    expect(snapshot.session.status).toBe("ENDED");
    expect(snapshot.tasks.find((task) => task.definitionId === "S4-ALL-900")?.status).toBe("COMPLETED");
    expect((await store.assertEventInvariant(created.session.id)).valid).toBe(true);
  });

  test("Outbox kann multi-instanzfähig exklusiv geclaimt werden", async () => {
    const created = await createSession();
    const first = await store.claimOutbox(100);
    const second = await store.claimOutbox(100);
    expect(first.length).toBeGreaterThan(0);
    expect(second).toHaveLength(0);
    for (const row of first) await store.markOutboxPublished(row.id);
    expect(await store.claimOutbox(100)).toHaveLength(0);
    expect(created.session.id).toBeTruthy();
  });
});
