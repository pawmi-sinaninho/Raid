import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { Pool, type PoolClient } from "pg";

export interface QueryResult<T> {
  rows: T[];
  affectedRows?: number;
}

export interface Queryable {
  query<T>(sql: string, params?: unknown[]): Promise<QueryResult<T>>;
}

export interface Database extends Queryable {
  transaction<T>(work: (tx: Queryable) => Promise<T>): Promise<T>;
  exec(sql: string): Promise<void>;
  close(): Promise<void>;
  listen?(channel: string, callback: (payload: string) => void): Promise<() => Promise<void>>;
}

class PGliteDatabase implements Database {
  constructor(private readonly db: PGlite) {}

  async query<T>(sql: string, params: unknown[] = []): Promise<QueryResult<T>> {
    const result = await this.db.query<T>(sql, params);
    return { rows: result.rows, affectedRows: result.affectedRows };
  }

  async transaction<T>(work: (tx: Queryable) => Promise<T>): Promise<T> {
    return this.db.transaction(async (tx) => work({
      query: async <R>(sql: string, params: unknown[] = []) => {
        const result = await tx.query<R>(sql, params);
        return { rows: result.rows, affectedRows: result.affectedRows };
      }
    }));
  }

  async exec(sql: string): Promise<void> {
    await this.db.exec(sql);
  }

  async close(): Promise<void> {
    await this.db.close();
  }

  async listen(channel: string, callback: (payload: string) => void): Promise<() => Promise<void>> {
    return this.db.listen(channel, callback);
  }
}

class PgDatabase implements Database {
  private readonly pool: Pool;
  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString, max: 20, idleTimeoutMillis: 30_000 });
  }

  async query<T>(sql: string, params: unknown[] = []): Promise<QueryResult<T>> {
    const result = await this.pool.query(sql, params);
    return { rows: result.rows as T[], affectedRows: result.rowCount ?? undefined };
  }

  async transaction<T>(work: (tx: Queryable) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const value = await work(wrapPgClient(client));
      await client.query("COMMIT");
      return value;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async exec(sql: string): Promise<void> {
    await this.pool.query(sql);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  async listen(channel: string, callback: (payload: string) => void): Promise<() => Promise<void>> {
    if (!/^[a-z_][a-z0-9_]*$/i.test(channel)) throw new Error("Invalid PostgreSQL channel");
    const client = await this.pool.connect();
    const handler = (message: { channel: string; payload?: string }) => {
      if (message.channel === channel) callback(message.payload ?? "");
    };
    client.on("notification", handler);
    await client.query(`LISTEN ${channel}`);
    return async () => {
      await client.query(`UNLISTEN ${channel}`);
      client.off("notification", handler);
      client.release();
    };
  }
}

function wrapPgClient(client: PoolClient): Queryable {
  return {
    query: async <T>(sql: string, params: unknown[] = []) => {
      const result = await client.query(sql, params);
      return { rows: result.rows as T[], affectedRows: result.rowCount ?? undefined };
    }
  };
}

export async function createDatabase(): Promise<Database> {
  const mode = process.env.RAIDWEAVE_DB_MODE ?? (process.env.DATABASE_URL ? "postgres" : "pglite");
  if (mode === "postgres") {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL fehlt für RAIDWEAVE_DB_MODE=postgres");
    return new PgDatabase(url);
  }
  const dataDir = process.env.RAIDWEAVE_PGLITE_PATH ?? "memory://";
  const pglite = new PGlite(dataDir);
  await pglite.waitReady;
  return new PGliteDatabase(pglite);
}

export async function migrateDatabase(db: Database): Promise<void> {
  const migrationDir = path.join(process.cwd(), "src/server/db/migrations");
  const files = (await readdir(migrationDir)).filter((name) => /^\d+_.+\.sql$/.test(name)).sort();
  for (const file of files) {
    const sql = await readFile(path.join(migrationDir, file), "utf8");
    await db.exec(sql);
  }
}
