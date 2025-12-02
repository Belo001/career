import mysql from 'mysql2/promise';
import { config } from 'dotenv';
config();

let pool;

if (process.env.DATABASE_URL) {
  // Railway provides DATABASE_URL
  const url = new URL(process.env.DATABASE_URL);
  pool = mysql.createPool({
    host: url.hostname,
    port: url.port || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.substring(1),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: { rejectUnauthorized: false }
  });
  console.log('🌐 Connected to Railway MySQL database');
} else {
  // Local development
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'career_guidance',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };
  pool = mysql.createPool(dbConfig);
  console.log('💻 Connected to local MySQL database');
}

export { pool };

export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    // Don't exit in production
    if (process.env.NODE_ENV === 'production') {
      console.log('⚠️ Continuing in production, will retry...');
    } else {
      process.exit(1);
    }
  }
};
