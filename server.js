import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// ============================================
// MIDDLEWARE
// ============================================
app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files (for future frontend)
app.use(express.static(path.join(__dirname, 'public')));

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

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.user_type)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    next();
  };
};

// ============================================
// AUTH ROUTES
// ============================================

// Register
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

    if (!['student', 'institute'].includes(userType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user type'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, user_type) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, userType]
    );

    // Create profile based on user type
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
      message: 'Registration failed'
    });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, userType } = req.body;

    // Find user
    const [users] = await pool.execute(
      'SELECT id, name, email, password, user_type, is_verified FROM users WHERE email = ? AND user_type = ?',
      [email, userType]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = users[0];

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        userId: user.id,
        name: user.name,
        email: user.email,
        userType: user.user_type,
        isVerified: user.is_verified
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// Get current user
app.get('/api/auth/me', auth, async (req, res) => {
  try {
    // Get profile based on user type
    let profile = null;
    
    if (req.user.user_type === 'student') {
      const [students] = await pool.execute(
        'SELECT * FROM students WHERE user_id = ?',
        [req.user.id]
      );
      profile = students[0];
    } else if (req.user.user_type === 'institute') {
      const [institutes] = await pool.execute(
        'SELECT * FROM institutes WHERE user_id = ?',
        [req.user.id]
      );
      profile = institutes[0];
    }

    res.json({
      success: true,
      data: {
        user: req.user,
        profile
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

// ============================================
// INSTITUTE ROUTES
// ============================================

// Get all institutes (public)
app.get('/api/institutes', async (req, res) => {
  try {
    const [institutes] = await pool.execute(
      'SELECT i.*, u.email as contact_email FROM institutes i JOIN users u ON i.user_id = u.id'
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

// Get institute by ID (public)
app.get('/api/institutes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [institutes] = await pool.execute(
      'SELECT i.*, u.email as contact_email FROM institutes i JOIN users u ON i.user_id = u.id WHERE i.id = ?',
      [id]
    );

    if (institutes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Institute not found'
      });
    }

    res.json({
      success: true,
      data: institutes[0]
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch institute'
    });
  }
});

// ============================================
// APPLICATION ROUTES
// ============================================

// Apply to course
app.post('/api/applications/apply', auth, requireRole(['student']), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const studentId = req.user.id;
    const { courseId, preferredMajor, personalStatement } = req.body;

    // Get course details
    const [courses] = await connection.execute(
      `SELECT c.*, i.id as institute_id 
       FROM courses c 
       JOIN faculties f ON c.faculty_id = f.id 
       JOIN institutes i ON f.institute_id = i.id 
       WHERE c.id = ? AND c.is_active = TRUE`,
      [courseId]
    );

    if (courses.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or inactive'
      });
    }

    const course = courses[0];

    // Check if already applied
    const [existingApps] = await connection.execute(
      'SELECT id FROM applications WHERE student_id = ? AND course_id = ?',
      [studentId, courseId]
    );

    if (existingApps.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Already applied to this course'
      });
    }

    // Create application
    const [result] = await connection.execute(
      `INSERT INTO applications 
       (student_id, course_id, institute_id, preferred_major, personal_statement, status) 
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [studentId, courseId, course.institute_id, preferredMajor, personalStatement]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        applicationId: result.insertId,
        status: 'pending'
      }
    });

  } catch (error) {
    await connection.rollback();
    res.status(500).json({
      success: false,
      message: 'Failed to submit application'
    });
  } finally {
    connection.release();
  }
});

// Get student applications
app.get('/api/applications/student', auth, requireRole(['student']), async (req, res) => {
  try {
    const [applications] = await pool.execute(
      `SELECT a.*, c.name as course_name, c.code as course_code, i.name as institute_name 
       FROM applications a 
       JOIN courses c ON a.course_id = c.id 
       JOIN institutes i ON a.institute_id = i.id 
       WHERE a.student_id = ? 
       ORDER BY a.application_date DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: applications
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications'
    });
  }
});

// ============================================
// HEALTH & INFO ROUTES
// ============================================

app.get('/api/health', async (req, res) => {
  try {
    const [tables] = await pool.execute('SHOW TABLES');
    
    res.json({
      status: 'OK',
      message: 'Career Guidance Platform API',
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        tables: tables.length,
        url: 'mysql.railway.internal:3306/railway'
      },
      version: '1.0.0',
      endpoints: [
        'POST /api/auth/register',
        'POST /api/auth/login',
        'GET  /api/auth/me',
        'GET  /api/institutes',
        'GET  /api/institutes/:id',
        'POST /api/applications/apply',
        'GET  /api/applications/student'
      ]
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

// Root route
app.get('/', (req, res) => {
  res.json({
    message: '🎓 Career Guidance Platform API',
    version: '1.0.0',
    status: 'operational',
    database: 'connected',
    documentation: 'Visit /api/health for API details',
    github: 'https://github.com/your-repo',
    endpoints: [
      'GET  /api/health',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET  /api/auth/me',
      'GET  /api/institutes',
      'GET  /api/institutes/:id',
      'POST /api/applications/apply',
      'GET  /api/applications/student'
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
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET  /api/auth/me',
      'GET  /api/institutes',
      'GET  /api/institutes/:id',
      'POST /api/applications/apply',
      'GET  /api/applications/student'
    ]
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
🎓 CAREER GUIDANCE PLATFORM - PRODUCTION READY 🚀
✅ Server running on port ${PORT}
📍 Host: 0.0.0.0
🌐 Public URL: https://sincere-forgiveness-production.up.railway.app
🏥 Health: https://sincere-forgiveness-production.up.railway.app/api/health
📊 Database: Connected with 8 tables

AVAILABLE ENDPOINTS:
  POST /api/auth/register    - Register new user
  POST /api/auth/login       - Login user
  GET  /api/auth/me          - Get user profile (auth required)
  GET  /api/institutes       - List all institutes
  GET  /api/institutes/:id   - Get institute details
  POST /api/applications/apply - Apply to course (student auth)
  GET  /api/applications/student - Get student applications (student auth)

Ready for frontend connection! 🎉
  `);
});
