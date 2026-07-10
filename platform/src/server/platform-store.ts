import { randomUUID } from "node:crypto";
import type { Database, Queryable } from "./db/database";
import { DomainError } from "./errors";
import { createSecret, hashSecret } from "./security";
import { assertDefinitionIntegrity, getDefinition, listDefinitions } from "@/src/core/definition-loader";
import { evaluateDependencies } from "@/src/core/dependency-engine";
import { createInitialRaidState, getInformationReports, getPath, setPath, type RaidState } from "@/src/core/raid-state";
import {
  collectTaskTransfers,
  getSanctuaireState,
  isSanctuaire,
  taskConfirmation,
  validateTaskResultFields,
  withConfirmedConfirmation,
  withPendingConfirmation,
  type CorridorAssignment,
  type SanctuaireLifeEntry
} from "@/src/core/sanctuaire";
import {
  GIGALODON_RESOURCE_KEYS,
  calculateDamageBonus,
  calculateFragmentChance,
  calculateLightRefillCost,
  calculateProjectedUnbankedScore,
  calculateResourceScore,
  createGuideBaselineLight,
  effectiveLightLevel,
  finalReadinessSummary,
  getGigalodonState,
  isGigalodon,
  normalizeGigalodonResources,
  staleInventoryIds,
  type GigalodonDepositEntry,
  type GigalodonInventory,
  type GigalodonLightState,
  type GigalodonLossEntry,
  type GigalodonResourceKey,
  type GigalodonResources,
  type GigalodonSaltChange
} from "@/src/core/gigalodon";
import type {
  ActorContext,
  EventRecord,
  InformationReport,
  InviteScope,
  ParticipantRecord,
  RaidDefinition,
  Role,
  SourceStatus,
  SessionRecord,
  SessionSnapshot,
  TaskInstanceRecord,
  TaskStatus,
  TeamRecord
} from "@/src/core/types";

interface SessionRow {
  id: string;
  definition_id: string;
  definition_version: string;
  name: string;
  language: "fr" | "en" | "de";
  status: SessionRecord["status"];
  captain_participant_id: string | null;
  revision: string | number;
  created_at: string | Date;
  started_at: string | Date | null;
  ended_at: string | Date | null;
  timer_started_at: string | Date | null;
  timer_duration_seconds: number;
  raid_state: RaidState;
}
interface ParticipantRow {
  id: string;
  session_id: string;
  display_name: string;
  role: Role;
  role_scope: InviteScope;
  team_id: string | null;
  ready_state: ParticipantRecord["readyState"];
  connection_state: ParticipantRecord["connectionState"];
  current_task_id: string | null;
  last_seen_at: string | Date;
}
interface TeamRow {
  id: string;
  session_id: string;
  name: string;
  leader_participant_id: string | null;
}
interface TaskRow {
  id: string;
  session_id: string;
  definition_id: string;
  phase_id: string;
  sort_order: number;
  status: TaskStatus;
  assigned_team_id: string | null;
  assigned_participant_ids: string[];
  owner_participant_id: string | null;
  result_data: Record<string, unknown>;
  blocked_reason: string | null;
  revision: string | number;
  started_at: string | Date | null;
  completed_at: string | Date | null;
  updated_at: string | Date;
}
interface EventRow {
  id: string;
  session_id: string;
  session_revision: string | number;
  actor_participant_id: string | null;
  type: string;
  entity_type: string;
  entity_id: string | null;
  before_state: unknown;
  after_state: unknown;
  reversible: boolean;
  caused_by_event_id: string | null;
  created_at: string | Date;
}

export interface CreatedSession {
  session: SessionRecord;
  invites: Record<Role, { token: string; urlPath: string }>;
}
export interface JoinedSession {
  participant: ParticipantRecord;
  recoveryToken: string;
  sessionId: string;
}
export interface ReadyCheckResult {
  canStart: boolean;
  participantCount: number;
  minimumParticipants: number;
  nonReadyParticipantIds: string[];
  hasEditor: boolean;
  blockers: string[];
}

const toIso = (value: string | Date | null): string | null => {
  if (value === null) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
};
const sessionFromRow = (row: SessionRow): SessionRecord => ({
  id: row.id,
  definitionId: row.definition_id,
  definitionVersion: row.definition_version,
  name: row.name,
  language: row.language,
  status: row.status,
  captainParticipantId: row.captain_participant_id,
  revision: Number(row.revision),
  createdAt: toIso(row.created_at)!,
  startedAt: toIso(row.started_at),
  endedAt: toIso(row.ended_at),
  timerStartedAt: toIso(row.timer_started_at),
  timerDurationSeconds: row.timer_duration_seconds,
  raidState: row.raid_state ?? {}
});
const participantFromRow = (row: ParticipantRow): ParticipantRecord => ({
  id: row.id,
  sessionId: row.session_id,
  displayName: row.display_name,
  role: row.role,
  teamId: row.team_id,
  readyState: row.ready_state,
  connectionState: row.connection_state,
  currentTaskId: row.current_task_id,
  lastSeenAt: toIso(row.last_seen_at)!
});
const teamFromRow = (row: TeamRow): TeamRecord => ({
  id: row.id,
  sessionId: row.session_id,
  name: row.name,
  leaderParticipantId: row.leader_participant_id
});
const taskFromRow = (row: TaskRow): TaskInstanceRecord => ({
  id: row.id,
  sessionId: row.session_id,
  definitionId: row.definition_id,
  phaseId: row.phase_id,
  order: row.sort_order,
  status: row.status,
  assignedTeamId: row.assigned_team_id,
  assignedParticipantIds: row.assigned_participant_ids ?? [],
  ownerParticipantId: row.owner_participant_id,
  resultData: row.result_data ?? {},
  blockedReason: row.blocked_reason,
  revision: Number(row.revision),
  startedAt: toIso(row.started_at),
  completedAt: toIso(row.completed_at),
  updatedAt: toIso(row.updated_at)!
});
const eventFromRow = (row: EventRow): EventRecord => ({
  id: row.id,
  sessionId: row.session_id,
  sessionRevision: Number(row.session_revision),
  actorParticipantId: row.actor_participant_id,
  type: row.type,
  entityType: row.entity_type,
  entityId: row.entity_id,
  before: row.before_state,
  after: row.after_state,
  reversible: row.reversible,
  causedByEventId: row.caused_by_event_id,
  createdAt: toIso(row.created_at)!
});

function stripLegacySalt(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripLegacySalt);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => key !== "salt")
      .map(([key, nested]) => [key, stripLegacySalt(nested)])
  );
}

export class PlatformStore {
  constructor(private readonly db: Database) {}

  async registerBundledDefinitions(): Promise<void> {
    for (const definition of listDefinitions()) {
      assertDefinitionIntegrity(definition);
      await this.db.query(
        `INSERT INTO raid_definitions(id, definition_version, game_version, slug, payload)
         VALUES ($1,$2,$3,$4,$5::jsonb)
         ON CONFLICT (id, definition_version) DO UPDATE SET
           game_version=excluded.game_version, slug=excluded.slug, payload=excluded.payload`,
        [definition.id, definition.definitionVersion, definition.gameVersion, definition.slug, JSON.stringify(definition)]
      );
    }
  }

  async migratePhase861Data(): Promise<{ migratedSessions: number; aggregatedSalt: number }> {
    const candidates = await this.db.query<SessionRow>(
      `SELECT s.* FROM raid_sessions s
       LEFT JOIN raid_data_migrations m ON m.session_id=s.id AND m.migration_id='PHASE_8_6_1'
       WHERE m.session_id IS NULL AND s.definition_id IN ('gouffre-gigalodon','sanctuaire-jardins-eternels')
       ORDER BY s.created_at`
    );
    let migratedSessions = 0;
    let aggregatedSalt = 0;
    for (const candidate of candidates.rows) {
      await this.db.transaction(async (tx) => {
        const row = (await tx.query<SessionRow>(`SELECT * FROM raid_sessions WHERE id=$1 FOR UPDATE`, [candidate.id])).rows[0];
        if (!row) return;
        const already = (await tx.query<{ session_id: string }>(`SELECT session_id FROM raid_data_migrations WHERE session_id=$1 AND migration_id='PHASE_8_6_1'`, [row.id])).rows[0];
        if (already) return;
        const targetDefinition = getDefinition(row.definition_id);
        const beforeState = structuredClone(row.raid_state ?? {});
        let nextState = structuredClone(beforeState);
        let sessionSalt = 0;
        let sharedSaltTotal = 0;

        if (row.definition_id === "gouffre-gigalodon") {
          const raw = (beforeState.gigalodon ?? {}) as Record<string, unknown>;
          const rawInventories = Array.isArray(raw.participantInventories) ? raw.participantInventories as Array<Record<string, unknown>> : [];
          sessionSalt = rawInventories.reduce((sum, inventory) => {
            const resources = inventory.resources && typeof inventory.resources === "object" ? inventory.resources as Record<string, unknown> : {};
            return sum + Math.max(0, Math.trunc(Number(resources.salt) || 0));
          }, 0);
          const normalized = getGigalodonState(beforeState);
          const migrationTime = new Date().toISOString();
          const existingPool = raw.saltPool && typeof raw.saltPool === "object" ? normalized.saltPool : null;
          const existingAmount = existingPool?.amount ?? 0;
          const migrationEntry: GigalodonSaltChange | null = sessionSalt > 0 ? {
            id: `phase-8-6-1-${row.id}`,
            kind: "MIGRATION",
            delta: sessionSalt,
            before: existingAmount,
            after: existingAmount + sessionSalt,
            cause: "Phase 8.6.1: persönliche Salzbestände verlustfrei in den gemeinsamen Raidpool aggregiert",
            actorParticipantId: null,
            responsibleParticipantId: null,
            floor: null,
            createdAt: migrationTime
          } : null;
          const legacyCollectors = rawInventories
            .filter((inventory) => Number((inventory.resources as Record<string, unknown> | undefined)?.salt ?? 0) > 0)
            .map((inventory) => String(inventory.participantId))
            .filter(Boolean);
          const saltPool = {
            amount: existingAmount + sessionSalt,
            lastChange: migrationEntry ?? existingPool?.lastChange ?? null,
            history: migrationEntry ? [...(existingPool?.history ?? []), migrationEntry] : (existingPool?.history ?? []),
            collectorParticipantIds: [...new Set([...(existingPool?.collectorParticipantIds ?? []), ...legacyCollectors])],
            refillerParticipantIds: existingPool?.refillerParticipantIds ?? []
          };
          sharedSaltTotal = saltPool.amount;
          const migratedGig = stripLegacySalt({ ...raw, ...normalized, saltPool }) as Record<string, unknown>;
          delete migratedGig.lightIntervalConfirmedInGame;
          delete migratedGig.saltCostSemanticsConfirmedInGame;
          delete migratedGig.floor1GroupTargetConfirmedInGame;
          nextState = { ...beforeState, gigalodon: migratedGig };

          const taskRows = await tx.query<{ id: string; result_data: Record<string, unknown> }>(`SELECT id,result_data FROM task_instances WHERE session_id=$1 FOR UPDATE`, [row.id]);
          for (const task of taskRows.rows) {
            const migratedResult = stripLegacySalt(task.result_data) as Record<string, unknown>;
            if (JSON.stringify(migratedResult) !== JSON.stringify(task.result_data)) {
              await tx.query(`UPDATE task_instances SET result_data=$2::jsonb,revision=revision+1,updated_at=now() WHERE id=$1`, [task.id, JSON.stringify(migratedResult)]);
            }
          }
        } else {
          const raw = (beforeState.sanctuaire ?? {}) as Record<string, unknown>;
          const normalized = getSanctuaireState(beforeState);
          const migratedSanctuaire = { ...raw, ...normalized } as Record<string, unknown>;
          delete migratedSanctuaire.corridorTargetConfirmed;
          nextState = { ...beforeState, sanctuaire: migratedSanctuaire };
        }

        const stateChanged = JSON.stringify(nextState) !== JSON.stringify(beforeState);
        const versionChanged = row.definition_version !== targetDefinition.definitionVersion;
        if (stateChanged || versionChanged) {
          await tx.query(
            `UPDATE raid_sessions SET raid_state=$2::jsonb,definition_version=$3 WHERE id=$1`,
            [row.id, JSON.stringify(nextState), targetDefinition.definitionVersion]
          );
          const revision = await this.bumpRevision(tx, row.id);
          await this.insertEvent(tx, {
            sessionId: row.id, revision, actorParticipantId: null,
            type: "PHASE_8_6_1_DATA_MIGRATED", entityType: "SESSION", entityId: row.id,
            before: { definitionVersion: row.definition_version, personalSaltTotal: sessionSalt },
            after: { definitionVersion: targetDefinition.definitionVersion, sharedSaltTotal, personalSaltRemoved: row.definition_id === "gouffre-gigalodon" },
            reversible: false
          });
          migratedSessions += 1;
          aggregatedSalt += sessionSalt;
        }
        await tx.query(
          `INSERT INTO raid_data_migrations(session_id,migration_id,details) VALUES ($1,'PHASE_8_6_1',$2::jsonb)
           ON CONFLICT (session_id,migration_id) DO NOTHING`,
          [row.id, JSON.stringify({ fromDefinitionVersion: row.definition_version, toDefinitionVersion: targetDefinition.definitionVersion, aggregatedPersonalSalt: sessionSalt, sharedSaltTotal })]
        );
      });
    }
    return { migratedSessions, aggregatedSalt };
  }

  async createSession(input: {
    definitionId: string;
    name: string;
    language: "fr" | "en" | "de";
  }): Promise<CreatedSession> {
    const definition = getDefinition(input.definitionId);
    const sessionId = randomUUID();
    const now = new Date().toISOString();
    const roleDefaults: Record<Role, { maxUses: number | null; scope: InviteScope }> = {
      CAPTAIN: { maxUses: 1, scope: {} },
      EDITOR: { maxUses: definition.participation.maximum, scope: {} },
      PARTICIPANT: { maxUses: definition.participation.maximum, scope: {} },
      SPECTATOR: { maxUses: null, scope: {} }
    };
    const plaintext = Object.fromEntries(
      (Object.keys(roleDefaults) as Role[]).map((role) => [role, createSecret()])
    ) as Record<Role, string>;

    await this.db.transaction(async (tx) => {
      await tx.query(
        `INSERT INTO raid_sessions(
          id, definition_id, definition_version, name, language, status,
          revision, timer_duration_seconds, raid_state, created_at
        ) VALUES ($1,$2,$3,$4,$5,'LOBBY',1,$6,$7::jsonb,$8)`,
        [sessionId, definition.id, definition.definitionVersion, input.name.trim(), input.language, definition.timer.durationSeconds, JSON.stringify(createInitialRaidState(definition)), now]
      );

      for (const role of Object.keys(roleDefaults) as Role[]) {
        const config = roleDefaults[role];
        await tx.query(
          `INSERT INTO invite_tokens(id, session_id, token_hash, role, scope, max_uses)
           VALUES ($1,$2,$3,$4,$5::jsonb,$6)`,
          [randomUUID(), sessionId, hashSecret(plaintext[role]), role, JSON.stringify(config.scope), config.maxUses]
        );
      }

      for (const task of definition.tasks) {
        await tx.query(
          `INSERT INTO task_instances(
            id, session_id, definition_id, phase_id, sort_order, status,
            assigned_participant_ids, result_data, revision, updated_at
          ) VALUES ($1,$2,$3,$4,$5,$6,'[]'::jsonb,'{}'::jsonb,0,$7)`,
          [randomUUID(), sessionId, task.id, task.phaseId, task.order, task.initialStatus, now]
        );
      }

      await this.insertEvent(tx, {
        sessionId,
        revision: 1,
        actorParticipantId: null,
        type: "SESSION_CREATED",
        entityType: "SESSION",
        entityId: sessionId,
        before: null,
        after: { name: input.name.trim(), definitionId: definition.id, definitionVersion: definition.definitionVersion },
        reversible: false
      });
    });

    const session = await this.getSession(sessionId);
    return {
      session,
      invites: Object.fromEntries(
        (Object.keys(plaintext) as Role[]).map((role) => [role, { token: plaintext[role], urlPath: `/join/${plaintext[role]}` }])
      ) as CreatedSession["invites"]
    };
  }

