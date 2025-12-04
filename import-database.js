// File: import-database.js
import { config } from 'dotenv';
config();
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function importDatabase() {
  console.log('📦 Starting database import to Railway...\n');
  
  // Check if SQL file exists
  const sqlFile = path.join(__dirname, 'career_guidance.sql');
  if (!fs.existsSync(sqlFile)) {
    console.error('❌ career_guidance.sql file not found!');
    console.log('💡 Make sure the SQL file is in the same directory');
    process.exit(1);
  }
  
  console.log('✅ Found career_guidance.sql file');
  
  // Determine connection method
  let connectionString;
  
  if (process.env.MYSQL_PUBLIC_URL) {
    console.log('🔗 Using MYSQL_PUBLIC_URL for import');
    connectionString = process.env.MYSQL_PUBLIC_URL;
  } else if (process.env.MYSQL_URL) {
    console.log('🔗 Using MYSQL_URL for import (internal)');
    connectionString = process.env.MYSQL_URL;
  } else {
    console.error('❌ No MySQL connection string found!');
    console.log('💡 Make sure Railway MySQL is properly set up');
    process.exit(1);
  }
  
  try {
    console.log('🚀 Importing database... This may take a moment...');
    
    // Use mysql CLI to import
    const command = `mysql ${connectionString} < "${sqlFile}"`;
    
    console.log('🔧 Running command:', command.substring(0, 100) + '...');
    
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && !stderr.includes('Warning')) {
      console.error('❌ Import failed:', stderr);
      process.exit(1);
    }
    
    console.log('✅ Database import completed successfully!');
    console.log('\n🎉 Your database is now ready on Railway!');
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    console.log('\n💡 Alternative import methods:');
    console.log('   1. Use Railway Dashboard:');
    console.log('      - Go to your MySQL service');
    console.log('      - Click "Connect"');
    console.log('      - Use MySQL Workbench or similar tool to import');
    console.log('   2. Use Railway CLI:');
    console.log('      railway connect mysql');
    console.log('      Then run: mysql -u root -p railway < career_guidance.sql');
    process.exit(1);
  }
}

importDatabase();
