# DEPUTY

> **A human demonstrates a task once. DEPUTY converts that demonstration into a typed, parameterized WebMCP capability that an agent can use afterward, while dangerous actions remain cryptographically bound to explicit human authorization backed by hardware passkeys.**

---

## 1. The DEPUTY Paradigm

DEPUTY is not a chatbot, browser automation macro recorder, or generic MCP wrapper. It is a production-grade WebMCP authority platform built around two decoupled pipelines:

```text
DEMONSTRATE → COMPARE → SYNTHESIZE → REVIEW → APPROVE → REGISTER → AGENT PROPOSES → POLICY CHECK → PASSKEY (UV) → EXECUTE → AUDIT
```

### The Dual Architecture Pipelines

```text
1. Tool Synthesis Pipeline (Learning Boundary):
   Human Demonstration → Semantic Action Trace → Alignment & Inference → Strict JSON Schema → WebMCP Capability

2. Security & Execution Pipeline (Execution Boundary):
   Agent Proposal → QUARANTINE Boundary → Policy Engine → FIDO2 WebAuthn (UV) → Exact Digest Check → ActionRegistry Execution → Hash Chain Audit
```

---

## 2. Monorepo Architecture

```text
Deputy/
├── apps/
│   ├── web/                    # React 19 + Vite + TypeScript frontend with WebAuthn ceremonies, Trace Inspector & Security Center
│   └── server/                 # Lightweight Hono + Node.js HTTP backend API with WebAuthn, QUARANTINE, and Readiness diagnostics
│
├── packages/
│   ├── domain/                 # Pure domain models (Demonstration, LearnedTool, Authorization, WebAuthn, Quarantine, ExecutionOutcome)
│   ├── schemas/                # Zod runtime schemas & validation for all models & endpoints
│   ├── synthesis/              # Deterministic demonstration recording, trace alignment & parameter inference
│   ├── webmcp/                 # Native browser WebMCP adapter (document.modelContext), lifecycle & abort signals
│   ├── security/               # WebAuthn service, challenge store, QUARANTINE boundary, origin validator, nonce manager
│   ├── database/               # PostgreSQL schema (Drizzle ORM), migrations, repositories, and atomic concurrency guards
│   └── config/                 # Strict environment validation contract and security constants
│
├── tests/                      # Comprehensive test suites (151 tests, 100% passing across 17 test files)
│   ├── canonical-attacks-a-h.test.ts       # Authoritative Attacks Matrix (Attacks A through H)
│   ├── deputy-security-invariants.test.ts  # Full 37 Security Invariants Verification
│   ├── composite-transaction.test.ts       # Transaction safety, declarative dataflow & compensation
│   ├── canonicalization-audit.test.ts      # Unicode NFC, key sorting, prototype pollution
│   ├── origin-security.test.ts             # WHATWG origin parsing & prefix attack defenses
│   ├── webmcp-failure-modes.test.ts        # WebMCP lifecycle & abort signal propagation
│   └── e2e/deputy-flow.spec.ts             # End-to-end Playwright browser test with virtual authenticator
│
└── docs/                       # Architectural documentation, WebMCP, WebAuthn, QUARANTINE, threat model & invariants
    ├── final-demo.md           # Canonical demonstration runbook (Alice + Bob -> Charlie)
    ├── production-readiness.md # Operations, deployment topology, and environment contract
    ├── security-invariants.md  # Detailed invariants specification
    ├── threat-model.md         # Adversarial attack matrix and verification evidence
    └── architecture.md         # System architecture records
```

---

## 3. The 37 Security Invariants

