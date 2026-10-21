# Phase 2C Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a minimal public backend portfolio with interactive rate-limit, isolated SQL-injection, and contact-email demonstrations.

**Architecture:** Next.js remains the single-page frontend. NestJS gains isolated SQL and contact modules; PostgreSQL is used only by the SQL sandbox, Redis continues to provide atomic quota state, and Resend is called only from the API process.

**Tech Stack:** Next.js, React, Tailwind CSS, NestJS/Fastify, Redis/ioredis, PostgreSQL/pg, Resend, Vitest, Docker Compose.

**Spec:** `docs/superpowers/specs/2026-10-21-phase-2c-design.md`

## Global Constraints

- Preserve `/api/v1` prefix and existing rate-limit API contracts.
- Use `CORS_ORIGIN`; expose rate-limit headers to browser clients.
- SQL demo accepts bounded text only and cannot execute writes.
- Contact recipient is configured server-side; client input never controls a recipient.
- Tests precede each production behavior.

## Review Focus

- SQL payloads containing semicolons or time functions must not write data or hold a connection past the statement timeout.
- A browser client must be able to read every displayed rate-limit response header.
- Contact requests with a filled honeypot must appear successful while not invoking Resend.
- A Resend failure must return a generic 503 and never provider details.
- The frontend must handle Redis/API outage without exposing a stack trace.

---

### Task 1: Portfolio shell and shared browser API client

**Files:**
- Modify: `apps/web/src/app/page.tsx`, `apps/web/src/app/globals.css`, `apps/web/src/lib/api-client.ts`
- Create: `apps/web/src/components/portfolio-shell.tsx`, `apps/web/src/components/rate-limit-playground.tsx`

**Interfaces:**
- Consumes: existing `GET /api/v1/health` and rate-limit API contracts.
- Produces: a responsive page and client functions returning status, headers, JSON, and duration.

- [ ] Write a failing unit test for conversion of a `Response` into a typed API result including `Retry-After` and `X-RateLimit-*` headers.
- [ ] Run the focused test and verify it fails because the client result helper does not exist.
- [ ] Implement the typed browser API client and the minimal technical portfolio layout.
- [ ] Run the focused test and `pnpm --filter @portfolio/web build`.
- [ ] Commit `feat(web): add portfolio shell and rate-limit playground`.

### Task 2: SQL demo infrastructure and safe API boundary

**Files:**
- Create: `apps/api/src/infrastructure/postgres/*`, `apps/api/src/modules/sql-playground/*`, `apps/api/test/sql-playground.e2e-spec.ts`, `docker/sql/init.sql`
- Modify: `apps/api/src/app.module.ts`, `apps/api/src/config/env.validation.ts`, `apps/api/.env.example`, `compose.yaml`

**Interfaces:**
- Produces: `POST /api/v1/playground/sql-injection/query` accepting `{ mode, username }` and returning normalized demo rows.

- [ ] Write e2e tests for parameterized query resistance and for unsafe query behavior against seeded fake rows.
- [ ] Run tests and verify route absence fails.
- [ ] Implement a SELECT-only role, read-only transactions, statement timeout, seed data, strict parser, and normalized error response.
- [ ] Run SQL e2e tests with PostgreSQL available, then API build/lint/test.
- [ ] Commit `feat(api): add isolated sql injection sandbox`.

### Task 3: Contact API and Resend delivery boundary

**Files:**
- Create: `apps/api/src/modules/contact/*`, `apps/api/test/contact.e2e-spec.ts`
- Modify: `apps/api/src/app.module.ts`, `apps/api/src/config/env.validation.ts`, `apps/api/.env.example`, `apps/api/package.json`

**Interfaces:**
- Produces: `POST /api/v1/contact` accepting `{ name, email, message, website? }` and returning `202` on accepted contact requests.

- [ ] Write failing tests for valid contact, invalid payload, honeypot suppression, and provider failure normalization.
- [ ] Verify the tests fail for missing route.
- [ ] Implement strict validation, Redis quota, injectable email sender, Resend adapter, plain-text email, and generic failures.
- [ ] Run focused tests then API build/lint/test.
- [ ] Commit `feat(api): add protected contact email endpoint`.

### Task 4: Contact UI, integration, and documentation

**Files:**
- Modify: `apps/web/src/components/portfolio-shell.tsx`, `apps/web/src/components/rate-limit-playground.tsx`, `README.md`, `compose.yaml`, `render.yaml`
- Create: `apps/web/src/components/contact-form.tsx`

**Interfaces:**
- Consumes: Tasks 1-3 API client interfaces.
- Produces: public contact form and documented local/deployment setup.

- [ ] Write a failing frontend test for disabled submit state and successful generic acknowledgement.
- [ ] Implement contact form and SQL playground panels without exposing secrets or provider errors.
- [ ] Verify web build and full monorepo checks.
- [ ] Commit `feat(web): integrate security playground and contact form`.

### Task 5: Verification and repository review

**Files:**
- Modify: only files required to correct verified findings.

- [ ] Run `pnpm build`, `pnpm lint`, `pnpm test`, `pnpm test:e2e`, and `pnpm format:check`.
- [ ] Review deployment variables and ensure all secrets are absent from Git.
- [ ] Review the branch diff for public SQL exposure, CORS header access, and contact-recipient control.
- [ ] Commit any test-proven corrective changes.