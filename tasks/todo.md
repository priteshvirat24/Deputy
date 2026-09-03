## Task: DEPUTY — WebMCP Challenge submission hardening
## Goal: Correct the WebMCP API surface, make retirement real, ship a licensed, deployed, driveable submission.

### Part A — Blockers
- [x] A1 — resolveModelContext() (document → navigator → window.webMCP; never throws); all host access routed through it; stale UI copy updated (banner, DashboardView, ToolsView, integration docs). Live banner confirms.
- [x] A2 — Signal-based retirement: registerTool(tool,{signal}); retire by abort; unregisterTool legacy fallback only. Invariant #14 re-verified end to end; webmcp-integration.md corrected to match code.
- [x] A3 — LICENSE (MIT) + license field in all 10 manifests + README reference.
- [x] A4.1 — SERVE_STATIC single-origin static serving + SPA fallback (never swallows /api/*). Driven locally (/, /tools, /api 404).
- [x] A4.2 — Prod env guard: refuses localhost RP_ID / non-https ORIGIN|WEBAUTHN_ORIGIN. Verified (blocks boot loudly).
- [x] A4.3 — Deployed to Render (sponsor): https://deputy-webmcp.onrender.com (Node runtime, in-memory, single-origin; WebAuthn config derived from RENDER_EXTERNAL_HOSTNAME).
- [~] A4.4 — Drove the DEPLOYED URL end to end UP TO the structured refusal: land → seeded tools → agent proposes irreversible → REQUIRE_HUMAN_AUTHORIZATION with bound argumentDigest; changing one arg changes the digest (attestation void). PASSKEY → COMMIT → AUDIT is the human step (WebAuthn UV) — cannot be performed or faked by an agent; user agreed to do it.

### Part B
- [x] B1 — docs/demo-script.md (per-beat timings, opens on #288, argument-digest + hash-chain as on-screen material).
- [x] B2 — Agent's-Eye View panel (client-side WebMCPAdapter registers into resolved host; schemas + annotations + MCP hints; last proposal/refusal JSON). Verified in browser.
- [x] B3 — MCP annotation hints (readOnlyHint:false, destructiveHint from reversibility, idempotentHint declined). Advisory; surfaced in panel; tests added.
- [x] B4 — README top rewritten for a 300-word judge; invariants/tree below the fold.
- [x] B5 — docs/submission-answers.md (four graded questions; #3 = shared artifact of delegation).
- [x] B6 — Cold open: relative /api base, MEMORY seed on boot, refund tool proposable → refusal with no login/migration. CAVEAT: Render free tier cold-starts (~50s) after idle.
- [x] B7 — docs/spec-contributions.md (#288/#282 full, #267 stance, #105 proposal; honest about partial).

### Done criteria
- [x] pnpm typecheck && pnpm lint (0 errors) && pnpm test (175 passing) green.
- [x] Host-binding tests: resolution order, signal handoff, abort-based removal, hint derivation (17) + env guard (7).
- [~] Deployed URL driven end-to-end — driven to the structured refusal live; passkey→commit→audit is the human's step.

### Review
- Weakened claims: docs/webmcp-integration.md retirement steps corrected — standard hosts retire via the aborted signal, NOT unregisterTool (which is now legacy-only). README "0 warnings" → "0 errors" (40 pre-existing warnings). Test counts corrected to 175/19.
- Left for the human: record demo video (script ready); perform passkey→commit→audit on the live URL to complete A4.4; optionally add the video URL to the README slot.
- Live URL: https://deputy-webmcp.onrender.com
