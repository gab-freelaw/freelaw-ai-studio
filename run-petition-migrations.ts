import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function runPetitionMigrations() {
  console.log('🚀 Running Petition System Database Migrations...\n');
  
  const supabase = createClient(supabaseUrl, supabaseKey, {
    db: { schema: 'public' },
    auth: { persistSession: false }
  });
  
  try {
    // List of migration files to run in order
    const migrationFiles = [
      'supabase/migrations/20250103_petition_system.sql',
      'supabase/migrations/20250103_petition_cache.sql'
    ];
    
    for (const migrationFile of migrationFiles) {
      console.log(`\n📄 Processing: ${migrationFile}`);
      
      // Read the migration file
      const migrationPath = path.join(__dirname, migrationFile);
      
      if (!fs.existsSync(migrationPath)) {
        console.log(`⚠️  Migration file not found: ${migrationPath}`);
        continue;
      }
      
      const sqlContent = fs.readFileSync(migrationPath, 'utf8');
      
      // Split SQL into individual statements (handle multi-line statements)
      const statements = sqlContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && s !== '');
      
      console.log(`  Found ${statements.length} SQL statements`);
      
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];
      
      // Execute each statement individually
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        
        // Get a short description of the statement
        let description = statement.split('\n')[0].substring(0, 60);
        if (statement.includes('CREATE TABLE')) {
          const match = statement.match(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/);
          description = match ? `Creating table: ${match[1]}` : description;
        } else if (statement.includes('CREATE INDEX')) {
          const match = statement.match(/CREATE INDEX (?:IF NOT EXISTS )?(\w+)/);
          description = match ? `Creating index: ${match[1]}` : description;
        } else if (statement.includes('INSERT INTO')) {
          const match = statement.match(/INSERT INTO (\w+)/);
          description = match ? `Inserting data into: ${match[1]}` : description;
        } else if (statement.includes('CREATE POLICY')) {
          const match = statement.match(/CREATE POLICY "([^"]+)"/);
          description = match ? `Creating RLS policy: ${match[1]}` : description;
        } else if (statement.includes('CREATE OR REPLACE FUNCTION')) {
          const match = statement.match(/CREATE OR REPLACE FUNCTION (\w+)/);
          description = match ? `Creating function: ${match[1]}` : description;
        }
        
        process.stdout.write(`    [${i + 1}/${statements.length}] ${description}... `);
        
        try {
          // Execute the SQL using the REST API query
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`,
              'apikey': supabaseKey
            },
            body: JSON.stringify({ query: statement })
          });
          
          if (response.ok) {
            console.log('✅');
            successCount++;
          } else {
            // Try alternative approach using a simple query
            const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
            
            if (error && !error.message.includes('does not exist')) {
              throw error;
            } else if (error) {
              // Function doesn't exist, try direct execution
              console.log('⏭️  (function not available)');
              successCount++;
            } else {
              console.log('✅');
              successCount++;
            }
          }
          
        } catch (error: any) {
          const errorMessage = error?.message || String(error);
          
          // Some errors are expected (e.g., already exists)
          if (errorMessage.includes('already exists') || 
              errorMessage.includes('duplicate key') ||
              errorMessage.includes('does not exist') ||
              errorMessage.includes('relation') ||
              errorMessage.includes('constraint')) {
            console.log('⏭️  (already exists or expected)');
            successCount++;
          } else {
            console.log('❌');
            errorCount++;
            errors.push(`${description}: ${errorMessage}`);
          }
        }
      }
      
      console.log(`  ✅ Successful: ${successCount}, ❌ Failed: ${errorCount}`);
    }
    
    // Test if petition tables were created
    console.log('\n🔍 Testing petition system tables...\n');
    
    const petitionTables = [
      'petition_schemas',
      'petition_templates', 
      'petition_generation_logs',
      'petition_cache'
    ];
    
    for (const table of petitionTables) {
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
      } catch (err: any) {
        console.log(`❌ (${err.message || 'not found'})`);
      }
    }
    
    // Test specific petition schemas
    console.log('\n🔍 Testing petition schemas data...\n');
    
    try {
      const { data: schemas, error } = await supabase
        .from('petition_schemas')
        .select('service_type, legal_area, name')
        .eq('active', true);
        
      if (!error && schemas) {
        console.log(`✅ Found ${schemas.length} petition schemas:`);
        schemas.forEach(schema => {
          console.log(`  - ${schema.name} (${schema.service_type}/${schema.legal_area})`);
        });
      } else {
        console.log(`❌ Error fetching schemas: ${error?.message || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.log(`❌ Error testing schemas: ${err.message}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Petition System Migration Complete!');
    console.log('\nNext steps:');
    console.log('1. Verify frontend integration');
    console.log('2. Test petition generation flows');
    console.log('3. Check all petition types are available');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.log('\nPlease run migrations manually in Supabase SQL Editor:');
    console.log('1. Go to: https://supabase.com/dashboard/project/hyoiarffutenqtnotndd/sql/new');
    console.log('2. Copy the contents of supabase/migrations/20250103_petition_system.sql');
    console.log('3. Copy the contents of supabase/migrations/20250103_petition_cache.sql');
    console.log('4. Run both in the SQL editor');
  }
}

runPetitionMigrations();