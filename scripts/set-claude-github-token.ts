#!/usr/bin/env tsx
import fs from 'fs';
import os from 'os';
import path from 'path';

function getClaudeConfigPath() {
  const home = os.homedir();
  const mac = path.join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
  const win = path.join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json');
  const linux = path.join(home, '.config', 'Claude', 'claude_desktop_config.json');
  if (process.platform === 'darwin') return mac;
  if (process.platform === 'win32') return win;
  return linux;
}

function parseArgs() {
  const tokenArg = process.argv.find(a => a.startsWith('--token='));
  const token = tokenArg ? tokenArg.split('=')[1] : process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
  if (!token) {
    console.error('Missing token. Pass as --token=... or set env GITHUB_PERSONAL_ACCESS_TOKEN');
    process.exit(1);
  }
  return token;
}

function main() {
  const token = parseArgs();
  const cfgPath = getClaudeConfigPath();
  if (!fs.existsSync(cfgPath)) {
    console.error('Claude config not found at', cfgPath, '\nRun scripts/sync-claude-config.ts first.');
    process.exit(1);
  }
  const raw = fs.readFileSync(cfgPath, 'utf8');
  const json = JSON.parse(raw);
  json.mcpServers = json.mcpServers || {};
  json.mcpServers.github = json.mcpServers.github || { command: 'npx', args: ['-y', '@modelcontextprotocol/server-github'], env: {} };
  json.mcpServers.github.env = json.mcpServers.github.env || {};
  json.mcpServers.github.env.GITHUB_PERSONAL_ACCESS_TOKEN = token;

  // Backup
  const backup = cfgPath + '.' + Date.now() + '.bak';
  fs.copyFileSync(cfgPath, backup);
  fs.writeFileSync(cfgPath, JSON.stringify(json, null, 2));
  console.log('GitHub token set in Claude config. Backup saved at:', backup);
}

main();

