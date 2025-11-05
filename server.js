import express from 'express';
import cors from 'cors';
import ordersRouter from './routes/orders.js';
import pool from './db/connection.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Simple table creation - non-blocking
pool.query(`
  CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    product VARCHAR(100) NOT NULL,
    quantity INT DEFAULT 1,
    order_date DATE,
    status ENUM('Pending', 'Completed', 'Cancelled') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`, (err) => {
  if (err) {
    console.error('❌ Table creation error:', err.message);
  } else {
    console.log('✅ Orders table ready');
    
    // Insert sample data
    pool.query(`
      INSERT IGNORE INTO orders (order_id, customer_name, product, quantity, order_date, status) VALUES
      ('ORD001', 'John Doe', 'Chocolate Cake', 2, CURDATE(), 'Pending'),
      ('ORD002', 'Jane Smith', 'Blueberry Muffin', 6, CURDATE(), 'Completed')
    `, (insertErr) => {
      if (insertErr) {
        console.log('ℹ️ Sample data insertion skipped (may already exist)');
      } else {
        console.log('✅ Sample data inserted');
      }
    });
  }
});

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Bakery API is running!',
    endpoints: {
      health: '/health',
      orders: '/api/orders'
    }
  });
});

// Health check (simple)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: 'checking...'
  });
});

app.use('/api/orders', ordersRouter);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});