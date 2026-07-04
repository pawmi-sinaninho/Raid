import type { ReactNode } from "react";
import { RaidIcon } from "@/components/icons/RaidIcon";
import { StatusStamp } from "@/components/layout/StatusStamp";

export function MissionOrder({ status, location, team, title, description, primaryAction, secondaryAction, context }: { status:string;location:string;team:string;title:string;description:string;primaryAction?:ReactNode;secondaryAction?:ReactNode;context?:string[] }) {
  const statusFr: Record<string,string> = { LOCKED:"Verrouillée",READY:"Prête",CLAIMED:"Attribuée",ACTIVE:"Active",WAITING:"En attente",BLOCKED:"Bloquée",FAILED:"Échouée",COMPLETED:"Terminée",SKIPPED:"Ignorée" };
  return <section className="mission-order" aria-labelledby="mission-order-title"><div className="mission-order-route"><div><span className="kicker">Votre position de mission</span><strong>{location}</strong><small>{team}</small></div><RaidIcon name="route"/></div><article className="mission-order-sheet"><header><StatusStamp tone={status==="BLOCKED"?"danger":status==="WAITING"?"warning":"active"}>Maintenant · {statusFr[status]??status}</StatusStamp></header><h1 id="mission-order-title">{title}</h1><p>{description}</p>{context&&context.length>0&&<div className="mission-order-context">{context.slice(0,2).map((item)=><span key={item}>{item}</span>)}</div>}<div className="mission-order-actions">{primaryAction}{secondaryAction}</div></article></section>;
}
