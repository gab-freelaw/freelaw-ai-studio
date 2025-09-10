import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function setupSupabase() {
  console.log('🚀 Setting up Supabase for Freelaw AI...\n');
  
  const supabase = createClient(supabaseUrl, supabaseKey, {
    db: { schema: 'public' },
    auth: { persistSession: false }
  });
  
  try {
    // 1. Create storage bucket
    console.log('1. Creating storage bucket for documents...');
    const { data: bucket, error: bucketError } = await supabase
      .storage
      .createBucket('documents', {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain'
        ]
      });
    
    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('   ✅ Storage bucket already exists\n');
      } else {
        console.log('   ❌ Error creating bucket:', bucketError.message);
      }
    } else {
      console.log('   ✅ Storage bucket created successfully\n');
    }
    
    // 2. Read and prepare SQL migrations
    console.log('2. Preparing SQL migrations...');
    
    // First migration (main tables)
    const migration1Path = path.join(__dirname, 'db/migrations/001_initial_schema.sql');
    const migration1SQL = fs.readFileSync(migration1Path, 'utf8');
    
    // Second migration (extraction schemas)
    const migration2Path = path.join(__dirname, 'db/migrations/002_extraction_schemas.sql');
    const migration2SQL = fs.readFileSync(migration2Path, 'utf8');
    
    // Combine migrations
    const fullSQL = `
-- =====================================================
-- FREELAW AI DATABASE SETUP
-- =====================================================

${migration1SQL}

-- =====================================================
-- EXTRACTION SCHEMAS
-- =====================================================

${migration2SQL}
`;
    
    // Save combined SQL for manual execution
    const outputPath = path.join(__dirname, 'db/FULL_MIGRATION.sql');
    fs.writeFileSync(outputPath, fullSQL);
    
    console.log('   ✅ SQL migrations prepared\n');
    
    // 3. Instructions for manual execution
    console.log('=' .repeat(60));
    console.log('\n📝 MANUAL STEPS REQUIRED:\n');
    console.log('1. Go to Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/hyoiarffutenqtnotndd/sql/new\n');
    console.log('2. Copy and paste the contents of:');
    console.log('   db/FULL_MIGRATION.sql\n');
    console.log('3. Click "Run" to execute all migrations\n');
    console.log('4. After migrations complete, run:');
    console.log('   npm run dev\n');
    console.log('5. Visit http://localhost:3000/documents');
    console.log('=' .repeat(60));
    
    // 4. Test current setup
    console.log('\n🔍 Testing current setup...\n');
    
    // Check if tables exist
    const { data: documents, error: docError } = await supabase
      .from('documents')
      .select('id')
      .limit(1);
    
    if (!docError) {
      console.log('✅ Documents table exists');
    } else {
      console.log('⚠️  Documents table not found - needs migration');
    }
    
    const { data: schemas, error: schemaError } = await supabase
      .from('extraction_schemas')
      .select('id')
      .limit(1);
    
    if (!schemaError) {
      console.log('✅ Extraction schemas table exists');
    } else {
      console.log('⚠️  Extraction schemas table not found - needs migration');
    }
    
    // Check storage
    const { data: buckets } = await supabase.storage.listBuckets();
    const hasDocumentsBucket = buckets?.some(b => b.name === 'documents');
    
    if (hasDocumentsBucket) {
      console.log('✅ Documents storage bucket exists');
    } else {
      console.log('⚠️  Documents storage bucket not found');
    }
    
  } catch (error) {
    console.error('Setup error:', error);
  }
}

setupSupabase();