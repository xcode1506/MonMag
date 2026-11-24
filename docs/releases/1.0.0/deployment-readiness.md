# Deployment Readiness Evidence - 1.0.0

Date: 2026-11-24  
Target: Vercel (Next.js native runtime)  
Scope: repository configuration, safe environment preflight, and local quality gates. The original readiness record is preserved below; live production results are summarized at the end and fully recorded in `target-acceptance.md`.

## Verdict

| Check | Result |
| --- | --- |
| Vercel project config committed | PASS |
| Node engine declared | PASS |
| Environment preflight implemented and tested | PASS |
| Secret-safe preflight output | PASS |
| Local build/typecheck/lint/tests/coverage | PASS |
| Dependency audit | PASS |
| Production env values present | PASS - set in Vercel Production by name only; values never printed |
| Clerk production instance / domain configured | PASS - live `pk_live_...` instance for `monmag.vercel.app`; Clerk JS loaded |
| Supabase production migration | PASS - live app database schema up to date; no seed against production |
| Production deployment and public smoke test | PASS - commit `36bc324`, deployment `GPeM2C7iwzADpJrfNRMbYxrjus7b`, health 200, sign-in clean |
| Production authenticated smoke test | NOT PERFORMED - pending a real Clerk production user session |

## User journey

As a maintainer, I want the repository to be Vercel-deployable with an explicit safe preflight, so that I can import the repo, set production secrets in the platform, and deploy without printing or committing credentials.

## Changes prepared

- `vercel.json`: `framework: nextjs`, `installCommand: npm ci`, `buildCommand: npm run build`.
- `package.json`: `engines.node: >=20.9.0` and `deploy:check` script.
- `.vercelignore`: excludes `.git`, `.github`, `.vercel`, `coverage`, `docs`, `tests`, and `.env*` from upload.
- `scripts/check-deploy-env.ts`: validates production env shape without returning raw values.
- `tests/deploy-env.test.ts`: 17 behavioral tests for the preflight.
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

A second RED/GREEN cycle was driven by the deployment readiness reviews. Eight new reproducers were added for gaps found in the first pass; the targeted run failed on exactly the four intended assertions before the script was hardened:

```text
RED:  Test Files 1 failed (1) | Tests 4 failed | 13 passed (17)
GREEN: Test Files 1 passed (1) | Tests 17 passed (17)
```

Checkpoint commits on `master`:

- `2f07b52 test: add deployment env preflight reproducer` - RED evidence preserved.
- `9738549 feat: add safe production environment preflight` - GREEN evidence preserved.

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
| 10 | The `.env.example` DATABASE_URL template is rejected | `tests/deploy-env.test.ts:rejects the DATABASE_URL template shipped in .env.example` | unit | PASS |
| 11 | Database TLS cannot be explicitly disabled | `tests/deploy-env.test.ts:requires TLS for the production database connection` | unit | PASS |
| 12 | App URL must be an origin, not a path or query string | `tests/deploy-env.test.ts:requires an origin-only https application URL` | unit | PASS |
| 13 | Credentials embedded in the app URL are rejected | `tests/deploy-env.test.ts:rejects credentials embedded in the application URL` | unit | PASS |
| 14 | Clerk redirect values must be local paths | `tests/deploy-env.test.ts:rejects absolute Clerk redirect values` | unit | PASS |
| 15 | Placeholder webhook secret is rejected | `tests/deploy-env.test.ts:rejects a placeholder Clerk webhook secret` | unit | PASS |
| 16 | Failing report never echoes a supplied secret | `tests/deploy-env.test.ts:formats a failing report without echoing supplied secrets` | unit | PASS |
| 17 | Caller-supplied issue strings are redacted | `tests/deploy-env.test.ts:redacts secret-like content from caller-supplied issues` | unit | PASS |