  async joinByInvite(token: string, displayName: string): Promise<JoinedSession> {
    const tokenHash = hashSecret(token);
    const normalizedName = displayName.trim();
    if (!normalizedName) throw new DomainError("DISPLAY_NAME_REQUIRED", 400, "Nom affiché manquant.");
    if (normalizedName.length > 40) throw new DomainError("DISPLAY_NAME_TOO_LONG", 400, "Nom affiché trop long.");
    const recoveryToken = createSecret();
    const participantId = randomUUID();

    return this.db.transaction(async (tx) => {
      const inviteResult = await tx.query<{
        id: string;
        session_id: string;
        role: Role;
        scope: InviteScope;
        use_count: number;
        max_uses: number | null;
        expires_at: string | Date | null;
        revoked_at: string | Date | null;
        session_status: string;
        definition_payload: RaidDefinition;
      }>(
        `SELECT i.id, i.session_id, i.role, i.scope, i.use_count, i.max_uses,
                i.expires_at, i.revoked_at, s.status AS session_status,
                d.payload AS definition_payload
         FROM invite_tokens i
         JOIN raid_sessions s ON s.id=i.session_id
         JOIN raid_definitions d ON d.id=s.definition_id AND d.definition_version=s.definition_version
         WHERE i.token_hash=$1
         FOR UPDATE`,
        [tokenHash]
      );
      const invite = inviteResult.rows[0];
      if (!invite) throw new DomainError("INVITE_INVALID", 404, "Lien d’invitation invalide.");
      if (invite.revoked_at) throw new DomainError("INVITE_REVOKED", 410, "Lien d’invitation révoqué.");
      if (invite.expires_at && new Date(invite.expires_at).getTime() <= Date.now()) {
        throw new DomainError("INVITE_EXPIRED", 410, "Lien d’invitation expiré.");
      }
      if (invite.max_uses !== null && invite.use_count >= invite.max_uses) {
        throw new DomainError("INVITE_EXHAUSTED", 409, "Lien d’invitation déjà entièrement utilisé.");
      }
      if (invite.session_status === "ENDED" || invite.session_status === "FAILED") {
        throw new DomainError("SESSION_CLOSED", 409, "La session est déjà terminée.");
      }
      if (invite.role !== "SPECTATOR") {
        const count = await tx.query<{ count: string }>(
          `SELECT count(*)::text AS count FROM participants
           WHERE session_id=$1 AND role <> 'SPECTATOR'`,
          [invite.session_id]
        );
        if (Number(count.rows[0]?.count ?? 0) >= invite.definition_payload.participation.maximum) {
          throw new DomainError("SESSION_FULL", 409, "Nombre maximal de joueurs atteint.");
        }
      }

      const now = new Date().toISOString();
      try {
        await tx.query(
          `INSERT INTO participants(
            id, session_id, display_name, role, role_scope, recovery_hash,
            ready_state, connection_state, last_seen_at, created_at
          ) VALUES ($1,$2,$3,$4,$5::jsonb,$6,'NOT_READY','ONLINE',$7,$7)`,
          [participantId, invite.session_id, normalizedName, invite.role, JSON.stringify(invite.scope ?? {}), hashSecret(recoveryToken), now]
        );
      } catch (error) {
        if (String(error).includes("participants_session_id_display_name_key")) {
          throw new DomainError("DISPLAY_NAME_TAKEN", 409, "Ce nom affiché est déjà utilisé.");
        }
        throw error;
      }

      await tx.query(`UPDATE invite_tokens SET use_count=use_count+1 WHERE id=$1`, [invite.id]);
      if (invite.role === "CAPTAIN") {
        await tx.query(
          `UPDATE raid_sessions SET captain_participant_id=$2
           WHERE id=$1 AND captain_participant_id IS NULL`,
          [invite.session_id, participantId]
        );
      }
      const revision = await this.bumpRevision(tx, invite.session_id);
      await this.insertEvent(tx, {
        sessionId: invite.session_id,
        revision,
        actorParticipantId: participantId,
        type: "PARTICIPANT_JOINED",
        entityType: "PARTICIPANT",
        entityId: participantId,
        before: null,
        after: { displayName: normalizedName, role: invite.role },
        reversible: false
      });
      const participant = participantFromRow((await tx.query<ParticipantRow>(
        `SELECT id,session_id,display_name,role,role_scope,team_id,ready_state,
                connection_state,current_task_id,last_seen_at
         FROM participants WHERE id=$1`, [participantId]
      )).rows[0]!);
      return { participant, recoveryToken, sessionId: invite.session_id };
    });
  }

  async authenticateRecovery(sessionId: string, participantId: string, recoveryToken: string): Promise<ActorContext> {
    const result = await this.db.query<ParticipantRow & { recovery_hash: string }>(
      `SELECT id,session_id,display_name,role,role_scope,team_id,ready_state,
              connection_state,current_task_id,last_seen_at,recovery_hash
       FROM participants WHERE id=$1 AND session_id=$2 AND recovery_hash=$3`,
      [participantId, sessionId, hashSecret(recoveryToken)]
    );
    const row = result.rows[0];
    if (!row) throw new DomainError("RECOVERY_INVALID", 401, "Données de reconnexion invalides.");
    await this.db.query(
      `UPDATE participants SET connection_state='ONLINE', last_seen_at=now() WHERE id=$1`,
      [participantId]
    );
    return { participantId: row.id, role: row.role, sessionId: row.session_id, scope: row.role_scope ?? {} };
  }

  async rotateRecovery(actor: ActorContext): Promise<string> {
    const token = createSecret();
    await this.db.transaction(async (tx) => {
      const before = await tx.query<{ recovery_rotated_at: string | Date }>(
        `SELECT recovery_rotated_at FROM participants WHERE id=$1 FOR UPDATE`, [actor.participantId]
      );
      await tx.query(
        `UPDATE participants SET recovery_hash=$2, recovery_rotated_at=now() WHERE id=$1`,
        [actor.participantId, hashSecret(token)]
      );
      const revision = await this.bumpRevision(tx, actor.sessionId);
      await this.insertEvent(tx, {
        sessionId: actor.sessionId,
        revision,
        actorParticipantId: actor.participantId,
        type: "RECOVERY_ROTATED",
        entityType: "PARTICIPANT",
        entityId: actor.participantId,
        before: { rotatedAt: toIso(before.rows[0]?.recovery_rotated_at ?? null) },
        after: { rotatedAt: new Date().toISOString() },
        reversible: false
      });
    });
    return token;
  }

  async rotateInvite(actor: ActorContext, role: Role, scope: InviteScope = {}): Promise<{ token: string; urlPath: string }> {
    this.requireRole(actor, ["CAPTAIN"]);
    const token = createSecret();
    const maxUses = role === "CAPTAIN" ? 1 : role === "SPECTATOR" ? null : 32;
    await this.db.transaction(async (tx) => {
      await tx.query(
        `UPDATE invite_tokens SET revoked_at=now()
         WHERE session_id=$1 AND role=$2 AND revoked_at IS NULL`,
        [actor.sessionId, role]
      );
      await tx.query(
        `INSERT INTO invite_tokens(id,session_id,token_hash,role,scope,max_uses)
         VALUES ($1,$2,$3,$4,$5::jsonb,$6)`,
        [randomUUID(), actor.sessionId, hashSecret(token), role, JSON.stringify(scope), maxUses]
      );
      const revision = await this.bumpRevision(tx, actor.sessionId);
      await this.insertEvent(tx, {
        sessionId: actor.sessionId,
        revision,
        actorParticipantId: actor.participantId,
        type: "INVITE_ROTATED",
        entityType: "INVITE",
        entityId: role,
        before: { role },
        after: { role, scope },
        reversible: false
      });
    });
    return { token, urlPath: `/join/${token}` };
  }

  async createTeam(actor: ActorContext, name: string): Promise<TeamRecord> {
    this.requireRole(actor, ["CAPTAIN", "EDITOR"]);
    if (actor.role === "EDITOR" && (actor.scope.teamIds?.length || actor.scope.taskDefinitionIds?.length)) {
      throw new DomainError("EDITOR_SCOPE_VIOLATION", 403, "Un éditeur restreint ne peut pas créer d’escouades globales.");
    }
    const id = randomUUID();
    await this.db.transaction(async (tx) => {
      await tx.query(
        `INSERT INTO teams(id,session_id,name) VALUES ($1,$2,$3)`,
        [id, actor.sessionId, name.trim()]
      );
      const revision = await this.bumpRevision(tx, actor.sessionId);
      await this.insertEvent(tx, {
        sessionId: actor.sessionId,
        revision,
        actorParticipantId: actor.participantId,
        type: "TEAM_CREATED",
        entityType: "TEAM",
        entityId: id,
        before: null,
        after: { name: name.trim() },
        reversible: true
      });
    });
    return teamFromRow((await this.db.query<TeamRow>(
      `SELECT id,session_id,name,leader_participant_id FROM teams WHERE id=$1`, [id]
    )).rows[0]!);
  }

  async assignParticipantToTeam(actor: ActorContext, participantId: string, teamId: string | null): Promise<void> {
    this.requireRole(actor, ["CAPTAIN", "EDITOR"]);
    if (actor.role === "EDITOR" && teamId && actor.scope.teamIds?.length && !actor.scope.teamIds.includes(teamId)) {
      throw new DomainError("EDITOR_SCOPE_VIOLATION", 403, "L’éditeur ne peut pas gérer cette escouade.");
    }
    await this.db.transaction(async (tx) => {
      const before = (await tx.query<ParticipantRow>(
        `SELECT id,session_id,display_name,role,role_scope,team_id,ready_state,
                connection_state,current_task_id,last_seen_at
         FROM participants WHERE id=$1 AND session_id=$2 FOR UPDATE`,
        [participantId, actor.sessionId]
      )).rows[0];
      if (!before) throw new DomainError("PARTICIPANT_NOT_FOUND", 404, "Joueur introuvable.");
      if (teamId) {
        const team = await tx.query<{ id: string }>(
          `SELECT id FROM teams WHERE id=$1 AND session_id=$2`, [teamId, actor.sessionId]
        );
        if (!team.rows[0]) throw new DomainError("TEAM_NOT_FOUND", 404, "Escouade introuvable.");
      }
      await tx.query(`UPDATE participants SET team_id=$2 WHERE id=$1`, [participantId, teamId]);
      const revision = await this.bumpRevision(tx, actor.sessionId);
      await this.insertEvent(tx, {
        sessionId: actor.sessionId,
        revision,
        actorParticipantId: actor.participantId,
        type: "PARTICIPANT_TEAM_ASSIGNED",
        entityType: "PARTICIPANT",
        entityId: participantId,
        before: { teamId: before.team_id },
        after: { teamId },
        reversible: true
      });
    });
  }

  async setReady(actor: ActorContext, participantId: string, ready: boolean): Promise<void> {
    if (actor.participantId !== participantId) this.requireRole(actor, ["CAPTAIN", "EDITOR"]);
    await this.db.transaction(async (tx) => {
      const before = (await tx.query<ParticipantRow>(
        `SELECT id,session_id,display_name,role,role_scope,team_id,ready_state,
                connection_state,current_task_id,last_seen_at
         FROM participants WHERE id=$1 AND session_id=$2 FOR UPDATE`,
        [participantId, actor.sessionId]
      )).rows[0];
      if (!before) throw new DomainError("PARTICIPANT_NOT_FOUND", 404, "Joueur introuvable.");
      const next = ready ? "READY" : "NOT_READY";
      if (before.ready_state === next) return;
      await tx.query(`UPDATE participants SET ready_state=$2,last_seen_at=now() WHERE id=$1`, [participantId, next]);
      const revision = await this.bumpRevision(tx, actor.sessionId);
      await this.insertEvent(tx, {
        sessionId: actor.sessionId,
        revision,
        actorParticipantId: actor.participantId,
        type: "READY_STATE_CHANGED",
        entityType: "PARTICIPANT",
        entityId: participantId,
        before: { readyState: before.ready_state },
        after: { readyState: next },
        reversible: true
      });
    });
  }

  async getReadyCheck(sessionId: string): Promise<ReadyCheckResult> {
    const session = await this.getSession(sessionId);
    const definition = getDefinition(session.definitionId, session.definitionVersion);
    const participants = (await this.db.query<ParticipantRow>(
      `SELECT id,session_id,display_name,role,role_scope,team_id,ready_state,
              connection_state,current_task_id,last_seen_at
       FROM participants WHERE session_id=$1 AND role <> 'SPECTATOR' ORDER BY created_at`,
      [sessionId]
    )).rows.map(participantFromRow);
    const nonReady = participants.filter((p) => p.readyState !== "READY").map((p) => p.id);
    const hasEditor = participants.some((p) => p.role === "EDITOR");
    const blockers: string[] = [];
    if (participants.length < definition.participation.minimum) blockers.push(`${definition.participation.minimum} joueurs minimum requis.`);
    if (nonReady.length) blockers.push(`${nonReady.length} joueurs ne sont pas prêts.`);
    if (!hasEditor) blockers.push("Au moins un éditeur de secours est requis.");
    return {
      canStart: blockers.length === 0,
      participantCount: participants.length,
      minimumParticipants: definition.participation.minimum,
      nonReadyParticipantIds: nonReady,
      hasEditor,
      blockers
    };
  }

  async startSession(actor: ActorContext): Promise<void> {
    this.requireRole(actor, ["CAPTAIN"]);
    const check = await this.getReadyCheck(actor.sessionId);
    if (!check.canStart) throw new DomainError("READY_CHECK_FAILED", 409, "La session ne peut pas encore démarrer.", check);
    await this.db.transaction(async (tx) => {
      const before = (await tx.query<SessionRow>(
        `SELECT * FROM raid_sessions WHERE id=$1 FOR UPDATE`, [actor.sessionId]
      )).rows[0];
      if (!before) throw new DomainError("SESSION_NOT_FOUND", 404, "Session introuvable.");
      if (before.status !== "LOBBY") throw new DomainError("SESSION_NOT_IN_LOBBY", 409, "La session n’est plus dans le hall.");
      const definition = await this.getDefinitionForSession(tx, actor.sessionId);
      const startedAt = new Date().toISOString();
      let raidState = structuredClone(before.raid_state ?? {});
      let initialLight: GigalodonLightState | null = null;
      if (isGigalodon(definition)) {
        const gigalodon = getGigalodonState(raidState);
        if (!gigalodon.lightStates.some((light) => light.floor === -1)) {
          initialLight = createGuideBaselineLight(-1, startedAt, actor.participantId, null, gigalodon.lightIntervalSeconds);
          raidState = { ...raidState, gigalodon: { ...gigalodon, lightStates: [initialLight] } };
        }
      }
      await tx.query(
        `UPDATE raid_sessions SET status='LIVE',started_at=$2,timer_started_at=$2,raid_state=$3::jsonb WHERE id=$1`,
        [actor.sessionId, startedAt, JSON.stringify(raidState)]
      );
      const startTask = definition.tasks.find((task) => task.type === "SESSION" && task.completion.confirmationPolicy === "SYSTEM" && task.initialStatus === "READY");
      if (startTask) {
        await tx.query(
          `UPDATE task_instances SET status='COMPLETED',completed_at=now(),revision=revision+1,updated_at=now()
           WHERE session_id=$1 AND definition_id=$2 AND status<>'COMPLETED'`,
          [actor.sessionId, startTask.id]
        );
      }
      const rules = startTask
        ? await this.applyPostMutationRules(tx, actor.sessionId, startTask.id, { started: true })
        : { unlockedDefinitionIds: [], automaticTaskDefinitionIds: [], transfers: [], sessionEnded: false };
      const revision = await this.bumpRevision(tx, actor.sessionId);
      await this.insertEvent(tx, {
        sessionId: actor.sessionId,
        revision,
        actorParticipantId: actor.participantId,
        type: "SESSION_STARTED",
        entityType: "SESSION",
        entityId: actor.sessionId,
        before: { status: before.status },
        after: { status: "LIVE", timerStartedAt: startedAt, startTaskDefinitionId: startTask?.id ?? null, initialLight, ...rules },
        reversible: false
      });
    });
  }

  async claimTask(actor: ActorContext, taskId: string, expectedRevision: number): Promise<TaskInstanceRecord> {
    if (actor.role === "SPECTATOR") throw new DomainError("FORBIDDEN", 403, "Les spectateurs ne peuvent pas modifier la session.");
    await this.assertTaskScope(actor, taskId);
    return this.db.transaction(async (tx) => {
      const result = await tx.query<TaskRow>(
        `UPDATE task_instances
         SET status='CLAIMED', owner_participant_id=$2, revision=revision+1, updated_at=now()
         WHERE id=$1 AND session_id=$3 AND status='READY' AND revision=$4
         RETURNING *`,
        [taskId, actor.participantId, actor.sessionId, expectedRevision]
      );
      const updated = result.rows[0];
      if (!updated) {
        const current = (await tx.query<TaskRow>(`SELECT * FROM task_instances WHERE id=$1 AND session_id=$2`, [taskId, actor.sessionId])).rows[0];
        if (!current) throw new DomainError("TASK_NOT_FOUND", 404, "Mission introuvable.");
        throw new DomainError("REVISION_CONFLICT", 409, "La mission a déjà été modifiée.", taskFromRow(current));
      }
      await tx.query(`UPDATE participants SET current_task_id=$2 WHERE id=$1`, [actor.participantId, taskId]);
      const revision = await this.bumpRevision(tx, actor.sessionId);
      await this.insertEvent(tx, {
        sessionId: actor.sessionId,
        revision,
        actorParticipantId: actor.participantId,
        type: "TASK_CLAIMED",
        entityType: "TASK",
        entityId: taskId,
        before: { status: "READY", revision: expectedRevision },
        after: taskFromRow(updated),
        reversible: true
      });
      return taskFromRow(updated);
    });
  }

  async saveTaskResult(actor: ActorContext, input: {
    taskId: string;
    expectedRevision: number;
    resultData: Record<string, unknown>;
  }): Promise<TaskInstanceRecord> {
    if (actor.role === "SPECTATOR") throw new DomainError("FORBIDDEN", 403, "Les spectateurs ne peuvent pas modifier la session.");
    await this.assertTaskScope(actor, input.taskId);
    return this.db.transaction(async (tx) => {
      const beforeRow = (await tx.query<TaskRow>(
        `SELECT * FROM task_instances WHERE id=$1 AND session_id=$2 FOR UPDATE`, [input.taskId, actor.sessionId]
      )).rows[0];
      if (!beforeRow) throw new DomainError("TASK_NOT_FOUND", 404, "Mission introuvable.");
      const before = taskFromRow(beforeRow);
      if (before.revision !== input.expectedRevision) throw new DomainError("REVISION_CONFLICT", 409, "La mission a déjà été modifiée.", before);
      if (["COMPLETED", "SKIPPED"].includes(before.status)) throw new DomainError("TASK_FINAL", 409, "Une mission terminée doit d’abord être corrigée.");
      if (actor.role === "PARTICIPANT" && before.ownerParticipantId && before.ownerParticipantId !== actor.participantId) {
        throw new DomainError("TASK_NOT_OWNED", 403, "Cette mission appartient à une autre personne.");
      }
      const updatedRow = (await tx.query<TaskRow>(
        `UPDATE task_instances SET result_data=result_data || $2::jsonb,revision=revision+1,updated_at=now()
         WHERE id=$1 AND revision=$3 RETURNING *`,
        [input.taskId, JSON.stringify(input.resultData), input.expectedRevision]
      )).rows[0]!;
      const revision = await this.bumpRevision(tx, actor.sessionId);
      await this.insertEvent(tx, {
        sessionId: actor.sessionId, revision, actorParticipantId: actor.participantId,
        type: "TASK_RESULT_SAVED", entityType: "TASK", entityId: input.taskId,
        before, after: taskFromRow(updatedRow), reversible: true
      });
      return taskFromRow(updatedRow);
    });
  }

