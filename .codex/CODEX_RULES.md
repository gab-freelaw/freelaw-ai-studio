Codex CLI Rules (Mirror of Claude Code)

Non‑Negotiables
- Quality over speed; no broken code or unverified paths.
- Security first: no secrets in code; validate/sanitize inputs; enforce RLS.
- Single responsibility; small components/functions; prefer composition.
- Tests are part of the feature; add or update Playwright/Vitest.
- Follow existing patterns and house style.

Definition of Done (Condensed)
- Local verification of the exact path changed (UI/API/DB as relevant).
- Playwright/Vitest updated; ≥85% coverage on touched files when practical.
- Required env vars documented in .env.example.
- RLS/security considered for any new DB surface.

Operating Protocol (Codex‑adapted)
- Start by surveying context (rg, read files). When libraries/APIs are involved, consult project docs (Context7 if available).
- Think in acceptance tests first (Playwright paths), then implement.
- Maintain a lightweight plan with update_plan; keep exactly one in_progress step.
- Prefer Server Components by default; Client Components only when needed.
- Use Drizzle migrations for schema changes; avoid ad‑hoc SQL DDL.
- Add observability hooks where it matters (health endpoints, logs, analytics stubs).

Tool Order (Codex)
1) update_plan – create/maintain task steps and progress
2) shell – read repo with rg/ls/sed; run minimal commands; request escalation only if necessary
3) apply_patch – make focused, minimal diffs; avoid large changes (>300 LOC)
4) shell – run Playwright/Vitest (prefer precise targets); format as configured

Testing Strategy
- Prefer integration/E2E via Playwright; avoid brittle unit mocks.
- Cover happy paths + error states; avoid waitForTimeout; rely on auto‑waiting.
- Use the provided playwright.config.ts (webServer auto‑starts Next at :3000).

Data & Migrations
- All schema changes via Drizzle migrations.
- Idempotent seeds; no hidden data writes in app init.
- Consider RLS for new tables/queries; default‑deny policies.

Security & Compliance
- Secrets only via env vars; never commit real tokens.
- Validate on server (Zod/Valibot patterns); escape/encode UI content.
- Rate limit public APIs as needed; avoid leaking stack traces to clients.

Safety Guardrails
- No destructive commands without explicit confirmation.
- No long‑running or networked steps without clear justification.
- Keep diffs small and focused; match the codebase style.

References
- Authoritative rules: .claude/CLAUDE.md
- Health checks: app/api/health/route.ts
- AI/Models: lib/config/ai-models.ts, lib/services/model-selection
- Legal APIs: src/services/legal-api/*, src/app/api/legal/route.ts

