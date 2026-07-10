import { evaluateDependencies } from "./dependency-engine";
import { derivePersonalMission } from "./mission";
import { deriveCaptainRadar, type RadarItem } from "./radar";
import type {
  ActorContext,
  RaidDefinition,
  SessionSnapshot,
  TaskInstanceRecord,
  TaskStatus
} from "./types";

export type WowTrust = "CONFIRMED" | "DERIVED" | "LIVE_REQUIRED" | "STALE" | "PARTIAL";
export type WowRiskLevel = "NORMAL" | "ATTENTION" | "HIGH" | "CRITICAL";
export type MapNodeKind =
  | "PREPARATION"
  | "TASK"
  | "SYSTEM_GATE"
  | "PUZZLE_BRANCH"
  | "GUARDIAN_BRANCH"
  | "CORRIDOR"
  | "FLOOR"
  | "BOSS"
  | "RETURN"
  | "FINAL";

export interface WowLayerInput {
  snapshot: SessionSnapshot;
  actor: ActorContext | null;
  serverNowMs: number;
  locale: "fr" | "en" | "de";
  devicePreferences: {
    soundMode: "OFF" | "CRITICAL_ONLY" | "CRITICAL_AND_MISSION";
    reducedMotion: boolean;
  };
}

export interface LiveRaidMapNode {
  id: string;
  label: string;
  kind: MapNodeKind;
  status: TaskStatus;
  order: number;
  phaseId: string;
  taskId: string | null;
  ownerLabel: string | null;
  blockedBy: string[];
  trust: WowTrust;
}

export interface LiveRaidMapModel {
  title: string;
  orientation: "HORIZONTAL" | "VERTICAL";
  nodes: LiveRaidMapNode[];
  legend: string[];
}

export interface SmartNextAction {
  id: string;
  label: string;
  action: "OPEN_TASK" | "CLAIM_TASK" | "WAIT" | "REVIEW_RISK";
  taskId: string | null;
  reason: string;
  trust: WowTrust;
}

export interface RiskSignal {
  id: string;
  level: Exclude<WowRiskLevel, "NORMAL">;
  title: string;
  impact: string;
  taskId: string | null;
  trust: WowTrust;
}

export interface CriticalPathStep {
  id: string;
  label: string;
  status: TaskStatus;
  taskId: string;
  blockedBy: string[];
}

export interface CriticalPathModel {
  title: "Chemin critique structurel";
  steps: CriticalPathStep[];
  explanation: string;
}

export interface ReplaySummaryModel {
  eventCount: number;
  lastEventAt: string | null;
  coverage: WowTrust;
  highlights: string[];
}

export interface InformationCue {
  id: string;
  kind: "MISSION" | "RISK" | "TRANSFER" | "REPLAY";
  message: string;
  level: WowRiskLevel;
}

export interface DataQualityState {
  trust: WowTrust;
  liveRequiredCount: number;
  staleSignalCount: number;
  partialReason: string | null;
}

export interface WowLayerViewModel {
  map: LiveRaidMapModel;
  nextAction: SmartNextAction | null;
  risks: RiskSignal[];
  criticalPath: CriticalPathModel;
  replay: ReplaySummaryModel | null;
  cues: InformationCue[];
  dataQuality: DataQualityState;
}

const ACTIVE_STATUS_RANK: Record<TaskStatus, number> = {
  BLOCKED: 0,
  FAILED: 1,
  ACTIVE: 2,
  WAITING: 3,
  CLAIMED: 4,
  READY: 5,
  LOCKED: 6,
  COMPLETED: 7,
  SKIPPED: 8
};

function taskName(definition: RaidDefinition, task: TaskInstanceRecord): string {
  return definition.tasks.find((item) => item.id === task.definitionId)?.names.fr ?? task.definitionId;
}

function sourceTrust(sourceStatus: unknown): WowTrust {
  if (sourceStatus === "LIVE_REQUIRED" || sourceStatus === "GUIDE_CONFIRMED") return "LIVE_REQUIRED";
  if (sourceStatus === "OFFICIAL_CONFIRMED" || sourceStatus === "LIVE_CONFIRMED" || sourceStatus === "PLAYER_CORRECTED") return "CONFIRMED";
  return "DERIVED";
}

function statusFor(tasks: TaskInstanceRecord[]): TaskStatus {
  if (!tasks.length) return "LOCKED";
  const candidates = tasks.filter((task) => task.status !== "SKIPPED");
  const required = candidates.length ? candidates : tasks;
  if (required.every((task) => task.status === "COMPLETED" || task.status === "SKIPPED")) return "COMPLETED";
  return required.reduce<TaskStatus>((best, task) => ACTIVE_STATUS_RANK[task.status] < ACTIVE_STATUS_RANK[best] ? task.status : best, "LOCKED");
}

