"use client";

import { useMemo, useState } from "react";
import type { ParticipantRecord, SessionSnapshot, TaskInstanceRecord } from "@/src/core/types";
import { getSanctuaireState, SANCTUAIRE_GROUPS, taskConfirmation, taskProgress } from "@/src/core/sanctuaire";
import { GardenRoute } from "@/components/sanctuaire/GardenRoute";
import { PuzzleWorkbench } from "@/components/sanctuaire/PuzzleWorkbench";
import { CorridorRibbon } from "@/components/sanctuaire/CorridorRibbon";
import { RaidIcon } from "@/components/icons/RaidIcon";
import { StatusStamp } from "@/components/layout/StatusStamp";

interface Props {
  snapshot: SessionSnapshot;
  actor: ParticipantRecord;
  onSelectTask: (taskId: string) => void;
  command: (body: Record<string, unknown>) => Promise<unknown>;
  onError: (message: string) => void;
}

const PUZZLES = [
  { id: "S1-BEL-030", eyebrow: "RÉSERVE DE BELLADONE", title: "Bateaux en papier", summary: "Suivre les tirs, les impacts et le plateau actif", transfer: "Transmet le résultat au Veilleur éternel" },
  { id: "S1-EPH-040", eyebrow: "COUR D’ÉPHÉDRE", title: "Pièces d’échecs", summary: "Suivre les quatre pièces et la limite de tours", transfer: "Ouvre le Gardien des jardins après confirmation" },
  { id: "S1-OUV-040", eyebrow: "OUVRAGE MONOCHROME", title: "Couleur finale", summary: "Consigner la couleur finale et sa confirmation", transfer: "Transmet la couleur au Clos et à la Sentinelle" },
  { id: "S1-CLO-050", eyebrow: "CLOS DES PROTECTEURS", title: "Jardins et statue centrale", summary: "Suivre l’équipe, la cible et l’issue du combat", transfer: "Transmet la statue au Veilleur" }
] as const;

const GUARDIANS = [
  { id: "S2-VEI-030", gate: "S2-VEI-010", title: "Veilleur éternel" },
  { id: "S2-GAR-030", gate: "S2-GAR-010", title: "Gardien des jardins" },
  { id: "S2-DEF-030", gate: "S2-DEF-010", title: "Défenseur" },
  { id: "S2-SEN-030", gate: "S2-SEN-010", title: "Sentinelle" }
] as const;

function byDefinition(snapshot: SessionSnapshot, definitionId: string) {
  return snapshot.tasks.find((task) => task.definitionId === definitionId);
}

function statusLabel(task?: TaskInstanceRecord) {
  if (!task) return "INDISPONIBLE";
  const labels: Record<TaskInstanceRecord["status"], string> = {
    LOCKED: "VERROUILLÉ", READY: "PRÊT", CLAIMED: "ATTRIBUÉ", ACTIVE: "ACTIF",
    WAITING: "À CONFIRMER", BLOCKED: "BLOQUÉ", FAILED: "ÉCHOUÉ", COMPLETED: "TERMINÉ", SKIPPED: "IGNORÉ"
  };
  return labels[task.status];
}

