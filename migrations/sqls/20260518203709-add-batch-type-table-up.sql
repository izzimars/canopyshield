/* Replace with your SQL commands */
CREATE TABLE IF NOT EXISTS badge_types (
    id serial PRIMARY KEY,
    type text UNIQUE NOT NULL,          -- 'novice', 'amateur', etc.
    threshold integer NOT NULL,         -- minimum trees needed
    description text,
    icon_url text,
    sort_order integer,                 -- to order badges hierarchically
    created_at timestamptz DEFAULT now()
);

-- Insert your tiers
INSERT INTO badge_types (type, threshold, sort_order) VALUES
    ('novice', 1, 1),
    ('amateur', 10, 2),
    ('skilled', 100, 3),
    ('expert', 500, 4),
    ('master', 2000, 5),
    ('grandmaster', 10000, 6),
    ('legendary', 50000, 7),
    ('god', 100000, 8);
