# DEPUTY System Architecture & Technical Specification

## 1. Executive Architecture Overview

DEPUTY is a WebMCP-native platform that converts human task demonstrations into typed, parameterized agent capabilities while cryptographically ensuring that high-risk actions require explicit human authorization backed by hardware passkeys (FIDO2 WebAuthn User Verification).

```mermaid
flowchart TB
    subgraph UI["🖥️ CLIENT TIER (apps/web)"]
        DASH["Dashboard & Security Posture"]
        SYNTH_VIEW["Synthesis Studio View"]
        OPS_VIEW["Operations Console & Proposal Simulator"]
        PASSKEY_MODAL["Hardware WebAuthn Passkey Modal"]
        QUAR_VIEW["QUARANTINE Inspector View"]
        AUDIT_VIEW["Hash Chain Ledger & Integrity Inspector"]
    end

    subgraph WEBMCP_TIER["🌐 BROWSER WEBMCP HOST (@deputy/webmcp)"]
        NAV_HOST["navigator.modelContext / window.webMCP"]
        TOOL_DESC["Dynamic Tool Descriptors (Zero Eval)"]
        LIFECYCLE_MGR["Lifecycle Manager & AbortController"]
    end

    subgraph SERVER_TIER["⚙️ API & APPLICATION SERVER (apps/server)"]
        HTTP_ROUTES["Hono REST API Routes<br/>(/api/tools, /api/synthesis, /api/proposals, /api/authorizations, /api/executions)"]
        SECURITY_MW["Middleware Pipeline<br/>(Rate Limiting, Idempotency, Body Limit, Strict CORS)"]
    end

    subgraph SYNTHESIS_TIER["🔬 SYNTHESIS SUBSYSTEM (@deputy/synthesis)"]
        RECORDER["Demonstration Recording Machine<br/>(Semantic Action Interceptor)"]
        ALIGNER["Trace Alignment Engine<br/>(Dynamic vs Invariant Partitioning)"]
        INFERENCE["Parameter Inference & Volatile Filter"]
        SCHEMA_EMITTER["Strict Draft-07 JSON Schema Synthesizer"]
    end

    subgraph SECURITY_TIER["🛡️ SECURITY & GATEKEEPER (@deputy/security)"]
        QUARANTINE_ENV["QUARANTINE Content Boundary<br/>(ProvenanceTag, TrustClass, Budget Limits)"]
        POLICY_ENG["Deterministic Policy Engine<br/>(Risk Matrix & Policy Rules)"]
        CHALLENGE_BUILDER["Bound WebAuthn Challenge Generator<br/>SHA-256(version:toolId:toolVersion:digest:nonce)"]
        WEBAUTHN_CORE["FIDO2 WebAuthn Verification Core<br/>(Hardware User Verification Flag)"]
        ARG_CANON["Canonical JSON & SHA-256 Digest Verifier"]
        CONCURRENCY_LOCK["Atomic Single-Use State Machine<br/>(PENDING ➔ AUTHORIZED ➔ CONSUMED)"]
    end

    subgraph EXECUTION_TIER["⚡ EXECUTION SUBSYSTEM (@deputy/security)"]
        ACTION_REG["ActionRegistry (Sole Trusted Target)"]
        MUTATION["Application Effect Handlers<br/>(customer.create, invoice.create)"]
        COMPENSATION["Automated Compensation Engine<br/>(Reverse Action Rollback)"]
    end

    subgraph DATA_TIER["💾 PERSISTENCE & AUDIT LEDGER (@deputy/database)"]
        DB_DRIZZLE["PostgreSQL with Drizzle ORM"]
        AUDIT_STREAM["Cryptographic Hash-Chained Audit Stream<br/>SHA-256(previousHash + eventPayload)"]
    end

    %% Wiring
    UI <--> HTTP_ROUTES
    HTTP_ROUTES --> SECURITY_MW
    SECURITY_MW --> QUARANTINE_ENV

    RECORDER --> ALIGNER --> INFERENCE --> SCHEMA_EMITTER
    SCHEMA_EMITTER --> TOOL_DESC
    TOOL_DESC --> NAV_HOST
    NAV_HOST --> LIFECYCLE_MGR

    QUARANTINE_ENV --> POLICY_ENG
    POLICY_ENG --> CHALLENGE_BUILDER
    CHALLENGE_BUILDER --> WEBAUTHN_CORE
    WEBAUTHN_CORE --> CONCURRENCY_LOCK
    CONCURRENCY_LOCK --> ARG_CANON
    ARG_CANON --> ACTION_REG
    ACTION_REG --> MUTATION
    MUTATION -. "Failure" .-> COMPENSATION
    MUTATION --> AUDIT_STREAM
    AUDIT_STREAM --> DB_DRIZZLE
```