  async submitTaskResult(actor: ActorContext, input: {
    taskId: string;
    expectedRevision: number;
    resultData: Record<string, unknown>;
  }): Promise<TaskInstanceRecord> {
    if (actor.role === "SPECTATOR") throw new DomainError("FORBIDDEN", 403, "Les spectateurs ne peuvent pas modifier la session.");
    await this.assertTaskScope(actor, input.taskId);
    return this.db.transaction(async (tx) => {
      const beforeRow = (await tx.query<TaskRow>(
        `SELECT * FROM task_instances WHERE id=$1 AND session_id=$2 FOR UPDATE`, [input.taskId, actor.sessionId]
      )).rows[0];
      if (!beforeRow) throw new DomainError("TASK_NOT_FOUND", 404, "Mission introuvable.");
      const before = taskFromRow(beforeRow);
      if (before.revision !== input.expectedRevision) throw new DomainError("REVISION_CONFLICT", 409, "La mission a déjà été modifiée.", before);
      if (!["ACTIVE", "CLAIMED", "WAITING"].includes(before.status)) throw new DomainError("TASK_NOT_SUBMITTABLE", 409, "La mission ne peut pas être envoyée dans cet état.");
      if (actor.role === "PARTICIPANT" && before.ownerParticipantId && before.ownerParticipantId !== actor.participantId) {
        throw new DomainError("TASK_NOT_OWNED", 403, "Cette mission appartient à une autre personne.");
      }
      const definition = await this.getDefinitionForSession(tx, actor.sessionId);
      const taskDefinition = definition.tasks.find((task) => task.id === before.definitionId);
      if (!taskDefinition) throw new DomainError("TASK_DEFINITION_MISSING", 500, "Définition de mission manquante.");
      const merged = { ...before.resultData, ...input.resultData };
      const validation = validateTaskResultFields(taskDefinition, merged);
      if (validation.missing.length || validation.invalid.length) throw new DomainError("TASK_RESULT_INVALID", 400, "Le résultat est incomplet ou invalide.", validation);
      const policy = taskDefinition.completion.confirmationPolicy;
      if (policy === "SYSTEM") throw new DomainError("SYSTEM_TASK", 409, "Cette mission se termine automatiquement.");
      const pending = withPendingConfirmation(merged, policy, actor.participantId);
      const completed = policy === "SELF";
      const resultData = completed ? withConfirmedConfirmation(pending, actor.participantId) : pending;
      const updatedRow = (await tx.query<TaskRow>(
        `UPDATE task_instances SET status=$2,result_data=$3::jsonb,blocked_reason=NULL,
           started_at=COALESCE(started_at,now()),completed_at=CASE WHEN $2='COMPLETED' THEN now() ELSE NULL END,
           revision=revision+1,updated_at=now()
         WHERE id=$1 AND revision=$4 RETURNING *`,
        [input.taskId, completed ? "COMPLETED" : "WAITING", JSON.stringify(resultData), input.expectedRevision]
      )).rows[0]!;
      const rules = completed
        ? await this.applyPostMutationRules(tx, actor.sessionId, before.definitionId, resultData)
        : { unlockedDefinitionIds: [], automaticTaskDefinitionIds: [], transfers: [], sessionEnded: false };
      const revision = await this.bumpRevision(tx, actor.sessionId);
      await this.insertEvent(tx, {
        sessionId: actor.sessionId, revision, actorParticipantId: actor.participantId,
        type: completed ? "TASK_RESULT_CONFIRMED" : "TASK_RESULT_SUBMITTED",
        entityType: "TASK", entityId: input.taskId, before,
        after: { task: taskFromRow(updatedRow), ...rules }, reversible: true
      });
      return taskFromRow(updatedRow);
    });
  }

  async confirmTaskResult(actor: ActorContext, input: {
    taskId: string;
    expectedRevision: number;
  }): Promise<TaskInstanceRecord> {
    if (actor.role === "SPECTATOR") throw new DomainError("FORBIDDEN", 403, "Les spectateurs ne peuvent pas confirmer.");
    await this.assertTaskScope(actor, input.taskId);
    return this.db.transaction(async (tx) => {
      const beforeRow = (await tx.query<TaskRow>(
        `SELECT * FROM task_instances WHERE id=$1 AND session_id=$2 FOR UPDATE`, [input.taskId, actor.sessionId]
      )).rows[0];
      if (!beforeRow) throw new DomainError("TASK_NOT_FOUND", 404, "Mission introuvable.");
      const before = taskFromRow(beforeRow);
      if (before.revision !== input.expectedRevision) throw new DomainError("REVISION_CONFLICT", 409, "La mission a déjà été modifiée.", before);
      const confirmation = taskConfirmation(before.resultData);
      if (before.status !== "WAITING" || confirmation?.status !== "PENDING") throw new DomainError("NO_PENDING_CONFIRMATION", 409, "Aucune confirmation ouverte.");
      if (confirmation.policy === "SECOND_PERSON" && confirmation.submittedBy === actor.participantId) {
        throw new DomainError("SECOND_PERSON_REQUIRED", 409, "Une autre personne doit confirmer.");
      }
      if (confirmation.policy === "CAPTAIN" && actor.role !== "CAPTAIN") {
        throw new DomainError("CAPTAIN_CONFIRMATION_REQUIRED", 403, "Seul le capitaine peut confirmer.");
      }
      const confirmedData = withConfirmedConfirmation(before.resultData, actor.participantId);
      const updatedRow = (await tx.query<TaskRow>(
        `UPDATE task_instances SET status='COMPLETED',result_data=$2::jsonb,completed_at=now(),revision=revision+1,updated_at=now()
         WHERE id=$1 AND revision=$3 RETURNING *`,
        [input.taskId, JSON.stringify(confirmedData), input.expectedRevision]
      )).rows[0]!;
      const rules = await this.applyPostMutationRules(tx, actor.sessionId, before.definitionId, confirmedData);
      const revision = await this.bumpRevision(tx, actor.sessionId);
      await this.insertEvent(tx, {
        sessionId: actor.sessionId, revision, actorParticipantId: actor.participantId,
        type: "TASK_RESULT_CONFIRMED", entityType: "TASK", entityId: input.taskId,
        before, after: { task: taskFromRow(updatedRow), ...rules }, reversible: true
      });
      return taskFromRow(updatedRow);
    });
  }

  async transitionTask(actor: ActorContext, input: {
    taskId: string;
    expectedRevision: number;
    status: TaskStatus;
    resultData?: Record<string, unknown>;
    blockedReason?: string | null;
  }): Promise<TaskInstanceRecord> {
    if (actor.role === "SPECTATOR") throw new DomainError("FORBIDDEN", 403, "Les spectateurs ne peuvent pas modifier la session.");
    await this.assertTaskScope(actor, input.taskId);
    return this.db.transaction(async (tx) => {
      const beforeRow = (await tx.query<TaskRow>(
        `SELECT * FROM task_instances WHERE id=$1 AND session_id=$2 FOR UPDATE`, [input.taskId, actor.sessionId]
      )).rows[0];
      if (!beforeRow) throw new DomainError("TASK_NOT_FOUND", 404, "Mission introuvable.");
      const before = taskFromRow(beforeRow);
      if (before.revision !== input.expectedRevision) throw new DomainError("REVISION_CONFLICT", 409, "La mission a déjà été modifiée.", before);
      this.assertTransition(before.status, input.status, actor.role);
      if (actor.role === "PARTICIPANT" && before.ownerParticipantId && before.ownerParticipantId !== actor.participantId) {
        throw new DomainError("TASK_NOT_OWNED", 403, "Cette mission appartient à une autre personne.");
      }
      const definition = await this.getDefinitionForSession(tx, actor.sessionId);
      const taskDefinition = definition.tasks.find((task) => task.id === before.definitionId);
      let nextResult = input.resultData ? { ...before.resultData, ...input.resultData } : before.resultData;
      if (input.status === "COMPLETED" && taskDefinition) {
        const policy = taskDefinition.completion.confirmationPolicy;
        if (policy === "SECOND_PERSON" || policy === "CAPTAIN") {
          throw new DomainError("CONFIRMATION_FLOW_REQUIRED", 409, "Le résultat doit d’abord être envoyé et confirmé.");
        }
        if (policy === "SYSTEM") throw new DomainError("SYSTEM_TASK", 409, "Cette mission se termine automatiquement.");
        const validation = validateTaskResultFields(taskDefinition, nextResult);
        if (validation.missing.length || validation.invalid.length) throw new DomainError("TASK_RESULT_INVALID", 400, "Le résultat est incomplet ou invalide.", validation);
        nextResult = withConfirmedConfirmation(withPendingConfirmation(nextResult, "SELF", actor.participantId), actor.participantId);
      }
      const result = await tx.query<TaskRow>(
        `UPDATE task_instances SET status=$2,result_data=$3::jsonb,blocked_reason=$4,
           started_at=CASE WHEN $2='ACTIVE' AND started_at IS NULL THEN now() ELSE started_at END,
           completed_at=CASE WHEN $2='COMPLETED' THEN now() WHEN $2<>'COMPLETED' THEN NULL ELSE completed_at END,
           revision=revision+1,updated_at=now()
         WHERE id=$1 AND revision=$5 RETURNING *`,
        [input.taskId, input.status, JSON.stringify(nextResult), input.blockedReason ?? null, input.expectedRevision]
      );
      const updated = taskFromRow(result.rows[0]!);
      const rules = ["COMPLETED", "SKIPPED"].includes(input.status)
        ? await this.applyPostMutationRules(tx, actor.sessionId, before.definitionId, nextResult)
        : { unlockedDefinitionIds: [], automaticTaskDefinitionIds: [], transfers: [], sessionEnded: false };
      const revision = await this.bumpRevision(tx, actor.sessionId);
      await this.insertEvent(tx, {
        sessionId: actor.sessionId, revision, actorParticipantId: actor.participantId,
        type: "TASK_STATUS_CHANGED", entityType: "TASK", entityId: input.taskId,
        before, after: { task: updated, ...rules }, reversible: true
      });
      return updated;
    });
  }

  async adjustRaidLife(actor: ActorContext, input: {
    delta: number;
    cause: string;
    relatedTaskId?: string | null;
    correctionOf?: string | null;
  }): Promise<RaidState> {
    this.requireRole(actor, ["CAPTAIN", "EDITOR"]);
    if (!Number.isInteger(input.delta) || input.delta === 0 || Math.abs(input.delta) > 20) throw new DomainError("INVALID_LIFE_DELTA", 400, "Variation de vie invalide.");
    if (!input.cause.trim()) throw new DomainError("LIFE_CAUSE_REQUIRED", 400, "Cause manquante.");
    return this.db.transaction(async (tx) => {
      const row = (await tx.query<{ raid_state: RaidState }>(`SELECT raid_state FROM raid_sessions WHERE id=$1 FOR UPDATE`, [actor.sessionId])).rows[0];
      if (!row) throw new DomainError("SESSION_NOT_FOUND", 404, "Session introuvable.");
      const beforeState = structuredClone(row.raid_state ?? {});
      const state = getSanctuaireState(beforeState);
      const before = state.raidLife;
      const after = Math.max(0, Math.min(20, before + input.delta));
      const entry: SanctuaireLifeEntry = {
        id: randomUUID(), delta: after - before, before, after, cause: input.cause.trim(),
        actorParticipantId: actor.participantId, relatedTaskId: input.relatedTaskId ?? null,
        correctionOf: input.correctionOf ?? null, createdAt: new Date().toISOString()
      };
      const nextState: RaidState = { ...beforeState, sanctuaire: { ...state, raidLife: after, raidLifeHistory: [...state.raidLifeHistory, entry] } };
      await tx.query(`UPDATE raid_sessions SET raid_state=$2::jsonb WHERE id=$1`, [actor.sessionId, JSON.stringify(nextState)]);
      const revision = await this.bumpRevision(tx, actor.sessionId);
      await this.insertEvent(tx, {
        sessionId: actor.sessionId, revision, actorParticipantId: actor.participantId,
        type: "SANCTUAIRE_RAID_LIFE_CHANGED", entityType: "RAID_STATE", entityId: entry.id,
        before: { raidLife: before }, after: { raidLife: after, entry }, reversible: true
      });
      return nextState;
    });
  }

  async setCorridorTarget(actor: ActorContext, target: number, confirmedInGame: boolean): Promise<RaidState> {
    this.requireRole(actor, ["CAPTAIN"]);
    if (!Number.isInteger(target) || target < 1 || target > 500) throw new DomainError("INVALID_CORRIDOR_TARGET", 400, "L’objectif du corridor doit être compris entre 1 et 500.");
    return this.db.transaction(async (tx) => {
      const row = (await tx.query<{ raid_state: RaidState }>(`SELECT raid_state FROM raid_sessions WHERE id=$1 FOR UPDATE`, [actor.sessionId])).rows[0];
      if (!row) throw new DomainError("SESSION_NOT_FOUND", 404, "Session introuvable.");
      const beforeState = structuredClone(row.raid_state ?? {});
      const state = getSanctuaireState(beforeState);
      if (target < state.corridorCompleted) throw new DomainError("TARGET_BELOW_PROGRESS", 409, "L’objectif est inférieur à la progression confirmée.");
      if (state.corridorCompleted >= state.corridorTarget && target !== state.corridorTarget) {
        throw new DomainError("CORRIDOR_ALREADY_COMPLETED", 409, "L’objectif du corridor ne peut plus être modifié après son achèvement.");
      }
      const corridorTargetSourceStatus: SourceStatus = confirmedInGame ? "LIVE_CONFIRMED" : "GUIDE_CONFIRMED";
      const nextState: RaidState = { ...beforeState, sanctuaire: { ...state, corridorTarget: target, corridorTargetSourceStatus } };
      await tx.query(`UPDATE raid_sessions SET raid_state=$2::jsonb WHERE id=$1`, [actor.sessionId, JSON.stringify(nextState)]);
      const revision = await this.bumpRevision(tx, actor.sessionId);
      await this.insertEvent(tx, {
        sessionId: actor.sessionId, revision, actorParticipantId: actor.participantId,
        type: "SANCTUAIRE_CORRIDOR_TARGET_SET", entityType: "RAID_STATE", entityId: "corridor",
        before: { target: state.corridorTarget, sourceStatus: state.corridorTargetSourceStatus },
        after: { target, sourceStatus: corridorTargetSourceStatus }, reversible: true
      });
      return nextState;
    });
  }

  async setCorridorAssignment(actor: ActorContext, assignment: Omit<CorridorAssignment, "updatedAt">): Promise<RaidState> {
    this.requireRole(actor, ["CAPTAIN", "EDITOR"]);
    if (!Number.isInteger(assignment.room) || assignment.room < 1 || !Number.isInteger(assignment.slot) || assignment.slot < 1) {
      throw new DomainError("INVALID_CORRIDOR_ASSIGNMENT", 400, "Salle ou emplacement invalide.");
    }
    return this.db.transaction(async (tx) => {
      const row = (await tx.query<{ raid_state: RaidState }>(`SELECT raid_state FROM raid_sessions WHERE id=$1 FOR UPDATE`, [actor.sessionId])).rows[0];
      if (!row) throw new DomainError("SESSION_NOT_FOUND", 404, "Session introuvable.");
      const participant = (await tx.query<{ id: string }>(`SELECT id FROM participants WHERE id=$1 AND session_id=$2`, [assignment.participantId, actor.sessionId])).rows[0];
      if (!participant) throw new DomainError("PARTICIPANT_NOT_FOUND", 404, "Joueur introuvable.");
      const beforeState = structuredClone(row.raid_state ?? {});
      const state = getSanctuaireState(beforeState);
      const nextAssignment: CorridorAssignment = { ...assignment, updatedAt: new Date().toISOString() };
      const assignments = state.corridorAssignments.filter((item) => item.participantId !== assignment.participantId);
      assignments.push(nextAssignment);
      const nextState: RaidState = { ...beforeState, sanctuaire: { ...state, corridorAssignments: assignments } };
      await tx.query(`UPDATE raid_sessions SET raid_state=$2::jsonb WHERE id=$1`, [actor.sessionId, JSON.stringify(nextState)]);
      const revision = await this.bumpRevision(tx, actor.sessionId);
      await this.insertEvent(tx, {
        sessionId: actor.sessionId, revision, actorParticipantId: actor.participantId,
        type: "SANCTUAIRE_CORRIDOR_ASSIGNED", entityType: "RAID_STATE", entityId: assignment.participantId,
        before: state.corridorAssignments.find((item) => item.participantId === assignment.participantId) ?? null,
        after: nextAssignment, reversible: true
      });
      return nextState;
    });
  }

  async incrementCorridor(actor: ActorContext, delta: number): Promise<RaidState> {
    if (actor.role === "SPECTATOR") throw new DomainError("FORBIDDEN", 403, "Les spectateurs ne peuvent pas modifier la session.");
    if (!Number.isInteger(delta) || delta === 0 || Math.abs(delta) > 20) throw new DomainError("INVALID_CORRIDOR_DELTA", 400, "Variation de corridor invalide.");
    return this.db.transaction(async (tx) => {
      const row = (await tx.query<{ raid_state: RaidState }>(`SELECT raid_state FROM raid_sessions WHERE id=$1 FOR UPDATE`, [actor.sessionId])).rows[0];
      if (!row) throw new DomainError("SESSION_NOT_FOUND", 404, "Session introuvable.");
      const beforeState = structuredClone(row.raid_state ?? {});
      const state = getSanctuaireState(beforeState);
      const corridorTask = (await tx.query<{ status: TaskStatus }>(
        `SELECT status FROM task_instances WHERE session_id=$1 AND definition_id IN ('S3-COR-020','S3-COR-030')
         AND status IN ('READY','CLAIMED','ACTIVE','WAITING','FAILED') LIMIT 1`,
        [actor.sessionId]
      )).rows[0];
      if (!corridorTask) throw new DomainError("CORRIDOR_NOT_AVAILABLE", 409, "Le corridor n’est pas encore déverrouillé ou est déjà terminé.");
      const completed = Math.max(0, Math.min(state.corridorTarget, state.corridorCompleted + delta));
      const nextState: RaidState = { ...beforeState, sanctuaire: { ...state, corridorCompleted: completed } };
      await tx.query(`UPDATE raid_sessions SET raid_state=$2::jsonb WHERE id=$1`, [actor.sessionId, JSON.stringify(nextState)]);
      await tx.query(
        `UPDATE task_instances SET result_data=result_data || $2::jsonb,
          status=CASE WHEN $3 >= $4 THEN 'COMPLETED' ELSE CASE WHEN status IN ('READY','CLAIMED') THEN 'ACTIVE' ELSE status END END,
          completed_at=CASE WHEN $3 >= $4 THEN now() ELSE completed_at END,revision=revision+1,updated_at=now()
         WHERE session_id=$1 AND definition_id IN ('S3-COR-020','S3-COR-030')`,
        [actor.sessionId, JSON.stringify({ corridorCompleted: completed, corridorTarget: state.corridorTarget }), completed, state.corridorTarget]
      );
      const rules = await this.applyPostMutationRules(tx, actor.sessionId);
      const revision = await this.bumpRevision(tx, actor.sessionId);
      await this.insertEvent(tx, {
        sessionId: actor.sessionId, revision, actorParticipantId: actor.participantId,
        type: "SANCTUAIRE_CORRIDOR_PROGRESS", entityType: "RAID_STATE", entityId: "corridor",
        before: { completed: state.corridorCompleted, target: state.corridorTarget },
        after: { completed, target: state.corridorTarget, ...rules }, reversible: true
      });
      return nextState;
    });
  }



