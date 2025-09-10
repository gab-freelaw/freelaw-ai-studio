# How to Get Your Supabase Postgres Connection String

## Steps:

1. **Go to your Supabase Dashboard**
   - Visit: https://supabase.com/dashboard/project/YOUR_PROJECT_ID

2. **Navigate to Settings → Database**
   - Click on "Settings" in the left sidebar
   - Then click on "Database"

3. **Find Connection String section**
   - Scroll to "Connection string"
   - Select "URI" tab
   - Choose **"Transaction"** mode from dropdown (important!)

4. **Copy the connection string**
   It will look like:
   ```
   postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

5. **Update your Claude config**
   Replace `YOUR_POSTGRES_CONNECTION_STRING` with the copied string

## Alternative: Using Supabase CLI

If you have Supabase CLI installed:
```bash
supabase db remote get
```

## Important Notes:
- Use "Transaction" mode for MCP (not "Session" mode)
- The connection uses PgBouncer for connection pooling
- Keep this connection string secret - it has full database access
- If you reset your database password, you'll need to update this string

## After Setup:
1. Update the config file
2. Restart Claude Desktop
3. Test with a simple query through the Postgres MCP