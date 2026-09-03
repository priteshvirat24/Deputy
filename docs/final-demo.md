# DEPUTY: Canonical Reference Demonstration Runbook

This document details the exact 10-step reference scenario demonstrating DEPUTY's complete capability lifecycle, from human demonstration to autonomous agent execution guarded by hardware passkey authorization.

---

## The Scenario: Onboarding & First Invoice

- **Demonstration 1 (Alice)**: Operator creates customer record for "Alice Smith" and issues initial invoice of ₹2,500.
- **Demonstration 2 (Bob)**: Operator creates customer record for "Bob Jones" and issues initial invoice of ₹4,200.
- **Synthesis**: DEPUTY infers the composite workflow `create_customer_with_invoice` with automatic compensation.
- **Autonomous Invocation (Charlie)**: Agent proposes creating customer "Charlie Brown" with a ₹4,200 invoice.
- **Policy Decision**: Workflow is classified as **HIGH RISK** and **COMPENSATABLE**, requiring mandatory human WebAuthn authorization.
- **Passkey Ceremony**: Operator authorizes with FIDO2 hardware passkey (User Verification).
- **Execution & Audit**: Single-use token is atomically consumed, actions execute through `ActionRegistry`, and an immutable event is written to the cryptographic hash chain.

---

## Step-by-Step Walkthrough

### Step 1: Alice Demonstrates

The human operator performs customer onboarding:

```bash
POST /api/demonstrations
{
  "demonstrationId": "demo_ops_alice",
  "actorId": "admin_usr_01",
  "taskDescription": "Create Customer and Bill Initial Invoice",
  "actions": [
    {
      "actionId": "act_01",
      "actionType": "customer.create",
      "arguments": { "name": "Alice Smith", "email": "alice@example.com" }
    },
    {
      "actionId": "act_02",
      "actionType": "invoice.create",
      "arguments": { "amount": 2500, "customerId": "cust_alice_smith" }
    }
  ]
}
```

### Step 2: Bob Demonstrates

The operator performs the identical workflow with different parameters:

```bash
POST /api/demonstrations
{
  "demonstrationId": "demo_ops_bob",
  "actorId": "admin_usr_01",
  "taskDescription": "Create Customer and Bill Initial Invoice",
  "actions": [
    {
      "actionId": "act_03",
      "actionType": "customer.create",
      "arguments": { "name": "Bob Jones", "email": "bob@example.com" }
    },
    {
      "actionId": "act_04",
      "actionType": "invoice.create",
      "arguments": { "amount": 4200, "customerId": "cust_bob_jones" }
    }
  ]
}
```

### Step 3: Synthesis Engine Aligns & Generates

Calling `POST /api/synthesis/candidates`:

1. Traces are aligned deterministically.
2. Constants vs variable arguments are inferred.
3. Declarative dataflow mappings are established: `step0.output.id -> step1.input.customerId`.
4. Compensation mapping is generated: `customer.create` is paired with `customer.archive`.
5. Strict JSON Schema is produced.

### Step 4: Capability Approval & Registration

The operator reviews the candidate tool and transitions it to `ACTIVE`.
It is immediately registered into the browser WebMCP runtime (`window.navigator.modelContext`).

### Step 5: Autonomous Agent Proposes Invocation

An external autonomous agent proposes invoking the tool for "Charlie Brown":

```bash
POST /api/tool-proposals
{
  "toolId": "tool_onboard_and_bill",
  "arguments": {
    "name": "Charlie Brown",
    "email": "charlie@example.com",
    "amount": 4200
  }
}
```

### Step 6: Policy Engine Evaluates

The policy engine evaluates risk:

- Risk level: `HIGH`
- Reversibility: `COMPENSATABLE`
- Policy rule: `REQUIRE_HUMAN_AUTHORIZATION`
  Returns structured response with challenge digest `092f...` and requests WebAuthn ceremony.

### Step 7: WebAuthn Passkey Ceremony

The operator confirms the exact semantic parameters in the browser modal and touches their hardware passkey.
The server verifies:

- Challenge signature & cryptographic binding to argument digest
- User Verification (`uv: true`)
- Credential counter increment
- Issues single-use token: `auth_sec_...`

### Step 8: Execution Gatekeeper & Atomic Consumption

The proposal is submitted for execution with the authorization token:

```bash
POST /api/tool-proposals/:id/execute
Headers: { "x-deputy-authorization-id": "auth_sec_..." }
```

1. `DrizzleAuthorizationRepository` atomically consumes authorization:
   ```sql
   UPDATE authorizations SET status = 'CONSUMED'
   WHERE id = $1 AND status = 'AUTHORIZED' AND argument_digest = $2
   RETURNING *;
   ```
2. Replay attempts immediately return `ALREADY_CONSUMED`.

### Step 9: ActionRegistry Execution & Dataflow

1. Step 1 executes `customer.create` -> returns `{ id: 'cust_charlie_brown' }`.
2. Dataflow engine maps `id` to `customerId` for Step 2.
3. Step 2 executes `invoice.create` -> returns `{ invoiceId: 'inv_123', status: 'ISSUED' }`.
4. Overall outcome: `SUCCESS`.

### Step 10: Cryptographic Audit Hash Chaining

An audit event is computed:

```text
previousEventHash = latestEvent.eventHash
eventHash = SHA256(previousEventHash + ":" + canonicalPayload)
```

The event is appended to the tamper-evident log stream.