  async setGigalodonFloor1Target(actor: ActorContext, target: number, confirmedInGame: boolean): Promise<RaidState> {
    this.requireRole(actor, ["CAPTAIN"]);
    if (!Number.isInteger(target) || target < 1 || target > 100) throw new DomainError("INVALID_GROUP_TARGET", 400, "L’objectif de groupes doit être compris entre 1 et 100.");
    return this.db.transaction(async (tx) => {
      const definition = await this.getDefinitionForSession(tx, actor.sessionId);
      if (!isGigalodon(definition)) throw new DomainError("WRONG_RAID", 409, "Cette action n’est disponible que pour Gigalodon.");
      const row = (await tx.query<{ raid_state: RaidState }>(`SELECT raid_state FROM raid_sessions WHERE id=$1 FOR UPDATE`, [actor.sessionId])).rows[0];
      if (!row) throw new DomainError("SESSION_NOT_FOUND", 404, "Session introuvable.");
      const beforeState = structuredClone(row.raid_state ?? {});
      const state = getGigalodonState(beforeState);
      const floor = (state.floorStates["-1"] ?? {}) as Record<string, unknown>;
      const completed = Number(floor.groupsCompleted ?? 0);
      if (target < completed) throw new DomainError("TARGET_BELOW_PROGRESS", 409, "L’objectif est inférieur à la progression confirmée.");
      const nextState: RaidState = {
        ...beforeState,
        gigalodon: {
          ...state,
          floor1GroupTarget: target,
          floor1GroupTargetSourceStatus: confirmedInGame ? "LIVE_CONFIRMED" : "LIVE_REQUIRED",
          floorStates: { ...state.floorStates, "-1": { ...floor, groupTarget: target, groupsCompleted: completed } }
        }
      };
      await tx.query(`UPDATE raid_sessions SET raid_state=$2::jsonb WHERE id=$1`, [actor.sessionId, JSON.stringify(nextState)]);
      const revision = await this.bumpRevision(tx, actor.sessionId);
      await this.insertEvent(tx, {
        sessionId: actor.sessionId, revision, actorParticipantId: actor.participantId,
        type: "GIGALODON_FLOOR1_TARGET_SET", entityType: "RAID_STATE", entityId: "floor-1",
        before: { target: state.floor1GroupTarget, sourceStatus: state.floor1GroupTargetSourceStatus },
        after: { target, sourceStatus: confirmedInGame ? "LIVE_CONFIRMED" : "LIVE_REQUIRED" }, reversible: true
      });
      return nextState;
    });
  }

  async incrementGigalodonFloorGroups(actor: ActorContext, delta: number): Promise<RaidState> {
    if (actor.role === "SPECTATOR") throw new DomainError("FORBIDDEN", 403, "Les spectateurs ne peuvent pas modifier la progression des étages.");
    if (!Number.isInteger(delta) || delta === 0 || Math.abs(delta) > 20) throw new DomainError("INVALID_GROUP_DELTA", 400, "Variation de groupes invalide.");
    return this.db.transaction(async (tx) => {
      const definition = await this.getDefinitionForSession(tx, actor.sessionId);
      if (!isGigalodon(definition)) throw new DomainError("WRONG_RAID", 409, "Cette action n’est disponible que pour Gigalodon.");
      const task = (await tx.query<TaskRow>(`SELECT * FROM task_instances WHERE session_id=$1 AND definition_id='G1-020' FOR UPDATE`, [actor.sessionId])).rows[0];
      if (!task || !["READY","CLAIMED","ACTIVE","WAITING"].includes(task.status)) throw new DomainError("FLOOR_PROGRESS_NOT_AVAILABLE", 409, "La progression des étages n’est pas encore disponible.");
      const row = (await tx.query<{ raid_state: RaidState }>(`SELECT raid_state FROM raid_sessions WHERE id=$1 FOR UPDATE`, [actor.sessionId])).rows[0];
      if (!row) throw new DomainError("SESSION_NOT_FOUND", 404, "Session introuvable.");
      const beforeState = structuredClone(row.raid_state ?? {});
      const state = getGigalodonState(beforeState);
      const floor = (state.floorStates["-1"] ?? {}) as Record<string, unknown>;
      const before = Number(floor.groupsCompleted ?? 0);
      const completed = Math.max(0, Math.min(state.floor1GroupTarget, before + delta));
      const floorStates = { ...state.floorStates, "-1": { ...floor, groupTarget: state.floor1GroupTarget, groupsCompleted: completed } };
      const nextState: RaidState = { ...beforeState, gigalodon: { ...state, floorStates } };
      await tx.query(`UPDATE raid_sessions SET raid_state=$2::jsonb WHERE id=$1`, [actor.sessionId, JSON.stringify(nextState)]);
      await tx.query(
        `UPDATE task_instances SET status=CASE WHEN $3 >= $4 THEN 'COMPLETED' ELSE 'ACTIVE' END,
          result_data=result_data || $2::jsonb,completed_at=CASE WHEN $3 >= $4 THEN now() ELSE NULL END,
          revision=revision+1,updated_at=now() WHERE session_id=$1 AND definition_id='G1-020'`,
        [actor.sessionId, JSON.stringify({ groupTarget: state.floor1GroupTarget, groupsCompleted: completed }), completed, state.floor1GroupTarget]
      );
      const rules = completed >= state.floor1GroupTarget ? await this.applyPostMutationRules(tx, actor.sessionId, "G1-020", { groupTarget: state.floor1GroupTarget, groupsCompleted: completed }) : { unlockedDefinitionIds: [], automaticTaskDefinitionIds: [], transfers: [], sessionEnded: false };
      const revision = await this.bumpRevision(tx, actor.sessionId);
      await this.insertEvent(tx, {
        sessionId: actor.sessionId, revision, actorParticipantId: actor.participantId,
        type: "GIGALODON_FLOOR1_PROGRESS", entityType: "RAID_STATE", entityId: "floor-1",
        before: { completed: before, target: state.floor1GroupTarget }, after: { completed, target: state.floor1GroupTarget, ...rules }, reversible: true
      });
      return nextState;
    });
  }

  async setGigalodonLight(actor: ActorContext, input: {
    floor: number;
    level: number;
    observedAt?: string;
    responsibleParticipantId?: string | null;
    intervalSeconds?: number;
    intervalSourceStatus?: SourceStatus;
    saltCostSourceStatus?: SourceStatus;
  }): Promise<RaidState> {
    if (actor.role === "SPECTATOR") throw new DomainError("FORBIDDEN", 403, "Zuschauer dürfen Lichtwerte nicht ändern.");
    if (![-1, -2, -3, -4, -5].includes(input.floor)) throw new DomainError("INVALID_FLOOR", 400, "Étage invalide.");
    if (!Number.isInteger(input.level) || input.level < 0 || input.level > 4) throw new DomainError("INVALID_LIGHT_LEVEL", 400, "Lichtlevel muss zwischen 0 und 4 liegen.");
    const intervalSeconds = input.intervalSeconds ?? 120;
    if (!Number.isInteger(intervalSeconds) || intervalSeconds < 30 || intervalSeconds > 600) throw new DomainError("INVALID_LIGHT_INTERVAL", 400, "Lichtintervall muss zwischen 30 und 600 Sekunden liegen.");
    const observedAt = input.observedAt ?? new Date().toISOString();
    if (Number.isNaN(Date.parse(observedAt))) throw new DomainError("INVALID_TIMESTAMP", 400, "Beobachtungszeit ist ungültig.");
    return this.db.transaction(async (tx) => {
      const definition = await this.getDefinitionForSession(tx, actor.sessionId);
      if (!isGigalodon(definition)) throw new DomainError("WRONG_RAID", 409, "Cette action n’est disponible que pour Gigalodon.");
      const row = (await tx.query<{ raid_state: RaidState }>(`SELECT raid_state FROM raid_sessions WHERE id=$1 FOR UPDATE`, [actor.sessionId])).rows[0];
      if (!row) throw new DomainError("SESSION_NOT_FOUND", 404, "Session introuvable.");
      if (input.responsibleParticipantId) {
        const participant = (await tx.query<{ id: string }>(`SELECT id FROM participants WHERE id=$1 AND session_id=$2`, [input.responsibleParticipantId, actor.sessionId])).rows[0];
        if (!participant) throw new DomainError("PARTICIPANT_NOT_FOUND", 404, "Lichtverantwortlicher wurde nicht gefunden.");
      }
      const beforeState = structuredClone(row.raid_state ?? {});
      const state = getGigalodonState(beforeState);
      const accessKey = ({ "-2": "floor2", "-3": "floor3", "-4": "floor4", "-5": "floor5" } as const)[String(input.floor) as "-2" | "-3" | "-4" | "-5"];
      if (input.floor !== -1 && (!accessKey || state.access[accessKey] !== true)) throw new DomainError("LIGHT_NOT_UNLOCKED", 409, "La lumière d’étage commence seulement après le déverrouillage de l’étage.");
      const previous = state.lightStates.find((item) => item.floor === input.floor) ?? null;
      if (previous && input.level > effectiveLightLevel(previous)) {
        throw new DomainError("LIGHT_REFILL_COMMAND_REQUIRED", 409, "Eine Lichterhöhung muss Salz aus dem gemeinsamen Pool verbrauchen.");
      }
      const next: GigalodonLightState = {
        floor: input.floor,
        level: input.level,
        baselineLevel: previous?.baselineLevel ?? (input.floor === -1 ? 4 : 1),
        baselineSourceStatus: previous?.baselineSourceStatus ?? "GUIDE_CONFIRMED",
        observedAt,
        nextDecayAt: new Date(new Date(observedAt).getTime() + intervalSeconds * 1000).toISOString(),
        responsibleParticipantId: input.responsibleParticipantId ?? previous?.responsibleParticipantId ?? actor.participantId,
        intervalSeconds,
        intervalSourceStatus: input.intervalSourceStatus ?? state.lightIntervalSourceStatus,
        saltCostSourceStatus: input.saltCostSourceStatus ?? state.saltCostSourceStatus,
        updatedBy: actor.participantId
      };
      const lightStates = state.lightStates.filter((item) => item.floor !== input.floor);
      lightStates.push(next);
      lightStates.sort((a, b) => b.floor - a.floor);
      const nextState: RaidState = {
        ...beforeState,
        gigalodon: {
          ...state,
          lightStates,
          lightIntervalSeconds: intervalSeconds,
          lightIntervalSourceStatus: next.intervalSourceStatus,
          saltCostSourceStatus: next.saltCostSourceStatus
        }
      };
      await tx.query(`UPDATE raid_sessions SET raid_state=$2::jsonb WHERE id=$1`, [actor.sessionId, JSON.stringify(nextState)]);
      await tx.query(
        `UPDATE task_instances SET status=CASE WHEN status='READY' THEN 'ACTIVE' ELSE status END,
          result_data=result_data || $3::jsonb,revision=revision+1,updated_at=now()
         WHERE session_id=$1 AND definition_id=$2`,
        [actor.sessionId, "G-LIGHT-010", JSON.stringify({ floor: input.floor, level: input.level, observedAt, nextDecayAt: next.nextDecayAt })]
      );
      const revision = await this.bumpRevision(tx, actor.sessionId);
      await this.insertEvent(tx, {
        sessionId: actor.sessionId, revision, actorParticipantId: actor.participantId,
        type: "GIGALODON_LIGHT_OBSERVED", entityType: "RAID_STATE", entityId: String(input.floor),
        before: previous, after: next, reversible: true
      });
      return nextState;
    });
  }

  async adjustGigalodonSalt(actor: ActorContext, input: {
    delta: number;
    cause: string;
    responsibleParticipantId?: string | null;
  }): Promise<RaidState> {
    if (actor.role === "SPECTATOR") throw new DomainError("FORBIDDEN", 403, "Zuschauer dürfen den Salzpool nicht ändern.");
    if (!Number.isInteger(input.delta) || input.delta === 0 || Math.abs(input.delta) > 10_000) throw new DomainError("INVALID_SALT_DELTA", 400, "Ungültige Salzänderung.");
    if (input.delta < 0 && actor.role !== "CAPTAIN" && actor.role !== "EDITOR") throw new DomainError("FORBIDDEN", 403, "Nur Captain oder Editor dürfen den Salzpool korrigieren.");
    if (!input.cause.trim()) throw new DomainError("SALT_CAUSE_REQUIRED", 400, "Ursache der Salzänderung fehlt.");
    return this.db.transaction(async (tx) => {
      const definition = await this.getDefinitionForSession(tx, actor.sessionId);
      if (!isGigalodon(definition)) throw new DomainError("WRONG_RAID", 409, "Cette action n’est disponible que pour Gigalodon.");
      const row = (await tx.query<{ raid_state: RaidState }>(`SELECT raid_state FROM raid_sessions WHERE id=$1 FOR UPDATE`, [actor.sessionId])).rows[0];
      if (!row) throw new DomainError("SESSION_NOT_FOUND", 404, "Session introuvable.");
      const responsibleParticipantId = input.responsibleParticipantId ?? actor.participantId;
      const participant = (await tx.query<{ id: string }>(`SELECT id FROM participants WHERE id=$1 AND session_id=$2`, [responsibleParticipantId, actor.sessionId])).rows[0];
      if (!participant) throw new DomainError("PARTICIPANT_NOT_FOUND", 404, "Salzverantwortlicher wurde nicht gefunden.");
      const beforeState = structuredClone(row.raid_state ?? {});
      const state = getGigalodonState(beforeState);
      const after = state.saltPool.amount + input.delta;
      if (after < 0) throw new DomainError("INSUFFICIENT_SHARED_SALT", 409, "Der gemeinsame Salzpool darf nicht negativ werden.");
      const entry: GigalodonSaltChange = {
        id: randomUUID(),
        kind: input.delta > 0 ? "COLLECTION" : "CORRECTION",
        delta: input.delta,
        before: state.saltPool.amount,
        after,
        cause: input.cause.trim(),
        actorParticipantId: actor.participantId,
        responsibleParticipantId,
        floor: null,
        createdAt: new Date().toISOString()
      };
      const saltPool = {
        ...state.saltPool,
        amount: after,
        lastChange: entry,
        history: [...state.saltPool.history, entry],
        collectorParticipantIds: input.delta > 0
          ? [...new Set([...state.saltPool.collectorParticipantIds, responsibleParticipantId])]
          : state.saltPool.collectorParticipantIds
      };
      const nextState: RaidState = { ...beforeState, gigalodon: { ...state, saltPool } };
      await tx.query(`UPDATE raid_sessions SET raid_state=$2::jsonb WHERE id=$1`, [actor.sessionId, JSON.stringify(nextState)]);
      const revision = await this.bumpRevision(tx, actor.sessionId);
      await this.insertEvent(tx, {
        sessionId: actor.sessionId, revision, actorParticipantId: actor.participantId,
        type: "GIGALODON_SHARED_SALT_CHANGED", entityType: "RAID_STATE", entityId: entry.id,
        before: { amount: state.saltPool.amount }, after: { amount: after, entry }, reversible: true
      });
      return nextState;
    });
  }

