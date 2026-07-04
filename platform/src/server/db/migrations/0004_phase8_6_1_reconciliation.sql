CREATE TABLE IF NOT EXISTS raid_data_migrations (
  session_id uuid NOT NULL REFERENCES raid_sessions(id) ON DELETE CASCADE,
  migration_id text NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now(),
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (session_id, migration_id)
);

CREATE INDEX IF NOT EXISTS raid_data_migrations_id_idx
  ON raid_data_migrations(migration_id, applied_at);
