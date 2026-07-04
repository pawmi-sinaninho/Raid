import { createDatabase, migrateDatabase, type Database } from "./db/database";
import { PlatformStore } from "./platform-store";
import { OutboxDispatcher } from "./realtime/outbox-dispatcher";

export interface PlatformRuntime {
  db: Database;
  store: PlatformStore;
  outbox: OutboxDispatcher;
}

declare global {
  // eslint-disable-next-line no-var
  var __raidweaveRuntime: Promise<PlatformRuntime> | undefined;
}

async function initializeRuntime(): Promise<PlatformRuntime> {
  const db = await createDatabase();
  await migrateDatabase(db);
  const store = new PlatformStore(db);
  await store.registerBundledDefinitions();
  await store.migratePhase861Data();
  const outbox = new OutboxDispatcher(db, store);
  outbox.start();
  return { db, store, outbox };
}

export function getRuntime(): Promise<PlatformRuntime> {
  globalThis.__raidweaveRuntime ??= initializeRuntime();
  return globalThis.__raidweaveRuntime;
}

export async function resetRuntimeForTests(): Promise<void> {
  if (!globalThis.__raidweaveRuntime) return;
  const runtime = await globalThis.__raidweaveRuntime;
  runtime.outbox.stop();
  await runtime.db.close();
  globalThis.__raidweaveRuntime = undefined;
}
