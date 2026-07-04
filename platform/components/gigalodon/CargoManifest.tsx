import { RaidIcon } from "@/components/icons/RaidIcon";

export interface CargoUnique { label:string;state:string;critical:boolean }
export interface CargoRow { name:string;floor:string;score:string;age:string;unique:string }

export function CargoManifest({ uniques, rows, projected }: { uniques:CargoUnique[];rows:CargoRow[];projected:string }) {
  return <section className="cargo-manifest material-sheet" data-testid="resource-ledger"><header><div><span className="kicker">Manifeste de transport</span><h2>Ce qui doit revenir vivant</h2></div><div className="cargo-risk"><span>Encore porté</span><strong>{projected}</strong></div></header><div className="unique-cargo-list">{uniques.map((item)=><div key={item.label} className={item.critical?"critical":""}><RaidIcon name="unique"/><span><strong>{item.label}</strong><small>{item.state}</small></span></div>)}</div><div className="cargo-table"><div className="cargo-row cargo-head"><span>Joueur</span><span>Étage</span><span>Risque</span><span>Actualité</span></div>{rows.length?rows.map((row)=><div className="cargo-row" key={`${row.name}-${row.floor}`}><strong>{row.name}</strong><span>{row.floor}</span><span className="cargo-score">{row.score}</span><span>{row.age}</span>{row.unique&&<small>{row.unique}</small>}</div>):<p>Aucun inventaire confirmé.</p>}</div><footer>Le score confirmé reste séparé du score porté.</footer></section>;
}
