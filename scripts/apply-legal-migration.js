#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Read environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in environment')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  try {
    console.log('Reading migration file...')
    const migrationPath = path.join(__dirname, '../db/migrations/0004_legal_entities.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    console.log('Applying migration to Supabase...')
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    let successCount = 0
    let errorCount = 0

    for (const statement of statements) {
      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        }).single()
        
        if (error) {
          // Try direct execution as alternative
          const { error: directError } = await supabase
            .from('_sql_exec')
            .insert({ query: statement + ';' })
            .single()
            
          if (directError) {
            console.error(`Error executing statement: ${directError.message}`)
            console.error(`Statement: ${statement.substring(0, 100)}...`)
            errorCount++
          } else {
            successCount++
            console.log(`✓ Statement executed successfully`)
          }
        } else {
          successCount++
          console.log(`✓ Statement executed successfully`)
        }
      } catch (err) {
        console.error(`Error: ${err.message}`)
        errorCount++
      }
    }

    console.log(`\nMigration complete:`)
    console.log(`✓ ${successCount} statements executed successfully`)
    if (errorCount > 0) {
      console.log(`✗ ${errorCount} statements failed`)
      console.log('\nPlease run the migration manually through Supabase SQL Editor')
    }

  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

runMigration()