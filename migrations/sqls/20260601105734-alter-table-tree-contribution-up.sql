/* Replace with your SQL commands */
ALTER TABLE tree_contributions
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
