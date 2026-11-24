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

## Follow-up: Supabase session pooler versus transaction pooler

After commit `0266ffb` was deployed, authenticated pages mostly loaded but `/transactions` failed intermittently with a second database error:

```text
Error: timeout exceeded when trying to connect ... clientVersion: '7.10.1', digest: '4038201410'
```

The stored production `DATABASE_URL` still pointed at Supabase's shared session pooler on port `5432`. Supabase documents port `6543` as the transaction pooler intended for serverless workloads; on this project's free compute tier the transaction pooler allows 200 clients, while the session pooler observed above is capped at `pool_size: 15`. The credential itself was not changed, printed, staged, or committed.

### RED evidence

Added regression tests to `tests/db-pool.test.ts` for session-to-transaction routing. Before the implementation:

```text
FAIL tests/db-pool.test.ts (8 tests | 4 failed)
TypeError: toServerlessConnectionString is not a function
```

Checkpoint commit: `015a328 test: add Supabase session-pooler routing regression`.

### Fix

`src/lib/db-pool-config.ts` now normalizes Supabase `*.pooler.supabase.com` URLs from the session port `5432` to the transaction port `6543` before handing the connection string to `pg.PrismaPg`. Direct Supabase URLs, non-Supabase URLs, malformed values, and already-correct transaction URLs are left unchanged.

Checkpoint commit: `eee2eb7 fix: route Supabase serverless traffic through transaction pooler`.

### GREEN evidence

```text
npm test -- tests/db-pool.test.ts   -> PASS (8 tests)
npm run typecheck                   -> PASS
npm run lint                        -> PASS
npm test                            -> PASS (31 files, 322 tests)
npm run test:coverage               -> PASS (Statements 99.2%, Branches 91.93%, Functions 100%, Lines 99.71%)
npm run build                       -> PASS (19 routes)
npm audit --audit-level=high        -> PASS (0 vulnerabilities)
npm run deploy:check (dummy values) -> PASS
```

A direct `pg.Pool` check using the existing local credentials and `buildPoolConfig()` returned `{"ok":1,"runtimePort":"6543"}` without revealing the connection string.

Additional guarantees:

| # | What is guaranteed | Test file or command | Test type | Result |
|---|--------------------|----------------------|-----------|--------|
| 8 | Supabase session-pooler traffic is rewritten to the transaction pooler port | `tests/db-pool.test.ts: routes Supabase session-pooler traffic to the transaction pooler` | unit | PASS |
| 9 | Already-correct transaction URLs are unchanged | `tests/db-pool.test.ts: leaves an already-correct transaction-pooler URL unchanged` | unit | PASS |
| 10 | Direct Supabase and non-Supabase URLs are not rewritten | `tests/db-pool.test.ts: does not rewrite direct Supabase or non-Supabase connection strings` | unit | PASS |
| 11 | The pg pool uses the normalized connection string | `tests/db-pool.test.ts: normalizes the connection string used by the pg pool` | unit | PASS |

## Follow-up: parallel checkout and IPv4 on the transaction pooler

After commit `eee2eb7` was deployed, `/transactions` still failed intermittently. A direct `pg.Pool` probe showed the transaction-pooler host resolving to IPv6 first; the pooled connection could not be reused by parallel server-side reads, and checkout timed out before the query ran.

Regression tests were added to `tests/db-pool.test.ts` for bounded parallel checkouts and IPv4 precedence:

```text
RED: 7ad4af7 test: add parallel query pool and IPv4 regression
GREEN: ef879c0 fix: allow parallel DB queries over IPv4 transaction pooler
```

`src/lib/db-pool-config.ts` now uses `MAX_POOL_CONNECTIONS = 5`, `IDLE_TIMEOUT_MS = 10_000`, `CONNECT_TIMEOUT_MS = 10_000`, and `family: 4`. A direct `pg.Pool` check after GREEN returned `{"ok":true,"count":5,"elapsedMs":247,"runtimePort":"6543","family":4}` without exposing the connection string.

Full final gates after GREEN:

```text
npm run typecheck            -> PASS
npm run lint                 -> PASS
npm test                     -> PASS (31 files, 322 tests)
npm run test:coverage        -> PASS (Statements 99.2%, Branches 91.93%, Functions 100%, Lines 99.71%)
npm run build                -> PASS (19 routes)
npm audit --audit-level=high -> PASS (0 vulnerabilities)
npm run deploy:check (dummy values) -> PASS
```

Additional guarantees:

| # | What is guaranteed | Test file or command | Test type | Result |
|---|--------------------|----------------------|-----------|--------|
| 12 | Parallel reads can use up to five pooled connections | `tests/db-pool.test.ts` parallel checkout case | unit | PASS |
| 13 | The pg pool prefers IPv4 for the Supabase transaction pooler | `tests/db-pool.test.ts` IPv4 case | unit | PASS |

## Target acceptance

Verified on Vercel Production with commit `ef879c0`, deployment `6x8oZSWLj9JeKMcwoGdGzPaYp9Vt` (Ready 2026-11-24 ~16:06 GMT+7), production domain `https://monmag.vercel.app`.

- `GET /api/health`: `200`, `{"success":true,"data":{"status":"healthy",...}}`.
- Authenticated `/transactions?verify=final1`, `/settings?verify=final3`, and `/reports?verify=final4` rendered with no section error and 0 browser console errors.
- A throwaway transaction was created through the UI, displayed as `24/11/2026` and `−Rp 12.345` (DD/MM/YYYY, IDR), appeared in `GET /api/transactions/export` as `"24/11/2026","Smoke DB Pool Final",...,"Rp 12.345","IDR"`, then was deleted and confirmed absent after reload.
- Vercel Runtime Logs rechecked after deployment: the remaining `timeout exceeded when trying to connect` / digest `4038201410` entries were timestamped `15:38:26` and `15:50:16`, before this deployment became Ready. No new `XX000`, `timeout exceeded when trying to connect`, `4038201410`, or React `#441` entries were observed after the deployment.
- Prefetch `net::ERR_ABORTED` entries with HTTP 200 remain benign Next.js RSC prefetch cancellations, not application errors.
