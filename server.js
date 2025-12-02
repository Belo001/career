import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mysql from 'mysql2/promise';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

console.log('🚀 SERVER STARTING DEBUG VERSION');

// ============================================
// DATABASE DEBUG FUNCTION
// ============================================
const debugDatabase = async () => {
  console.log('\n🔍 DEBUGGING DATABASE CONNECTION...');
  
  const dbConfig = {
    host: 'mysql.railway.internal',
    port: 3306,
    user: 'root',
    password: 'tSVIRWsFKyujfCKvkIxgGRTLFXsjFDiS',
    database: 'railway',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };
  
  console.log('📊 Trying to connect with:', {
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.user
  });
  
  try {
    const pool = mysql.createPool(dbConfig);
    const connection = await pool.getConnection();
    console.log('✅ DATABASE CONNECTED SUCCESSFULLY!');
    
    // 1. Show ALL databases
    const [dbs] = await connection.query('SHOW DATABASES');
    console.log('\n📚 ALL DATABASES:');
    dbs.forEach(db => console.log('   -', Object.values(db)[0]));
    
    // 2. Show tables in 'railway' database
    console.log('\n📋 CHECKING TABLES IN "railway" DATABASE:');
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`   Found ${tables.length} tables`);
    
    if (tables.length === 0) {
      console.log('\n❌ NO TABLES FOUND! Creating essential tables...');
      
      // Create simple users table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          user_type ENUM('student', 'institute', 'admin') NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Created "users" table');
      
      // Create other essential tables
      await connection.query(`
        CREATE TABLE IF NOT EXISTS institutes (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT,
          name VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Created "institutes" table');
      
      // Add admin user
      await connection.query(`
        INSERT IGNORE INTO users (name, email, password, user_type) 
        VALUES ('Admin', 'admin@test.com', 'password123', 'admin')
      `);
      console.log('✅ Added admin user: admin@test.com / password123');
      
    } else {
      console.log('\n📊 TABLES FOUND:');
      tables.forEach(table => {
        console.log('   -', Object.values(table)[0]);
      });
      
      // Show sample data from users table
      try {
        const [users] = await connection.query('SELECT * FROM users LIMIT 3');
        console.log('\n👤 SAMPLE USERS (first 3):');
        users.forEach(user => {
          console.log(`   - ${user.name} (${user.email}) - ${user.user_type}`);
        });
      } catch (e) {
        console.log('⚠️ Could not read users table:', e.message);
      }
    }
    
    connection.release();
    console.log('\n🎉 DATABASE DEBUG COMPLETE!');
    return pool;
    
  } catch (error) {
    console.error('\n❌ DATABASE CONNECTION FAILED:', error.message);
    console.error('Error code:', error.code);
    console.error('Error details:', error);
    return null;
  }
};

// Run database debug on startup
let dbPool = null;
debugDatabase().then(pool => {
  dbPool = pool;
  console.log('\n✅ Database initialization complete!');
}).catch(err => {
  console.log('\n⚠️ Database debug failed:', err.message);
});

// ============================================
// ROUTES
// ============================================

// Health check with DB status
app.get('/api/health', async (req, res) => {
  let dbStatus = 'unknown';
  let tableCount = 0;
  
  if (dbPool) {
    try {
      const connection = await dbPool.getConnection();
      const [tables] = await connection.query('SHOW TABLES');
      tableCount = tables.length;
      connection.release();
      dbStatus = 'connected';
    } catch (error) {
      dbStatus = 'error';
    }
  } else {
    dbStatus = 'not_connected';
  }
  
  res.json({
    status: 'OK',
    message: 'Career Guidance API Debug Version',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      tables: tableCount,
      url: 'mysql.railway.internal:3306/railway'
    }
  });
});

// Test database directly
app.get('/api/debug/db', async (req, res) => {
  if (!dbPool) {
    return res.status(503).json({
      success: false,
      message: 'Database not connected'
    });
  }
  
  try {
    const connection = await dbPool.getConnection();
    
    // Get all tables
    const [tables] = await connection.query('SHOW TABLES');
    
    // Get table details
    const tableDetails = [];
    for (const table of tables) {
      const tableName = Object.values(table)[0];
      const [columns] = await connection.query(`DESCRIBE ${tableName}`);
      tableDetails.push({
        name: tableName,
        columns: columns.length,
        columnNames: columns.map(col => col.Field)
      });
    }
    
    connection.release();
    
    res.json({
      success: true,
      tables: tables.length,
      tableDetails: tableDetails
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database error',
      error: error.message
    });
  }
});

// Test user registration
app.post('/api/debug/register', async (req, res) => {
  if (!dbPool) {
    return res.status(503).json({
      success: false,
      message: 'Database not connected'
    });
  }
  
  const { name = 'Test User', email = `test${Date.now()}@example.com`, password = 'password123' } = req.body;
  
  try {
    const connection = await dbPool.getConnection();
    
    // Check if users table exists
    const [tables] = await connection.query("SHOW TABLES LIKE 'users'");
    
    if (tables.length === 0) {
      // Create users table
      await connection.query(`
        CREATE TABLE users (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          user_type ENUM('student', 'institute', 'admin') DEFAULT 'student',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
    
    // Insert user
    await connection.query(
      'INSERT INTO users (name, email, password, user_type) VALUES (?, ?, ?, ?)',
      [name, email, password, 'student']
    );
    
    connection.release();
    
    res.json({
      success: true,
      message: 'User registered successfully',
      data: { name, email, userType: 'student' }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Career Guidance API - Debug Version',
    version: '1.0.0',
    endpoints: [
      'GET  /api/health - Health check with DB status',
      'GET  /api/debug/db - Show database tables',
      'POST /api/debug/register - Test registration'
    ]
  });
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ Server running on port ${PORT}`);
  console.log(`📍 Host: 0.0.0.0`);
  console.log(`🌐 External URL: https://sincere-forgiveness-production.up.railway.app`);
  console.log(`🏥 Health: https://sincere-forgiveness-production.up.railway.app/api/health`);
  console.log(`🔧 Debug: https://sincere-forgiveness-production.up.railway.app/api/debug/db`);
});
