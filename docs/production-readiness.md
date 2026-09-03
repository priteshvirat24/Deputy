# DEPUTY Production Readiness & Operations Guide

This document defines the operational architecture, security requirements, and deployment procedures for running DEPUTY in production environments.

---

## 1. Production Deployment Topology

```text
       Internet / Autonomous Agents
                   │
                   ▼
       [ Reverse Proxy / TLS Termination ]
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
  [ Node.js Worker 1 ] [ Node.js Worker 2 ]
         │                   │
         ├───────────────────┤
         ▼                   ▼
  [ PostgreSQL 16 ]     [ Redis Cluster ]
  (Drizzle Repositories) (Distributed Rate Limit & Nonces)
```

- **Stateless Application Servers**: Server nodes do not maintain in-process locks for authorization decisions.
- **Distributed Atomic Correctness**: Authorization consumption is guaranteed by PostgreSQL row-level conditional updates (`UPDATE ... WHERE status = 'AUTHORIZED' ... RETURNING *`).
- **Hardware WebAuthn**: Cryptographic assertions are verified server-side against stored public keys and monotonically increasing signature counters.

---

## 2. Environment Variables Contract

| Variable              | Type                                    | Default            | Production Requirement                      |
| --------------------- | --------------------------------------- | ------------------ | ------------------------------------------- |
| `NODE_ENV`            | `production` \| `test` \| `development` | `development`      | Must be `production`                        |
| `PORT`                | number                                  | `4000`             | Port for HTTP API                           |
| `DATABASE_URL`        | string (URL)                            | -                  | Valid PostgreSQL connection string          |
| `REPOSITORY_MODE`     | `POSTGRES` \| `MEMORY`                  | `MEMORY`           | **Must be `POSTGRES`**                      |
| `ALLOW_IN_MEMORY_DEV` | boolean                                 | `false`            | Must remain `false` in production           |
| `RP_ID`               | string                                  | `localhost`        | Production domain (e.g. `deputy.internal`)  |
| `RP_NAME`             | string                                  | `DEPUTY Authority` | Human-readable authority name               |
| `WEBAUTHN_ORIGIN`     | string (URL)                            | -                  | HTTPS origin of the frontend                |
| `ALLOWED_ORIGINS`     | comma-separated list                    | -                  | Comma-separated list of permitted origins   |
| `SESSION_SECRET`      | string (min 32 chars)                   | -                  | Must not use the development default string |
| `RATE_LIMIT_BACKEND`  | `memory` \| `redis`                     | `memory`           | Set to `redis` in multi-worker topologies   |
| `REDIS_URL`           | string (URL)                            | -                  | Required when backend is `redis`            |

---

## 3. Database Migrations & Verification

To verify database readiness before launching the server:

```bash
# Check connectivity and verify all tables exist
pnpm db:check

# Generate new schema migration
pnpm db:generate

# Apply pending migrations to PostgreSQL
pnpm db:migrate
```

---

## 4. Cryptographic Hash Chain Audit Verification

DEPUTY links all audit events into a SHA-256 hash chain:
$$H_n = \text{SHA256}(H_{n-1} \parallel \text{CanonicalEventPayload}_n)$$

The integrity of the audit stream can be verified at any time using the `verifyIntegrity()` method:

```typescript
const { valid, totalEvents, tamperedEventId } = await auditRepo.verifyIntegrity();
if (!valid) {
  console.error(`Audit chain broken at event ${tamperedEventId}`);
}
```

---

## 5. Container Deployment

### Running with Docker Compose

```bash
# Start PostgreSQL and production server
docker compose up -d

# Verify health status
curl -f http://localhost:4000/api/health
curl -f http://localhost:4000/api/readiness
```
