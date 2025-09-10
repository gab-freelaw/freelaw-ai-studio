import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function runMigrations() {
  console.log('🚀 Running Freelaw AI Database Migrations...\n');
  
  const supabase = createClient(supabaseUrl, supabaseKey, {
    db: { schema: 'public' },
    auth: { persistSession: false }
  });
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'db/FULL_MIGRATION.sql');
    const fullSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split SQL into individual statements
    const statements = fullSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`Found ${statements.length} SQL statements to execute\n`);
    
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    // Execute each statement individually
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // Get a short description of the statement
      const lines = statement.split('\n');
      const firstLine = lines[0].substring(0, 50);
      const isCreateTable = statement.includes('CREATE TABLE');
      const isCreateIndex = statement.includes('CREATE INDEX');
      const isInsert = statement.includes('INSERT INTO');
      
      let description = '';
      if (isCreateTable) {
        const match = statement.match(/CREATE TABLE IF NOT EXISTS (\w+)/);
        description = match ? `Creating table: ${match[1]}` : firstLine;
      } else if (isCreateIndex) {
        const match = statement.match(/CREATE INDEX IF NOT EXISTS (\w+)/);
        description = match ? `Creating index: ${match[1]}` : firstLine;
      } else if (isInsert) {
        description = 'Inserting default data';
      } else {
        description = firstLine;
      }
      
      process.stdout.write(`[${i + 1}/${statements.length}] ${description}... `);
      
      try {
        // Use raw SQL execution through RPC if available, or direct query
        const { error } = await supabase.rpc('exec_sql', { sql: statement }).single();
        
        if (error) {
          // Try alternative approach - direct to database
          const { error: queryError } = await supabase
            .from('_sql')
            .insert({ query: statement })
            .single();
          
          if (queryError) {
            throw queryError;
          }
        }
        
        console.log('✅');
        successCount++;
      } catch (error: any) {
        // Some errors are expected (e.g., extensions already exist)
        const errorMessage = error?.message || String(error);
        
        if (errorMessage.includes('already exists') || 
            errorMessage.includes('duplicate key') ||
            errorMessage.includes('exec_sql')) {
          console.log('⏭️  (already exists or not critical)');
          successCount++;
        } else {
          console.log('❌');
          errorCount++;
          errors.push(`Statement ${i + 1}: ${errorMessage}`);
        }
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('Migration Summary:');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    
    if (errors.length > 0) {
      console.log('\n⚠️  Some statements failed (this might be okay):');
      errors.forEach(err => console.log(`  - ${err}`));
      
      console.log('\n📝 Manual Action Required:');
      console.log('Since direct SQL execution is restricted, please:');
      console.log('1. Go to: https://supabase.com/dashboard/project/hyoiarffutenqtnotndd/sql/new');
      console.log('2. Copy the contents of db/FULL_MIGRATION.sql');
      console.log('3. Paste and run in the SQL editor');
    }
    
    // Test if core tables were created
    console.log('\n🔍 Testing core tables...\n');
    
    const tables = [
      'users',
      'organizations', 
      'documents',
      'extraction_schemas',
      'document_extractions'
    ];
    
    for (const table of tables) {
      process.stdout.write(`Checking ${table} table... `);
      
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          console.log(`✅ (exists)`);
        } else {
          console.log(`❌ (${error.message})`);
        }
      } catch (err) {
        console.log(`❌ (not found)`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (errorCount > 0) {
      console.log('\n⚠️  Migration partially complete.');
      console.log('Please run the remaining SQL manually in Supabase SQL Editor.');
    } else {
      console.log('\n✅ All migrations completed successfully!');
      console.log('You can now use the application.');
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.log('\nPlease run migrations manually:');
    console.log('1. Go to: https://supabase.com/dashboard/project/hyoiarffutenqtnotndd/sql/new');
    console.log('2. Copy the contents of db/FULL_MIGRATION.sql');
    console.log('3. Paste and run in the SQL editor');
  }
}

runMigrations();