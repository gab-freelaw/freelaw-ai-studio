Codex CLI Configuration Mirror

Purpose: Provide Codex CLI with the same working rules and MCP/server setup used by Claude Code, without duplicating large sources of truth.

Contents
- CODEX_RULES.md: Condensed, Codex‑adapted rules mirroring .claude/CLAUDE.md.
- mcp-servers.json: Copy of claude_desktop_config.json for reference.
- CONFIG_MAP.md: Pointer map from Claude files to Codex equivalents.
- settings.local.reference.md: Notes on permissions parity with Claude.

How To Use
- Rules: Follow .codex/CODEX_RULES.md during development.
- MCP: If you also run Claude Desktop, copy mcp-servers.json to your Claude config and set the GitHub token.
- Run: npm run dev, npx playwright test (or npm test), curl /api/health.

Notes
- .claude/CLAUDE.md remains the authoritative, detailed ruleset. The Codex version is a faithful, condensed mirror.
