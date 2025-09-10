import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function testSupabase() {
  try {
    console.log('Testing Supabase connection...');
    console.log('URL:', supabaseUrl);
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test database connection
    const { data, error } = await supabase.from('_test').select('*').limit(1);
    
    if (error && error.code !== 'PGRST116') {
      // PGRST116 means table doesn't exist, which is fine for testing
      throw error;
    }
    
    console.log('✅ Supabase connected successfully!');
    
    // Get database info
    const { data: tables } = await supabase.rpc('get_tables', {});
    console.log('Database is ready for migrations');
    
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
  }
}

testSupabase();