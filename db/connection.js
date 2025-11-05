import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'bakery',
  port: process.env.DB_PORT || 3306,
  connectTimeout: 60000,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
});

db.connect(err => {
  if (err) {
    console.error('❌ DB connection error:', err.message);
    console.log('💡 Please check:');
    console.log('   1. Is MySQL running?');
    console.log('   2. Are database credentials correct?');
    console.log('   3. Does the database exist?');
  } else {
    console.log('✅ Connected to MySQL');
  }
});

db.on('error', (err) => {
  console.error('Database error:', err);
});

export default db;