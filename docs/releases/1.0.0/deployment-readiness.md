# Deployment Readiness Evidence - 1.0.0

Date: 2026-11-24  
Target: Vercel (Next.js native runtime)  
Scope: repository configuration, safe environment preflight, and local quality gates. This is **not** a production deployment record.

## Verdict

| Check | Result |
| --- | --- |
| Vercel project config committed | PASS |
| Node engine declared | PASS |
| Environment preflight implemented and tested | PASS |
| Secret-safe preflight output | PASS |
| Local build/typecheck/lint/tests/coverage | PASS |
| Dependency audit | PASS |
| Production env values present | NOT PROVIDED |
| Clerk production instance / domain configured | NOT PERFORMED |
| Supabase production migration | NOT PERFORMED |
| Production deployment and smoke test | NOT PERFORMED |

## User journey

As a maintainer, I want the repository to be Vercel-deployable with an explicit safe preflight, so that I can import the repo, set production secrets in the platform, and deploy without printing or committing credentials.

## Changes prepared

- `vercel.json`: `framework: nextjs`, `installCommand: npm ci`, `buildCommand: npm run build`.
- `package.json`: `engines.node: >=20.9.0` and `deploy:check` script.
- `.vercelignore`: excludes `.git`, `.github`, `.vercel`, `coverage`, `docs`, `tests`, and `.env*` from upload.
- `scripts/check-deploy-env.ts`: validates production env shape without returning raw values.
- `tests/deploy-env.test.ts`: 9 behavioral tests for the preflight.
- `docs/DEPLOYMENT.md` and `README.md`: updated operator instructions.

The generated Prisma client is already committed under `src/generated/prisma`, so the Vercel build does not depend on an install-time `prisma generate`.

## TDD evidence

RED was captured before the implementation existed:

```text
npm test -- tests/deploy-env.test.ts
FAIL tests/deploy-env.test.ts [ tests/deploy-env.test.ts ]
Error: Cannot find module '../scripts/check-deploy-env'
Test Files 1 failed (1)
```

GREEN after implementation:

```text
npm test -- tests/deploy-env.test.ts
Test Files 1 passed (1)
Tests 9 passed (9)
```

Checkpoint commits on `master`:

- `2f07b52 test: add deployment env preflight reproducer` — RED evidence preserved.
- `9738549 feat: add safe production environment preflight` — GREEN evidence preserved.

## Test specification

| # | What is guaranteed | Test | Type | Result |
| --- | --- | --- | --- | --- |
| 1 | A complete production-shaped env passes | `tests/deploy-env.test.ts:accepts a complete production-shaped environment` | unit | PASS |
| 2 | Missing required vars are named, values are not echoed | `tests/deploy-env.test.ts:reports missing required variables by name without echoing values` | unit | PASS |
| 3 | Clerk test keys are rejected | `tests/deploy-env.test.ts:rejects Clerk development keys` | unit | PASS |
| 4 | Placeholder values are rejected | `tests/deploy-env.test.ts:rejects placeholder values` | unit | PASS |
| 5 | App URL must be absolute https | `tests/deploy-env.test.ts:requires an absolute https application origin` | unit | PASS |
| 6 | Database URL must be PostgreSQL | `tests/deploy-env.test.ts:requires a PostgreSQL connection string for the application` | unit | PASS |
| 7 | Supabase anon/service-role credentials are rejected as DATABASE_URL | `tests/deploy-env.test.ts:rejects Supabase anon and service role credentials as DATABASE_URL` | unit | PASS |
| 8 | Demo seeding kill switch is enforced | `tests/deploy-env.test.ts:requires the demo seed kill switch in production` | unit | PASS |
| 9 | Formatted report contains no secret values | `tests/deploy-env.test.ts:formats a report that never contains secret values` | unit | PASS |

## Local gate results

Commands run from `D:\WEBAPP\MoneyFlow`:

```bash
npm run typecheck
npm run lint
npm run test:coverage
npm audit --audit-level=high
npm run build
```

Observed results:

- `npm run typecheck`: PASS.
- `npm run lint`: PASS.
- `npm run test:coverage`: PASS — 28 test files, 302 tests.
  - Statements: 99.2% (376/379)
  - Branches: 91.93% (285/310)
  - Functions: 100% (126/126)
  - Lines: 99.71% (344/345)
- `npm audit --audit-level=high`: PASS — 0 vulnerabilities.
- `npm run build`: PASS — 19 routes emitted; Cache Components and Partial Prefetching enabled.

A local `npm run deploy:check` against development values is expected to FAIL with a names-only report, because Clerk test keys, localhost app origin, and absent demo-seed kill switch are not production values. That failure is intentional evidence that the check rejects non-production inputs; no values were printed.

## Coverage and known gaps

- The preflight script itself is validated behaviorally through `tests/deploy-env.test.ts`; it is outside the configured V8 coverage `include` list, which targets pure finance/UI libraries.
- `GET /api/health` remains a liveness check. It does not prove database or Clerk connectivity. Production acceptance still requires the manual smoke steps in `docs/DEPLOYMENT.md`.
- No production environment values, production keys, production database URL, or domain were provided.
- No git push, Vercel import, migration, or deployment was performed.
- Clerk `Secured by` footer removal still requires Clerk Dashboard Branding (Pro+); it is not a deployment blocker and is not accomplished by CSS hiding.

## Target acceptance

Target acceptance remains **NOT PERFORMED**. An authorized maintainer must import the repo into Vercel, set production env vars, run `npm run deploy:check`, apply migrations, deploy, and execute the post-deploy verification in `docs/DEPLOYMENT.md`. Passing these local checks does not establish a successful production deployment.
