import { mkdir, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import path from "node:path";
import { createDatabase, migrateDatabase } from "../src/server/db/database";
import { PlatformStore } from "../src/server/platform-store";

process.env.RAIDWEAVE_DB_MODE = "pglite";
process.env.RAIDWEAVE_PGLITE_PATH = "memory://";
process.env.RAIDWEAVE_TOKEN_PEPPER = "reliability-pepper";

const RUNS = 10;
const CLIENTS = 16;
const BURST = 50;

type Joined = Awaited<ReturnType<PlatformStore["joinByInvite"]>> & {
  actor: Awaited<ReturnType<PlatformStore["authenticateRecovery"]>>;
};

async function join(store: PlatformStore, token: string, name: string): Promise<Joined> {
  const joined = await store.joinByInvite(token, name);
  const actor = await store.authenticateRecovery(joined.sessionId, joined.participant.id, joined.recoveryToken);
  return { ...joined, actor };
}

async function runOnce(run: number) {
  const started = performance.now();
  const db = await createDatabase();
  try {
    await migrateDatabase(db);
    const store = new PlatformStore(db);
    await store.registerBundledDefinitions();
    const created = await store.createSession({
      definitionId: "sanctuaire-jardins-eternels",
      name: `Reliability ${run}`,
      language: "fr"
    });

    const captain = await join(store, created.invites.CAPTAIN.token, `Captain ${run}`);
    const editor = await join(store, created.invites.EDITOR.token, `Editor ${run}`);
    const participants: Joined[] = [];
    for (let index = 1; index <= CLIENTS - 2; index += 1) {
      participants.push(await join(store, created.invites.PARTICIPANT.token, `P${run}-${index}`));
    }
    const roster = [captain, editor, ...participants];
    for (const member of roster) {
      await store.setReady(member.actor, member.participant.id, true);
    }
    const readyCheck = await store.getReadyCheck(created.session.id);
    if (!readyCheck.canStart || readyCheck.participantCount !== CLIENTS) throw new Error("Ready-check failed");
    await store.startSession(captain.actor);

    let snapshot = await store.getSnapshot(created.session.id);
    const claimTarget = snapshot.tasks.find((task) => task.status === "READY");
    if (!claimTarget) throw new Error("No claim target");
    const claimStarted = performance.now();
    const claimResults = await Promise.allSettled([
      store.claimTask(participants[0]!.actor, claimTarget.id, claimTarget.revision),
      store.claimTask(participants[1]!.actor, claimTarget.id, claimTarget.revision)
    ]);
    const claimDurationMs = performance.now() - claimStarted;
    const claimWinners = claimResults.filter((result) => result.status === "fulfilled").length;
    const claimConflicts = claimResults.filter((result) => result.status === "rejected").length;
    if (claimWinners !== 1 || claimConflicts !== 1) throw new Error("Claim race invariant failed");

    snapshot = await store.getSnapshot(created.session.id);
    const counterTarget = snapshot.tasks.find((task) => task.id !== claimTarget.id && task.status === "READY") ?? snapshot.tasks[0]!;
    const burstStarted = performance.now();
    await Promise.all(Array.from({ length: BURST }, () =>
      store.incrementTaskCounter(captain.actor, { taskId: counterTarget.id, key: "reliability", delta: 1 })
    ));
    const burstDurationMs = performance.now() - burstStarted;

    const cursor = (await store.getSession(created.session.id)).revision;
    await store.createTeam(captain.actor, `Reconnect ${run}`);
    const cursorEvents = await store.getEventsSince(created.session.id, cursor);
    const recovered = await store.authenticateRecovery(
      created.session.id,
      participants[0]!.participant.id,
      participants[0]!.recoveryToken
    );

    snapshot = await store.getSnapshot(created.session.id, cursor);
    const counter = snapshot.tasks.find((task) => task.id === counterTarget.id)?.resultData.reliability;
    const invariant = await store.assertEventInvariant(created.session.id);
    const outboxFirst = await store.claimOutbox(10_000);
    const outboxSecond = await store.claimOutbox(10_000);
    for (const row of outboxFirst) await store.markOutboxPublished(row.id);

    if (counter !== BURST) throw new Error(`Counter mismatch: ${String(counter)}`);
    if (!invariant.valid) throw new Error("Event invariant failed");
    if (cursorEvents.length !== 1 || cursorEvents[0]?.type !== "TEAM_CREATED") throw new Error("Cursor recovery failed");
    if (recovered.participantId !== participants[0]!.participant.id) throw new Error("Identity recovery failed");
    if (outboxSecond.length !== 0) throw new Error("Outbox claim was not exclusive");

    return {
      run,
      passed: true,
      clients: roster.length,
      burstUpdates: BURST,
      burstDurationMs: Math.round(burstDurationMs * 100) / 100,
      claimDurationMs: Math.round(claimDurationMs * 100) / 100,
      claimWinners,
      claimConflicts,
      counter,
      revision: invariant.revision,
      eventCount: invariant.eventCount,
      cursorEvents: cursorEvents.length,
      outboxEvents: outboxFirst.length,
      durationMs: Math.round((performance.now() - started) * 100) / 100
    };
  } finally {
    await db.close();
  }
}

async function main() {
  const results = [];
  let failure: unknown;
  for (let run = 1; run <= RUNS; run += 1) {
    try {
      const result = await runOnce(run);
      results.push(result);
      console.log(`run ${run}/${RUNS}: PASS · ${result.durationMs} ms`);
    } catch (error) {
      failure = error;
      results.push({ run, passed: false, error: error instanceof Error ? error.message : String(error) });
      console.error(`run ${run}/${RUNS}: FAIL`, error);
      break;
    }
  }

  const passed = !failure && results.length === RUNS && results.every((result) => result.passed);
  const passedRuns = results.filter((result) => result.passed && "durationMs" in result) as Array<{
    durationMs: number; burstDurationMs: number; claimDurationMs: number;
  }>;
  const summary = {
    projectVersion: "v0.8.6.1",
    generatedAt: new Date().toISOString(),
    environment: "PGlite PostgreSQL engine, local process",
    requestedRuns: RUNS,
    completedRuns: results.length,
    passed,
    clientsPerRun: CLIENTS,
    burstUpdatesPerRun: BURST,
    totals: {
      clients: passedRuns.length * CLIENTS,
      burstUpdates: passedRuns.length * BURST
    },
    metrics: passedRuns.length ? {
      averageRunDurationMs: Math.round((passedRuns.reduce((sum, item) => sum + item.durationMs, 0) / passedRuns.length) * 100) / 100,
      averageBurstDurationMs: Math.round((passedRuns.reduce((sum, item) => sum + item.burstDurationMs, 0) / passedRuns.length) * 100) / 100,
      maximumBurstDurationMs: Math.max(...passedRuns.map((item) => item.burstDurationMs)),
      maximumClaimDurationMs: Math.max(...passedRuns.map((item) => item.claimDurationMs))
    } : null,
    runs: results
  };

  const artifacts = path.join(process.cwd(), "artifacts");
  await mkdir(artifacts, { recursive: true });
  await writeFile(path.join(artifacts, "platform-reliability.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  if (!passed) process.exitCode = 1;
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
