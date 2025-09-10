Claude → Codex Mapping

- Rules
  - Source of truth: .claude/CLAUDE.md
  - Codex mirror: .codex/CODEX_RULES.md (condensed; aligned to Codex tools)

- MCP Servers
  - Claude copy: claude_desktop_config.json (in repo)
  - Codex reference: .codex/mcp-servers.json (identical content for reuse)

- Permissions/Settings
  - Claude: .claude/settings.local.json
  - Codex: .codex/settings.local.reference.md (explains parity; no runtime enforcement in Codex)

- Setup & Troubleshooting
  - MCP-SETUP.md / MCP-RECOMMENDATIONS.md remain authoritative and apply equally.

Notes
- To avoid drift and large diffs, we reference large Claude files rather than duplicating them verbatim. Where duplication is small and stable (MCP servers), we provide a copy for convenience.
