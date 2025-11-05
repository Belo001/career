import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔌 Setting up database connection...');

// Simple connection without complex options
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 5, // Reduced for stability
  acquireTimeout: 30000,
  timeout: 30000
});

// Simple connection test
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ Database connected successfully');
    connection.release();
  }
});

export default pool;