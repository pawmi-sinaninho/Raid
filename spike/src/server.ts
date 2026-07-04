import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { RaidStore, type MutationResult } from './store.js';
import { HttpError } from './errors.js';

const here = dirname(fileURLToPath(import.meta.url));

async function readJson(req: http.IncomingMessage): Promise<any> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = Buffer.from(chunk);
    size += buffer.length;
    if (size > 1_000_000) throw new HttpError(413, 'BODY_TOO_LARGE', 'Request ist grösser als 1 MB.');
    chunks.push(buffer);
  }
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, 'INVALID_JSON', 'Request enthält ungültiges JSON.');
  }
}

function sendJson(res: http.ServerResponse, status: number, body: unknown): void {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(data),
    'cache-control': 'no-store'
  });
  res.end(data);
}

function authFromBody(body: any) {
  return { participantId: body.participantId, recoveryToken: body.recoveryToken };
}

export function createRaidServer(options: { dbPath: string }) {
  const store = new RaidStore(options.dbPath);
  const streams = new Map<string, Set<http.ServerResponse>>();

  function broadcast(sessionId: string, mutation: MutationResult): void {
    const set = streams.get(sessionId);
    if (!set || set.size === 0) return;
    const payload = JSON.stringify({
      kind: 'snapshot',
      causeEventId: mutation.eventId,
      committedAtMs: mutation.committedAtMs,
      snapshot: mutation.snapshot
    });
    for (const res of set) {
      try {
        res.write(`event: snapshot\ndata: ${payload}\n\n`);
      } catch {
        set.delete(res);
      }
    }
  }

  const server = http.createServer(async (req, res) => {
    try {
      const method = req.method ?? 'GET';
      const url = new URL(req.url ?? '/', 'http://localhost');
      const parts = url.pathname.split('/').filter(Boolean);

      if (method === 'GET' && url.pathname === '/health') {
        return sendJson(res, 200, { ok: true, service: 'raidweave-realtime-spike' });
      }

      if (method === 'GET' && url.pathname === '/') {
        const html = await readFile(join(here, '../../public/index.html'), 'utf8');
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
        return res.end(html);
      }

      if (method === 'POST' && url.pathname === '/sessions') {
        const body = await readJson(req);
        const created = store.createSession(body);
        return sendJson(res, 201, created);
      }

      if (parts[0] === 'sessions' && parts[1]) {
        const sessionId = parts[1];

        if (method === 'POST' && parts[2] === 'join') {
          const body = await readJson(req);
          const joined = store.joinSession(sessionId, body.displayName, body.inviteToken);
          broadcast(sessionId, joined);
          return sendJson(res, 201, joined);
        }

        if (method === 'POST' && parts[2] === 'recover') {
          const body = await readJson(req);
          return sendJson(res, 200, store.recover(sessionId, body.participantId, body.recoveryToken));
        }

        if (method === 'GET' && parts[2] === 'state') {
          store.authenticate(sessionId, url.searchParams.get('participantId') ?? '', url.searchParams.get('recoveryToken') ?? '');
          return sendJson(res, 200, store.snapshot(sessionId));
        }

        if (method === 'GET' && parts[2] === 'stream') {
          const participantId = url.searchParams.get('participantId') ?? '';
          const recoveryToken = url.searchParams.get('recoveryToken') ?? '';
          store.authenticate(sessionId, participantId, recoveryToken);
          res.writeHead(200, {
            'content-type': 'text/event-stream; charset=utf-8',
            'cache-control': 'no-cache, no-transform',
            connection: 'keep-alive',
            'x-accel-buffering': 'no'
          });
          res.write(`event: snapshot\ndata: ${JSON.stringify({ kind: 'snapshot', causeEventId: null, committedAtMs: null, snapshot: store.snapshot(sessionId) })}\n\n`);
          const set = streams.get(sessionId) ?? new Set<http.ServerResponse>();
          set.add(res);
          streams.set(sessionId, set);
          req.on('close', () => set.delete(res));
          return;
        }

        if (method === 'POST' && parts[2] === 'timer' && parts[3] === 'start') {
          const body = await readJson(req);
          const auth = authFromBody(body);
          const mutation = store.startTimer(sessionId, auth.participantId, auth.recoveryToken);
          broadcast(sessionId, mutation);
          return sendJson(res, 200, mutation);
        }

        if (method === 'GET' && parts[2] === 'events') {
          const participantId = url.searchParams.get('participantId') ?? '';
          const recoveryToken = url.searchParams.get('recoveryToken') ?? '';
          return sendJson(res, 200, { events: store.listEvents(sessionId, participantId, recoveryToken) });
        }

        if (parts[2] === 'tasks' && parts[3]) {
          const taskId = parts[3];
          if (method === 'POST' && parts[4] === 'claim') {
            const body = await readJson(req);
            const mutation = store.claimTask(sessionId, taskId, body.participantId, body.recoveryToken, body.expectedRevision);
            broadcast(sessionId, mutation);
            return sendJson(res, 200, mutation);
          }
          if (method === 'POST' && parts[4] === 'transition') {
            const body = await readJson(req);
            const mutation = store.transitionTask(sessionId, taskId, body.participantId, body.recoveryToken, body.expectedRevision, body.toStatus);
            broadcast(sessionId, mutation);
            return sendJson(res, 200, mutation);
          }
          if (method === 'POST' && parts[4] === 'result') {
            const body = await readJson(req);
            const mutation = store.setTaskResult(sessionId, taskId, body.participantId, body.recoveryToken, body.expectedRevision, body.resultData);
            broadcast(sessionId, mutation);
            return sendJson(res, 200, mutation);
          }
          if (method === 'POST' && parts[4] === 'increment') {
            const body = await readJson(req);
            const mutation = store.incrementTask(sessionId, taskId, body.participantId, body.recoveryToken, body.delta);
            broadcast(sessionId, mutation);
            return sendJson(res, 200, mutation);
          }
        }
      }

      throw new HttpError(404, 'ROUTE_NOT_FOUND', 'Route wurde nicht gefunden.');
    } catch (error) {
      const httpError = error instanceof HttpError ? error : new HttpError(500, 'INTERNAL_ERROR', error instanceof Error ? error.message : 'Unbekannter Fehler.');
      sendJson(res, httpError.status, { error: { code: httpError.code, message: httpError.message, details: httpError.details } });
    }
  });

  return {
    server,
    store,
    async listen(port = 0, host = '127.0.0.1') {
      await new Promise<void>((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, host, () => resolve());
      });
      const address = server.address();
      if (!address || typeof address === 'string') throw new Error('Serveradresse konnte nicht bestimmt werden.');
      return `http://${host}:${address.port}`;
    },
    async close() {
      for (const set of streams.values()) {
        for (const res of set) res.end();
        set.clear();
      }
      await new Promise<void>((resolve) => server.close(() => resolve()));
      store.close();
    }
  };
}
