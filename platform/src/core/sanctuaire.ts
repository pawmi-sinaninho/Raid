import type { RaidDefinition, SourceStatus, TaskDefinition, TaskInstanceRecord } from "./types";
import { getPath, type RaidState } from "./raid-state";

export type ConfirmationPolicy = "SELF" | "SECOND_PERSON" | "CAPTAIN" | "SYSTEM" | string;
export type ConfirmationStatus = "PENDING" | "CONFIRMED";

export interface TaskConfirmation {
  status: ConfirmationStatus;
  policy: ConfirmationPolicy;
  submittedBy: string;
  submittedAt: string;
  confirmedBy?: string;
  confirmedAt?: string;
}

export interface SanctuaireLifeEntry {
  id: string;
  delta: number;
  before: number;
  after: number;
  cause: string;
  actorParticipantId: string;
  relatedTaskId?: string | null;
  createdAt: string;
  correctionOf?: string | null;
}

export interface CorridorAssignment {
  participantId: string;
  room: number;
  slot: number;
  status: "ASSIGNED" | "ACTIVE" | "COMPLETED" | "FAILED";
  updatedAt: string;
}

export interface SanctuaireState {
  raidLife: number;
  raidLifeHistory: SanctuaireLifeEntry[];
  puzzleStates: Record<string, unknown>;
  guardianStates: Record<string, unknown>;
  corridorTarget: number;
  corridorTargetSourceStatus: SourceStatus;
  corridorCompleted: number;
  corridorAssignments: CorridorAssignment[];
  queen: Record<string, unknown>;
  princess: Record<string, unknown>;
}

export interface DataTransferDefinition {
  id: string;
  sourcePath: string;
  targetPaths: string[];
  trigger: string;
  validation: string;
  sourceStatus: string;
}

export interface TransferMutation {
  transferId: string;
  targetTaskDefinitionId: string;
  targetKey: string;
  value: unknown;
  sourceTaskDefinitionId: string;
}

export function isSanctuaire(definition: RaidDefinition): boolean {
  return definition.id === "sanctuaire-jardins-eternels" || definition.slug.includes("sanctuaire");
}

export function getSanctuaireState(raidState: RaidState): SanctuaireState {
  const raw = (raidState.sanctuaire ?? {}) as Partial<SanctuaireState> & { corridorTargetConfirmed?: boolean };
  return {
    raidLife: typeof raw.raidLife === "number" ? raw.raidLife : 20,
    raidLifeHistory: Array.isArray(raw.raidLifeHistory) ? raw.raidLifeHistory : [],
    puzzleStates: raw.puzzleStates && typeof raw.puzzleStates === "object" ? raw.puzzleStates : {},
    guardianStates: raw.guardianStates && typeof raw.guardianStates === "object" ? raw.guardianStates : {},
    corridorTarget: typeof raw.corridorTarget === "number" ? raw.corridorTarget : 60,
    corridorTargetSourceStatus: raw.corridorTargetSourceStatus
      ?? (raw.corridorTargetConfirmed === true ? "LIVE_CONFIRMED" : "GUIDE_CONFIRMED"),
    corridorCompleted: typeof raw.corridorCompleted === "number" ? raw.corridorCompleted : 0,
    corridorAssignments: Array.isArray(raw.corridorAssignments) ? raw.corridorAssignments : [],
    queen: raw.queen && typeof raw.queen === "object" ? raw.queen : {},
    princess: raw.princess && typeof raw.princess === "object" ? raw.princess : {}
  };
}

export function taskConfirmation(resultData: Record<string, unknown>): TaskConfirmation | null {
  const value = resultData._confirmation;
  if (!value || typeof value !== "object") return null;
  return value as TaskConfirmation;
}


export interface ResultValidation {
  missing: string[];
  invalid: Array<{ path: string; reason: string }>;
}

function fieldValue(resultData: Record<string, unknown>, path: string): unknown {
  const shortKey = path.split(".").at(-1)!;
  return resultData[path] ?? resultData[shortKey] ?? getPath(resultData, path);
}

