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

testConnection().then(() => {
  console.log('🎉 Database initialization complete!');
});

// Test database connection (but don't crash if it fails)
testConnection().catch(() => {
  console.log('⚠️ Database check completed (may have failed)');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/institutes', instituteRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);

// Health check (works even without database)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Career Guidance API is running',
    timestamp: new Date().toISOString(),
    database: 'checking...'
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Career Guidance Platform API',
    version: '1.0.0',
    status: 'operational',
    endpoints: [
      '/api/health',
      '/api/auth',
      '/api/institutes',
      '/api/students',
      '/api/applications',
      '/api/admin'
    ]
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
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

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 Host: 0.0.0.0`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
});
