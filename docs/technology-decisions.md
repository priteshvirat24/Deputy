# DEPUTY: Technology Decisions Record

This document records the foundational architectural and technology decisions made across the DEPUTY codebase.

---

## 1. WebAuthn: SimpleWebAuthn (`@simplewebauthn/server` & `@simplewebauthn/browser`)

### Context

High-risk and irreversible capabilities require physical human presence and cryptographic non-repudiation. Rolling a custom WebAuthn parser is error-prone and insecure.

### Decision

Adopted `@simplewebauthn/server` (pinned in `@deputy/security` and `@deputy/server`) and `@simplewebauthn/browser` (in `@deputy/web`).

### Rationale

- Spec-compliant implementation of FIDO2 / WebAuthn Level 3.
- Full support for User Verification (`userVerification: 'required'`), authenticator data parsing, signature counter tracking, and CBOR public key extraction.
- Allows overriding the cryptographic challenge with our exact canonical argument digest bound challenge.

---

## 2. WebMCP Integration: Pure Declarative Translation (Zero Generated Code)

### Context

Browser Model Context API (WebMCP) exposes tools to client-side AI models (`navigator.modelContext.registerTool`).

### Decision

Created `ToolDescriptorTranslator` in `packages/webmcp/src/tool-descriptor.ts` that converts persisted `LearnedTool` metadata into WebMCP descriptors. The execution closure never evaluates synthesized code or strings; it strictly dispatches into proposal, policy, authorization, and `ActionRegistry`.

### Rationale

- Eliminates code injection, eval vulnerabilities, and prototype pollution.
- Retains complete governance over tool discovery, in-flight cancellation via `AbortController`, and retirement notifications.

---

## 3. QUARANTINE: Deterministic Envelopes & Budgets vs LLM Classifiers

### Context

Autonomous agents are vulnerable to indirect prompt injection and payload inflation when processing untrusted content.

### Decision

Implemented `QuarantinedContentPart` with immutable `trustClass` and hard response budgets (64 KB, 50,000 characters, 6 levels of depth). Heuristic pattern classifiers are treated as strictly **advisory secondary signals**.

### Rationale

- No LLM classifier can guarantee zero false negatives.
- Deterministic response budgets prevent resource exhaustion and denial-of-service attacks.
- Enforcing trust boundaries at the execution gatekeeper ensures untrusted content cannot elevate privilege or invoke critical tools.

---

## 4. Origin Security: Strict WHATWG `URL.origin` Matching

### Context

Cross-origin tool exposure must prevent subdomain and prefix spoofing attacks (e.g. `https://example.com.attacker.com`).

### Decision

Adopted strict `new URL(rawOrigin).origin` parsing in `OriginValidator` and enforced deny-by-default for cross-origin access.

### Rationale

- Completely eliminates prefix and substring bypasses.
- Fails closed on malformed origins or unexpected protocols.
