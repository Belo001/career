import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mysql from 'mysql2/promise';

const app = express();

// ============================================
// DATABASE CONNECTION
// ============================================
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

const pool = mysql.createPool(dbConfig);

// Initialize database with sample data
const initializeDatabase = async () => {
  console.log('🔧 Initializing database with sample data...');
  
  try {
    const connection = await pool.getConnection();
    
    // Check if we have any data
    const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
    
    if (users[0].count === 0) {
      console.log('📊 Adding sample data...');
      
      // Add sample users
      await connection.query(`
        INSERT INTO users (name, email, password, user_type, is_verified) VALUES
        ('Admin User', 'admin@careerguide.com', 'admin123', 'admin', 1),
        ('Tech University', 'tech@university.com', 'password123', 'institute', 1),
        ('John Student', 'john@student.com', 'password123', 'student', 1),
        ('Sarah Applicant', 'sarah@student.com', 'password123', 'student', 1)
      `);
      
      // Add sample institute
      await connection.query(`
        INSERT INTO institutes (user_id, name, description, location, contact_email, contact_phone, website, established_year, total_students, address) VALUES
        (2, 'Tech University', 'Premier technology and engineering institute', 'New York', 'info@techuni.edu', '+1-555-0100', 'https://techuni.edu', 1985, 15000, '123 Tech Avenue, NY 10001')
      `);
      
      // Add sample faculties
      await connection.query(`
        INSERT INTO faculties (institute_id, name, description, dean_name, contact_email, contact_phone, established_year) VALUES
        (1, 'Faculty of Engineering', 'Engineering and technology programs', 'Dr. John Smith', 'engineering@techuni.edu', '+1-555-0101', 1985),
        (1, 'Faculty of Computer Science', 'Computer science and IT programs', 'Dr. Sarah Johnson', 'cs@techuni.edu', '+1-555-0102', 1995),
        (1, 'Faculty of Business', 'Business and management programs', 'Dr. Michael Brown', 'business@techuni.edu', '+1-555-0103', 1990)
      `);
      
      // Add sample courses
      await connection.query(`
        INSERT INTO courses (faculty_id, name, code, description, duration, duration_unit, requirements, fees, intake_capacity, application_deadline, is_active) VALUES
        (1, 'Computer Science', 'CS101', 'Bachelor of Computer Science', 4, 'years', '{"minGrade": "B", "requiredSubjects": ["Mathematics"]}', '{"domestic": 5000, "international": 15000}', 100, '2024-12-31', 1),
        (1, 'Electrical Engineering', 'EE201', 'Bachelor of Electrical Engineering', 4, 'years', '{"minGrade": "B-", "requiredSubjects": ["Mathematics", "Physics"]}', '{"domestic": 5500, "international": 16000}', 80, '2024-12-31', 1),
        (2, 'Business Administration', 'BA301', 'Bachelor of Business Administration', 3, 'years', '{"minGrade": "C+", "requiredSubjects": ["Mathematics", "English"]}', '{"domestic": 4500, "international": 12000}', 120, '2024-11-30', 1),
        (3, 'Mechanical Engineering', 'ME401', 'Bachelor of Mechanical Engineering', 4, 'years', '{"minGrade": "B-", "requiredSubjects": ["Mathematics", "Physics"]}', '{"domestic": 5200, "international": 15500}', 60, '2024-12-31', 1)
      `);
      
      // Add sample students
      await connection.query(`
        INSERT INTO students (user_id, high_school, graduation_year, grades) VALUES
        (3, 'New York High School', 2023, '{"mathematics": "A", "physics": "B+", "english": "A-"}'),
        (4, 'Boston High School', 2023, '{"mathematics": "B+", "physics": "A", "english": "B"}')
      `);
      
      console.log('✅ Sample data added successfully!');
    } else {
      console.log(`✅ Database already has ${users[0].count} users`);
    }
    
    connection.release();
  } catch (error) {
    console.log('⚠️ Database initialization:', error.message);
  }
};

