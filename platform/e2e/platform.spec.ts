import { expect, test, type APIRequestContext } from "@playwright/test";

interface Identity {
  participant: { id: string; role: string };
  recoveryToken: string;
  sessionId: string;
}

async function apiPost(api: APIRequestContext, url: string, options: Parameters<APIRequestContext["post"]>[1]) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await api.post(url, options);
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 150 * (attempt + 1)));
    }
  }
  throw lastError;
}

async function createSession(api: APIRequestContext, definitionId = "sanctuaire-jardins-eternels") {
  const response = await apiPost(api, "/api/sessions", { data: { definitionId, name: `E2E ${Date.now()}`, language: "fr" } });
  expect(response.ok).toBeTruthy();
  return response.json() as Promise<{
    session: { id: string };
    invites: Record<string, { token: string; urlPath: string }>;
  }>;
}

async function join(api: APIRequestContext, token: string, name: string): Promise<Identity> {
  const response = await apiPost(api, "/api/join", { data: { inviteToken: token, displayName: name } });
  expect(response.ok).toBeTruthy();
  return response.json();
}

function headers(identity: Identity) {
  return {
    "x-participant-id": identity.participant.id,
    "x-recovery-token": identity.recoveryToken
  };
}

async function command(api: APIRequestContext, identity: Identity, data: Record<string, unknown>) {
  const response = await apiPost(api, `/api/sessions/${identity.sessionId}/commands`, { headers: headers(identity), data });
  const text = await response.text();
  expect(response.ok, text).toBeTruthy();
  return JSON.parse(text) as { result: Record<string, unknown> };
}

async function seedLive(api: APIRequestContext) {
  const created = await createSession(api);
  const captain = await join(api, created.invites.CAPTAIN.token, `Captain ${Date.now()}`);
  const editor = await join(api, created.invites.EDITOR.token, `Editor ${Date.now()}`);
  const participants: Identity[] = [];
  for (let index = 1; index <= 6; index++) {
    participants.push(await join(api, created.invites.PARTICIPANT.token, `P${index}-${Date.now()}`));
  }
  const teamResponse = await command(api, captain, { type: "CREATE_TEAM", name: "Monochrome" });
  const teamId = teamResponse.result.id as string;
  for (const identity of [captain, editor, ...participants]) {
    await command(api, captain, { type: "SET_READY", participantId: identity.participant.id, ready: true });
  }
  await command(api, captain, { type: "ASSIGN_PARTICIPANT_TEAM", participantId: participants[0]!.participant.id, teamId });
  await command(api, captain, { type: "START_SESSION" });
  return { sessionId: created.session.id, captain, participant: participants[0]! };
}


async function seedGigalodonLive(api: APIRequestContext) {
  const created = await createSession(api, "gouffre-gigalodon");
  const captain = await join(api, created.invites.CAPTAIN.token, `Giga Captain ${Date.now()}`);
  const editor = await join(api, created.invites.EDITOR.token, `Giga Editor ${Date.now()}`);
  const participants: Identity[] = [];
  for (let index = 1; index <= 6; index++) participants.push(await join(api, created.invites.PARTICIPANT.token, `G${index}-${Date.now()}`));
  for (const identity of [captain, editor, ...participants]) await command(api, captain, { type: "SET_READY", participantId: identity.participant.id, ready: true });
  await command(api, captain, { type: "START_SESSION" });
  await command(api, captain, { type: "ADJUST_GIGALODON_SALT", delta: 24, cause: "Collecte E2E", responsibleParticipantId: participants[0]!.participant.id });
  await command(api, captain, { type: "SET_GIGALODON_LIGHT", floor: -1, level: 2, intervalSeconds: 120, intervalSourceStatus: "GUIDE_CONFIRMED", saltCostSourceStatus: "GUIDE_CONFIRMED", responsibleParticipantId: participants[0]!.participant.id });
  await command(api, participants[0]!, { type: "UPDATE_GIGALODON_INVENTORY", participantId: participants[0]!.participant.id, resources: { quartz: 12, onyx: 2 }, currentFloor: -1, risk: "MEDIUM" });
  return { sessionId: created.session.id, captain, participant: participants[0]!, participants };
}

