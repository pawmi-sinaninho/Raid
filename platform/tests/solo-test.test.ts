import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { createDatabase, migrateDatabase, type Database } from "@/src/server/db/database";
import { PlatformStore } from "@/src/server/platform-store";
import { assertSoloTestEnabled, isSoloTestEnabled, startSoloTest } from "@/src/server/solo-test";

let db: Database;
let store: PlatformStore;
const previousSoloTestFlag = process.env.NEXT_PUBLIC_ENABLE_SOLO_TEST;

beforeEach(async () => {
  process.env.RAIDWEAVE_DB_MODE = "pglite";
  process.env.RAIDWEAVE_PGLITE_PATH = "memory://";
  process.env.RAIDWEAVE_TOKEN_PEPPER = "solo-test-pepper";
  process.env.NEXT_PUBLIC_ENABLE_SOLO_TEST = "true";
  db = await createDatabase();
  await migrateDatabase(db);
  store = new PlatformStore(db);
  await store.registerBundledDefinitions();
});

afterEach(async () => {
  if (previousSoloTestFlag === undefined) delete process.env.NEXT_PUBLIC_ENABLE_SOLO_TEST;
  else process.env.NEXT_PUBLIC_ENABLE_SOLO_TEST = previousSoloTestFlag;
  await db.close();
});

describe("Solo-Testmodus", () => {
  test("ist ohne Flag sowie in Production hart deaktiviert", () => {
    expect(isSoloTestEnabled({ NODE_ENV: "development" })).toBe(false);
    expect(isSoloTestEnabled({ NODE_ENV: "development", NEXT_PUBLIC_ENABLE_SOLO_TEST: "true" })).toBe(true);
    expect(isSoloTestEnabled({ NODE_ENV: "production", NEXT_PUBLIC_ENABLE_SOLO_TEST: "true" })).toBe(false);
    expect(() => assertSoloTestEnabled({ NODE_ENV: "production", NEXT_PUBLIC_ENABLE_SOLO_TEST: "true" }))
      .toThrowError(expect.objectContaining({ code: "SOLO_TEST_DISABLED", status: 404 }));
  });

  test("erzeugt den Mindest-Roster, verteilt Teams, setzt Ready und nutzt den normalen Start", async () => {
    const created = await store.createSession({
      definitionId: "sanctuaire-jardins-eternels",
      name: "Solo Integration Raid",
      language: "fr"
    });
    const joined = await store.joinByInvite(created.invites.CAPTAIN.token, "Captain");
    const captain = await store.authenticateRecovery(joined.sessionId, joined.participant.id, joined.recoveryToken);

    const result = await startSoloTest(store, captain);
    const snapshot = await store.getSnapshot(created.session.id);
    const synthetic = snapshot.participants.filter((participant) => /^Test \d{2,}$/.test(participant.displayName));

    expect(result).toMatchObject({ syntheticParticipantsCreated: 7, participantCount: 8, teamCount: 4 });
    expect(snapshot.session.status).toBe("LIVE");
    expect(snapshot.session.timerStartedAt).not.toBeNull();
    expect(synthetic.map((participant) => participant.displayName)).toEqual([
      "Test 01", "Test 02", "Test 03", "Test 04", "Test 05", "Test 06", "Test 07"
    ]);
    expect(synthetic.some((participant) => participant.role === "EDITOR")).toBe(true);
    expect(snapshot.participants
      .filter((participant) => participant.role !== "SPECTATOR")
      .every((participant) => participant.readyState === "READY" && participant.teamId !== null))
      .toBe(true);
    expect((await store.assertEventInvariant(created.session.id)).valid).toBe(true);
  });
});
