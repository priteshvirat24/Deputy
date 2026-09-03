# DEPUTY Security Invariants

This document establishes the 18 non-negotiable security invariants for the **DEPUTY** system. Every layer of the architecture—from demonstration capture to execution gateways—strictly enforces these invariants.

---

### Invariant 1: No DOM Automation as Canonical Learned Capability

> **DEPUTY never treats DOM automation as the canonical learned capability.**
> Captures high-level, strongly-typed semantic application actions (`customer.create`, `invoice.create`) rather than fragile pixel coordinates or CSS selectors.

---

### Invariant 2: Explicit Trusted ActionRegistry

> **Learned tools can invoke only explicitly registered trusted application actions.**
> Execution bindings resolve exclusively to audited handlers pre-registered in `ActionRegistry`. Arbitrary side effects, network requests, or shell commands are strictly forbidden.

---

### Invariant 3: Tool Registration != Execution Authorization

> **Tool registration does not equal execution authorization.**
> Publishing a dynamic tool descriptor to WebMCP informs the agent of a capability, but does NOT grant permission to execute it. Autonomous vs authorized execution is governed by fail-closed policy checks.

---

### Invariant 4: Cryptographic Binding of Human Authorization

> **Human authorization is cryptographically bound to canonical arguments.**
> An authorization is bound to the tuple `(toolId, toolVersion, argumentDigest, nonce, actor, expiresAt)`. The argument digest is computed using a deterministic SHA-256 hash of canonicalized JSON.

---

### Invariant 5: Tool ID and Version Binding

> **Authorization is bound to exact tool ID and version.**
> Authorization issued for tool version `v1` cannot authorize `v2`. Authorization for `toolA` cannot authorize `toolB`.

---

### Invariant 6: Single-Use Authorization Consumption

> **Authorization is strictly single-use.**
> Once an authorization is presented to execute an action, it transitions to `CONSUMED`. Repeated attempts or concurrent race conditions fail closed (`ALREADY_CONSUMED`).

---

### Invariant 7: WebAuthn Hardware User Verification

> **WebAuthn User Verification is required for high-risk and irreversible capabilities.**
> High-risk (`HIGH`, `CRITICAL`) and irreversible (`IRREVERSIBLE`) tools enforce `userVerification: 'required'`, mandating biometric or hardware PIN verification on the physical authenticator.

---

### Invariant 8: Fail-Closed Defaults

> **Security failures fail closed.**
> Unknown tool IDs, altered digests, expired challenges, or missing authorizations default to rejection or mandatory human authorization.

---

### Invariant 9: Inactive Tools Cannot Execute

> **Inactive or retired tools cannot execute.**
> Only tools in `ACTIVE` state may be invoked. Tools in `DRAFT`, `DISABLED`, `RETIRED`, or `DELETED` states immediately reject execution.

---

### Invariant 10: Immutable Audit Independence

> **Deleting a tool does not erase its historical audit events.**
> The audit trail is append-only. Tool retirement or deletion preserves historical provenance, proposals, authorizations, and executions forever.

---

### Invariant 11: No Arbitrary Code Execution

> **Learned tools cannot execute arbitrary code.**
> DEPUTY forbids runtime code evaluation (`eval()`, `new Function()`, shell execution, or dynamic script injection). Synthesis produces declarative schemas and bindings, never code.

---

### Invariant 12: Deny-by-Default Origin Access

> **Origin access is deny-by-default.**
> Tools enforce strict `URL.origin` validation. Empty `originRestrictions` reject all cross-origin callers. Prefix attacks (`example.com.attacker.com`) are mathematically prevented.

---

### Invariant 13: QUARANTINE Untrusted Content Isolation

> **Untrusted provenance never silently becomes trusted provenance.**
> All external content carries an immutable `ProvenanceRecord` and `TrustClass`. Untrusted text is barred from elevating privileges or modifying execution bindings.

---

### Invariant 14: WebMCP Retirement Propagation

> **Tool retirement immediately propagates to the WebMCP surface.**
> Retiring a tool aborts in-flight execution signals via `AbortController`, removes the descriptor from the browser host, and emits a `toolchange` event.

---

### Invariant 15: Atomic Concurrency Protection

> **Concurrent authorization consumption cannot result in duplicate execution.**
> Simultaneous requests attempting to consume the same authorization undergo atomic test-and-set locking: exactly one succeeds; the other is rejected.

---

### Invariant 16: WebMCP Host Grace

> **WebMCP absence does not crash the application.**
> The adapter gracefully detects host availability. In environments lacking `navigator.modelContext`, it operates safely in local fallback mode.

---

### Invariant 17: ActionRegistry Sole Execution Target

> **The ActionRegistry is the only trusted execution target.**
> No secondary, parallel, or alternative execution pathways exist. Every tool proposal must traverse policy, authorization, and the `ActionRegistry`.

---

### Invariant 18: Deterministic Boundary Over LLMs

> **No security decision depends exclusively on an LLM classifier.**
> Heuristic prompt-injection detectors are strictly advisory. The primary security perimeter is deterministic: provenance, trust class, exact argument binding, response budgets, and WebAuthn.
