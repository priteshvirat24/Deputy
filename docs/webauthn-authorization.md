# DEPUTY: WebAuthn Hardware Passkey Transaction Authorization

This document details DEPUTY's real WebAuthn hardware passkey authorization subsystem, implemented using `@simplewebauthn/server` and `@simplewebauthn/browser`.

---

## 1. Authentication vs Transaction Authorization

Most web applications use WebAuthn solely for **login authentication** (proving identity at session start). DEPUTY uses WebAuthn for **transaction authorization**:

> **A hardware passkey assertion is cryptographically bound to the exact tool invocation and its exact parameters. Signing the assertion authorizes THAT specific action and nothing else.**

---

## 2. Cryptographic Challenge Construction

The WebAuthn ceremony does not issue an arbitrary or static challenge (e.g. `"approve"`). The server computes a challenge derived from the canonical representation of the proposed operation:

```typescript
const versionPrefix = 'deputy-auth-v1';
const canonicalString = [
  versionPrefix,
  toolId,
  String(toolVersion),
  argumentDigest, // SHA-256(canonical JSON of arguments)
  requestId,
  nonce, // 128-bit one-time cryptographic token
].join(':');

const boundChallenge = createHash('sha256').update(canonicalString, 'utf8').digest('base64url');
```

### Why This Prevents Tampering & Replay

1. **Argument Tampering**: If an attacker alters any argument (e.g. changing invoice amount from ₹2,500 to ₹90,000), `argumentDigest` changes, making the signed WebAuthn assertion cryptographically invalid.
2. **Version Tampering**: An assertion for tool version `v1` cannot be presented to invoke `v2`.
3. **Tool Substitution**: An assertion for `update_customer` cannot be presented to invoke `refund_customer`.
4. **Replay Protection**: The nonce is stored and consumed on first use; any re-submission fails with `NONCE_ALREADY_CONSUMED`.

---

## 3. The End-to-End Authorization Lifecycle

```text
       PENDING (Challenge generated, awaiting user touch)
          │
          ├── User Rejects / Cancels ────────► REJECTED
          │
          ├── 5-Minute Timeout ──────────────► EXPIRED
          │
          └── WebAuthn Verification (UV)
                   │
                   ▼
              AUTHORIZED (Hardware assertion verified by server)
                   │
                   ├── Atomic Single-Use Execution ──► CONSUMED
                   │
                   └── Admin Revocation ─────────────► REVOKED
```

### Single-Use Atomic Consumption

Authorization records cannot be reused:

- Once passed to `ToolExecutor`, the record transitions to `CONSUMED`.
- If two concurrent requests arrive simultaneously with the same authorization ID, the database transaction enforces atomic test-and-set locking: **exactly one request succeeds; the other fails with `ALREADY_CONSUMED`**.

---

## 4. User Verification (UV) Mandate

For any tool classified with:

- `riskLevel: 'HIGH'` or `'CRITICAL'`
- `reversibility: 'IRREVERSIBLE'`

DEPUTY enforces `userVerification: 'required'` during the WebAuthn options ceremony. Authenticators must perform biometric verification (Touch ID, Face ID, Windows Hello) or hardware PIN verification before producing the signature. Passive or unverified touches are rejected by the server verifier.
