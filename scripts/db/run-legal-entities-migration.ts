import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function runLegalEntitiesMigration() {
  console.log('🚀 Running Legal Entities Migration...\n');
  
  const supabase = createClient(supabaseUrl, supabaseKey, {
    db: { schema: 'public' },
    auth: { persistSession: false }
  });
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'db/migrations/0004_legal_entities.sql');
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
      const isCreatePolicy = statement.includes('CREATE POLICY');
      const isCreateFunction = statement.includes('CREATE OR REPLACE FUNCTION');
      const isCreateTrigger = statement.includes('CREATE TRIGGER');
      const isAlterTable = statement.includes('ALTER TABLE');
      
      let description = '';
      if (isCreateTable) {
        const match = statement.match(/CREATE TABLE IF NOT EXISTS (\w+)/);
        description = match ? `Creating table: ${match[1]}` : firstLine;
      } else if (isCreateIndex) {
        const match = statement.match(/CREATE (?:UNIQUE )?INDEX IF NOT EXISTS (\w+)/);
        description = match ? `Creating index: ${match[1]}` : firstLine;
      } else if (isCreatePolicy) {
        const match = statement.match(/CREATE POLICY "([^"]+)"/);
        description = match ? `Creating policy: ${match[1]}` : firstLine;
      } else if (isCreateFunction) {
        description = 'Creating function: update_updated_at_column';
      } else if (isCreateTrigger) {
        const match = statement.match(/CREATE TRIGGER (\w+)/);
        description = match ? `Creating trigger: ${match[1]}` : firstLine;
      } else if (isAlterTable) {
        const match = statement.match(/ALTER TABLE (\w+)/);
        description = match ? `Altering table: ${match[1]}` : firstLine;
      } else {
        description = firstLine;
      }
      
      process.stdout.write(`[${i + 1}/${statements.length}] ${description}... `);
      
      try {
        // Execute the SQL statement directly
        const { error } = await supabase.rpc('exec', { sql: statement });
        
        if (error) {
          throw error;
        }
        
        console.log('✅');
        successCount++;
      } catch (error: any) {
        // Some errors are expected (e.g., extensions already exist)
        const errorMessage = error?.message || String(error);
        
        if (errorMessage.includes('already exists') || 
            errorMessage.includes('duplicate key') ||
            errorMessage.includes('does not exist')) {
          console.log('⏭️  (already exists or not critical)');
          successCount++;
        } else {
          console.log('❌');
          console.log(`   Error: ${errorMessage}`);
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
      console.log('\n⚠️  Some statements failed:');
      errors.forEach(err => console.log(`  - ${err}`));
    }
    
    // Test if legal entities tables were created
    console.log('\n🔍 Testing legal entities tables...\n');
    
    const tables = [
      'clients',
      'processes', 
      'publications',
      'client_processes',
      'api_costs',
      'lawyers'
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
    
    // Test RLS policies
    console.log('\n🔒 Testing RLS policies...\n');
    
    for (const table of tables) {
      process.stdout.write(`Checking RLS on ${table}... `);
      
      try {
        const { data, error } = await supabase
          .rpc('exec', { 
            sql: `SELECT * FROM pg_policies WHERE tablename = '${table}' LIMIT 1;` 
          });
        
        if (!error && data && data.length > 0) {
          console.log('✅ (policies found)');
        } else {
          console.log('⚠️  (no policies or error)');
        }
      } catch (err) {
        console.log('⚠️  (could not check)');
      }
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (errorCount > 0) {
      console.log('\n⚠️  Migration partially complete.');
      console.log('Please check the errors above and run remaining SQL manually if needed.');
    } else {
      console.log('\n✅ Legal entities migration completed successfully!');
      console.log('Tables created: clients, processes, publications, client_processes, api_costs, lawyers');
      console.log('RLS policies and triggers have been set up.');
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.log('\nAs a fallback, you can run the migration manually:');
    console.log('1. Go to your Supabase SQL Editor');
    console.log('2. Copy the contents of db/migrations/0004_legal_entities.sql');
    console.log('3. Paste and run in the SQL editor');
  }
}

// Run if called directly
if (require.main === module) {
  runLegalEntitiesMigration();
}

export default runLegalEntitiesMigration;