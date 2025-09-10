import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function checkPetitionTables() {
  console.log('🔍 Checking Petition System Tables...\n');
  
  const supabase = createClient(supabaseUrl, supabaseKey, {
    db: { schema: 'public' },
    auth: { persistSession: false }
  });
  
  try {
    // Check each table
    const tables = [
      'petition_schemas',
      'petition_templates',
      'petition_generation_logs', 
      'petition_cache'
    ];
    
    for (const table of tables) {
      process.stdout.write(`Checking ${table}... `);
      
      try {
        // Try to query the table structure
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (!error) {
          console.log('✅ EXISTS');
          
          // For petition_schemas, also check the data
          if (table === 'petition_schemas') {
            const { data: schemas, error: schemasError } = await supabase
              .from('petition_schemas')
              .select('service_type, legal_area, name, active')
              .eq('active', true);
              
            if (!schemasError && schemas) {
              console.log(`    └─ Contains ${schemas.length} active schemas:`);
              schemas.forEach(schema => {
                console.log(`       • ${schema.name} (${schema.service_type}/${schema.legal_area})`);
              });
            }
          }
        } else {
          console.log(`❌ ERROR: ${error.message}`);
        }
      } catch (err: any) {
        console.log(`❌ NOT FOUND: ${err.message}`);
      }
    }
    
    console.log('\n🔍 Checking required dependencies...\n');
    
    // Check if offices table exists (required for FK)
    process.stdout.write('Checking offices table... ');
    try {
      const { data, error } = await supabase
        .from('offices')
        .select('id, name')
        .limit(1);
        
      if (!error) {
        console.log('✅ EXISTS');
      } else {
        console.log(`❌ ERROR: ${error.message}`);
      }
    } catch (err: any) {
      console.log(`❌ NOT FOUND: ${err.message}`);
    }
    
    // Check if office_members table exists (required for RLS)
    process.stdout.write('Checking office_members table... ');
    try {
      const { data, error } = await supabase
        .from('office_members')
        .select('office_id, user_id')
        .limit(1);
        
      if (!error) {
        console.log('✅ EXISTS');
      } else {
        console.log(`❌ ERROR: ${error.message}`);
      }
    } catch (err: any) {
      console.log(`❌ NOT FOUND: ${err.message}`);
    }
    
    // Check if profiles table exists (required for admin check)
    process.stdout.write('Checking profiles table... ');
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role')
        .limit(1);
        
      if (!error) {
        console.log('✅ EXISTS');
      } else {
        console.log(`❌ ERROR: ${error.message}`);
      }
    } catch (err: any) {
      console.log(`❌ NOT FOUND: ${err.message}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('Database Status Summary Complete');
    
  } catch (error) {
    console.error('\n❌ Check failed:', error);
  }
}

checkPetitionTables();