  async refillGigalodonLight(actor: ActorContext, input: {
    floor: number;
    targetLevel: number;
    responsibleParticipantId?: string | null;
  }): Promise<RaidState> {
    if (actor.role === "SPECTATOR") throw new DomainError("FORBIDDEN", 403, "Zuschauer dürfen Licht nicht auffüllen.");
    if (![-1, -2, -3, -4, -5].includes(input.floor)) throw new DomainError("INVALID_FLOOR", 400, "Étage invalide.");
    if (!Number.isInteger(input.targetLevel) || input.targetLevel < 1 || input.targetLevel > 4) throw new DomainError("INVALID_LIGHT_LEVEL", 400, "Le niveau cible doit être compris entre 1 et 4.");
    return this.db.transaction(async (tx) => {
      const definition = await this.getDefinitionForSession(tx, actor.sessionId);
      if (!isGigalodon(definition)) throw new DomainError("WRONG_RAID", 409, "Cette action n’est disponible que pour Gigalodon.");
      const row = (await tx.query<{ raid_state: RaidState }>(`SELECT raid_state FROM raid_sessions WHERE id=$1 FOR UPDATE`, [actor.sessionId])).rows[0];
      if (!row) throw new DomainError("SESSION_NOT_FOUND", 404, "Session introuvable.");
      const responsibleParticipantId = input.responsibleParticipantId ?? actor.participantId;
      const participant = (await tx.query<{ id: string }>(`SELECT id FROM participants WHERE id=$1 AND session_id=$2`, [responsibleParticipantId, actor.sessionId])).rows[0];
      if (!participant) throw new DomainError("PARTICIPANT_NOT_FOUND", 404, "Auffüllverantwortlicher wurde nicht gefunden.");
      const beforeState = structuredClone(row.raid_state ?? {});
      const state = getGigalodonState(beforeState);
      const previous = state.lightStates.find((light) => light.floor === input.floor);
      if (!previous) throw new DomainError("LIGHT_NOT_UNLOCKED", 409, "La lumière d’étage n’est pas encore déverrouillée.", { floor: input.floor });
      const currentLevel = effectiveLightLevel(previous);
      const saltCost = calculateLightRefillCost(definition, currentLevel, input.targetLevel);
      if (saltCost <= 0) throw new DomainError("LIGHT_NOT_INCREASED", 409, "Le niveau cible doit être supérieur au niveau de lumière actuel.");
      if (state.saltPool.amount < saltCost) throw new DomainError("INSUFFICIENT_SHARED_SALT", 409, "Der gemeinsame Salzpool reicht für diese Auffüllung nicht aus.", { available: state.saltPool.amount, required: saltCost });
      const observedAt = new Date().toISOString();
      const nextLight: GigalodonLightState = {
        ...previous,
        level: input.targetLevel,
        observedAt,
        nextDecayAt: new Date(Date.parse(observedAt) + state.lightIntervalSeconds * 1000).toISOString(),
        responsibleParticipantId,
        intervalSeconds: state.lightIntervalSeconds,
        updatedBy: actor.participantId
      };
      const after = state.saltPool.amount - saltCost;
      const entry: GigalodonSaltChange = {
        id: randomUUID(), kind: "REFILL", delta: -saltCost, before: state.saltPool.amount, after,
        cause: `Lumière étage ${input.floor}: ${currentLevel} → ${input.targetLevel}`,
        actorParticipantId: actor.participantId, responsibleParticipantId, floor: input.floor, createdAt: observedAt
      };
      const saltPool = {
        ...state.saltPool,
        amount: after,
        lastChange: entry,
        history: [...state.saltPool.history, entry],
        refillerParticipantIds: [...new Set([...state.saltPool.refillerParticipantIds, responsibleParticipantId])]
      };
      const lightStates = state.lightStates.map((light) => light.floor === input.floor ? nextLight : light);
      const nextState: RaidState = { ...beforeState, gigalodon: { ...state, saltPool, lightStates } };
      await tx.query(`UPDATE raid_sessions SET raid_state=$2::jsonb WHERE id=$1`, [actor.sessionId, JSON.stringify(nextState)]);
      await tx.query(
        `UPDATE task_instances SET status=CASE WHEN status='READY' THEN 'ACTIVE' ELSE status END,
          result_data=result_data || $3::jsonb,revision=revision+1,updated_at=now()
         WHERE session_id=$1 AND definition_id=$2`,
        [actor.sessionId, "G-LIGHT-030", JSON.stringify({ floor: input.floor, oldLevel: currentLevel, targetLevel: input.targetLevel, saltUsed: saltCost, participantId: responsibleParticipantId })]
      );
      const revision = await this.bumpRevision(tx, actor.sessionId);
      await this.insertEvent(tx, {
        sessionId: actor.sessionId, revision, actorParticipantId: actor.participantId,
        type: "GIGALODON_LIGHT_REFILLED", entityType: "RAID_STATE", entityId: String(input.floor),
        before: { light: previous, sharedSalt: state.saltPool.amount }, after: { light: nextLight, sharedSalt: after, saltChange: entry }, reversible: true
      });
      return nextState;
    });
  }

  async updateGigalodonInventory(actor: ActorContext, input: {
    participantId: string;
    resources: Record<string, unknown>;
    currentFloor: number | null;
    risk?: "LOW" | "MEDIUM" | "HIGH";
    confirmedAt?: string;
  }): Promise<RaidState> {
    if (actor.role === "SPECTATOR") throw new DomainError("FORBIDDEN", 403, "Les spectateurs ne peuvent pas modifier les inventaires.");
    if (actor.role === "PARTICIPANT" && input.participantId !== actor.participantId) throw new DomainError("FORBIDDEN", 403, "Les joueurs ne peuvent modifier que leur propre inventaire.");
    if (Object.prototype.hasOwnProperty.call(input.resources, "salt")) throw new DomainError("PERSONAL_SALT_FORBIDDEN", 400, "Le sel est une ressource commune du raid et ne doit pas être stocké dans l’inventaire personnel.");
    if (input.currentFloor !== null && ![-1, -2, -3, -4, -5, -6, 0].includes(input.currentFloor)) throw new DomainError("INVALID_FLOOR", 400, "Étage invalide.");
    const confirmedAt = input.confirmedAt ?? new Date().toISOString();
    if (Number.isNaN(Date.parse(confirmedAt))) throw new DomainError("INVALID_TIMESTAMP", 400, "L’heure de confirmation est invalide.");
    return this.db.transaction(async (tx) => {
      const definition = await this.getDefinitionForSession(tx, actor.sessionId);
      if (!isGigalodon(definition)) throw new DomainError("WRONG_RAID", 409, "Cette action n’est disponible que pour Gigalodon.");
      const participant = (await tx.query<{ id: string }>(`SELECT id FROM participants WHERE id=$1 AND session_id=$2`, [input.participantId, actor.sessionId])).rows[0];
      if (!participant) throw new DomainError("PARTICIPANT_NOT_FOUND", 404, "Joueur introuvable.");
      const row = (await tx.query<{ raid_state: RaidState }>(`SELECT raid_state FROM raid_sessions WHERE id=$1 FOR UPDATE`, [actor.sessionId])).rows[0];
      if (!row) throw new DomainError("SESSION_NOT_FOUND", 404, "Session introuvable.");
      const beforeState = structuredClone(row.raid_state ?? {});
      const state = getGigalodonState(beforeState);
      const previous = state.participantInventories.find((item) => item.participantId === input.participantId) ?? null;
      const inventory: GigalodonInventory = {
        participantId: input.participantId,
        resources: normalizeGigalodonResources(input.resources),
        currentFloor: input.currentFloor,
        risk: input.risk ?? previous?.risk ?? "LOW",
        lastConfirmedAt: confirmedAt,
        updatedBy: actor.participantId
      };
      const participantInventories = state.participantInventories.filter((item) => item.participantId !== input.participantId);
      participantInventories.push(inventory);
      const projectedUnbankedScore = calculateProjectedUnbankedScore(definition, participantInventories);
      const nextState: RaidState = {
        ...beforeState,
        gigalodon: {
          ...state,
          participantInventories,
          projectedUnbankedScore,
          finalReadiness: {
            ...state.finalReadiness,
            criticalUnbankedScore: projectedUnbankedScore,
            staleInventoryParticipantIds: staleInventoryIds(participantInventories)
          }
        }
      };
      await tx.query(`UPDATE raid_sessions SET raid_state=$2::jsonb WHERE id=$1`, [actor.sessionId, JSON.stringify(nextState)]);
      await tx.query(
        `UPDATE task_instances SET status=CASE WHEN status='READY' THEN 'ACTIVE' ELSE status END,
          result_data=result_data || $3::jsonb,revision=revision+1,updated_at=now()
         WHERE session_id=$1 AND definition_id=$2`,
        [actor.sessionId, "G-LEDGER-010", JSON.stringify({ participantId: input.participantId, resources: inventory.resources, currentFloor: inventory.currentFloor, lastConfirmedAt: confirmedAt, risk: inventory.risk })]
      );
      const revision = await this.bumpRevision(tx, actor.sessionId);
      await this.insertEvent(tx, {
        sessionId: actor.sessionId, revision, actorParticipantId: actor.participantId,
        type: "GIGALODON_INVENTORY_CONFIRMED", entityType: "RAID_STATE", entityId: input.participantId,
        before: previous, after: { inventory, projectedUnbankedScore }, reversible: true
      });
      return nextState;
    });
  }

  async depositGigalodonInventory(actor: ActorContext, participantId: string): Promise<RaidState> {
    if (actor.role === "SPECTATOR") throw new DomainError("FORBIDDEN", 403, "Les spectateurs ne peuvent pas confirmer un dépôt.");
    if (actor.role === "PARTICIPANT" && participantId !== actor.participantId) throw new DomainError("FORBIDDEN", 403, "Les joueurs ne peuvent déposer que leur propre inventaire.");
    return this.db.transaction(async (tx) => {
      const definition = await this.getDefinitionForSession(tx, actor.sessionId);
      if (!isGigalodon(definition)) throw new DomainError("WRONG_RAID", 409, "Cette action n’est disponible que pour Gigalodon.");
      const row = (await tx.query<{ raid_state: RaidState }>(`SELECT raid_state FROM raid_sessions WHERE id=$1 FOR UPDATE`, [actor.sessionId])).rows[0];
      if (!row) throw new DomainError("SESSION_NOT_FOUND", 404, "Session introuvable.");
      const beforeState = structuredClone(row.raid_state ?? {});
      const state = getGigalodonState(beforeState);
      const inventory = state.participantInventories.find((item) => item.participantId === participantId);
      if (!inventory) throw new DomainError("INVENTORY_NOT_FOUND", 409, "Aucun inventaire n’a encore été confirmé pour ce joueur.");
      const depositResources = normalizeGigalodonResources(inventory.resources);
      depositResources.pinceExecrabe = 0;
      const scoreDelta = calculateResourceScore(definition, depositResources);
      if (scoreDelta <= 0) throw new DomainError("NOTHING_TO_DEPOSIT", 409, "Aucune ressource comptant pour le score n’est disponible.");
      const remaining = normalizeGigalodonResources(inventory.resources);
      for (const key of GIGALODON_RESOURCE_KEYS) if (key !== "pinceExecrabe") remaining[key] = 0;
      const participantInventories = state.participantInventories.map((item) => item.participantId === participantId ? { ...item, resources: remaining, lastConfirmedAt: new Date().toISOString(), updatedBy: actor.participantId } : item);
      const depositedResources = normalizeGigalodonResources(state.depositedResources);
      for (const key of GIGALODON_RESOURCE_KEYS) depositedResources[key] += depositResources[key];
      const bossUniqueDrops = structuredClone(state.bossUniqueDrops);
      if (depositResources.uniteMureine > 0) bossUniqueDrops.mureine.banked = true;
      if (depositResources.rancuneExecrabe > 0) bossUniqueDrops.execrabe.banked = true;
      if (depositResources.noirceurWillorque > 0) bossUniqueDrops.willorque.banked = true;
      const confirmedScore = state.confirmedScore + scoreDelta;
      const projectedUnbankedScore = calculateProjectedUnbankedScore(definition, participantInventories);
      const entry: GigalodonDepositEntry = { id: randomUUID(), participantId, resources: depositResources, scoreDelta, createdAt: new Date().toISOString(), actorParticipantId: actor.participantId };
      const nextState: RaidState = {
        ...beforeState,
        gigalodon: {
          ...state,
          participantInventories,
          depositedResources,
          confirmedScore,
          projectedUnbankedScore,
          bossUniqueDrops,
          deposits: [...state.deposits, entry],
          finalReadiness: {
            ...state.finalReadiness,
            mureineResourceBanked: bossUniqueDrops.mureine.banked,
            execrabeResourceBanked: bossUniqueDrops.execrabe.banked,
            willorqueResourceBanked: bossUniqueDrops.willorque.banked,
            criticalUnbankedScore: projectedUnbankedScore,
            staleInventoryParticipantIds: staleInventoryIds(participantInventories)
          }
        }
      };
      await tx.query(`UPDATE raid_sessions SET raid_state=$2::jsonb WHERE id=$1`, [actor.sessionId, JSON.stringify(nextState)]);
      await tx.query(
        `UPDATE task_instances SET status=CASE WHEN status='READY' THEN 'ACTIVE' ELSE status END,
          result_data=result_data || $3::jsonb,revision=revision+1,updated_at=now()
         WHERE session_id=$1 AND definition_id=$2`,
        [actor.sessionId, "G-LEDGER-030", JSON.stringify({ participantId, resources: depositResources, confirmedScoreDelta: scoreDelta })]
      );
      const revision = await this.bumpRevision(tx, actor.sessionId);
      await this.insertEvent(tx, {
        sessionId: actor.sessionId, revision, actorParticipantId: actor.participantId,
        type: "GIGALODON_RESOURCES_DEPOSITED", entityType: "RAID_STATE", entityId: entry.id,
        before: { inventory, confirmedScore: state.confirmedScore }, after: { entry, confirmedScore, projectedUnbankedScore }, reversible: true
      });
      return nextState;
    });
  }

  async recordGigalodonLoss(actor: ActorContext, input: {
    participantId: string;
    lostResources: Record<string, unknown>;
    uniqueResourceAffected: boolean;
    uniqueLossSourceStatus: SourceStatus;
  }): Promise<RaidState> {
    this.requireRole(actor, ["CAPTAIN"]);
    if (Object.prototype.hasOwnProperty.call(input.lostResources, "salt")) throw new DomainError("PERSONAL_SALT_FORBIDDEN", 400, "Gemeinsames Salz kann nicht als persönlicher Verlust verbucht werden.");
    return this.db.transaction(async (tx) => {
      const definition = await this.getDefinitionForSession(tx, actor.sessionId);
      if (!isGigalodon(definition)) throw new DomainError("WRONG_RAID", 409, "Cette action n’est disponible que pour Gigalodon.");
      const row = (await tx.query<{ raid_state: RaidState }>(`SELECT raid_state FROM raid_sessions WHERE id=$1 FOR UPDATE`, [actor.sessionId])).rows[0];
      if (!row) throw new DomainError("SESSION_NOT_FOUND", 404, "Session introuvable.");
      const beforeState = structuredClone(row.raid_state ?? {});
      const state = getGigalodonState(beforeState);
      const inventory = state.participantInventories.find((item) => item.participantId === input.participantId);
      if (!inventory) throw new DomainError("INVENTORY_NOT_FOUND", 409, "Inventaire introuvable.");
      const requested = normalizeGigalodonResources(input.lostResources);
      const lostResources: Partial<GigalodonResources> = {};
      const remaining = normalizeGigalodonResources(inventory.resources);
      for (const key of GIGALODON_RESOURCE_KEYS) {
        const amount = Math.min(remaining[key], requested[key]);
        if (amount > 0) {
          remaining[key] -= amount;
          lostResources[key] = amount;
        }
      }
      const lostScore = calculateResourceScore(definition, lostResources);
      const participantInventories = state.participantInventories.map((item) => item.participantId === input.participantId ? { ...item, resources: remaining, currentFloor: 0, risk: "LOW" as const, lastConfirmedAt: new Date().toISOString(), updatedBy: actor.participantId } : item);
      const bossUniqueDrops = structuredClone(state.bossUniqueDrops);
      if (input.uniqueResourceAffected && ["LIVE_CONFIRMED", "PLAYER_CORRECTED"].includes(input.uniqueLossSourceStatus)) {
        if ((lostResources.uniteMureine ?? 0) > 0) bossUniqueDrops.mureine = { holderParticipantId: null, banked: false };
        if ((lostResources.rancuneExecrabe ?? 0) > 0) bossUniqueDrops.execrabe = { holderParticipantId: null, banked: false };
        if ((lostResources.noirceurWillorque ?? 0) > 0) bossUniqueDrops.willorque = { holderParticipantId: null, banked: false };
      }
      const entry: GigalodonLossEntry = { id: randomUUID(), participantId: input.participantId, lostResources, lostScore, uniqueResourceAffected: input.uniqueResourceAffected, uniqueLossSourceStatus: input.uniqueLossSourceStatus, createdAt: new Date().toISOString(), actorParticipantId: actor.participantId };
      const projectedUnbankedScore = calculateProjectedUnbankedScore(definition, participantInventories);
      const nextState: RaidState = {
        ...beforeState,
        gigalodon: {
          ...state,
          participantInventories,
          bossUniqueDrops,
          projectedUnbankedScore,
          losses: [...state.losses, entry],
          finalReadiness: { ...state.finalReadiness, criticalUnbankedScore: projectedUnbankedScore }
        }
      };
      await tx.query(`UPDATE raid_sessions SET raid_state=$2::jsonb WHERE id=$1`, [actor.sessionId, JSON.stringify(nextState)]);
      const revision = await this.bumpRevision(tx, actor.sessionId);
      await this.insertEvent(tx, {
        sessionId: actor.sessionId, revision, actorParticipantId: actor.participantId,
        type: "GIGALODON_RESOURCE_LOSS_RECORDED", entityType: "RAID_STATE", entityId: entry.id,
        before: inventory, after: { entry, inventory: participantInventories.find((item) => item.participantId === input.participantId), projectedUnbankedScore }, reversible: true
      });
      return nextState;
    });
  }

  async setGigalodonFragment(actor: ActorContext, fragment: "first" | "second" | "third" | "fourth", obtained: boolean): Promise<RaidState> {
    this.requireRole(actor, ["CAPTAIN", "EDITOR"]);
    return this.db.transaction(async (tx) => {
      const definition = await this.getDefinitionForSession(tx, actor.sessionId);
      if (!isGigalodon(definition)) throw new DomainError("WRONG_RAID", 409, "Cette action n’est disponible que pour Gigalodon.");
      const row = (await tx.query<{ raid_state: RaidState }>(`SELECT raid_state FROM raid_sessions WHERE id=$1 FOR UPDATE`, [actor.sessionId])).rows[0];
      if (!row) throw new DomainError("SESSION_NOT_FOUND", 404, "Session introuvable.");
      const beforeState = structuredClone(row.raid_state ?? {});
      const state = getGigalodonState(beforeState);
      const fragments = { ...state.fragments, [fragment]: obtained };
      const nextState: RaidState = { ...beforeState, gigalodon: { ...state, fragments } };
      await tx.query(`UPDATE raid_sessions SET raid_state=$2::jsonb WHERE id=$1`, [actor.sessionId, JSON.stringify(nextState)]);
      const rules = await this.applyPostMutationRules(tx, actor.sessionId);
      const revision = await this.bumpRevision(tx, actor.sessionId);
      await this.insertEvent(tx, {
        sessionId: actor.sessionId, revision, actorParticipantId: actor.participantId,
        type: "GIGALODON_FRAGMENT_CHANGED", entityType: "RAID_STATE", entityId: fragment,
        before: state.fragments[fragment], after: { obtained, ...rules }, reversible: true
      });
      return nextState;
    });
  }

