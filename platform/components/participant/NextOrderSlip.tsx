import { RaidIcon } from "@/components/icons/RaidIcon";

export function NextOrderSlip({ title, waitingFor }: { title:string;waitingFor:string[] }) {
  return <aside className="next-order-slip"><RaidIcon name="transfer"/><div><span>Ensuite</span><strong>{title}</strong>{waitingFor.length>0&&<p>Ouverture après&nbsp;: {waitingFor.slice(0,2).join(" · ")}</p>}</div></aside>;
}
