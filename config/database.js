import mysql from 'mysql2/promise';
import { config } from 'dotenv';

// Load environment variables with error handling
try {
  config();
  console.log('✅ Database config: Environment variables loaded');
} catch (error) {
  console.error('❌ Database config: Failed to load .env:', error.message);
}

let pool;
let isConnected = false;
let connectionRetries = 0;
const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds

// Function to create connection pool with retry logic
const createConnectionPool = async () => {
  let connectionConfig;
  
  // Check if we're in production (Railway) with DATABASE_URL
  if (process.env.DATABASE_URL) {
    console.log('🌐 Using Railway DATABASE_URL');
    
    try {
      // Parse the DATABASE_URL (format: mysql://user:pass@host:port/dbname)
      const url = new URL(process.env.DATABASE_URL);
      
      // Extract connection details
      connectionConfig = {
        host: url.hostname,
        port: url.port || 3306,
        user: url.username,
        password: url.password,
        database: url.pathname.substring(1), // Remove leading slash
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 10000, // 10 seconds
        acquireTimeout: 10000, // 10 seconds
        ssl: {
          rejectUnauthorized: false // Railway requires SSL
        },
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000 // 10 seconds
      };
      
      console.log('📊 Railway Database Config:', {
        host: connectionConfig.host,
        port: connectionConfig.port,
        database: connectionConfig.database,
        user: connectionConfig.user ? connectionConfig.user.substring(0, 3) + '...' : 'undefined',
        ssl: connectionConfig.ssl ? 'Enabled' : 'Disabled'
      });
      
    } catch (error) {
      console.error('❌ Failed to parse DATABASE_URL:', error.message);
      console.error('⚠️ DATABASE_URL value:', process.env.DATABASE_URL ? 'Set (hidden for security)' : 'Not set');
      console.log('🔧 Falling back to individual DB config...');
      
      // Fallback to individual config
      connectionConfig = getIndividualConfig();
    }
  } else {
    // Local development with individual config
    console.log('💻 Using local database configuration');
    connectionConfig = getIndividualConfig();
  }
  
  try {
    console.log('🔌 Creating database connection pool...');
    pool = mysql.createPool(connectionConfig);
    
    // Test connection immediately
    const testConn = await pool.getConnection();
    console.log('✅ Database pool created successfully');
    
    // Test query
    const [rows] = await testConn.query('SELECT 1 + 1 AS result');
    console.log(`📊 Database test query result: ${rows[0].result}`);
    
    // Get database info
    const [dbInfo] = await testConn.query('SELECT DATABASE() as db, USER() as user');
    console.log(`📁 Connected to database: ${dbInfo[0].db}`);
    console.log(`👤 Connected as: ${dbInfo[0].user.split('@')[0]}...`);
    
    testConn.release();
    isConnected = true;
    connectionRetries = 0;
    
    return pool;
  } catch (error) {
    console.error('❌ Failed to create database pool:', error.message);
    console.error('🔧 Error code:', error.code);
    console.error('🔧 Error number:', error.errno);
    
    // Log connection details (safe version)
    console.error('🔧 Connection attempt details:', {
      host: connectionConfig.host,
      port: connectionConfig.port,
      database: connectionConfig.database,
      user: connectionConfig.user ? '***' + connectionConfig.user.slice(-3) : 'undefined'
    });
    
    throw error;
  }
};

// Helper function for individual config
const getIndividualConfig = () => {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'career_guidance',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000,
    acquireTimeout: 10000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
  };
  
  console.log('📊 Local Database Config:', {
    host: dbConfig.host,
    database: dbConfig.database,
    port: dbConfig.port
  });
  
  return dbConfig;
};