---

## 2. Core Architectural Subsystems

### Subsystem 1: Demonstration Recording & Alignment (`@deputy/synthesis`)

1. **Semantic Command Interception**: Intercepts typed application commands (`customer.create`, `invoice.create`) rather than fragile pixel coordinates or CSS selectors.
2. **Monotonic Sequencing**: Enforces strict ordering (`sequenceNumber === lastSequenceNumber + 1`) and idempotent duplicate rejection.
3. **Deterministic Alignment Engine**: Aligns 2+ demonstration traces, distinguishes variable inputs from stable constants, filters volatile metadata (`timestamp`, `requestId`, `nonce`), and generates strict draft-07 JSON Schema.

```mermaid
flowchart LR
    subgraph INPUT["Demonstration Inputs"]
        D1["Trace A (Alice, ₹2,500)"]
        D2["Trace B (Bob, ₹4,800)"]
    end

    subgraph PIPELINE["Deterministic Synthesis Pipeline"]
        ALIGN["1. Trace Alignment<br/>Match Action Signatures"]
        DIFF["2. Constant vs Dynamic Partitioning"]
        FILTER["3. Volatile Filter<br/>(Strip nonce, timestamp, requestId)"]
        SCHEMA["4. Strict JSON Schema<br/>(additionalProperties: false)"]
    end

    subgraph OUTPUT["Artifacts"]
        TOOL["LearnedTool<br/>- Tool Descriptor<br/>- Execution Binding<br/>- Input Schema"]
    end

    D1 & D2 --> ALIGN --> DIFF --> FILTER --> SCHEMA --> TOOL
```

---

### Subsystem 2: WebMCP Dynamic Browser Adapter (`@deputy/webmcp`)

1. **Zero Generated Code**: Generates declarative descriptors with execution closures dispatching strictly into the secure gatekeeper.
2. **Host Integration**: Binds dynamically to `navigator.modelContext` or `window.webMCP`.
3. **Lifecycle Retirement**: De-registers retired capabilities, triggers in-flight execution cancellation via `AbortController`, and dispatches `toolchange` broadcast notifications.

```mermaid
stateDiagram-v2
    [*] --> DRAFT: Synthesized
    DRAFT --> ACTIVE: Human Review & Approval
    ACTIVE --> DISABLED: Operator Disable
    DISABLED --> ACTIVE: Operator Enable
    ACTIVE --> RETIRED: Deprecated / Superceded
    DISABLED --> RETIRED: Deprecated
    RETIRED --> DELETED: Soft Purge

    note right of RETIRED
        Emits 'toolchange' event
        Aborts in-flight AbortSignals
        Removes descriptor from WebMCP host
    end note
```

---

### Subsystem 3: Hardware WebAuthn Passkey Authorization (`@deputy/security`)

1. **Cryptographically Bound Challenge**:
   $$\text{boundChallenge} = \text{SHA-256}(\text{"deputy-auth-v1:"} + \text{toolId} + \text{":"} + \text{toolVersion} + \text{":"} + \text{argumentDigest} + \text{":"} + \text{requestId} + \text{":"} + \text{nonce})$$
2. **User Verification (UV)**: Enforces biometric or hardware PIN verification for high-risk and irreversible capabilities (`userVerification: "required"`).
3. **Single-Use Atomic Consumption**: Enforces state transition `PENDING` ➔ `AUTHORIZED` ➔ `CONSUMED` with atomic test-and-set database guards, eliminating replay and double-spend race conditions.

```mermaid
stateDiagram-v2
    [*] --> PENDING: Challenge Issued (TTL: 5m)
    PENDING --> AUTHORIZED: WebAuthn Assertion Verified (UV Valid)
    PENDING --> EXPIRED: TTL Exceeded
    AUTHORIZED --> CONSUMED: Atomic Execution Lock Acquired
    AUTHORIZED --> EXPIRED: TTL Exceeded
    CONSUMED --> [*]: Execution Dispatched

    note right of CONSUMED
        Single-use guarantee.
        Re-submission throws
        ALREADY_CONSUMED error.
    end note
```

---

### Subsystem 4: QUARANTINE Boundary & Origin Security (`@deputy/security`)

