import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { ActorContext } from "@/src/core/types";
import { DomainError, isDomainError } from "./errors";
import { getRuntime } from "./runtime";

export async function actorFromRequest(request: NextRequest, sessionId: string): Promise<ActorContext> {
  const participantId = request.headers.get("x-participant-id");
  const recoveryToken = request.headers.get("x-recovery-token");
  if (!participantId || !recoveryToken) {
    throw new DomainError("AUTH_REQUIRED", 401, "Données de reconnexion manquantes.");
  }
  const { store } = await getRuntime();
  return store.authenticateRecovery(sessionId, participantId, recoveryToken);
}

export function apiError(error: unknown): NextResponse {
  if (isDomainError(error)) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message, details: error.details ?? null } },
      { status: error.status }
    );
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Eingaben sind ungültig.", details: error.issues } },
      { status: 400 }
    );
  }
  console.error(error);
  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message: "Erreur interne.", details: null } },
    { status: 500 }
  );
}
