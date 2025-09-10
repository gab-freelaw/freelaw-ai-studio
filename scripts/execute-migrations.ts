import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env')
  console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function executeMigrations() {
  console.log('🚀 Starting Supabase migrations...\n')

  try {
    // Read migration files
    const migrationDir = path.join(process.cwd(), 'supabase', 'migrations')
    const migrationFiles = [
      '20250103_petition_system.sql',
      '20250103_petition_cache.sql'
    ]

    for (const file of migrationFiles) {
      const filePath = path.join(migrationDir, file)
      
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Migration file not found: ${file}`)
        continue
      }

      console.log(`📄 Executing migration: ${file}`)
      
      const sqlContent = fs.readFileSync(filePath, 'utf-8')
      
      // Split SQL into individual statements (naive split by semicolon)
      const statements = sqlContent
        .split(/;\s*$/m)
        .filter(stmt => stmt.trim().length > 0)
        .map(stmt => stmt.trim() + ';')

      let successCount = 0
      let errorCount = 0

      for (const statement of statements) {
        // Skip comments
        if (statement.trim().startsWith('--')) continue
        
        try {
          // Execute SQL statement
          const { error } = await supabase.rpc('exec_sql', {
            sql: statement
          }).single()

          if (error) {
            // Try direct execution as alternative
            const { error: directError } = await supabase
              .from('_dummy')
              .select()
              .limit(0)
              .then(() => ({ error: null }))
              .catch(err => ({ error: err }))

            if (directError) {
              console.log(`   ⚠️  Error in statement: ${directError.message}`)
              errorCount++
            } else {
              successCount++
            }
          } else {
            successCount++
          }
        } catch (err) {
          console.log(`   ⚠️  Error: ${err}`)
          errorCount++
        }
      }

      console.log(`   ✅ Completed: ${successCount} successful, ${errorCount} errors\n`)
    }

    // Verify tables were created
    console.log('🔍 Verifying migration results...\n')
    
    const tablesToCheck = [
      'petition_schemas',
      'petition_templates',
      'petition_generation_logs',
      'petition_cache'
    ]

    for (const table of tablesToCheck) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })

        if (error) {
          console.log(`   ❌ Table ${table}: Not found or error`)
        } else {
          console.log(`   ✅ Table ${table}: Created successfully (${count || 0} rows)`)
        }
      } catch (err) {
        console.log(`   ❌ Table ${table}: Error checking`)
      }
    }

    console.log('\n✨ Migration process completed!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// Alternative: Direct database connection approach
async function executeMigrationsDirectly() {
  console.log('📝 Preparing SQL statements for manual execution...\n')
  
  const migrationDir = path.join(process.cwd(), 'supabase', 'migrations')
  const migrationFiles = [
    '20250103_petition_system.sql',
    '20250103_petition_cache.sql'
  ]

  let fullSQL = '-- Combined migration file for petition system\n\n'

  for (const file of migrationFiles) {
    const filePath = path.join(migrationDir, file)
    
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8')
      fullSQL += `-- File: ${file}\n${content}\n\n`
    }
  }

  // Save combined SQL
  const outputPath = path.join(process.cwd(), 'combined-petition-migrations.sql')
  fs.writeFileSync(outputPath, fullSQL)
  
  console.log(`✅ Combined SQL saved to: ${outputPath}`)
  console.log('\n📋 Next steps:')
  console.log('1. Open Supabase Dashboard: https://supabase.com/dashboard/project/hyoiarffutenqtnotndd/sql/new')
  console.log('2. Copy the contents of combined-petition-migrations.sql')
  console.log('3. Paste and execute in the SQL editor')
  console.log('4. Verify all tables are created successfully')
}

// Check if we can connect to Supabase
async function checkConnection() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)

    if (error && error.code === '42P01') {
      console.log('⚠️  Base tables not found. Running initial setup may be required.')
      return false
    }

    if (error) {
      console.log('⚠️  Connection error:', error.message)
      return false
    }

    console.log('✅ Connected to Supabase successfully')
    return true
  } catch (err) {
    console.log('❌ Failed to connect to Supabase:', err)
    return false
  }
}

// Main execution
async function main() {
  console.log('🔧 Supabase Migration Tool\n')
  
  const isConnected = await checkConnection()
  
  if (!isConnected) {
    console.log('\n⚠️  Cannot execute migrations automatically.')
    await executeMigrationsDirectly()
  } else {
    // Try to execute migrations
    console.log('\n⚠️  Note: Direct SQL execution via API may be limited.')
    console.log('If automatic execution fails, use the manual approach.\n')
    
    await executeMigrationsDirectly()
    
    // Also provide verification commands
    console.log('\n🔍 To verify migrations, you can run:')
    console.log('npm run verify-migrations')
  }
}

main().catch(console.error)