1. **Structured Content Envelope**: All external and third-party data carries immutable provenance and taint flags (`QuarantinedContentPart`).
2. **Response Budgets**: Enforces strict byte (64 KB), character (50,000), item (100), and depth (6) limits.
3. **Origin Isolation**: Strict `new URL(origin).origin` host matching with deny-by-default cross-origin policy.

```mermaid
classDiagram
    class ProvenanceRecord {
        +string sourceUri
        +string sourceOrigin
        +Date ingestedAt
        +TrustClass trustClass
        +string integrityHash
    }

    class QuarantinedEnvelope {
        +string id
        +ProvenanceRecord provenance
        +any rawPayload
        +boolean isTainted
        +AdvisoryFlag[] flags
        +assertCannotElevatePrivilege()
        +enforceResponseBudget()
    }

    class TrustClass {
        <<enumeration>>
        HUMAN
        SYSTEM
        LEARNED_TOOL
        THIRD_PARTY
    }

    QuarantinedEnvelope *-- ProvenanceRecord
    ProvenanceRecord *-- TrustClass
```

---

### Subsystem 5: Composite Transactions & Compensation (`@deputy/security`)

For multi-step compound capabilities:

1. **Declarative Dataflow Resolution**: Step outputs feed into subsequent steps using `$steps[0].outputField` syntax.
2. **Static Forward Reference & Cycle Checking**: Validates topological ordering before dispatch.
3. **Automated Reverse Compensation**: When step $K$ fails in a multi-step workflow, the engine automatically dispatches registered compensation actions for steps $K-1 \dots 0$ in reverse order.

```mermaid
flowchart TD
    S0["Step 0: customer.create<br/>(Creates Customer ID: 101)"]
    S1["Step 1: invoice.create<br/>(Creates Invoice for Customer 101)"]
    S2["Step 2: payment.charge<br/>(Processes Card Charge)"]

    C1["Compensation 1: invoice.void<br/>(Voids Invoice)"]
    C0["Compensation 0: customer.delete<br/>(Removes Customer 101)"]

    S0 -->|Success| S1
    S1 -->|Success| S2

    S2 -.->|Payment Fails| C1
    C1 --> C0
    C0 --> OUTCOME["Final Status: COMPENSATED"]
```

---

### Subsystem 6: Cryptographic Hash-Chained Audit Ledger (`@deputy/database`)

The audit stream links every event via continuous SHA-256 hash chaining:
$$\text{hash}_n = \text{SHA-256}(\text{hash}_{n-1} + \text{canonicalJson}(\text{eventPayload}_n))$$

Any mutation, insertion, deletion, or reordering of historical records is immediately detected by `verifyIntegrity()`.

```mermaid
flowchart LR
    GENESIS["Genesis Hash<br/>SHA-256('deputy-audit-genesis')"]
    EV1["Event 1: Tool Registered<br/>hash1 = SHA-256(genesis + e1)"]
    EV2["Event 2: WebAuthn Authorized<br/>hash2 = SHA-256(hash1 + e2)"]
    EV3["Event 3: Action Executed<br/>hash3 = SHA-256(hash2 + e3)"]

    GENESIS --> EV1 --> EV2 --> EV3
```

---

## 3. Package Topology & Responsibilities

| Package             | Path                 | Responsibilities                                                                           |
| :------------------ | :------------------- | :----------------------------------------------------------------------------------------- |
| `@deputy/domain`    | `packages/domain`    | Pure domain entities, value objects, domain events, error hierarchy                        |
| `@deputy/schemas`   | `packages/schemas`   | Zod schemas, runtime validation contracts, canonical serializers                           |
| `@deputy/synthesis` | `packages/synthesis` | Recording machine, trace aligner, parameter inference, JSON schema emitter                 |
| `@deputy/webmcp`    | `packages/webmcp`    | WebMCP adapter, navigator host bindings, abort propagation, feature detection              |
| `@deputy/security`  | `packages/security`  | WebAuthn FIDO2 service, QUARANTINE boundary, policy engine, execution gate, ActionRegistry |
| `@deputy/database`  | `packages/database`  | PostgreSQL schema, Drizzle ORM queries, migrations, atomic concurrency repositories        |
| `@deputy/config`    | `packages/config`    | Environment contract, configuration parser, security constants                             |
| `@deputy/server`    | `apps/server`        | Hono REST API server, security middleware, health diagnostics                              |
| `@deputy/web`       | `apps/web`           | React 19 + Vite frontend console, WebAuthn passkey ceremony UI, trace inspector            |
