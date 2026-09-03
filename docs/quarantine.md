# DEPUTY: QUARANTINE Content Boundary & Origin Security

This document outlines the design, security invariants, and boundaries enforced by DEPUTY's QUARANTINE subsystem.

---

## 1. Core Philosophy: Why an LLM Classifier is NOT a Security Boundary

Many modern agent architectures attempt to prevent prompt injection by asking another LLM: _"Is this prompt safe?"_

DEPUTY rejects this approach as a primary security boundary:

> **An LLM classifier can never provide mathematical security guarantees. False negatives in a classifier can grant unauthorized execution authority.**

In DEPUTY:

1. Heuristic pattern detectors (e.g. searching for `"ignore previous instructions"`) are strictly **advisory secondary signals**.
2. The real, deterministic security boundary consists of:
   - **Immutable Provenance**: Every piece of content tracks where it came from.
   - **Strict Trust Classes**: Untrusted external data cannot grant execution rights.
   - **Response Budgets**: Hard limits on byte size, character counts, and nesting depth.
   - **Deny-by-Default Origin Policy**: Strict `URL.origin` matching.
   - **Hardware WebAuthn Gates**: High-privilege actions demand physical user touch.

---

## 2. Structured Content Envelope (`QuarantinedContentPart`)

External and untrusted data is never flattened into raw strings. It is wrapped in structured envelopes:

```typescript
export interface QuarantinedContentPart {
  type: 'text' | 'json' | 'reference';
  value: unknown;
  provenance: ProvenanceRecord;
  trustClass: TrustClass;
  taintFlags: string[];
}
```

### Trust Classes

- `FIRST_PARTY`: Data originated internally within DEPUTY's trusted domain.
- `SYSTEM_GENERATED`: System seeds and deterministic configuration.
- `USER_GENERATED`: Input provided by authenticated human operators.
- `THIRD_PARTY` / `EXTERNAL`: Partner APIs, web scraping results, customer feedback.
- `UNKNOWN`: Unauthenticated or unsigned data (fails closed immediately with `PROVENANCE_BLOCKED`).

---

## 3. Strict Response Budgets (Preventing Resource Exhaustion)

Untrusted or external tool responses must pass strict budget checks:

- **Maximum Bytes**: 64 KB (`65,536` bytes).
- **Maximum Characters**: 50,000 characters.
- **Maximum Structured Items**: 100 array items or object keys.
- **Maximum Nesting Depth**: 6 levels.

If an untrusted payload exceeds any budget, DEPUTY fails closed and returns:

```json
{
  "refusal": true,
  "code": "RESPONSE_QUARANTINED",
  "reason": "Response byte size (154200B) exceeds maximum allowed budget (65536B)."
}
```

DEPUTY never silently truncates payloads in a manner that could alter the semantic security meaning.

---

## 4. Origin Security: Eliminating Prefix Attacks

Learned tools enforce explicit cross-origin permissions:

- **Deny-by-Default**: A tool with an empty `originRestrictions` array rejects all cross-origin callers.
- **Strict `URL.origin` Semantics**: Origins are validated using standard WHATWG URL parsing.
  - Prefix attacks (e.g. `https://example.com.attacker.com` pretending to be `https://example.com`) are strictly rejected.
  - Subdomains must be explicitly permitted.
