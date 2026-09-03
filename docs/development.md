# DEPUTY Local Development Guide

## 1. Prerequisites

- **Node.js**: `v22.x` or higher
- **pnpm**: `v10.x` or `v11.x`
- **PostgreSQL**: `v15` or higher (optional for in-memory testing, required for local database persistence)

---

## 2. Getting Started

### 1. Clone & Configure Environment

```bash
# Copy example environment configuration
cp .env.example .env
```

Review `.env` variables:

- `PORT`: Port for backend HTTP server (default: `4000`)
- `HOST`: Host bind address (default: `127.0.0.1`)
- `DATABASE_URL`: PostgreSQL connection URI (default: `postgres://postgres:postgres@localhost:5432/deputy_dev`)
- `CORS_ORIGIN`: Allowed frontend origin (default: `http://localhost:5173`)
- `SESSION_SECRET`: Minimum 32-character secret key

### 2. Install Dependencies

```bash
pnpm install
```

---

## 3. Available Scripts

| Command             | Action                                                          |
| :------------------ | :-------------------------------------------------------------- |
| `pnpm dev`          | Starts both server and web frontend concurrently in watch mode  |
| `pnpm dev:server`   | Starts the backend Hono server with `tsx watch`                 |
| `pnpm dev:web`      | Starts the Vite frontend development server                     |
| `pnpm build`        | Compiles all packages, server, and client bundle for production |
| `pnpm test`         | Runs the Vitest test suite across all packages                  |
| `pnpm test:watch`   | Runs Vitest in interactive watch mode                           |
| `pnpm typecheck`    | Runs `tsc --noEmit` across all workspace project references     |
| `pnpm lint`         | Runs ESLint flat config validation                              |
| `pnpm format`       | Formats all source files with Prettier                          |
| `pnpm format:check` | Verifies formatting compliance without writing                  |
| `pnpm db:generate`  | Generates SQL migrations using `drizzle-kit`                    |
| `pnpm db:migrate`   | Applies SQL migrations against the target database              |

---

## 4. Running the Application

### Development Mode

```bash
pnpm dev
```

- **Frontend Web Shell:** Open [http://localhost:5173](http://localhost:5173) in your browser.
- **Backend API Gateway:** Accessible at [http://127.0.0.1:4000](http://127.0.0.1:4000).
- **Health Check:** [http://127.0.0.1:4000/api/health](http://127.0.0.1:4000/api/health).

---

## 5. Running Tests

DEPUTY contains comprehensive architectural boundary tests and API integration tests:

```bash
# Run all tests
pnpm test

# Run tests with code coverage
pnpm test:coverage
```

All 14 mandatory architectural tests are located in `tests/foundation-invariants.test.ts` and integration tests in `tests/api-integration.test.ts`.

---

## 6. Database Migrations

When running against a live PostgreSQL instance:

```bash
# 1. Generate migrations from Drizzle schema definitions
pnpm db:generate

# 2. Apply pending migrations
pnpm db:migrate
```

SQL migrations are stored cleanly in `packages/database/migrations/`.
