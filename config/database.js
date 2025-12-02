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
// AUTO-SETUP FUNCTION - Creates tables if missing
// ============================================
const setupDatabase = async () => {
  console.log('\n🔧 CHECKING DATABASE TABLES...');
  
  try {
    const connection = await pool.getConnection();
    
    // Check if tables exist
    const [tables] = await connection.query('SHOW TABLES');
    
    if (tables.length === 0) {
      console.log('📦 No tables found. Creating tables...');
      
      // Execute each SQL statement separately
      const sqlStatements = [
        // Users table
        `CREATE TABLE IF NOT EXISTS users (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          user_type ENUM('student', 'institute', 'admin') NOT NULL,
          is_verified BOOLEAN DEFAULT TRUE,
          verification_token VARCHAR(255),
          reset_token VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_email (email),
          INDEX idx_user_type (user_type)
        )`,
        
        // Institutes table
        `CREATE TABLE IF NOT EXISTS institutes (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          location VARCHAR(255),
          contact_email VARCHAR(255),
          contact_phone VARCHAR(50),
          website VARCHAR(255),
          established_year INT,
          accreditation VARCHAR(255),
          total_students INT DEFAULT 0,
          logo_url VARCHAR(500),
          address TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE KEY unique_user_institute (user_id),
          INDEX idx_location (location)
        )`,
        
        // Students table
        `CREATE TABLE IF NOT EXISTS students (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT,
          date_of_birth DATE,
          phone VARCHAR(20),
          address TEXT,
          high_school VARCHAR(255),
          graduation_year INT,
          grades JSON,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE KEY unique_user_student (user_id)
        )`,
        
        // Faculties table
        `CREATE TABLE IF NOT EXISTS faculties (
          id INT PRIMARY KEY AUTO_INCREMENT,
          institute_id INT,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          dean_name VARCHAR(255),
          contact_email VARCHAR(255),
          contact_phone VARCHAR(50),
          established_year INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE,
          INDEX idx_institute_id (institute_id),
          INDEX idx_name (name)
        )`,
        
        // Courses table
        `CREATE TABLE IF NOT EXISTS courses (
          id INT PRIMARY KEY AUTO_INCREMENT,
          faculty_id INT,
          name VARCHAR(255) NOT NULL,
          code VARCHAR(50) UNIQUE NOT NULL,
          description TEXT,
          duration INT,
          duration_unit ENUM('years', 'semesters', 'months') DEFAULT 'years',
          requirements JSON,
          fees JSON,
          intake_capacity INT,
          application_deadline DATE,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE CASCADE,
          INDEX idx_faculty_id (faculty_id),
          INDEX idx_code (code),
          INDEX idx_is_active (is_active),
          INDEX idx_application_deadline (application_deadline)
        )`,
        
        // Admission periods table
        `CREATE TABLE IF NOT EXISTS admission_periods (
          id INT PRIMARY KEY AUTO_INCREMENT,
          institute_id INT,
          name VARCHAR(255) NOT NULL,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          status ENUM('active', 'closed', 'upcoming') DEFAULT 'upcoming',
          total_applications INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE,
          INDEX idx_institute_status (institute_id, status)
        )`,
        
        // Applications table
        `CREATE TABLE IF NOT EXISTS applications (
          id INT PRIMARY KEY AUTO_INCREMENT,
          student_id INT,
          course_id INT,
          institute_id INT,
          admission_period_id INT,
          preferred_major VARCHAR(255),
          personal_statement TEXT,
          status ENUM('pending', 'under_review', 'accepted', 'rejected', 'withdrawn') DEFAULT 'pending',
          application_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          reviewed_at TIMESTAMP NULL,
          review_notes TEXT,
          documents JSON,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
          FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
          FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE,
          FOREIGN KEY (admission_period_id) REFERENCES admission_periods(id) ON DELETE SET NULL,
          UNIQUE KEY unique_student_course_period (student_id, course_id, admission_period_id),
          INDEX idx_status (status),
          INDEX idx_student (student_id),
          INDEX idx_course (course_id)
        )`,
        
        // Student institute applications table
        `CREATE TABLE IF NOT EXISTS student_institute_applications (
          id INT PRIMARY KEY AUTO_INCREMENT,
          student_id INT NOT NULL,
          institute_id INT NOT NULL,
          academic_year INT NOT NULL,
          application_count INT DEFAULT 0,
          courses_applied JSON,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
          FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE,
          UNIQUE KEY unique_student_institute_year (student_id, institute_id, academic_year)
        )`
      ];
      
      // Execute each SQL statement one by one
      for (let i = 0; i < sqlStatements.length; i++) {
        try {
          await connection.query(sqlStatements[i]);
          console.log(`✅ Table ${i + 1} created successfully`);
        } catch (error) {
          console.log(`⚠️ Table ${i + 1} may already exist: ${error.message}`);
        }
      }
      
      console.log('✅ All tables created!');
      
      // Insert sample data
      console.log('📊 Inserting sample data...');
      
      const insertStatements = [
        // Admin user (password: admin123)
        `INSERT IGNORE INTO users (name, email, password, user_type, is_verified) 
         VALUES ('System Admin', 'admin@careerguide.com', '$2a$10$0987654321', 'admin', TRUE)`,
        
        // Institute user (password: institute123)
        `INSERT IGNORE INTO users (name, email, password, user_type, is_verified) 
         VALUES ('University Admin', 'university@edu.com', '$2a$10$institute123', 'institute', TRUE)`,
        
        // Institute
        `INSERT IGNORE INTO institutes (user_id, name, description, location, contact_email, contact_phone, website, established_year, total_students, address) 
         VALUES (2, 'University of Technology', 'Premier institution for engineering and technology education', 'New York', 'info@unitech.edu', '+1-555-0123', 'https://unitech.edu', 1985, 15000, '123 Tech Avenue, New York, NY 10001')`,
        
        // Faculties
        `INSERT IGNORE INTO faculties (institute_id, name, description, dean_name, contact_email, contact_phone, established_year) 
         VALUES 
         (1, 'Faculty of Engineering', 'Leading engineering faculty with state-of-the-art facilities', 'Dr. John Smith', 'engineering@unitech.edu', '+1-555-0124', 1985),
         (1, 'Faculty of Computer Science', 'Innovative computer science programs and research', 'Dr. Sarah Johnson', 'cs@unitech.edu', '+1-555-0125', 1995),
         (1, 'Faculty of Business Administration', 'Business and management education excellence', 'Dr. Michael Brown', 'business@unitech.edu', '+1-555-0126', 1990)`,
        
        // Courses
        `INSERT IGNORE INTO courses (faculty_id, name, code, description, duration, duration_unit, requirements, fees, intake_capacity, application_deadline) 
         VALUES 
         (1, 'Computer Science Bachelor', 'CS101', 'Comprehensive computer science program', 4, 'years', '{"minGrade": "B", "requiredSubjects": ["Mathematics", "Physics"], "minGPA": 3.0, "entranceExam": true}', '{"domestic": 5000, "international": 15000}', 100, '2024-08-31'),
         (1, 'Electrical Engineering', 'EE201', 'Electrical engineering program', 4, 'years', '{"minGrade": "B-", "requiredSubjects": ["Mathematics", "Physics", "Chemistry"], "minGPA": 2.8, "entranceExam": true}', '{"domestic": 5500, "international": 16000}', 80, '2024-08-31'),
         (2, 'Business Administration', 'BA301', 'Business management program', 3, 'years', '{"minGrade": "C+", "requiredSubjects": ["Mathematics", "English"], "minGPA": 2.5, "entranceExam": false}', '{"domestic": 4500, "international": 12000}', 120, '2024-07-31')`
      ];
      
      for (let i = 0; i < insertStatements.length; i++) {
        try {
          await connection.query(insertStatements[i]);
          console.log(`✅ Data ${i + 1} inserted`);
        } catch (error) {
          console.log(`⚠️ Data ${i + 1} may already exist: ${error.message}`);
        }
      }
      
      console.log('🎉 Database setup completed successfully!');
      console.log('👤 Admin: admin@careerguide.com / admin123');
      console.log('🏛️  Institute: university@edu.com / institute123');
      
    } else {
      console.log(`✅ Found ${tables.length} tables (database already setup)`);
    }
    
    connection.release();
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
  }
};

// ============================================
// TEST CONNECTION FUNCTION
// ============================================
export const testConnection = async () => {
  console.log('\n🔧 Testing database connection...');
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully!');
    
    // Auto-setup tables if needed
    await setupDatabase();
    
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('⚠️ Starting app without database...');
    return false;
  }
};

// ============================================
// RUN SETUP ONCE on startup
// ============================================
let setupRun = false;
export const initializeDatabase = async () => {
  if (!setupRun) {
    setupRun = true;
    await testConnection();
  }
};

// Auto-run in production
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
  console.log('🚀 Production mode - initializing database...');
  initializeDatabase().catch(() => {
    console.log('⚠️ Database initialization completed');
  });
}

// Export pool
export { pool };
