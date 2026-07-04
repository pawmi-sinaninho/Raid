"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RaidIcon } from "@/components/icons/RaidIcon";
import { StatusStamp } from "@/components/layout/StatusStamp";

export function JoinForm({ token }: { token: string }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function join(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/join", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ inviteToken: token, displayName })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message ?? "Connexion impossible.");
      localStorage.setItem(`raidweave:${body.sessionId}`, JSON.stringify({
        participantId: body.participant.id,
        recoveryToken: body.recoveryToken
      }));
      router.push(`/session/${body.sessionId}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Connexion impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="join-form material-sheet" onSubmit={join} data-testid="join-form">
      <div>
        <StatusStamp tone="source">Invitation sécurisée</StatusStamp>
        <h2>Rejoindre sans compte</h2>
        <p>Choisissez le nom que votre escouade verra. L’identité de récupération reste uniquement dans ce navigateur.</p>
      </div>
      <div className="form-field">
        <label htmlFor="displayName">Nom affiché</label>
        <input id="displayName" autoFocus maxLength={40} value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
      </div>
      {error && <div className="error" role="alert">{error}</div>}
      <button className="primary" type="submit" disabled={busy}><RaidIcon name="mission" />{busy ? "Connexion…" : "Rejoindre le raid"}</button>
    </form>
  );
}
