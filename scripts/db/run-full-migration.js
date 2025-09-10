const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function runFullMigration() {
  try {
    console.log('🚀 Starting full database migration...');
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Read the full migration SQL file
    const migrationPath = path.join(__dirname, 'FULL_MIGRATION.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📁 Migration file loaded, size:', migrationSQL.length, 'characters');
    
    // Split into statements (more robust splitting)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && s !== '')
      .map(s => s + ';'); // Add semicolon back
    
    console.log('📝 Found', statements.length, 'SQL statements to execute');
    
    let successCount = 0;
    let failureCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.substring(0, 80).replace(/\s+/g, ' ') + '...';
      
      try {
        console.log(`[${i + 1}/${statements.length}] Executing: ${preview}`);
        
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement
        });
        
        if (error) {
          console.error(`❌ Statement ${i + 1} failed:`, error.message);
          failureCount++;
        } else {
          console.log(`✅ Statement ${i + 1} completed`);
          successCount++;
        }
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (err) {
        console.error(`❌ Statement ${i + 1} error:`, err.message);
        failureCount++;
      }
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failureCount}`);
    console.log(`📝 Total: ${statements.length}`);
    
    if (failureCount > 0) {
      console.log('\n⚠️  Some statements failed. You may need to:');
      console.log('1. Check if the rpc function exec_sql exists in your database');
      console.log('2. Run the migration manually via Supabase SQL Editor');
      console.log('3. Check the failed statements for syntax issues');
      
      console.log('\n🔗 Manual migration link:');
      console.log('https://supabase.com/dashboard/project/hyoiarffutenqtnotndd/sql/new');
    } else {
      console.log('\n🎉 All statements executed successfully!');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n📝 Manual migration required:');
    console.log('1. Go to https://supabase.com/dashboard/project/hyoiarffutenqtnotndd/sql/new');
    console.log('2. Copy the contents of db/FULL_MIGRATION.sql');
    console.log('3. Paste and run in the SQL editor');
  }
}

runFullMigration();