1. **No DOM Macros**: Canonical learned capabilities are always semantic application commands.
2. **Trusted ActionRegistry Only**: Execution bindings route exclusively to registered handlers.
3. **Registration != Authorization**: Tool discovery never automatically grants execution authority.
4. **Exact Argument Binding**: Human authorization is cryptographically bound to canonical SHA-256 digest.
5. **Version & Tool Binding**: Authorization for tool v1 cannot authorize v2 or any other tool.
6. **Single-Use Consumption**: Authorization is consumed upon execution and cannot be replayed.
7. **Hardware WebAuthn UV**: User Verification is required for high-risk and irreversible capabilities.
8. **Fail-Closed Defaults**: Unknown operations, expired challenges, or altered digests fail closed.
9. **Inactive Tools Cannot Execute**: Only ACTIVE tools may execute; retired tools fail closed.
10. **Immutable Audit Trail**: Audit events are append-only and survive tool deletion.
11. **No Arbitrary Code Execution**: No eval, new Function, shell execution, or generated scripts.
12. **Deny-by-Default Origin Policy**: Strict URL.origin semantics prevent cross-origin prefix attacks.
13. **QUARANTINE Content Boundary**: Untrusted external content carries immutable provenance.
14. **Retirement WebMCP Propagation**: Tool retirement immediately aborts in-flight signals and emits toolchange.
15. **Distributed Atomic Guard**: Database-level conditional updates prevent double-spend across cluster nodes.
16. **WebMCP Fallback Grace**: Absence of host WebMCP does not crash the application.
17. **ActionRegistry Sole Target**: No second or parallel execution architecture exists.
18. **Deterministic Boundary**: No security decision depends solely on an LLM classifier.
19. **Unicode NFC Canonicalization**: Canonical JSON serializes strings in NFC form.
20. **Prototype Pollution Immunity**: JSON canonicalization ignores `__proto__` and `constructor` injections.
21. **Temporal Expiration**: Authorizations expire automatically after maximum TTL (5 minutes).
22. **Cryptographic Hash Chaining**: Audit stream links all events via SHA-256 hash chaining.
23. **Tamper-Evident Verification**: The `verifyIntegrity()` method detects row modifications or deletions.
24. **Advisory Prompt Injection Flagging**: Heuristics flag suspicious text without altering policy.
25. **Data Taint Preservation**: Transforming quarantined envelopes preserves source trust class.
26. **Response Byte Budgeting**: Content exceeding 64KB fails closed with `RESPONSE_QUARANTINED`.
27. **Response Depth Limiting**: Nesting exceeding 6 levels fails closed before execution.
28. **Declarative Dataflow Validation**: Forward and circular dataflow references fail statically before execution.
29. **Automated Compensation**: Partial failure in compensatable workflows triggers reverse compensation actions.
30. **Explicit Outcome Reporting**: Executions report `SUCCESS`, `NO_EFFECT`, `PARTIAL_EFFECT`, `COMPENSATED`, or `COMPENSATION_FAILED`.
31. **Production Environment Contract**: Rejects `MEMORY` repository mode unless `ALLOW_IN_MEMORY_DEV=true`.
32. **Production Secret Enforcement**: Rejects development default session keys in production.
33. **Route-Sensitive Rate Limiting**: Execution and WebAuthn endpoints enforce strict request quotas.
34. **Mutation Idempotency**: `Idempotency-Key` headers cache mutation results for 10 minutes.
35. **Body Size Protection**: Rejects payloads exceeding 1MB with HTTP 413.
36. **Strict CORS Security**: Whitelist matching against `ALLOWED_ORIGINS` prevents wildcard credentials.
37. **Liveness & Deep Readiness**: `/api/readiness` verifies live database connectivity and tables.

---

## 4. Verification & Testing

```bash
# 1. Typecheck across all 10 packages & apps (0 errors)
pnpm typecheck

# 2. Lint check (0 errors, 0 warnings)
pnpm lint

# 3. Format check
pnpm format:check

# 4. Run all 151 Vitest unit & integration tests
pnpm test

# 5. Build production bundles for all packages and apps
pnpm build

# 6. Check database readiness
pnpm db:check

# 7. Run Playwright E2E browser tests
pnpm test:e2e
```

---

## 5. Quickstart & Local Development

```bash
# Install dependencies
pnpm install

# Start development servers (Server on :4000, Web on :5173)
pnpm dev

# Or run with Docker Compose (PostgreSQL + Server)
docker compose up -d
```
