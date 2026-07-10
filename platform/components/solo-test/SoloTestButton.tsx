"use client";

import { useState } from "react";
import { RaidIcon } from "@/components/icons/RaidIcon";

const SOLO_TEST_ENABLED = process.env.NEXT_PUBLIC_ENABLE_SOLO_TEST === "true";

export function SoloTestButton({ onStart, onError }: {
  onStart: () => Promise<void>;
  onError: (message: string) => void;
}) {
  const [pending, setPending] = useState(false);
  if (!SOLO_TEST_ENABLED) return null;

  return (
    <button
      className="secondary solo-test-button"
      data-testid="solo-test-start"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          await onStart();
        } catch (cause) {
          onError(cause instanceof Error ? cause.message : "Le test solo n’a pas pu démarrer.");
          setPending(false);
        }
      }}
    >
      <RaidIcon name="team" />
      {pending ? "Préparation du test solo…" : "Lancer le test solo"}
    </button>
  );
}
