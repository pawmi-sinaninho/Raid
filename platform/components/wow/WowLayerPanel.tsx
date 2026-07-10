import type { WowLayerViewModel } from "@/src/core/wow-layer";
import { RaidIcon } from "@/components/icons/RaidIcon";

const STATUS_LABELS: Record<string, string> = {
  LOCKED: "Verrouillé",
  READY: "Prêt",
  CLAIMED: "Attribué",
  ACTIVE: "Actif",
  WAITING: "En attente",
  BLOCKED: "Bloqué",
  FAILED: "Échoué",
  COMPLETED: "Terminé",
  SKIPPED: "Ignoré"
};

const RISK_LABELS: Record<string, string> = {
  NORMAL: "Normal",
  ATTENTION: "Attention",
  HIGH: "Élevé",
  CRITICAL: "Critique"
};

function trustLabel(trust: string) {
  if (trust === "LIVE_REQUIRED") return "NON CONFIRMÉ EN JEU";
  if (trust === "PARTIAL") return "PARTIEL";
  if (trust === "STALE") return "OBSOLÈTE";
  if (trust === "DERIVED") return "CALCULÉ";
  return "CONFIRMÉ";
}

export function WowLayerPanel({
  model,
  onSelectTask
}: {
  model: WowLayerViewModel;
  onSelectTask: (taskId: string) => void;
}) {
  return (
    <section className={`wow-layer-panel ${model.map.orientation.toLowerCase()}`} data-testid="wow-layer-panel">
      <header className="wow-layer-head">
        <div>
          <div className="eyebrow">Phase 9B · Couche tactique</div>
          <h2>{model.map.title}</h2>
        </div>
        <span className={`source-label trust-${model.dataQuality.trust.toLowerCase()}`}>{trustLabel(model.dataQuality.trust)}</span>
      </header>

      <div className="wow-layer-grid">
        <div className="wow-route-card">
          <div className="wow-route-thread" aria-label="Carte vivante du raid">
            {model.map.nodes.map((node) => {
              const clickable = Boolean(node.taskId);
              const content = (
                <>
                  <span className={`wow-node-status status-${node.status}`}>{STATUS_LABELS[node.status] ?? node.status}</span>
                  <strong>{node.label}</strong>
                  <small>{node.ownerLabel ?? "Responsable non confirmé"}</small>
                  {node.blockedBy.length > 0 && <em>Attend {node.blockedBy.slice(0, 2).join(", ")}</em>}
                  {node.trust !== "CONFIRMED" && <span className="source-label">{trustLabel(node.trust)}</span>}
                </>
              );
              return clickable ? (
                <button key={node.id} className={`wow-route-node kind-${node.kind.toLowerCase()} status-${node.status}`} onClick={() => node.taskId && onSelectTask(node.taskId)}>
                  {content}
                </button>
              ) : (
                <div key={node.id} className={`wow-route-node kind-${node.kind.toLowerCase()} status-${node.status}`}>
                  {content}
                </div>
              );
            })}
          </div>
          <footer>{model.map.legend[0]}</footer>
        </div>

        <aside className="wow-decision-card">
          <div className="wow-next-action">
            <div className="eyebrow">Prochaine action conseillée</div>
            <h3>{model.nextAction?.label ?? "Aucune priorité immédiate"}</h3>
            <p>{model.nextAction?.reason ?? "Aucune priorité fiable ne ressort de l’état actuel du raid."}</p>
            {model.nextAction?.taskId && <button className="secondary" onClick={() => onSelectTask(model.nextAction!.taskId!)}><RaidIcon name="mission" />Ouvrir</button>}
          </div>

          <div className="wow-critical-thread">
            <div className="eyebrow">{model.criticalPath.title}</div>
            <ol>
              {model.criticalPath.steps.slice(0, 5).map((step) => (
                <li key={step.id}>
                  <button onClick={() => onSelectTask(step.taskId)}>
                    <span className={`status status-${step.status}`}>{STATUS_LABELS[step.status] ?? step.status}</span>
                    <strong>{step.label}</strong>
                    {step.blockedBy.length > 0 && <small>Attend {step.blockedBy.slice(0, 2).join(", ")}</small>}
                  </button>
                </li>
              ))}
            </ol>
            <p>{model.criticalPath.explanation}</p>
          </div>
        </aside>
      </div>

      <div className="wow-risk-strip" aria-label="Risques détectés">
        {model.risks.slice(0, 3).map((risk) => (
          <button key={risk.id} className={`wow-risk-note level-${risk.level.toLowerCase()}`} onClick={() => risk.taskId && onSelectTask(risk.taskId)} disabled={!risk.taskId}>
            <span>{RISK_LABELS[risk.level] ?? risk.level}</span>
            <strong>{risk.title}</strong>
            <small>{risk.impact}</small>
          </button>
        ))}
        {!model.risks.length && <div className="wow-risk-note level-normal"><span>NORMAL</span><strong>Aucune exception critique</strong><small>Les signaux sont dérivés de l’état confirmé.</small></div>}
      </div>
    </section>
  );
}
