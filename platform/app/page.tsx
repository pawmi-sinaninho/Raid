import { CreateSessionForm } from "@/components/CreateSessionForm";
import { JoinDock } from "@/components/JoinDock";
import { RaidweaveMark } from "@/components/brand/RaidweaveMark";
import { RaidIcon } from "@/components/icons/RaidIcon";

export default function HomePage() {
  return (
    <main className="public-shell landing-page theme-sanctuaire">
      <nav className="public-nav" aria-label="Navigation publique">
        <RaidweaveMark />
        <div className="public-links"><a href="#raids">Les raids</a><a href="#create-session">Créer</a><span>FR</span></div>
      </nav>
      <section className="landing-hero" id="raids">
        <div className="hero-copy">
          <span className="hero-index mono">01</span>
          <span className="kicker">Commandement de raid en direct</span>
          <h1>Le raid ne se gagne pas dans un <em>tableau.</em></h1>
          <p className="lead">Répartissez les rôles, faites circuler les résultats et gardez chaque joueur sur la prochaine action utile — sans compte, sans feuille partagée, sans perdre le fil dans Discord.</p>
          <JoinDock />
          <div className="hero-secondary"><a className="button secondary" href="#create-session">Créer une session</a><span>8–16 joueurs · aucun compte requis</span></div>
        </div>
        <div className="raid-posters" aria-label="Raids disponibles">
          <RaidPoster raid="sanctuaire" ordinal="Raid 01 · 2 heures" title="Sanctuaire des Jardins éternels" description="Quatre énigmes, quatre gardiens et deux finales qui convergent vers une seule victoire." foot="Parcours horizontal · vies du raid" />
          <RaidPoster raid="gigalodon" ordinal="Raid 02 · 1 heure" title="Gouffre du Gigalodon" description="Une descente chronométrée où la lumière, les ressources et le retour comptent autant que les combats." foot="Descente verticale · score porté" />
        </div>
      </section>
      <section className="create-section" id="create-session">
        <div className="create-intro"><span className="kicker">Départ capitaine</span><h2>Préparer le raid</h2><p>Choisissez le parcours, nommez la session et partagez ensuite les invitations générées par le serveur.</p></div>
        <CreateSessionForm />
      </section>
    </main>
  );
}

function RaidPoster({ raid, ordinal, title, description, foot }: { raid: "sanctuaire" | "gigalodon"; ordinal: string; title: string; description: string; foot: string }) {
  return <article className={`raid-poster poster-${raid}`}><span className="poster-ordinal">{ordinal}</span><h2>{title}</h2><p>{description}</p><div className="poster-art" aria-hidden="true"><RaidIcon name={raid === "sanctuaire" ? "leaf" : "depth"} /></div><footer><span>{foot}</span><a href="#create-session"><RaidIcon name="route" /> Préparer</a></footer></article>;
}
