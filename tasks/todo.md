## Task: DEPUTY — WebMCP Challenge submission hardening
## Goal: Correct the WebMCP API surface, make retirement real, ship a licensed, deployed, driveable submission.

### Part A — Blockers
- [ ] A1 — resolveModelContext(): document.modelContext → navigator.modelContext → window.webMCP; never throws; route all host access through it; update stale UI copy
- [ ] A2 — Signal-based retirement: pass AbortSignal into registerTool options; retire by abort; unregisterTool only as legacy fallback; re-verify Invariant #14
- [ ] A3 — LICENSE (MIT) + license field in all 10 manifests + README reference
- [ ] A4 — Single-origin deploy: SERVE_STATIC static serving + SPA fallback, prod env guard (RP_ID/WEBAUTHN_ORIGIN), deploy to sponsor host, drive end to end in Chrome

### Part B
- [ ] B1 — docs/demo-script.md
- [ ] B2 — Agent's-Eye View panel (requires client-side host registration — currently absent)
- [ ] B3 — MCP annotation hints (readOnlyHint/destructiveHint/idempotentHint), advisory only
- [ ] B4 — README top rewrite
- [ ] B5 — docs/submission-answers.md
- [ ] B6 — 60-second cold open (seed data exists; relative API base needed)
- [ ] B7 — docs/spec-contributions.md

### Risks / open questions
- The WebMCPAdapter is only instantiated server-side (Node). No browser code path ever registers into document.modelContext. A1 fixes the resolver but the resolver is never called in a browser until B2 wires a client adapter. Flagged.
- apps/web hardcodes http://localhost:4000 in 19 places — breaks any deploy. Must become a relative /api base.

### Done criteria
- [ ] pnpm typecheck && pnpm lint && pnpm test green after each item
- [ ] Host-binding tests: resolution order, signal handoff, abort-based removal, hint derivation
- [ ] Deployed URL driven end-to-end in Chrome, not just built