// Initialize database connection with retry logic
const initializeDatabase = async () => {
  while (connectionRetries < MAX_RETRIES && !isConnected) {
    try {
      console.log(`🔄 Database connection attempt ${connectionRetries + 1}/${MAX_RETRIES}...`);
      await createConnectionPool();
      return true;
    } catch (error) {
      connectionRetries++;
      
      if (connectionRetries < MAX_RETRIES) {
        console.log(`⏳ Retrying database connection in ${RETRY_DELAY/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      } else {
        console.error(`❌ Maximum connection retries (${MAX_RETRIES}) reached`);
        
        // Don't exit in production, let the app run without DB
        if (process.env.NODE_ENV === 'production') {
          console.log('⚠️ Continuing in production mode without database connection');
          console.log('🔧 Database operations will fail until connection is restored');
          return false;
        } else {
          console.error('💥 Exiting in development mode due to database connection failure');
          process.exit(1);
        }
      }
    }
  }
  
  return isConnected;
};

// Test database connection
export const testConnection = async () => {
  try {
    if (!pool) {
      console.log('🔄 Database pool not initialized, initializing now...');
      await initializeDatabase();
    }
    
    if (!isConnected) {
      throw new Error('Database not connected');
    }
    
    const connection = await pool.getConnection();
    
    // Test with a simple query
    const [rows] = await connection.query('SELECT 1 + 1 AS result, NOW() as timestamp');
    console.log(`✅ Database connected - Test result: ${rows[0].result}, Time: ${rows[0].timestamp}`);
    
    // Get additional info in production
    if (process.env.NODE_ENV === 'production') {
      const [stats] = await connection.query(`
        SELECT 
          (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE()) as tables_count,
          (SELECT COUNT(*) FROM users) as users_count,
          (SELECT COUNT(*) FROM institutes) as institutes_count
      `);
      
      if (stats[0]) {
        console.log(`📊 Database Stats - Tables: ${stats[0].tables_count}, Users: ${stats[0].users_count}, Institutes: ${stats[0].institutes_count}`);
      }
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
    
    // Try to reconnect if this was a connection error
    if (error.code === 'PROTOCOL_CONNECTION_LOST' || 
        error.code === 'ECONNREFUSED' || 
        error.code === 'ETIMEDOUT') {
      console.log('🔄 Connection lost, attempting to reconnect...');
      isConnected = false;
      connectionRetries = 0;
      await initializeDatabase();
    }
    
    return false;
  }
};

// Get connection from pool with error handling
export const getConnection = async () => {
  try {
    if (!isConnected || !pool) {
      console.log('🔄 Re-establishing database connection...');
      await initializeDatabase();
    }
    
    const connection = await pool.getConnection();
    return connection;
  } catch (error) {
    console.error('❌ Failed to get database connection:', error.message);
    throw error;
  }
};

// Execute query with error handling
export const executeQuery = async (query, params = []) => {
  let connection;
  try {
    if (!isConnected || !pool) {
      console.log('🔄 Database not connected, attempting to reconnect...');
      await initializeDatabase();
    }
    
    connection = await pool.getConnection();
    const [results] = await connection.query(query, params);
    return results;
  } catch (error) {
    console.error('❌ Database query error:', error.message);
    console.error('🔧 Query:', query.substring(0, 200) + '...');
    console.error('🔧 Params:', params);
    console.error('🔧 Error details:', {
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState
    });
    
    // Re-throw for route handlers to catch
    throw {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
      isDatabaseError: true
    };
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// Close database connections gracefully
export const closeDatabase = async () => {
  try {
    if (pool) {
      console.log('🔌 Closing database connections...');
      await pool.end();
      isConnected = false;
      console.log('✅ Database connections closed');
    }
  } catch (error) {
    console.error('❌ Error closing database connections:', error.message);
  }
};

// Event listeners for connection pool
const setupEventListeners = () => {
  if (pool) {
    pool.on('connection', (connection) => {
      console.log(`📊 New database connection (ID: ${connection.threadId})`);
    });
    
    pool.on('acquire', (connection) => {
      console.log(`📊 Connection acquired (ID: ${connection.threadId})`);
    });
    
    pool.on('release', (connection) => {
      console.log(`📊 Connection released (ID: ${connection.threadId})`);
    });
    
    pool.on('enqueue', () => {
      console.log('📊 Waiting for available database connection...');
    });
  }
};

// Initialize immediately when module loads
initializeDatabase().then(connected => {
  if (connected) {
    setupEventListeners();
    console.log('✅ Database module initialized successfully');
  } else {
    console.warn('⚠️ Database module initialized without connection');
  }
});

// Graceful shutdown handler for database
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, closing database connections...');
  await closeDatabase();
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, closing database connections...');
  await closeDatabase();
});

// Export pool and functions
export { pool, isConnected };
