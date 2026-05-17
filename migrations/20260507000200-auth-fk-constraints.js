const fs = require('fs');
const path = require('path');

/**
 * db-migrate wrapper to execute SQL statements from a file.
 * This migration adds foreign key constraints for auth tables.
 */
module.exports.up = async function (db) {
  const sqlFile = path.join(__dirname, 'sqls', '20260507000200-auth-fk-constraints-up.sql');
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
    ALTER TABLE otp_codes DROP CONSTRAINT IF EXISTS otp_codes_user_id_fkey;
    ALTER TABLE password_reset_tokens DROP CONSTRAINT IF EXISTS password_reset_tokens_user_id_fkey;
    ALTER TABLE refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_user_id_fkey;
  `;

  const statements = downSql
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);

  for (const statement of statements) {
    await db.runSql(statement);
  }
};
