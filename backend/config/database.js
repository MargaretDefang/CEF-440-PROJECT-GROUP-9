const { Pool } = require('pg');
require('dotenv').config();

console.log('Database configuration:', {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'road_app_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD ? '***' : 'not set'
});

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'road_app_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test the connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Test initial connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Initial database connection test failed:', err);
  } else {
    console.log('Initial database connection test successful:', res.rows[0]);
  }
});

module.exports = pool; 