function nodeKind(definition: RaidDefinition, task: TaskInstanceRecord): MapNodeKind {
  const def = definition.tasks.find((item) => item.id === task.definitionId);
  const text = `${task.phaseId} ${task.definitionId} ${def?.type ?? ""} ${def?.uiHints?.primaryComponent ?? ""}`.toLowerCase();
  if (text.includes("final")) return "FINAL";
  if (text.includes("boss") || text.includes("mureine") || text.includes("execrabe") || text.includes("willorque")) return "BOSS";
  if (text.includes("corridor")) return "CORRIDOR";
  if (text.includes("guardian") || text.includes("sentinelle") || text.includes("gardien")) return "GUARDIAN_BRANCH";
  if (text.includes("puzzle") || text.includes("enig") || text.includes("luminarium")) return "PUZZLE_BRANCH";
  if (text.includes("floor") || text.includes("etage") || text.includes("étage")) return "FLOOR";
  return "TASK";
}

function actorParticipant(input: WowLayerInput) {
  return input.actor ? input.snapshot.participants.find((participant) => participant.id === input.actor?.participantId) ?? null : null;
}

function ownerLabel(snapshot: SessionSnapshot, task: TaskInstanceRecord): string | null {
  if (task.ownerParticipantId) return snapshot.participants.find((participant) => participant.id === task.ownerParticipantId)?.displayName ?? "Joueur affecté";
  if (task.assignedParticipantIds.length) return task.assignedParticipantIds.map((id) => snapshot.participants.find((participant) => participant.id === id)?.displayName ?? "Joueur").join(", ");
  if (task.assignedTeamId) return snapshot.teams.find((team) => team.id === task.assignedTeamId)?.name ?? "Équipe affectée";
  return null;
}

function deriveMap(input: WowLayerInput, blockersByTask: Map<string, string[]>): LiveRaidMapModel {
  const { snapshot } = input;
  const title = snapshot.definition.slug.includes("gigalodon") ? "Carte de plongée vivante" : "Carte de route vivante";
  const orientation = snapshot.definition.slug.includes("gigalodon") ? "VERTICAL" : "HORIZONTAL";
  const nodes: LiveRaidMapNode[] = snapshot.definition.phases
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((phase) => {
      const phaseTasks = snapshot.tasks.filter((task) => task.phaseId === phase.id);
      const phaseStatus = statusFor(phaseTasks);
      const firstOpenTask = phaseTasks
        .filter((task) => !["COMPLETED", "SKIPPED"].includes(task.status))
        .sort((a, b) => ACTIVE_STATUS_RANK[a.status] - ACTIVE_STATUS_RANK[b.status] || a.order - b.order)[0] ?? phaseTasks[0];
      const firstDef = firstOpenTask ? snapshot.definition.tasks.find((task) => task.id === firstOpenTask.definitionId) : null;
      return {
        id: `phase:${phase.id}`,
        label: phase.names.fr,
        kind: firstOpenTask ? nodeKind(snapshot.definition, firstOpenTask) : "SYSTEM_GATE",
        status: phaseStatus,
        order: phase.order,
        phaseId: phase.id,
        taskId: firstOpenTask?.id ?? null,
        ownerLabel: firstOpenTask ? ownerLabel(snapshot, firstOpenTask) : null,
        blockedBy: firstOpenTask ? blockersByTask.get(firstOpenTask.definitionId) ?? [] : [],
        trust: firstDef ? sourceTrust(firstDef.sourceStatus) : "DERIVED"
      } satisfies LiveRaidMapNode;
    });

  return {
    title,
    orientation,
    nodes,
    legend: [
      "Carte de workflow, pas une capture de la carte du jeu.",
      "Équipe affectée = responsabilité déclarée dans RAIDWEAVE.",
      "NON CONFIRMÉ EN JEU reste visible si la règle vient d’une baseline guide."
    ]
  };
}

function deriveNextAction(input: WowLayerInput, radar: RadarItem[]): SmartNextAction | null {
  const { snapshot } = input;
  const participant = actorParticipant(input);
  if (!participant) return null;

  if (participant.role === "CAPTAIN" || participant.role === "EDITOR") {
    const firstRisk = radar[0];
    if (firstRisk) {
      return {
        id: `risk:${firstRisk.id}`,
        label: firstRisk.title,
        action: "REVIEW_RISK",
        taskId: firstRisk.taskId ?? null,
        reason: firstRisk.impact,
        trust: firstRisk.title.includes("guide") || firstRisk.impact.includes("pas encore confirmé") ? "LIVE_REQUIRED" : "DERIVED"
      };
    }
    const unassigned = snapshot.tasks.find((task) => ["READY", "ACTIVE"].includes(task.status) && !task.ownerParticipantId && !task.assignedTeamId && task.assignedParticipantIds.length === 0);
    if (unassigned) return {
      id: `assign:${unassigned.id}`,
      label: taskName(snapshot.definition, unassigned),
      action: "OPEN_TASK",
      taskId: unassigned.id,
      reason: "Affecter une personne ou une équipe avant de poursuivre.",
      trust: "DERIVED"
    };
  }

  const mission = derivePersonalMission(participant, snapshot.tasks, snapshot.definition);
  if (!mission.now) return {
    id: `wait:${participant.id}`,
    label: "Attendre la prochaine ouverture",
    action: "WAIT",
    taskId: null,
    reason: mission.reason ?? "Aucune mission disponible pour ce rôle maintenant.",
    trust: "DERIVED"
  };

  return {
    id: `mission:${mission.now.id}`,
    label: taskName(snapshot.definition, mission.now),
    action: mission.now.status === "READY" && !mission.now.ownerParticipantId ? "CLAIM_TASK" : mission.now.status === "LOCKED" ? "WAIT" : "OPEN_TASK",
    taskId: mission.now.id,
    reason: mission.waitingFor.length ? `Attend ${mission.waitingFor.slice(0, 2).join(", ")}` : mission.reason ?? "Mission déterminée depuis l’état confirmé.",
    trust: "DERIVED"
  };
}

