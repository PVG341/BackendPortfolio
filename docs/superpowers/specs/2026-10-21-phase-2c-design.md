# Phase 2C Playground Design

## Intent
Build a minimal, technical backend portfolio that demonstrates API rate limiting, safe SQL query construction, and secure contact handling.

## User-visible page
One responsive Next.js page has Home, About, Skills, Playground, Projects, and Contact sections. The visual language uses a dark surface, restrained borders, monospace data display, and clear success/error colors.

## Rate-limit playground
It consumes the existing `/api/v1/playground/rate-limit/*` API. The user creates a session, selects fixed or sliding, sends one request or a burst, and sees status, duration, rate headers, decision body, and retry time.

## SQL-injection sandbox
A separate PostgreSQL database contains only seeded fictional users. `unsafe` uses a deliberately concatenated SELECT only inside a read-only transaction; `safe` uses a parameterized query. The database role has SELECT permission only, statement timeout is short, input is bounded, errors are normalized, and the API never exposes a general SQL executor.

## Contact
`POST /api/v1/contact` accepts name, email, message, and an optional honeypot. It validates exact fields and lengths, rate limits public access, sends plain-text email through Resend, always delivers only to `CONTACT_TO_EMAIL`, and sets visitor email solely as Reply-To. Before a custom domain is verified, it uses Resend's onboarding sender.

## Constraints
- Existing Redis rate limiting remains the sole state store for the rate-limit demo.
- SQL seed data is fictional and never shares credentials, schemas, or network access with production data.
- Secrets are environment variables and never client-visible.
- Public API responses do not expose database or Resend provider errors.
- All new behavior is test-first.