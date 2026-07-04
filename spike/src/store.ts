import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { canMutate, canTransition, type Role, type SessionSnapshot, type TaskSeed, type TaskStatus } from './domain.js';
import { ConflictError, HttpError } from './errors.js';

function nowIso(): string {
  return new Date().toISOString();
}

function token(): string {
  return randomBytes(24).toString('base64url');
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function safeHashEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'hex');
  const bb = Buffer.from(b, 'hex');
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

function json(value: unknown): string {
  return JSON.stringify(value ?? null);
}

function parseJson(value: string | null): unknown {
  return value ? JSON.parse(value) : null;
}

export interface MutationResult {
  eventId: string;
  committedAtMs: number;
  snapshot: SessionSnapshot;
}

export class RaidStore {
  db: DatabaseSync;

  constructor(dbPath: string) {
    this.db = new DatabaseSync(dbPath);
    this.db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL;');
    this.migrate();
  }

  migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        started_at TEXT,
        duration_ms INTEGER NOT NULL,
        adjustment_ms INTEGER NOT NULL DEFAULT 0,
        revision INTEGER NOT NULL,
        captain_participant_id TEXT NOT NULL,
        captain_invite_hash TEXT NOT NULL,
        participant_invite_hash TEXT NOT NULL,
        spectator_invite_hash TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS participants (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        display_name TEXT NOT NULL,
        role TEXT NOT NULL,
        recovery_hash TEXT NOT NULL,
        joined_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS participants_session_idx ON participants(session_id);
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        task_key TEXT NOT NULL,
        title TEXT NOT NULL,
        status TEXT NOT NULL,
        exclusive INTEGER NOT NULL,
        owner_participant_id TEXT REFERENCES participants(id),
        progress INTEGER NOT NULL DEFAULT 0,
        result_json TEXT,
        revision INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL,
        UNIQUE(session_id, task_key)
      );
      CREATE INDEX IF NOT EXISTS tasks_session_idx ON tasks(session_id);
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_uuid TEXT NOT NULL UNIQUE,
        session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        actor_participant_id TEXT REFERENCES participants(id),
        type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        before_json TEXT,
        after_json TEXT,
        created_at TEXT NOT NULL,
        session_revision INTEGER NOT NULL,
        reversible INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS events_session_idx ON events(session_id, id);
    `);
  }

  close(): void {
    this.db.close();
  }

  transaction<T>(fn: () => T): T {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const value = fn();
      this.db.exec('COMMIT');
      return value;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  createSession(input: { name: string; captainDisplayName: string; durationMs: number; tasks: TaskSeed[] }) {
    if (!input.name?.trim()) throw new HttpError(400, 'INVALID_NAME', 'Sessionname fehlt.');
    if (!input.captainDisplayName?.trim()) throw new HttpError(400, 'INVALID_CAPTAIN', 'Captain-Anzeigename fehlt.');
    if (!Number.isInteger(input.durationMs) || input.durationMs < 1000) {
      throw new HttpError(400, 'INVALID_TIMER', 'durationMs muss mindestens 1000 sein.');
    }
    if (!Array.isArray(input.tasks) || input.tasks.length === 0) {
      throw new HttpError(400, 'INVALID_TASKS', 'Mindestens eine Aufgabe ist erforderlich.');
    }
    const uniqueKeys = new Set(input.tasks.map((task) => task.key));
    if (uniqueKeys.size !== input.tasks.length) throw new HttpError(400, 'DUPLICATE_TASK_KEY', 'Task-Keys müssen eindeutig sein.');

    const sessionId = randomUUID();
    const captainParticipantId = randomUUID();
    const captainRecoveryToken = token();
    const captainInviteToken = token();
    const participantInviteToken = token();
    const spectatorInviteToken = token();
    const createdAt = nowIso();
    const eventId = randomUUID();

    this.transaction(() => {
      this.db.prepare(`
        INSERT INTO sessions (
          id, name, status, created_at, started_at, duration_ms, adjustment_ms, revision,
          captain_participant_id, captain_invite_hash, participant_invite_hash, spectator_invite_hash
        ) VALUES (?, ?, 'LOBBY', ?, NULL, ?, 0, 1, ?, ?, ?, ?)
      `).run(
        sessionId,
        input.name.trim(),
        createdAt,
        input.durationMs,
        captainParticipantId,
        hash(captainInviteToken),
        hash(participantInviteToken),
        hash(spectatorInviteToken)
      );
      this.db.prepare(`
        INSERT INTO participants (id, session_id, display_name, role, recovery_hash, joined_at)
        VALUES (?, ?, ?, 'CAPTAIN', ?, ?)
      `).run(captainParticipantId, sessionId, input.captainDisplayName.trim(), hash(captainRecoveryToken), createdAt);
      const taskStmt = this.db.prepare(`
        INSERT INTO tasks (id, session_id, task_key, title, status, exclusive, owner_participant_id, progress, result_json, revision, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, NULL, 0, NULL, 0, ?)
      `);
      for (const task of input.tasks) {
        taskStmt.run(randomUUID(), sessionId, task.key, task.title, task.status ?? 'READY', task.exclusive ? 1 : 0, createdAt);
      }
      this.insertEvent({
        eventId,
        sessionId,
        actorParticipantId: captainParticipantId,
        type: 'SESSION_CREATED',
        entityId: sessionId,
        before: null,
        after: { name: input.name.trim(), status: 'LOBBY' },
        sessionRevision: 1,
        reversible: false,
        createdAt
      });
    });

    return {
      sessionId,
      captainParticipantId,
      captainRecoveryToken,
      invites: {
        captain: captainInviteToken,
        participant: participantInviteToken,
        spectator: spectatorInviteToken
      },
      eventId,
      committedAtMs: Date.parse(createdAt),
      snapshot: this.snapshot(sessionId)
    };
  }

  joinSession(sessionId: string, displayName: string, inviteToken: string) {
    if (!displayName?.trim()) throw new HttpError(400, 'INVALID_DISPLAY_NAME', 'Anzeigename fehlt.');
    if (!inviteToken) throw new HttpError(401, 'INVALID_INVITE', 'Einladungstoken fehlt.');
    const recoveryToken = token();
    const participantId = randomUUID();
    const joinedAt = nowIso();
    const eventId = randomUUID();
    const role = this.transaction<Role>(() => {
      const session = this.requireSession(sessionId);
      const inviteHash = hash(inviteToken);
      let resolvedRole: Role | null = null;
      if (safeHashEqual(inviteHash, session.captain_invite_hash)) resolvedRole = 'CAPTAIN';
      if (safeHashEqual(inviteHash, session.participant_invite_hash)) resolvedRole = 'PARTICIPANT';
      if (safeHashEqual(inviteHash, session.spectator_invite_hash)) resolvedRole = 'SPECTATOR';
      if (!resolvedRole) throw new HttpError(401, 'INVALID_INVITE', 'Einladungstoken ist ungültig.');

      if (resolvedRole !== 'SPECTATOR') {
        const count = this.db.prepare(`SELECT COUNT(*) AS count FROM participants WHERE session_id = ? AND role != 'SPECTATOR'`).get(sessionId).count as number;
        if (count >= 16) throw new HttpError(409, 'SESSION_FULL', 'Die Session hat bereits 16 aktive Raidrollen.');
      }

      this.db.prepare(`
        INSERT INTO participants (id, session_id, display_name, role, recovery_hash, joined_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(participantId, sessionId, displayName.trim(), resolvedRole, hash(recoveryToken), joinedAt);
      const revision = this.bumpSessionRevision(sessionId);
      this.insertEvent({
        eventId,
        sessionId,
        actorParticipantId: participantId,
        type: 'PARTICIPANT_JOINED',
        entityId: participantId,
        before: null,
        after: { displayName: displayName.trim(), role: resolvedRole },
        sessionRevision: revision,
        reversible: false,
        createdAt: joinedAt
      });
      return resolvedRole;
    });
    return {
      participantId,
      recoveryToken,
      role,
      eventId,
      committedAtMs: Date.parse(joinedAt),
      snapshot: this.snapshot(sessionId)
    };
  }

  recover(sessionId: string, participantId: string, recoveryToken: string) {
    const participant = this.authenticate(sessionId, participantId, recoveryToken);
    return { participant, snapshot: this.snapshot(sessionId) };
  }

  authenticate(sessionId: string, participantId: string, recoveryToken: string) {
    const row = this.db.prepare(`SELECT * FROM participants WHERE id = ? AND session_id = ?`).get(participantId, sessionId) as any;
    if (!row || !recoveryToken || !safeHashEqual(hash(recoveryToken), row.recovery_hash)) {
      throw new HttpError(401, 'INVALID_RECOVERY', 'Teilnehmeridentität konnte nicht wiederhergestellt werden.');
    }
    return { id: row.id, sessionId: row.session_id, displayName: row.display_name, role: row.role as Role, joinedAt: row.joined_at };
  }

  startTimer(sessionId: string, participantId: string, recoveryToken: string): MutationResult {
    const committedAt = nowIso();
    const eventId = randomUUID();
    this.transaction(() => {
      const actor = this.authenticate(sessionId, participantId, recoveryToken);
      if (actor.role !== 'CAPTAIN') throw new HttpError(403, 'FORBIDDEN', 'Nur Captain darf den Timer starten.');
      const session = this.requireSession(sessionId);
      if (session.started_at) throw new ConflictError('Timer wurde bereits gestartet.', { startedAt: session.started_at, sessionRevision: session.revision });
      this.db.prepare(`UPDATE sessions SET started_at = ?, status = 'LIVE' WHERE id = ?`).run(committedAt, sessionId);
      const revision = this.bumpSessionRevision(sessionId);
      this.insertEvent({
        eventId,
        sessionId,
        actorParticipantId: participantId,
        type: 'TIMER_STARTED',
        entityId: sessionId,
        before: { startedAt: null, status: session.status },
        after: { startedAt: committedAt, status: 'LIVE' },
        sessionRevision: revision,
        reversible: true,
        createdAt: committedAt
      });
    });
    return { eventId, committedAtMs: Date.parse(committedAt), snapshot: this.snapshot(sessionId) };
  }

  claimTask(sessionId: string, taskId: string, participantId: string, recoveryToken: string, expectedRevision: number): MutationResult {
    const committedAt = nowIso();
    const eventId = randomUUID();
    this.transaction(() => {
      const actor = this.authenticate(sessionId, participantId, recoveryToken);
      if (!canMutate(actor.role)) throw new HttpError(403, 'FORBIDDEN', 'Zuschauer dürfen Aufgaben nicht übernehmen.');
      const before = this.requireTask(sessionId, taskId);
      if (!Number.isInteger(expectedRevision)) throw new HttpError(400, 'EXPECTED_REVISION_REQUIRED', 'expectedRevision fehlt.');
      const result = this.db.prepare(`
        UPDATE tasks
        SET status = 'CLAIMED', owner_participant_id = ?, revision = revision + 1, updated_at = ?
        WHERE id = ? AND session_id = ? AND revision = ? AND status = 'READY' AND owner_participant_id IS NULL
      `).run(participantId, committedAt, taskId, sessionId, expectedRevision);
      if (result.changes !== 1) {
        const current = this.requireTask(sessionId, taskId);
        throw new ConflictError('Aufgabe wurde bereits verändert oder übernommen.', { currentTask: this.taskDto(current), sessionRevision: this.requireSession(sessionId).revision });
      }
      const after = this.requireTask(sessionId, taskId);
      const revision = this.bumpSessionRevision(sessionId);
      this.insertEvent({
        eventId,
        sessionId,
        actorParticipantId: participantId,
        type: 'TASK_CLAIMED',
        entityId: taskId,
        before: this.taskDto(before),
        after: this.taskDto(after),
        sessionRevision: revision,
        reversible: true,
        createdAt: committedAt
      });
    });
    return { eventId, committedAtMs: Date.parse(committedAt), snapshot: this.snapshot(sessionId) };
  }

  transitionTask(
    sessionId: string,
    taskId: string,
    participantId: string,
    recoveryToken: string,
    expectedRevision: number,
    toStatus: TaskStatus
  ): MutationResult {
    const committedAt = nowIso();
    const eventId = randomUUID();
    this.transaction(() => {
      const actor = this.authenticate(sessionId, participantId, recoveryToken);
      if (!canMutate(actor.role)) throw new HttpError(403, 'FORBIDDEN', 'Zuschauer dürfen Aufgaben nicht verändern.');
      const before = this.requireTask(sessionId, taskId);
      if (!canTransition(before.status, toStatus)) {
        throw new HttpError(422, 'INVALID_TRANSITION', `Übergang ${before.status} → ${toStatus} ist nicht erlaubt.`);
      }
      if (actor.role !== 'CAPTAIN' && before.owner_participant_id && before.owner_participant_id !== participantId) {
        throw new HttpError(403, 'NOT_OWNER', 'Teilnehmer darf nur die eigene Aufgabe verändern.');
      }
      const owner = toStatus === 'READY' ? null : before.owner_participant_id;
      const result = this.db.prepare(`
        UPDATE tasks SET status = ?, owner_participant_id = ?, revision = revision + 1, updated_at = ?
        WHERE id = ? AND session_id = ? AND revision = ?
      `).run(toStatus, owner, committedAt, taskId, sessionId, expectedRevision);
      if (result.changes !== 1) {
        const current = this.requireTask(sessionId, taskId);
        throw new ConflictError('Taskrevision ist veraltet.', { currentTask: this.taskDto(current), sessionRevision: this.requireSession(sessionId).revision });
      }
      const after = this.requireTask(sessionId, taskId);
      const revision = this.bumpSessionRevision(sessionId);
      this.insertEvent({
        eventId,
        sessionId,
        actorParticipantId: participantId,
        type: 'TASK_STATUS_CHANGED',
        entityId: taskId,
        before: this.taskDto(before),
        after: this.taskDto(after),
        sessionRevision: revision,
        reversible: true,
        createdAt: committedAt
      });
    });
    return { eventId, committedAtMs: Date.parse(committedAt), snapshot: this.snapshot(sessionId) };
  }

  setTaskResult(
    sessionId: string,
    taskId: string,
    participantId: string,
    recoveryToken: string,
    expectedRevision: number,
    resultData: unknown
  ): MutationResult {
    const committedAt = nowIso();
    const eventId = randomUUID();
    this.transaction(() => {
      const actor = this.authenticate(sessionId, participantId, recoveryToken);
      if (!canMutate(actor.role)) throw new HttpError(403, 'FORBIDDEN', 'Zuschauer dürfen Resultate nicht verändern.');
      const before = this.requireTask(sessionId, taskId);
      const result = this.db.prepare(`
        UPDATE tasks SET result_json = ?, revision = revision + 1, updated_at = ?
        WHERE id = ? AND session_id = ? AND revision = ?
      `).run(json(resultData), committedAt, taskId, sessionId, expectedRevision);
      if (result.changes !== 1) {
        const current = this.requireTask(sessionId, taskId);
        throw new ConflictError('Resultat basiert auf einer veralteten Taskrevision.', { currentTask: this.taskDto(current), sessionRevision: this.requireSession(sessionId).revision });
      }
      const after = this.requireTask(sessionId, taskId);
      const revision = this.bumpSessionRevision(sessionId);
      this.insertEvent({
        eventId,
        sessionId,
        actorParticipantId: participantId,
        type: 'TASK_RESULT_CHANGED',
        entityId: taskId,
        before: this.taskDto(before),
        after: this.taskDto(after),
        sessionRevision: revision,
        reversible: true,
        createdAt: committedAt
      });
    });
    return { eventId, committedAtMs: Date.parse(committedAt), snapshot: this.snapshot(sessionId) };
  }

  incrementTask(
    sessionId: string,
    taskId: string,
    participantId: string,
    recoveryToken: string,
    delta: number
  ): MutationResult {
    if (!Number.isInteger(delta) || delta === 0 || Math.abs(delta) > 1000) {
      throw new HttpError(400, 'INVALID_DELTA', 'delta muss eine ganze Zahl zwischen -1000 und 1000 sein und darf nicht 0 sein.');
    }
    const committedAt = nowIso();
    const eventId = randomUUID();
    this.transaction(() => {
      const actor = this.authenticate(sessionId, participantId, recoveryToken);
      if (!canMutate(actor.role)) throw new HttpError(403, 'FORBIDDEN', 'Zuschauer dürfen Zähler nicht verändern.');
      const before = this.requireTask(sessionId, taskId);
      this.db.prepare(`
        UPDATE tasks SET progress = progress + ?, revision = revision + 1, updated_at = ?
        WHERE id = ? AND session_id = ?
      `).run(delta, committedAt, taskId, sessionId);
      const after = this.requireTask(sessionId, taskId);
      const revision = this.bumpSessionRevision(sessionId);
      this.insertEvent({
        eventId,
        sessionId,
        actorParticipantId: participantId,
        type: 'TASK_COUNTER_INCREMENTED',
        entityId: taskId,
        before: this.taskDto(before),
        after: this.taskDto(after),
        sessionRevision: revision,
        reversible: true,
        createdAt: committedAt
      });
    });
    return { eventId, committedAtMs: Date.parse(committedAt), snapshot: this.snapshot(sessionId) };
  }

  listEvents(sessionId: string, participantId: string, recoveryToken: string) {
    const actor = this.authenticate(sessionId, participantId, recoveryToken);
    if (actor.role !== 'CAPTAIN') throw new HttpError(403, 'FORBIDDEN', 'Nur Captain darf das vollständige Eventlog lesen.');
    return (this.db.prepare(`SELECT * FROM events WHERE session_id = ? ORDER BY id ASC`).all(sessionId) as any[]).map((row) => ({
      id: row.event_uuid,
      sessionId: row.session_id,
      actorParticipantId: row.actor_participant_id,
      type: row.type,
      entityId: row.entity_id,
      before: parseJson(row.before_json),
      after: parseJson(row.after_json),
      createdAt: row.created_at,
      sessionRevision: row.session_revision,
      reversible: Boolean(row.reversible)
    }));
  }

  snapshot(sessionId: string): SessionSnapshot {
    const session = this.requireSession(sessionId);
    const now = Date.now();
    const startedAtMs = session.started_at ? Date.parse(session.started_at) : null;
    const budget = session.duration_ms + session.adjustment_ms;
    const remainingMs = startedAtMs === null ? budget : Math.max(0, budget - (now - startedAtMs));
    const participants = (this.db.prepare(`SELECT * FROM participants WHERE session_id = ? ORDER BY joined_at, id`).all(sessionId) as any[]).map((row) => ({
      id: row.id,
      displayName: row.display_name,
      role: row.role as Role,
      joinedAt: row.joined_at
    }));
    const tasks = (this.db.prepare(`SELECT * FROM tasks WHERE session_id = ? ORDER BY task_key`).all(sessionId) as any[]).map((row) => this.taskDto(row));
    return {
      revision: session.revision,
      session: {
        id: session.id,
        name: session.name,
        status: session.status,
        createdAt: session.created_at,
        startedAt: session.started_at,
        captainParticipantId: session.captain_participant_id
      },
      timer: {
        serverNow: new Date(now).toISOString(),
        durationMs: session.duration_ms,
        adjustmentMs: session.adjustment_ms,
        remainingMs,
        status: startedAtMs === null ? 'IDLE' : remainingMs === 0 ? 'EXPIRED' : 'RUNNING'
      },
      participants,
      tasks
    };
  }

  requireSession(sessionId: string): any {
    const row = this.db.prepare(`SELECT * FROM sessions WHERE id = ?`).get(sessionId) as any;
    if (!row) throw new HttpError(404, 'SESSION_NOT_FOUND', 'Session wurde nicht gefunden.');
    return row;
  }

  requireTask(sessionId: string, taskId: string): any {
    const row = this.db.prepare(`SELECT * FROM tasks WHERE id = ? AND session_id = ?`).get(taskId, sessionId) as any;
    if (!row) throw new HttpError(404, 'TASK_NOT_FOUND', 'Aufgabe wurde nicht gefunden.');
    return row;
  }

  taskDto(row: any) {
    return {
      id: row.id,
      key: row.task_key,
      title: row.title,
      status: row.status as TaskStatus,
      exclusive: Boolean(row.exclusive),
      ownerParticipantId: row.owner_participant_id,
      progress: row.progress,
      resultData: parseJson(row.result_json),
      revision: row.revision,
      updatedAt: row.updated_at
    };
  }

  bumpSessionRevision(sessionId: string): number {
    this.db.prepare(`UPDATE sessions SET revision = revision + 1 WHERE id = ?`).run(sessionId);
    return (this.db.prepare(`SELECT revision FROM sessions WHERE id = ?`).get(sessionId) as any).revision;
  }

  insertEvent(input: {
    eventId: string;
    sessionId: string;
    actorParticipantId: string | null;
    type: string;
    entityId: string;
    before: unknown;
    after: unknown;
    sessionRevision: number;
    reversible: boolean;
    createdAt: string;
  }): void {
    this.db.prepare(`
      INSERT INTO events (
        event_uuid, session_id, actor_participant_id, type, entity_id,
        before_json, after_json, created_at, session_revision, reversible
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      input.eventId,
      input.sessionId,
      input.actorParticipantId,
      input.type,
      input.entityId,
      json(input.before),
      json(input.after),
      input.createdAt,
      input.sessionRevision,
      input.reversible ? 1 : 0
    );
  }
}
