import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { DomainError } from "./errors";

const pepper = process.env.RAIDWEAVE_TOKEN_PEPPER ?? "local-development-pepper-not-for-production";

export function createSecret(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function hashSecret(secret: string): string {
  return createHash("sha256").update(`${pepper}:${secret}`).digest("hex");
}

export function safeHashEquals(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function assertSameOrigin(request: NextRequest): void {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");
  const forwardedHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const requestOrigin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : request.nextUrl.origin;
  const expected = process.env.RAIDWEAVE_APP_ORIGIN ?? requestOrigin;
  if (origin !== expected) {
    throw new DomainError("ORIGIN_REJECTED", 403, "Anfrage stammt nicht von der erlaubten Origin.");
  }
}
