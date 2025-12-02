import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from 'dotenv';
config();

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
  origin: [
    'http://localhost:3000',
    'http://localhost:5174', 
    'http://localhost:5173', 
    'http://127.0.0.1:5174',  
    'http://127.0.0.1:5173'
  ],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Test database connection on startup
testConnection();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/institutes', instituteRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Career Guidance API is running',
    timestamp: new Date().toISOString()
  });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true,
    message: 'All routes are working!',
    data: { 
      version: '1.0.0',
      routes: ['auth', 'institutes', 'students', 'applications', 'admin']
    }
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Career Guidance Platform API',
    status: 'operational',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      institutes: '/api/institutes',
      students: '/api/students',
      applications: '/api/applications',
      admin: '/api/admin'
    }
  });
});

// 404 handler - MUST be after all routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry found'
    });
  }
  
  if (error.code === 'ECONNREFUSED' || error.code === 'PROTOCOL_CONNECTION_LOST') {
    return res.status(503).json({
      success: false,
      message: 'Database connection error'
    });
  }

  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 Career Guidance Platform API`);
  console.log(`📍 Host: 0.0.0.0 (Railway compatible)`);
  console.log(`🔗 Environment: ${process.env.NODE_ENV || 'development'}`);
});
