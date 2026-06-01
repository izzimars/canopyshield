-- tree_contributions
CREATE TABLE tree_contributions (
  id SERIAL UNIQUE,
  contribution_uuid TEXT UNIQUE PRIMARY KEY DEFAULT gen_random_uuid()::text,
  amount INTEGER NOT NULL CHECK (amount > 0),
  idempotency_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending', -- or remove
  funding_type TEXT NOT NULL DEFAULT 'individual',
  amount_remaining INTEGER NOT NULL CHECK (amount_remaining >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payment_reference TEXT UNIQUE, -- for linking with payment records
  paid_at TIMESTAMPTZ, -- when payment was completed
  processed_at TIMESTAMPTZ, -- when trees were actually planted;
  user_id TEXT NOT NULL REFERENCES users(user_uuid) ON DELETE CASCADE,
  school_id TEXT NOT NULL REFERENCES schools(school_uuid) ON DELETE CASCADE
);

-- school_crowdfunding (primary key school_id references schools.uuid)
CREATE TABLE school_crowdfunding (
  id SERIAL UNIQUE,
  uuid TEXT UNIQUE PRIMARY KEY DEFAULT('crowdfund' || gen_random_uuid()::text),
  school_id TEXT NOT NULL REFERENCES schools(school_uuid) ON DELETE CASCADE,
  current_balance INTEGER NOT NULL DEFAULT 0 CHECK (current_balance >= 0),
  total_contributed INTEGER NOT NULL DEFAULT 0 CHECK (total_contributed >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- user_crowdfunding_stats
CREATE TABLE user_crowdfunding_stats (
  id SERIAL UNIQUE,
  uuid TEXT UNIQUE PRIMARY KEY DEFAULT('usercrowd' || gen_random_uuid()::text),
  user_id TEXT NOT NULL REFERENCES users(user_uuid) ON DELETE CASCADE,
  total_contributed INTEGER NOT NULL DEFAULT 0 CHECK (total_contributed >= 0),
  trees_funded NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (trees_funded >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tree_contribution_allocations (
  id SERIAL UNIQUE,
  uuid TEXT UNIQUE PRIMARY KEY DEFAULT('alloc' || gen_random_uuid()::text),
  contribution_id INT REFERENCES tree_contributions(id),
  tree_id INT REFERENCES trees(id),
  school_id TEXT NOT NULL REFERENCES schools(school_uuid) ON DELETE CASCADE,
  amount_used INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add source column to trees (already correct)
ALTER TABLE trees ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'request';

-- Add tree_count to schools (already correct)
ALTER TABLE schools ADD COLUMN IF NOT EXISTS tree_count INTEGER DEFAULT 0;

CREATE INDEX idx_idempotency_key ON tree_contributions(idempotency_key);
CREATE INDEX idx_allocations_contribution ON tree_contribution_allocations(contribution_id);
CREATE INDEX idx_allocations_tree ON tree_contribution_allocations(tree_id);
CREATE INDEX idx_allocations_school ON tree_contribution_allocations(school_id);