export function validateTaskResultFields(definition: TaskDefinition, resultData: Record<string, unknown>): ResultValidation {
  const fields = [...definition.inputFields, ...definition.completion.resultFields];
  const missing: string[] = [];
  const invalid: Array<{ path: string; reason: string }> = [];
  for (const field of fields) {
    const value = fieldValue(resultData, field.path);
    const emptyArray = Array.isArray(value) && value.length === 0;
    const empty = value === undefined || value === null || value === "" || emptyArray;
    if (field.required && empty) {
      missing.push(field.path);
      continue;
    }
    if (empty) continue;
    if (field.type === "enum" && field.enumValues && !field.enumValues.some((candidate) => String(candidate) === String(value))) invalid.push({ path: field.path, reason: "VALUE_NOT_IN_ENUM" });
    if (field.type === "timestamp" && (typeof value !== "string" || Number.isNaN(Date.parse(value)))) invalid.push({ path: field.path, reason: "TIMESTAMP_REQUIRED" });
    if (field.type === "participantId" && (typeof value !== "string" || value.trim().length === 0)) invalid.push({ path: field.path, reason: "PARTICIPANT_ID_REQUIRED" });
    if (field.type === "array" && !Array.isArray(value)) invalid.push({ path: field.path, reason: "ARRAY_REQUIRED" });
    if (field.type === "object" && (typeof value !== "object" || value === null || Array.isArray(value))) invalid.push({ path: field.path, reason: "OBJECT_REQUIRED" });
    if (field.type === "boolean" && typeof value !== "boolean") invalid.push({ path: field.path, reason: "BOOLEAN_REQUIRED" });
    if (["integer", "number"].includes(field.type)) {
      if (typeof value !== "number" || !Number.isFinite(value) || (field.type === "integer" && !Number.isInteger(value))) invalid.push({ path: field.path, reason: "NUMBER_REQUIRED" });
      else {
        if (field.minimum !== undefined && value < field.minimum) invalid.push({ path: field.path, reason: "BELOW_MINIMUM" });
        if (field.maximum !== undefined && value > field.maximum) invalid.push({ path: field.path, reason: "ABOVE_MAXIMUM" });
      }
    }
  }

  const boatPaths = ["sanctuaire.battleship.boardA.boatCells", "sanctuaire.battleship.boardB.boatCells"];
  for (const path of boatPaths) {
    const value = fieldValue(resultData, path);
    if (Array.isArray(value) && (value.length !== 3 || new Set(value.map(String)).size !== 3)) invalid.push({ path, reason: "THREE_UNIQUE_CELLS_REQUIRED" });
  }
  const flowerSequence = fieldValue(resultData, "sanctuaire.flowerSequence");
  if (Array.isArray(flowerSequence) && flowerSequence.length !== 4) invalid.push({ path: "sanctuaire.flowerSequence", reason: "FOUR_VALUES_REQUIRED" });

  if (definition.id === "G3-010") {
    const cells = fieldValue(resultData, "gigalodon.luminarium.cells");
    const valid = Array.isArray(cells) && cells.length === 4 && cells.every((row) => Array.isArray(row) && row.length === 4 && row.every((cell) => typeof cell === "boolean"));
    if (cells !== undefined && !valid) invalid.push({ path: "gigalodon.luminarium.cells", reason: "FOUR_BY_FOUR_BOOLEAN_GRID_REQUIRED" });
  }
  if (definition.id === "G4-030") {
    const paths = [
      "gigalodon.execrabe.sequence.threshold80000",
      "gigalodon.execrabe.sequence.threshold60000",
      "gigalodon.execrabe.sequence.threshold40000",
      "gigalodon.execrabe.sequence.threshold20000"
    ];
    const values = paths.map((path) => fieldValue(resultData, path));
    if (values.some((value) => value === undefined || value === null || value === "")) {
      for (const path of paths.filter((path) => { const value = fieldValue(resultData, path); return value === undefined || value === null || value === ""; })) if (!missing.includes(path)) missing.push(path);
    } else if (new Set(values.map(String)).size !== 4) invalid.push({ path: "gigalodon.execrabe.sequence", reason: "FOUR_UNIQUE_APPEARANCES_REQUIRED" });
  }
  if (definition.id === "G3-030") {
    const completed = fieldValue(resultData, "gigalodon.luminarium.completed");
    if (completed !== true && !missing.includes("gigalodon.luminarium.completed")) missing.push("gigalodon.luminarium.completed");
  }
  return { missing, invalid };
}

export function validateRequiredResultFields(definition: TaskDefinition, resultData: Record<string, unknown>): string[] {
  return validateTaskResultFields(definition, resultData).missing;
}

export function withPendingConfirmation(
  resultData: Record<string, unknown>,
  policy: ConfirmationPolicy,
  actorParticipantId: string,
  now = new Date().toISOString()
): Record<string, unknown> {
  return {
    ...resultData,
    _confirmation: {
      status: "PENDING",
      policy,
      submittedBy: actorParticipantId,
      submittedAt: now
    } satisfies TaskConfirmation
  };
}

export function withConfirmedConfirmation(
  resultData: Record<string, unknown>,
  actorParticipantId: string,
  now = new Date().toISOString()
): Record<string, unknown> {
  const current = taskConfirmation(resultData);
  if (!current) return resultData;
  return {
    ...resultData,
    _confirmation: {
      ...current,
      status: "CONFIRMED",
      confirmedBy: actorParticipantId,
      confirmedAt: now
    } satisfies TaskConfirmation
  };
}

function findResultValue(resultData: Record<string, unknown>, sourcePath: string): unknown {
  const key = sourcePath.split(".").at(-1)!;
  const direct = resultData[key];
  if (direct !== undefined) return direct;
  const suffix = Object.entries(resultData).find(([entryKey]) => entryKey === sourcePath || entryKey.endsWith(`.${key}`));
  return suffix?.[1];
}

export function collectTaskTransfers(
  definition: RaidDefinition,
  sourceTaskDefinitionId: string,
  resultData: Record<string, unknown>
): TransferMutation[] {
  const transfers = (definition.dataTransfers ?? []) as DataTransferDefinition[];
  const output: TransferMutation[] = [];
  for (const transfer of transfers) {
    if (!transfer.sourcePath.includes(`task.${sourceTaskDefinitionId}.`)) continue;
    const value = findResultValue(resultData, transfer.sourcePath);
    if (value === undefined || value === null || value === "") continue;
    for (const targetPath of transfer.targetPaths) {
      const match = /^task\.([^.]+)\.input\.([^.]+)$/.exec(targetPath);
      if (!match) continue;
      output.push({
        transferId: transfer.id,
        targetTaskDefinitionId: match[1]!,
        targetKey: match[2]!,
        value,
        sourceTaskDefinitionId
      });
    }
  }
  return output;
}

export function taskProgress(tasks: TaskInstanceRecord[], definitionIds: string[]): { completed: number; total: number } {
  return {
    completed: definitionIds.filter((id) => tasks.some((task) => task.definitionId === id && task.status === "COMPLETED")).length,
    total: definitionIds.length
  };
}

export const SANCTUAIRE_GROUPS = {
  puzzles: ["S1-BEL-030", "S1-EPH-040", "S1-OUV-040", "S1-CLO-050"],
  guardians: ["S2-VEI-030", "S2-GAR-030", "S2-DEF-030", "S2-SEN-030"],
  finalVictories: ["S4-QUE-050", "S4-PRI-050"]
} as const;
