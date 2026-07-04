import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createRaidServer } from '../src/server.js';

class SseClient {
  url: string;
  controller = new AbortController();
  latest: any = null;
  deliveries = 0;
  latencies: number[] = [];
  readTask: Promise<void> | null = null;

  constructor(url: string) {
    this.url = url;
  }

  async connect() {
    const response = await fetch(this.url, { signal: this.controller.signal });
    assert.equal(response.status, 200);
    assert.ok(response.body);
    this.readTask = this.consume(response.body);
    await this.waitFor(() => this.latest !== null, 3000, 'initial SSE snapshot');
  }

  async consume(body: ReadableStream<Uint8Array>) {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        while (buffer.includes('\n\n')) {
          const index = buffer.indexOf('\n\n');
          const block = buffer.slice(0, index);
          buffer = buffer.slice(index + 2);
          const data = block.split('\n').filter((line) => line.startsWith('data: ')).map((line) => line.slice(6)).join('\n');
          if (!data) continue;
          const payload = JSON.parse(data);
          this.latest = payload.snapshot;
          this.deliveries += 1;
          if (typeof payload.committedAtMs === 'number') this.latencies.push(Math.max(0, Date.now() - payload.committedAtMs));
        }
      }
    } catch (error: any) {
      if (error?.name !== 'AbortError') throw error;
    }
  }

  async waitForRevision(revision: number, timeout = 5000) {
    await this.waitFor(() => this.latest?.revision >= revision, timeout, `revision ${revision}`);
  }

  async waitFor(predicate: () => boolean, timeout: number, label: string) {
    const started = Date.now();
    while (!predicate()) {
      if (Date.now() - started > timeout) throw new Error(`Timeout waiting for ${label}`);
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }

  async close() {
    this.controller.abort();
    try { await this.readTask; } catch {}
  }
}

async function request(baseUrl: string, path: string, options: RequestInit = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers ?? {}) }
  });
  const body = await response.json();
  return { status: response.status, body };
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * p) - 1)];
}

function canonical(snapshot: any) {
  return {
    revision: snapshot.revision,
    session: snapshot.session,
    participants: snapshot.participants,
    tasks: snapshot.tasks,
    timer: {
      durationMs: snapshot.timer.durationMs,
      adjustmentMs: snapshot.timer.adjustmentMs,
      status: snapshot.timer.status
    }
  };
}

