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

  it("localizes strings found during the interactive drawer playthrough", () => {
    const gigalodon = localizeRaidDefinitionFr(loadContract("gigalodon.v0.2.json"));
    const swallow = gigalodon.tasks.find((candidate) => candidate.id === "GG-030");

    expect(swallow?.instructions).toContain("Afficher la prochaine action de l’escouade.");
    expect(swallow?.inputFields.find((field) => field.path === "gigalodon.final.swallowedParticipantId")?.description)
      .toBe("Joueur englouti");

    const sanctuaire = localizeRaidDefinitionFr(loadContract("sanctuaire.v0.2.json"));
    const corridor = sanctuaire.tasks.find((candidate) => candidate.id === "S3-COR-010");

    expect(corridor?.instructions).toContain("Relever dans le jeu le nombre cible visible.");
    expect(corridor?.instructions).toContain("Documenter le nombre de salles et de monstres par salle.");
    expect(corridor?.inputFields.find((field) => field.path === "sanctuaire.corridorSourceConflict")?.description)
      .toBe("Conflit de sources");
  });

  it("localizes lookup labels and values", () => {
    expect(displayContractKeyFr("raidChest")).toBe("Coffre du raid");
    expect(displayContractValueFr("Vorposten")).toBe("Avant-poste");
    expect(displayContractValueFr("GUIDE_CONFIRMED")).toBe("Guide confirmé");
  });
});
