import { resolve } from 'node:path';
import { createRaidServer } from './server.js';

const dbPath = resolve(process.env.RAIDWEAVE_DB ?? './raidweave-spike.sqlite');
const port = Number(process.env.PORT ?? 8787);
const app = createRaidServer({ dbPath });
const baseUrl = await app.listen(port, '0.0.0.0');
console.log(`RAIDWEAVE Realtime Spike läuft auf ${baseUrl}`);
console.log(`SQLite: ${dbPath}`);

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, async () => {
    await app.close();
    process.exit(0);
  });
}
