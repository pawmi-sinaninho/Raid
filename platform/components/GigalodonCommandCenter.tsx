"use client";

import { useMemo, useState } from "react";
import type { ParticipantRecord, SessionSnapshot, TaskInstanceRecord } from "@/src/core/types";
import {
  GIGALODON_RESOURCE_KEYS,
  calculateFragmentChance,
  calculateLightRefillCost,
  calculateResourceScore,
  effectiveLightLevel,
  finalReadinessSummary,
  getGigalodonFloorLocation,
  getGigalodonState
} from "@/src/core/gigalodon";
import { DepthRoute } from "@/components/gigalodon/DepthRoute";
import { LightBay } from "@/components/gigalodon/LightBay";
import { CargoManifest } from "@/components/gigalodon/CargoManifest";
import { FinalClearance } from "@/components/gigalodon/FinalClearance";
import { SharedSaltPool } from "@/components/gigalodon/SharedSaltPool";
import { RaidIcon } from "@/components/icons/RaidIcon";
import { StatusStamp } from "@/components/layout/StatusStamp";
import { displayContractKeyFr, displayContractValueFr } from "@/components/presentation/frenchDefinition";

interface Props {
  snapshot: SessionSnapshot;
  actor: ParticipantRecord;
  onSelectTask: (taskId: string) => void;
  command: (body: Record<string, unknown>) => Promise<unknown>;
  onError: (message: string) => void;
  now: number;
}

const FLOOR_TASKS = [
  { floor: -1, label: "Avant-poste", task: "G1-020", gate: "G1-040" },
  { floor: -2, label: "Mureine", task: "G2-020", gate: "G2-040" },
  { floor: -3, label: "Luminarium", task: "G3-030", gate: "G3-030" },
  { floor: -4, label: "Exécrabe", task: "G4-040", gate: "G4-050" },
  { floor: -5, label: "Fragments", task: "G5-030", gate: "G5-040" },
  { floor: -6, label: "Willorque", task: "G6-030", gate: "G6-030" },
  { floor: 0, label: "Gigalodon", task: "GG-020", gate: "GG-050" }
] as const;

function byDefinition(snapshot: SessionSnapshot, id: string) {
  return snapshot.tasks.find((task) => task.definitionId === id);
}

function taskStatus(task?: TaskInstanceRecord) {
  return task?.status ?? "LOCKED";
}

