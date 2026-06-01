-- Drop user_crowdfunding_stats table
DROP TABLE IF EXISTS user_crowdfunding_stats CASCADE;

-- Drop school_crowdfunding table
DROP TABLE IF EXISTS school_crowdfunding CASCADE;

-- Drop tree_contributions table
DROP TABLE IF EXISTS tree_contributions CASCADE;

-- Remove columns from trees table if they were added
ALTER TABLE trees DROP COLUMN IF EXISTS source;

-- Remove tree_count column from schools if needed (optional - usually keep for backward compatibility)
-- ALTER TABLE schools DROP COLUMN IF EXISTS tree_count;
