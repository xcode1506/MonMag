# Clerk Frontend API Proxy Fix - TDD Evidence

Date: 2026-11-24  
Environment: Vercel Production (`monmag`, team `LHS`) with Clerk production instance and Next.js 16.4.6.

No secret values, session tokens, or connection strings are included in this report.

## User journey

As a visitor, I want the Clerk sign-in form to load on the deployed app, so that I can authenticate without client-side script 404s.

## Root cause

Clerk's Next.js 16 integration auto-proxies Clerk Frontend API and npm assets through `/__clerk/...` on Vercel. The existing `src/proxy.ts` matcher covered app routes and API routes but not `/__clerk/(.*)`, so the requests were not routed through Clerk middleware:

```text
GET /__clerk/npm/@clerk/clerk-js@6/dist/clerk.browser.js -> 404
GET /__clerk/npm/@clerk/ui@1/dist/ui.browser.js         -> 404
Clerk error: failed_to_load_clerk_js
```

## RED evidence

New regression test: `tests/clerk-proxy.test.ts`.

Command:

```bash
npm test -- tests/clerk-proxy.test.ts
```

Observed before the fix:

```text
FAIL tests/clerk-proxy.test.ts > Clerk proxy configuration > includes the Clerk frontend API proxy path in the middleware matcher
AssertionError: expected 'import { clerkMiddleware } from "@cle…' to contain '"/__clerk/(.*)"'
Test Files 1 failed (1), Tests 1 failed (1)
```

Checkpoint commit: `043cc2e test: add reproducer for Clerk frontend API proxy matcher`.

## Fix

Added `"/__clerk/(.*)"` to the `config.matcher` array in `src/proxy.ts`. No auth logic, keys, or environment values were changed.

Checkpoint commit: `36bc324 fix: route Clerk frontend API requests through proxy matcher`.

## GREEN evidence

Command:

```bash
npm test -- tests/clerk-proxy.test.ts
```

Observed after the fix:

```text
Test Files 1 passed (1)
Tests 1 passed (1)
```

Full local gates after the fix:

```text
npm run typecheck  -> PASS
npm run lint       -> PASS
npm test           -> PASS (29 files, 311 tests)
npm run build      -> PASS (19 routes)
```

Push:

```text
de4ce1e..36bc324 HEAD -> main
```

## Production evidence

A fresh Vercel Production deployment was created from `main` with commit `36bc324`:

```text
Deployment: GPeM2C7iwzADpJrfNRMbYxrjus7b
Status: Ready
Environment: Production
Branch: main
Commit: 36bc324
```

Live `/sign-in?verify=proxyfix` was loaded in the browser. No console errors were recorded. Clerk asset requests were observed as redirects followed by successful responses:

```text
/__clerk/npm/@clerk/clerk-js@6/dist/clerk.browser.js -> 307 then 200 for resolved version
/__clerk/npm/@clerk/ui@1/dist/ui.browser.js          -> 307 then 200 for resolved version
/__clerk/v1/environment                              -> 200
/__clerk/v1/client                                   -> 200
Browser console errors                               -> 0
```

The previous deployment's `failed_to_load_clerk_js` error was absent after the fix.

`GET https://monmag.vercel.app/api/health?verify=proxyfix` returned:

```json
{"success":true,"data":{"status":"healthy","timestamp":"2026-11-24T07:48:38.676Z"}}
```

Vercel Runtime Logs for the production project reported `Info 16`, `Warning 0`, `Error 0`, `Fatal 0`. A payload-shaped scan of the visible log text found 0 live secret keys, 0 live publishable keys, and 0 PostgreSQL connection strings.

## Guarantees

| # | What is guaranteed | Evidence | Result |
| --- | --- | --- | --- |
| 1 | The proxy matcher includes Clerk's `/__clerk/(.*)` path | `tests/clerk-proxy.test.ts` | PASS |
| 2 | The regression test fails before the fix for the intended missing matcher | RED command above | PASS |
| 3 | The regression test passes after the fix | GREEN command above | PASS |
| 4 | Clerk JS and UI assets load on Vercel Production | live browser network trace | PASS |
| 5 | The sign-in page has no browser console errors | live browser console | PASS |
| 6 | Health endpoint remains healthy after the fix | live HTTP response | PASS |

## Known gap

Authenticated production page rendering and transaction flows still require a real Clerk production user session. Anonymous protected-route requests correctly redirected to `/sign-in`; that behavior is not a substitute for authenticated acceptance.
