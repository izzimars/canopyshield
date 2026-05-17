const fs = require('node:fs');
const path = require('node:path');

function readSqlFile(fileName) {
  return fs.readFileSync(path.join(__dirname, 'sqls', fileName), 'utf8');
}

function splitSqlStatements(sql) {
  return sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);
}

function runStatements(db, statements, callback) {
  const runNext = (index) => {
    if (index >= statements.length) {
      callback();
      return;
    }

    db.runSql(statements[index], (error) => {
      if (error) {
        callback(error);
        return;
      }

      runNext(index + 1);
    });
  };

  runNext(0);
}

exports.up = function (db, callback) {
  runStatements(db, splitSqlStatements(readSqlFile('20260507000000-init-up.sql')), callback);
};

exports.down = function (db, callback) {
  runStatements(db, splitSqlStatements(readSqlFile('20260507000000-init-down.sql')), callback);
};
