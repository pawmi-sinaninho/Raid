"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  ParticipantRecord,
  SessionSnapshot,
  TaskInstanceRecord,
  TaskStatus
} from "@/src/core/types";
import { derivePersonalMission } from "@/src/core/mission";
import { deriveCaptainRadar } from "@/src/core/radar";
import { getInformationReports } from "@/src/core/raid-state";
import { getSanctuaireState, isSanctuaire, taskConfirmation } from "@/src/core/sanctuaire";
import { SanctuaireCommandCenter } from "./SanctuaireCommandCenter";
import { GigalodonCommandCenter, GigalodonParticipantPanel } from "./GigalodonCommandCenter";
import { deriveGigalodonMissionContext, getGigalodonState, isGigalodon } from "@/src/core/gigalodon";
import { RaidweaveMark } from "@/components/brand/RaidweaveMark";
import { RaidIcon, type RaidIconName } from "@/components/icons/RaidIcon";
import { BriefingTicket } from "@/components/lobby/BriefingTicket";
import { FormationBoard } from "@/components/lobby/FormationBoard";
import { DepartureGate } from "@/components/lobby/DepartureGate";
import { MissionOrder } from "@/components/participant/MissionOrder";
import { NextOrderSlip } from "@/components/participant/NextOrderSlip";
import { SoloTestButton } from "@/components/solo-test/SoloTestButton";
import { PinnedNote } from "@/components/layout/PinnedNote";
import { PinnedNoteStack } from "@/components/layout/PinnedNoteStack";
import { radarItemFr, taskSummaryFr } from "@/components/presentation/frenchMicrocopy";
import { deriveWowLayer } from "@/src/core/wow-layer";
import { WowLayerPanel } from "@/components/wow/WowLayerPanel";

interface Credentials { participantId: string; recoveryToken: string }
type MainTab = "mission" | "raid" | "team" | "messages";

const STATUS_LABELS: Record<TaskStatus, string> = {
  LOCKED: "VerrouillÃ©e",
  READY: "PrÃªte",
  CLAIMED: "AttribuÃ©e",
  ACTIVE: "Active",
  WAITING: "En attente",
  BLOCKED: "BloquÃ©e",
  FAILED: "Ã‰chouÃ©e",
  COMPLETED: "TerminÃ©e",
  SKIPPED: "IgnorÃ©e"
};

function useClock(interval = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), interval);
    return () => window.clearInterval(timer);
  }, [interval]);
  return now;
}

