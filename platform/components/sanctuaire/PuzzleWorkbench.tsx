import type { ButtonHTMLAttributes, ReactNode } from "react";
import { RaidIcon } from "@/components/icons/RaidIcon";
import { StatusStamp } from "@/components/layout/StatusStamp";

export function PuzzleWorkbench({ label,title,status,summary,transfer,confirmed=false,footer,className="",...props }: ButtonHTMLAttributes<HTMLButtonElement>&{label:string;title:string;status:string;summary:string;transfer:string;confirmed?:boolean;footer?:ReactNode}) {
  const tone=status==="BLOQUÉ"||status==="ÉCHOUÉ"?"danger":status==="À CONFIRMER"?"warning":status==="TERMINÉ"?"success":"active";
  return <button className={`puzzle-workbench sanctuaire-module material-sheet ${className}`.trim()} {...props}><header><div><span className="kicker">{label}</span><h3>{title}</h3></div><StatusStamp tone={tone}>{status}</StatusStamp></header><p>{summary}</p><div className={`puzzle-transfer ${confirmed?"confirmed":"pending"}`}><RaidIcon name="transfer"/><span>{transfer}</span></div>{footer&&<footer>{footer}</footer>}</button>;
}
