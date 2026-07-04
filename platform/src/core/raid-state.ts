import type { InformationReport, RaidDefinition } from "./types";

export type RaidState = Record<string, unknown>;

interface RaidSpecificField {
  path: string;
  type: string;
  default?: unknown;
}

export function setPath(target: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split(".").filter(Boolean);
  let current = target;
  for (const part of parts.slice(0, -1)) {
    const existing = current[part];
    if (!existing || typeof existing !== "object" || Array.isArray(existing)) current[part] = {};
    current = current[part] as Record<string, unknown>;
  }
  current[parts.at(-1)!] = value;
}

export function getPath(target: unknown, path: string): unknown {
  let current = target;
  for (const part of path.split(".").filter(Boolean)) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

export function createInitialRaidState(definition: RaidDefinition): RaidState {
  const state: RaidState = {};
  const stateModel = definition.stateModel as { raidSpecificFields?: RaidSpecificField[] } | undefined;
  for (const field of stateModel?.raidSpecificFields ?? []) {
    const fallback = field.type === "array" ? [] : field.type === "object" ? {} : null;
    setPath(state, field.path, structuredClone(field.default ?? fallback));
  }
  return state;
}

export function getInformationReports(raidState: RaidState): InformationReport[] {
  return Array.isArray(raidState.informationReports)
    ? raidState.informationReports.filter((report): report is InformationReport => Boolean(report && typeof report === "object"))
    : [];
}
