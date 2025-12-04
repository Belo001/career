import mysql from 'mysql2/promise';
import { config } from 'dotenv';
config();

let pool;

// Function to get database config for Railway
const getDbConfig = () => {
  console.log('🔍 Checking for Railway MySQL variables...');
  
  // Check for Railway's MYSQL_URL (internal)
  if (process.env.MYSQL_URL) {
    console.log('🚂 Using Railway MYSQL_URL (internal)');
    try {
      const url = new URL(process.env.MYSQL_URL);
      return {
        host: url.hostname,
        port: url.port || 3306,
        user: url.username,
        password: url.password,
        database: url.pathname.substring(1),
        ssl: false // Internal connection doesn't need SSL
      };
    } catch (error) {
      console.error('Failed to parse MYSQL_URL:', error.message);
    }
  }
  
  // Check for Railway's individual MySQL variables
  if (process.env.MYSQLHOST) {
    console.log('🚂 Using Railway individual MySQL variables');
    return {
      host: process.env.MYSQLHOST,
      port: process.env.MYSQLPORT || 3306,
      user: process.env.MYSQLUSER || 'root',
      password: process.env.MYSQLPASSWORD,
      database: process.env.MYSQLDATABASE || 'railway',
      ssl: false // Internal connection
    };
  }
  
  // Check for Railway's MYSQL_PUBLIC_URL (external)
  if (process.env.MYSQL_PUBLIC_URL) {
    console.log('🚂 Using Railway MYSQL_PUBLIC_URL (external)');
    try {
      const url = new URL(process.env.MYSQL_PUBLIC_URL);
      return {
        host: url.hostname,
        port: url.port || 3306,
        user: url.username,
        password: url.password,
        database: url.pathname.substring(1),
        ssl: { rejectUnauthorized: false } // External needs SSL
      };
    } catch (error) {
      console.error('Failed to parse MYSQL_PUBLIC_URL:', error.message);
    }
  }
  
  // Fallback to DATABASE_URL (generic)
  if (process.env.DATABASE_URL) {
    console.log('📦 Using DATABASE_URL');
    try {
      const url = new URL(process.env.DATABASE_URL);
      return {
        host: url.hostname,
        port: url.port || 3306,
        user: url.username,
        password: url.password,
        database: url.pathname.substring(1),
        ssl: { rejectUnauthorized: false }
      };
    } catch (error) {
      console.error('Failed to parse DATABASE_URL:', error.message);
    }
  }
  
  // Last resort: local development
  console.log('💻 Using local database configuration');
  return {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'career_guidance',
    port: process.env.DB_PORT || 3306
  };
};

// Initialize database connection
const initializeDatabase = async () => {
  try {
    const dbConfig = getDbConfig();
    
    console.log('📊 Database Configuration Detected:', {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user ? `${dbConfig.user.substring(0, 3)}...` : 'undefined',
      ssl: dbConfig.ssl ? 'Enabled' : 'Disabled'
    });

    // Create connection pool
    pool = mysql.createPool({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      ssl: dbConfig.ssl,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    });

    console.log('✅ Database pool created successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize database:', error.message);
    console.error('🔧 Error code:', error.code);
    return false;
  }
};

// Test database connection
export const testConnection = async () => {
  try {
    if (!pool) {
      console.log('🔄 Initializing database connection...');
      const initialized = await initializeDatabase();
      if (!initialized) {
        throw new Error('Failed to initialize database');
      }
    }

    const connection = await pool.getConnection();
    console.log('🔗 Database connection acquired');
    
    // Test with a simple query
    const [rows] = await connection.query('SELECT 1 + 1 AS result');
    console.log(`✅ Database connected - Test result: ${rows[0].result}`);
    
    // Get database info
    const [dbInfo] = await connection.query('SELECT DATABASE() as db, USER() as user');
    console.log(`📁 Database: ${dbInfo[0].db}`);
    console.log(`👤 Connected as: ${dbInfo[0].user.split('@')[0]}...`);

    // Check if our tables exist
    try {
      const [tables] = await connection.query(`
        SELECT COUNT(*) as table_count 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE()
      `);
      console.log(`📊 Tables in database: ${tables[0].table_count}`);
      
      // If no tables, we need to import the database
      if (tables[0].table_count === 0) {
        console.log('⚠️ Database is empty! You need to import your SQL file.');
        console.log('💡 Run this command to import:');
        console.log(`   mysql -h ${process.env.MYSQLHOST || 'localhost'} -u ${process.env.MYSQLUSER || 'root'} -p ${process.env.MYSQLDATABASE || 'railway'} < career_guidance.sql`);
      }
    } catch (tableError) {
      console.log('⚠️ Could not check tables');
    }

    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    console.error('🔧 Error details:', {
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    
    console.log('\n🔍 Available MySQL environment variables:');
    console.log(`   MYSQLHOST: ${process.env.MYSQLHOST || 'Not set'}`);
    console.log(`   MYSQLPORT: ${process.env.MYSQLPORT || 'Not set'}`);
    console.log(`   MYSQLUSER: ${process.env.MYSQLUSER || 'Not set'}`);
    console.log(`   MYSQLDATABASE: ${process.env.MYSQLDATABASE || 'Not set'}`);
    console.log(`   MYSQL_URL: ${process.env.MYSQL_URL ? 'Set (hidden for security)' : 'Not set'}`);
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? 'Set (hidden for security)' : 'Not set'}`);
    
    if (process.env.NODE_ENV === 'production') {
      console.log('\n⚠️ Continuing in production mode - database operations will fail');
      console.log('💡 To fix: Import your SQL file into Railway MySQL');
      return false;
    }
    
    return false;
  }
};

export { pool };
