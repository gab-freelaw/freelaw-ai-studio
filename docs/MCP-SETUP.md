# MCP Setup Instructions

## Quick Installation Commands

Run these commands to install the MCPs globally:

```bash
# Install Playwright MCP
npm install -g @executeautomation/playwright-mcp-server

# Or use Smithery for automated Claude Desktop setup
npx @smithery/cli install @executeautomation/playwright-mcp-server --client claude

# Install Context7 (check latest installation method from GitHub)
# https://github.com/upstash/context7
```

## Claude Desktop Configuration

### 1. Locate Configuration File

**macOS:**
```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows:**
```
C:\Users\{yourusername}\AppData\Roaming\Claude\claude_desktop_config.json
```

### 2. Copy Configuration

Copy the contents from `claude_desktop_config.json` in this project to your Claude Desktop configuration file.

### 3. Update Tokens

Replace `YOUR_GITHUB_TOKEN_HERE` with your actual GitHub Personal Access Token if you want to use the GitHub MCP.

### 4. Restart Claude Desktop

**Important:** Completely close Claude Desktop and terminate any running processes before reopening.

## Verify Installation

After restarting Claude Desktop:
1. Look for the MCP indicator in the bottom-right corner of the conversation input
2. You should see "Attach from MCP" button
3. Click to confirm Playwright and Context7 MCPs are available

## Using Playwright MCP in Claude

Once configured, you can:
- Say "Use Playwright MCP to open browser to [website]"
- Request "Create E2E test for [feature] using Playwright"
- Ask "Take screenshot of [website] using Playwright"
- Request "Test API endpoint using Playwright"

## Using Context7 in Your Project

1. Visit https://context7.com/
2. Add your project to Context7 dashboard
3. Generate context documentation for your codebase
4. The MCP will automatically use this documentation

## Troubleshooting

### MCPs Not Showing
- Ensure Claude Desktop is completely closed (check Task Manager/Activity Monitor)
- Verify JSON syntax in configuration file
- Check that npx commands work in your terminal

### Playwright Issues
- Ensure you have Node.js installed
- Try running `npx @executeautomation/playwright-mcp-server` directly to test

### Context7 Issues
- Check the official GitHub repository for latest installation instructions
- Verify your Context7 dashboard setup