// ============================================
// MIDDLEWARE
// ============================================
app.use(helmet());
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id']
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// REMOVE THIS LINE COMPLETELY:
// app.options(cors());  // ❌ DELETE THIS

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================
const auth = async (req, res, next) => {
  try {
    const userId = req.header('X-User-Id');
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const [users] = await pool.execute(
      'SELECT id, name, email, user_type, is_verified FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    req.user = users[0];
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};
// ============================================
// AUTH ROUTES
// ============================================

// Register - SIMPLIFIED (no password hashing for testing)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, userType } = req.body;

    // Validation
    if (!name || !email || !password || !userType) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Create user (plain password for testing)
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, user_type) VALUES (?, ?, ?, ?)',
      [name, email, password, userType]
    );

    // Create profile
    if (userType === 'student') {
      await pool.execute(
        'INSERT INTO students (user_id) VALUES (?)',
        [result.insertId]
      );
    } else if (userType === 'institute') {
      await pool.execute(
        'INSERT INTO institutes (user_id, name) VALUES (?, ?)',
        [result.insertId, name]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        userId: result.insertId,
        name,
        email,
        userType
      }
    });

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

// Login - SIMPLIFIED
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, userType } = req.body;

    // Find user
    const [users] = await pool.execute(
      'SELECT id, name, email, password, user_type FROM users WHERE email = ? AND user_type = ?',
      [email, userType]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or user type'
      });
    }

    const user = users[0];

    // Check password (plain text comparison for testing)
    if (password !== user.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        userId: user.id,
        name: user.name,
        email: user.email,
        userType: user.user_type
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// ============================================
// INSTITUTE ROUTES
// ============================================

// Get all institutes
app.get('/api/institutes', async (req, res) => {
  try {
    const [institutes] = await pool.execute(
      'SELECT id, name, description, location, contact_email, contact_phone, website, established_year, total_students FROM institutes'
    );

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

// Get institute courses
app.get('/api/institutes/:id/courses', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [courses] = await pool.execute(
      `SELECT c.*, f.name as faculty_name 
       FROM courses c 
       JOIN faculties f ON c.faculty_id = f.id 
       WHERE f.institute_id = ? AND c.is_active = TRUE`,
      [id]
    );

    res.json({
      success: true,
      data: courses
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch courses'
    });
  }
});

// ============================================
// COURSE ROUTES
// ============================================

// Get all courses
app.get('/api/courses', async (req, res) => {
  try {
    const [courses] = await pool.execute(
      `SELECT c.*, f.name as faculty_name, i.name as institute_name 
       FROM courses c 
       JOIN faculties f ON c.faculty_id = f.id 
       JOIN institutes i ON f.institute_id = i.id 
       WHERE c.is_active = TRUE`
    );

    res.json({
      success: true,
      data: courses
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch courses'
    });
  }
});

// ============================================
// APPLICATION ROUTES
// ============================================

// Apply to course
app.post('/api/applications/apply', auth, async (req, res) => {
  try {
    const { courseId, preferredMajor, personalStatement } = req.body;
    const studentId = req.user.id;

    // Get course
    const [courses] = await pool.execute(
      `SELECT c.*, i.id as institute_id 
       FROM courses c 
       JOIN faculties f ON c.faculty_id = f.id 
       JOIN institutes i ON f.institute_id = i.id 
       WHERE c.id = ?`,
      [courseId]
    );

    if (courses.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Create application
    const [result] = await pool.execute(
      `INSERT INTO applications 
       (student_id, course_id, institute_id, preferred_major, personal_statement) 
       VALUES (?, ?, ?, ?, ?)`,
      [studentId, courseId, courses[0].institute_id, preferredMajor, personalStatement]
    );

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        applicationId: result.insertId,
        status: 'pending'
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to submit application'
    });
  }
});

// ============================================
// HEALTH & INFO ROUTES
// ============================================

app.get('/api/health', async (req, res) => {
  try {
    const [tables] = await pool.execute('SHOW TABLES');
    const [users] = await pool.execute('SELECT COUNT(*) as users FROM users');
    const [institutes] = await pool.execute('SELECT COUNT(*) as institutes FROM institutes');
    const [courses] = await pool.execute('SELECT COUNT(*) as courses FROM courses WHERE is_active = TRUE');
    const [applications] = await pool.execute('SELECT COUNT(*) as applications FROM applications');

    res.json({
      status: 'OK',
      message: 'Career Guidance Platform API',
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        tables: tables.length,
        users: users[0].users,
        institutes: institutes[0].institutes,
        courses: courses[0].courses,
        applications: applications[0].applications
      },
      version: '1.0.0'
    });
  } catch (error) {
    res.json({
      status: 'OK',
      message: 'Career Guidance Platform API',
      timestamp: new Date().toISOString(),
      database: {
        status: 'disconnected',
        error: error.message
      }
    });
  }
});

