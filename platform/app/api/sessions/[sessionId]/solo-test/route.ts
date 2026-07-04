import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { actorFromRequest, apiError } from "@/src/server/api";
import { getRuntime } from "@/src/server/runtime";
import { assertSameOrigin } from "@/src/server/security";
import { assertSoloTestEnabled, startSoloTest } from "@/src/server/solo-test";

export async function POST(request: NextRequest, context: { params: Promise<{ sessionId: string }> }) {
  try {
    assertSoloTestEnabled();
    assertSameOrigin(request);
    const { sessionId } = await context.params;
    const actor = await actorFromRequest(request, sessionId);
    const { store } = await getRuntime();
    return NextResponse.json({ result: await startSoloTest(store, actor) });
  } catch (error) {
    return apiError(error);
  }
}
