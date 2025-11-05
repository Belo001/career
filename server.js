import express from 'express';
import cors from 'cors';
import ordersRouter from './routes/orders.js';
import pool from './db/connection.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Create tables if they don't exist (non-blocking)
const createTables = () => {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id VARCHAR(50) UNIQUE NOT NULL,
      customer_name VARCHAR(100) NOT NULL,
      product VARCHAR(100) NOT NULL,
      quantity INT DEFAULT 1,
      order_date DATE,
      status ENUM('Pending', 'Completed', 'Cancelled') DEFAULT 'Pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;

  pool.query(createTableSQL, (err) => {
    if (err) {
      console.error('❌ Error creating orders table:', err.message);
    } else {
      console.log('✅ Orders table ready');
      
      // Insert sample data
      const sampleDataSQL = `
        INSERT IGNORE INTO orders (order_id, customer_name, product, quantity, order_date, status) VALUES
        ('ORD001', 'John Doe', 'Chocolate Cake', 2, CURDATE(), 'Pending'),
        ('ORD002', 'Jane Smith', 'Blueberry Muffin', 6, CURDATE(), 'Completed'),
        ('ORD003', 'Mike Johnson', 'Croissant', 12, CURDATE(), 'Pending')
      `;
      
      pool.query(sampleDataSQL, (insertErr) => {
        if (insertErr) {
          console.log('ℹ️ Sample data already exists');
        } else {
          console.log('✅ Sample data inserted');
        }
      });
    }
  });
};

// Initialize database
createTables();

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: '🍰 Sweet Crust Bakery API is running!',
    endpoints: {
      health: '/health',
      orders: '/api/orders'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) {
      return res.status(500).json({ 
        status: 'error', 
        message: 'Database connection failed',
        error: err.message 
      });
    }
    
    connection.query('SELECT 1 as test', (queryErr, results) => {
      connection.release();
      
      if (queryErr) {
        return res.status(500).json({ 
          status: 'error', 
          message: 'Database query failed',
          error: queryErr.message 
        });
      }
      
      res.json({ 
        status: 'healthy', 
        message: 'API and database are working',
        timestamp: new Date().toISOString()
      });
    });
  });
});

// API routes
app.use('/api/orders', ordersRouter);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Using database: ${process.env.MYSQLDATABASE}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
});