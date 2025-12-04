import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { testConnection, pool } from './config/database.js';

// Import all routes
import authRoutes from './routes/auth.js';
import instituteRoutes from './routes/institutes.js';
import studentRoutes from './routes/students.js';
import applicationRoutes from './routes/applications.js';
import adminRoutes from './routes/admin.js';

const app = express();

// Get Railway URL or use localhost
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const RAILWAY_PUBLIC_DOMAIN = process.env.RAILWAY_PUBLIC_DOMAIN;
const RAILWAY_STATIC_URL = process.env.RAILWAY_STATIC_URL;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Configure CORS for Railway - SIMPLIFIED VERSION
const allowedOrigins = [
  // Local development
  'http://localhost:3000',
  'http://localhost:5174', 
  'http://localhost:5173', 
  'http://127.0.0.1:5174',  
  'http://127.0.0.1:5173',
  
  // Netlify domains
  'https://heroic-kangaroo-1e051f.netlify.app',
  'http://heroic-kangaroo-1e051f.netlify.app',
  'https://*.netlify.app',  // Allow ALL Netlify sites
  'http://*.netlify.app',
  
  // Render domains
  'https://career-frontend-jpyc.onrender.com',
  'http://career-frontend-jpyc.onrender.com',
  'https://*.onrender.com',  // Allow ALL Render sites
  'http://*.onrender.com',
  
  // Your backend
  'https://career-production-e5fa.up.railway.app',
  'http://career-production-e5fa.up.railway.app',
];

// Add Railway domains if they exist
if (RAILWAY_PUBLIC_DOMAIN) {
  allowedOrigins.push(`https://${RAILWAY_PUBLIC_DOMAIN}`);
  allowedOrigins.push(`http://${RAILWAY_PUBLIC_DOMAIN}`);
}

if (RAILWAY_STATIC_URL) {
  allowedOrigins.push(RAILWAY_STATIC_URL);
}

if (FRONTEND_URL && !allowedOrigins.includes(FRONTEND_URL)) {
  allowedOrigins.push(FRONTEND_URL);
}

console.log('🌐 Allowed CORS origins:', allowedOrigins);

// Middleware
app.use(helmet());

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    // Check exact match
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // Check wildcard match (like *.netlify.app)
      const isWildcardMatch = allowedOrigins.some(allowedOrigin => {
        if (allowedOrigin.includes('*')) {
          const regex = new RegExp('^' + allowedOrigin.replace('*', '.*') + '$');
          return regex.test(origin);
        }
        return false;
      });
      
      if (isWildcardMatch) {
        callback(null, true);
      } else {
        console.warn('CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id', 'Accept']
};

app.use(cors(corsOptions));
//app.options('*', cors(corsOptions));
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Function to check if database needs setup
const checkAndSetupDatabase = async () => {
  try {
    const [tables] = await pool.query(`
      SELECT COUNT(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
    `);
    
    if (tables[0].table_count === 0) {
      console.log('📦 Database is empty, attempting to import...');
      await importDatabase();
    } else {
      console.log(`✅ Database already has ${tables[0].table_count} tables`);
      
      // Check if we have the essential tables
      const [essentialTables] = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
        AND table_name IN ('users', 'institutes', 'students', 'courses')
      `);
      
      if (essentialTables.length < 4) {
        console.log('⚠️ Some essential tables missing, re-importing...');
        await importDatabase();
      }
    }
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  }
};

// Function to import database from SQL file
const importDatabase = async () => {
  try {
    const sqlPath = path.join(__dirname, 'career_guidance.sql');
    
    if (!fs.existsSync(sqlPath)) {
      console.error('❌ career_guidance.sql file not found!');
      console.log('📁 Current directory:', __dirname);
      console.log('📁 Files in directory:', fs.readdirSync(__dirname));
      return;
    }
    
    console.log('✅ Found career_guidance.sql file');
    console.log('📦 Reading SQL file...');
    
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    console.log(`📊 SQL file size: ${Math.round(sqlContent.length / 1024)} KB`);
    
    // Split SQL into statements
    const statements = sqlContent
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
      .split(';')
      .filter(stmt => stmt.trim())
      .map(stmt => stmt.trim() + ';');
    
    console.log(`🔧 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement && statement.length > 10) {
        try {
          await pool.query(statement);
          successCount++;
          
          // Show progress every 20 statements
          if (i % 20 === 0) {
            console.log(`⏳ Progress: ${i + 1}/${statements.length} statements...`);
          }
        } catch (error) {
          errorCount++;
          // Ignore "table already exists" errors
          if (!error.message.includes('already exists')) {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
          }
        }
      }
    }
    
    console.log(`🎉 Database import completed:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📊 Total: ${statements.length}`);
    
    // Verify import
    const [tablesAfter] = await pool.query(`
      SELECT COUNT(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
    `);
    
    console.log(`📊 Tables after import: ${tablesAfter[0].table_count}`);
    
  } catch (error) {
    console.error('❌ Database import failed:', error.message);
  }
};

