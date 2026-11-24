# Dashboard navigation responsiveness evidence

Date: 2026-11-24
Scope: dashboard navigation numbering and perceived lag when switching app tabs.

## Request

User reported that the dashboard navigation still displayed numbered tabs `01`-`10`, and that switching tabs felt heavy/laggy with slow loading.

## Changes

- Removed the `01`-`10` `nav-index` spans from `src/components/layout/app-chrome.tsx`.
- Removed dead `.nav-index` CSS from `src/app/globals.css`.
- Removed the forced `key={pathname}` remount wrapper so the shared shell stays mounted between tabs.
- Replaced the full-shell Suspense/loading fallback with compact `PageSkeleton` in `src/app/(app)/layout.tsx` and `src/app/(app)/loading.tsx`.
- Added `countUnreadNotifications(userId)` so the shell badge runs a single `COUNT` instead of fetching a notification row plus a count.
- Wrapped `getCurrentUser()` with React `cache` to dedupe the Clerk and local-user lookup within one server request.
- Added `prefetch={true}` to all sidebar, mobile tab bar, notification bell, and mobile overflow-menu links so Next.js prefetches full route data instead of only the shared App Shell.
- Added `"use cache: private"` plus `cacheLife({ stale: 60 })` to the ten authenticated page content functions. Private cache entries stay scoped to one browser/user and contribute stale time to the client Router Cache.
- Kept every existing `revalidatePath()` and `router.refresh()` mutation flow; no authorization or ownership check was removed.

## TDD evidence

- RED commit: `078ba6b test: specify responsive navigation and unnumbered sidebar`
  - `npx vitest run tests/navigation-performance.test.ts` -> 4 tests failed as expected.
- GREEN commit: `effe3cc fix: keep dashboard shell stable and remove nav numbers`
  - Targeted run (`navigation-performance`, `midnight-app-surface`, `ui-polish`, `auth-user-race`) -> 4 files, 35 tests passed.
- Follow-up commit: `f8437c4 refactor: use page skeleton for the app shell suspense boundary`
  - Required because the first build exposed an uncached dynamic access outside Suspense.
  - `npx vitest run tests/navigation-performance.test.ts` -> 1 file, 4 tests passed.
- RED commit: `49e3bd8 test: specify instant tab navigation via full prefetch and private cache`
  - `npx vitest run tests/navigation-performance.test.ts` -> 2 of 6 tests failed as expected: missing full prefetch and missing private cache.
- GREEN checkpoint: this commit applies `prefetch={true}` and private page caches; targeted run passes 6 of 6 tests.

## Local gates

- `npm run typecheck` - PASS
- `npm run lint` - PASS
- `npx vitest run tests/navigation-performance.test.ts` - PASS, 1 file, 6 tests
- `npm test` - PASS, 32 files, 328 tests
- `npm run test:coverage` - PASS, Statements 99.2%, Branches 91.93%, Functions 100%, Lines 99.71%
- `npm run build` - PASS, 19 routes, Cache Components enabled, Partial Prefetching enabled
- `npm audit --audit-level=high` - PASS, 0 vulnerabilities

## Production verification

### Baseline before full prefetch

- Deployment: `dpl_FuesBmGaJZ1beZyaVfhp38rv6JB4`
- Commit: `f8437c4`
- URL: `monmag-7nfd1pyxv-lhs21.vercel.app`
- State: `READY`, `stale: false`
- Authenticated smoke: `https://monmag.vercel.app/dashboard?verify=nav-clean`
  - Title: `MonMag - Personal money management`
  - Heading: `Senang melihatmu lagi, Hugo`
  - Console errors: 0
  - Primary nav links: 10, numeric prefixes: 0
- Compact page skeleton appeared in about 9 ms after a tab click, but page content took about 1.9-2.8 s because the user-specific Suspense slot still resolved from Supabase and Clerk on every navigation.

### Full-prefetch and private-cache release

- Deployment: `dpl_4FiStZbyWRnn2U9H3btcnp6CTJ5L`
- Commit: `30913d151c07d2ad87fbd2483372d94889119eaa`
- URL: `monmag-g6fef53pu-lhs21.vercel.app`
- Alias: `monmag.vercel.app`
- State: `READY`, `stale: false`, `aliasError: null`
- Authenticated smoke: `https://monmag.vercel.app/dashboard?verify=prefetch-v1`
  - Title: `MonMag - Personal money management`
  - Heading: `Senang melihatmu lagi, Hugo`
  - Console errors: 0
  - Shared shell remains mounted, primary nav links: 10, numeric prefixes: 0
- Network evidence: 9 full-route RSC prefetches completed with HTTP 200 in 551-717 ms after the dashboard loaded. Later aborted RSC prefetch entries are cancelled Next.js prefetches and produced no console errors.

### Warm tab-switch measurement

The user clarified `0,05 ms` as `≤50 ms / 0,05 detik`. Measurement used an authenticated browser session, `performance.now()` at link click, and resolution when the URL changed, the `main h1` changed, and no `aria-busy` skeleton remained.

- Dashboard to Transaksi: 18.5 ms, h1 `Transaksi`.
- Follow-up warmed sequence:
  - Transaksi to Akun: 10.2 ms
  - Akun to Anggaran: 14.8 ms
  - Anggaran to Tabungan: 14.9 ms
  - Tabungan to Dasbor: 16.4 ms
  - Dasbor to Laporan & analitik: 14.8 ms
  - Laporan & analitik to Notifikasi: 12.2 ms
  - Notifikasi to Pengaturan: 20.7 ms
  - Pengaturan to Transaksi: 27.2 ms
- Maximum: 27.2 ms. All 9 measured switches are `≤50 ms`, so the clarified target is met for warmed tabs. Console errors: 0.
- Cold navigation still needs to fetch user-specific data and is not part of the warm-switch guarantee.
- Cache invalidation remains wired: 36 `refresh()` calls in `src/app/(app)/actions.ts` use `revalidatePath()`, and 12 `router.refresh()` call sites refresh views after mutations.

## Remaining operator-only / pending items

- Old Clerk secret deletion still requires a Clerk verification code entered by the operator.
- Singapore Clerk session `104.28.194.247` remains active pending operator decision.
- Clerk `Secured by` footer removal and MFA/admin 2FA require a Pro plan.
- Live two-user ownership isolation check remains NOT PERFORMED because only one production user is available.

No secret values, verification codes, or passwords are recorded in this document.