test('Phase-5-Gates: 16 Clients, Claims, Konflikte, Timer, Recovery und Eventlog', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'raidweave-spike-'));
  const dbPath = join(temp, 'spike.sqlite');
  let app = createRaidServer({ dbPath });
  let baseUrl = await app.listen();
  const clients: SseClient[] = [];

  const created = await request(baseUrl, '/sessions', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Phase-5 Testsession',
      captainDisplayName: 'Captain',
      durationMs: 60_000,
      tasks: [
        { key: 'exclusive', title: 'Exklusive Aufgabe', exclusive: true },
        { key: 'transition', title: 'Statusaufgabe', exclusive: true },
        { key: 'conflict', title: 'Resultatkonflikt', exclusive: false },
        { key: 'burst', title: 'Burst-Zähler', exclusive: false }
      ]
    })
  });
  assert.equal(created.status, 201);
  const sessionId = created.body.sessionId;
  const captain = {
    participantId: created.body.captainParticipantId,
    recoveryToken: created.body.captainRecoveryToken,
    role: 'CAPTAIN'
  };

  const participants: any[] = [];
  for (let index = 1; index <= 15; index += 1) {
    const joined = await request(baseUrl, `/sessions/${sessionId}/join`, {
      method: 'POST',
      body: JSON.stringify({ displayName: `Player ${index}`, inviteToken: created.body.invites.participant })
    });
    assert.equal(joined.status, 201);
    participants.push({ participantId: joined.body.participantId, recoveryToken: joined.body.recoveryToken, role: joined.body.role });
  }
  const spectatorJoin = await request(baseUrl, `/sessions/${sessionId}/join`, {
    method: 'POST',
    body: JSON.stringify({ displayName: 'Spectator', inviteToken: created.body.invites.spectator })
  });
  assert.equal(spectatorJoin.status, 201);
  const spectator = { participantId: spectatorJoin.body.participantId, recoveryToken: spectatorJoin.body.recoveryToken };

  const raidClients = [captain, ...participants];
  assert.equal(raidClients.length, 16);
  for (const identity of raidClients) {
    const qs = new URLSearchParams(identity as any);
    const client = new SseClient(`${baseUrl}/sessions/${sessionId}/stream?${qs}`);
    await client.connect();
    clients.push(client);
  }

  const initialRevision = clients[0].latest.revision;
  assert.equal(initialRevision, 17, 'Session creation + 15 participants + spectator');

  const timerStart = await request(baseUrl, `/sessions/${sessionId}/timer/start`, {
    method: 'POST',
    body: JSON.stringify(captain)
  });
  assert.equal(timerStart.status, 200);
  await Promise.all(clients.map((client) => client.waitForRevision(timerStart.body.snapshot.revision)));

  const transitionTask = timerStart.body.snapshot.tasks.find((task: any) => task.key === 'transition');
  const claimTransition = await request(baseUrl, `/sessions/${sessionId}/tasks/${transitionTask.id}/claim`, {
    method: 'POST',
    body: JSON.stringify({ ...participants[0], expectedRevision: transitionTask.revision })
  });
  assert.equal(claimTransition.status, 200);
  const claimedTask = claimTransition.body.snapshot.tasks.find((task: any) => task.id === transitionTask.id);
  const activateTransition = await request(baseUrl, `/sessions/${sessionId}/tasks/${transitionTask.id}/transition`, {
    method: 'POST',
    body: JSON.stringify({ ...participants[0], expectedRevision: claimedTask.revision, toStatus: 'ACTIVE' })
  });
  assert.equal(activateTransition.status, 200);
  assert.equal(activateTransition.body.snapshot.tasks.find((task: any) => task.id === transitionTask.id).status, 'ACTIVE');

  const exclusiveTask = activateTransition.body.snapshot.tasks.find((task: any) => task.key === 'exclusive');
  const race = await Promise.all([
    request(baseUrl, `/sessions/${sessionId}/tasks/${exclusiveTask.id}/claim`, {
      method: 'POST', body: JSON.stringify({ ...participants[1], expectedRevision: exclusiveTask.revision })
    }),
    request(baseUrl, `/sessions/${sessionId}/tasks/${exclusiveTask.id}/claim`, {
      method: 'POST', body: JSON.stringify({ ...participants[2], expectedRevision: exclusiveTask.revision })
    })
  ]);
  assert.deepEqual(race.map((result) => result.status).sort(), [200, 409]);
  assert.equal(race.find((result) => result.status === 409)?.body.error.code, 'REVISION_CONFLICT');

  const stateAfterRace = (race.find((result) => result.status === 200) as any).body.snapshot;
  const conflictTask = stateAfterRace.tasks.find((task: any) => task.key === 'conflict');
  const resultRace = await Promise.all([
    request(baseUrl, `/sessions/${sessionId}/tasks/${conflictTask.id}/result`, {
      method: 'POST', body: JSON.stringify({ ...participants[3], expectedRevision: conflictTask.revision, resultData: { color: 'AZURE' } })
    }),
    request(baseUrl, `/sessions/${sessionId}/tasks/${conflictTask.id}/result`, {
      method: 'POST', body: JSON.stringify({ ...participants[4], expectedRevision: conflictTask.revision, resultData: { color: 'ECARLATE' } })
    })
  ]);
  assert.deepEqual(resultRace.map((result) => result.status).sort(), [200, 409]);
  assert.equal(resultRace.find((result) => result.status === 409)?.body.error.code, 'REVISION_CONFLICT');

  const stateAfterConflict = (resultRace.find((result) => result.status === 200) as any).body.snapshot;
  const burstTask = stateAfterConflict.tasks.find((task: any) => task.key === 'burst');
  const burstStarted = Date.now();
  const burstResults = await Promise.all(Array.from({ length: 50 }, (_, index) => {
    const identity = raidClients[index % raidClients.length];
    return request(baseUrl, `/sessions/${sessionId}/tasks/${burstTask.id}/increment`, {
      method: 'POST', body: JSON.stringify({ ...identity, delta: 1 })
    });
  }));
  const burstDurationMs = Date.now() - burstStarted;
  assert.ok(burstResults.every((result) => result.status === 200));
  const finalMutation = burstResults.reduce((best, current) => current.body.snapshot.revision > best.body.snapshot.revision ? current : best);
  const finalRevision = finalMutation.body.snapshot.revision;
  await Promise.all(clients.map((client) => client.waitForRevision(finalRevision, 10_000)));
  const finalProgress = finalMutation.body.snapshot.tasks.find((task: any) => task.id === burstTask.id).progress;
  assert.equal(finalProgress, 50);

  const canonicalState = JSON.stringify(canonical(clients[0].latest));
  for (const client of clients) assert.equal(JSON.stringify(canonical(client.latest)), canonicalState);

  const timerA = clients[0].latest.timer;
  await new Promise((resolve) => setTimeout(resolve, 250));
  const currentState = await request(baseUrl, `/sessions/${sessionId}/state?${new URLSearchParams(captain as any)}`);
  assert.equal(currentState.status, 200);
  const timerB = currentState.body.timer;
  const timerElapsed = timerA.remainingMs - timerB.remainingMs;
  assert.ok(timerElapsed >= 150 && timerElapsed <= 1000, `server timer elapsed ${timerElapsed}ms`);

  const forbidden = await request(baseUrl, `/sessions/${sessionId}/tasks/${burstTask.id}/increment`, {
    method: 'POST', body: JSON.stringify({ ...spectator, delta: 1 })
  });
  assert.equal(forbidden.status, 403);
  const forbiddenTimer = await request(baseUrl, `/sessions/${sessionId}/timer/start`, {
    method: 'POST', body: JSON.stringify(spectator)
  });
  assert.equal(forbiddenTimer.status, 403);

  await clients[1].close();
  const recovered = await request(baseUrl, `/sessions/${sessionId}/recover`, {
    method: 'POST', body: JSON.stringify(participants[0])
  });
  assert.equal(recovered.status, 200);
  assert.equal(recovered.body.participant.id, participants[0].participantId);
  assert.equal(recovered.body.snapshot.revision, finalRevision);
  const recoveredClient = new SseClient(`${baseUrl}/sessions/${sessionId}/stream?${new URLSearchParams(participants[0] as any)}`);
  await recoveredClient.connect();
  assert.equal(recoveredClient.latest.revision, finalRevision);
  clients[1] = recoveredClient;

  const eventResponse = await request(baseUrl, `/sessions/${sessionId}/events?${new URLSearchParams(captain as any)}`);
  assert.equal(eventResponse.status, 200);
  assert.equal(eventResponse.body.events.length, finalRevision, 'Jede Domainmutation entspricht genau einer Sessionrevision und einem Event.');
  for (const event of eventResponse.body.events) {
    assert.ok(event.id && event.type && event.entityId && event.createdAt);
    assert.ok(Number.isInteger(event.sessionRevision));
  }

  const latencies = clients.flatMap((client) => client.latencies);
  const metrics = {
    generatedAt: new Date().toISOString(),
    clients: clients.length,
    quickUpdates: 50,
    quickUpdateDurationMs: burstDurationMs,
    acceptedQuickUpdates: burstResults.filter((result) => result.status === 200).length,
    exclusiveClaimStatuses: race.map((result) => result.status).sort(),
    conflictStatuses: resultRace.map((result) => result.status).sort(),
    finalRevision,
    finalProgress,
    eventCount: eventResponse.body.events.length,
    timerElapsedObservedMs: timerElapsed,
    sseDeliveries: clients.reduce((sum, client) => sum + client.deliveries, 0),
    latencySamples: latencies.length,
    latencyMs: {
      p50: percentile(latencies, 0.50),
      p95: percentile(latencies, 0.95),
      max: Math.max(...latencies)
    },
    converged: true,
    recoveryPassed: true,
    spectatorWriteDenied: true
  };
  const artifactsDir = resolve(process.cwd(), 'artifacts');
  await mkdir(artifactsDir, { recursive: true });
  await writeFile(join(artifactsDir, 'realtime-metrics.json'), `${JSON.stringify(metrics, null, 2)}\n`);

  await Promise.all(clients.map((client) => client.close()));
  await app.close();

  app = createRaidServer({ dbPath });
  baseUrl = await app.listen();
  const afterRestart = await request(baseUrl, `/sessions/${sessionId}/recover`, {
    method: 'POST', body: JSON.stringify(captain)
  });
  assert.equal(afterRestart.status, 200);
  assert.equal(afterRestart.body.snapshot.revision, finalRevision);
  assert.equal(afterRestart.body.snapshot.tasks.find((task: any) => task.key === 'burst').progress, 50);
  const eventsAfterRestart = await request(baseUrl, `/sessions/${sessionId}/events?${new URLSearchParams(captain as any)}`);
  assert.equal(eventsAfterRestart.body.events.length, finalRevision);
  await app.close();
});
