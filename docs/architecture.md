# DEPUTY System Architecture

## 1. System Overview

DEPUTY is a WebMCP-native platform that converts human task demonstrations into typed, parameterized agent capabilities while cryptographically ensuring that high-risk actions require explicit human authorization backed by hardware passkeys.

```text
Human Demonstration (Two or more distinct task traces)
        │
        ▼
Semantic Action Trace (customer.create, invoice.create)
        │
        ▼
Deterministic Synthesis (Trace Alignment & Parameter Inference)
        │
        ▼
Typed Learned Tool (Strict JSON Schema, additionalProperties: false)
        │
        ▼
WebMCP Dynamic Registration (navigator.modelContext / window.webMCP)
        │
        ▼
Agent Tool Proposal
        │
        ▼
QUARANTINE / Provenance / Response Budget / Origin Policy
        │
        ├───────────────────────────────┐
        │                               │
        ▼                               ▼
   Autonomous Execution          Human Authorization
   (Low Risk / Reversible)       (WebAuthn Hardware UV Assertion)
        │                               │
        └───────────────┬───────────────┘
                        ▼
       Exact Canonical Argument Binding & Atomic Single-Use Consumption
                        │
                        ▼
               Trusted ActionRegistry
                        │
                        ▼
             Trusted Application Effect
                        │
                        ▼
          Immutable Append-Only Audit Stream
```

---

## 2. Core Subsystems

### Subsystem 1: Demonstration Recording & Alignment (`@deputy/synthesis`)

1. **Semantic Command Interception**: Intercepts typed application commands (`customer.create`, `invoice.create`) rather than fragile pixel coordinates or CSS selectors.
2. **Monotonic Sequencing**: Enforces strict ordering (`sequenceNumber === lastSequenceNumber + 1`) and idempotent duplicate rejection.
3. **Deterministic Alignment Engine**: Aligns 2+ demonstration traces, distinguishes variable inputs from stable constants, filters volatile metadata (`timestamp`, `requestId`, `nonce`), and generates strict draft-07 JSON Schema.

### Subsystem 2: WebMCP Dynamic Browser Adapter (`@deputy/webmcp`)

1. **Zero Generated Code**: Generates declarative descriptors with execution closures dispatching strictly into the secure gatekeeper.
2. **Host Integration**: Binds dynamically to `navigator.modelContext` or `window.webMCP`.
3. **Lifecycle Retirement**: De-registers retired capabilities, triggers in-flight execution cancellation via `AbortController`, and dispatches `toolchange` broadcast notifications.

### Subsystem 3: Hardware WebAuthn Passkey Authorization (`@deputy/security`)

1. **Cryptographically Bound Challenge**:
   `SHA-256("deputy-auth-v1:" + toolId + ":" + toolVersion + ":" + argumentDigest + ":" + requestId + ":" + nonce)`
2. **User Verification (UV)**: Enforces biometric or hardware PIN verification for high-risk and irreversible capabilities.
3. **Single-Use Atomic Consumption**: Enforces state transition `PENDING` ➔ `AUTHORIZED` ➔ `CONSUMED` with atomic test-and-set guards, eliminating replay and double-spend race conditions.

### Subsystem 4: QUARANTINE Boundary & Origin Security (`@deputy/security`)

1. **Structured Content Envelope**: All external and third-party data carries immutable provenance and taint flags (`QuarantinedContentPart`).
2. **Response Budgets**: Enforces strict byte (64 KB), character (50,000), item (100), and depth (6) limits.
3. **Origin Isolation**: Strict `new URL(origin).origin` host matching with deny-by-default cross-origin policy.

---

## 3. Package Structure

| Package              | Responsibility                                                                                                                   |
| :------------------- | :------------------------------------------------------------------------------------------------------------------------------- |
| `packages/domain`    | Pure TypeScript domain models (Demonstration, LearnedTool, Authorization, WebAuthn, Quarantine, Audit).                          |
| `packages/schemas`   | Zod validation schemas enforcing strict runtime contracts across the entire system.                                              |
| `packages/synthesis` | Deterministic demonstration recording machine, trace alignment, parameter inference, and schema generation.                      |
| `packages/webmcp`    | WebMCP adapter, tool descriptor translator, feature detection, in-flight abort signals, and structured refusals.                 |
| `packages/security`  | WebAuthn service, bound challenge generator, QUARANTINE engine, response budgets, origin validator, and execution gatekeeper.    |
| `packages/database`  | Drizzle ORM PostgreSQL schema, SQL migrations, repository contracts, and atomic concurrency guards.                              |
| `packages/config`    | Strict runtime environment validation and security constants.                                                                    |
| `apps/server`        | Hono REST API server exposing WebAuthn, tools, demonstrations, synthesis, proposals, and audit endpoints.                        |
| `apps/web`           | Modern React UI with Operations Console, Tool Synthesis Studio, Hardware Passkey Ceremony Modal, and Security Posture Dashboard. |