function deriveCriticalPath(snapshot: SessionSnapshot, blockersByTask: Map<string, string[]>): CriticalPathModel {
  const requiredOpenTasks = snapshot.tasks
    .filter((task) => !["COMPLETED", "SKIPPED"].includes(task.status))
    .filter((task) => {
      const def = snapshot.definition.tasks.find((item) => item.id === task.definitionId);
      return def?.priority === "P0" || def?.optional === false;
    })
    .sort((a, b) => ACTIVE_STATUS_RANK[a.status] - ACTIVE_STATUS_RANK[b.status] || a.order - b.order)
    .slice(0, 7);

  return {
    title: "Chemin critique structurel",
    explanation: "Ordre structurel calculé depuis les statuts et dépendances. Aucune durée restante n’est inventée.",
    steps: requiredOpenTasks.map((task) => ({
      id: `critical:${task.id}`,
      label: taskName(snapshot.definition, task),
      status: task.status,
      taskId: task.id,
      blockedBy: blockersByTask.get(task.definitionId) ?? []
    }))
  };
}

function deriveRisks(radar: RadarItem[]): RiskSignal[] {
  return radar.slice(0, 10).map((item) => ({
    id: item.id,
    level: item.level,
    title: item.title,
    impact: item.impact,
    taskId: item.taskId ?? null,
    trust: item.title.includes("guide") || item.impact.includes("pas encore confirmé") || item.impact.includes("vérifier en jeu") ? "LIVE_REQUIRED" : "DERIVED"
  }));
}

function deriveReplay(snapshot: SessionSnapshot): ReplaySummaryModel | null {
  if (!snapshot.events.length) return null;
  return {
    eventCount: snapshot.events.length,
    lastEventAt: snapshot.events.at(-1)?.createdAt ?? null,
    coverage: snapshot.events.length >= snapshot.session.revision ? "CONFIRMED" : "PARTIAL",
    highlights: snapshot.events.slice(-5).reverse().map((event) => `${event.type} · révision ${event.sessionRevision}`)
  };
}

function deriveQuality(snapshot: SessionSnapshot, risks: RiskSignal[], replay: ReplaySummaryModel | null): DataQualityState {
  const liveRequiredCount = snapshot.definition.tasks.filter((task) => sourceTrust(task.sourceStatus) === "LIVE_REQUIRED").length + risks.filter((risk) => risk.trust === "LIVE_REQUIRED").length;
  const staleSignalCount = risks.filter((risk) => risk.trust === "STALE").length;
  const partialReason = replay?.coverage === "PARTIAL" ? "Le journal local ne couvre pas toutes les révisions connues." : null;
  return {
    trust: partialReason ? "PARTIAL" : liveRequiredCount > 0 ? "LIVE_REQUIRED" : "DERIVED",
    liveRequiredCount,
    staleSignalCount,
    partialReason
  };
}

function deriveCues(nextAction: SmartNextAction | null, risks: RiskSignal[], replay: ReplaySummaryModel | null): InformationCue[] {
  const cues: InformationCue[] = [];
  if (nextAction) cues.push({ id: `cue:${nextAction.id}`, kind: "MISSION", message: nextAction.label, level: "NORMAL" });
  const critical = risks.find((risk) => risk.level === "CRITICAL");
  if (critical) cues.push({ id: `cue:${critical.id}`, kind: "RISK", message: critical.title, level: "CRITICAL" });
  if (replay?.coverage === "PARTIAL") cues.push({ id: "cue:replay-partial", kind: "REPLAY", message: "Replay partiel", level: "ATTENTION" });
  return cues;
}

export function deriveWowLayer(input: WowLayerInput): WowLayerViewModel {
  const dependencyResults = evaluateDependencies(input.snapshot.definition, input.snapshot.tasks);
  const blockersByTask = new Map(dependencyResults.map((result) => [result.taskDefinitionId, result.blockingTaskDefinitionIds]));
  const radar = deriveCaptainRadar(input.snapshot.definition, input.snapshot.tasks, input.snapshot.participants, input.serverNowMs, input.snapshot.session.raidState);
  const risks = deriveRisks(radar);
  const replay = deriveReplay(input.snapshot);
  const nextAction = deriveNextAction(input, radar);
  return {
    map: deriveMap(input, blockersByTask),
    nextAction,
    risks,
    criticalPath: deriveCriticalPath(input.snapshot, blockersByTask),
    replay,
    cues: deriveCues(nextAction, risks, replay),
    dataQuality: deriveQuality(input.snapshot, risks, replay)
  };
}
