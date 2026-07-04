"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RaidIcon } from "@/components/icons/RaidIcon";
import { StatusStamp } from "@/components/layout/StatusStamp";

type Definition = {
  id: string;
  names: { fr: string };
  definitionVersion: string;
  participation: { minimum: number; maximum: number };
  durationSeconds: number;
};
type Created = {
  session: { id: string; name: string };
  invites: Record<string, { token: string; urlPath: string }>;
};

export function CreateSessionForm() {
  const [definitions, setDefinitions] = useState<Definition[]>([]);
  const [definitionId, setDefinitionId] = useState("");
  const [name, setName] = useState("Raid du vendredi");
  const [language, setLanguage] = useState<"fr" | "en" | "de">("fr");
  const [created, setCreated] = useState<Created | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/definitions")
      .then((response) => response.json())
      .then((data) => {
        setDefinitions(data.definitions);
        setDefinitionId(data.definitions[0]?.id ?? "");
      })
      .catch(() => setError("Les définitions de raid ne peuvent pas être chargées."));
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ definitionId, name, language })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message ?? "Création impossible.");
      setCreated(body);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Création impossible.");
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    return (
      <div className="creation-result material-sheet" data-testid="created-session">
        <div>
          <StatusStamp tone="success">Session créée</StatusStamp>
          <h2>{created.session.name}</h2>
          <p>Ces invitations ne sont affichées qu’ici. Le serveur ne conserve jamais les secrets en clair.</p>
        </div>
        <div className="invite-list">
          {Object.entries(created.invites).map(([role, invite]) => (
            <div className="invite-item" key={role}>
              <strong>{role}</strong>
              <code>{invite.urlPath}</code>
              <Link className="button secondary" href={invite.urlPath} data-testid={`join-${role.toLowerCase()}`}>
                <RaidIcon name="chevron" /> Ouvrir
              </Link>
            </div>
          ))}
        </div>
        <button className="ghost" onClick={() => setCreated(null)}>Créer une autre session</button>
      </div>
    );
  }

  return (
    <form className="create-session-form material-sheet" onSubmit={submit} data-testid="create-session-form">
      <div>
        <span className="kicker">Nouvelle session</span>
        <h3>Choisir le parcours</h3>
      </div>
      <div className="form-field">
        <label htmlFor="raid">Raid</label>
        <select id="raid" value={definitionId} onChange={(event) => setDefinitionId(event.target.value)} required>
          {definitions.map((definition) => (
            <option key={definition.id} value={definition.id}>
              {definition.names.fr} · {definition.participation.minimum}–{definition.participation.maximum}
            </option>
          ))}
        </select>
      </div>
      <div className="form-field">
        <label htmlFor="name">Nom de session</label>
        <input id="name" value={name} maxLength={120} onChange={(event) => setName(event.target.value)} required />
      </div>
      <details className="advanced-fields"><summary>Options de session</summary><div className="form-field"><label htmlFor="language">Langue</label><select id="language" value={language} onChange={(event) => setLanguage(event.target.value as typeof language)}><option value="fr">Français</option><option value="en">English</option><option value="de">Deutsch</option></select></div></details>
      {error && <div className="error" role="alert">{error}</div>}
      <button className="primary" type="submit" disabled={busy || !definitionId}>
        <RaidIcon name="route" /> {busy ? "Création…" : "Créer la session"}
      </button>
    </form>
  );
}