async function seedGigalodonFinal(api: APIRequestContext, result: "VICTORY" | "DEFEAT") {
  const seeded = await seedGigalodonLive(api);
  const holder = seeded.participants[0]!;
  await command(api, seeded.captain, { type: "UPDATE_GIGALODON_INVENTORY", participantId: holder.participant.id, resources: { uniteMureine: 1, rancuneExecrabe: 1, noirceurWillorque: 1 }, currentFloor: 0, risk: "HIGH" });
  await command(api, seeded.captain, { type: "DEPOSIT_GIGALODON_INVENTORY", participantId: holder.participant.id });
  await command(api, seeded.captain, { type: "CONFIRM_GIGALODON_FINAL_READINESS", activeFights: 1, activeFightsRuleSourceStatus: "LIVE_REQUIRED", finalTeamReady: true, captainConfirmed: true });
  await command(api, seeded.captain, { type: "START_GIGALODON_FINAL", preparationSeconds: 180 });
  await command(api, holder, { type: "UPDATE_GIGALODON_FINAL", combatRound: result === "VICTORY" ? 3 : 2, totalDamage: result === "VICTORY" ? 300_000 : 70_000, completed: true, result });
  return seeded;
}

test("session creation and anonymous captain join work through the product UI", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Le raid ne se gagne pas/ })).toBeVisible();
  const createButton = page.getByRole("button", { name: "Créer la session" });
  await expect(createButton).toBeEnabled();
  await page.getByLabel("Nom de session").fill(`UI Raid ${Date.now()}`);
  await createButton.click({ force: true, noWaitAfter: true });
  await expect(page.getByTestId("created-session")).toBeVisible();
  await page.getByTestId("join-captain").click({ force: true });
  await expect(page.getByTestId("join-form")).toBeVisible();
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Nom affiché").fill(`Captain UI ${Date.now()}`);
  await Promise.all([
    page.waitForURL(/\/session\//, { timeout: 60_000 }),
    page.getByRole("button", { name: "Rejoindre le raid" }).click({ force: true })
  ]);
  await expect(page.getByTestId("lobby")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId("ready-button")).toBeVisible();
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  if (dimensions.scrollWidth > dimensions.clientWidth + 1) {
    const offenders = await page.locator("body *").evaluateAll((elements) => elements
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return { tag: element.tagName, className: element.className, testId: element.getAttribute("data-testid"), left: rect.left, right: rect.right, width: rect.width, scrollWidth: (element as HTMLElement).scrollWidth };
      })
      .filter((item) => item.right > document.documentElement.clientWidth + 1 || item.left < -1 || item.scrollWidth > item.width + 1)
      .sort((a, b) => Math.max(b.right, b.scrollWidth) - Math.max(a.right, a.scrollWidth))
      .slice(0, 20));
    console.log("OVERFLOW", JSON.stringify(offenders, null, 2));
  }
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
});

test("390px participant mission and 1440px captain command center are usable", async ({ page, request }, testInfo) => {
  const seeded = await seedLive(request);
  const mobile = testInfo.project.name === "mobile-390";
  const identity = mobile ? seeded.participant : seeded.captain;
  await page.addInitScript(({ sessionId, identity }) => {
    localStorage.setItem(`raidweave:${sessionId}`, JSON.stringify({
      participantId: identity.participant.id,
      recoveryToken: identity.recoveryToken
    }));
  }, { sessionId: seeded.sessionId, identity });
  await page.goto(`/session/${seeded.sessionId}`);
  if (mobile) {
    await expect(page.getByTestId("mission-view")).toBeVisible();
    await expect(page.getByText(/Maintenant/)).toBeVisible();
    await expect(page.locator(".bottom-nav")).toBeVisible();
    await expect(page.locator('.bottom-nav button', { hasText: "Mission" })).toHaveClass(/active/);
    await page.getByRole("button", { name: "Raid" }).click();
    await expect(page.getByTestId("participant-raid-view")).toBeVisible();
    await page.getByRole("button", { name: "Mission" }).click();
    await expect(page.getByTestId("mission-view")).toBeVisible();
    await page.screenshot({ path: "artifacts/phase7-screens/sanctuaire-participant-390x844.png", fullPage: true });
  } else {
    await expect(page.getByTestId("captain-command-center")).toBeVisible();
    await expect(page.getByTestId("sanctuaire-command-center")).toBeVisible();
    await expect(page.getByTestId("captain-radar")).toBeVisible();
    await expect(page.getByTestId("corridor-dispatcher")).toBeVisible();
    await expect(page.getByTestId("corridor-dispatcher")).toContainText("0 / 60");
    await expect(page.getByTestId("corridor-dispatcher")).toContainText("Guide confirmé");
    await expect(page.getByTestId("final-boss-split")).toBeVisible();
    await expect(page.locator(".puzzle-quartet .sanctuaire-module")).toHaveCount(4);
    await page.locator(".life-adjust summary").click();
    await page.getByLabel("Cause de la modification des vies").fill("E2E correction");
    await page.getByRole("button", { name: "−1 vie" }).click();
    await expect(page.locator(".life-seal strong")).toHaveText("19/20");
    await page.screenshot({ path: "artifacts/phase7-screens/sanctuaire-captain-1440x900.png", fullPage: true });
  }
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
});


