import mysql from 'mysql2/promise';
import { config } from 'dotenv';
config();

console.log('🔍 DATABASE CONFIGURATION CHECK:');
console.log('================================');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '[HIDDEN]' : 'not set');
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '[HIDDEN]' : 'not set');
console.log('================================');

const getDbConfig = () => {
  // ============================================
  // 1. RAILWAY PRODUCTION - Individual Variables
  // ============================================
  if (process.env.NODE_ENV === 'production' && process.env.DB_HOST) {
    console.log('🚂 MODE: Railway Production (individual variables)');
    const config = {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'railway',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    };
    
    console.log('📊 Config:', {
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user
    });
    return config;
  }
  
  // ============================================
  // 2. RAILWAY PRODUCTION - DATABASE_URL
  // ============================================
  if (process.env.DATABASE_URL) {
    console.log('🌐 MODE: Railway Production (DATABASE_URL)');
    try {
      const url = new URL(process.env.DATABASE_URL);
      const config = {
        host: url.hostname,
        port: parseInt(url.port) || 3306,
        user: url.username,
        password: url.password,
        database: url.pathname.substring(1),
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        ssl: { rejectUnauthorized: false }
      };
      
      console.log('📊 Config:', {
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user
      });
      return config;
    } catch (error) {
      console.error('❌ Failed to parse DATABASE_URL:', error.message);
    }
  }
  
  // ============================================
  // 3. LOCAL DEVELOPMENT
  // ============================================
  console.log('💻 MODE: Local Development');
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'career_guidance',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };
  
  console.log('📊 Config:', {
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user
  });
  return config;
};

// Create connection pool
const pool = mysql.createPool(getDbConfig());

// Test connection function
export const testConnection = async () => {
  const config = getDbConfig();
  console.log('\n🔧 TESTING DATABASE CONNECTION:');
  console.log('===============================');
  console.log('Target:', `${config.user}@${config.host}:${config.port}/${config.database}`);
  
  try {
    const connection = await pool.getConnection();
    console.log('✅ CONNECTION SUCCESSFUL!');
    
    // Test query
    const [result] = await connection.query('SELECT 1 + 1 AS test_result');
    console.log('🧪 Test query result:', result[0].test_result);
    
    // Show database info
    const [dbInfo] = await connection.query('SELECT DATABASE() as db, VERSION() as version');
    console.log('📊 Database:', dbInfo[0].db);
    console.log('🔢 MySQL Version:', dbInfo[0].version);
    
    connection.release();
    console.log('===============================\n');
    return true;
  } catch (error) {
    console.error('❌ CONNECTION FAILED:', error.message);
    console.error('Error code:', error.code);
    console.error('Error details:', error);
    console.log('===============================\n');
    return false;
  }
};

// Export pool
export { pool };

// Auto-test on import (optional)
if (process.env.NODE_ENV === 'production') {
  testConnection().catch(console.error);
}
