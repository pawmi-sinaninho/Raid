import { describe, expect, test } from "vitest";
import { assertDefinitionIntegrity, listDefinitions, validateDefinition } from "@/src/core/definition-loader";
import { evaluateDependencies } from "@/src/core/dependency-engine";

function minimalInstances(definition: ReturnType<typeof listDefinitions>[number]) {
  return definition.tasks.map((task) => ({
    definitionId: task.id,
    status: task.initialStatus
  }));
}

describe("RaidDefinition loader", () => {
  test("validiert beide unveränderten Raidverträge", () => {
    const definitions = listDefinitions();
    expect(definitions).toHaveLength(2);
    for (const definition of definitions) {
      expect(() => validateDefinition(definition)).not.toThrow();
      expect(() => assertDefinitionIntegrity(definition)).not.toThrow();
      expect(definition.tasks.length).toBeGreaterThan(40);
    }
  });

  test("wertet die vollständigen ALL-Abhängigkeiten deterministisch aus", () => {
    const definition = listDefinitions().find((item) => item.slug.includes("sanctuaire"))!;
    const instances = minimalInstances(definition);
    const firstDependency = definition.dependencies[0]!;
    const before = evaluateDependencies(definition, instances).find((item) => item.taskDefinitionId === firstDependency.toTaskId)!;
    expect(before.shouldBeReady).toBe(false);
    for (const from of firstDependency.fromTaskIds) {
      const instance = instances.find((item) => item.definitionId === from)!;
      instance.status = "COMPLETED";
    }
    const after = evaluateDependencies(definition, instances).find((item) => item.taskDefinitionId === firstDependency.toTaskId)!;
    expect(after.shouldBeReady).toBe(true);
  });
});
