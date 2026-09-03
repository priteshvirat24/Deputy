# DEPUTY: Real Native WebMCP Integration

This document describes how DEPUTY integrates with the browser Model Context API (WebMCP) to dynamically expose human-taught tools to autonomous AI agents.

---

## 1. Dynamic Tool Discovery vs Hardcoded Tools

In traditional AI tool systems, tools are statically hardcoded at build time. DEPUTY turns this paradigm upside down:

> **Tools exposed to the AI agent in the browser did NOT exist when the application was compiled.**

When an operator demonstrates an operational workflow and approves the synthesized capability, DEPUTY translates the persisted `LearnedTool` into a live WebMCP tool descriptor and registers it with the host browser runtime.

```text
Database LearnedTool (Synthesized from human demonstration)
       │
       ▼
ToolDescriptorTranslator (Validates schema & creates trusted execution closure)
       │
       ▼
WebMCPAdapter.registerTool(...)
       │
       ▼
navigator.modelContext.registerTool(...) / window.webMCP.registerTool(...)
       │
       ▼
Agent receives 'toolchange' event and discovers 'create_customer_with_invoice'
```

---

## 2. Tool Descriptor Safety: Zero Generated Code

A common vulnerability in automated learning systems is arbitrary code generation (`eval`, `new Function`, or dynamically synthesized JavaScript). DEPUTY eliminates this attack surface entirely:

1. **Declarative Metadata**: A `LearnedTool` contains only JSON Schema, parameter mappings, and an explicit `APPLICATION_ACTION` or `COMPOSITE_ACTION` identifier.
2. **Safe Execution Closure**: The WebMCP tool definition closure executes zero synthesized code:
   ```typescript
   // Inside packages/webmcp/src/tool-descriptor.ts
   execute: async (parameters: Record<string, unknown>, externalSignal?: AbortSignal) => {
     // Enforces tool state is ACTIVE
     // Enforces lifecycle abort signals
     // Dispatches strictly into proposal -> policy -> authorization -> ActionRegistry
     return dispatcher.dispatch(tool, parameters, abortController.signal);
   };
   ```
3. **The ActionRegistry Boundary**: The browser WebMCP capability can only route calls to pre-registered, auditable application actions.

---

## 3. Dynamic Lifecycle & In-Flight Abort Signals

Tool lifecycle states:

- `DRAFT`: Under review, not exposed to WebMCP.
- `ACTIVE`: Registered and callable via `navigator.modelContext`.
- `DISABLED` / `RETIRED` / `DELETED`: Immediately de-registered.

### Instant In-Flight Cancellation

When an administrator retires or disables a tool (`adapter.retireTool(toolId)`):

1. The tool's dedicated `AbortController` triggers `abort('Tool retired by lifecycle governance')`.
2. Any in-flight execution asynchronously halts via the linked `AbortSignal`.
3. The tool is removed from active registrations.
4. If native browser APIs are present, `navigator.modelContext.unregisterTool(name)` is called.
5. A `toolchange` event (`action: 'RETIRED'`) is broadcast to subscribers.
6. Any subsequent invocation returns a structured refusal: `TOOL_RETIRED`.

---

## 4. Host Environment Support & Graceful Fallback

DEPUTY supports multiple runtime environments without crashing:

- **Native Browser**: Binds directly to `navigator.modelContext` or `window.webMCP`.
- **Headless / Node.js / SSR / Vitest**: Automatically falls back to an in-memory capability provider (`provider: 'NONE'`), allowing full verification in headless CI/CD without polyfills.
