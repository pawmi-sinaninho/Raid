import { describe, expect, test } from "vitest";
import { getDefinition } from "@/src/core/definition-loader";
import {
  calculateDamageBonus,
  calculateFragmentChance,
  calculateLightRefillCost,
  calculateResourceScore,
  effectiveLightLevel,
  finalReadinessSummary,
  getGigalodonState
} from "@/src/core/gigalodon";

describe("Gigalodon domain", () => {
  const definition = getDefinition("gouffre-gigalodon");

  test("berechnet Ressourcen- und Schadensscore aus versionierten Lookups", () => {
    expect(calculateResourceScore(definition, { quartz: 10, onyx: 2, uniteMureine: 1 })).toBe(1080);
    expect(calculateResourceScore(definition, { salt: 999 } as never)).toBe(0);
    expect(calculateDamageBonus(definition, 9_999)).toBe(0);
    expect(calculateDamageBonus(definition, 100_000)).toBe(5_000);
    expect(calculateDamageBonus(definition, 999_999)).toBe(14_000);
    expect(calculateDamageBonus(definition, 1_000_000)).toBe(15_000);
  });

  test("hält Fragmentgrenzen explizit an der Definition", () => {
    expect(calculateFragmentChance(definition, 4_999)).toBe(1);
    expect(calculateFragmentChance(definition, 5_000)).toBe(5);
    expect(calculateFragmentChance(definition, 7_000)).toBe(10);
    expect(calculateFragmentChance(definition, 10_000)).toBe(20);
  });

  test("leitet Licht nur aus Beobachtungszeit und konfigurierbarem Intervall ab", () => {
    const observedAt = "2026-06-27T10:00:00.000Z";
    const light = {
      floor: -1,
      level: 4,
      baselineLevel: 4,
      baselineSourceStatus: "GUIDE_CONFIRMED" as const,
      observedAt,
      nextDecayAt: "2026-06-27T10:02:00.000Z",
      responsibleParticipantId: null,
      intervalSeconds: 120,
      intervalSourceStatus: "GUIDE_CONFIRMED" as const,
      saltCostSourceStatus: "GUIDE_CONFIRMED" as const,
      updatedBy: "actor"
    };
    expect(effectiveLightLevel(light, Date.parse("2026-06-27T10:01:59.000Z"))).toBe(4);
    expect(effectiveLightLevel(light, Date.parse("2026-06-27T10:02:00.000Z"))).toBe(3);
    expect(effectiveLightLevel(light, Date.parse("2026-06-27T10:08:00.000Z"))).toBe(0);
  });

  test("berechnet kumulative Salzkosten aus der versionierten Guide-Baseline", () => {
    expect(calculateLightRefillCost(definition, 0, 1)).toBe(1);
    expect(calculateLightRefillCost(definition, 0, 4)).toBe(20);
    expect(calculateLightRefillCost(definition, 1, 4)).toBe(19);
    expect(calculateLightRefillCost(definition, 3, 4)).toBe(10);
  });

  test("trennt harte Finalblockaden von unbestätigten aktiven Kämpfen", () => {
    const state = getGigalodonState({ gigalodon: {
      bossUniqueDrops: {
        mureine: { holderParticipantId: "a", banked: true },
        execrabe: { holderParticipantId: "b", banked: true },
        willorque: { holderParticipantId: "c", banked: true }
      },
      finalReadiness: {
        timerAboveSafetyThreshold: true,
        mureineResourceBanked: true,
        execrabeResourceBanked: true,
        willorqueResourceBanked: true,
        criticalUnbankedScore: 0,
        activeFights: 1,
        activeFightsRuleSourceStatus: "LIVE_REQUIRED",
        finalTeamReady: true,
        captainConfirmed: true,
        staleInventoryParticipantIds: []
      }
    }});
    const summary = finalReadinessSummary(state);
    expect(summary.blocked).toHaveLength(0);
    expect(summary.unconfirmed).toEqual(["D’autres combats pourraient empêcher le départ du Gigalodon · vérifier en jeu (1)"]);
  });
});
