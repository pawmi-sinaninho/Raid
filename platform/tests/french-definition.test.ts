import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { RaidDefinition } from "@/src/core/types";
import {
  displayContractKeyFr,
  displayContractValueFr,
  findFrenchPresentationLeaks,
  localizeRaidDefinitionFr
} from "@/components/presentation/frenchDefinition";

function loadContract(name: string): RaidDefinition {
  return JSON.parse(
    readFileSync(resolve(process.cwd(), "contracts", name), "utf8")
  ) as RaidDefinition;
}

describe("French presentation firewall", () => {
  for (const file of ["sanctuaire.v0.2.json", "gigalodon.v0.2.json"]) {
    it(`removes German from visible fields in ${file}`, () => {
      expect(findFrenchPresentationLeaks(loadContract(file))).toEqual([]);
    });
  }

  it("localizes the drawer strings visible in production", () => {
    const definition = localizeRaidDefinitionFr(loadContract("gigalodon.v0.2.json"));
    const task = definition.tasks.find((candidate) => candidate.id === "G4-010");

    expect(task?.instructions).toEqual([
      "Saisir le niveau.",
      "Niveau 4 recommandé."
    ]);
    expect(task?.inputFields[0]?.description).toBe("lumière étage -4");
  });

  it("localizes lookup labels and values", () => {
    expect(displayContractKeyFr("raidChest")).toBe("Coffre du raid");
    expect(displayContractValueFr("Vorposten")).toBe("Avant-poste");
    expect(displayContractValueFr("GUIDE_CONFIRMED")).toBe("Guide confirmé");
  });
});
