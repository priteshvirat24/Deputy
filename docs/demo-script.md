# DEPUTY — Demo Video Script (< 3:00, with audio)

**Live URL:** https://deputy-webmcp.onrender.com
**One-sentence claim:** A human demonstrates a task once; DEPUTY turns it into a
typed WebMCP tool, and every irreversible call is refused until a human produces
a passkey assertion whose challenge is bound to the SHA-256 digest of the exact
tool, version, and arguments.

Total budget: **2:40** of content, ~20s of slack. Open on the failure, not the
feature. Show the argument-digest binding on screen — that is the thing no other
entrant will have.

---

## Beat 1 — The attack (0:00–0:20) · 20s

**Screen:** A naive "agent + page" build. The agent calls a tool, sees the
page's own **Approve** button, and clicks it itself. A receipt prints:
`approved_by: human ✓`.

**Voiceover:**
> "This is an open bug in the WebMCP spec's own tracker — issue #288. An agent
> called a tool, saw the page's Approve button, and clicked it. The receipt says
> a human approved. No human decided anything. This is the problem DEPUTY solves."

**On-screen caption:** `spec issue #288 — approval forgery`

---

## Beat 2 — The same attack against DEPUTY (0:20–0:40) · 20s

**Screen:** The identical agent flow, now against DEPUTY. The agent proposes the
irreversible tool. Instead of a button it can click, it receives a **typed
structured refusal** — raw JSON on screen:
```json
{ "refusal": true, "code": "AUTHORIZATION_REQUIRED",
  "reason": "Irreversible action requires human user-verification.",
  "requiredActions": ["Produce a WebAuthn UV assertion bound to the argument digest"] }
```

**Voiceover:**
> "Same attack, against DEPUTY. There is no Approve button in the DOM for the
> agent to press. The tool returns a typed refusal. Approval isn't a UI element —
> it's a cryptographic assertion the agent cannot manufacture."

**On-screen caption:** `no button to forge → structured refusal (spec issue #282)`

---

## Beat 3 — Demonstrate once, get a typed tool (0:40–1:20) · 40s

**Screen:** Operations Console. A human performs a task **once** — create a
customer, then bill an invoice. Stop recording. The Synthesis Studio aligns the
trace and emits a tool with a **generated JSON Schema**, typed parameters, and
reversibility/provenance metadata. The new tool appears live in the **Agent's-Eye
View** panel the instant it's synthesised.

**Voiceover:**
> "Here's where the capability comes from. A human does the task once. DEPUTY
> compares demonstrations, infers the parameters, and generates a typed WebMCP
> tool — schema, reversibility, provenance. The human authored a capability by
> doing their job. Watch it register into `document.modelContext` in real time."

**On-screen caption:** `demonstrate once → typed tool in document.modelContext`

---

## Beat 4 — Agent calls it; refusal → passkey → commit; then void it (1:20–2:00) · 40s

**Screen:**
1. Agent proposes the irreversible refund tool → structured refusal
   (`AUTHORIZATION_REQUIRED`).
2. Human taps the passkey. WebAuthn UV succeeds. A **single-use commit tool** is
   temporarily registered; the action executes exactly once.
3. **The key moment:** change ONE argument (amount `3500 → 3600`) and replay the
   same attestation. It's **rejected** — `ARGUMENT_DIGEST_MISMATCH`. Show the two
   digests side by side.

**Voiceover:**
> "The agent calls the tool. Refused. A human taps their passkey — and the
> challenge it signs is the SHA-256 digest of the exact tool, version, and
> arguments. Authorization succeeds; a single-use commit tool runs the action
> once. Now change one argument and try to reuse that same signature. Void. The
> attestation was bound to the old digest. You cannot move a human's approval to
> a different action."

**On-screen caption:** `challenge = SHA-256(tool : version : argumentDigest : requestId : nonce)`

---

## Beat 5 — Hash-chained audit (2:00–2:20) · 20s

**Screen:** The Audit view. Every event — proposal, refusal, authorization,
execution — is one link in a SHA-256 hash chain. Highlight the `prevHash → hash`
linkage and the recorded **argument digest** on the execution row.

**Voiceover:**
> "And all of it lands in a hash-chained, tamper-evident audit log. Delete or
> edit any row and verification fails. The receipt records what was actually
> authorized — the exact arguments — not 'approved by you.'"

**On-screen caption:** `append-only · SHA-256 chained · argument-digest on every execution`

---

## Shot list / prep checklist

- [ ] Seeded refund tool (`tool_refund_customer`, IRREVERSIBLE/HIGH) present on cold load.
- [ ] A registered passkey (virtual authenticator or platform authenticator) ready.
- [ ] Agent's-Eye View panel visible for Beats 3–4.
- [ ] Two browser states pre-staged for Beat 1 (naive) vs Beat 2 (DEPUTY).
- [ ] Digest comparison overlay for Beat 4 (old vs new argument digest).
- [ ] Record at 1080p+, audio normalized, captions burned in.

## What must be legible on screen (graded material)

1. The structured refusal JSON (Beat 2).
2. The tool appearing in `document.modelContext` (Beat 3).
3. The challenge = SHA-256(...argumentDigest...) binding (Beat 4).
4. `ARGUMENT_DIGEST_MISMATCH` when one argument changes (Beat 4).
5. The `prevHash → hash` audit linkage (Beat 5).