  async confirmGigalodonFinalReadiness(actor: ActorContext, input: {
    activeFights: number;
    activeFightsRuleSourceStatus: SourceStatus;
    finalTeamReady: boolean;
    captainConfirmed: boolean;
  }): Promise<RaidState> {
    this.requireRole(actor, ["CAPTAIN"]);
    if (!Number.isInteger(input.activeFights) || input.activeFights < 0 || input.activeFights > 20) throw new DomainError("INVALID_ACTIVE_FIGHTS", 400, "Nombre de combats actifs invalide.");
    return this.db.transaction(async (tx) => {
      const definition = await this.getDefinitionForSession(tx, actor.sessionId);
      if (!isGigalodon(definition)) throw new DomainError("WRONG_RAID", 409, "Cette action n’est disponible que pour Gigalodon.");
      const row = (await tx.query<{ raid_state: RaidState; timer_started_at: string | Date | null; timer_duration_seconds: number }>(`SELECT raid_state,timer_started_at,timer_duration_seconds FROM raid_sessions WHERE id=$1 FOR UPDATE`, [actor.sessionId])).rows[0];
      if (!row) throw new DomainError("SESSION_NOT_FOUND", 404, "Session introuvable.");
      const beforeState = structuredClone(row.raid_state ?? {});
      const state = getGigalodonState(beforeState);
      const remainingSeconds = row.timer_started_at ? Math.max(0, row.timer_duration_seconds - Math.floor((Date.now() - new Date(row.timer_started_at).getTime()) / 1000)) : row.timer_duration_seconds;
      const finalReadiness = {
        ...state.finalReadiness,
        timerAboveSafetyThreshold: remainingSeconds > 180,
        mureineResourceBanked: state.bossUniqueDrops.mureine.banked,
        execrabeResourceBanked: state.bossUniqueDrops.execrabe.banked,
        willorqueResourceBanked: state.bossUniqueDrops.willorque.banked,
        criticalUnbankedScore: state.projectedUnbankedScore,
        activeFights: input.activeFights,
        activeFightsRuleSourceStatus: input.activeFightsRuleSourceStatus,
        finalTeamReady: input.finalTeamReady,
        captainConfirmed: input.captainConfirmed,
        staleInventoryParticipantIds: staleInventoryIds(state.participantInventories)
      };
      const nextGig = { ...state, finalReadiness };
      const summary = finalReadinessSummary(nextGig);
      if (input.captainConfirmed && summary.blocked.length > 0) throw new DomainError("FINAL_NOT_READY", 409, "Le lancement final n’est pas encore autorisé.", summary);
      const nextState: RaidState = { ...beforeState, gigalodon: nextGig };
      await tx.query(`UPDATE raid_sessions SET raid_state=$2::jsonb,status=CASE WHEN status='LIVE' THEN 'FINAL_PREP' ELSE status END WHERE id=$1`, [actor.sessionId, JSON.stringify(nextState)]);
      if (input.captainConfirmed && summary.blocked.length === 0) {
        await tx.query(
          `UPDATE task_instances SET status='COMPLETED',result_data=result_data || $3::jsonb,completed_at=now(),revision=revision+1,updated_at=now()
           WHERE session_id=$1 AND definition_id=$2 AND status IN ('READY','CLAIMED','ACTIVE','WAITING')`,
          [actor.sessionId, "GF-030", JSON.stringify(finalReadiness)]
        );
      }
      const rules = input.captainConfirmed && summary.blocked.length === 0 ? await this.applyPostMutationRules(tx, actor.sessionId, "GF-030", finalReadiness) : { unlockedDefinitionIds: [], automaticTaskDefinitionIds: [], transfers: [], sessionEnded: false };
      const revision = await this.bumpRevision(tx, actor.sessionId);
      await this.insertEvent(tx, {
        sessionId: actor.sessionId, revision, actorParticipantId: actor.participantId,
        type: "GIGALODON_FINAL_READINESS_CONFIRMED", entityType: "RAID_STATE", entityId: "final-readiness",
        before: state.finalReadiness, after: { finalReadiness, summary, ...rules }, reversible: true
      });
      return nextState;
    });
  }

  async startGigalodonFinal(actor: ActorContext, preparationSeconds = 180): Promise<RaidState> {
    this.requireRole(actor, ["CAPTAIN"]);
    if (!Number.isInteger(preparationSeconds) || preparationSeconds < 0 || preparationSeconds > 900) throw new DomainError("INVALID_PREPARATION_TIME", 400, "Ungültige Vorbereitungszeit.");
    return this.db.transaction(async (tx) => {
      const definition = await this.getDefinitionForSession(tx, actor.sessionId);
      if (!isGigalodon(definition)) throw new DomainError("WRONG_RAID", 409, "Cette action n’est disponible que pour Gigalodon.");
      const row = (await tx.query<{ raid_state: RaidState; status: SessionRecord["status"]; timer_started_at: string | Date | null; timer_duration_seconds: number }>(`SELECT raid_state,status,timer_started_at,timer_duration_seconds FROM raid_sessions WHERE id=$1 FOR UPDATE`, [actor.sessionId])).rows[0];
      if (!row) throw new DomainError("SESSION_NOT_FOUND", 404, "Session introuvable.");
      const state = getGigalodonState(row.raid_state ?? {});
      if (!state.finalReadiness.captainConfirmed) throw new DomainError("FINAL_NOT_CONFIRMED", 409, "Le contrôle de départ final n’a pas été confirmé.");
      if (state.finalReadiness.activeFightsRuleSourceStatus === "LIVE_CONFIRMED" && state.finalReadiness.activeFights > 0) throw new DomainError("ACTIVE_FIGHTS_BLOCK_FINAL", 409, "Les combats actifs bloquent le lancement final confirmé en jeu.");
      if (state.final.result) throw new DomainError("FINAL_ALREADY_COMPLETED", 409, "Aucune nouvelle tentative n’est autorisée après un combat final terminé.");
      if (state.final.startedAt) throw new DomainError("FINAL_ALREADY_STARTED", 409, "Der Gigalodon-Finalversuch wurde bereits gestartet.");
      const remainingSeconds = row.timer_started_at ? row.timer_duration_seconds - Math.floor((Date.now() - new Date(row.timer_started_at).getTime()) / 1000) : row.timer_duration_seconds;
      if (remainingSeconds <= 0) throw new DomainError("RAID_TIMER_EXPIRED", 409, "Le combat final n’a pas été lancé avant l’expiration du chronomètre du raid.");
      const startedAt = new Date().toISOString();
      const nextState: RaidState = { ...row.raid_state, gigalodon: { ...state, final: { ...state.final, startedAt, startedBeforeExpiry: true, preparationSeconds, combatRound: 1 } } };
      await tx.query(`UPDATE raid_sessions SET raid_state=$2::jsonb,status='FINAL_ACTIVE' WHERE id=$1`, [actor.sessionId, JSON.stringify(nextState)]);
      await tx.query(
        `UPDATE task_instances SET status='COMPLETED',result_data=result_data || $3::jsonb,completed_at=now(),revision=revision+1,updated_at=now()
         WHERE session_id=$1 AND definition_id=$2 AND status IN ('READY','CLAIMED','ACTIVE','WAITING')`,
        [actor.sessionId, "GG-010", JSON.stringify({ startedAt, preparationSeconds })]
      );
      const rules = await this.applyPostMutationRules(tx, actor.sessionId, "GG-010", { startedAt, preparationSeconds });
      const revision = await this.bumpRevision(tx, actor.sessionId);
      await this.insertEvent(tx, {
        sessionId: actor.sessionId, revision, actorParticipantId: actor.participantId,
        type: "GIGALODON_FINAL_STARTED", entityType: "RAID_STATE", entityId: "final",
        before: state.final, after: { final: getGigalodonState(nextState).final, remainingSecondsAtStart: remainingSeconds, ...rules }, reversible: false
      });
      return nextState;
    });
  }

  async updateGigalodonFinal(actor: ActorContext, input: {
    combatRound: number;
    totalDamage: number;
    swallowedParticipantId?: string | null;
    blackGlyphOccupied?: boolean;
    completed?: boolean;
    result?: "VICTORY" | "DEFEAT";
  }): Promise<RaidState> {
    if (actor.role === "SPECTATOR") throw new DomainError("FORBIDDEN", 403, "Les spectateurs ne peuvent pas mettre à jour le combat final.");
    if (!Number.isInteger(input.combatRound) || input.combatRound < 1 || input.combatRound > 3) throw new DomainError("INVALID_COMBAT_ROUND", 400, "Runde muss zwischen 1 und 3 liegen.");
    if (!Number.isInteger(input.totalDamage) || input.totalDamage < 0) throw new DomainError("INVALID_DAMAGE", 400, "Les dégâts sont invalides.");
    return this.db.transaction(async (tx) => {
      const definition = await this.getDefinitionForSession(tx, actor.sessionId);
      if (!isGigalodon(definition)) throw new DomainError("WRONG_RAID", 409, "Cette action n’est disponible que pour Gigalodon.");
      const row = (await tx.query<{ raid_state: RaidState; status: SessionRecord["status"] }>(`SELECT raid_state,status FROM raid_sessions WHERE id=$1 FOR UPDATE`, [actor.sessionId])).rows[0];
      if (!row) throw new DomainError("SESSION_NOT_FOUND", 404, "Session introuvable.");
      if (row.status !== "FINAL_ACTIVE") throw new DomainError("FINAL_NOT_ACTIVE", 409, "Le combat final Gigalodon n’est pas actif.");
      const state = getGigalodonState(row.raid_state ?? {});
      if (state.final.result) throw new DomainError("FINAL_ALREADY_COMPLETED", 409, "Der Finalversuch ist bereits abgeschlossen.");
      if (input.completed && !input.result) throw new DomainError("FINAL_RESULT_REQUIRED", 400, "Für den Abschluss ist VICTORY oder DEFEAT erforderlich.");
      const bonusScore = calculateDamageBonus(definition, input.totalDamage);
      const recordedAt = new Date().toISOString();
      const damageRound = { round: input.combatRound, cumulativeDamage: input.totalDamage, recordedAt, actorParticipantId: actor.participantId };
      const damageRounds = [...state.final.damageRounds.filter((entry) => entry.round !== input.combatRound), damageRound].sort((left, right) => left.round - right.round);
      const totalScore = state.confirmedScore + bonusScore;
      const final = {
        ...state.final,
        combatRound: input.combatRound,
        totalDamage: input.totalDamage,
        damageRounds,
        projectedBonusScore: bonusScore,
        bonusScore: input.completed ? bonusScore : state.final.bonusScore,
        result: input.completed ? input.result! : null,
        completedAt: input.completed ? recordedAt : null,
        confirmedResourceScore: input.completed ? state.confirmedScore : null,
        finalBonusScore: input.completed ? bonusScore : null,
        totalScore: input.completed ? totalScore : null,
        swallowedParticipantId: input.swallowedParticipantId ?? state.final.swallowedParticipantId,
        blackGlyphOccupied: input.blackGlyphOccupied ?? state.final.blackGlyphOccupied
      };
      const nextState: RaidState = { ...row.raid_state, gigalodon: { ...state, final } };
      await tx.query(`UPDATE raid_sessions SET raid_state=$2::jsonb WHERE id=$1`, [actor.sessionId, JSON.stringify(nextState)]);
      await tx.query(
        `UPDATE task_instances SET status=$3,result_data=result_data || $4::jsonb,
          completed_at=CASE WHEN $3='COMPLETED' THEN now() ELSE completed_at END,revision=revision+1,updated_at=now()
         WHERE session_id=$1 AND definition_id=$2`,
        [actor.sessionId, "GG-020", input.completed ? "COMPLETED" : "ACTIVE", JSON.stringify({ combatRound: input.combatRound, totalDamage: input.totalDamage, projectedBonusScore: bonusScore })]
      );
      if (input.completed) {
        await tx.query(
          `UPDATE task_instances SET status='COMPLETED',result_data=result_data || $3::jsonb,completed_at=now(),revision=revision+1,updated_at=now()
           WHERE session_id=$1 AND definition_id=$2 AND status IN ('LOCKED','READY','ACTIVE')`,
          [actor.sessionId, "GG-040", JSON.stringify({ bonusScore })]
        );
      }
      const rules = input.completed ? await this.applyPostMutationRules(tx, actor.sessionId, "GG-020", { combatRound: input.combatRound, totalDamage: input.totalDamage, projectedBonusScore: bonusScore }) : { unlockedDefinitionIds: [], automaticTaskDefinitionIds: [], transfers: [], sessionEnded: false };
      const revision = await this.bumpRevision(tx, actor.sessionId);
      await this.insertEvent(tx, {
        sessionId: actor.sessionId, revision, actorParticipantId: actor.participantId,
        type: input.completed ? "GIGALODON_FINAL_RESULT_RECORDED" : "GIGALODON_DAMAGE_UPDATED", entityType: "RAID_STATE", entityId: "final",
        before: state.final, after: { final, ...rules }, reversible: true
      });
      return nextState;
    });
  }

  async finishGigalodonRaid(actor: ActorContext): Promise<RaidState> {
    this.requireRole(actor, ["CAPTAIN"]);
    return this.db.transaction(async (tx) => {
      const definition = await this.getDefinitionForSession(tx, actor.sessionId);
      if (!isGigalodon(definition)) throw new DomainError("WRONG_RAID", 409, "Cette action n’est disponible que pour Gigalodon.");
      const row = (await tx.query<{ raid_state: RaidState; status: SessionRecord["status"] }>(`SELECT raid_state,status FROM raid_sessions WHERE id=$1 FOR UPDATE`, [actor.sessionId])).rows[0];
      if (!row) throw new DomainError("SESSION_NOT_FOUND", 404, "Session introuvable.");
      if (row.status !== "FINAL_ACTIVE") throw new DomainError("FINAL_NOT_ACTIVE", 409, "Le combat final n’est pas actif.");
      const state = getGigalodonState(row.raid_state ?? {});
      if (!state.final.result) throw new DomainError("FINAL_RESULT_REQUIRED", 409, "Le combat final nécessite un résultat avant la clôture du raid.");
      const totalScore = state.final.totalScore ?? state.confirmedScore + state.final.bonusScore;
      await tx.query(`UPDATE raid_sessions SET status='ENDED',ended_at=now() WHERE id=$1`, [actor.sessionId]);
      await tx.query(
        `UPDATE task_instances SET status='COMPLETED',result_data=result_data || $3::jsonb,completed_at=now(),revision=revision+1,updated_at=now()
         WHERE session_id=$1 AND definition_id=$2 AND status IN ('READY','CLAIMED','ACTIVE','WAITING')`,
        [actor.sessionId, "GG-050", JSON.stringify({ result: state.final.result, totalDamage: state.final.totalDamage, damageRounds: state.final.damageRounds, confirmedResourceScore: state.confirmedScore, bonusScore: state.final.bonusScore, totalScore })]
      );
      const revision = await this.bumpRevision(tx, actor.sessionId);
      await this.insertEvent(tx, {
        sessionId: actor.sessionId, revision, actorParticipantId: actor.participantId,
        type: "GIGALODON_RAID_ENDED", entityType: "SESSION", entityId: actor.sessionId,
        before: { status: row.status }, after: { status: "ENDED", result: state.final.result, totalDamage: state.final.totalDamage, damageRounds: state.final.damageRounds, confirmedResourceScore: state.confirmedScore, bonusScore: state.final.bonusScore, totalScore }, reversible: false
      });
      return row.raid_state;
    });
  }

  async reportInformationIncorrect(actor: ActorContext, input: { reference: string; note: string }): Promise<InformationReport> {
    if (actor.role === "SPECTATOR") throw new DomainError("FORBIDDEN", 403, "Zuschauer dürfen keine fachliche Abweichung melden.");
    if (!input.reference.trim() || input.reference.trim().length > 160) throw new DomainError("INVALID_INFORMATION_REFERENCE", 400, "Regel oder Anzeige muss referenziert werden.");
    if (!input.note.trim() || input.note.trim().length > 800) throw new DomainError("INVALID_INFORMATION_NOTE", 400, "Eine kurze, konkrete Notiz ist erforderlich.");
    return this.db.transaction(async (tx) => {
      const row = (await tx.query<{ raid_state: RaidState }>(`SELECT raid_state FROM raid_sessions WHERE id=$1 FOR UPDATE`, [actor.sessionId])).rows[0];
      if (!row) throw new DomainError("SESSION_NOT_FOUND", 404, "Session introuvable.");
      const report: InformationReport = {
        id: randomUUID(), reference: input.reference.trim(), note: input.note.trim(),
        reportedByParticipantId: actor.participantId, reportedAt: new Date().toISOString(),
        sourceStatus: "LIVE_REQUIRED", correction: null
      };
      const reports = [...getInformationReports(row.raid_state ?? {}), report];
      const nextState: RaidState = { ...(row.raid_state ?? {}), informationReports: reports };
      await tx.query(`UPDATE raid_sessions SET raid_state=$2::jsonb WHERE id=$1`, [actor.sessionId, JSON.stringify(nextState)]);
      const revision = await this.bumpRevision(tx, actor.sessionId);
      await this.insertEvent(tx, {
        sessionId: actor.sessionId, revision, actorParticipantId: actor.participantId,
        type: "INFORMATION_INCORRECT_REPORTED", entityType: "INFORMATION_REPORT", entityId: report.id,
        before: null, after: report, reversible: false
      });
      return report;
    });
  }

