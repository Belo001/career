import mysql from 'mysql2/promise';
import { config } from 'dotenv';
config();

const getDbConfig = () => {
  // Option 1: Use individual Railway variables
  if (process.env.DB_HOST && process.env.NODE_ENV === 'production') {
    console.log('🚂 Using Railway MySQL internal connection');
    return {
      host: process.env.DB_HOST || 'mysql.railway.internal',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'railway',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    };
  }
  
  // Option 2: Use DATABASE_URL
  if (process.env.DATABASE_URL) {
    console.log('🌐 Using Railway DATABASE_URL');
    const url = new URL(process.env.DATABASE_URL);
    return {
      host: url.hostname,
      port: url.port || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.substring(1),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: { rejectUnauthorized: false }
    };
  }
  
  // Local development
  console.log('💻 Using local database configuration');
  return {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'career_guidance',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };
};

const pool = mysql.createPool(getDbConfig());

export { pool };

export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    console.log(`📊 Database: ${getDbConfig().database}`);
    console.log(`🌐 Host: ${getDbConfig().host}:${getDbConfig().port}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Full error:', error);
    return false;
  }
};