// Initialize database and import if needed
const initializeApp = async () => {
  try {
    console.log('🔧 Initializing application...');
    
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Database connection failed');
      return;
    }
    
    // Check and setup database
    await checkAndSetupDatabase();
    
    console.log('✅ Application initialization complete');
    
  } catch (error) {
    console.error('❌ Application initialization failed:', error.message);
  }
};

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/institutes', instituteRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);

// Health check route
app.get('/api/health', async (req, res) => {
  try {
    const [tables] = await pool.query(`
      SELECT COUNT(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
    `);
    
    res.status(200).json({
      status: 'OK',
      message: 'Career Guidance API is running',
      timestamp: new Date().toISOString(),
      environment: NODE_ENV,
      railway: !!RAILWAY_PUBLIC_DOMAIN,
      database: {
        connected: true,
        tables: tables[0].table_count,
        name: process.env.MYSQLDATABASE || 'railway'
      },
      version: '1.0.0'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Health check failed',
      error: error.message
    });
  }
});

// Database status endpoint
app.get('/api/db-status', async (req, res) => {
  try {
    const [tables] = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
      ORDER BY table_name
    `);
    
    // Get record counts
    const counts = {};
    for (const table of ['users', 'institutes', 'students', 'courses', 'applications']) {
      try {
        const [result] = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
        counts[table] = result[0].count;
      } catch (e) {
        counts[table] = 0;
      }
    }
    
    res.json({
      success: true,
      database: process.env.MYSQLDATABASE || 'railway',
      tables: tables.length,
      tableNames: tables.map(t => t.table_name),
      counts: counts,
      environment: NODE_ENV
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database status check failed',
      error: error.message
    });
  }
});

// Manual import endpoint (can be triggered if auto-import fails)
app.post('/api/admin/import-db', async (req, res) => {
  try {
    console.log('📦 Manual database import requested...');
    await importDatabase();
    
    res.json({
      success: true,
      message: 'Database import completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Import failed',
      error: error.message
    });
  }
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true,
    message: 'All routes are working!',
    data: { 
      version: '1.0.0',
      environment: NODE_ENV,
      railway_public_domain: RAILWAY_PUBLIC_DOMAIN || 'Not set',
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
    documentation: '/api/health',
    environment: NODE_ENV,
    database: 'MySQL on Railway'
  });
});

// Simple 404 handler
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
    message: error.message || 'Internal server error',
    ...(NODE_ENV === 'development' && { stack: error.stack })
  });
});

const PORT = process.env.PORT || 5000;

// Start server after initialization
const startServer = async () => {
  await initializeApp();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📚 Career Guidance Platform API`);
    console.log(`🔗 Environment: ${NODE_ENV}`);
    console.log(`🌐 Railway Public Domain: ${RAILWAY_PUBLIC_DOMAIN || 'Not set'}`);
    console.log(`🔗 Frontend URL: ${FRONTEND_URL}`);
    console.log(`📍 Host: 0.0.0.0 (Railway compatible)`);
    console.log('\n Available Routes:');
    console.log('   GET    /               - API Root');
    console.log('   GET    /api/health     - Health check with DB status');
    console.log('   GET    /api/db-status  - Database details');
    console.log('   GET    /api/test       - Test endpoint');
    console.log('   POST   /api/admin/import-db - Manual import');
    console.log('   POST   /api/auth/register');
    console.log('   POST   /api/auth/login');
    console.log('   GET    /api/auth/me');
    console.log('   GET    /api/institutes');
    console.log('   GET    /api/institutes/:id');
    console.log('   GET    /api/students/profile');
    console.log('   POST   /api/applications/apply');
    console.log('   GET    /api/admin/stats');
    console.log('\n Quick Checks:');
    console.log(`   Health: http://localhost:${PORT}/api/health`);
    console.log(`   DB Status: http://localhost:${PORT}/api/db-status`);
    console.log(`   Root: http://localhost:${PORT}/`);
  });
};

startServer();
