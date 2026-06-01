/* Replace with your SQL commands */
ALTER TABLE user_crowdfunding_stats
ADD CONSTRAINT user_crowdfunding_stats_user_id_unique UNIQUE (user_id);
