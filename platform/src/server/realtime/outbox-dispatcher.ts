import type { Database } from "../db/database";
import type { PlatformStore } from "../platform-store";

export const REALTIME_CHANNEL = "raidweave_events";

export class OutboxDispatcher {
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    private readonly db: Database,
    private readonly store: PlatformStore,
    private readonly intervalMs = 250
  ) {}

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => void this.flush(), this.intervalMs);
    this.timer.unref?.();
    void this.flush();
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  async flush(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const claimed = await this.store.claimOutbox(100);
      for (const row of claimed) {
        try {
          const notification = JSON.stringify({
            sessionId: row.sessionId,
            revision: row.revision,
            eventId: row.eventId
          });
          await this.db.query(`SELECT pg_notify('${REALTIME_CHANNEL}', $1)`, [notification]);
          await this.store.markOutboxPublished(row.id);
        } catch (error) {
          await this.store.markOutboxFailed(row.id, error instanceof Error ? error.message : String(error));
        }
      }
    } finally {
      this.running = false;
    }
  }
}
