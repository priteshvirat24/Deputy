# DEPUTY: End-to-End Tool Learning & Lifecycle Governance

This document walks through the complete end-to-end user and system lifecycle: from demonstrating an operational workflow to executing the synthesized WebMCP capability.

---

## 1. The Core Lifecycle

```text
Demonstrate Workflow Twice
   │ (Alice: create customer + 2500 invoice)
   │ (Bob: create customer + 4200 invoice)
   ▼
Alignment Engine (Deterministic step-by-step diff)
   ▼
Parameter Inference Engine (Extract variable fields, filter volatile tokens)
   ▼
JSON Schema Generator (Strict type constraints & additionalProperties: false)
   ▼
Synthesized Candidate Tool & Report (Inspectable confidence & citations)
   ▼
Human Review & Approval (Verify parameter mappings & metadata)
   ▼
Active WebMCP Tool (Dispatched via ActionRegistry with full authorization boundary)
```

---

## 2. Evidence Preservation & Provenance

Every parameter in a synthesized tool is linked back to the demonstration evidence that justified its creation. The `SynthesisReport` includes:

- Source demonstration identifiers
- Historical parameter values (`"Alice"` vs `"Bob"`, `2500` vs `4200`)
- Explanation of why each parameter exists
- List of stable constant values excluded from parameterization
- List of volatile system tokens filtered out

An operator or auditor can at any point answer:

> **"Why does parameter X exist, and what evidence supported its inclusion?"**

---

## 3. Human Review & Security Governance

Synthesized tools do NOT enter production automatically:

1. **Candidate State (`DRAFT`)**: Newly synthesized tools are held in a draft state awaiting human review.
2. **Permitted Edits**: An operator may edit the tool name, description, and parameter descriptions.
3. **Forbidden Edits**:
   - The human CANNOT change the execution binding to arbitrary JavaScript, shell scripts, or eval.
   - The human CANNOT drop required underlying action arguments unless a valid constant mapping exists.
4. **Activation**: Upon operator approval, the tool transitions to `ACTIVE`, is registered with the browser `WebMCPAdapter`, and an immutable audit record is appended.

---

## 4. Execution Boundary Guarantee (Invariant 2 & 11)

When an AI agent invokes the learned tool through WebMCP:

1. Arguments are validated against the generated JSON Schema.
2. If `riskLevel` is `HIGH` or `CRITICAL`, cryptographic human authorization is required.
3. The `ToolExecutor` steps through each action in the `COMPOSITE_ACTION` pipeline.
4. Arguments are mapped directly to registered handlers in the `ActionRegistry`.
5. No generated code is executed; no DOM replay takes place.
