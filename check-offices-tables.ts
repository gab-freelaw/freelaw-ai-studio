import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function checkOfficesTables() {
  console.log('🔍 Checking Offices System Tables...\n');
  
  const supabase = createClient(supabaseUrl, supabaseKey, {
    db: { schema: 'public' },
    auth: { persistSession: false }
  });
  
  try {
    // Check office-related tables
    const officeTables = [
      'offices',
      'office_members',
      'office_styles',
      'profiles'
    ];
    
    for (const table of officeTables) {
      process.stdout.write(`Checking ${table}... `);
      
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (!error) {
          console.log('✅ EXISTS');
          
          if (table === 'profiles') {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, role')
              .limit(5);
            console.log(`    └─ Has ${profiles?.length || 0} profiles`);
          }
        } else {
          console.log(`❌ ERROR: ${error.message}`);
        }
      } catch (err: any) {
        console.log(`❌ NOT FOUND: ${err.message}`);
      }
    }
    
    // Also check organization tables as backup
    console.log('\n🔍 Checking Organizations (alternative to offices)...\n');
    
    const orgTables = [
      'organizations',
      'organization_members'
    ];
    
    for (const table of orgTables) {
      process.stdout.write(`Checking ${table}... `);
      
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (!error) {
          console.log('✅ EXISTS');
        } else {
          console.log(`❌ ERROR: ${error.message}`);
        }
      } catch (err: any) {
        console.log(`❌ NOT FOUND: ${err.message}`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('Dependency Tables Status Complete');
    
  } catch (error) {
    console.error('\n❌ Check failed:', error);
  }
}

checkOfficesTables();