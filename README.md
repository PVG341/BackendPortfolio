# Backend Portfolio — Rate Limiting, SQL Safety, API Security

A full-stack portfolio focused on backend API engineering and API security.
It demonstrates two Redis-backed rate-limiting algorithms, abuse protection,
an isolated SQL-injection sandbox, and a protected contact endpoint.

> Live demo:
>
> - Frontend (Vercel): [https://backend-portfolio-ten-tau.vercel.app](https://backend-portfolio-ten-tau.vercel.app)
> - Backend API (Render): [https://backend-portfolio-api-a85n.onrender.com/api/v1/health/ready](https://backend-portfolio-api-a85n.onrender.com/api/v1/health/ready)

## Highlights

- Fixed Window and Sliding Window Log with atomic Redis Lua scripts.
- Redis `TIME` as the only clock; no memory fallback when Redis is down.
- Per-session quotas plus HMAC-hashed IP and service-wide abuse quotas.
- SQL-injection comparison on a dedicated PostgreSQL database with a
  SELECT-only, read-only role, short statement timeout, and no arbitrary SQL
  endpoint.
- Contact form with exact-field validation, honeypot, dedicated rate limit,
  server-controlled recipient, plain-text Resend delivery, and generic errors.
- Shared TypeScript contracts used by the API and web client.
- Unit, integration, and e2e tests; Docker Compose for local infrastructure.

## Architecture

```text
Browser
  └─ Next.js :3000
       └─ fetch NEXT_PUBLIC_API_URL (http://localhost:3001/api/v1)
            └─ NestJS + Fastify :3001
                 ├─ Redis: sessions, fixed/sliding state, abuse quotas
                 ├─ PostgreSQL: isolated demo.users, read-only reader
                 └─ Resend: contact email
```

See [docs/architecture.md](file:///D:/This%20PC/Documents/Projects/Portfolio_backend_2/docs/architecture.md) and [docs/api-security.md](file:///D:/This%20PC/Documents/Projects/Portfolio_backend_2/docs/api-security.md).

## Tech stack

- Next.js 16, React 19, TypeScript
- NestJS 12, Fastify
- Redis 7 + Lua
- PostgreSQL 17 + pg
- Resend HTTP API
- Vitest, Docker Compose, pnpm workspace

## Quick start

### Prerequisites

- Node.js 24
- pnpm 12.11.2
- Docker Desktop (for Redis and PostgreSQL)

### 1. Install

```bash
pnpm install
```

### 2. Environment

Create `apps/api/.env` from `apps/api/.env.example` (or root `.env.example`) and fill in:

```env
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:3000
REDIS_URL=redis://127.0.0.1:6379
TRUST_PROXY_HOPS=0
ABUSE_KEY_NAMESPACE=portfolio
ABUSE_KEY_SECRET=<at-least-32-characters>
DEMO_DATABASE_URL=postgresql://portfolio_demo_reader:<reader-password>@127.0.0.1:5433/portfolio_demo
RESEND_API_KEY=<resend-api-key>
CONTACT_TO_EMAIL=<your-email>
CONTACT_FROM_EMAIL=onboarding@resend.dev
```

Create `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

For Docker Compose, create a root `.env` with the Postgres passwords, abuse secret, CORS origin, and Resend/contact values.

Never commit `.env` files.

### 3. Start infrastructure

```bash
docker compose -f compose.redis.yaml up -d --wait
```

### 4. Run

```bash
pnpm dev
```

- Web: `http://localhost:3000`
- API: `http://localhost:3001/api/v1`
- Readiness: `http://localhost:3001/api/v1/health/ready`

## API

Base path: `/api/v1`.

| Method | Path                            | Success      | Main errors           |
| ------ | ------------------------------- | ------------ | --------------------- |
| GET    | /health                         | 200 status   | –                     |
| GET    | /health/live                    | 200 alive    | –                     |
| GET    | /health/ready                   | 200 ready    | 503                   |
| POST   | /playground/rate-limit/session  | 201 session  | 400 / 429 / 503       |
| POST   | /playground/rate-limit/request  | 200 decision | 400 / 410 / 429 / 503 |
| DELETE | /playground/rate-limit/session  | 204          | 400 / 429 / 503       |
| POST   | /playground/sql-injection/query | 200 rows     | 400 / 429 / 503       |
| POST   | /contact                        | 202 accepted | 400 / 413 / 429 / 503 |

Rate-limit response headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`; 429 adds `Retry-After`.

### Rate limiting

- `fixed`: Redis hash per bucket, atomic Lua check/update/expiry.
- `sliding`: Redis sorted set of accepted timestamps, `ZREMRANGEBYSCORE`, oldest request drives `Retry-After`.
- Both use Redis `TIME`, not the application clock.
- Redis unavailable returns 503; there is no memory fallback.

### SQL injection sandbox

- Dedicated PostgreSQL database with fictional users.
- API connects as `portfolio_demo_reader`.
- Reader has `SELECT` on `demo.users` only, `default_transaction_read_only=on`, `statement_timeout=250ms`, and a connection limit.
- API opens `BEGIN READ ONLY`, sets `SET LOCAL statement_timeout`, and releases the client in `finally`.
- Input is bounded printable ASCII, 1–64 characters, with `;` rejected.
- `safe` uses `$1`; `unsafe` is deliberately concatenated for education only.
- No endpoint accepts arbitrary SQL.
- Database/provider errors are normalized; no stack traces or SQL are returned.

### Contact

- Exact fields: `name`, `email`, `message`, optional `website` honeypot.
- Recipient always comes from `CONTACT_TO_EMAIL`; client input never controls it.
- Plain-text email only; visitor email is used as `Reply-To`.
- Provider errors return a generic 503; secrets and provider responses are not exposed.
- Dedicated abuse quota: 3 requests/IP/minute and 30/service/minute.

## Tests

```bash
pnpm check          # format, lint, typecheck, unit tests, build
pnpm test:e2e       # Redis + PostgreSQL required
```

Current verified baseline:

- 72 contract tests
- 2 web tests
- 20 API unit tests
- 47 e2e tests (when Redis & Postgres are running)
- Next.js production build passes (Vercel / online build)

See [docs/verification.md](file:///D:/This%20PC/Documents/Projects/Portfolio_backend_2/docs/verification.md).

## Scripts

| Command          | Purpose                                    |
| ---------------- | ------------------------------------------ |
| `pnpm dev`       | build contracts, run web + API             |
| `pnpm build`     | contracts + API + web production build     |
| `pnpm test`      | contracts + web + API unit tests           |
| `pnpm test:e2e`  | API e2e tests                              |
| `pnpm check`     | format check, lint, typecheck, test, build |
| `pnpm format`    | Prettier write                             |
| `pnpm lint`      | ESLint + Oxlint                            |
| `pnpm typecheck` | all workspace typechecks                   |

## Project structure

```text
apps/
  api/       NestJS + Fastify API
  web/       Next.js portfolio and playgrounds
packages/
  contracts/ shared types and strict parsers
docker/
  sql/       isolated demo schema and reader role
docs/        architecture, security, deployment, ADRs, verification
```

## Deployment

Local infrastructure is ready. Full Dockerfiles, Render/Vercel deployment and CI are documented in [docs/deployment.md](file:///D:/This%20PC/Documents/Projects/Portfolio_backend_2/docs/deployment.md). The public URL is intentionally absent until it is verified.

## Limitations

- The unsafe SQL mode is a deliberate teaching endpoint. It is isolated, but it is still an attack surface.
- Abuse quotas are not a WAF or DDoS protection.
- The SQL demo uses fictional data and must never share credentials with real data.
- The contact demo depends on Resend and its sender/domain restrictions.
- Free hosting may cold-start; the UI probes readiness but does not replay POSTs.
