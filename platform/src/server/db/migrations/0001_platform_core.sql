CREATE TABLE IF NOT EXISTS raid_definitions (
  id text NOT NULL,
  definition_version text NOT NULL,
  game_version text NOT NULL,
  slug text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, definition_version)
);

CREATE TABLE IF NOT EXISTS raid_sessions (
  id uuid PRIMARY KEY,
  definition_id text NOT NULL,
  definition_version text NOT NULL,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  language text NOT NULL CHECK (language IN ('fr','en','de')),
  status text NOT NULL CHECK (status IN ('LOBBY','LIVE','ENDED','FAILED')),
  captain_participant_id uuid NULL,
  revision bigint NOT NULL DEFAULT 0 CHECK (revision >= 0),
  timer_duration_seconds integer NOT NULL CHECK (timer_duration_seconds > 0),
  timer_started_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz NULL,
  ended_at timestamptz NULL,
  FOREIGN KEY (definition_id, definition_version)
    REFERENCES raid_definitions(id, definition_version)
);

CREATE TABLE IF NOT EXISTS invite_tokens (
  id uuid PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES raid_sessions(id) ON DELETE CASCADE,
  token_hash char(64) NOT NULL UNIQUE,
  role text NOT NULL CHECK (role IN ('CAPTAIN','EDITOR','PARTICIPANT','SPECTATOR')),
  scope jsonb NOT NULL DEFAULT '{}'::jsonb,
  use_count integer NOT NULL DEFAULT 0,
  max_uses integer NULL CHECK (max_uses IS NULL OR max_uses > 0),
  expires_at timestamptz NULL,
  revoked_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS invite_tokens_session_idx ON invite_tokens(session_id, role);

CREATE TABLE IF NOT EXISTS participants (
  id uuid PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES raid_sessions(id) ON DELETE CASCADE,
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 40),
  role text NOT NULL CHECK (role IN ('CAPTAIN','EDITOR','PARTICIPANT','SPECTATOR')),
  role_scope jsonb NOT NULL DEFAULT '{}'::jsonb,
  team_id uuid NULL,
  ready_state text NOT NULL DEFAULT 'NOT_READY' CHECK (ready_state IN ('NOT_READY','READY')),
  connection_state text NOT NULL DEFAULT 'ONLINE' CHECK (connection_state IN ('ONLINE','RECONNECTING','OFFLINE')),
  current_task_id uuid NULL,
  recovery_hash char(64) NOT NULL,
  recovery_rotated_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, display_name)
);
CREATE INDEX IF NOT EXISTS participants_session_idx ON participants(session_id, role);

CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES raid_sessions(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  leader_participant_id uuid NULL REFERENCES participants(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, name)
);
ALTER TABLE participants
  DROP CONSTRAINT IF EXISTS participants_team_fk;
ALTER TABLE participants
  ADD CONSTRAINT participants_team_fk FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS task_instances (
  id uuid PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES raid_sessions(id) ON DELETE CASCADE,
  definition_id text NOT NULL,
  phase_id text NOT NULL,
  sort_order integer NOT NULL,
  status text NOT NULL CHECK (status IN ('LOCKED','READY','CLAIMED','ACTIVE','WAITING','BLOCKED','FAILED','COMPLETED','SKIPPED')),
  assigned_team_id uuid NULL REFERENCES teams(id) ON DELETE SET NULL,
  assigned_participant_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  owner_participant_id uuid NULL REFERENCES participants(id) ON DELETE SET NULL,
  result_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  blocked_reason text NULL,
  revision bigint NOT NULL DEFAULT 0 CHECK (revision >= 0),
  started_at timestamptz NULL,
  completed_at timestamptz NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, definition_id)
);
CREATE INDEX IF NOT EXISTS task_instances_session_status_idx ON task_instances(session_id, status, sort_order);

CREATE TABLE IF NOT EXISTS domain_events (
  id uuid PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES raid_sessions(id) ON DELETE CASCADE,
  session_revision bigint NOT NULL,
  actor_participant_id uuid NULL REFERENCES participants(id) ON DELETE SET NULL,
  type text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NULL,
  before_state jsonb NULL,
  after_state jsonb NULL,
  reversible boolean NOT NULL DEFAULT false,
  caused_by_event_id uuid NULL REFERENCES domain_events(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, session_revision)
);
CREATE INDEX IF NOT EXISTS domain_events_cursor_idx ON domain_events(session_id, session_revision);

CREATE TABLE IF NOT EXISTS event_outbox (
  id bigserial PRIMARY KEY,
  event_id uuid NOT NULL UNIQUE REFERENCES domain_events(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES raid_sessions(id) ON DELETE CASCADE,
  session_revision bigint NOT NULL,
  payload jsonb NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  available_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz NULL,
  last_error text NULL
);
CREATE INDEX IF NOT EXISTS event_outbox_pending_idx
  ON event_outbox(available_at, id) WHERE published_at IS NULL;

CREATE TABLE IF NOT EXISTS session_snapshots (
  session_id uuid NOT NULL REFERENCES raid_sessions(id) ON DELETE CASCADE,
  session_revision bigint NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, session_revision)
);
