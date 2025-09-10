#!/usr/bin/env tsx
import fs from 'fs';
import os from 'os';
import path from 'path';

function getClaudeConfigPath() {
  const home = os.homedir();
  const mac = path.join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
  const win = path.join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json');
  const linux = path.join(home, '.config', 'Claude', 'claude_desktop_config.json');
  // Prefer mac path if exists, else fallback by platform
  if (process.platform === 'darwin') return mac;
  if (process.platform === 'win32') return win;
  return linux;
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function main() {
  const repoConfig = path.join(process.cwd(), 'claude_desktop_config.json');
  if (!fs.existsSync(repoConfig)) {
    console.error('claude_desktop_config.json not found in project root');
    process.exit(1);
  }

  const targetPath = getClaudeConfigPath();
  const targetDir = path.dirname(targetPath);
  ensureDir(targetDir);

  // Make a timestamped backup if file exists
  if (fs.existsSync(targetPath)) {
    const backup = targetPath + '.' + Date.now() + '.bak';
    fs.copyFileSync(targetPath, backup);
    console.log('Backup created at:', backup);
  }

  // Copy file
  fs.copyFileSync(repoConfig, targetPath);
  console.log('Claude Desktop config synced to:', targetPath);
}

main();

