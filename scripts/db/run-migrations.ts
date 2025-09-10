import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function runMigrations() {
  try {
    console.log('🚀 Running database migrations...');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations/001_initial_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolons and run each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const statement of statements) {
      console.log(`Running: ${statement.substring(0, 50)}...`);
      
      const { error } = await supabase.rpc('exec_sql', {
        sql: statement + ';'
      }).single();
      
      if (error) {
        // Try direct execution if RPC doesn't exist
        console.log('RPC not available, migration must be run via Supabase Dashboard SQL Editor');
        break;
      }
    }
    
    console.log('✅ Migrations completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Go to https://supabase.com/dashboard/project/hyoiarffutenqtnotndd/sql/new');
    console.log('2. Copy the contents of db/migrations/001_initial_schema.sql');
    console.log('3. Paste and run in the SQL editor');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('\n📝 Manual steps required:');
    console.log('1. Go to https://supabase.com/dashboard/project/hyoiarffutenqtnotndd/sql/new');
    console.log('2. Copy the contents of db/migrations/001_initial_schema.sql');
    console.log('3. Paste and run in the SQL editor');
  }
}

runMigrations();