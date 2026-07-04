import type { ReactNode } from "react";
import { RaidIcon } from "@/components/icons/RaidIcon";

export function FinalClearance({ blocked, unconfirmed, ready, controls }: { blocked:string[];unconfirmed:string[];ready:string[];controls?:ReactNode }) {
  return <section className="final-clearance material-sheet" data-testid="gigalodon-final-readiness"><header><span className="kicker">Autorisation finale</span><h2>Contrôle avant le départ</h2></header><div className="clearance-bands"><ClearanceBand label="Bloqué par une règle confirmée" items={blocked} tone="blocked"/><ClearanceBand label="À vérifier en jeu · poursuite consciente possible" items={unconfirmed} tone="unconfirmed"/><ClearanceBand label="Prêt" items={ready} tone="ready"/></div>{controls&&<details className="clearance-controls"><summary><RaidIcon name="check"/>Effectuer le contrôle capitaine</summary>{controls}</details>}</section>;
}

function ClearanceBand({ label,items,tone }: { label:string;items:string[];tone:string }) { return <div className={`clearance-band ${tone}`}><strong>{label}</strong><span>{items.length?items.join(" · "):"Aucun élément"}</span></div>; }
