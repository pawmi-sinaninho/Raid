import { RaidIcon } from "@/components/icons/RaidIcon";
import { StatusStamp } from "@/components/layout/StatusStamp";

interface DepartureGateProps {
  ready: number;
  total: number;
  enough: boolean;
  hasEditor: boolean;
  canStart: boolean;
  isCaptain: boolean;
  actorReady: boolean;
  onToggleReady: () => void;
  onStart: () => void;
  soloTestAction?: React.ReactNode;
  inviteTools?: React.ReactNode;
}

export function DepartureGate({
  ready,
  total,
  enough,
  hasEditor,
  canStart,
  isCaptain,
  actorReady,
  onToggleReady,
  onStart,
  soloTestAction,
  inviteTools
}: DepartureGateProps) {
  const missing = Math.max(0, total - ready);
  const degrees = total ? Math.round(ready / total * 360) : 0;
  return (
    <aside className="departure-gate material-sheet">
      <span className="kicker">Porte de départ</span>
      <h2>{canStart ? "Le groupe attend votre signal" : "Le groupe se rassemble"}</h2>
      <div className="ready-dial" style={{ "--ready-degrees": `${degrees}deg` } as React.CSSProperties}>
        <div><strong>{ready}/{total}</strong><span>joueurs prêts</span></div>
      </div>
      <div className="departure-checks">
        <span><b className={enough ? "ok" : "warn"}>{enough ? "OK" : "À VOIR"}</b> Minimum de joueurs</span>
        <span><b className={hasEditor ? "ok" : "warn"}>{hasEditor ? "OK" : "MANQUE"}</b> Éditeur de secours</span>
        <span><b className={missing === 0 ? "ok" : "warn"}>{missing === 0 ? "OK" : `${missing} MANQUENT`}</b> Ready check</span>
      </div>
      {isCaptain && !actorReady && (
        <button className="secondary" data-testid="ready-button" onClick={onToggleReady}>
          <RaidIcon name="check" />Me déclarer prêt
        </button>
      )}
      {isCaptain ? (
        <button className="primary departure-primary" data-testid="start-session" disabled={!canStart} onClick={onStart}>
          <RaidIcon name="route" />
          {canStart ? "Donner le signal de départ" : missing ? `${missing} joueurs doivent répondre` : "Conditions de départ incomplètes"}
        </button>
      ) : (
        <button className={actorReady ? "secondary" : "primary"} data-testid="ready-button" onClick={onToggleReady}>
          <RaidIcon name="check" />{actorReady ? "Je ne suis plus prêt" : "Je suis prêt"}
        </button>
      )}
      {soloTestAction}
      {!canStart && isCaptain && (
        <p className="departure-constraint">Le contrat serveur n’autorise pas un départ forcé. Toutes les conditions doivent être confirmées.</p>
      )}
      {inviteTools && (
        <details className="invite-tools">
          <summary><StatusStamp tone="source">Gérer le lien participant</StatusStamp></summary>
          {inviteTools}
        </details>
      )}
    </aside>
  );
}
