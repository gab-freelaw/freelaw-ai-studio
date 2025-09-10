Permissions Parity Notes (Codex)

- Claude Code permissions live in .claude/settings.local.json. We added:
  - Read(/Users/gabrielmagalhaes/Desktop/gab-ai-freelaw/**)

- Codex CLI does not enforce this JSON; the harness controls filesystem/network permissions (see environment_context at runtime).

- Treat .claude/settings.local.json as the authoritative allowlist for human review. Codex follows the same spirit: minimal privilege, explicit escalation when needed.
