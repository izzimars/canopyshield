export default {
  emailExists:
    'SELECT 1 FROM users WHERE lower(email) = lower($1)',

  emailOrUsernameExists: `
    SELECT 1 FROM users WHERE lower(email) = lower($1) OR lower(username) = lower($2)
  `,
  findByEmail: `
    SELECT u.id, u.user_uuid, u.email, u.hashed_password, u.is_verified, u.role, u.created_at, u.updated_at,
      b.id as badge_id, b.type as badge_name
    FROM users as u
    LEFT JOIN badges as b ON u.user_uuid = b.user_id
    WHERE lower(email) = lower($1)
    `,
  createUser:
    `INSERT INTO users (email, hashed_password, is_verified, role, school_id, username)
     VALUES ($1, $2, false, 'user', $3, $4)
     RETURNING user_uuid, email, hashed_password, is_verified, role, school_id, username, created_at, updated_at`,

  storeOtp:
    `INSERT INTO otp_codes (user_id, code, type, expires_at, consumed)
     VALUES ($1, $2, $3, $4, false)
     RETURNING id, otp_uuid, user_id, code, type, expires_at, consumed, created_at
    `,
    findLatestOtpByUserAndType:
    ` SELECT id, otp_uuid, user_id, code, type, expires_at, consumed, created_at
      FROM otp_codes
      WHERE user_id = $1 AND type = $2 AND NOT consumed
      ORDER BY created_at DESC
      LIMIT 1`,
    findLatestOtpByUser: 
    ` SELECT id, otp_uuid, user_id, code, type, expires_at, consumed, created_at
      FROM otp_codes
      WHERE user_id = $1 AND NOT consumed
      ORDER BY created_at DESC
      LIMIT 1`,
    markOtpConsumed:
    `UPDATE otp_codes
     SET consumed = true
     WHERE otp_uuid = $1`,
};
