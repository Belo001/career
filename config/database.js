import mysql from 'mysql2/promise';

console.log('🚀 DATABASE SETUP FOR RAILWAY');

// HARDCODE Railway MySQL credentials
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

// ============================================
// SIMPLE AUTO-SETUP FUNCTION
// ============================================
const setupDatabase = async () => {
  console.log('\n🔧 AUTO-SETUP: Checking database...');
  
  try {
    const connection = await pool.getConnection();
    
    // Check if users table exists
    const [tables] = await connection.query("SHOW TABLES LIKE 'users'");
    
    if (tables.length === 0) {
      console.log('📦 No tables found. Creating essential tables...');
      
      // Create ONLY essential tables (simplified)
      const createTables = [
        // Users table
        `CREATE TABLE users (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          user_type ENUM('student', 'institute', 'admin') NOT NULL,
          is_verified BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // Institutes table  
        `CREATE TABLE institutes (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // Students table
        `CREATE TABLE students (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // Courses table
        `CREATE TABLE courses (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(255) NOT NULL,
          code VARCHAR(50) UNIQUE NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // Applications table
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
      
      console.log('✅ 5 essential tables created!');
      
      // Add default admin
      await connection.query(`
        INSERT IGNORE INTO users (name, email, password, user_type, is_verified) 
        VALUES ('System Admin', 'admin@careerguide.com', '$2a$10$0987654321', 'admin', TRUE)
      `);
      
      console.log('✅ Default admin created');
    } else {
      console.log('✅ Database already has tables');
    }
    
    connection.release();
    console.log('🎉 Database setup complete!');
    
  } catch (error) {
    console.log('⚠️ Auto-setup skipped:', error.message);
  }
};

// ============================================
// TEST CONNECTION (export for server.js)
// ============================================
export const testConnection = async () => {
  console.log('\n🔧 Testing database connection...');
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully!');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// ============================================
// AUTO-RUN SETUP ON IMPORT
// ============================================
// Run setup when this file is imported (in production)
if (typeof process !== 'undefined') {
  // Small delay to let server start
  setTimeout(() => {
    console.log('🚀 Running auto-database setup...');
    setupDatabase().catch(() => {
      console.log('⚠️ Auto-setup completed');
    });
  }, 1000);
}

// Export pool
export { pool };