  async confirmPlayerCorrection(actor: ActorContext, input: { reportId: string; note: string }): Promise<InformationReport> {
    this.requireRole(actor, ["CAPTAIN", "EDITOR"]);
    if (!input.note.trim() || input.note.trim().length > 800) throw new DomainError("PLAYER_CORRECTION_NOTE_REQUIRED", 400, "La correction joueur nécessite une note de confirmation.");
    return this.db.transaction(async (tx) => {
      const row = (await tx.query<{ raid_state: RaidState }>(`SELECT raid_state FROM raid_sessions WHERE id=$1 FOR UPDATE`, [actor.sessionId])).rows[0];
      if (!row) throw new DomainError("SESSION_NOT_FOUND", 404, "Session introuvable.");
      const reports = getInformationReports(row.raid_state ?? {});
      const current = reports.find((report) => report.id === input.reportId);
      if (!current) throw new DomainError("INFORMATION_REPORT_NOT_FOUND", 404, "Abweichungsmeldung wurde nicht gefunden.");
      if (current.sourceStatus === "PLAYER_CORRECTED") throw new DomainError("PLAYER_CORRECTION_ALREADY_CONFIRMED", 409, "Cette correction a déjà été confirmée.");
      const updated: InformationReport = {
        ...current,
        sourceStatus: "PLAYER_CORRECTED",
        correction: { status: "PLAYER_CORRECTED", actorParticipantId: actor.participantId, note: input.note.trim(), createdAt: new Date().toISOString() }
      };
      const nextState: RaidState = { ...(row.raid_state ?? {}), informationReports: reports.map((report) => report.id === updated.id ? updated : report) };
      await tx.query(`UPDATE raid_sessions SET raid_state=$2::jsonb WHERE id=$1`, [actor.sessionId, JSON.stringify(nextState)]);
      const revision = await this.bumpRevision(tx, actor.sessionId);
      await this.insertEvent(tx, {
        sessionId: actor.sessionId, revision, actorParticipantId: actor.participantId,
        type: "PLAYER_CORRECTION_CONFIRMED", entityType: "INFORMATION_REPORT", entityId: updated.id,
        before: current, after: updated, reversible: false
      });
      return updated;
    });
  }

  async incrementTaskCounter(actor: ActorContext, input: {
    taskId: string;
    key: string;
    delta: number;
  }): Promise<TaskInstanceRecord> {
    if (actor.role === "SPECTATOR") throw new DomainError("FORBIDDEN", 403, "Les spectateurs ne peuvent pas modifier la session.");
    if (!/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(input.key)) throw new DomainError("INVALID_COUNTER_KEY", 400, "Ungültiger Zählername.");
    if (!Number.isInteger(input.delta) || Math.abs(input.delta) > 1000) throw new DomainError("INVALID_COUNTER_DELTA", 400, "Ungültige Zähleränderung.");
    await this.assertTaskScope(actor, input.taskId);
    return this.db.transaction(async (tx) => {
      const beforeRow = (await tx.query<TaskRow>(`SELECT * FROM task_instances WHERE id=$1 AND session_id=$2 FOR UPDATE`, [input.taskId, actor.sessionId])).rows[0];
      if (!beforeRow) throw new DomainError("TASK_NOT_FOUND", 404, "Mission introuvable.");
      const updatedRow = (await tx.query<TaskRow>(
        `UPDATE task_instances SET
          result_data=jsonb_set(
            result_data,
            ARRAY[$2]::text[],
            to_jsonb(COALESCE((result_data->>$2)::integer,0)+$3),
            true
          ),
          revision=revision+1,
          updated_at=now()
         WHERE id=$1
         RETURNING *`,
        [input.taskId, input.key, input.delta]
      )).rows[0]!;
      const revision = await this.bumpRevision(tx, actor.sessionId);
      await this.insertEvent(tx, {
        sessionId: actor.sessionId,
        revision,
        actorParticipantId: actor.participantId,
        type: "TASK_COUNTER_INCREMENTED",
        entityType: "TASK",
        entityId: input.taskId,
        before: taskFromRow(beforeRow),
        after: taskFromRow(updatedRow),
        reversible: true
      });
      return taskFromRow(updatedRow);
    });
  }

  async assignTask(actor: ActorContext, input: {
    taskId: string;
    teamId?: string | null;
    participantIds?: string[];
  }): Promise<TaskInstanceRecord> {
    this.requireRole(actor, ["CAPTAIN", "EDITOR"]);
    await this.assertTaskScope(actor, input.taskId);
    if (actor.role === "EDITOR" && input.teamId && actor.scope.teamIds?.length && !actor.scope.teamIds.includes(input.teamId)) {
      throw new DomainError("EDITOR_SCOPE_VIOLATION", 403, "Editor darf dieses Team nicht zuweisen.");
    }
    return this.db.transaction(async (tx) => {
      const beforeRow = (await tx.query<TaskRow>(`SELECT * FROM task_instances WHERE id=$1 AND session_id=$2 FOR UPDATE`, [input.taskId, actor.sessionId])).rows[0];
      if (!beforeRow) throw new DomainError("TASK_NOT_FOUND", 404, "Mission introuvable.");
      const updatedRow = (await tx.query<TaskRow>(
        `UPDATE task_instances SET assigned_team_id=$2,assigned_participant_ids=$3::jsonb,
                revision=revision+1,updated_at=now()
         WHERE id=$1 RETURNING *`,
        [input.taskId, input.teamId ?? null, JSON.stringify(input.participantIds ?? [])]
      )).rows[0]!;
      const revision = await this.bumpRevision(tx, actor.sessionId);
      await this.insertEvent(tx, {
        sessionId: actor.sessionId,
        revision,
        actorParticipantId: actor.participantId,
        type: "TASK_ASSIGNED",
        entityType: "TASK",
        entityId: input.taskId,
        before: taskFromRow(beforeRow),
        after: taskFromRow(updatedRow),
        reversible: true
      });
      return taskFromRow(updatedRow);
    });
  }

  async getSnapshot(sessionId: string, cursor = 0): Promise<SessionSnapshot> {
    const session = await this.getSession(sessionId);
    const definition = getDefinition(session.definitionId, session.definitionVersion);
    const [participants, teams, tasks, events] = await Promise.all([
      this.db.query<ParticipantRow>(`SELECT id,session_id,display_name,role,role_scope,team_id,ready_state,connection_state,current_task_id,last_seen_at FROM participants WHERE session_id=$1 ORDER BY created_at`, [sessionId]),
      this.db.query<TeamRow>(`SELECT id,session_id,name,leader_participant_id FROM teams WHERE session_id=$1 ORDER BY created_at`, [sessionId]),
      this.db.query<TaskRow>(`SELECT * FROM task_instances WHERE session_id=$1 ORDER BY sort_order`, [sessionId]),
      this.db.query<EventRow>(`SELECT * FROM domain_events WHERE session_id=$1 AND session_revision>$2 ORDER BY session_revision LIMIT 200`, [sessionId, cursor])
    ]);
    return {
      session,
      participants: participants.rows.map(participantFromRow),
      teams: teams.rows.map(teamFromRow),
      tasks: tasks.rows.map(taskFromRow),
      events: events.rows.map(eventFromRow),
      definition
    };
  }

  async getEventsSince(sessionId: string, cursor: number, limit = 100): Promise<EventRecord[]> {
    const result = await this.db.query<EventRow>(
      `SELECT * FROM domain_events WHERE session_id=$1 AND session_revision>$2 ORDER BY session_revision LIMIT $3`,
      [sessionId, cursor, Math.min(limit, 500)]
    );
    return result.rows.map(eventFromRow);
  }

  async saveSnapshot(sessionId: string): Promise<number> {
    const snapshot = await this.getSnapshot(sessionId);
    await this.db.query(
      `INSERT INTO session_snapshots(session_id,session_revision,payload)
       VALUES ($1,$2,$3::jsonb)
       ON CONFLICT (session_id,session_revision) DO NOTHING`,
      [sessionId, snapshot.session.revision, JSON.stringify(snapshot)]
    );
    return snapshot.session.revision;
  }

  async getSession(sessionId: string): Promise<SessionRecord> {
    const row = (await this.db.query<SessionRow>(`SELECT * FROM raid_sessions WHERE id=$1`, [sessionId])).rows[0];
    if (!row) throw new DomainError("SESSION_NOT_FOUND", 404, "Session introuvable.");
    return sessionFromRow(row);
  }

  async assertEventInvariant(sessionId: string): Promise<{ revision: number; eventCount: number; valid: boolean }> {
    const [session, count] = await Promise.all([
      this.getSession(sessionId),
      this.db.query<{ count: string }>(`SELECT count(*)::text AS count FROM domain_events WHERE session_id=$1`, [sessionId])
    ]);
    const eventCount = Number(count.rows[0]?.count ?? 0);
    return { revision: session.revision, eventCount, valid: session.revision === eventCount };
  }

  async claimOutbox(limit = 100): Promise<Array<{ id: number; eventId: string; sessionId: string; revision: number; payload: unknown }>> {
    return this.db.transaction(async (tx) => {
      const result = await tx.query<{ id: string | number; event_id: string; session_id: string; session_revision: string | number; payload: unknown }>(
        `SELECT id,event_id,session_id,session_revision,payload FROM event_outbox
         WHERE published_at IS NULL AND available_at<=now()
         ORDER BY id FOR UPDATE SKIP LOCKED LIMIT $1`,
        [Math.min(limit, 500)]
      );
      if (result.rows.length) {
        await tx.query(
          `UPDATE event_outbox SET attempts=attempts+1,available_at=now()+interval '30 seconds'
           WHERE id = ANY($1::bigint[])`,
          [result.rows.map((row) => Number(row.id))]
        );
      }
      return result.rows.map((row) => ({ id: Number(row.id), eventId: row.event_id, sessionId: row.session_id, revision: Number(row.session_revision), payload: row.payload }));
    });
  }

  async markOutboxPublished(id: number): Promise<void> {
    await this.db.query(`UPDATE event_outbox SET published_at=now(),last_error=NULL WHERE id=$1`, [id]);
  }

  async markOutboxFailed(id: number, error: string): Promise<void> {
    await this.db.query(
      `UPDATE event_outbox SET last_error=$2,available_at=now()+least(interval '5 minutes', interval '2 seconds' * attempts) WHERE id=$1`,
      [id, error.slice(0, 1000)]
    );
  }

  private async applySanctuaireDerivedData(
    tx: Queryable,
    sessionId: string,
    definition: RaidDefinition
  ): Promise<string[]> {
    if (!isSanctuaire(definition)) return [];
    const changed: string[] = [];
    const lookupTables = (definition.lookupTables ?? []) as Array<{ id: string; values: Record<string, unknown> }>;
    const closMapping = lookupTables.find((table) => table.id === "SAN-CLOS-TARGET-MAPPING")?.values;
    const elementMapping = lookupTables.find((table) => table.id === "SAN-SENTINELLE-COLOR-ELEMENT")?.values;

    const closRow = (await tx.query<TaskRow>(
      `SELECT * FROM task_instances WHERE session_id=$1 AND definition_id='S1-CLO-040' FOR UPDATE`, [sessionId]
    )).rows[0];
    if (closRow && closMapping) {
      const clos = taskFromRow(closRow);
      const color = clos.resultData.monochromeColor;
      const statue = clos.resultData.statueType;
      const colorTable = typeof color === "string" ? closMapping[color] : undefined;
      const target = colorTable && typeof colorTable === "object" && typeof statue === "string"
        ? (colorTable as Record<string, unknown>)[statue]
        : undefined;
      if (target && typeof target === "object") {
        const mapped = target as { monster?: unknown; map?: unknown };
        const next = {
          ...clos.resultData,
          "sanctuaire.closTarget.monochromeColor": color,
          "sanctuaire.closTarget.expectedMonster": mapped.monster,
          "sanctuaire.closTarget.expectedMap": mapped.map,
          expectedMonster: mapped.monster,
          expectedMap: mapped.map
        };
        if (JSON.stringify(next) !== JSON.stringify(clos.resultData)) {
          await tx.query(
            `UPDATE task_instances SET result_data=$3::jsonb,revision=revision+1,updated_at=now()
             WHERE session_id=$1 AND definition_id=$2`,
            [sessionId, clos.definitionId, JSON.stringify(next)]
          );
          changed.push("SAN-DERIVED-CLOS-TARGET");
        }
      }
    }

    const sentinelRow = (await tx.query<TaskRow>(
      `SELECT * FROM task_instances WHERE session_id=$1 AND definition_id='S2-SEN-010' FOR UPDATE`, [sessionId]
    )).rows[0];
    if (sentinelRow && elementMapping) {
      const sentinel = taskFromRow(sentinelRow);
      const color = sentinel.resultData.monochromeColor;
      const element = typeof color === "string" ? elementMapping[color] : undefined;
      if (element) {
        const next = {
          ...sentinel.resultData,
          targetElement: element,
          "sanctuaire.guardians.sentinelle.targetElement": element
        };
        if (JSON.stringify(next) !== JSON.stringify(sentinel.resultData)) {
          await tx.query(
            `UPDATE task_instances SET result_data=$3::jsonb,revision=revision+1,updated_at=now()
             WHERE session_id=$1 AND definition_id=$2`,
            [sessionId, sentinel.definitionId, JSON.stringify(next)]
          );
          changed.push("SAN-DERIVED-SENTINELLE-ELEMENT");
        }
      }
    }
    return changed;
  }


  private async applyGigalodonDerivedData(
    tx: Queryable,
    sessionId: string,
    definition: RaidDefinition
  ): Promise<string[]> {
    if (!isGigalodon(definition)) return [];
    const stateRow = (await tx.query<{ raid_state: RaidState }>(`SELECT raid_state FROM raid_sessions WHERE id=$1 FOR UPDATE`, [sessionId])).rows[0];
    if (!stateRow) return [];
    const beforeState = structuredClone(stateRow.raid_state ?? {});
    const state = getGigalodonState(beforeState);
    const tasks = (await tx.query<TaskRow>(`SELECT * FROM task_instances WHERE session_id=$1 ORDER BY sort_order`, [sessionId])).rows.map(taskFromRow);
    const byId = new Map(tasks.map((task) => [task.definitionId, task]));
    const changed: string[] = [];
    const value = (taskId: string, path: string): unknown => {
      const data = byId.get(taskId)?.resultData ?? {};
      const short = path.split(".").at(-1)!;
      return data[path] ?? data[short] ?? getPath(data, path);
    };
    const completed = (taskId: string) => byId.get(taskId)?.status === "COMPLETED";
    const next = structuredClone(state);

    if (completed("G1-010")) {
      const target = Number(value("G1-010", "gigalodon.floorStates[-1].groupTarget"));
      if (Number.isInteger(target) && target > 0 && next.floor1GroupTarget !== target) {
        next.floor1GroupTarget = target;
        next.floorStates["-1"] = { ...(next.floorStates["-1"] ?? {}), groupTarget: target, groupsCompleted: Number((next.floorStates["-1"] ?? {}).groupsCompleted ?? 0) };
        changed.push("GIG-FLOOR1-TARGET");
      }
    }
    if (completed("G1-030") && !next.fragments.first) { next.fragments.first = true; changed.push("GIG-FRAGMENT-FIRST"); }
    if (completed("G1-040") && next.access.floor2 !== true) { next.access.floor2 = true; changed.push("GIG-ACCESS-FLOOR2"); }
    if (completed("G2-030")) {
      const holder = value("G2-030", "gigalodon.bosses.mureine.uniqueResourceHolder");
      if (typeof holder === "string" && next.bossUniqueDrops.mureine.holderParticipantId !== holder) {
        next.bossUniqueDrops.mureine = { holderParticipantId: holder, banked: next.bossUniqueDrops.mureine.banked };
        changed.push("GIG-XFER-MUREINE");
      }
      if (!next.fragments.second) { next.fragments.second = true; changed.push("GIG-FRAGMENT-SECOND"); }
    }
    if (completed("G2-040") && next.access.floor3 !== true) { next.access.floor3 = true; changed.push("GIG-ACCESS-FLOOR3"); }
    if (completed("G3-030") && next.access.floor4 !== true) { next.access.floor4 = true; changed.push("GIG-ACCESS-FLOOR4"); }

    if (completed("G4-030")) {
      const sequencePaths = [
        "gigalodon.execrabe.sequence.threshold80000",
        "gigalodon.execrabe.sequence.threshold60000",
        "gigalodon.execrabe.sequence.threshold40000",
        "gigalodon.execrabe.sequence.threshold20000"
      ];
      const sequence = sequencePaths.map((path) => value("G4-030", path));
      if (sequence.every((item) => typeof item === "string") && new Set(sequence).size === 4) {
        const target = byId.get("G4-050");
        if (target && JSON.stringify(target.resultData.sequence) !== JSON.stringify(sequence)) {
          await tx.query(
            `UPDATE task_instances SET result_data=result_data || $3::jsonb,revision=revision+1,updated_at=now()
             WHERE session_id=$1 AND definition_id=$2`,
            [sessionId, "G4-050", JSON.stringify({ sequence, "gigalodon.execrabe.sequence": sequence })]
          );
          changed.push("GIG-XFER-SEQUENCE");
        }
      }
    }

    if (completed("G4-040")) {
      const rancune = value("G4-040", "gigalodon.bosses.execrabe.rancuneHolder");
      const pince = value("G4-040", "gigalodon.bosses.execrabe.pinceHolder");
      if (typeof rancune === "string" && next.bossUniqueDrops.execrabe.holderParticipantId !== rancune) {
        next.bossUniqueDrops.execrabe = { holderParticipantId: rancune, banked: next.bossUniqueDrops.execrabe.banked };
        changed.push("GIG-XFER-EXECRABE");
      }
      if (typeof pince === "string" && next.pinceHolder !== pince) { next.pinceHolder = pince; changed.push("GIG-XFER-PINCE"); }
      if (!next.fragments.third) { next.fragments.third = true; changed.push("GIG-FRAGMENT-THIRD"); }
    }
    if (completed("G4-050") && next.access.floor5 !== true) { next.access.floor5 = true; changed.push("GIG-ACCESS-FLOOR5"); }
    if (completed("G5-040") && next.access.floor6 !== true) { next.access.floor6 = true; changed.push("GIG-ACCESS-FLOOR6"); }
    if (completed("G6-030")) {
      const holder = value("G6-030", "gigalodon.bosses.willorque.noirceurHolder");
      if (typeof holder === "string" && next.bossUniqueDrops.willorque.holderParticipantId !== holder) {
        next.bossUniqueDrops.willorque = { holderParticipantId: holder, banked: next.bossUniqueDrops.willorque.banked };
        changed.push("GIG-XFER-WILLORQUE");
      }
      await tx.query(`UPDATE raid_sessions SET status=CASE WHEN status='LIVE' THEN 'FINAL_PREP' ELSE status END WHERE id=$1`, [sessionId]);
    }

    const unlockedLightFloors: Array<[keyof typeof next.access, number]> = [
      ["floor2", -2], ["floor3", -3], ["floor4", -4], ["floor5", -5]
    ];
    for (const [accessKey, floor] of unlockedLightFloors) {
      if (next.access[accessKey] && !next.lightStates.some((light) => light.floor === floor)) {
        next.lightStates.push(createGuideBaselineLight(floor, new Date().toISOString(), "SYSTEM", null, next.lightIntervalSeconds));
        changed.push(`GIG-LIGHT-BASELINE-${floor}`);
      }
    }
    next.lightStates.sort((left, right) => right.floor - left.floor);

    next.projectedUnbankedScore = calculateProjectedUnbankedScore(definition, next.participantInventories);
    next.finalReadiness = {
      ...next.finalReadiness,
      mureineResourceBanked: next.bossUniqueDrops.mureine.banked,
      execrabeResourceBanked: next.bossUniqueDrops.execrabe.banked,
      willorqueResourceBanked: next.bossUniqueDrops.willorque.banked,
      criticalUnbankedScore: next.projectedUnbankedScore,
      staleInventoryParticipantIds: staleInventoryIds(next.participantInventories)
    };

    if (JSON.stringify(next) !== JSON.stringify(state)) {
      await tx.query(`UPDATE raid_sessions SET raid_state=$2::jsonb WHERE id=$1`, [sessionId, JSON.stringify({ ...beforeState, gigalodon: next })]);
    }
    return changed;
  }

