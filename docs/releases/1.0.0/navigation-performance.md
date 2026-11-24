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
- Added `"use cache: private"` plus `cacheLife({ stale: 300 })` to the ten authenticated page content functions. Private cache entries stay scoped to one browser/user. Next.js reuses cached content from the client Router Cache when `stale` is at least five minutes; below that, each navigation fetches again.
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
- GREEN commit: `30913d1 fix: prefetch full routes and cache authenticated page content`
  - Targeted run passed 6 of 6 tests.
- RED commit: `5eea8b9 test: require five minute private cache stale time`
  - `npx vitest run tests/navigation-performance.test.ts` -> 1 of 6 tests failed as expected: `dashboard: expected 60 to be greater than or equal to 300`.
- GREEN commit: `15dcd88 fix: keep private page cache warm for five minutes`
  - Targeted run passed 6 of 6 tests.

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

### Final five-minute private cache release

- Deployment: `dpl_CntKKSAEDiQNoKVyWbmAAZaqFFgr`
- Commit: `15dcd884fa8519c1aff278849f0b4f1d7ab31f09`
- URL: `monmag-fhl6e3i65-lhs21.vercel.app`
- Alias: `monmag.vercel.app`
- State: `READY`, `stale: false`, `aliasError: null`
- Authenticated smoke: `https://monmag.vercel.app/dashboard?verify=warm300`
  - Title: `MonMag - Personal money management`
  - Heading: `Senang melihatmu lagi, Hugo`
  - Primary nav links: 14 including mobile duplicate routes, numeric prefixes: 0
  - Console errors: 0
- Measurement note: an earlier probe used `requestAnimationFrame` while the browser reported `document.hasFocus() === false`. That throttled the observer to 1 Hz and produced misleading ~1000 ms readings. The final probe polls through a `MessageChannel` task instead, still resolves only when the URL changed, `main h1` changed, and no `aria-busy` skeleton remained, and does not throttle observation.
- Warmed sequence after page prefetches completed:
  - Transaksi to Akun: 9.0 ms
  - Akun to Anggaran: 6.8 ms
  - Anggaran to Tabungan: 7.3 ms
  - Tabungan to Dasbor: 9.6 ms
  - Dasbor to Laporan & analitik: 8.0 ms
  - Laporan & analitik to Notifikasi: 6.3 ms
  - Notifikasi to Pengaturan: 12.0 ms
  - Pengaturan to Transaksi: 12.7 ms
  - Transaksi to Akun: 7.0 ms
- Maximum: 12.7 ms. All 9 measured switches are `<=50 ms`. A second sequence (8.1, 8.4, 7.1, 6.8, 7.6 ms) fired zero new `_rsc` requests, confirming the destination content came from the client Router Cache rather than a navigation round trip. Console errors: 0.
- The five-minute `stale` value follows the Next.js prefetching guide: cached `use cache: private` content is reused from the client Router Cache at `stale >= 5 minutes`, while lower values fetch again on every navigation. Cold navigation still fetches user-specific data and is not part of the warm-switch guarantee.
- Doc-only commit `7562951` deployed as `dpl_FErgvXszTb9CyPnSZofPueLZbbUa`. Alias state was `READY`, `stale: false`, `aliasError: null`, with the same app code as `15dcd88`.
- On that alias, a fresh direct visit still populated caches on the first client navigations (Transaksi 2845.6 ms, returning Dasbor 1216.2 ms). After those first visits, a repeated sequence was 7.9, 12.0, 11.0, 11.8, 17.3, 9.9 ms with zero new `_rsc` requests. This matches the documented cold-cache exception; the `<=50 ms` guarantee applies to warmed switches.

## Remaining operator-only / pending items

- Clerk secret cleanup is complete: only `vercel-production-20261124-r4` remains active. Post-cleanup production smoke test rendered the dashboard with 0 console errors and 0 numeric navigation prefixes.
- Clerk session `104.28.194.247` was reviewed and intentionally kept active. Current Clerk detail reports it in Medan, Indonesia, and its Chrome 152.0.7977.167 user agent matches the operator browser used for these measurements.
- Clerk `Secured by` footer removal and MFA/admin 2FA require a Pro plan.
- Live two-user ownership isolation check remains NOT PERFORMED because only one production user is available.

No secret values, verification codes, or passwords are recorded in this document.