export function GigalodonCommandCenter({ snapshot, actor, onSelectTask, command, onError, now }: Props) {
  const state = getGigalodonState(snapshot.session.raidState);
  const canManage = actor.role === "CAPTAIN" || actor.role === "EDITOR";
  const isCaptain = actor.role === "CAPTAIN";
  const [selectedFloor, setSelectedFloor] = useState(-1);
  const [lightLevel, setLightLevel] = useState(4);
  const [activeFights, setActiveFights] = useState(state.finalReadiness.activeFights);
  const [finalTeamReady, setFinalTeamReady] = useState(state.finalReadiness.finalTeamReady);
  const [damage, setDamage] = useState(state.final.totalDamage);
  const [round, setRound] = useState(state.final.combatRound);
  const [groupTarget, setGroupTarget] = useState(state.floor1GroupTarget);
  const [groupTargetConfirmed, setGroupTargetConfirmed] = useState(state.floor1GroupTargetSourceStatus === "LIVE_CONFIRMED");
  const [saltDelta, setSaltDelta] = useState(1);
  const [saltCause, setSaltCause] = useState("Sel collecté et confirmé");
  const [saltResponsible, setSaltResponsible] = useState(actor.id);

  const summary = finalReadinessSummary(state);
  const fragmentChance = calculateFragmentChance(snapshot.definition, state.confirmedScore);
  const floor1 = (state.floorStates["-1"] ?? {}) as Record<string, unknown>;
  const groupsCompleted = Number(floor1.groupsCompleted ?? 0);
  const activeFloor = FLOOR_TASKS.find((floor) => {
    const task = byDefinition(snapshot, floor.task);
    return task && ["READY", "CLAIMED", "ACTIVE", "WAITING", "BLOCKED"].includes(task.status);
  }) ?? FLOOR_TASKS.at(-1)!;
  const lightReadings = [-1,-2,-3,-4,-5].map((floor) => {
    const light = state.lightStates.find((item) => item.floor === floor);
    const level = light ? effectiveLightLevel(light, now) : null;
    const remainingSeconds = light ? Math.max(0, Math.ceil((new Date(light.nextDecayAt).getTime() - now) / 1000)) : null;
    const remaining = remainingSeconds === null ? "inconnu" : `${String(Math.floor(remainingSeconds/60)).padStart(2,"0")}:${String(remainingSeconds%60).padStart(2,"0")}`;
    return { floor, level, baseline: light?.baselineLevel ?? (floor === -1 ? 4 : 1), sourceStatus: light?.baselineSourceStatus ?? "GUIDE_CONFIRMED", remaining, responsible: light?.responsibleParticipantId ? snapshot.participants.find((participant)=>participant.id===light.responsibleParticipantId)?.displayName ?? "Responsable inconnu" : "Aucun responsable" };
  });
  const cargoRows = state.participantInventories.map((inventory)=>{
    const participant=snapshot.participants.find((item)=>item.id===inventory.participantId);
    const score=calculateResourceScore(snapshot.definition,inventory.resources);
    const unique=[inventory.resources.uniteMureine>0&&"Mureine",inventory.resources.rancuneExecrabe>0&&"Rancune",inventory.resources.noirceurWillorque>0&&"Noirceur",inventory.resources.pinceExecrabe>0&&"Pince"].filter(Boolean).join(" · ");
    return {name:participant?.displayName??"Joueur",floor:inventory.currentFloor===null?"?":String(inventory.currentFloor),score:score.toLocaleString("fr-CH"),age:`${Math.max(0,Math.floor((now-new Date(inventory.lastConfirmedAt).getTime())/60000))} min`,unique};
  });
  const holderName=(id:string|null)=>id?snapshot.participants.find((participant)=>participant.id===id)?.displayName??"Porteur inconnu":"Non obtenue";
  const selectedLight = state.lightStates.find((item) => item.floor === selectedFloor);
  const selectedEffectiveLevel = selectedLight ? effectiveLightLevel(selectedLight, now) : 0;
  const selectedRefillCost = calculateLightRefillCost(snapshot.definition, selectedEffectiveLevel, lightLevel);
  const selectedLocation = getGigalodonFloorLocation(snapshot.definition, selectedFloor);
  const participantName = (id:string) => snapshot.participants.find((participant) => participant.id === id)?.displayName ?? "Joueur inconnu";
  const lastSaltChange = state.saltPool.lastChange
    ? `${state.saltPool.lastChange.before} → ${state.saltPool.lastChange.after} · ${state.saltPool.lastChange.cause} · ${state.saltPool.lastChange.actorParticipantId ? participantName(state.saltPool.lastChange.actorParticipantId) : "migration système"} · ${new Date(state.saltPool.lastChange.createdAt).toLocaleString("fr-CH")}`
    : "Aucune variation enregistrée";

  async function safe(body: Record<string, unknown>) {
    try { await command(body); }
    catch (cause) { onError(cause instanceof Error ? cause.message : "Commande refusée."); }
  }

  return (
    <section className="gigalodon-workspace" data-testid="gigalodon-command-center">
      <div className="gigalodon-layout">
        <DepthRoute nodes={FLOOR_TASKS.map((floor)=>{const task=byDefinition(snapshot,floor.task);const reading=lightReadings.find((item)=>item.floor===floor.floor);return {floor:floor.floor,label:floor.label,status:taskStatus(task),active:activeFloor.floor===floor.floor,lightLevel:reading?.level??null,remaining:reading?.remaining??null,onClick:()=>task&&onSelectTask(task.id)};})}/>
        <div className="gigalodon-workbench">
          <section className="situation-strap material-sheet"><div><span className="kicker">Situation actuelle</span><h2>{activeFloor.label} retient la descente</h2></div><div className="situation-cell"><strong>{state.confirmedScore.toLocaleString("fr-CH")}</strong><span>sécurisés</span></div><div className="situation-cell risk"><strong>{state.projectedUnbankedScore.toLocaleString("fr-CH")}</strong><span>encore portés</span></div><div className="situation-cell"><strong>{Object.values(state.fragments).filter(Boolean).length}/4</strong><span>fragments</span></div><div className="situation-cell"><strong>{fragmentChance}%</strong><span>chance fragment</span><StatusStamp tone="source">Calcul définition</StatusStamp></div></section>
          <details className="floor-progress-strap material-sheet" data-testid="gigalodon-floor-progress"><summary><span><b>Étage −1</b> · {groupsCompleted}/{state.floor1GroupTarget} groupes confirmés</span>{state.floor1GroupTargetSourceStatus!=="LIVE_CONFIRMED"&&<StatusStamp tone="source">18 ou 20 · non confirmé en jeu</StatusStamp>}</summary><div className="floor-progress-controls"><p>Divergence non bloquante: vérifier le nombre pertinent dans le jeu; le capitaine peut poursuivre avec la valeur configurée.</p><div className="button-row">{canManage&&<><button className="secondary" disabled={groupsCompleted<=0} onClick={()=>void safe({type:"INCREMENT_GIGALODON_FLOOR_GROUPS",delta:-1})}>−1</button><button className="primary" disabled={groupsCompleted>=state.floor1GroupTarget} onClick={()=>void safe({type:"INCREMENT_GIGALODON_FLOOR_GROUPS",delta:1})}>Groupe vaincu +1</button></>}</div>{isCaptain&&<div className="button-row"><input aria-label="Objectif de groupes" type="number" min={1} max={100} value={groupTarget} onChange={(event)=>setGroupTarget(Number(event.target.value))}/><label className="checkbox"><input type="checkbox" checked={groupTargetConfirmed} onChange={(event)=>setGroupTargetConfirmed(event.target.checked)}/>Confirmé dans le client</label><button className="secondary" onClick={()=>void safe({type:"SET_GIGALODON_FLOOR1_TARGET",target:groupTarget,confirmedInGame:groupTargetConfirmed})}>Enregistrer l’objectif</button></div>}</div></details>
          <div className="gigalodon-instrument-grid">
            <LightBay readings={lightReadings} unconfirmed={state.lightIntervalSourceStatus!=="LIVE_CONFIRMED"||state.saltCostSourceStatus!=="LIVE_CONFIRMED"} controls={canManage?<div className="light-controls"><select value={selectedFloor} onChange={(event)=>setSelectedFloor(Number(event.target.value))}>{[-1,-2,-3,-4,-5].map((floor)=><option key={floor} value={floor}>Étage {floor}</option>)}</select><select value={lightLevel} onChange={(event)=>setLightLevel(Number(event.target.value))}>{[0,1,2,3,4].map((level)=><option key={level} value={level}>Niveau {level}</option>)}</select><button className="secondary" disabled={lightLevel>selectedEffectiveLevel} onClick={()=>void safe({type:"SET_GIGALODON_LIGHT",floor:selectedFloor,level:lightLevel,intervalSeconds:state.lightIntervalSeconds,intervalSourceStatus:state.lightIntervalSourceStatus,saltCostSourceStatus:state.saltCostSourceStatus})}>Confirmer une observation</button><button className="primary" disabled={!selectedLight||selectedRefillCost<=0||selectedRefillCost>state.saltPool.amount} onClick={()=>void safe({type:"REFILL_GIGALODON_LIGHT",floor:selectedFloor,targetLevel:lightLevel,responsibleParticipantId:saltResponsible})}>Recharger · {selectedRefillCost} sel</button></div>:undefined}/>
            <SharedSaltPool amount={state.saltPool.amount} lastChange={lastSaltChange} collectors={state.saltPool.collectorParticipantIds.map(participantName)} refillers={state.saltPool.refillerParticipantIds.map(participantName)} nextCost={selectedRefillCost} controls={canManage?<div className="salt-controls"><input aria-label="Variation du sel commun" type="number" value={saltDelta} onChange={(event)=>setSaltDelta(Number(event.target.value))}/><input aria-label="Cause de la variation du sel" value={saltCause} onChange={(event)=>setSaltCause(event.target.value)}/><select aria-label="Responsable du sel" value={saltResponsible} onChange={(event)=>setSaltResponsible(event.target.value)}>{snapshot.participants.filter((participant)=>participant.role!=="SPECTATOR").map((participant)=><option key={participant.id} value={participant.id}>{participant.displayName}</option>)}</select><button className="primary" disabled={!saltCause.trim()||saltDelta===0} onClick={()=>void safe({type:"ADJUST_GIGALODON_SALT",delta:saltDelta,cause:saltCause,responsibleParticipantId:saltResponsible})}>Enregistrer le sel</button></div>:undefined}/>
            <CargoManifest projected={state.projectedUnbankedScore.toLocaleString("fr-CH")} rows={cargoRows} uniques={[{label:"Unité de Mureine",state:state.bossUniqueDrops.mureine.banked?"Déposée":holderName(state.bossUniqueDrops.mureine.holderParticipantId),critical:!state.bossUniqueDrops.mureine.banked&&!!state.bossUniqueDrops.mureine.holderParticipantId},{label:"Rancune d’Exécrabe",state:state.bossUniqueDrops.execrabe.banked?"Déposée":holderName(state.bossUniqueDrops.execrabe.holderParticipantId),critical:!state.bossUniqueDrops.execrabe.banked&&!!state.bossUniqueDrops.execrabe.holderParticipantId},{label:"Noirceur de Willorque",state:state.bossUniqueDrops.willorque.banked?"Déposée":holderName(state.bossUniqueDrops.willorque.holderParticipantId),critical:!state.bossUniqueDrops.willorque.banked&&!!state.bossUniqueDrops.willorque.holderParticipantId},{label:"Pince d’Exécrabe",state:holderName(state.pinceHolder),critical:!!state.pinceHolder}]}/>
          </div>
          <section className="floor-location-sheet material-sheet" data-testid="gigalodon-floor-locations"><span className="kicker">Positions documentées · étage {selectedFloor}</span>{selectedLocation ? Object.entries(selectedLocation).map(([label,value])=><p key={label}><b>{displayContractKeyFr(label)} :</b> {displayContractValueFr(value)}</p>) : <p>Position inconnue · aucune valeur estimée.</p>}</section>
          <FinalClearance blocked={summary.blocked} unconfirmed={summary.unconfirmed} ready={summary.ready} controls={isCaptain&&snapshot.session.status!=="FINAL_ACTIVE"&&snapshot.session.status!=="ENDED"?<div className="final-controls"><label>Combats actifs<input type="number" min={0} max={20} value={activeFights} onChange={(event)=>setActiveFights(Number(event.target.value))}/></label><label className="checkbox"><input type="checkbox" checked={finalTeamReady} onChange={(event)=>setFinalTeamReady(event.target.checked)}/>Équipe finale prête</label><button className="secondary" onClick={()=>void safe({type:"CONFIRM_GIGALODON_FINAL_READINESS",activeFights,activeFightsRuleSourceStatus:"LIVE_REQUIRED",finalTeamReady,captainConfirmed:true})}>Continuer en connaissance de cause</button><button className="primary" disabled={!state.finalReadiness.captainConfirmed||Boolean(state.final.startedAt)} onClick={()=>void safe({type:"START_GIGALODON_FINAL",preparationSeconds:180})}><RaidIcon name="depth"/>Démarrer Gigalodon</button></div>:undefined}/>

          <section className="soft-warning-list material-sheet" data-testid="gigalodon-soft-warnings"><span className="kicker">Questions à vérifier pendant le pilote</span>{[
            "D’autres combats pourraient empêcher le départ du Gigalodon · vérifier en jeu · le capitaine peut continuer",
            "18 ou 20 groupes pertinentes · utiliser la cible configurée",
            "Perte des ressources uniques · ne rien supprimer automatiquement sans observation",
            "Bornes exactes des fragments · estimation issue du guide",
            "Expiration du timer et déconnexion · consigner le comportement observé",
            "Changement de capitaine et droits externes · vérifier dans le raid réel"
          ].map((warning)=><p key={warning}><StatusStamp tone="source">Non confirmé en jeu</StatusStamp>{warning}</p>)}</section>

          {(snapshot.session.status === "FINAL_ACTIVE" || state.final.startedAt) && <div className="panel final-tracker" data-testid="gigalodon-final-tracker">
            <div className="section-head"><div><div className="eyebrow">Combat final</div><h2>{state.final.result ? `Résultat · ${state.final.result}` : "Trois tours de dégâts"}</h2></div><strong className="metric-value">+{state.final.projectedBonusScore.toLocaleString("fr-CH")}</strong></div>
            <div className="final-damage-grid"><Metric label="Résultat" value={state.final.result ?? "En cours"} /><Metric label="Dégâts totaux" value={state.final.totalDamage.toLocaleString("fr-CH")} /><Metric label="Tours enregistrés" value={state.final.damageRounds.map((entry)=>`T${entry.round}: ${entry.cumulativeDamage.toLocaleString("fr-CH")}`).join(" · ")||"—"} /><Metric label="Score des ressources" value={(state.final.confirmedResourceScore??state.confirmedScore).toLocaleString("fr-CH")} /><Metric label="Bonus final" value={(state.final.finalBonusScore??state.final.projectedBonusScore).toLocaleString("fr-CH")} /><Metric label="Score total" value={(state.final.totalScore??state.confirmedScore+state.final.projectedBonusScore).toLocaleString("fr-CH")} /></div>
            <div className="final-controls">
              <select value={round} onChange={(event) => setRound(Number(event.target.value))}>{[1,2,3].map((value) => <option key={value} value={value}>Tour {value}</option>)}</select>
              <input type="number" min={0} value={damage} onChange={(event) => setDamage(Number(event.target.value))} aria-label="Dégâts totaux" />
              <button className="secondary" disabled={Boolean(state.final.result)} onClick={() => void safe({ type: "UPDATE_GIGALODON_FINAL", combatRound: round, totalDamage: damage, completed: false })}>Actualiser</button>
              <button className="primary" disabled={Boolean(state.final.result)} onClick={() => void safe({ type: "UPDATE_GIGALODON_FINAL", combatRound: round, totalDamage: damage, completed: true, result: "VICTORY" })}>Victoire</button>
              <button className="danger" disabled={Boolean(state.final.result)} onClick={() => void safe({ type: "UPDATE_GIGALODON_FINAL", combatRound: round, totalDamage: damage, completed: true, result: "DEFEAT" })}>Défaite</button>
              {isCaptain && <button className="secondary" disabled={!state.final.result} onClick={() => void safe({ type: "FINISH_GIGALODON_RAID" })}>Clôturer le raid</button>}
            </div>
          </div>}
        </div>
      </div>
    </section>
  );
}

