// File: railway-setup.js
import { config } from 'dotenv';
config();
import mysql from 'mysql2/promise';

async function setupRailwayDatabase() {
  console.log('🚂 Setting up database for Railway...\n');

  try {
    // Get database config
    let dbConfig;
    
    if (process.env.DATABASE_URL) {
      console.log('📦 Using DATABASE_URL from Railway');
      const url = new URL(process.env.DATABASE_URL);
      dbConfig = {
        host: url.hostname,
        port: url.port || 3306,
        user: url.username,
        password: url.password,
        database: url.pathname.substring(1),
        ssl: { rejectUnauthorized: false }
      };
    } else {
      console.log('⚠️ DATABASE_URL not found, using individual config');
      dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'career_guidance',
        port: process.env.DB_PORT || 3306
      };
    }

    console.log('🔗 Connecting to database...');
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      ssl: dbConfig.ssl
    });

    console.log('✅ Connected to MySQL server');
    
    // Create database if it doesn't exist
    console.log(`📁 Creating database '${dbConfig.database}' if it doesn't exist...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
    await connection.query(`USE \`${dbConfig.database}\``);
    
    console.log('✅ Database ready');
    console.log('\n🎉 Railway database setup complete!');
    console.log('\n📋 Next steps:');
    console.log('   1. Your database is ready at:');
    console.log(`      Host: ${dbConfig.host}`);
    console.log(`      Database: ${dbConfig.database}`);
    console.log('   2. Import your SQL file using:');
    console.log(`      mysql -h ${dbConfig.host} -u ${dbConfig.user} -p ${dbConfig.database} < career_guidance.sql`);
    console.log('   3. Or use Railway\'s dashboard to import your SQL');
    
    await connection.end();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Railway database setup failed:', error.message);
    console.log('\n💡 Troubleshooting tips:');
    console.log('   1. Check if MySQL service is added in Railway');
    console.log('   2. Verify DATABASE_URL environment variable');
    console.log('   3. Check Railway dashboard for database status');
    process.exit(1);
  }
}

setupRailwayDatabase();
