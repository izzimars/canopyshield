/* Replace with your SQL commands */
CREATE TABLE IF NOT EXISTS school_badge_types (
    id SERIAL UNIQUE,
    sbt_uuid text UNIQUE PRIMARY KEY DEFAULT('sbt' || gen_random_uuid()::text),
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    threshold INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed some school badge tiers
INSERT INTO school_badge_types (name, display_name, threshold, description) VALUES
    ('seedling', '🌱 Seedling School', 1, 'First tree planted on campus'),
    ('grove', '🌳 Grove School', 10, '10 trees on campus'),
    ('woodland', '🌲 Woodland School', 50, '50 trees on campus'),
    ('forest', '🏆 Forest School', 100, '100 trees on campus')
ON CONFLICT (name) DO NOTHING;

-- Create school_badges table
CREATE TABLE IF NOT EXISTS school_badges (
    id SERIAL UNIQUE,
    badge_uuid TEXT UNIQUE PRIMARY KEY DEFAULT('schoolbadge' || gen_random_uuid()::text),
    school_id TEXT NOT NULL REFERENCES schools(school_uuid),
    badge_type TEXT NOT NULL REFERENCES school_badge_types(name),
    awarded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_school_badges_school ON school_badges(school_id);
