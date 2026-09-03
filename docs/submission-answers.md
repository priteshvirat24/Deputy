# DEPUTY — WebMCP Challenge Written Answers

**Live URL:** https://deputy-webmcp.onrender.com
**Repository:** https://github.com/priteshvirat24/Deputy

---

## 1. Why is WebMCP a strong fit for this project?

DEPUTY's whole thesis is that a web page should expose *capabilities*, not a DOM
for an agent to poke at — which is exactly what WebMCP is for. The problem we
attack only exists because the alternative (agents driving the UI) lets an agent
click the page's own Approve button and forge a human decision. That is a live
bug in the WebMCP spec's own tracker (issue #288).

WebMCP gives us the three seams we need:

- **A typed tool surface** (`document.modelContext.registerTool`) so a learned
  capability is a schema + annotations an agent reads, never pixels it guesses at
  — Sarah Drasner's "give agents tools, not DOM."
- **A registration lifecycle** (register with an `AbortSignal`, retire by
  aborting it) so authority can be granted and revoked precisely, per tool, in
  flight.
- **A place to return structured refusals** instead of prose, so "no, produce a
  passkey assertion first" is machine-readable (spec issue #282).

Without WebMCP, DEPUTY would be a macro recorder bolted to a UI. With it, the
tool surface itself becomes the security boundary.

## 2. How does it improve the user experience?

For the **human**: they stop writing automation. They do their real task once —
create a customer, bill an invoice — and DEPUTY compiles the repeated semantic
workflow into a typed tool. Authoring a capability is now a side effect of doing
the job. And they get a hardware-backed guarantee: no agent can execute an
irreversible action in their name without their physical passkey, bound to the
*exact* arguments.

For the **agent**: it discovers real tools with schemas and annotations, gets
deterministic typed refusals instead of ambiguous errors, and never has to scrape
a UI or guess whether a button is safe to click.

For **both**, the Agent's-Eye View makes the shared surface legible: you see the
tools an agent sees, their schemas, and the last refusal as a typed object.

## 3. What becomes possible for humans + agents *together* that wasn't before?

This is the differentiator, and it is not "the agent does it for you."

**The tool surface itself becomes a shared artifact of delegation.** The human
authors capability by doing the work once; the agent's authority is bounded, at
the type level and cryptographically, by exactly what the human demonstrated and
attested to. Three things become possible that weren't:

1. **Authority you can bound to an argument, not just an action.** A human's
   approval is bound to the SHA-256 digest of the exact tool, version, and
   arguments. Change one argument and the attestation is void
   (`ARGUMENT_DIGEST_MISMATCH`). You can hand an agent a refund capability and
   know it cannot become a *different* refund. Approval is no longer a checkbox an
   agent can move; it is a signature over a specific act.

2. **Capability that a non-programmer produces by working.** The human never
   writes a schema. They demonstrate; DEPUTY infers parameters and generates the
   typed tool. The person who understands the task authors the capability — the
   agent executes within it.

3. **Delegation that is revocable and auditable in the open.** Tools retire by
   aborting the signal handed to the host; every proposal, refusal, assertion,
   and execution is one link in a hash-chained, tamper-evident log. Humans and
   agents share one accountable record of who authorized what.

The relationship is a partnership with a clear division of authorship and
authority: the human demonstrates and attests; the agent proposes and executes
within bounds; neither can forge the other's role.

## 4. How did you implement it?

A pnpm monorepo (TypeScript, ~17k LOC, 175 tests) with two decoupled pipelines.

**Synthesis (learning boundary).** `@deputy/synthesis` records demonstrations as
semantic action traces, aligns repeated demonstrations, infers stable constants
vs. variable parameters, and emits a strict JSON Schema. `@deputy/webmcp` turns a
learned tool into a WebMCP descriptor.

**WebMCP surface.** A single `resolveModelContext()` locates the host —
`document.modelContext` (canonical) → `navigator.modelContext` (deprecated alias)
→ `window.webMCP` (polyfill) — and never throws. The adapter registers each tool
with its `AbortController` signal (`registerTool(tool, { signal })`) and retires
by aborting it; `unregisterTool` remains only as a legacy fallback. Standard MCP
hints (`readOnlyHint`/`destructiveHint`) are derived from the reversibility
model; `idempotentHint` is deliberately omitted (undecidable from one
demonstration — issue #267). All advisory; authority is re-decided server-side.

**Security (execution boundary).** `@deputy/security` holds the policy engine,
the WebAuthn service, the argument-digest canonicalizer, the origin validator,
the nonce/replay manager, the QUARANTINE boundary, and the fail-closed execution
gate. An irreversible proposal returns a typed refusal; the WebAuthn challenge is
`SHA-256(version : toolId : toolVersion : argumentDigest : requestId : nonce)`.
Only a valid, single-use, digest-matched assertion registers a one-shot commit
tool. Everything lands in a SHA-256 hash-chained audit log.

**App.** A Hono + Node server (`@deputy/server`) exposes the API and, in
production, serves the built React 19 SPA at a single origin (WebAuthn requires
RP/origin agreement). A production env guard refuses to boot with a localhost RP
ID or non-HTTPS origin. Deployed on Render; the WebAuthn origin config is derived
from the platform hostname at boot.

**Verified end to end** on the live URL up to the structured refusal with the
bound argument digest; the passkey user-verification step is performed by a human
(by design — an agent cannot produce it).
