import mysql from 'mysql2/promise';

console.log('🚀 DATABASE SETUP FOR RAILWAY');

// HARDCODE Railway MySQL credentials (simplest solution)
const dbConfig = {
  host: 'mysql.railway.internal',
  port: 3306,
  user: 'root',
  password: 'tSVIRWsFKyujfCKvkIxgGRTLFXsjFDiS',
  database: 'railway',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

console.log('📊 Using Railway MySQL:');
console.log(`   Host: ${dbConfig.host}:${dbConfig.port}`);
console.log(`   Database: ${dbConfig.database}`);
console.log(`   User: ${dbConfig.user}`);

const pool = mysql.createPool(dbConfig);

export const testConnection = async () => {
  console.log('\n🔧 Testing database connection...');
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully!');
    
    // Check tables
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`📋 Found ${tables.length} tables`);
    
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('⚠️ Starting app without database...');
    return false;
  }
};

export { pool };