function formatTimer(snapshot: SessionSnapshot, now: number): string {
  const started = snapshot.session.timerStartedAt;
  const remaining = started
    ? Math.max(0, snapshot.session.timerDurationSeconds * 1000 - (now - new Date(started).getTime()))
    : snapshot.session.timerDurationSeconds * 1000;
  const total = Math.floor(remaining / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return hours > 0
    ? `${String(hours).padStart(2,"0")}:${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`
    : `${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`;
}

export function SessionApp({ sessionId }: { sessionId: string }) {
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [connection, setConnection] = useState<"online" | "reconnecting" | "offline">("reconnecting");
  const [tab, setTab] = useState<MainTab>("raid");
  const cursorRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const tabInitializedRef = useRef(false);
  const now = useClock();

  useEffect(() => {
    const raw = localStorage.getItem(`raidweave:${sessionId}`);
    if (!raw) {
      setError("Aucune identitÃ© locale pour cette session. Ouvrez Ã  nouveau votre lien dâ€™invitation.");
      return;
    }
    try { setCredentials(JSON.parse(raw)); }
    catch { setError("Les donnÃ©es locales de rÃ©cupÃ©ration sont invalides."); }
  }, [sessionId]);

  const authHeaders = useCallback((): Record<string,string> => {
    if (!credentials) return {};
    return { "x-participant-id": credentials.participantId, "x-recovery-token": credentials.recoveryToken };
  }, [credentials]);

  const refresh = useCallback(async () => {
    if (!credentials) return;
    try {
      const response = await fetch(`/api/sessions/${sessionId}/snapshot?cursor=0`, { headers: authHeaders(), cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message ?? "Synchronisation impossible.");
      setSnapshot(body);
      cursorRef.current = body.session.revision;
      setConnection("online");
      setError("");
    } catch (cause) {
      setConnection("offline");
      setError(cause instanceof Error ? cause.message : "Synchronisation impossible.");
    }
  }, [authHeaders, credentials, sessionId]);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    if (tabInitializedRef.current || !snapshot || !credentials) return;
    const currentActor = snapshot.participants.find((participant) => participant.id === credentials.participantId);
    if (!currentActor) return;
    setTab(currentActor.role === "PARTICIPANT" ? "mission" : "raid");
    tabInitializedRef.current = true;
  }, [credentials, snapshot]);

  useEffect(() => {
    if (!credentials) return;
    const controller = new AbortController();
    abortRef.current = controller;
    let stopped = false;
    const connect = async () => {
      while (!stopped) {
        try {
          setConnection("reconnecting");
          const response = await fetch(`/api/sessions/${sessionId}/events?cursor=${cursorRef.current}`, {
            headers: authHeaders(), signal: controller.signal, cache: "no-store"
          });
          if (!response.ok || !response.body) throw new Error("Flux de synchronisation indisponible");
          setConnection("online");
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          while (!stopped) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const chunks = buffer.split("\n\n");
            buffer = chunks.pop() ?? "";
            for (const chunk of chunks) {
              const idLine = chunk.split("\n").find((line) => line.startsWith("id:"));
              if (idLine) cursorRef.current = Number(idLine.slice(3).trim()) || cursorRef.current;
              if (chunk.includes("event: domain-event")) await refresh();
            }
          }
        } catch (cause) {
          if (controller.signal.aborted) break;
          setConnection("offline");
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    };
    void connect();
    return () => { stopped = true; controller.abort(); };
  }, [authHeaders, credentials, refresh, sessionId]);

  const command = useCallback(async (body: Record<string, unknown>) => {
    setError("");
    const response = await fetch(`/api/sessions/${sessionId}/commands`, {
      method: "POST",
      headers: { "content-type": "application/json", ...authHeaders() },
      body: JSON.stringify(body)
    });
    const payload = await response.json();
    if (!response.ok) {
      const failure = new Error(payload.error?.message ?? "Commande refusÃ©e.") as Error & { details?: unknown };
      failure.details = payload.error?.details;
      throw failure;
    }
    await refresh();
    return payload.result;
  }, [authHeaders, refresh, sessionId]);

  const startSoloTest = useCallback(async () => {
    setError("");
    const response = await fetch(`/api/sessions/${sessionId}/solo-test`, {
      method: "POST",
      headers: authHeaders()
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error?.message ?? "Le test solo nâ€™a pas pu dÃ©marrer.");
    await refresh();
  }, [authHeaders, refresh, sessionId]);

  if (error && !snapshot) {
    return <main className="public-shell"><div className="error" role="alert">{error}</div></main>;
  }
  if (!snapshot || !credentials) {
    return <main className="public-shell"><div className="panel">Chargement du command centerâ€¦</div></main>;
  }

  const actor = snapshot.participants.find((participant) => participant.id === credentials.participantId);
  if (!actor) return <main className="public-shell"><div className="error">IdentitÃ© introuvable.</div></main>;
  const selectedTask = snapshot.tasks.find((task) => task.id === selectedTaskId) ?? null;
  const isCaptainView = actor.role === "CAPTAIN" || actor.role === "EDITOR" || actor.role === "SPECTATOR";
  const theme = snapshot.definition.slug.includes("gigalodon") ? "gigalodon" : "sanctuaire";
  const events = snapshot.events.slice(-3).reverse();

  return (
    <div className={`raid-shell ${theme}`}>
      <header className="raid-header">
        <div className="header-brand"><RaidweaveMark compact /></div>
        <div className="header-main">
          <div className="header-title">{snapshot.definition.names.fr}</div>
          <div className="header-meta">{snapshot.session.status} Â· rÃ©vision {snapshot.session.revision}</div>
        </div>
        <div className="timer" aria-label="Temps restant">{formatTimer(snapshot, now)}</div>
        <div className="header-metrics">
          {isSanctuaire(snapshot.definition) && <div className="metric"><span>Vies</span><strong>{getSanctuaireState(snapshot.session.raidState).raidLife}/20</strong></div>}
          {isGigalodon(snapshot.definition) && <div className="metric"><span>Score</span><strong>{getGigalodonState(snapshot.session.raidState).confirmedScore.toLocaleString("fr-CH")}</strong></div>}
          {isGigalodon(snapshot.definition) && <div className="metric"><span>Ã€ risque</span><strong>{getGigalodonState(snapshot.session.raidState).projectedUnbankedScore.toLocaleString("fr-CH")}</strong></div>}
          {isGigalodon(snapshot.definition) && <div className="metric"><span>Sel commun</span><strong>{getGigalodonState(snapshot.session.raidState).saltPool.amount}</strong></div>}
          <div className="metric"><span>Participants</span><strong>{snapshot.participants.filter((p) => p.role !== "SPECTATOR").length}/{snapshot.definition.participation.maximum}</strong></div>
          <div className={`connection ${connection}`}><span>{connection === "online" ? "SynchronisÃ©" : connection === "reconnecting" ? "Synchronisation" : "Hors ligne"}</span></div>
        </div>
      </header>

      <main className="raid-main">
        {error && <div className="error" role="alert" style={{ marginBottom: 12 }}>{error}</div>}
        {snapshot.session.status === "LOBBY" ? (
          <Lobby snapshot={snapshot} actor={actor} command={command} onSoloTest={startSoloTest} onError={setError} />
        ) : tab === "mission" ? (
          <MissionView snapshot={snapshot} actor={actor} onSelectTask={setSelectedTaskId} command={command} onError={setError} />
        ) : tab === "team" ? (
          <TeamView snapshot={snapshot} />
        ) : tab === "messages" ? (
          isCaptainView ? <RadarView items={deriveCaptainRadar(snapshot.definition, snapshot.tasks, snapshot.participants, now, snapshot.session.raidState)} /> : <ParticipantAlertsView snapshot={snapshot} />
        ) : isCaptainView ? (
          <CaptainView snapshot={snapshot} actor={actor} onSelectTask={setSelectedTaskId} now={now} tab={tab} command={command} onError={setError} />
        ) : (
          <ParticipantRaidView snapshot={snapshot} onSelectTask={setSelectedTaskId} />
        )}
      </main>

      {actor.role !== "SPECTATOR" && <InformationCorrectionPanel snapshot={snapshot} actor={actor} command={command} onError={setError} />}

      <div className="activity-strip" aria-label="ActivitÃ© rÃ©cente">
        <strong>ActivitÃ©</strong>
        {events.length ? events.map((event) => <span key={event.id} className="mono">{new Date(event.createdAt).toLocaleTimeString("fr-CH", { hour: "2-digit", minute: "2-digit" })} {event.type}</span>) : <span>Aucun Ã©vÃ©nement</span>}
      </div>

      <nav className="bottom-nav" aria-label="Navigation principale">
        {(["mission","raid","team","messages"] as MainTab[]).map((item) => (
          <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>
            <RaidIcon name={({ mission: "mission", raid: "raid", team: "team", messages: "alerts" } satisfies Record<MainTab, RaidIconName>)[item]} />
            {item === "mission" ? "Mission" : item === "raid" ? "Raid" : item === "team" ? "Ã‰quipe" : "Alertes"}
          </button>
        ))}
      </nav>

      {selectedTask && (
        <TaskDrawer
          snapshot={snapshot}
          actor={actor}
          task={selectedTask}
          onClose={() => setSelectedTaskId(null)}
          command={command}
          onError={setError}
        />
      )}
    </div>
  );
}

function Lobby({ snapshot, actor, command, onSoloTest, onError }: {
  snapshot: SessionSnapshot;
  actor: ParticipantRecord;
  command: (body: Record<string, unknown>) => Promise<unknown>;
  onSoloTest: () => Promise<void>;
  onError: (message: string) => void;
}) {
  const canManage = actor.role === "CAPTAIN" || actor.role === "EDITOR";
  const activeParticipants = snapshot.participants.filter((participant) => participant.role !== "SPECTATOR");
  const hasEditor = activeParticipants.some((participant) => participant.role === "EDITOR");
  const allReady = activeParticipants.length > 0 && activeParticipants.every((participant) => participant.readyState === "READY");
  const enough = activeParticipants.length >= snapshot.definition.participation.minimum;
  const blockers = [!enough && `Minimum ${snapshot.definition.participation.minimum} joueurs`, !hasEditor && "Ã‰diteur de secours manquant", !allReady && "Tous les joueurs ne sont pas prÃªts"].filter(Boolean) as string[];

  async function safe(body: Record<string, unknown>) {
    try { await command(body); } catch (cause) { onError(cause instanceof Error ? cause.message : "Commande refusÃ©e."); }
  }

  return (
    <div className="lobby-layout" data-testid="lobby">
      <BriefingTicket snapshot={snapshot} />
      <FormationBoard snapshot={snapshot} canManage={canManage} onAssign={(participantId,teamId)=>void safe({type:"ASSIGN_PARTICIPANT_TEAM",participantId,teamId})} onCreateTeam={(name)=>void safe({type:"CREATE_TEAM",name})} />
      <DepartureGate ready={activeParticipants.filter((participant)=>participant.readyState==="READY").length} total={activeParticipants.length} enough={enough} hasEditor={hasEditor} canStart={blockers.length===0} isCaptain={actor.role==="CAPTAIN"} actorReady={actor.readyState==="READY"} onToggleReady={()=>void safe({type:"SET_READY",participantId:actor.id,ready:actor.readyState!=="READY"})} onStart={()=>void safe({type:"START_SESSION"})} soloTestAction={actor.role==="CAPTAIN" ? <SoloTestButton onStart={onSoloTest} onError={onError} /> : undefined} inviteTools={<InviteRotation actor={actor} command={command} onError={onError}/>} />
    </div>
  );
}

function InviteRotation({ actor, command, onError }: {
  actor: ParticipantRecord;
  command: (body: Record<string, unknown>) => Promise<unknown>;
  onError: (message: string) => void;
}) {
  const [link, setLink] = useState("");
  if (actor.role !== "CAPTAIN") return null;
  return (
    <div className="stack">
      <button className="ghost" onClick={async () => {
        try {
          const result = await command({ type: "ROTATE_INVITE", role: "PARTICIPANT", scope: {} }) as { urlPath: string };
          setLink(result.urlPath);
        } catch (cause) { onError(cause instanceof Error ? cause.message : "Rotation impossible."); }
      }}>Nouveau lien participant</button>
      {link && <code className="muted" style={{ overflowWrap: "anywhere" }}>{link}</code>}
    </div>
  );
}

function CaptainView({ snapshot, actor, onSelectTask, now, tab, command, onError }: {
  snapshot: SessionSnapshot;
  actor: ParticipantRecord;
  onSelectTask: (taskId: string) => void;
  now: number;
  tab: MainTab;
  command: (body: Record<string, unknown>) => Promise<unknown>;
  onError: (message: string) => void;
}) {
  const radar = useMemo(() => deriveCaptainRadar(snapshot.definition, snapshot.tasks, snapshot.participants, now, snapshot.session.raidState), [snapshot, now]);
  const wowLayer = useMemo(() => deriveWowLayer({
    snapshot,
    actor: { participantId: actor.id, role: actor.role, sessionId: snapshot.session.id, scope: {} },
    serverNowMs: now,
    locale: "fr",
    devicePreferences: { soundMode: "OFF", reducedMotion: false }
  }), [snapshot, actor.id, actor.role, now]);
  if (tab === "team") return <TeamView snapshot={snapshot} />;
  if (tab === "messages") return <RadarView items={radar} />;
  return (
    <div className="captain-layout" data-testid="captain-command-center">
      <div className="captain-primary-stack">
        <WowLayerPanel model={wowLayer} onSelectTask={onSelectTask} />
      {isSanctuaire(snapshot.definition) ? (
        <SanctuaireCommandCenter snapshot={snapshot} actor={actor} onSelectTask={onSelectTask} command={command} onError={onError} />
      ) : isGigalodon(snapshot.definition) ? (
        <GigalodonCommandCenter snapshot={snapshot} actor={actor} onSelectTask={onSelectTask} command={command} onError={onError} now={now} />
      ) : (
        <section className="workspace">
          <div className="panel">
            <div className="section-head"><div><div className="eyebrow">Raid path</div><h2>Ã‰tat de la mission</h2></div><span className="mono">{snapshot.tasks.filter((t) => t.status === "COMPLETED").length}/{snapshot.tasks.length}</span></div>
            <div className="phase-strip">
              {snapshot.definition.phases.slice(0, 8).map((phase) => <span className="phase-pill" key={phase.id}>{phase.names.fr}</span>)}
            </div>
          </div>
          <div className="task-grid">
            {snapshot.tasks.slice(0, 16).map((task) => <TaskCard key={task.id} snapshot={snapshot} task={task} onClick={() => onSelectTask(task.id)} />)}
          </div>
        </section>
      )}
      </div>
      <RadarView items={radar} />
    </div>
  );
}

function TeamView({ snapshot }: { snapshot: SessionSnapshot }) {
  return (
    <section className="panel stack" data-testid="team-view">
      <div><div className="eyebrow">Vue des escouades</div><h2>Ã‰quipes et missions</h2></div>
      <div className="grid-2">
        {snapshot.teams.map((team) => (
          <div className="card" key={team.id}>
            <h3>{team.name}</h3>
            <p className="muted">{snapshot.participants.filter((p) => p.teamId === team.id).map((p) => p.displayName).join(", ") || "Aucun joueur"}</p>
            <p>{snapshot.tasks.filter((task) => task.assignedTeamId === team.id && !["COMPLETED","SKIPPED"].includes(task.status)).length} tÃ¢ches ouvertes</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function RadarView({ items }: { items: ReturnType<typeof deriveCaptainRadar> }) {
  const localizedItems = items.map(radarItemFr);
  return (
    <div data-testid="captain-radar">
      <PinnedNoteStack eyebrow="Carnet du capitaine" title="Ce qui demande une dÃ©cision" footer="Les alertes suivent uniquement lâ€™Ã©tat confirmÃ©.">
        {localizedItems.length ? localizedItems.slice(0,5).map((item)=><PinnedNote key={item.id} title={item.title} level={item.level}><p>{item.impact}</p></PinnedNote>) : <PinnedNote title="Rien ne bloque la prochaine Ã©tape" level="normal"><p>Les donnÃ©es confirmÃ©es ne signalent aucune exception critique.</p></PinnedNote>}
      </PinnedNoteStack>
    </div>
  );
}

function MissionView({ snapshot, actor, onSelectTask, command, onError }: {
  snapshot: SessionSnapshot;
  actor: ParticipantRecord;
  onSelectTask: (taskId: string) => void;
  command: (body: Record<string, unknown>) => Promise<unknown>;
  onError: (message: string) => void;
}) {
  const mission = useMemo(() => derivePersonalMission(actor, snapshot.tasks, snapshot.definition), [actor, snapshot]);
  const definition = mission.now ? snapshot.definition.tasks.find((task) => task.id === mission.now?.definitionId) : null;
  const nextDefinition = mission.next ? snapshot.definition.tasks.find((task) => task.id === mission.next?.definitionId) : null;
  const gigalodonContext = isGigalodon(snapshot.definition) ? deriveGigalodonMissionContext(actor, getGigalodonState(snapshot.session.raidState)) : [];
  const teamName = snapshot.teams.find((team) => team.id === actor.teamId)?.name || "Sans escouade";
  const actionTitle = mission.now && definition
    ? `${mission.now.status === "READY" ? "Prendre" : mission.now.status === "CLAIMED" ? "Commencer" : mission.now.status === "BLOCKED" ? "DÃ©bloquer" : "Poursuivre"} Â· ${definition.names.fr}`
    : "Attendre la prochaine ouverture";
  return (
    <div className="mission-layout" data-testid="mission-view">
      <MissionOrder status={mission.now?.status ?? "WAITING"} location={definition?.location || "Zone du raid"} team={teamName} title={actionTitle} description={definition ? taskSummaryFr(definition.id, definition.names.fr) : "La mission changera dÃ¨s que la prochaine Ã©tape sera confirmÃ©e."} context={gigalodonContext}
        primaryAction={mission.now?.status === "READY" ? <button className="primary" onClick={async()=>{try{await command({type:"CLAIM_TASK",taskId:mission.now!.id,expectedRevision:mission.now!.revision});}catch(cause){onError(cause instanceof Error?cause.message:"Attribution refusÃ©e.");}}}><RaidIcon name="mission"/>Prendre cette mission</button> : mission.now ? <button className="primary" onClick={()=>onSelectTask(mission.now!.id)}><RaidIcon name="mission"/>Ouvrir la mission</button> : undefined}
        secondaryAction={mission.now?.status === "READY" ? <button className="secondary" onClick={()=>onSelectTask(mission.now!.id)}>Voir les dÃ©tails</button> : undefined}/>
      <div className="mission-quick-row">{isGigalodon(snapshot.definition)?gigalodonContext.slice(0,2).map((item,index)=><div className="mission-quick" key={item}><span>{index===0?"Votre situation":"Point de vigilance"}</span><strong>{item}</strong></div>):<><div className="mission-quick"><span>Escouade</span><strong>{teamName}</strong></div><div className="mission-quick"><span>Ã‰tat</span><strong>{mission.now?STATUS_LABELS[mission.now.status]:"En attente"}</strong></div></>}</div>
      <NextOrderSlip title={nextDefinition?.names.fr ?? "La prochaine mission sera donnÃ©e aprÃ¨s confirmation"} waitingFor={mission.waitingFor}/>
      {isGigalodon(snapshot.definition) && actor.role !== "SPECTATOR" && <GigalodonParticipantPanel snapshot={snapshot} actor={actor} command={command} onError={onError} />}
    </div>
  );
}

function ParticipantRaidView({ snapshot, onSelectTask }: {
  snapshot: SessionSnapshot;
  onSelectTask: (taskId: string) => void;
}) {
  const sanctuaire = isSanctuaire(snapshot.definition) ? getSanctuaireState(snapshot.session.raidState) : null;
  const gigalodon = isGigalodon(snapshot.definition) ? getGigalodonState(snapshot.session.raidState) : null;
  const visibleTasks = snapshot.tasks.filter((task) => ["READY", "CLAIMED", "ACTIVE", "WAITING", "BLOCKED"].includes(task.status)).slice(0, 6);
  const completed = snapshot.tasks.filter((task) => task.status === "COMPLETED").length;
  return (
    <section className="participant-raid-view stack" data-testid="participant-raid-view">
      <div className="panel stack">
        <div className="section-head"><div><div className="eyebrow">Vue du raid</div><h2>Progression commune</h2></div><span className="mono">{completed}/{snapshot.tasks.length}</span></div>
        <div className="phase-strip">
          {snapshot.definition.phases.slice(0, 8).map((phase) => <span className="phase-pill" key={phase.id}>{phase.names.fr}</span>)}
        </div>
        {sanctuaire && (
          <div className="grid-2 participant-raid-metrics">
            <div className="card"><div className="eyebrow">Vies</div><strong className="metric-value">{sanctuaire.raidLife}/20</strong></div>
            <div className="card"><div className="eyebrow">Corridor</div><strong className="metric-value">{sanctuaire.corridorCompleted}/{sanctuaire.corridorTarget}</strong>{sanctuaire.corridorTargetSourceStatus !== "LIVE_CONFIRMED" && <span className="source-label">GUIDE CONFIRMÃ‰ Â· PAS ENCORE CONFIRMÃ‰ EN JEU</span>}</div>
          </div>
        )}
        {gigalodon && (
          <div className="grid-2 participant-raid-metrics">
            <div className="card"><div className="eyebrow">Score sÃ©curisÃ©</div><strong className="metric-value">{gigalodon.confirmedScore.toLocaleString("fr-CH")}</strong></div>
            <div className="card"><div className="eyebrow">Non sÃ©curisÃ©</div><strong className="metric-value">{gigalodon.projectedUnbankedScore.toLocaleString("fr-CH")}</strong></div>
            <div className="card" data-testid="raid-shared-salt"><div className="eyebrow">Sel commun</div><strong className="metric-value">{gigalodon.saltPool.amount}</strong><small>Ressource du raid, jamais personnelle</small></div>
          </div>
        )}
      </div>
      <div className="task-grid participant-task-grid">
        {visibleTasks.map((task) => <TaskCard key={task.id} snapshot={snapshot} task={task} onClick={() => onSelectTask(task.id)} />)}
        {!visibleTasks.length && <div className="panel notice">Aucune tÃ¢che active ou disponible.</div>}
      </div>
    </section>
  );
}

function ParticipantAlertsView({ snapshot }: { snapshot: SessionSnapshot }) {
  return (
    <section className="panel stack" data-testid="participant-alerts-view">
      <div><div className="eyebrow">Alertes et activitÃ©</div><h2>DerniÃ¨res confirmations</h2></div>
      <div className="timeline">
        {snapshot.events.slice(-12).reverse().map((event) => (
          <div className="timeline-row" key={event.id}>
            <time>{new Date(event.createdAt).toLocaleTimeString("fr-CH", { hour: "2-digit", minute: "2-digit" })}</time>
            <span>{event.type}</span>
          </div>
        ))}
        {!snapshot.events.length && <div className="notice">Aucun Ã©vÃ©nement.</div>}
      </div>
    </section>
  );
}

function InformationCorrectionPanel({ snapshot, actor, command, onError }: {
  snapshot: SessionSnapshot;
  actor: ParticipantRecord;
  command: (body: Record<string, unknown>) => Promise<unknown>;
  onError: (message: string) => void;
}) {
  const [reference, setReference] = useState("RÃ¨gle ou affichage visible");
  const [note, setNote] = useState("");
  const [confirmationNote, setConfirmationNote] = useState("");
  const reports = getInformationReports(snapshot.session.raidState);
  const canConfirm = actor.role === "CAPTAIN" || actor.role === "EDITOR";
  async function run(body: Record<string, unknown>) {
    try { await command(body); setNote(""); }
    catch (cause) { onError(cause instanceof Error ? cause.message : "Signalement refusÃ©."); }
  }
  return <aside className="information-correction material-note" data-testid="information-correction">
    <details><summary>Information incorrecte</summary>
      <p>Signaler une divergence nâ€™altÃ¨re jamais automatiquement la dÃ©finition du raid.</p>
      <label>RÃ¨gle ou affichage<input aria-label="RÃ¨gle ou affichage concernÃ©" value={reference} onChange={(event)=>setReference(event.target.value)}/></label>
      <label>Note courte<textarea aria-label="Note sur lâ€™information incorrecte" value={note} onChange={(event)=>setNote(event.target.value)}/></label>
      <button className="secondary" disabled={!reference.trim()||!note.trim()} onClick={()=>void run({type:"REPORT_INFORMATION_INCORRECT",reference,note})}>Envoyer le signalement</button>
      {reports.length>0&&<div className="information-report-list">{reports.slice(-5).reverse().map((report)=><div key={report.id} className="information-report"><strong>{report.reference}</strong><span className="source-label">{report.sourceStatus}</span><p>{report.note}</p><small>{snapshot.participants.find((participant)=>participant.id===report.reportedByParticipantId)?.displayName??"Participant"} Â· {new Date(report.reportedAt).toLocaleString("fr-CH")}</small>{report.correction&&<small>ConfirmÃ© par {snapshot.participants.find((participant)=>participant.id===report.correction?.actorParticipantId)?.displayName??"Ã‰diteur"} Â· {report.correction.note}</small>}{canConfirm&&report.sourceStatus!=="PLAYER_CORRECTED"&&<div><input aria-label="Note de confirmation de correction joueur" value={confirmationNote} onChange={(event)=>setConfirmationNote(event.target.value)}/><button className="primary" disabled={!confirmationNote.trim()} onClick={()=>void run({type:"CONFIRM_PLAYER_CORRECTION",reportId:report.id,note:confirmationNote})}>Confirmer la correction</button></div>}</div>)}</div>}
    </details>
  </aside>;
}

function TaskCard({ snapshot, task, onClick }: { snapshot: SessionSnapshot; task: TaskInstanceRecord; onClick: () => void }) {
  const definition = snapshot.definition.tasks.find((candidate) => candidate.id === task.definitionId);
  return (
    <button className={`card task-card status-${task.status}`} onClick={onClick} style={{ textAlign: "left", color: "inherit" }}>
      <span className={`status status-${task.status}`}>{STATUS_LABELS[task.status]}</span>
      <h3>{definition?.names.fr ?? task.definitionId}</h3>
      <div className="task-meta"><span>{definition?.priority}</span><span>{definition?.location ?? task.phaseId}</span></div>
      {definition?.sourceStatus === "LIVE_REQUIRED" && <span className="source-label">NON CONFIRMÃ‰ EN JEU</span>}
    </button>
  );
}

function TaskDrawer({ snapshot, actor, task, onClose, command, onError }: {
  snapshot: SessionSnapshot;
  actor: ParticipantRecord;
  task: TaskInstanceRecord;
  onClose: () => void;
  command: (body: Record<string, unknown>) => Promise<unknown>;
  onError: (message: string) => void;
}) {
  const drawerRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  const definition = snapshot.definition.tasks.find((candidate) => candidate.id === task.definitionId)!;
  const [resultData, setResultData] = useState<Record<string, unknown>>(task.resultData);
  const [blockedReason, setBlockedReason] = useState(task.blockedReason ?? "");
  useEffect(() => { setResultData(task.resultData); setBlockedReason(task.blockedReason ?? ""); }, [task.id, task.revision]);
  const canEdit = actor.role !== "SPECTATOR";
  const canManage = actor.role === "CAPTAIN" || actor.role === "EDITOR";
  const confirmation = taskConfirmation(task.resultData);

  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const drawer = drawerRef.current;
    drawer?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();
      if (event.key !== "Tab" || !drawer) return;
      const focusable = Array.from(drawer.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'));
      if (!focusable.length) return;
      const first = focusable[0]!;
      const last = focusable.at(-1)!;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("keydown", onKeyDown); previous?.focus(); };
  }, []);

  async function safe(body: Record<string, unknown>) {
    try { await command(body); } catch (cause) { onError(cause instanceof Error ? cause.message : "Commande refusÃ©e."); }
  }
  const fields = [...definition.inputFields, ...definition.completion.resultFields].filter((field, index, all) => all.findIndex((item) => item.path === field.path) === index);

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside ref={drawerRef} tabIndex={-1} className="drawer" role="dialog" aria-modal="true" aria-labelledby="task-title" data-testid="task-drawer">
        <div className="drawer-head">
          <div><span className={`status status-${task.status}`}>{STATUS_LABELS[task.status]}</span><h2 id="task-title">{definition.names.fr}</h2><p className="muted">{taskSummaryFr(definition.id, definition.names.fr)}</p></div>
          <button className="ghost close" aria-label="Fermer" onClick={onClose}>Ã—</button>
        </div>
        <div className="stack">
          <div className="card"><strong>DÃ©pendance</strong><p className="muted">{task.status === "LOCKED" ? "Une tÃ¢che prÃ©cÃ©dente doit Ãªtre terminÃ©e." : "Cette tÃ¢che est disponible dans son Ã©tat actuel."}</p></div>
          <ol className="instructions">{definition.instructions.map((instruction) => <li key={instruction}>{instruction}</li>)}</ol>
          {confirmation && <div className={`confirmation-box ${confirmation.status.toLowerCase()}`}>
            <strong>{confirmation.status === "PENDING" ? "Confirmation en attente" : "RÃ©sultat confirmÃ©"}</strong>
            <span>{confirmation.policy === "SECOND_PERSON" ? "Une autre personne doit vÃ©rifier les donnÃ©es." : confirmation.policy === "CAPTAIN" ? "Validation du capitaine requise." : "Validation directe."}</span>
          </div>}
          {fields.length > 0 && (
            <div className="stack">
              {fields.slice(0,8).map((field) => (
                <DynamicField key={field.path} field={field} value={resultData[field.path]} onChange={(value) => setResultData((current) => ({ ...current, [field.path]: value }))} />
              ))}
            </div>
          )}
          {task.status === "BLOCKED" && <div className="error">{task.blockedReason || "Blocage sans description"}</div>}
          {canManage && (
            <div className="form-field">
              <label htmlFor="task-team">Ã‰quipe responsable</label>
              <select id="task-team" value={task.assignedTeamId ?? ""} onChange={(event) => void safe({ type: "ASSIGN_TASK", taskId: task.id, teamId: event.target.value || null, participantIds: task.assignedParticipantIds })}>
                <option value="">Non attribuÃ©e</option>
                {snapshot.teams.map((team) => <option value={team.id} key={team.id}>{team.name}</option>)}
              </select>
            </div>
          )}
          {canEdit && <TaskActions actor={actor} definition={definition} task={task} resultData={resultData} blockedReason={blockedReason} setBlockedReason={setBlockedReason} run={safe} />}
          <div className="timeline">
            <div className="eyebrow">Ã‰vÃ©nements</div>
            {snapshot.events.filter((event) => event.entityId === task.id).slice(-5).reverse().map((event) => (
              <div className="timeline-row" key={event.id}><time>{new Date(event.createdAt).toLocaleTimeString("fr-CH", { hour: "2-digit", minute: "2-digit" })}</time><span>{event.type}</span></div>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}

function TaskActions({ actor, definition, task, resultData, blockedReason, setBlockedReason, run }: {
  actor: ParticipantRecord;
  definition: SessionSnapshot["definition"]["tasks"][number];
  task: TaskInstanceRecord;
  resultData: Record<string, unknown>;
  blockedReason: string;
  setBlockedReason: (value: string) => void;
  run: (body: Record<string, unknown>) => Promise<void>;
}) {
  const transition = (status: TaskStatus, extra: Record<string, unknown> = {}) => run({ type: "TRANSITION_TASK", taskId: task.id, expectedRevision: task.revision, status, ...extra });
  const confirmation = taskConfirmation(task.resultData);
  const canConfirm = confirmation?.status === "PENDING" &&
    (confirmation.policy === "SECOND_PERSON" ? confirmation.submittedBy !== actor.id : confirmation.policy === "CAPTAIN" ? actor.role === "CAPTAIN" : false);
  const hasFields = definition.inputFields.length + definition.completion.resultFields.length > 0;
  return (
    <div className="stack">
      <div className="button-row">
        {task.status === "READY" && definition.assignment.mode !== "NONE" && <button className="primary" onClick={() => run({ type: "CLAIM_TASK", taskId: task.id, expectedRevision: task.revision })}>Prendre</button>}
        {task.status === "CLAIMED" && <button className="primary" onClick={() => transition("ACTIVE")}>Commencer</button>}
        {task.status === "ACTIVE" && hasFields && <button className="secondary" onClick={() => run({ type: "SAVE_TASK_RESULT", taskId: task.id, expectedRevision: task.revision, resultData })}>Enregistrer</button>}
        {task.status === "ACTIVE" && <button className="primary" onClick={() => run({ type: "SUBMIT_TASK_RESULT", taskId: task.id, expectedRevision: task.revision, resultData })}>{definition.completion.confirmationPolicy === "SELF" ? "Terminer" : "Soumettre pour confirmation"}</button>}
        {task.status === "WAITING" && canConfirm && <button className="primary" onClick={() => run({ type: "CONFIRM_TASK_RESULT", taskId: task.id, expectedRevision: task.revision })}>Confirmer le rÃ©sultat</button>}
        {task.status === "WAITING" && !canConfirm && <span className="notice">En attente de la personne autorisÃ©e.</span>}
        {task.status === "BLOCKED" && <button className="primary" onClick={() => transition("ACTIVE")}>Reprendre</button>}
      </div>
      {task.status === "ACTIVE" && <button className="secondary" onClick={() => transition("WAITING")}>Mettre en attente</button>}
      {["ACTIVE","WAITING"].includes(task.status) && (
        <div className="form-field">
          <label htmlFor="blocked-reason">Signaler un blocage</label>
          <textarea id="blocked-reason" value={blockedReason} onChange={(event) => setBlockedReason(event.target.value)} placeholder="Cause et action nÃ©cessaire" />
          <button className="danger" disabled={!blockedReason.trim()} onClick={() => transition("BLOCKED", { blockedReason })}>Bloquer la tÃ¢che</button>
        </div>
      )}
    </div>
  );
}

function DynamicField({ field, value, onChange }: {
  field: { path: string; type: string; description: string; required?: boolean; enumValues?: Array<string | number | boolean>; sourceStatus?: string };
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const id = `field-${field.path.replace(/[^a-z0-9]/gi,"-")}`;
  return (
    <div className="form-field">
      <label htmlFor={id}>{field.description}{field.required ? " *" : ""}</label>
      {field.type === "enum" && field.enumValues ? (
        <select id={id} value={String(value ?? "")} onChange={(event) => onChange(event.target.value)}>
          <option value="">Choisirâ€¦</option>{field.enumValues.map((option) => <option key={String(option)} value={String(option)}>{String(option)}</option>)}
        </select>
      ) : field.type === "boolean" ? (
        <select id={id} value={value === true ? "true" : value === false ? "false" : ""} onChange={(event) => onChange(event.target.value === "" ? null : event.target.value === "true")}>
          <option value="">Inconnu</option><option value="true">Oui</option><option value="false">Non</option>
        </select>
      ) : field.type === "array" ? (
        <textarea id={id} value={Array.isArray(value) ? value.join("\n") : String(value ?? "")} onChange={(event) => onChange(event.target.value.split(/\n|,/).map((item) => item.trim()).filter(Boolean))} />
      ) : field.type === "object" ? (
        <textarea id={id} value={typeof value === "object" && value !== null ? JSON.stringify(value, null, 2) : String(value ?? "")} onChange={(event) => { try { onChange(JSON.parse(event.target.value)); } catch { onChange(event.target.value); } }} />
      ) : (
        <input id={id} type={["integer","number"].includes(field.type) ? "number" : "text"} value={String(value ?? "")} onChange={(event) => onChange(["integer","number"].includes(field.type) ? Number(event.target.value) : event.target.value)} />
      )}
      {field.sourceStatus === "LIVE_REQUIRED" && <span className="source-label">NON CONFIRMÃ‰ EN JEU</span>}
    </div>
  );
}
