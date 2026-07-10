import type { ReactNode } from "react";
import { RaidIcon } from "@/components/icons/RaidIcon";
import { StatusStamp } from "@/components/layout/StatusStamp";
import type { SourceStatus } from "@/src/core/types";

function sourceStatusLabel(status: SourceStatus) {
  if (status === "LIVE_CONFIRMED") return "Confirmé en jeu";
  if (status === "LIVE_REQUIRED") return "Non confirmé en jeu";
  if (status === "GUIDE_CONFIRMED") return "Guide confirmé";
  if (status === "OFFICIAL_CONFIRMED") return "Source officielle";
  if (status === "PLAYER_CORRECTED") return "Corrigé par les joueurs";
  return status;
}

export interface LightBayReading { floor:number;level:number|null;baseline:number;sourceStatus:SourceStatus;remaining:string;responsible:string }

export function LightBay({ readings, unconfirmed, controls }: { readings:LightBayReading[];unconfirmed:boolean;controls?:ReactNode }) {
  return <section className="light-bay material-sheet" data-testid="floor-light-panel"><header><div><span className="kicker">Balises lumineuses</span><h2>La lumière appartient aux étages</h2></div>{unconfirmed&&<StatusStamp tone="source">Guide confirmé · pas encore testé en live</StatusStamp>}</header><p>Base: étage −1 au niveau 4; chaque étage profond au niveau 1; perte attendue toutes les 2 minutes à partir du déverrouillage.</p><div className="light-bank">{readings.map((reading)=><div className={`light-gauge light-card level-${reading.level??"unknown"}`} key={reading.floor}><span>Étage {reading.floor}</span><strong>{reading.level??"?"}</strong><div className="lumen-segments" aria-label={`Niveau ${reading.level??"inconnu"}`}>{[1,2,3,4].map((segment)=><i key={segment} className={reading.level!==null&&segment<=reading.level?"on":""}/>)}</div><small>Base {reading.baseline} · {sourceStatusLabel(reading.sourceStatus)}</small><small>{reading.remaining} · {reading.responsible}</small></div>)}</div>{controls&&<details className="light-bay-controls"><summary><RaidIcon name="lumen"/>Observer ou recharger</summary>{controls}</details>}</section>;
}
