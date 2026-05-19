/* Replace with your SQL commands */
-- UP
ALTER TABLE tree_requests ADD COLUMN user_id text NOT NULL REFERENCES users(user_uuid) ON DELETE CASCADE;

-- Then add index
CREATE INDEX tree_requests_user_id_idx ON tree_requests (user_id);
