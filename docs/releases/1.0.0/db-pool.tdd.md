# Serverless DB Pool and User Upsert Race - TDD Evidence

Date: 2026-11-24  
Environment: Vercel Production (`monmag`, team `LHS`) with Supabase PostgreSQL, Prisma 7, and Clerk production instance.

No secret values, session tokens, or connection strings are included in this report.

## User journeys

- As a signed-in user, I want `/reports` and `/settings` to render, so that I can review analytics and manage my account without an RSC stream error.
- As a signed-in user exporting transactions, I want the CSV download to complete, so that I can take my data with me.
- As a first-time user, I want concurrent first requests to sign in successfully, so that a race does not fail authentication with a unique-constraint error.

## Root cause

Production Runtime Logs showed the Supabase session pooler cap being reached during authenticated page loads:

```text
Error [PrismaClientKnownRequestError]: Invalid prisma.account.findMany() invocation:
Database error. Code: XX000. Message: (EMAXCONNSESSION) max clients reached in session mode - max clients are limited to pool_size: 15
```

The same failure affected `notification.count()`, `user.findUnique()`, and `transaction.findMany()`, then surfaced in the browser as `Minified React error #441` because the RSC stream was interrupted by a server-side error. The Prisma client used an unbounded `pg.Pool` per serverless function instance, so concurrent cold starts could exceed the shared 15-client cap.

A second, independent error was observed once at `/dashboard`:

```text
Unique constraint failed on the constraint: User_clerkUserId_key
```

`getCurrentUser()` used `prisma.user.upsert()`. Two concurrent first requests could both lose the insert race and the loser was not re-reading the winner's committed row.

## RED evidence

New regression tests:

- `tests/db-pool.test.ts`
- `tests/auth-user-race.test.ts`

Command:

```bash
npx vitest run tests/db-pool.test.ts tests/auth-user-race.test.ts
```

Observed before the fix:

```text
FAIL tests/db-pool.test.ts [ tests/db-pool.test.ts ]
Error: Cannot find package '@/lib/db-pool-config' imported from ...

❯ tests/auth-user-race.test.ts (3 tests | 1 failed)
  × returns the row committed by a concurrent request when upsert hits P2002
```

The failures were caused by the intended missing implementation and the intended race condition, not by unrelated test setup. Checkpoint commit: `eb0ad95 test: add reproducer for DB pool exhaustion and user upsert race`.

## Fix

- Added `src/lib/db-pool-config.ts` with one connection per serverless instance, a 2-second idle timeout, and a 10-second connect timeout.
- Changed `src/lib/prisma.ts` to pass the bounded config to `PrismaPg`.
- Changed `getCurrentUser()` to catch Prisma `P2002`, re-read the committed `clerkUserId` row, and rethrow unrelated database errors.

Checkpoint commit: `0266ffb fix: bound serverless DB pool and handle user upsert race`.

## GREEN evidence

Command:

```bash
npx vitest run tests/db-pool.test.ts tests/auth-user-race.test.ts
```

Observed after the fix:

```text
Test Files  2 passed (2)
Tests       7 passed (7)
```

Full local gates after the fix:

```text
npm run typecheck       -> PASS
npm run lint            -> PASS
npm test                -> PASS (31 files, 318 tests)
npm run test:coverage   -> PASS (Statements 99.2%, Branches 91.93%, Functions 100%, Lines 99.71%)
npm run build           -> PASS (19 routes)
```

## Guarantees

| # | What is guaranteed | Test file or command | Test type | Result |
|---|--------------------|----------------------|-----------|--------|
| 1 | Each serverless instance is capped at one DB connection | `tests/db-pool.test.ts: bounds each serverless instance to a single connection` | unit | PASS |
| 2 | Idle DB connections are released within 5 seconds | `tests/db-pool.test.ts: releases idle connections quickly...` | unit | PASS |
| 3 | Pool acquisition fails fast within 15 seconds | `tests/db-pool.test.ts: fails fast instead of hanging...` | unit | PASS |
| 4 | The `pg` pool config carries the bounded limits and connection string | `tests/db-pool.test.ts: builds a pg pool config with the bounded limits` | unit | PASS |
| 5 | A concurrent first-request `P2002` returns the winner's row | `tests/auth-user-race.test.ts: returns the row committed by a concurrent request when upsert hits P2002` | unit | PASS |
| 6 | Unrelated database errors are not swallowed | `tests/auth-user-race.test.ts: does not swallow unrelated database errors` | unit | PASS |
| 7 | Existing users skip the write path | `tests/auth-user-race.test.ts: skips the write when the user row already exists` | unit | PASS |

## Coverage and known gaps

The coverage configuration does not include `src/lib/db-pool-config.ts`, `src/lib/prisma.ts`, or `src/lib/auth.ts`; the suite-level coverage above is unchanged at 99.2% statements / 91.93% branches / 100% functions / 99.71% lines. The new unit tests directly exercise the extracted pool config and the race-handling branch. Live pool behavior must still be verified in production after deployment.

## Target acceptance

Not yet performed at the time of this report. Next step: deploy commit `0266ffb` to Vercel Production, then re-check authenticated `/reports`, `/settings`, and `/api/transactions/export`, and confirm no new `XX000` or React `#441` errors in Vercel Runtime Logs.
