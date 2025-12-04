import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables with fallback
try {
  config();
  console.log('✅ Environment variables loaded');
} catch (error) {
  console.error('❌ Failed to load environment variables:', error.message);
  console.log('⚠️ Running with process.env only');
}

// Import routes with error handling
let authRoutes, instituteRoutes, studentRoutes, applicationRoutes, adminRoutes;

try {
  // Dynamic imports with fallback
  authRoutes = (await import('./routes/auth.js')).default;
  console.log('✅ Auth routes loaded');
} catch (error) {
  console.error('❌ Failed to load auth routes:', error.message);
  authRoutes = (req, res) => res.status(503).json({ error: 'Auth module unavailable' });
}

try {
  instituteRoutes = (await import('./routes/institutes.js')).default;
  console.log('✅ Institute routes loaded');
} catch (error) {
  console.error('❌ Failed to load institute routes:', error.message);
  instituteRoutes = (req, res) => res.status(503).json({ error: 'Institute module unavailable' });
}

try {
  studentRoutes = (await import('./routes/students.js')).default;
  console.log('✅ Student routes loaded');
} catch (error) {
  console.error('❌ Failed to load student routes:', error.message);
  studentRoutes = (req, res) => res.status(503).json({ error: 'Student module unavailable' });
}

try {
  applicationRoutes = (await import('./routes/applications.js')).default;
  console.log('✅ Application routes loaded');
} catch (error) {
  console.error('❌ Failed to load application routes:', error.message);
  applicationRoutes = (req, res) => res.status(503).json({ error: 'Application module unavailable' });
}

try {
  adminRoutes = (await import('./routes/admin.js')).default;
  console.log('✅ Admin routes loaded');
} catch (error) {
  console.error('❌ Failed to load admin routes:', error.message);
  adminRoutes = (req, res) => res.status(503).json({ error: 'Admin module unavailable' });
}

// Import database connection with error handling
let testConnection;
try {
  const dbModule = await import('./config/database.js');
  testConnection = dbModule.testConnection;
  console.log('✅ Database module loaded');
} catch (error) {
  console.error('❌ Failed to load database module:', error.message);
  testConnection = async () => {
    console.error('❌ Database module failed to load');
    return false;
  };
}

const app = express();

// Get Railway URL or use localhost
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const RAILWAY_PUBLIC_DOMAIN = process.env.RAILWAY_PUBLIC_DOMAIN;
const RAILWAY_STATIC_URL = process.env.RAILWAY_STATIC_URL;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Configure CORS for Railway with fallback
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5174', 
  'http://localhost:5173', 
  'http://127.0.0.1:5174',  
  'http://127.0.0.1:5173'
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

// Middleware with error handling
try {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));
  console.log('✅ Helmet security loaded');
} catch (error) {
  console.error('❌ Helmet middleware error:', error.message);
}

try {
  app.use(cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
        console.warn('CORS blocked origin:', origin);
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id', 'Accept']
  }));
  console.log('✅ CORS middleware loaded');
} catch (error) {
  console.error('❌ CORS middleware error:', error.message);
  app.use(cors()); // Fallback to basic CORS
}

// Handle preflight requests
app.options('*', cors());

try {
  app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
  console.log('✅ Morgan logger loaded');
} catch (error) {
  console.error('❌ Morgan logger error:', error.message);
}

try {
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  console.log('✅ Body parser loaded');
} catch (error) {
  console.error('❌ Body parser error:', error.message);
}

// Test database connection on startup with retry logic
const initializeDatabase = async (retries = 3, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempting database connection (attempt ${i + 1}/${retries})...`);
      const connected = await testConnection();
      if (connected) {
        console.log('✅ Database connected successfully');
        return true;
      }
    } catch (error) {
      console.error(`Database connection attempt ${i + 1} failed:`, error.message);
      if (i < retries - 1) {
        console.log(`Retrying in ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  console.error('❌ All database connection attempts failed');
  return false;
};

// Initialize database
initializeDatabase().then(success => {
  if (!success) {
    console.warn('⚠️ Starting server without database connection');
  }
});

