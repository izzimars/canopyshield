'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbm initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db) {
  return db.runSql(require('fs').readFileSync(require('path').join(__dirname, './sqls/20260523000000-crowdfunding-tables-up.sql'), 'utf8'));
};

exports.down = function(db) {
  return db.runSql(require('fs').readFileSync(require('path').join(__dirname, './sqls/20260523000000-crowdfunding-tables-down.sql'), 'utf8'));
};

exports._meta = {
  "version": 1
};