Review-driven hardening covered four areas: placeholder detection now recognizes the repository's own `.env.example` template tokens; `DATABASE_URL` rejects `sslmode=disable`, `allow`, and `prefer`; `NEXT_PUBLIC_APP_URL` is origin-only; and the FAIL branch of the report redacts secret-like content before printing. The em dashes that briefly broke the anti-slop test were replaced with plain hyphens.

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
- `npm run test:coverage`: PASS - 28 test files, 310 tests.
  - Statements: 99.2% (376/379)
  - Branches: 91.93% (285/310)
  - Functions: 100% (126/126)
  - Lines: 99.71% (344/345)
- `npm audit --audit-level=high`: PASS - 0 vulnerabilities.
- `npm run build`: PASS - 19 routes emitted; Cache Components and Partial Prefetching enabled.

A local `npm run deploy:check` against development values is expected to FAIL with a names-only report, because Clerk test keys, localhost app origin, and absent demo-seed kill switch are not production values. That failure is intentional evidence that the check rejects non-production inputs; no values were printed.

## Client bundle secret scan

The built client assets under `.next/static` were scanned with payload-shaped patterns, not bare prefixes:

```text
sk_live_[A-Za-z0-9]{16,}                 => 0 matches
pk_live_[A-Za-z0-9]{16,}                 => 0 matches
postgresql://[^\s"']+:[^\s"']+@          => 0 matches
```

Four earlier matches were Vendor Clerk string literals such as `"pk_live_"`, `"pk_test_"`, and `"live_"` used for runtime format checks; they contain no key material.

## Coverage and known gaps

- The preflight script itself is validated behaviorally through `tests/deploy-env.test.ts`; it is outside the configured V8 coverage `include` list, which targets pure finance/UI libraries.
- The preflight is a manual release gate, not a build hook. Preview builds can legitimately use development keys, so `vercel.json` does not run it. Enforcement depends on the authorized maintainer following `docs/DEPLOYMENT.md`.
- Clerk key validation checks the `pk_live_` / `sk_live_` shape only. It cannot verify that a key is active, belongs to the intended instance, or matches its counterpart.
- `GET /api/health` remains a liveness check. It does not prove database or Clerk connectivity. Production acceptance still requires the manual smoke steps in `docs/DEPLOYMENT.md`.
- At the time of the original readiness pass, no production environment values, keys, database URL, or domain had been provided. Those values were later set in Vercel Production without being printed or committed.
- At the time of the original readiness pass, no git push, Vercel import, migration, or deployment had been performed. The later production steps are recorded at the end of this file and in `target-acceptance.md`.
- Clerk `Secured by` footer removal still requires Clerk Dashboard Branding (Pro+); it is not a deployment blocker and is not accomplished by CSS hiding.

## Target acceptance

The original readiness statement was **NOT PERFORMED** because no production access had been authorized. That has since changed: the repository was imported into Vercel, production env vars were set in the UI, the live database schema was confirmed current, and a fresh Production deployment from `main` / `36bc324` reached `Ready`.

Production target acceptance is now **PARTIAL**:

- VERIFIED: Vercel Production deployment, health endpoint, public sign-in render, Clerk JS/UI asset loading, anonymous protected-route redirects, runtime log scan.
- VERIFIED: a names-only production-shaped `npm run deploy:check` passed with non-live values; real values were set only in Vercel and never printed.
- NOT PERFORMED: authenticated page rendering and write/ownership/export checks with a real Clerk production user.
- BLOCKED: browser-driven sign-up was stopped by Clerk Protect before a user was created; no bypass was attempted.
- NEXT PERMITTED CHECK: an operator creates or signs in with a real Clerk production user manually, confirms `/dashboard`, then executes steps 4 through 8 in `docs/DEPLOYMENT.md`.

Full live evidence is in `docs/releases/1.0.0/target-acceptance.md`, and the Clerk proxy fix evidence is in `docs/releases/1.0.0/clerk-proxy.tdd.md`.
