const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
});

// Quick sanity-check on startup
pool.query('SELECT 1').catch((err) => {
  console.error('DB connection failed:', err.message);
  process.exit(1);
});

module.exports = pool;
