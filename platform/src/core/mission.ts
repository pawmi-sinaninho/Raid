import type { ParticipantRecord, RaidDefinition, TaskInstanceRecord } from "./types";
import { evaluateDependencies } from "./dependency-engine";

export interface PersonalMission {
  now: TaskInstanceRecord | null;
  next: TaskInstanceRecord | null;
  waitingFor: string[];
  reason: string | null;
}

const ACTIVE_ORDER = ["ACTIVE", "CLAIMED", "READY", "WAITING", "BLOCKED"] as const;

export function derivePersonalMission(
  participant: ParticipantRecord,
  tasks: TaskInstanceRecord[],
  definition: RaidDefinition
): PersonalMission {
  const assigned = tasks.filter(
    (task) =>
      task.ownerParticipantId === participant.id ||
      task.assignedParticipantIds.includes(participant.id) ||
      (participant.teamId && task.assignedTeamId === participant.teamId)
  );
  const rank = (status: TaskInstanceRecord["status"]) => {
    const index = ACTIVE_ORDER.indexOf(status as (typeof ACTIVE_ORDER)[number]);
    return index === -1 ? 999 : index;
  };
  assigned.sort((a, b) => rank(a.status) - rank(b.status) || a.order - b.order);
  const now = assigned.find((task) => !["COMPLETED", "SKIPPED", "FAILED"].includes(task.status)) ?? null;

  const later = assigned
    .filter((task) => task.id !== now?.id && !["COMPLETED", "SKIPPED", "FAILED"].includes(task.status))
    .sort((a, b) => a.order - b.order)[0] ?? null;

  if (now) {
    const evaluation = evaluateDependencies(definition, tasks).find(
      (item) => item.taskDefinitionId === now.definitionId
    );
    return {
      now,
      next: later,
      waitingFor: evaluation?.blockingTaskDefinitionIds ?? [],
      reason: now.status === "BLOCKED" ? now.blockedReason : null
    };
  }

  const available = tasks
    .filter((task) => task.status === "READY" && !task.ownerParticipantId)
    .sort((a, b) => a.order - b.order)[0] ?? null;
  return {
    now: available,
    next: null,
    waitingFor: [],
    reason: available ? "Aufgabe ist bereit und kann übernommen werden." : "Warte auf Zuweisung oder Freischaltung."
  };
}
