const fs = require('fs');
const path = require('path');

function runStatements(db, fileName) {
  const sqlFile = path.join(__dirname, 'sqls', fileName);
  const sql = fs.readFileSync(sqlFile, 'utf8');

  const statements = sql
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean);

  return statements.reduce((promise, statement) => {
    return promise.then(() => db.runSql(statement));
  }, Promise.resolve());
}

module.exports.up = function (db) {
  return runStatements(db, '20260512093950-admin-bootstrap-up.sql');
};

module.exports.down = function (db) {
  return runStatements(db, '20260512093950-admin-bootstrap-down.sql');
};