#!/usr/bin/env tsx
import fs from 'fs';
import os from 'os';
import path from 'path';
import readline from 'readline';

function getClaudeConfigPath() {
  const home = os.homedir();
  const mac = path.join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
  const win = path.join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json');
  const linux = path.join(home, '.config', 'Claude', 'claude_desktop_config.json');
  if (process.platform === 'darwin') return mac;
  if (process.platform === 'win32') return win;
  return linux;
}

async function promptSecret(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    const onData = (char: Buffer) => {
      const key = char.toString('utf8');
      if (key === '\u0003') { // Ctrl+C
        process.exit(1);
      }
      // Prevent echo by reprinting asterisks
      if (key === '\r' || key === '\n') {
        process.stdout.write('\n');
      } else {
        process.stdout.write('*');
      }
    };
    process.stdin.on('data', onData);
    rl.question(question, (answer) => {
      process.stdin.off('data', onData);
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  const token = await promptSecret('Enter GitHub Personal Access Token: ');
  if (!token) {
    console.error('No token provided. Aborting.');
    process.exit(1);
  }
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
  console.log('\nGitHub token set in Claude config. Backup saved at:', backup);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

