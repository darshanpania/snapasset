/**
 * Database Migration Runner
 * Runs SQL migration files
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const migrations = [
  '001_create_projects.sql',
  '002_create_analytics.sql',
];

const runMigration = async (filename) => {
  try {
    console.log(`Running migration: ${filename}`);
    
    const filePath = join(__dirname, '..', 'database', 'migrations', filename);
    const sql = readFileSync(filePath, 'utf-8');

    // Note: Supabase client doesn't support raw SQL execution
    // You'll need to run migrations directly via psql or Supabase dashboard
    console.log(`\nPlease run this migration manually:`);
    console.log(`psql $DATABASE_URL -f ${filePath}`);
    console.log('\nOr copy the SQL to Supabase SQL Editor');
    
    return true;
  } catch (error) {
    console.error(`Failed to read migration ${filename}:`, error);
    return false;
  }
};

const runMigrations = async () => {
  console.log('\n=== Database Migration Runner ===\n');
  console.log('Note: Migrations must be run manually via psql or Supabase Dashboard\n');

  for (const migration of migrations) {
    await runMigration(migration);
    console.log('---\n');
  }

  console.log('\n=== Migration Information Displayed ===');
  console.log('\nTo run all migrations at once:');
  console.log('psql $DATABASE_URL -f server/database/migrations/001_create_projects.sql');
  console.log('psql $DATABASE_URL -f server/database/migrations/002_create_analytics.sql');
  
  process.exit(0);
};

runMigrations();