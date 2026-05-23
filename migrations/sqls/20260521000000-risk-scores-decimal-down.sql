ALTER TABLE schools
  ALTER COLUMN current_risk_score TYPE integer
  USING ROUND(current_risk_score)::integer,
  ALTER COLUMN current_risk_score SET DEFAULT 0;

ALTER TABLE risk_snapshots
  ALTER COLUMN score TYPE integer
  USING ROUND(score)::integer,
  ALTER COLUMN heat_score TYPE integer
  USING ROUND(heat_score)::integer,
  ALTER COLUMN aqi_score TYPE integer
  USING ROUND(aqi_score)::integer,
  ALTER COLUMN combined_score TYPE integer
  USING ROUND(combined_score)::integer,
  ALTER COLUMN raw_aqi TYPE integer
  USING ROUND(raw_aqi)::integer;