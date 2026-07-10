import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
import schema from "@/contracts/raid-definition.schema.json";
import sanctuaire from "@/contracts/sanctuaire.v0.2.json";
import gigalodon from "@/contracts/gigalodon.v0.2.json";
import type { RaidDefinition } from "./types";

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);

const bundled = [sanctuaire, gigalodon] as unknown as RaidDefinition[];

export class DefinitionValidationError extends Error {
  constructor(public readonly details: string[]) {
    super(`Raiddefinition ungültig: ${details.join("; ")}`);
    this.name = "DefinitionValidationError";
  }
}

export function validateDefinition(input: unknown): RaidDefinition {
  if (!validate(input)) {
    const details = (validate.errors ?? []).map(
      (error) => `${error.instancePath || "/"} ${error.message ?? "invalid"}`
    );
    throw new DefinitionValidationError(details);
  }
  return input as RaidDefinition;
}

export function listDefinitions(): RaidDefinition[] {
  return bundled.map(validateDefinition);
}

export function getDefinition(idOrSlug: string, version?: string): RaidDefinition {
  const definition = listDefinitions().find(
    (candidate) =>
      (candidate.id === idOrSlug || candidate.slug === idOrSlug) &&
      (!version || candidate.definitionVersion === version)
  );
  if (!definition) {
    throw new Error(`UNKNOWN_RAID_DEFINITION:${idOrSlug}${version ? `@${version}` : ""}`);
  }
  return definition;
}

export function assertDefinitionIntegrity(definition: RaidDefinition): void {
  const taskIds = new Set(definition.tasks.map((task) => task.id));
  if (taskIds.size !== definition.tasks.length) {
    throw new DefinitionValidationError(["Les identifiants de mission ne sont pas uniques"]);
  }
  for (const dependency of definition.dependencies) {
    if (!taskIds.has(dependency.toTaskId)) {
      throw new DefinitionValidationError([`Dependency ${dependency.id}: destination inconnue`]);
    }
    for (const from of dependency.fromTaskIds) {
      if (!taskIds.has(from)) {
        throw new DefinitionValidationError([`Dependency ${dependency.id}: source inconnue ${from}`]);
      }
    }
  }

  const edges = new Map<string, string[]>();
  for (const taskId of taskIds) edges.set(taskId, []);
  for (const dependency of definition.dependencies) {
    for (const from of dependency.fromTaskIds) edges.get(from)?.push(dependency.toTaskId);
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (id: string) => {
    if (visiting.has(id)) throw new DefinitionValidationError([`Dépendance cyclique sur ${id}`]);
    if (visited.has(id)) return;
    visiting.add(id);
    for (const next of edges.get(id) ?? []) visit(next);
    visiting.delete(id);
    visited.add(id);
  };
  for (const id of taskIds) visit(id);
}
