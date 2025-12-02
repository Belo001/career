import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { testConnection } from './config/database.js';

// Import all routes
import authRoutes from './routes/auth.js';
import instituteRoutes from './routes/institutes.js';
import studentRoutes from './routes/students.js';
import applicationRoutes from './routes/applications.js';
import adminRoutes from './routes/admin.js';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: '*', // Allow all for now
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// In server.js, after middleware:
console.log('🚀 Server starting...');

// Import and trigger database setup
import('./config/database.js').then(() => {
  console.log('✅ Database module loaded');
}).catch(console.error);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/institutes', instituteRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Career Guidance API is running',
    timestamp: new Date().toISOString(),
    database: 'connected',
    version: '1.0.0'
  });
});

// Test route (FIXED - was missing)
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true,
    message: 'All routes are working!',
    data: { 
      version: '1.0.0',
      environment: 'production',
      timestamp: new Date().toISOString(),
      routes: [
        { path: '/api/health', method: 'GET', description: 'Health check' },
        { path: '/api/auth', methods: ['POST', 'GET'], description: 'Authentication' },
        { path: '/api/institutes', methods: ['GET', 'POST', 'PUT'], description: 'Institute management' },
        { path: '/api/students', methods: ['GET', 'PUT'], description: 'Student profiles' },
        { path: '/api/applications', methods: ['GET', 'POST', 'PUT', 'DELETE'], description: 'Applications' },
        { path: '/api/admin', methods: ['GET', 'PUT'], description: 'Admin functions' }
      ]
    }
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Career Guidance Platform API',
    version: '1.0.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/api/health',
      '/api/auth',
      '/api/institutes',
      '/api/students',
      '/api/applications',
      '/api/admin',
      '/api/test'  // Added this
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
      'GET  /api/test',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET  /api/auth/me',
      'GET  /api/institutes',
      'GET  /api/institutes/:id',
      'GET  /api/students/profile',
      'POST /api/applications/apply',
      'GET  /api/admin/stats'
    ]
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? undefined : error.message
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 Host: 0.0.0.0`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
});
