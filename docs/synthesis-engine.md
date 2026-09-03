# DEPUTY: Tool Synthesis & Trace Alignment Engine

This document details the deterministic algorithms, parameter inference heuristics, schema generators, and security rules powering `@deputy/synthesis`.

---

## 1. Multi-Demonstration Requirement (The Alignment Baseline)

DEPUTY enforces a non-negotiable principle:

> **A single demonstration cannot distinguish variable tool parameters from accidental constants or volatile tokens. Automatic tool synthesis requires at least two independent demonstrations of the same task.**

If an operator attempts to synthesize a tool from 1 demonstration, the engine halts with `INSUFFICIENT_EVIDENCE`.

---

## 2. Deterministic Alignment Algorithm

The `AlignmentEngine` aligns multi-step traces without an LLM:

1. **Sequence Matching**:
   The engine extracts the ordered array of `actionType`s from the baseline demonstration (longest sequence) and compares each subsequent demonstration against it.
2. **Action Compatibility**:
   Demonstrations must share common semantic action types. If two demonstrations have disjoint sets of actions (e.g. `customer.create` vs `customer.archive`), alignment is rejected with `Incompatible action sequences`.
3. **Optional Action Handling**:
   If an action appears in some demonstrations but is omitted in others (e.g. `followup.schedule`), the engine flags it as optional with an explicit alignment score penalty (15% per divergence).
4. **Argument Partitioning**:
   For each aligned step, the engine categorizes arguments across all observed demonstrations:
   - **`stableArguments`**: Values identical across every demonstration (e.g. `currency: "INR"`).
   - **`variableArguments`**: Values that vary across demonstrations (e.g. `name: ["Alice", "Bob"]`, `amount: [2500, 4200]`).

---

## 3. Parameter Inference & Volatile Token Filtering

The `ParameterInferenceEngine` transforms `variableArguments` into candidate tool parameters:

### Volatile Token Filtering

System-generated volatile fields must NEVER become user-facing tool parameters. The engine detects and ignores:

- `requestId`, `correlationId`, `idempotencyKey`
- `timestamp`, `time`, `createdAt`, `updatedAt`
- `nonce`, `token`, `sessionToken`, `sessionId`
- Technical entity primary keys (`_id`)

### Categorization

- `USER_INPUT`: Empirical parameters entered by the human operator that vary across tasks.
- `IDENTIFIER`: Customer or resource references.
- `STABLE_CONSTANT`: Hardcoded defaults (preserved in metadata).
- `VOLATILE_METADATA`: Ephemeral tokens (excluded from schema).

### Deterministic Human-Readable Naming

The engine derives semantic parameter names from the entity noun and argument key:

- `customer.create` + `name` ➔ `customerName`
- `customer.create` + `email` ➔ `customerEmail`
- `invoice.create` + `amount` ➔ `invoiceAmount`

### Type Inference & Schema Preservation

1. **Authoritative ActionRegistry Schemas**: If the registered action defines types, formats (`email`), or constraints (`minimum: 0`), those constraints are strictly preserved.
2. **Empirical Inference**: Numbers, booleans, arrays, objects, and strings are identified through type inspection.

---

## 4. Multi-Action Tool Composition

A synthesized `LearnedTool` can represent multiple sequential actions (e.g. `customer.create` followed by `invoice.create`):

```json
{
  "toolId": "tool_create_customer_with_invoice_8f3d1a",
  "name": "create_customer_with_invoice",
  "executionBinding": {
    "type": "COMPOSITE_ACTION",
    "actions": [
      {
        "actionId": "customer.create",
        "actionVersion": 1,
        "stepOrder": 0,
        "parameterMapping": {
          "customerName": "name",
          "customerEmail": "email"
        }
      },
      {
        "actionId": "invoice.create",
        "actionVersion": 1,
        "stepOrder": 1,
        "parameterMapping": {
          "invoiceAmount": "amount"
        }
      }
    ]
  }
}
```

---

## 5. Conservative Risk & Reversibility Aggregation

Composed capabilities inherit the most restrictive properties of their constituent actions:

### Risk Hierarchy (`LOW` < `MEDIUM` < `HIGH` < `CRITICAL`)

- `LOW + MEDIUM = MEDIUM`
- `LOW + HIGH = HIGH`
- `MEDIUM + CRITICAL = CRITICAL`

### Reversibility Hierarchy (`REVERSIBLE` < `COMPENSATABLE` < `IRREVERSIBLE`)

- `REVERSIBLE + COMPENSATABLE = COMPENSATABLE`
- `COMPENSATABLE + IRREVERSIBLE = IRREVERSIBLE`

### Human Authorization Policy

If the aggregated risk is `HIGH` or `CRITICAL`, or if reversibility is `IRREVERSIBLE`, the tool automatically requires explicit cryptographic human authorization before any agent execution.