export function GigalodonParticipantPanel({ snapshot, actor, command, onError }: Omit<Props, "onSelectTask" | "now">) {
  const state = getGigalodonState(snapshot.session.raidState);
  const inventory = state.participantInventories.find((item) => item.participantId === actor.id);
  const [floor, setFloor] = useState(inventory?.currentFloor ?? -1);
  const [resources, setResources] = useState<Record<string, number>>(() => Object.fromEntries(GIGALODON_RESOURCE_KEYS.map((key) => [key, inventory?.resources[key] ?? 0])));
  const score = calculateResourceScore(snapshot.definition, resources);
  async function safe(body: Record<string, unknown>) {
    try { await command(body); }
    catch (cause) { onError(cause instanceof Error ? cause.message : "Commande refusée."); }
  }
  const important = ["quartz", "onyx", "uniteMureine", "rancuneExecrabe", "noirceurWillorque", "pinceExecrabe"];
  return <section className="panel participant-inventory" data-testid="gigalodon-participant-inventory">
    <div className="section-head"><div><div className="eyebrow">MON INVENTAIRE</div><h2>{score.toLocaleString("fr-CH")} points non sécurisés</h2></div><span className="source-label">À CONFIRMER</span></div>
    <div className="shared-salt-summary" data-testid="participant-shared-salt"><span>Sel commun du raid</span><strong>{state.saltPool.amount}</strong><small>Le sel n’appartient à aucun inventaire personnel.</small></div>
    <label>Étage<select value={floor} onChange={(event) => setFloor(Number(event.target.value))}>{[0,-1,-2,-3,-4,-5,-6].map((value) => <option key={value} value={value}>{value === 0 ? "Avant-poste" : `Étage ${value}`}</option>)}</select></label>
    <div className="inventory-inputs">{important.map((key) => <label key={key}>{key}<input type="number" min={0} value={resources[key] ?? 0} onChange={(event) => setResources((current) => ({ ...current, [key]: Math.max(0, Number(event.target.value)) }))} /></label>)}</div>
    <div className="button-row"><button className="secondary" onClick={() => void safe({ type: "UPDATE_GIGALODON_INVENTORY", participantId: actor.id, resources, currentFloor: floor, risk: score > 5000 ? "HIGH" : score > 0 ? "MEDIUM" : "LOW" })}>Aucun changement / confirmer</button><button className="primary" disabled={score <= 0} onClick={() => void safe({ type: "DEPOSIT_GIGALODON_INVENTORY", participantId: actor.id })}>Tout déposer</button></div>
  </section>;
}

function Metric({ label, value, danger = false, unconfirmed = false }: { label: string; value: string; danger?: boolean; unconfirmed?: boolean }) {
  return <div className={`giga-metric ${danger ? "danger" : ""}`}><span>{label}</span><strong>{value}</strong>{unconfirmed && <small>NON CONFIRMÉ EN JEU</small>}</div>;
}

function Unique({ label, holder, banked, snapshot }: { label: string; holder: string | null; banked: boolean; snapshot: SessionSnapshot }) {
  return <div className={`unique-card ${banked ? "banked" : holder ? "risk" : "unknown"}`}><span>{label}</span><strong>{banked ? "DÉPOSÉ" : holder ? snapshot.participants.find((p) => p.id === holder)?.displayName ?? "Porteur inconnu" : "NON ATTRIBUÉ"}</strong></div>;
}

function Readiness({ title, items, kind }: { title: string; items: string[]; kind: string }) {
  return <div className={`readiness-group ${kind}`}><strong>{title}</strong>{items.length ? items.map((item) => <span key={item}>{item}</span>) : <span>—</span>}</div>;
}
