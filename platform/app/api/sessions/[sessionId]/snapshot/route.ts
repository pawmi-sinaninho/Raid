import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { actorFromRequest, apiError } from "@/src/server/api";
import { getRuntime } from "@/src/server/runtime";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await context.params;
    await actorFromRequest(request, sessionId);
    const cursor = Number(request.nextUrl.searchParams.get("cursor") ?? 0);
    const { store } = await getRuntime();
    return NextResponse.json(await store.getSnapshot(sessionId, Number.isFinite(cursor) ? cursor : 0));
  } catch (error) {
    return apiError(error);
  }
}
