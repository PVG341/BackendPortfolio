# Backend Portfolio MVP Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. Execution is native in this session, authorized by the user's request to implement.

**Goal:** Ship a Next.js portfolio and a Redis-backed NestJS rate-limiting demo with automated checks and deployment configuration.

**Architecture:** Browser calls an isolated NestJS API. Redis owns session metadata, atomic window decisions, expiry and abuse quotas. Contracts define the transport; UI never simulates API results.

**Tech Stack:** Node 22, pnpm, TypeScript, Next.js, React, NestJS, ioredis, Vitest, Playwright, Redis, Docker.

**Spec:** docs/superpowers/specs/2026-10-11-backend-portfolio-mvp-design.md

## Global Constraints

- Default 5 requests / 10 seconds; limit 1–20, window 1–60 seconds.
- Burst at most 20; history at most 200.
- HTTP 429 for exhausted quota; HTTP 503 for Redis failure.
- Production algorithms use Redis TIME and atomic Lua, not client timestamps.
- No automatic retry of POST requests; readiness budget 90 seconds.
- No invented identity, credentials, deployment URL or achievements.

## Review Focus

- Malformed session/configuration: reject before allocating Redis keys.
- Simultaneous requests: accepted count cannot exceed limit.
- Reset while burst runs: stop burst, invalidate old session and ignore late results.
- Missing Redis: bounded failure, 503, no memory fallback.
- Cold start: visible loading with bounded retries; never replay a POST.

### Task 1: Contracts and runnable workspace

Files: package.json, pnpm-workspace.yaml, tsconfig.base.json, packages/contracts/src/index.ts, packages/contracts/test/contracts.test.ts, apps/api/package.json, apps/web/package.json.
Interface: Algorithm = 'fixed' | 'sliding'; SessionConfig = {limit, windowSeconds}; Decision = {allowed, algorithm, limit, remaining, resetAt, retryAfterMs}.

- [x] Write tests rejecting fractional/out-of-range limits, unknown algorithms and malformed session tokens; run and observe failure.
- [x] Implement strict transport validation and workspace build/typecheck/test scripts.
- [x] Run contract suite and compile consumers.

```ts
expect(parseConfig({ limit: 0, windowSeconds: 10 })).toBeNull();
expect(parseConfig({ limit: 5, windowSeconds: 10 })).toEqual({ limit: 5, windowSeconds: 10 });
```

### Task 2: Atomic Redis algorithms and API

Files: apps/api/src/infrastructure/redis/redis.service.ts, apps/api/src/modules/rate-limit/{scripts.ts,rate-limit.service.ts,rate-limit.controller.ts}, apps/api/src/modules/health/health.controller.ts, apps/api/src/{main.ts,app.module.ts}, apps/api/test/rate-limit.test.ts.
Consumes validated contracts. Produces POST session, POST request, DELETE session and GET live/ready endpoints under /api.

- [x] Write real Redis integration tests for sixth-request 429, concurrency, TTL, separate sessions, expiry, reset and outage; observe failures.
- [x] Implement Lua decisions, session metadata, bounded Redis connection, abuse quotas and controllers.
- [x] Add readiness, CORS, input validation, shutdown and response headers.
- [x] Run integration suite against a disposable real Redis instance; no fake passing integration result.

```ts
const outcomes = await Promise.all(Array.from({ length: 20 }, () => send(session, 'sliding')));
expect(outcomes.filter((r) => r.status === 200)).toHaveLength(5);
expect(outcomes.filter((r) => r.status === 429)).toHaveLength(15);
```

### Task 3: Portfolio and interactive playground

Files: apps/web/src/app/{layout.tsx,page.tsx,globals.css,projects/page.tsx,architecture/page.tsx,playground/rate-limit/page.tsx}, apps/web/src/components/playground/{Playground.tsx,MetricsChart.tsx,ResponseViewer.tsx,RequestEditor.tsx}, apps/web/src/lib/{api-client.ts,api-client.test.ts}, apps/web/e2e/portfolio.spec.ts.
Consumes API contracts. Produces Vietnamese portfolio and real-request timeline.

- [x] Write client tests proving readiness retries GET only, abort works, 429 is an outcome and malformed responses fail; run and observe failure.
- [x] Implement bounded readiness, one-shot requests, burst stop/reset lifecycle and capped history.
- [x] Implement responsive pages with GitHub links and architecture explanation.
- [x] Run client tests and browser smoke tests for navigation and actual 200/429 request flow.

```ts
expect(await client.request(session, 'fixed')).toMatchObject({ status: 429 });
// Test transport records exactly one POST even when that POST rejects.
```

### Task 4: Deployment, CI and documentation

Files: compose.yaml, apps/{api,web}/Dockerfile, render.yaml, .github/workflows/ci.yml, .env.example, README.md, docs/{architecture.md,api-security.md,deployment.md}, docs/decisions/0001-redis-rate-limiting.md.

- [x] Configure local Docker services with health checks and frontend build-time API URL.
- [x] Configure GitHub Actions with Redis service, frozen install, typecheck, tests and production builds.
- [x] Provide Vercel frontend and Render API deployment instructions, cold-start limitations and exact environment variable names.
- [x] Run all available checks, record results and limitations; verify public URL only if hosting credentials are available.

## Execution ledger

- User approved design and asked to implement directly.
- Target folder is outside default write roots: build in an allowed isolated staging directory, then copy only project source to the requested target using approved filesystem access.
- No Git history is present locally; preserve remote contents if fetched. Do not force-push.
- Public hosting access has not been provided. Prepare complete deployment configuration; report deployment blocker if access remains unavailable.

- Final results: 41 unit/integration/HTTP tests pass on real Redis; 5 browser tests pass; typecheck and production builds pass. Reviewer findings about shared abuse quotas and later-burst readiness were fixed and verified. Browser fetch receiver regression was reproduced, fixed and covered by a unit test. Public deployment explicitly deferred by the user; no remote push or hosted CI run. Docker config prepared but Docker execution not available on this host.
