const fs = require('fs');
const path = require('path');

/**
 * db-migrate wrapper to execute SQL statements from a file.
 * This migration adds authentication-related tables and columns.
 */
module.exports.up = async function (db) {
  const sqlFile = path.join(__dirname, 'sqls', '20260507000100-auth-tokens-up.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');
  
  const statements = sql
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);

  for (const statement of statements) {
    await db.runSql(statement);
  }
};

module.exports.down = async function (db) {
  const downSql = `
    DROP INDEX IF EXISTS idx_password_reset_tokens_user_id;
    DROP TABLE IF EXISTS password_reset_tokens;
    DROP INDEX IF EXISTS idx_refresh_tokens_jti;
    DROP INDEX IF EXISTS idx_refresh_tokens_user_id;
    DROP TABLE IF EXISTS refresh_tokens;
    DROP INDEX IF EXISTS idx_users_email_unique;
    ALTER TABLE otp_codes DROP COLUMN IF EXISTS consumed;
    ALTER TABLE otp_codes DROP COLUMN IF EXISTS type;
    ALTER TABLE users DROP COLUMN IF EXISTS updated_at;
    ALTER TABLE users DROP COLUMN IF EXISTS role;
    ALTER TABLE users DROP COLUMN IF EXISTS is_verified;
  `;

  const statements = downSql
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);

  for (const statement of statements) {
    await db.runSql(statement);
  }
};
