import fs from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// TEMPORARY IMPORT ROUTE - REMOVE AFTER IMPORT
app.post('/api/admin/import-database', async (req, res) => {
  try {
    console.log('📦 Starting database import...');
    
    // Read SQL file
    const sqlPath = path.join(__dirname, 'career_guidance.sql');
    const sqlContent = await readFile(sqlPath, 'utf8');
    
    // Split into individual statements
    const statements = sqlContent
      .split(';')
      .filter(stmt => stmt.trim() && !stmt.trim().startsWith('/*'))
      .map(stmt => stmt.trim() + ';');
    
    console.log(`📊 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Execute statements one by one
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement && statement.length > 10) { // Skip empty statements
        try {
          await pool.query(statement);
          successCount++;
          if (i % 10 === 0) {
            console.log(`⏳ Processed ${i}/${statements.length} statements...`);
          }
        } catch (error) {
          errorCount++;
          console.error(`❌ Error in statement ${i + 1}:`, error.message);
          // Don't stop on errors like "table already exists"
          if (!error.message.includes('already exists')) {
            console.error('🔧 Problematic statement:', statement.substring(0, 200));
          }
        }
      }
    }
    
    console.log(`🎉 Import completed: ${successCount} successful, ${errorCount} errors`);
    
    res.json({
      success: true,
      message: 'Database import completed',
      stats: {
        total: statements.length,
        successful: successCount,
        errors: errorCount
      }
    });
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    res.status(500).json({
      success: false,
      message: 'Import failed',
      error: error.message
    });
  }
});

// Check database status
app.get('/api/admin/db-status', async (req, res) => {
  try {
    const [tables] = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
    `);
    
    const [usersCount] = await pool.query('SELECT COUNT(*) as count FROM users');
    const [institutesCount] = await pool.query('SELECT COUNT(*) as count FROM institutes');
    const [studentsCount] = await pool.query('SELECT COUNT(*) as count FROM students');
    
    res.json({
      success: true,
      database: process.env.MYSQLDATABASE || 'railway',
      tables: tables.length,
      tableNames: tables.map(t => t.table_name),
      counts: {
        users: usersCount[0].count,
        institutes: institutesCount[0].count,
        students: studentsCount[0].count
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database check failed',
      error: error.message
    });
  }
});
