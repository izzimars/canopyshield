ALTER TABLE schools
  ADD COLUMN tree_count integer NOT NULL DEFAULT 0;

ALTER TABLE risk_snapshots
  ADD COLUMN score integer,
  ADD COLUMN raw_data jsonb,
  ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();

UPDATE risk_snapshots
SET score = combined_score
WHERE score IS NULL;

CREATE INDEX IF NOT EXISTS idx_risk_snapshots_school_created_at
  ON risk_snapshots (school_id, created_at DESC);

ALTER TABLE schools ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE schools ADD COLUMN IF NOT EXISTS contact_email text;

