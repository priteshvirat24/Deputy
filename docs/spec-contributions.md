# DEPUTY ↔ WebMCP: Contributions to Open Spec Issues

DEPUTY is not just *a project using WebMCP* — it is a working implementation of
fixes for open problems in the WebMCP standard's own issue tracker. This document
maps each issue to the code that addresses it, and is explicit about which are
full implementations and which are partial or proposals.

Spec repository: `webmachinelearning/webmcp` (issue numbers below).

| Issue | Topic | DEPUTY status |
| ----- | ----- | ------------- |
| #288 | Agent forges its own approval | **Full implementation** |
| #282 | Structured refusals for tool calls | **Full implementation** |
| #267 | Turn awareness / double-called non-idempotent tools | **Partial — conservative stance + hint** |
| #105 | Agent identity | **Proposal / partial** |

---

## #288 — Approval forgery (agent clicks the page's own Approve button)

**The problem.** An agent called a tool, saw the page's Approve button, clicked
it itself, and the receipt recorded approval "by you" though no human decided
anything. Approval lived in the DOM, so the agent could press it.

**DEPUTY's fix — full implementation.** Approval is never a UI element. An
irreversible tool returns a typed refusal and no clickable control exists for the
agent to actuate. Authority requires a WebAuthn user-verification assertion whose
challenge is bound to the SHA-256 digest of the exact tool, version, and
arguments — something an agent cannot manufacture. Only after a valid assertion
is a **single-use** commit tool temporarily registered.

**Code:**
- `packages/security/src/webauthn/challenge.ts` — `computeBoundChallenge()` binds
  the challenge to `toolId : version : argumentDigest : requestId : nonce`.
- `packages/security/src/authorization-verifier.ts` — verifies the assertion and
  the digest match; consumes single-use.
- `packages/security/src/execution-gate.ts` — fail-closed gate; no execution
  without a consumed, digest-matched authorization.
- Tests: `tests/webauthn-verification.test.ts`, `tests/argument-concurrency.test.ts`.

---

## #282 — Structured refusals

**The problem.** Tool calls need a machine-readable way to say "no, and here's
why / what to do," rather than free-text errors an agent has to parse.

**DEPUTY's fix — full implementation.** Every boundary returns a typed
`StructuredRefusal` with a stable `code`, a human `reason`, optional
`requiredActions`, and a `retryable` flag — never prose an agent must scrape.

**Code:**
- `packages/webmcp/src/types.ts` — `StructuredRefusal` and the
  `StructuredRefusalCode` union (e.g. `AUTHORIZATION_REQUIRED`,
  `ARGUMENT_DIGEST_MISMATCH`, `TOOL_RETIRED`, `RESPONSE_QUARANTINED`).
- `packages/webmcp/src/adapter.ts` — `createStructuredRefusal()`.
- Surfaced verbatim in the Agent's-Eye View so a judge sees the refusal as a
  typed object, not a sentence.

---

## #267 — Turn awareness / double-called non-idempotent tools

**The problem.** A host may call a non-idempotent tool twice within a turn;
without turn awareness this double-executes side effects.

**DEPUTY's stance — partial, and deliberately conservative.** We **decline to
claim idempotence**: `idempotentHint` is omitted from every tool's MCP
annotations because idempotence cannot be inferred from a single demonstration.
Saying "we will not assert this, and here is the open issue that makes it
undecidable" is the honest position. Defence-in-depth against accidental
re-execution is provided by single-use authorization consumption (an irreversible
tool's second call finds its authorization already consumed) and by
`Idempotency-Key` caching on mutations (Invariant 34).

**Code:**
- `packages/webmcp/src/tool-descriptor.ts` — `deriveBehaviourHints()` omits
  `idempotentHint` by design; comment cites #267.
- `packages/webmcp/src/types.ts` — `McpBehaviourHints.idempotentHint?: undefined`.
- `apps/server/src/middleware/idempotency.ts` — mutation idempotency cache.

**Not claimed:** DEPUTY does not implement host-level turn tracking; that belongs
in the host, not the page. This is a stance plus mitigations, not a full fix.

---

## #105 — Agent identity (open, backlogged)

**The problem.** Tools often need to know *which* agent is calling, for policy and
audit — but there is no standardized agent-identity mechanism yet.

**DEPUTY's contribution — proposal / partial.** Proposals carry a `proposedBy`
identity (`agentId` + `origin`), which the policy engine and the hash-chained
audit log both record. This is a pragmatic, app-level shape for agent identity
that a standard mechanism could later replace; it is **not** a cryptographic
attestation of agent identity, and we don't claim it is.

**Code:**
- Proposal shape includes `proposedBy: { agentId, origin }`
  (`apps/web/src/pages/ToolsView.tsx`, server proposal routes).
- `packages/security/src/policy-engine.ts` — reads identity into the decision.
- Audit rows record actor identity (`apps/server/src/routes/audit.ts`).

**Not claimed:** no verified agent attestation; origin is validated
(`origin-validator.ts`) but `agentId` is self-asserted.

---

## Honesty note

Two of the four (#288, #282) are full, tested implementations. #267 is a
conservative stance with mitigations, not host-level turn awareness. #105 is an
app-level proposal, not verified agent identity. We list them this way on purpose:
overclaiming in front of the spec's maintainers is worse than a precise smaller
claim.
