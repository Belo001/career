import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || ''
});

async function setupMySQL() {
  try {
    console.log('🔌 Connecting to MySQL...');
    
    // Test connection
    await new Promise((resolve, reject) => {
      connection.connect(err => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('✅ Connected to MySQL server');

    // Create database
    await new Promise((resolve, reject) => {
      connection.query('CREATE DATABASE IF NOT EXISTS bakery', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('✅ Database created or already exists');

    // Use the database
    await new Promise((resolve, reject) => {
      connection.query('USE bakery', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Create table
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
      )
    `;

    await new Promise((resolve, reject) => {
      connection.query(createTableSQL, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('✅ Orders table created or already exists');

    // Insert sample data
    const insertSampleData = `
      INSERT IGNORE INTO orders (order_id, customer_name, product, quantity, order_date, status) VALUES
      ('ORD001', 'John Doe', 'Chocolate Cake', 2, '2024-01-15', 'Pending'),
      ('ORD002', 'Jane Smith', 'Blueberry Muffin', 6, '2024-01-16', 'Completed'),
      ('ORD003', 'Mike Johnson', 'Croissant', 12, '2024-01-17', 'Pending')
    `;

    await new Promise((resolve, reject) => {
      connection.query(insertSampleData, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('✅ Sample data inserted');

    console.log('🎉 MySQL setup completed successfully!');

  } catch (error) {
    console.error('❌ MySQL setup failed:', error.message);
  } finally {
    connection.end();
    console.log('🔌 Connection closed');
  }
}

setupMySQL();