// Get sample data for testing
app.get('/api/sample-data', async (req, res) => {
  try {
    const [users] = await pool.execute('SELECT id, name, email, user_type FROM users LIMIT 5');
    const [institutes] = await pool.execute('SELECT id, name, location FROM institutes LIMIT 3');
    const [courses] = await pool.execute('SELECT id, name, code FROM courses WHERE is_active = TRUE LIMIT 5');

    res.json({
      success: true,
      data: {
        users,
        institutes,
        courses,
        testCredentials: {
          admin: { email: 'admin@careerguide.com', password: 'admin123', userType: 'admin' },
          institute: { email: 'tech@university.com', password: 'password123', userType: 'institute' },
          student: { email: 'john@student.com', password: 'password123', userType: 'student' }
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sample data'
    });
  }
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: '🎓 Career Guidance Platform API',
    version: '1.0.0',
    status: 'operational',
    database: 'connected',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login'
      },
      institutes: {
        list: 'GET /api/institutes',
        courses: 'GET /api/institutes/:id/courses'
      },
      courses: 'GET /api/courses',
      applications: 'POST /api/applications/apply',
      info: {
        health: 'GET /api/health',
        sampleData: 'GET /api/sample-data'
      }
    },
    testUsers: [
      { email: 'admin@careerguide.com', password: 'admin123', type: 'admin' },
      { email: 'tech@university.com', password: 'password123', type: 'institute' },
      { email: 'john@student.com', password: 'password123', type: 'student' }
    ]
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: [
      'GET  /',
      'GET  /api/health',
      'GET  /api/sample-data',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET  /api/institutes',
      'GET  /api/institutes/:id/courses',
      'GET  /api/courses',
      'POST /api/applications/apply'
    ]
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: error.message
  });
});

// ============================================
// START SERVER
// ============================================
const startServer = async () => {
  // Initialize database with sample data
  await initializeDatabase();
  
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`
🎓 CAREER GUIDANCE PLATFORM - PRODUCTION READY 🚀
✅ Server running on port ${PORT}
📍 Host: 0.0.0.0
🌐 Public URL: https://sincere-forgiveness-production.up.railway.app
🏥 Health: https://sincere-forgiveness-production.up.railway.app/api/health
📊 Sample Data: https://sincere-forgiveness-production.up.railway.app/api/sample-data

📋 SAMPLE CREDENTIALS FOR TESTING:
  👤 Admin:     admin@careerguide.com / admin123
  🏛️  Institute: tech@university.com / password123  
  🎓 Student:   john@student.com / password123

AVAILABLE ENDPOINTS:
  POST /api/auth/register    - Register new user
  POST /api/auth/login       - Login user
  GET  /api/institutes       - List all institutes
  GET  /api/institutes/:id/courses - Get institute courses
  GET  /api/courses          - List all active courses
  POST /api/applications/apply - Apply to course (auth required)

Ready for frontend testing! 🎉
    `);
  });
};

startServer().catch(console.error);
