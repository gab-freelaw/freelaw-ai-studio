# MCP Setup Guide for Freelaw AI

## Required MCPs and Setup Instructions

### 1. Composio (100+ integrations)
**Get API Key:** https://app.composio.dev
1. Sign up/login to Composio
2. Go to Settings → API Keys
3. Create a new API key
4. Replace `YOUR_COMPOSIO_API_KEY` in the config

### 2. Postgres (Database access)
**Using Supabase connection:**
1. Go to your Supabase project dashboard
2. Settings → Database
3. Copy the connection string (use "Transaction" mode)
4. Replace `YOUR_POSTGRES_CONNECTION_STRING` in the config

Example format:
```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

### 3. Slack (Optional - for notifications)
**Create Slack Bot:**
1. Go to https://api.slack.com/apps
2. Create New App → From scratch
3. Add OAuth Scopes: `chat:write`, `channels:read`
4. Install to workspace
5. Copy Bot User OAuth Token (starts with `xoxb-`)
6. Replace `YOUR_SLACK_BOT_TOKEN` in the config

### 4. Remove Figma MCP
Not needed - we generate UI code directly

## Quick Setup Commands

After getting your API keys, run these commands to update your config:

```bash
# Install Composio CLI (optional, for managing integrations)
npm install -g composio-core

# Login to Composio (optional)
composio login

# List available integrations
composio apps

# Connect specific apps (examples)
composio add github
composio add linear
composio add notion
```

## Updated Configuration

Here's what your claude_desktop_config.json should look like:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/gabrielmagalhaes/Desktop/gab-ai-freelaw"]
    },
    "git": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-git"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "YOUR_GITHUB_TOKEN_HERE"
      }
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@executeautomation/playwright-mcp-server"]
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp-server"]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"]
    },
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase@latest"],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "YOUR_SUPABASE_ACCESS_TOKEN"
      }
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@henkey/postgres-mcp-server"],
      "env": {
        "DATABASE_URL": "YOUR_POSTGRES_CONNECTION_STRING"
      }
    },
    "composio": {
      "command": "npx",
      "args": ["-y", "@composio/mcp-server"],
      "env": {
        "COMPOSIO_API_KEY": "YOUR_COMPOSIO_API_KEY"
      }
    },
    "slack": {
      "command": "npx",
      "args": ["-y", "@mkusaka/mcp-server-slack-notify@latest"],
      "env": {
        "SLACK_BOT_TOKEN": "YOUR_SLACK_BOT_TOKEN",
        "SLACK_DEFAULT_CHANNEL": "#general"
      }
    }
  }
}
```

## Testing MCPs

After updating the config and restarting Claude:

1. Test filesystem: Should already work
2. Test git/github: Should already work with your token
3. Test Supabase: Should already work with your token
4. Test Composio: `composio apps` (after setup)
5. Test Postgres: Query your database
6. Test Slack: Send a test message

## Environment Variables for Your Project

Create `.env.local` in your project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database (same as Postgres MCP)
DATABASE_URL=your_postgres_connection_string

# Optional: Other integrations via Composio
# These are managed through Composio, not individual env vars
```
