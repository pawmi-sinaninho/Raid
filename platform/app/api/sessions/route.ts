import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/src/server/api";
import { getRuntime } from "@/src/server/runtime";
import { assertSameOrigin } from "@/src/server/security";

const CreateSession = z.object({
  definitionId: z.string().min(1),
  name: z.string().trim().min(1).max(120),
  language: z.enum(["fr", "en", "de"])
});

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const input = CreateSession.parse(await request.json());
    const { store } = await getRuntime();
    const created = await store.createSession(input);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
