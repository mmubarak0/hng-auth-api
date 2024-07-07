const pg = require('pg');
const { Pool } = pg;

const poolConfig = {
  user: process.env.POSTGRESQL_ADDON_USER || 'postgres',
  host: process.env.POSTGRESQL_ADDON_HOST || 'localhost',
  database: process.env.POSTGRESQL_ADDON_DB || 'hngauth',
  password: process.env.POSTGRESQL_ADDON_PASSWORD || 'postgres',
  port: process.env.POSTGRESQL_ADDON_PORT || 5432,
};

const testPoolConfig = {
  user: process.env.POSTGRESQL_ADDON_USER || 'postgres',
  host: process.env.POSTGRESQL_ADDON_HOST || 'localhost',
  database: process.env.POSTGRESQL_ADDON_TEST_DB || 'hngauth_test',
  password: process.env.POSTGRESQL_ADDON_TEST_PASSWORD || 'postgres',
  port: process.env.POSTGRESQL_ADDON_PORT || 5432,
};

let pool;
if (process.env.NODE_ENV === 'test') {
  pool = new Pool(testPoolConfig);
} else {
  pool = new Pool(poolConfig);
}
module.exports = pool;