function transferredValues(task?: TaskInstanceRecord) {
  if (!task) return [];
  return Object.entries(task.resultData)
    .filter(([key]) => !key.startsWith("_") && ["monochromeColor", "statueType", "safeObjects"].includes(key))
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(" · ") : String(value)}`);
}

export function SanctuaireCommandCenter({ snapshot, actor, onSelectTask, command, onError }: Props) {
  const state = getSanctuaireState(snapshot.session.raidState);
  const puzzleProgress = taskProgress(snapshot.tasks, [...SANCTUAIRE_GROUPS.puzzles]);
  const guardianProgress = taskProgress(snapshot.tasks, [...SANCTUAIRE_GROUPS.guardians]);
  const finalProgress = taskProgress(snapshot.tasks, [...SANCTUAIRE_GROUPS.finalVictories]);
  const [lifeCause, setLifeCause] = useState("Erreur confirmée en jeu");
  const [corridorTarget, setCorridorTarget] = useState(state.corridorTarget);
  const [targetConfirmed, setTargetConfirmed] = useState(state.corridorTargetSourceStatus === "LIVE_CONFIRMED");
  const [assignmentParticipant, setAssignmentParticipant] = useState("");
  const [assignmentRoom, setAssignmentRoom] = useState(1);
  const [assignmentSlot, setAssignmentSlot] = useState(1);
  const canManage = actor.role === "CAPTAIN" || actor.role === "EDITOR";
  const canSetTarget = actor.role === "CAPTAIN";

  const activePhase = useMemo(() => {
    if (finalProgress.completed > 0 || byDefinition(snapshot, "S4-QUE-010")?.status !== "LOCKED") return "FINALE";
    if (state.corridorCompleted > 0 || byDefinition(snapshot, "S3-COR-010")?.status !== "LOCKED") return "CORRIDOR";
    if (guardianProgress.completed > 0 || byDefinition(snapshot, "S2-VEI-010")?.status !== "LOCKED") return "GARDIENS";
    return "ÉNIGMES";
  }, [finalProgress.completed, guardianProgress.completed, snapshot, state.corridorCompleted]);

  async function safe(body: Record<string, unknown>) {
    try { await command(body); }
    catch (cause) { onError(cause instanceof Error ? cause.message : "Commande refusée."); }
  }

  return (
    <section className="sanctuaire-workspace" data-testid="sanctuaire-command-center">
      <GardenRoute activePhase={activePhase} puzzle={`${puzzleProgress.completed} / ${puzzleProgress.total} · en cours`} guardians={`${guardianProgress.completed} / ${guardianProgress.total}`} corridor={`${state.corridorCompleted} / ${state.corridorTarget}`} final={`${finalProgress.completed} / ${finalProgress.total}`} raidLife={state.raidLife} lastCause={state.raidLifeHistory.at(-1)?.cause}/>
      {canManage&&<details className="life-adjust material-sheet"><summary><RaidIcon name="life"/>Corriger les vies du raid</summary><div className="life-controls"><input aria-label="Cause de la modification des vies" value={lifeCause} onChange={(event)=>setLifeCause(event.target.value)}/><button className="danger" onClick={()=>void safe({type:"ADJUST_RAID_LIFE",delta:-1,cause:lifeCause})}>−1 vie</button><button className="secondary" onClick={()=>void safe({type:"ADJUST_RAID_LIFE",delta:1,cause:lifeCause})}>+1 vie</button></div></details>}

      <div className="sanctuaire-section-head"><div><span className="kicker">Jardins actifs</span><h2>Quatre énigmes, une circulation visible</h2></div><StatusStamp tone="active">{puzzleProgress.completed}/{puzzleProgress.total} confirmées</StatusStamp></div>
      <div className="puzzle-quartet">
        {PUZZLES.map((item) => {
          const task = byDefinition(snapshot, item.id);
          const confirmation = task ? taskConfirmation(task.resultData) : null;
          const displayValue = task?.resultData.monochromeColor ?? task?.resultData.statueType ?? task?.resultData.hits ?? null;
          return <PuzzleWorkbench key={item.id} label={item.eyebrow} title={item.title} status={statusLabel(task)} summary={displayValue?String(displayValue):item.summary} transfer={item.transfer} confirmed={confirmation?.status==="CONFIRMED"||task?.status==="COMPLETED"} className={`status-${task?.status??"LOCKED"}`} onClick={()=>task&&onSelectTask(task.id)} footer={<><span>{confirmation?.status==="PENDING"?"Une seconde lecture est requise":confirmation?.status==="CONFIRMED"?"Donnée vérifiée":"Ouvrir l’atelier"}</span><RaidIcon name="chevron"/></>}/>;
        })}
      </div>

      <div className="guardian-gates" aria-label="Gardiens et données transférées">
        {GUARDIANS.map((item) => {
          const task = byDefinition(snapshot, item.id);
          const gate = byDefinition(snapshot, item.gate);
          const values = transferredValues(gate);
          return <button key={item.id} className={`guardian-gate status-${task?.status??gate?.status??"LOCKED"}`} onClick={()=>onSelectTask((gate??task)!.id)}><RaidIcon name="guardian"/><span><strong>{item.title}</strong><small>{values.length?values.join(" · "):"Attend une transmission confirmée"}</small></span><span className="status">{statusLabel(task??gate)}</span></button>;
        })}
      </div>

      <CorridorRibbon completed={state.corridorCompleted} target={state.corridorTarget} sourceStatus={state.corridorTargetSourceStatus} controls={<div className="button-row"><button className="secondary" disabled={state.corridorCompleted<=0} onClick={()=>void safe({type:"INCREMENT_CORRIDOR",delta:-1})}>−1</button><button className="primary" disabled={state.corridorCompleted>=state.corridorTarget} onClick={()=>void safe({type:"INCREMENT_CORRIDOR",delta:1})}>Combat confirmé +1</button></div>} configuration={<>{canSetTarget&&<div className="corridor-config">
          <label>Objectif configurable</label>
          <input type="number" min={1} max={500} value={corridorTarget} onChange={(event) => setCorridorTarget(Number(event.target.value))} />
          <label className="checkbox"><input type="checkbox" checked={targetConfirmed} onChange={(event) => setTargetConfirmed(event.target.checked)} /> Confirmé dans le client</label>
          <button className="secondary" onClick={() => void safe({ type: "SET_CORRIDOR_TARGET", target: corridorTarget, confirmedInGame: targetConfirmed })}>Enregistrer l’objectif</button>
        </div>}{canManage && <div className="corridor-assignment-form">
          <select aria-label="Joueur du corridor" value={assignmentParticipant} onChange={(event) => setAssignmentParticipant(event.target.value)}>
            <option value="">Choisir un joueur</option>
            {snapshot.participants.filter((participant) => participant.role !== "SPECTATOR").map((participant) => <option key={participant.id} value={participant.id}>{participant.displayName}</option>)}
          </select>
          <input aria-label="Salle" type="number" min={1} value={assignmentRoom} onChange={(event) => setAssignmentRoom(Number(event.target.value))} />
          <input aria-label="Slot" type="number" min={1} value={assignmentSlot} onChange={(event) => setAssignmentSlot(Number(event.target.value))} />
          <button className="secondary" disabled={!assignmentParticipant} onClick={() => void safe({ type: "SET_CORRIDOR_ASSIGNMENT", participantId: assignmentParticipant, room: assignmentRoom, slot: assignmentSlot, status: "ASSIGNED" })}>Affecter</button>
        </div>}</>} assignments={<div className="assignment-list">
          {state.corridorAssignments.map((assignment) => {
            const participant = snapshot.participants.find((item) => item.id === assignment.participantId);
            return <span key={`${assignment.participantId}-${assignment.room}-${assignment.slot}`}>{participant?.displayName ?? "Joueur"} · salle {assignment.room} / {assignment.slot} · {assignment.status}</span>;
          })}
        </div>} bosses={<div className="final-boss-split" data-testid="final-boss-split">
        <BossColumn snapshot={snapshot} title="Reine Écarlate" prepId="S4-QUE-010" victoryId="S4-QUE-050" onSelectTask={onSelectTask} />
        <BossColumn snapshot={snapshot} title="Princesse Maudite" prepId="S4-PRI-010" victoryId="S4-PRI-050" onSelectTask={onSelectTask} />
      </div>}/>
      <div className="common-finish">Les deux victoires sont requises · {finalProgress.completed}/{finalProgress.total} confirmées</div>
    </section>
  );
}

function BossColumn({ snapshot, title, prepId, victoryId, onSelectTask }: {
  snapshot: SessionSnapshot; title: string; prepId: string; victoryId: string; onSelectTask: (taskId: string) => void;
}) {
  const prep = byDefinition(snapshot, prepId);
  const victory = byDefinition(snapshot, victoryId);
  const team = snapshot.teams.find((item) => item.id === prep?.assignedTeamId);
  return <div className={`boss-column status-${victory?.status ?? prep?.status ?? "LOCKED"}`}>
    <div className="module-top"><span className="eyebrow">BOSS FINAL</span><span className="status">{statusLabel(victory ?? prep)}</span></div>
    <h3>{title}</h3>
    <p>{team ? `Équipe: ${team.name}` : "Équipe non attribuée"}</p>
    <div className="button-row"><button className="secondary" onClick={() => prep && onSelectTask(prep.id)}>Préparation</button><button className="primary" onClick={() => victory && onSelectTask(victory.id)}>Combat</button></div>
  </div>;
}
