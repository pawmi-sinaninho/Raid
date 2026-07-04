import { RaidIcon } from "@/components/icons/RaidIcon";

export interface DepthRouteNode { floor:number;label:string;status:string;active:boolean;lightLevel:number|null;remaining:string|null;onClick:()=>void }

export function DepthRoute({ nodes }: { nodes:DepthRouteNode[] }) {
  const statusFr: Record<string,string> = { LOCKED:"VERROUILLÉ",READY:"PRÊT",CLAIMED:"ATTRIBUÉ",ACTIVE:"ACTIF",WAITING:"À CONFIRMER",BLOCKED:"BLOQUÉ",FAILED:"ÉCHOUÉ",COMPLETED:"TERMINÉ",SKIPPED:"IGNORÉ" };
  return <aside className="depth-route material-sheet" data-testid="gigalodon-floor-rail"><span className="kicker">Profondeur</span><h2>Route d’expédition</h2><div className="depth-route-line">{nodes.map((node)=><button key={node.floor} className={`depth-route-node status-${node.status} ${node.active?"active":""}`} onClick={node.onClick} aria-current={node.active?"step":undefined}><span className="depth-badge">{node.floor===0?"F":node.floor}</span><span className="depth-copy"><strong>{node.label}</strong><small>{statusFr[node.status]??node.status}</small></span>{node.lightLevel!==null&&<span className={`route-lumen lumen-${node.lightLevel}`} aria-label={`Lumière ${node.lightLevel}`}><RaidIcon name="lumen"/><b>{node.lightLevel}</b>{node.remaining&&<small>{node.remaining}</small>}</span>}</button>)}</div><div className="return-marker"><RaidIcon name="return"/><span>Retour et sécurisation</span></div></aside>;
}
