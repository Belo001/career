import mysql from 'mysql2/promise';
import { config } from 'dotenv';
config();

let pool;

// Function to parse DATABASE_URL safely
const parseDatabaseUrl = (urlString) => {
  try {
    const url = new URL(urlString);
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
    return null;
  }
};

// Function to get database config
const getDbConfig = () => {
  // Priority 1: Railway DATABASE_URL
  if (process.env.DATABASE_URL) {
    console.log('🌐 Using Railway DATABASE_URL');
    const parsedConfig = parseDatabaseUrl(process.env.DATABASE_URL);
    if (parsedConfig) {
      return parsedConfig;
    }
  }

  // Priority 2: Individual environment variables
  console.log('💻 Using individual database configuration');
  return {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'career_guidance',
    port: process.env.DB_PORT || 3306,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
  };
};

// Initialize database connection
const initializeDatabase = async () => {
  try {
    const dbConfig = getDbConfig();
    
    console.log('📊 Database Config:', {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user ? `${dbConfig.user.substring(0, 3)}...` : 'undefined'
    });

    // Create connection pool with only valid options
    pool = mysql.createPool({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      ssl: dbConfig.ssl,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    console.log('✅ Database pool created');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize database:', error.message);
    return false;
  }
};

// Test database connection
export const testConnection = async () => {
  try {
    if (!pool) {
      console.log('🔄 Initializing database connection...');
      await initializeDatabase();
    }

    const connection = await pool.getConnection();
    
    // Test with a simple query
    const [rows] = await connection.query('SELECT 1 + 1 AS result');
    console.log(`✅ Database connected - Test result: ${rows[0].result}`);
    
    // Get database info
    const [dbInfo] = await connection.query('SELECT DATABASE() as db, USER() as user');
    console.log(`📁 Database: ${dbInfo[0].db}`);
    console.log(`👤 Connected as: ${dbInfo[0].user.split('@')[0]}...`);

    // Check if tables exist
    try {
      const [tables] = await connection.query(`
        SELECT COUNT(*) as table_count 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE()
      `);
      console.log(`📊 Tables in database: ${tables[0].table_count}`);
    } catch (tableError) {
      console.log('⚠️ Could not check tables - database might be empty');
    }

    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    console.error('🔧 Error details:', {
      code: error.code,
      errno: error.errno
    });

    if (process.env.NODE_ENV === 'production') {
      console.log('⚠️ Continuing in production mode - database will retry');
      return false;
    } else {
      console.log('💡 Tips for local development:');
      console.log('   1. Make sure MySQL is running');
      console.log('   2. Check your database credentials');
      console.log('   3. Create the database if it doesn\'t exist');
      return false;
    }
  }
};

export { pool };
