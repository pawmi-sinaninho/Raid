import type { NextRequest } from "next/server";
import { actorFromRequest, apiError } from "@/src/server/api";
import { getRuntime } from "@/src/server/runtime";
import { REALTIME_CHANNEL } from "@/src/server/realtime/outbox-dispatcher";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest, context: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await context.params;
    await actorFromRequest(request, sessionId);
    const runtimeState = await getRuntime();
    let cursor = Number(request.headers.get("last-event-id") ?? request.nextUrl.searchParams.get("cursor") ?? 0);
    if (!Number.isFinite(cursor)) cursor = 0;
    const encoder = new TextEncoder();
    let closeListener: (() => Promise<void>) | undefined;
    let closed = false;
    let wake: (() => void) | null = null;

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const emit = (event: string, data: unknown, id?: number) => {
          if (closed) return;
          const lines = [id !== undefined ? `id: ${id}` : "", `event: ${event}`, `data: ${JSON.stringify(data)}`, "", ""]
            .filter((line, index) => line || index > 0)
            .join("\n");
          controller.enqueue(encoder.encode(lines));
        };

        if (runtimeState.db.listen) {
          closeListener = await runtimeState.db.listen(REALTIME_CHANNEL, (payload) => {
            try {
              const notice = JSON.parse(payload) as { sessionId?: string };
              if (notice.sessionId === sessionId) wake?.();
            } catch {
              // Polling remains the fallback.
            }
          });
        }

        emit("connected", { sessionId, cursor });
        while (!closed && !request.signal.aborted) {
          const events = await runtimeState.store.getEventsSince(sessionId, cursor, 100);
          for (const event of events) {
            cursor = event.sessionRevision;
            emit("domain-event", event, cursor);
          }
          await new Promise<void>((resolve) => {
            wake = resolve;
            const timer = setTimeout(resolve, events.length ? 25 : 1000);
            request.signal.addEventListener("abort", () => {
              clearTimeout(timer);
              resolve();
            }, { once: true });
          });
          wake = null;
          if (!events.length && !closed) emit("heartbeat", { cursor });
        }
        closed = true;
        await closeListener?.();
        controller.close();
      },
      async cancel() {
        closed = true;
        wake?.();
        await closeListener?.();
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no"
      }
    });
  } catch (error) {
    return apiError(error);
  }
}
