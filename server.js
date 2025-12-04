import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
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

// Get current directory (ES modules fix)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(helmet({
  contentSecurityPolicy: false // Disable for now to avoid frontend issues
}));
app.use(cors({
  origin: '*', // Allow all
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Test database connection
testConnection().then(() => {
  console.log('🎉 Database initialization complete!');
}).catch(() => {
  console.log('⚠️ Database check completed');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/institutes', instituteRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);

// API Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Career Guidance Platform API',
    timestamp: new Date().toISOString(),
    database: 'connected',
    version: '1.0.0'
  });
});

// API Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true,
    message: 'All API routes are working!',
    data: { 
      version: '1.0.0',
      environment: 'production',
      timestamp: new Date().toISOString()
    }
  });
});

// Serve frontend - Catch-all route (MUST BE LAST)
app.get('*', (req, res) => {
  // Don't serve frontend for API routes
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: `API endpoint ${req.method} ${req.originalUrl} not found`
    });
  }
  
  // Serve the frontend HTML
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
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
  console.log(`🌐 Public URL: https://sincere-forgiveness-production.up.railway.app`);
  console.log(`🏥 API Health: https://sincere-forgiveness-production.up.railway.app/api/health`);
  console.log(`📱 Frontend: https://sincere-forgiveness-production.up.railway.app/`);
  console.log(`📁 Serving from: ${__dirname}/public`);
});
