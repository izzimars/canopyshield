-- Add foreign key constraints for auth tables
-- Note: Reference user_uuid (UUID) not id (INTEGER)
ALTER TABLE otp_codes
ADD CONSTRAINT otp_codes_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(user_uuid) ON DELETE CASCADE;