  private async applyPostMutationRules(
    tx: Queryable,
    sessionId: string,
    sourceTaskDefinitionId?: string,
    sourceResultData: Record<string, unknown> = {}
  ): Promise<{
    unlockedDefinitionIds: string[];
    automaticTaskDefinitionIds: string[];
    transfers: string[];
    sessionEnded: boolean;
  }> {
    const definition = await this.getDefinitionForSession(tx, sessionId);
    const unlocked = new Set<string>();
    const automatic = new Set<string>();
    const transferIds = new Set<string>();

    if (sourceTaskDefinitionId) {
      for (const transfer of collectTaskTransfers(definition, sourceTaskDefinitionId, sourceResultData)) {
        const targetRow = (await tx.query<TaskRow>(
          `SELECT * FROM task_instances WHERE session_id=$1 AND definition_id=$2 FOR UPDATE`,
          [sessionId, transfer.targetTaskDefinitionId]
        )).rows[0];
        if (!targetRow) continue;
        const target = taskFromRow(targetRow);
        const history = Array.isArray(target.resultData._transfers) ? target.resultData._transfers : [];
        const record = {
          transferId: transfer.transferId,
          sourceTaskDefinitionId: transfer.sourceTaskDefinitionId,
          targetKey: transfer.targetKey,
          appliedAt: new Date().toISOString()
        };
        const resultData = {
          ...target.resultData,
          [transfer.targetKey]: transfer.value,
          _transfers: [...history.filter((item) => (item as { transferId?: string }).transferId !== transfer.transferId), record]
        };
        await tx.query(
          `UPDATE task_instances SET result_data=$3::jsonb,revision=revision+1,updated_at=now()
           WHERE session_id=$1 AND definition_id=$2`,
          [sessionId, transfer.targetTaskDefinitionId, JSON.stringify(resultData)]
        );
        transferIds.add(transfer.transferId);
      }
    }

    for (const derived of await this.applySanctuaireDerivedData(tx, sessionId, definition)) transferIds.add(derived);
    for (const derived of await this.applyGigalodonDerivedData(tx, sessionId, definition)) transferIds.add(derived);

    let sessionEnded = false;
    for (let pass = 0; pass < 12; pass++) {
      let changed = false;
      const tasks = (await tx.query<TaskRow>(
        `SELECT * FROM task_instances WHERE session_id=$1 ORDER BY sort_order`, [sessionId]
      )).rows.map(taskFromRow);
      const statusByDefinition = new Map(tasks.map((task) => [task.definitionId, task.status]));
      const stateRow = (await tx.query<{ raid_state: RaidState }>(`SELECT raid_state FROM raid_sessions WHERE id=$1`, [sessionId])).rows[0];
      const sanctuaireState = getSanctuaireState(stateRow?.raid_state ?? {});
      const gigalodonState = getGigalodonState(stateRow?.raid_state ?? {});

      for (const automation of (definition.automations ?? []) as Array<{
        id: string;
        trigger: string;
        actions: Array<{ type: string; target: string; value?: unknown }>;
      }>) {
        const taskIds = definition.tasks.filter((task) => automation.trigger.includes(task.id)).map((task) => task.id);
        const taskCondition = taskIds.length > 0 && taskIds.every((id) => statusByDefinition.get(id) === "COMPLETED");
        const corridorCondition = automation.trigger.includes("corridorCompleted") && sanctuaireState.corridorCompleted >= sanctuaireState.corridorTarget;
        const fragmentCondition = automation.trigger.includes("vier Fragment") || automation.trigger.includes("four fragment")
          ? Object.values(gigalodonState.fragments).every(Boolean)
          : false;
        if (!taskCondition && !corridorCondition && !fragmentCondition) continue;
        for (const action of automation.actions) {
          if (action.type === "SET_TASK_STATUS") {
            const value = String(action.value ?? "COMPLETED") as TaskStatus;
            const result = await tx.query<{ definition_id: string }>(
              `UPDATE task_instances SET status=$3,
                 completed_at=CASE WHEN $3='COMPLETED' THEN COALESCE(completed_at,now()) ELSE completed_at END,
                 revision=revision+1,updated_at=now()
               WHERE session_id=$1 AND definition_id=$2 AND status<>$3
               RETURNING definition_id`,
              [sessionId, action.target, value]
            );
            if (result.rows.length) {
              automatic.add(action.target);
              changed = true;
            }
          } else if (action.type === "SET_STATE") {
            if (action.target === "session.status") {
              const value = String(action.value ?? "LIVE");
              const result = await tx.query<{ id: string }>(
                `UPDATE raid_sessions SET status=$2 WHERE id=$1 AND status<>$2 RETURNING id`,
                [sessionId, value]
              );
              if (result.rows.length) changed = true;
            } else {
              const currentRow = (await tx.query<{ raid_state: RaidState }>(`SELECT raid_state FROM raid_sessions WHERE id=$1 FOR UPDATE`, [sessionId])).rows[0];
              const currentState = structuredClone(currentRow?.raid_state ?? {});
              if (JSON.stringify(getPath(currentState, action.target)) !== JSON.stringify(action.value)) {
                setPath(currentState, action.target, structuredClone(action.value));
                const lightFloorByAccess: Record<string, number> = {
                  "gigalodon.access.floor2": -2,
                  "gigalodon.access.floor3": -3,
                  "gigalodon.access.floor4": -4,
                  "gigalodon.access.floor5": -5
                };
                const unlockedFloor = action.value === true ? lightFloorByAccess[action.target] : undefined;
                if (isGigalodon(definition) && unlockedFloor !== undefined) {
                  const gigalodon = getGigalodonState(currentState);
                  if (!gigalodon.lightStates.some((light) => light.floor === unlockedFloor)) {
                    const lightStates = [...gigalodon.lightStates, createGuideBaselineLight(unlockedFloor, new Date().toISOString(), "SYSTEM", null, gigalodon.lightIntervalSeconds)]
                      .sort((left, right) => right.floor - left.floor);
                    currentState.gigalodon = { ...(currentState.gigalodon as Record<string, unknown> ?? {}), ...gigalodon, lightStates };
                  }
                }
                await tx.query(`UPDATE raid_sessions SET raid_state=$2::jsonb WHERE id=$1`, [sessionId, JSON.stringify(currentState)]);
                changed = true;
              }
            }
          } else if (action.type === "UNLOCK_TASK") {
            const exact = definition.tasks.some((task) => task.id === action.target);
            if (!exact) continue;
            const result = await tx.query<{ definition_id: string }>(
              `UPDATE task_instances SET status='READY',revision=revision+1,updated_at=now()
               WHERE session_id=$1 AND definition_id=$2 AND status='LOCKED'
               RETURNING definition_id`,
              [sessionId, action.target]
            );
            if (result.rows.length) {
              unlocked.add(action.target);
              changed = true;
            }
          } else if (action.type === "END_SESSION") {
            const result = await tx.query<{ id: string }>(
              `UPDATE raid_sessions SET status='ENDED',ended_at=COALESCE(ended_at,now())
               WHERE id=$1 AND status<>'ENDED' RETURNING id`, [sessionId]
            );
            if (result.rows.length) {
              sessionEnded = true;
              changed = true;
            }
          }
        }
      }

      const refreshed = (await tx.query<TaskRow>(
        `SELECT * FROM task_instances WHERE session_id=$1 ORDER BY sort_order`, [sessionId]
      )).rows.map(taskFromRow);
      for (const evaluation of evaluateDependencies(definition, refreshed)) {
        if (!evaluation.shouldBeReady) continue;
        const result = await tx.query<{ definition_id: string }>(
          `UPDATE task_instances SET status='READY',revision=revision+1,updated_at=now()
           WHERE session_id=$1 AND definition_id=$2 AND status='LOCKED'
           RETURNING definition_id`,
          [sessionId, evaluation.taskDefinitionId]
        );
        if (result.rows.length) {
          unlocked.add(evaluation.taskDefinitionId);
          changed = true;
        }
      }

      if (isGigalodon(definition)) {
        const currentStateRow = (await tx.query<{ raid_state: RaidState; status: SessionRecord["status"] }>(`SELECT raid_state,status FROM raid_sessions WHERE id=$1`, [sessionId])).rows[0];
        const currentGigalodon = getGigalodonState(currentStateRow?.raid_state ?? {});
        const currentTasks = (await tx.query<TaskRow>(`SELECT * FROM task_instances WHERE session_id=$1 ORDER BY sort_order`, [sessionId])).rows.map(taskFromRow);
        const currentStatus = new Map(currentTasks.map((task) => [task.definitionId, task.status]));
        const completeSystemTracker = async (definitionId: string, resultData: Record<string, unknown> = {}) => {
          const result = await tx.query<{ definition_id: string }>(
            `UPDATE task_instances SET status='COMPLETED',result_data=result_data || $3::jsonb,completed_at=now(),revision=revision+1,updated_at=now()
             WHERE session_id=$1 AND definition_id=$2 AND status='READY' RETURNING definition_id`,
            [sessionId, definitionId, JSON.stringify(resultData)]
          );
          if (result.rows.length) { automatic.add(definitionId); changed = true; }
        };
        if (currentGigalodon.lightStates.length > 0) {
          await completeSystemTracker("G-LIGHT-020");
          const modifiers = ((definition.lookupTables ?? []) as Array<{ id: string; values: unknown }>).find((table) => table.id === "GIG-LIGHT-MODIFIERS")?.values;
          await completeSystemTracker("G-LIGHT-040", { lightCombatModifiers: modifiers ?? {} });
        }
        if (currentStateRow && currentStateRow.status !== "LOBBY") await completeSystemTracker("GF-040");
        if (currentStatus.get("G5-010") === "COMPLETED" && currentStatus.get("G5-020") === "READY") {
          const chance = calculateFragmentChance(definition, currentGigalodon.confirmedScore);
          await completeSystemTracker("G5-020", { fragmentDropChancePercent: chance, "gigalodon.fragmentDropChancePercent": chance });
        }
      }

      const latest = (await tx.query<TaskRow>(
        `SELECT * FROM task_instances WHERE session_id=$1 ORDER BY sort_order`, [sessionId]
      )).rows.map(taskFromRow);
      for (const task of latest) {
        const taskDefinition = definition.tasks.find((candidate) => candidate.id === task.definitionId);
        if (!taskDefinition || taskDefinition.type !== "GATE" || taskDefinition.completion.confirmationPolicy !== "SYSTEM" || task.status !== "READY") continue;
        if (task.definitionId === "G5-040") {
          const currentRow = (await tx.query<{ raid_state: RaidState }>(`SELECT raid_state FROM raid_sessions WHERE id=$1`, [sessionId])).rows[0];
          if (!Object.values(getGigalodonState(currentRow?.raid_state ?? {}).fragments).every(Boolean)) continue;
        }
        const fieldsPresent = taskDefinition.inputFields.length === 0 || taskDefinition.inputFields.every((field) => {
          const shortKey = field.path.split(".").at(-1)!;
          const value = task.resultData[field.path] ?? task.resultData[shortKey];
          return value !== undefined && value !== null && value !== "" && (!Array.isArray(value) || value.length > 0);
        });
        if (!fieldsPresent) continue;
        const result = await tx.query<{ definition_id: string }>(
          `UPDATE task_instances SET status='COMPLETED',completed_at=now(),revision=revision+1,updated_at=now()
           WHERE session_id=$1 AND definition_id=$2 AND status='READY' RETURNING definition_id`,
          [sessionId, task.definitionId]
        );
        if (result.rows.length) {
          automatic.add(task.definitionId);
          changed = true;
        }
      }
      if (!changed) break;
    }

    return {
      unlockedDefinitionIds: [...unlocked],
      automaticTaskDefinitionIds: [...automatic],
      transfers: [...transferIds],
      sessionEnded
    };
  }

  private async getDefinitionForSession(tx: Queryable, sessionId: string): Promise<RaidDefinition> {
    const result = await tx.query<{ payload: RaidDefinition }>(
      `SELECT d.payload FROM raid_sessions s JOIN raid_definitions d
       ON d.id=s.definition_id AND d.definition_version=s.definition_version
       WHERE s.id=$1`, [sessionId]
    );
    if (!result.rows[0]) throw new DomainError("SESSION_NOT_FOUND", 404, "Session introuvable.");
    return result.rows[0].payload;
  }

  private async assertTaskScope(actor: ActorContext, taskId: string): Promise<void> {
    if (actor.role !== "EDITOR") return;
    const row = (await this.db.query<{ definition_id: string; assigned_team_id: string | null }>(
      `SELECT definition_id,assigned_team_id FROM task_instances WHERE id=$1 AND session_id=$2`, [taskId, actor.sessionId]
    )).rows[0];
    if (!row) throw new DomainError("TASK_NOT_FOUND", 404, "Mission introuvable.");
    const allowedTask = !actor.scope.taskDefinitionIds?.length || actor.scope.taskDefinitionIds.includes(row.definition_id);
    const allowedTeam = !actor.scope.teamIds?.length || (row.assigned_team_id !== null && actor.scope.teamIds.includes(row.assigned_team_id));
    if (!allowedTask || !allowedTeam) throw new DomainError("EDITOR_SCOPE_VIOLATION", 403, "L’éditeur ne peut pas gérer cette mission.");
  }

  private requireRole(actor: ActorContext, roles: Role[]): void {
    if (!roles.includes(actor.role)) throw new DomainError("FORBIDDEN", 403, "Rolle ist für diese Aktion nicht berechtigt.");
  }

  private assertTransition(from: TaskStatus, to: TaskStatus, role: Role): void {
    const allowed: Record<TaskStatus, TaskStatus[]> = {
      LOCKED: role === "CAPTAIN" ? ["READY", "SKIPPED"] : [],
      READY: ["CLAIMED", "ACTIVE", "SKIPPED", "BLOCKED"],
      CLAIMED: ["ACTIVE", "READY", "BLOCKED"],
      ACTIVE: ["WAITING", "BLOCKED", "FAILED", "COMPLETED"],
      WAITING: ["ACTIVE", "BLOCKED", "FAILED", "COMPLETED"],
      BLOCKED: ["ACTIVE", "FAILED", "SKIPPED"],
      FAILED: role === "CAPTAIN" || role === "EDITOR" ? ["READY", "ACTIVE", "SKIPPED"] : [],
      COMPLETED: role === "CAPTAIN" || role === "EDITOR" ? ["ACTIVE"] : [],
      SKIPPED: role === "CAPTAIN" || role === "EDITOR" ? ["READY"] : []
    };
    if (!allowed[from].includes(to)) throw new DomainError("INVALID_TASK_TRANSITION", 409, `Statuswechsel ${from} → ${to} ist nicht erlaubt.`);
  }

  private async bumpRevision(tx: Queryable, sessionId: string): Promise<number> {
    const result = await tx.query<{ revision: string | number }>(
      `UPDATE raid_sessions SET revision=revision+1 WHERE id=$1 RETURNING revision`, [sessionId]
    );
    if (!result.rows[0]) throw new DomainError("SESSION_NOT_FOUND", 404, "Session introuvable.");
    return Number(result.rows[0].revision);
  }

  private async insertEvent(tx: Queryable, input: {
    sessionId: string;
    revision: number;
    actorParticipantId: string | null;
    type: string;
    entityType: string;
    entityId: string | null;
    before: unknown;
    after: unknown;
    reversible: boolean;
  }): Promise<void> {
    const id = randomUUID();
    const payload = {
      id,
      sessionId: input.sessionId,
      sessionRevision: input.revision,
      actorParticipantId: input.actorParticipantId,
      type: input.type,
      entityType: input.entityType,
      entityId: input.entityId,
      before: input.before,
      after: input.after,
      reversible: input.reversible,
      createdAt: new Date().toISOString()
    };
    await tx.query(
      `INSERT INTO domain_events(
        id,session_id,session_revision,actor_participant_id,type,entity_type,entity_id,
        before_state,after_state,reversible
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,$10)`,
      [id, input.sessionId, input.revision, input.actorParticipantId, input.type, input.entityType, input.entityId, JSON.stringify(input.before), JSON.stringify(input.after), input.reversible]
    );
    await tx.query(
      `INSERT INTO event_outbox(event_id,session_id,session_revision,payload)
       VALUES ($1,$2,$3,$4::jsonb)`,
      [id, input.sessionId, input.revision, JSON.stringify(payload)]
    );
  }
}
