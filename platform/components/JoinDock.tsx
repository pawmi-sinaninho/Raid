"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function JoinDock() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    const token = trimmed.match(/\/join\/([^/?#]+)/)?.[1] ?? trimmed.replace(/^.*\/join\//, "").split(/[/?#]/)[0];
    if (token) router.push(`/join/${encodeURIComponent(token)}`);
  }

  return (
    <form className="join-dock" onSubmit={submit} aria-label="Rejoindre une session">
      <div className="join-dock-field">
        <label htmlFor="join-code">Vous avez déjà une invitation&nbsp;?</label>
        <input id="join-code" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Coller le lien ou le jeton" autoComplete="off" required />
      </div>
      <button className="primary" type="submit">Rejoindre le raid</button>
    </form>
  );
}
