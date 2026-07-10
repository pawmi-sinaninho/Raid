import type { ParticipantRecord, RaidDefinition, TaskInstanceRecord } from "./types";
import { evaluateDependencies } from "./dependency-engine";
import { getSanctuaireState, isSanctuaire, taskConfirmation } from "./sanctuaire";
import type { RaidState } from "./raid-state";
import { effectiveLightLevel, getGigalodonState, isGigalodon, uniqueResourceAtRisk } from "./gigalodon";

export type RiskLevel = "ATTENTION" | "HIGH" | "CRITICAL";
export interface RadarItem {
  id: string;
  level: RiskLevel;
  title: string;
  impact: string;
  taskId?: string;
}

export function deriveCaptainRadar(
  definition: RaidDefinition,
  tasks: TaskInstanceRecord[],
  participants: ParticipantRecord[],
  now = Date.now(),
  raidState: RaidState = {}
): RadarItem[] {
  const items: RadarItem[] = [];
  const dependency = new Map(
    evaluateDependencies(definition, tasks).map((item) => [item.taskDefinitionId, item])
  );

  for (const task of tasks) {
    if (task.status === "BLOCKED") {
      items.push({
        id: `blocked:${task.id}`,
        level: "CRITICAL",
        title: `${task.definitionId} ist blockiert`,
        impact: task.blockedReason || "Le chemin critique ne peut pas continuer.",
        taskId: task.id
      });
    } else if (["READY", "ACTIVE"].includes(task.status) && !task.ownerParticipantId && !task.assignedTeamId && task.assignedParticipantIds.length === 0) {
      items.push({
        id: `unassigned:${task.id}`,
        level: task.status === "ACTIVE" ? "HIGH" : "ATTENTION",
        title: `${task.definitionId} ist unbesetzt`,
        impact: "Le capitaine doit affecter une équipe ou une personne.",
        taskId: task.id
      });
    } else if (task.status === "LOCKED") {
      const blockers = dependency.get(task.definitionId)?.blockingTaskDefinitionIds ?? [];
      if (blockers.length > 0 && task.order < Math.min(...tasks.filter((item) => !["COMPLETED", "SKIPPED"].includes(item.status)).map((item) => item.order), Number.MAX_SAFE_INTEGER) + 50) {
        items.push({
          id: `locked:${task.id}`,
          level: "ATTENTION",
          title: `${task.definitionId} wartet auf ${blockers.slice(0, 2).join(", ")}`,
          impact: "Une dépendance de la prochaine étape reste ouverte.",
          taskId: task.id
        });
      }
    }
  }


  if (isSanctuaire(definition)) {
    const state = getSanctuaireState(raidState);
    if (state.raidLife <= 5) {
      items.push({ id: "sanctuaire:life", level: "CRITICAL", title: `Vies du raid: ${state.raidLife}/20`, impact: "Arrêter les actions risquées et vérifier chaque cible avant validation." });
    } else if (state.raidLife <= 10) {
      items.push({ id: "sanctuaire:life", level: "HIGH", title: `Vies du raid: ${state.raidLife}/20`, impact: "La marge d’erreur est réduite." });
    }
    if (state.corridorTargetSourceStatus !== "LIVE_CONFIRMED") {
      items.push({ id: "sanctuaire:corridor-target", level: "ATTENTION", title: `Objectif corridor ${state.corridorTarget} · guide confirmé`, impact: "10 salles × 6 monstres; pas encore confirmé par un test live RAIDWEAVE." });
    }
    for (const task of tasks) {
      const confirmation = taskConfirmation(task.resultData);
      if (task.status === "WAITING" && confirmation?.status === "PENDING") {
        items.push({ id: `confirmation:${task.id}`, level: "HIGH", title: `${task.definitionId} attend une confirmation`, impact: confirmation.policy === "CAPTAIN" ? "Confirmation du capitaine requise." : "Une seconde personne doit confirmer.", taskId: task.id });
      }
      if (task.phaseId.startsWith("S2-") && task.status === "READY" && !task.assignedTeamId && task.assignedParticipantIds.length === 0) {
        items.push({ id: `guardian-team:${task.id}`, level: "HIGH", title: `${task.definitionId} prêt sans équipe`, impact: "Affecter une équipe avant le combat.", taskId: task.id });
      }
      if ((task.definitionId === "S4-QUE-010" || task.definitionId === "S4-PRI-010") && task.status === "READY" && !task.assignedTeamId && task.assignedParticipantIds.length === 0) {
        items.push({ id: `final-team:${task.id}`, level: "HIGH", title: "Boss final prêt sans équipe complète", impact: "Préparer séparément les équipes Reine et Princesse.", taskId: task.id });
      }
    }
  }

  if (isGigalodon(definition)) {
    const state = getGigalodonState(raidState);
    for (const light of state.lightStates) {
      const level = effectiveLightLevel(light, now);
      if (level === 0) items.push({ id: `gigalodon:light:${light.floor}`, level: "CRITICAL", title: `Lumière 0 à l’étage ${light.floor}`, impact: "Monstres agressifs: quitter la zone ou recharger immédiatement." });
      else if (level === 1) items.push({ id: `gigalodon:light:${light.floor}`, level: "HIGH", title: `Lumière 1 à l’étage ${light.floor}`, impact: "Activer le responsable du sel avant la prochaine baisse." });
      else if (level === 2) items.push({ id: `gigalodon:light:${light.floor}`, level: "ATTENTION", title: `Lumière 2 à l’étage ${light.floor}`, impact: "Marge réduite avant le risque d’agression." });
    }
    if (state.lightIntervalSourceStatus !== "LIVE_CONFIRMED" || state.saltCostSourceStatus !== "LIVE_CONFIRMED") {
      items.push({ id: "gigalodon:light-live-required", level: "ATTENTION", title: "Lumière/sel · baseline du guide", impact: "120 s et coûts 1/3/6/10 ne sont pas encore confirmés par un test live RAIDWEAVE." });
    }
    if (uniqueResourceAtRisk(state)) items.push({ id: "gigalodon:unique-risk", level: "CRITICAL", title: "Ressource unique non déposée", impact: "Conduire le porteur au coffre avant tout combat risqué." });
    if (state.projectedUnbankedScore >= 5_000) items.push({ id: "gigalodon:score-risk", level: "HIGH", title: `${state.projectedUnbankedScore.toLocaleString("fr-CH")} points non sécurisés`, impact: "Planifier un dépôt intermédiaire ou le retour final." });
    for (const inventory of state.participantInventories) {
      if (now - new Date(inventory.lastConfirmedAt).getTime() > 300_000) {
        const participant = participants.find((item) => item.id === inventory.participantId);
        items.push({ id: `gigalodon:stale:${inventory.participantId}`, level: "HIGH", title: `Inventaire obsolète: ${participant?.displayName ?? "joueur"}`, impact: "Confirmer les ressources et l’étage actuels." });
      }
    }
    const execrabeDone = tasks.find((task) => task.definitionId === "G4-040")?.status === "COMPLETED";
    if (execrabeDone && !state.pinceHolder) items.push({ id: "gigalodon:pince", level: "CRITICAL", title: "Porteur de la Pince inconnu", impact: "Le raccourci ne peut pas être coordonné et l’échange est désactivé." });
    if (state.finalReadiness.activeFights > 0) items.push({
      id: "gigalodon:active-fights",
      level: state.finalReadiness.activeFightsRuleSourceStatus === "LIVE_CONFIRMED" ? "CRITICAL" : "HIGH",
      title: `${state.finalReadiness.activeFights} combat(s) actif(s) au départ final`,
      impact: state.finalReadiness.activeFightsRuleSourceStatus === "LIVE_CONFIRMED" ? "Blocage de départ confirmé en live." : "D’autres combats pourraient empêcher le départ · vérifier en jeu; le capitaine peut continuer."
    });
  }

  for (const participant of participants) {
    const ageMs = now - new Date(participant.lastSeenAt).getTime();
    if (participant.connectionState === "OFFLINE" || ageMs > 120_000) {
      items.push({
        id: `offline:${participant.id}`,
        level: ageMs > 300_000 ? "HIGH" : "ATTENTION",
        title: `${participant.displayName} ist offline`,
        impact: participant.currentTaskId ? "La mission en cours peut se bloquer sans nouvelle affectation." : "Vérifier l’état du joueur."
      });
    }
  }

  const levelRank: Record<RiskLevel, number> = { CRITICAL: 0, HIGH: 1, ATTENTION: 2 };
  return items.sort((a, b) => levelRank[a.level] - levelRank[b.level]).slice(0, 20);
}
