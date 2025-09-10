import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function runMigration() {
  try {
    console.log('🚀 Running extraction schemas migration...\n');
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      db: { schema: 'public' },
      auth: { persistSession: false }
    });
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'db/migrations/002_extraction_schemas.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolons but keep them for execution
    const statements = migrationSQL
      .split(/;\s*\n/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
      .map(s => s.endsWith(';') ? s : s + ';');
    
    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.substring(0, 50).replace(/\n/g, ' ');
      
      console.log(`[${i + 1}/${statements.length}] Running: ${preview}...`);
      
      try {
        // Execute using raw SQL through RPC (if available) or direct query
        const { error } = await supabase.rpc('exec_sql', { 
          query: statement 
        }).single();
        
        if (error) {
          // If RPC doesn't exist, the migration needs to be run manually
          throw new Error('RPC function not available');
        }
        
        console.log(`   ✅ Success\n`);
        successCount++;
      } catch (rpcError) {
        // Try alternative approach or log for manual execution
        console.log(`   ⚠️  RPC not available - statement needs manual execution\n`);
        errorCount++;
      }
    }
    
    console.log('=' .repeat(50));
    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ⚠️  Manual needed: ${errorCount}`);
    
    if (errorCount > 0) {
      console.log('\n📝 Manual execution required:');
      console.log('1. Go to: https://supabase.com/dashboard/project/hyoiarffutenqtnotndd/sql/new');
      console.log('2. Copy the contents of: db/migrations/002_extraction_schemas.sql');
      console.log('3. Paste and run in the SQL editor\n');
    }
    
    // Try to verify if tables exist
    console.log('\n🔍 Verifying tables...\n');
    
    const { data: schemas, error: schemaError } = await supabase
      .from('extraction_schemas')
      .select('id, name, service_type, legal_area')
      .limit(5);
    
    if (!schemaError && schemas) {
      console.log('✅ extraction_schemas table exists');
      console.log(`   Found ${schemas.length} extraction schemas:`);
      schemas.forEach(s => {
        console.log(`   - ${s.name} (${s.service_type}/${s.legal_area})`);
      });
    } else {
      console.log('⚠️  Could not verify extraction_schemas table');
      console.log('   Error:', schemaError?.message || 'Table might not exist yet');
    }
    
    const { data: extractions, error: extractionError } = await supabase
      .from('document_extractions')
      .select('id')
      .limit(1);
    
    if (!extractionError) {
      console.log('\n✅ document_extractions table exists');
    } else {
      console.log('\n⚠️  Could not verify document_extractions table');
      console.log('   Error:', extractionError?.message || 'Table might not exist yet');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('\n📝 Please run the migration manually:');
    console.log('1. Go to: https://supabase.com/dashboard/project/hyoiarffutenqtnotndd/sql/new');
    console.log('2. Copy the contents of: db/migrations/002_extraction_schemas.sql');
    console.log('3. Paste and run in the SQL editor');
  }
}

runMigration();