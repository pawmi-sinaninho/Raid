export const ROLES = ["CAPTAIN", "EDITOR", "PARTICIPANT", "SPECTATOR"] as const;
export type Role = (typeof ROLES)[number];

export const SOURCE_STATUSES = [
  "OFFICIAL_CONFIRMED",
  "GUIDE_CONFIRMED",
  "LIVE_CONFIRMED",
  "LIVE_REQUIRED",
  "PLAYER_CORRECTED"
] as const;
export type SourceStatus = (typeof SOURCE_STATUSES)[number];

export interface PlayerCorrectionConfirmation {
  status: "PLAYER_CORRECTED";
  actorParticipantId: string;
  note: string;
  createdAt: string;
}

export interface InformationReport {
  id: string;
  reference: string;
  note: string;
  reportedByParticipantId: string;
  reportedAt: string;
  sourceStatus: "LIVE_REQUIRED" | "PLAYER_CORRECTED";
  correction: PlayerCorrectionConfirmation | null;
}

export const TASK_STATUSES = [
  "LOCKED",
  "READY",
  "CLAIMED",
  "ACTIVE",
  "WAITING",
  "BLOCKED",
  "FAILED",
  "COMPLETED",
  "SKIPPED"
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export type SessionStatus = "LOBBY" | "LIVE" | "FINAL_PREP" | "FINAL_ACTIVE" | "ENDED" | "FAILED";
export type ReadyState = "NOT_READY" | "READY";
export type ConnectionState = "ONLINE" | "RECONNECTING" | "OFFLINE";

export interface LocalizedNames {
  fr: string;
  en?: string | null;
  de?: string | null;
}

export interface InputFieldDefinition {
  path: string;
  type: string;
  description: string;
  required?: boolean;
  nullable?: boolean;
  enumValues?: Array<string | number | boolean>;
  sourceStatus?: string;
  default?: unknown;
  minimum?: number;
  maximum?: number;
}

export interface TaskDefinition {
  id: string;
  phaseId: string;
  order: number;
  names: LocalizedNames;
  type: string;
  priority: "P0" | "P1" | "P2" | "LATER";
  optional: boolean;
  initialStatus: TaskStatus;
  description: string;
  location?: string | null;
  assignment: {
    mode: string;
    minimumParticipants: number;
    maximumParticipants: number;
    exclusiveClaim: boolean;
    recommendedParticipants?: number;
    requiredRoleLabel?: string | null;
  };
  inputFields: InputFieldDefinition[];
  instructions: string[];
  completion: {
    mode: string;
    criteria: string[];
    confirmationPolicy: string;
    resultFields: InputFieldDefinition[];
  };
  sourceStatus: string;
  uiHints: {
    primaryComponent: string;
    participantSummary: string;
    captainSummary: string;
    showMechanicOnDemand: boolean;
    criticalFields: string[];
    quickActions: string[];
  };
}

export interface DependencyDefinition {
  id: string;
  fromTaskIds: string[];
  toTaskId: string;
  mode: "ALL" | "ANY";
  conditions: unknown[];
  onSatisfied: "SET_READY";
  sourceStatus: string;
  description: string;
}

export interface RaidDefinition {
  id: string;
  slug: string;
  schemaVersion: string;
  definitionVersion: string;
  gameVersion: string;
  names: LocalizedNames;
  participation: { minimum: number; maximum: number };
  timer: { durationSeconds: number };
  phases: Array<{ id: string; order: number; names: LocalizedNames }>;
  tasks: TaskDefinition[];
  dependencies: DependencyDefinition[];
  warnings: unknown[];
  automations?: unknown[];
  dataTransfers?: unknown[];
  lookupTables?: unknown[];
  stateModel?: unknown;
  [key: string]: unknown;
}

export interface InviteScope {
  teamIds?: string[];
  taskDefinitionIds?: string[];
}

export interface SessionRecord {
  id: string;
  definitionId: string;
  definitionVersion: string;
  name: string;
  language: "fr" | "en" | "de";
  status: SessionStatus;
  captainParticipantId: string | null;
  revision: number;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  timerStartedAt: string | null;
  timerDurationSeconds: number;
  raidState: Record<string, unknown>;
}

export interface ParticipantRecord {
  id: string;
  sessionId: string;
  displayName: string;
  role: Role;
  teamId: string | null;
  readyState: ReadyState;
  connectionState: ConnectionState;
  currentTaskId: string | null;
  lastSeenAt: string;
}

export interface TeamRecord {
  id: string;
  sessionId: string;
  name: string;
  leaderParticipantId: string | null;
}

export interface TaskInstanceRecord {
  id: string;
  sessionId: string;
  definitionId: string;
  phaseId: string;
  order: number;
  status: TaskStatus;
  assignedTeamId: string | null;
  assignedParticipantIds: string[];
  ownerParticipantId: string | null;
  resultData: Record<string, unknown>;
  blockedReason: string | null;
  revision: number;
  startedAt: string | null;
  completedAt: string | null;
  updatedAt: string;
}

export interface EventRecord {
  id: string;
  sessionId: string;
  sessionRevision: number;
  actorParticipantId: string | null;
  type: string;
  entityType: string;
  entityId: string | null;
  before: unknown;
  after: unknown;
  reversible: boolean;
  causedByEventId: string | null;
  createdAt: string;
}

export interface SessionSnapshot {
  session: SessionRecord;
  participants: ParticipantRecord[];
  teams: TeamRecord[];
  tasks: TaskInstanceRecord[];
  events: EventRecord[];
  definition: RaidDefinition;
}

export interface ActorContext {
  participantId: string;
  role: Role;
  sessionId: string;
  scope: InviteScope;
}
