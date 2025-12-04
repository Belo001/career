import express from 'express';
import { body, param, query } from 'express-validator';
import adminController from '../controllers/adminController.js';
import instituteController from '../controllers/instituteController.js';
import { auth, requireRole } from '../middleware/auth.js';
import { pool } from '../config/database.js';

const router = express.Router();

// ===== PROTECTED ROUTES (Require Admin Login) =====
// All routes below this require admin authentication
router.use(auth, requireRole(['admin']));

// System statistics
router.get('/stats', adminController.getSystemStats);

// User management
router.get('/users', adminController.getUsers);
router.put('/users/:userId/verification', adminController.manageUserVerification);

// Application management
router.get('/applications', adminController.getAllApplications);

// Institute management
router.post('/institutes', instituteController.createInstitute);
router.delete('/institutes/:id', instituteController.deleteInstitute);

// ===== ADMIN DATABASE ENDPOINT (Protected) =====
// Get ALL database content (Admin only - requires login)
router.get('/database', async (req, res) => {
  try {
    console.log('📊 Admin requesting complete database content...');
    
    // Get ALL data from ALL tables
    const [users] = await pool.query('SELECT * FROM users ORDER BY id');
    const [institutes] = await pool.query('SELECT * FROM institutes ORDER BY id');
    const [students] = await pool.query('SELECT * FROM students ORDER BY id');
    const [faculties] = await pool.query('SELECT * FROM faculties ORDER BY id');
    const [courses] = await pool.query('SELECT * FROM courses ORDER BY id');
    const [admissionPeriods] = await pool.query('SELECT * FROM admission_periods ORDER BY id');
    const [applications] = await pool.query('SELECT * FROM applications ORDER BY id');
    const [studentInstitute] = await pool.query('SELECT * FROM student_institute_applications ORDER BY id');

    // Get database info
    const [dbInfo] = await pool.query('SELECT DATABASE() as db_name, NOW() as current_time, VERSION() as mysql_version');
    
    // Get table info
    const [tables] = await pool.query(`
      SELECT TABLE_NAME, TABLE_ROWS, CREATE_TIME, UPDATE_TIME 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
      ORDER BY TABLE_NAME
    `);

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      requested_by: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        type: req.user.user_type
      },
      database: {
        name: dbInfo[0].db_name,
        mysql_version: dbInfo[0].mysql_version,
        current_time: dbInfo[0].current_time
      },
      tables: tables,
      counts: {
        users: users.length,
        institutes: institutes.length,
        students: students.length,
        faculties: faculties.length,
        courses: courses.length,
        admission_periods: admissionPeriods.length,
        applications: applications.length,
        student_institute_applications: studentInstitute.length
      },
      data: {
        users: users,
        institutes: institutes,
        students: students,
        faculties: faculties,
        courses: courses,
        admission_periods: admissionPeriods,
        applications: applications,
        student_institute_applications: studentInstitute
      }
    });

  } catch (error) {
    console.error('❌ Database fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch database content',
      error: error.message
    });
  }
});

// ===== PUBLIC ROUTES (No Login Required) =====
// These routes are above the auth middleware, so they don't require login

// Public database endpoint - NO LOGIN REQUIRED
router.get('/database/public', async (req, res) => {
  try {
    console.log('📊 Public request for database content...');
    
    // Get ALL data from ALL tables
    const [users] = await pool.query('SELECT * FROM users ORDER BY id');
    const [institutes] = await pool.query('SELECT * FROM institutes ORDER BY id');
    const [students] = await pool.query('SELECT * FROM students ORDER BY id');
    const [faculties] = await pool.query('SELECT * FROM faculties ORDER BY id');
    const [courses] = await pool.query('SELECT * FROM courses ORDER BY id');
    const [admissionPeriods] = await pool.query('SELECT * FROM admission_periods ORDER BY id');
    const [applications] = await pool.query('SELECT * FROM applications ORDER BY id');
    const [studentInstitute] = await pool.query('SELECT * FROM student_institute_applications ORDER BY id');

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Public database access - No login required',
      note: 'This endpoint displays all database content publicly. For protected access, use /api/admin/database',
      counts: {
        users: users.length,
        institutes: institutes.length,
        students: students.length,
        faculties: faculties.length,
        courses: courses.length,
        admission_periods: admissionPeriods.length,
        applications: applications.length,
        student_institute_applications: studentInstitute.length
      },
      data: {
        users: users,
        institutes: institutes,
        students: students,
        faculties: faculties,
        courses: courses,
        admission_periods: admissionPeriods,
        applications: applications,
        student_institute_applications: studentInstitute
      }
    });

  } catch (error) {
    console.error('❌ Public database fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch database content',
      error: error.message
    });
  }
});

// Public statistics (read-only, no login)
router.get('/stats/public', async (req, res) => {
  try {
    const [counts] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM institutes) as total_institutes,
        (SELECT COUNT(*) FROM students) as total_students,
        (SELECT COUNT(*) FROM courses) as total_courses,
        (SELECT COUNT(*) FROM applications) as total_applications
    `);

    const [recentUsers] = await pool.query(`
      SELECT name, email, user_type, created_at 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      counts: counts[0],
      recent_registrations: recentUsers
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

export default router;
