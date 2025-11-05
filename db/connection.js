import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔌 [DB] Creating database connection pool...');
console.log('📋 [DB] Environment check:', {
  hasDB_HOST: !!process.env.DB_HOST,
  hasDB_USER: !!process.env.DB_USER,
  hasDB_NAME: !!process.env.DB_NAME,
  hasDB_PASS: !!process.env.DB_PASS ? '***' : 'MISSING',
  DB_PORT: process.env.DB_PORT
});

// Railway-specific configuration
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  
  // Railway-optimized settings
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  
  // MySQL specific settings for Railway
  charset: 'utf8mb4',
  timezone: 'Z',
  ssl: process.env.NODE_ENV === 'production' ? {} : undefined,
  multipleStatements: false
});

// Test connection on startup
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ [DB] Initial connection FAILED:', err.message);
    console.error('❌ [DB] Error code:', err.code);
    console.error('❌ [DB] Full error:', err);
  } else {
    console.log('✅ [DB] Successfully connected to MySQL on Railway');
    
    // Test a simple query
    connection.query('SELECT 1 + 1 AS result', (queryErr, results) => {
      if (queryErr) {
        console.error('❌ [DB] Test query failed:', queryErr);
      } else {
        console.log('✅ [DB] Test query successful:', results[0]);
      }
      connection.release();
    });
  }
});

// Pool event listeners for debugging
pool.on('acquire', (connection) => {
  console.log('🔗 [DB] Connection acquired');
});

pool.on('release', (connection) => {
  console.log('🔄 [DB] Connection released');
});

pool.on('enqueue', () => {
  console.log('⏳ [DB] Waiting for available connection slot');
});

export default pool;