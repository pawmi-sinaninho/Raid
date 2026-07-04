import type { SessionSnapshot } from "@/src/core/types";
import { RaidIcon } from "@/components/icons/RaidIcon";
import { StatusStamp } from "@/components/layout/StatusStamp";

export function BriefingTicket({ snapshot }: { snapshot: SessionSnapshot }) {
  const players = snapshot.participants.filter((participant) => participant.role !== "SPECTATOR");
  const ready = players.filter((participant) => participant.readyState === "READY").length;
  return <aside className="briefing-ticket material-sheet"><span className="kicker">Ordre de mission</span><h1>{snapshot.session.name}</h1><p>Le groupe se prépare. Répartissez les escouades avant de donner le signal.</p><div className="session-reference"><span>Référence de session</span><strong>{snapshot.session.id.slice(0,8).toUpperCase()}</strong><small>Le lien d’invitation complet reste protégé.</small></div><div className="briefing-facts"><span><RaidIcon name="team" /> {players.length}/{snapshot.definition.participation.maximum} joueurs présents</span><span><RaidIcon name="check" /> {ready}/{players.length} prêts</span><span><RaidIcon name="route" /> {snapshot.definition.names.fr}</span></div><StatusStamp tone="source">Invitations via lien sécurisé</StatusStamp></aside>;
}
