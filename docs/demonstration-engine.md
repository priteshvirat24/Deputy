# DEPUTY: Demonstration Recording & Semantic Action Interception Engine

This document details the architectural design and operational mechanics of DEPUTY's demonstration capture subsystem.

---

## 1. Core Philosophy: Semantic Action Interception (Invariant 1)

DEPUTY rejects DOM automation, pixel coordinates, and brittle CSS selectors as the canonical representation of learned capabilities. In typical browser RPA systems, recording records:

```json
// FORBIDDEN IN DEPUTY: Brittle DOM Macros
{
  "event": "click",
  "selector": "div.form-row:nth-child(2) > button.btn-submit",
  "x": 421,
  "y": 742
}
```

Instead, DEPUTY captures **first-class semantic application commands**:

```json
// CANONICAL IN DEPUTY: Semantic Action Record
{
  "actionId": "act_1725372800000_104",
  "actionType": "customer.create",
  "actionVersion": 1,
  "arguments": {
    "name": "Alice Smith",
    "email": "alice@example.com",
    "currency": "INR"
  },
  "actor": { "id": "usr_lead_01", "type": "HUMAN", "role": "operations_lead" },
  "timestamp": "2026-09-03T14:15:00.000Z",
  "reversibility": "COMPENSATABLE",
  "sideEffects": ["Writes customer record", "Sends welcome email"],
  "provenance": {
    "source": "operations.console",
    "origin": "http://localhost:5173",
    "trustClass": "FIRST_PARTY"
  }
}
```

### The Ingestion Flow

```text
UI Interaction (Form submission / operational command)
       │
       ▼
Application Command (Strongly typed inputs)
       │
       ▼
ActionRegistry.execute(...) (Handler verification & execution)
       │
       ▼
Semantic Action Object Construction (Metadata, side effects, provenance)
       │
       ▼
RecordingStateMachine.ingestAction(...) (Sequence tracking & validation)
       │
       ▼
Demonstration Repository Persistence & Append-Only Audit Stream
```

---

## 2. Recording State Machine

Demonstration capture is governed by an explicit, auditable finite state machine implemented in `@deputy/synthesis/recording-machine.ts`:

```text
       ┌──────────┐
       │   IDLE   │
       └────┬─────┘
            │ startRecording()
            ▼
       ┌──────────┐   pause()     ┌──────────┐
       │RECORDING ├──────────────►│  PAUSED  │
       │          │◄──────────────┤          │
       └────┬─────┘   resume()    └────┬─────┘
            │                          │
            ├───────────────┐          │
            │ complete()    │ discard()│ discard()
            ▼               ▼          ▼
       ┌──────────┐    ┌─────────────────────┐
       │COMPLETING│    │      DISCARDED      │
       └────┬─────┘    └─────────────────────┘
            │
            ▼
       ┌──────────┐
       │COMPLETED │
       └──────────┘
```

### Transition Invariants

- `IDLE → RECORDING`: Initiates a new session with an incrementing sequence counter (`0`).
- `RECORDING ↔ PAUSED`: Suspends and resumes active semantic command interception.
- `RECORDING → COMPLETING → COMPLETED`: Freezes demonstration trace and marks it as immutable evidence.
- `COMPLETED → RECORDING`: **Strictly forbidden**. A completed demonstration cannot be retroactively augmented. A new demonstration session must be initiated.
- `DISCARDED → RECORDING`: **Strictly forbidden**.

---

## 3. Idempotent Ingestion & Monotonic Sequence Checking

To prevent network duplication, reordering, or trace corruption, the server enforces:

1. **Duplicate `actionId` Rejection**: If an `actionId` has already been recorded in the current session, it is immediately rejected with `400 Bad Request`.
2. **Monotonic Sequence Ordering**: Every ingested action must supply `sequenceNumber === lastSequenceNumber + 1`. Out-of-order or skipped actions fail closed, preserving deterministic trace causality.
3. **Session State Guard**: Ingestion is rejected unless the session is in the `RECORDING` state.

---

## 4. Demonstrations API Endpoints

- `POST /api/demonstrations/recording/start`: Initializes session and database record.
- `POST /api/demonstrations/:id/recording/action`: Ingests sequence-verified semantic action.
- `POST /api/demonstrations/:id/recording/pause`: Pauses recording.
- `POST /api/demonstrations/:id/recording/resume`: Resumes recording.
- `POST /api/demonstrations/:id/recording/complete`: Transitions to `COMPLETED` and seals trace.
- `POST /api/demonstrations/:id/recording/discard`: Transitions to `DISCARDED`.
- `POST /api/demonstrations/execute-action`: Core enterprise execution endpoint that executes commands through `ActionRegistry` and automatically captures semantic traces if a demonstration is active.
