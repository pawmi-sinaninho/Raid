import type { ReactNode } from "react";
import { RaidIcon } from "@/components/icons/RaidIcon";
import { StatusStamp } from "@/components/layout/StatusStamp";

export function SharedSaltPool({ amount, lastChange, collectors, refillers, nextCost, controls }: {
  amount: number;
  lastChange: string;
  collectors: string[];
  refillers: string[];
  nextCost: number;
  controls?: ReactNode;
}) {
  return <section className="shared-salt-pool material-sheet" data-testid="shared-salt-pool">
    <header><div><span className="kicker">Réserve commune</span><h2><RaidIcon name="lumen"/> Sel des profondeurs</h2></div><strong className="salt-total">{amount}</strong></header>
    <StatusStamp tone="source">Guide confirmé · 0 point</StatusStamp>
    <dl><div><dt>Dernière variation</dt><dd>{lastChange}</dd></div><div><dt>Prochaine hausse</dt><dd>{nextCost > 0 ? `${nextCost} sel` : "Choisir un niveau supérieur"}</dd></div></dl>
    <p><b>Collecte:</b> {collectors.join(" · ") || "non attribuée"}</p>
    <p><b>Recharge:</b> {refillers.join(" · ") || "non attribuée"}</p>
    {controls && <details><summary>Gérer la réserve commune</summary>{controls}</details>}
  </section>;
}
