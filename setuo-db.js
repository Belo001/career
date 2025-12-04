// File: setup-db.js
import { config } from 'dotenv';
config();

import { pool } from './config/database.js';

async function setupDatabase() {
  try {
    // Run your database/setup.js logic here
    // Or import it directly
    console.log('Setting up database on Railway...');
    
    // Create tables if they don't exist
    // You can move your setup logic here
    console.log('Database setup complete!');
    
    process.exit(0);
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();
