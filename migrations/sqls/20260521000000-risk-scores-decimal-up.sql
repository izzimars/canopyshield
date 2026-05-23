ALTER TABLE schools
  ALTER COLUMN current_risk_score TYPE numeric(10,2)
  USING ROUND(current_risk_score::numeric, 2),
  ALTER COLUMN current_risk_score SET DEFAULT 0.00;

ALTER TABLE risk_snapshots
  ALTER COLUMN score TYPE numeric(10,2)
  USING ROUND(score::numeric, 2),
  ALTER COLUMN heat_score TYPE numeric(10,2)
  USING ROUND(heat_score::numeric, 2),
  ALTER COLUMN aqi_score TYPE numeric(10,2)
  USING ROUND(aqi_score::numeric, 2),
  ALTER COLUMN combined_score TYPE numeric(10,2)
  USING ROUND(combined_score::numeric, 2),
  ALTER COLUMN raw_aqi TYPE numeric(10,2)
  USING ROUND(raw_aqi::numeric, 2);