DROP INDEX IF EXISTS idx_risk_snapshots_school_created_at;

ALTER TABLE risk_snapshots
  DROP COLUMN IF EXISTS created_at,
  DROP COLUMN IF EXISTS raw_data,
  DROP COLUMN IF EXISTS score;

ALTER TABLE schools
  DROP COLUMN IF EXISTS tree_count,
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS contact_email;