test("Gigalodon participant mobile and captain desktop expose the Phase 8 instruments", async ({ page, request }, testInfo) => {
  const seeded = await seedGigalodonLive(request);
  const mobile = testInfo.project.name === "mobile-390";
  const identity = mobile ? seeded.participant : seeded.captain;
  await page.addInitScript(({ sessionId, identity }) => {
    localStorage.setItem(`raidweave:${sessionId}`, JSON.stringify({ participantId: identity.participant.id, recoveryToken: identity.recoveryToken }));
  }, { sessionId: seeded.sessionId, identity });
  await page.goto(`/session/${seeded.sessionId}`);
  if (mobile) {
    await expect(page.getByTestId("mission-view")).toBeVisible();
    await expect(page.getByTestId("gigalodon-participant-inventory")).toBeVisible();
    await expect(page.getByText("MON INVENTAIRE")).toBeVisible();
    await expect(page.getByTestId("participant-shared-salt")).toContainText("24");
    await expect(page.locator('.inventory-inputs label', { hasText: /^salt$/i })).toHaveCount(0);
    await page.getByTestId("information-correction").locator("summary").click();
    await page.getByLabel("Règle ou affichage concerné").fill("Affichage lumière");
    await page.getByLabel("Note sur l’information incorrecte").fill("Valeur différente observée pendant le pilote");
    await page.getByRole("button", { name: "Envoyer le signalement" }).click();
    await expect(page.getByText("Valeur différente observée pendant le pilote")).toBeVisible();
    await page.screenshot({ path: "artifacts/phase8-screens/gigalodon-participant-390x844.png", fullPage: true });
    await page.getByRole("button", { name: "Raid" }).click();
    await expect(page.getByTestId("participant-raid-view")).toBeVisible();
    await expect(page.getByText("Score sécurisé")).toBeVisible();
    await page.screenshot({ path: "artifacts/phase8-screens/gigalodon-participant-raid-390x844.png", fullPage: true });
  } else {
    await expect(page.getByTestId("gigalodon-command-center")).toBeVisible();
    await expect(page.getByTestId("gigalodon-floor-rail")).toBeVisible();
    await expect(page.getByTestId("floor-light-panel")).toBeVisible();
    await expect(page.getByTestId("resource-ledger")).toBeVisible();
    await expect(page.getByTestId("shared-salt-pool")).toContainText("24");
    await expect(page.getByTestId("shared-salt-pool")).toContainText("Guide confirmé");
    await expect(page.getByTestId("gigalodon-soft-warnings")).toContainText("le capitaine peut continuer");
    await expect(page.getByTestId("gigalodon-final-readiness")).toBeVisible();
    await expect(page.locator(".light-card")).toHaveCount(5);
    await page.locator(".light-bay-controls summary").click();
    await page.getByRole("button", { name: "Recharger · 16 sel" }).click();
    await expect(page.getByTestId("shared-salt-pool")).toContainText("8");
    await page.screenshot({ path: "artifacts/phase8-screens/gigalodon-captain-1440x900.png", fullPage: true });
  }
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
});

test("Phase 8.6.1 displays VICTORY and DEFEAT as separate final outcomes", async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  for (const result of ["VICTORY", "DEFEAT"] as const) {
    const seeded = await seedGigalodonFinal(request, result);
    await page.addInitScript(({ sessionId, identity }) => {
      localStorage.setItem(`raidweave:${sessionId}`, JSON.stringify({ participantId: identity.participant.id, recoveryToken: identity.recoveryToken }));
    }, { sessionId: seeded.sessionId, identity: seeded.captain });
    await page.goto(`/session/${seeded.sessionId}`);
    await expect(page.getByTestId("gigalodon-final-tracker")).toContainText(`Résultat · ${result}`);
    await expect(page.getByTestId("gigalodon-final-tracker")).toContainText("Score ressources");
    await expect(page.getByTestId("gigalodon-final-tracker")).toContainText("Bonus final");
    await expect(page.getByTestId("gigalodon-final-tracker")).toContainText("Score total");
    await expect(page.getByRole("button", { name: "Démarrer Gigalodon" })).toHaveCount(0);
  }
});
