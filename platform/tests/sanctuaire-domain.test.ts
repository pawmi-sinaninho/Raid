import { describe, expect, test } from "vitest";
import { getDefinition } from "@/src/core/definition-loader";
import { createInitialRaidState } from "@/src/core/raid-state";
import { collectTaskTransfers, getSanctuaireState, taskConfirmation, validateRequiredResultFields, withConfirmedConfirmation, withPendingConfirmation } from "@/src/core/sanctuaire";

describe("Sanctuaire domain contract", () => {
  const definition = getDefinition("sanctuaire-jardins-eternels");

  test("initialisiert Leben und guidebestätigtes konfigurierbares Korridorziel 60", () => {
    const state = getSanctuaireState(createInitialRaidState(definition));
    expect(state.raidLife).toBe(20);
    expect(state.raidLifeHistory).toEqual([]);
    expect(state.corridorTarget).toBe(60);
    expect(state.corridorTargetSourceStatus).toBe("GUIDE_CONFIRMED");
    expect(state.corridorCompleted).toBe(0);
  });

  test("leitet Transferziele aus dataTransfers statt aus UI-Code ab", () => {
    const transfers = collectTaskTransfers(definition, "S1-OUV-040", {
      "sanctuaire.monochromeColor": "AZURE_BLEU"
    });
    expect(transfers).toEqual(expect.arrayContaining([
      expect.objectContaining({ targetTaskDefinitionId: "S1-CLO-040", targetKey: "monochromeColor", value: "AZURE_BLEU" }),
      expect.objectContaining({ targetTaskDefinitionId: "S2-SEN-010", targetKey: "monochromeColor", value: "AZURE_BLEU" })
    ]));
  });

  test("modelliert Pending und bestätigte Zweitprüfung nachvollziehbar", () => {
    const pending = withPendingConfirmation({ color: "AZURE" }, "SECOND_PERSON", "actor-a", "2026-06-27T00:00:00.000Z");
    expect(taskConfirmation(pending)).toMatchObject({ status: "PENDING", submittedBy: "actor-a", policy: "SECOND_PERSON" });
    const confirmed = withConfirmedConfirmation(pending, "actor-b", "2026-06-27T00:01:00.000Z");
    expect(taskConfirmation(confirmed)).toMatchObject({ status: "CONFIRMED", submittedBy: "actor-a", confirmedBy: "actor-b" });
  });

  test("meldet fehlende Pflichtfelder der Rätseldefinition", () => {
    const task = definition.tasks.find((item) => item.id === "S1-OUV-040")!;
    expect(validateRequiredResultFields(task, {})).toContain("sanctuaire.monochromeColor");
    expect(validateRequiredResultFields(task, { monochromeColor: "AZURE_BLEU" })).toEqual([]);
  });
});
