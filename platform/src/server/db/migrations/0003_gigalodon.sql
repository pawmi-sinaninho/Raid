ALTER TABLE raid_sessions
  DROP CONSTRAINT IF EXISTS raid_sessions_status_check;

ALTER TABLE raid_sessions
  ADD CONSTRAINT raid_sessions_status_check
  CHECK (status IN ('LOBBY','LIVE','FINAL_PREP','FINAL_ACTIVE','ENDED','FAILED'));
