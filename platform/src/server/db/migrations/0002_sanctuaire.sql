ALTER TABLE raid_sessions
  ADD COLUMN IF NOT EXISTS raid_state jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS task_instances_session_phase_idx
  ON task_instances(session_id, phase_id, sort_order);