// Routes with error handling
try {
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes mounted');
} catch (error) {
  console.error('❌ Failed to mount auth routes:', error.message);
}

try {
  app.use('/api/institutes', instituteRoutes);
  console.log('✅ Institute routes mounted');
} catch (error) {
  console.error('❌ Failed to mount institute routes:', error.message);
}

try {
  app.use('/api/students', studentRoutes);
  console.log('✅ Student routes mounted');
} catch (error) {
  console.error('❌ Failed to mount student routes:', error.message);
}

try {
  app.use('/api/applications', applicationRoutes);
  console.log('✅ Application routes mounted');
} catch (error) {
  console.error('❌ Failed to mount application routes:', error.message);
}

try {
  app.use('/api/admin', adminRoutes);
  console.log('✅ Admin routes mounted');
} catch (error) {
  console.error('❌ Failed to mount admin routes:', error.message);
}

// Health check route (important for Railway)
app.get('/api/health', (req, res) => {
  try {
    res.status(200).json({
      status: 'OK',
      message: 'Career Guidance API is running',
      timestamp: new Date().toISOString(),
      environment: NODE_ENV,
      railway: !!RAILWAY_PUBLIC_DOMAIN,
      version: '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: 'checking...' // You can add actual DB check here
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Health check failed',
      error: error.message
    });
  }
});

// Test route
app.get('/api/test', (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Root route for Railway health checks
app.get('/', (req, res) => {
  try {
    res.json({
      message: 'Career Guidance Platform API',
      status: 'operational',
      version: '1.0.0',
      documentation: '/api/health',
      environment: NODE_ENV,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      message: 'API Root Error',
      error: error.message
    });
  }
});

// Simple 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('🔥 Global error handler:', {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  // MySQL duplicate entry error
  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry found',
      code: 'DUPLICATE_ENTRY'
    });
  }
  
  // MySQL connection errors
  if (error.code === 'ECONNREFUSED' || error.code === 'PROTOCOL_CONNECTION_LOST') {
    return res.status(503).json({
      success: false,
      message: 'Database connection error',
      code: 'DATABASE_UNAVAILABLE'
    });
  }

  // CORS errors
  if (error.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      message: 'CORS error: Origin not allowed',
      code: 'CORS_ERROR'
    });
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }

  // Validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: error.message,
      code: 'VALIDATION_ERROR'
    });
  }

  // Default error response
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    code: 'INTERNAL_ERROR',
    ...(NODE_ENV === 'development' && { 
      stack: error.stack,
      details: error 
    }),
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Graceful shutdown handlers
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  // Close server
  if (server) {
    server.close(() => {
      console.log('✅ HTTP server closed');
      process.exit(0);
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
      console.error('⚠️ Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 UNCAUGHT EXCEPTION:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 UNHANDLED REJECTION at:', promise, 'reason:', reason);
  // Don't exit here, just log
});

// Start server
let server;
try {
  server = app.listen(PORT, HOST, () => {
    console.log(`
🚀 Server running on port ${PORT}
📚 Career Guidance Platform API
🔗 Environment: ${NODE_ENV}
🌐 Railway Public Domain: ${RAILWAY_PUBLIC_DOMAIN || 'Not set'}
🔗 Frontend URL: ${FRONTEND_URL}
📍 Host: ${HOST} (Railway compatible)
📊 Node Version: ${process.version}
📦 Memory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB

 Available Routes:
   GET    /               - API Root
   GET    /api/health     - Health check
   GET    /api/test       - Test endpoint
   POST   /api/auth/register
   POST   /api/auth/login
   GET    /api/auth/me
   GET    /api/institutes
   GET    /api/institutes/:id
   GET    /api/students/profile
   POST   /api/applications/apply
   GET    /api/admin/stats

 Test the server:
   Health: http://${HOST}:${PORT}/api/health
   Root: http://${HOST}:${PORT}/
    `);
  });

  // Handle server errors
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use`);
      process.exit(1);
    } else {
      console.error('❌ Server error:', error);
      process.exit(1);
    }
  });

} catch (error) {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}

export default app;
