import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise'; // ✅ DATABASE INCLUDED HERE

const app = express();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// DATABASE SETUP (INCLUDED IN SERVER.JS)
// ============================================
console.log('🚀 DATABASE SETUP FOR RAILWAY');

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

console.log('📊 Using Railway MySQL:');
console.log(`   Host: ${dbConfig.host}:${dbConfig.port}`);
console.log(`   Database: ${dbConfig.database}`);
console.log(`   User: ${dbConfig.user}`);

const pool = mysql.createPool(dbConfig);

// Database initialization
const initializeDatabase = async () => {
  console.log('\n🔧 Initializing database...');
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected!');
    
    // Check if users table exists
    const [tables] = await connection.query("SHOW TABLES LIKE 'users'");
    
    if (tables.length === 0) {
      console.log('📦 Creating essential tables...');
      
      // Create essential tables
      const createTables = [
        `CREATE TABLE users (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          user_type ENUM('student', 'institute', 'admin') NOT NULL,
          is_verified BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE institutes (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE students (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE applications (
          id INT PRIMARY KEY AUTO_INCREMENT,
          student_id INT,
          course_id INT,
          status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
      ];
      
      for (const sql of createTables) {
        await connection.query(sql);
      }
      
      console.log('✅ Tables created!');
    } else {
      console.log('✅ Database already has tables');
    }
    
    connection.release();
  } catch (error) {
    console.log('⚠️ Database init:', error.message);
  }
};

// ============================================
// MIDDLEWARE
// ============================================
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// ============================================
// SIMPLE ROUTES (NO SEPARATE CONTROLLERS NEEDED)
// ============================================

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [tables] = await connection.query('SHOW TABLES');
    connection.release();
    
    res.json({
      status: 'OK',
      message: 'Career Guidance Platform',
      timestamp: new Date().toISOString(),
      database: 'connected',
      tables: tables.length,
      version: '1.0.0'
    });
  } catch (error) {
    res.json({
      status: 'OK',
      message: 'Career Guidance Platform',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// Register user
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, userType } = req.body;
  
  try {
    const connection = await pool.getConnection();
    
    // Simple insert
    const [result] = await connection.query(
      'INSERT INTO users (name, email, password, user_type) VALUES (?, ?, ?, ?)',
      [name, email, password, userType]
    );
    
    connection.release();
    
    res.json({
      success: true,
      message: 'User registered successfully',
      userId: result.insertId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

// Get institutes
app.get('/api/institutes', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [institutes] = await connection.query('SELECT * FROM institutes');
    connection.release();
    
    res.json({
      success: true,
      data: institutes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch institutes'
    });
  }
});

// Apply to course
app.post('/api/applications/apply', async (req, res) => {
  const { studentId, courseId } = req.body;
  
  try {
    const connection = await pool.getConnection();
    
    const [result] = await connection.query(
      'INSERT INTO applications (student_id, course_id) VALUES (?, ?)',
      [studentId, courseId]
    );
    
    connection.release();
    
    res.json({
      success: true,
      message: 'Application submitted',
      applicationId: result.insertId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Application failed'
    });
  }
});

// ============================================
// FRONTEND ROUTE (MUST BE LAST)
// ============================================
app.get('*', (req, res) => {
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: `API endpoint ${req.method} ${req.originalUrl} not found`
    });
  }
  
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================
// START SERVER
// ============================================
const startServer = async () => {
  // Initialize database first
  await initializeDatabase();
  
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n✅ Server running on port ${PORT}`);
    console.log(`📍 Host: 0.0.0.0`);
    console.log(`🌐 Public URL: https://sincere-forgiveness-production.up.railway.app`);
    console.log(`🏥 API Health: https://sincere-forgiveness-production.up.railway.app/api/health`);
    console.log(`📱 Frontend: https://sincere-forgiveness-production.up.railway.app/`);
    console.log(`🎓 Career Guidance Platform - READY! 🚀`);
  });
};

startServer().catch(console.error);
