# TDD Evidence - Multilingual and Global Redesign

## Source plan

No `*.plan.md` was supplied. Journeys were derived from the MonMag product requirements: ten world languages, localized operational copy, display-only currency conversion, numeric dates in every locale, hydration-safe client locale detection, and localized Server Action/API errors.

## User journeys

1. As a user in any supported locale, I want all navigation, page, form, dialog, empty-state, confirmation, and settings copy translated so the interface is usable without reading English.
2. As a signed-out visitor, I want the landing page and sign-in/up fallback copy in my browser language without breaking server rendering or hydration.
3. As a signed-in user, I want my stored language preference to drive action results, API errors, and CSV headers even when an operation fails.
4. As a user with accounts in different currencies, I want form labels to stay in the account's real currency while my display preference only changes presentation.
5. As an accessibility user or screen-reader user, I want loading labels, dialog labels, and navigation labels localized.
6. As a maintainer, I want source guards that fail when hardcoded operational English is reintroduced into the guarded surfaces.

## Task report

| Task | Execution | Validation | Evidence | Guarantee |
|---|---|---|---|---|
| Expand the catalog to ten locales | Extended `src/lib/i18n.ts` to 457 keys for `en`, `es`, `fr`, `de`, `zh`, `ja`, `ar`, `pt`, `hi`, `id`; added `app.name = MonMag` in every locale. | `npm test -- tests/i18n.test.ts` | RED: 40 tests, 5 failed, 35 passed. GREEN: 40/40 passed. | Every supported locale has complete catalog entries for navigation, dashboard, forms, onboarding, errors, and empty states. |
| Add hydration-safe browser locale detection | Added `useClientLocale()` using `useSyncExternalStore`: server/first render `en`, browser locale after hydration. Landed copy through client `LandingContent`; kept server `SignedInRedirect`. | `npm run typecheck`; `npm run build` | PASS. | Server rendering remains deterministic and the browser locale is applied only after hydration. |
| Propagate locale through Server Actions | Wrapped all 23 Server Actions with `authedAction`, capturing `localeOf(user.preferredLanguage)` before the operation and passing it to `runAction`. | `npm test -- tests/action-result.test.ts`; full suite | PASS. | Success and failure messages follow the acting user's stored language, including errors thrown inside actions. |
| Localize API and error envelopes | `runAction()` returns safe localized messages for status `< 500`; `toApiError()` uses `localizedError(500, "internal_error", "error.unexpected")`; `api.fail()`/`route()` localize via catalog keys. | `npm test -- tests/action-result.test.ts tests/errors.test.ts` | PASS; `tests/errors.test.ts` updated for the new `messageKey`/`messageParams` contract. | Unexpected errors do not leak internals and still produce a localized user-facing message. |
| Localize service-layer errors | Converted `categories.ts` and `accounts.ts` operational errors to `localizedError(...)`; other services already use catalog-backed error keys. | `npm test -- tests/i18n.test.ts` | Source guards PASS. | Default-category deletion and archive-instead messages are no longer hardcoded English. |
| Localize CSV export | Added `buildTransactionCsv(rows, locale)` with catalog-backed headers; export route passes `localeOf(user.preferredLanguage)`. | `npm test -- tests/transaction-export.test.ts` | New regression asserts Indonesian `Tanggal`/`Jumlah (desimal)`/`Metode pembayaran` and Japanese `日付`/`金額（10進数）`/`支払い方法`. | Exported CSV headers follow the user's locale without changing stored money values. |
| Localize chrome and fallbacks | Localized `action-result.ts`, `api.ts`, `ui.ts`, `form-status.tsx`, `page-skeleton.tsx`, `modal.tsx`, `app-chrome.tsx`, sign-in/sign-up Suspense fallbacks, and error/not-found pages. | `npm test -- tests/i18n.test.ts`; `npm run lint` | PASS. | Loading, error, success, dialog, and navigation chrome is translated. |
| Add source guards | `tests/i18n.test.ts` now scans 27 guarded source paths for known hardcoded English strings. | `npm test -- tests/i18n.test.ts` | RED before localization: 5 source-guard failures. GREEN: 40/40 passed. | Reintroducing the old hardcoded copy breaks CI. |
| Verify catalog integrity | Ran the i18n audit script against `src/lib/i18n.ts` and `src`. | `node <temp>/i18n-audit.js` | `DEFINED_KEYS=459`, `USED_KEYS=322`, `DUPLICATES=[]`, `MISSING=[]`, `UNUSED_COUNT=137`. | No missing or duplicate translations; the unused count reflects dynamic key construction and retained catalog copy, not a translation gap. |
| Preserve financial correctness | Kept account currency for form inputs and BigInt minor-unit writes; display currency remains a presentation-only argument. | `npm run test:coverage` | 229/229 passed; Statements 99.18%, Branches 91.85%, Functions 100%, Lines 99.7%. | Global display preferences cannot corrupt stored amounts or minor-unit scaling. |
| Rebrand residual metadata | Renamed npm package to `monmag`, regenerated Prisma client, updated env template, seed copy, docs, and export filename. | `grep MoneyFlow\|moneyflow` | Only the legacy working-directory path `D:\WEBAPP\MoneyFlow` remains. | Product-facing and repository metadata consistently use MonMag. |

## Test specification

| # | What is guaranteed | Test file or command | Test type | Result | Evidence |
|---|---|---|---|---|---|
| 1 | Locale list is exactly the ten required languages | `tests/i18n.test.ts:exposes exactly ten world-recognized languages` | unit | PASS | `npm test -- tests/i18n.test.ts` |
| 2 | Stored preferences and locale tags resolve safely | `tests/i18n.test.ts:resolves stored preferences and validates locale codes` | unit | PASS | `npm test -- tests/i18n.test.ts` |
| 3 | RTL is applied to Arabic and LTR to English | `tests/i18n.test.ts:maps locales to Intl tags and text direction` | unit | PASS | `npm test -- tests/i18n.test.ts` |
| 4 | Application name is MonMag in every locale | `tests/i18n.test.ts:uses MonMag as the application name in every locale` | unit | PASS | `npm test -- tests/i18n.test.ts` |
| 5 | Known copy is translated in all ten locales | `tests/i18n.test.ts:translates a known key in each locale` | unit | PASS | `npm test -- tests/i18n.test.ts` |
| 6 | Missing keys fall back to the key without throwing | `tests/i18n.test.ts:falls back to English for a missing translation...` | unit | PASS | `npm test -- tests/i18n.test.ts` |
| 7 | Dashboard/preference chrome keys exist in all locales | `tests/i18n.test.ts:provides every preference-chrome and dashboard key...` | unit | PASS | `npm test -- tests/i18n.test.ts` |
| 8 | Confirmations, tables, and settings copy are localized | `tests/i18n.test.ts:localizes operational copy used in confirmations...` | unit | PASS | `npm test -- tests/i18n.test.ts` |
| 9 | View-level operational copy is localized | `tests/i18n.test.ts:localizes view-level operational copy in all ten locales` | unit | PASS | `npm test -- tests/i18n.test.ts` |
| 10 | Form fields, options, and submit labels are localized | `tests/i18n.test.ts:localizes form fields, options, placeholders and submit labels` | unit | PASS | `npm test -- tests/i18n.test.ts` |
| 11 | Onboarding, navigation, dialog, and empty states are localized | `tests/i18n.test.ts:localizes onboarding, navigation, dialog and empty-state copy` | unit | PASS | `npm test -- tests/i18n.test.ts` |
| 12 | Guarded source files contain no reintroduced hardcoded English | `tests/i18n.test.ts:localized source guards` | source guard | PASS | RED before fixes: 5 failures; GREEN: all guards pass |
| 13 | Action results use localized success/error messages | `tests/action-result.test.ts` | unit | PASS | `npm test -- tests/action-result.test.ts` |
| 14 | Unknown API errors use a localized generic message | `tests/errors.test.ts` | unit | PASS | `npm test -- tests/errors.test.ts` |
| 15 | CSV headers are localized for Indonesian and Japanese | `tests/transaction-export.test.ts:localizes CSV headers using the requested locale` | unit | PASS | `npm test -- tests/transaction-export.test.ts` |
| 16 | Account currency still drives form money input | `tests/form-currency.test.ts` | unit | PASS | `npm run test:coverage` |
| 17 | Ten-locale catalog has no missing or duplicate keys | `i18n-audit.js` | rule | PASS | `MISSING=[]`, `DUPLICATES=[]` |

## Coverage and known gaps

- Coverage command: `npm run test:coverage`
- Final result: 20 test files, 235 tests passed; Statements 99.18% (364/367), Branches 91.85% (282/307), Functions 100% (118/118), Lines 99.7% (334/335).
- Branch gaps are defensive paths and do not breach the 80% thresholds.
- There is no DOM component-test harness in the project. Browser-visible behavior was verified with local HTTP smoke checks against the Next.js dev server and live Supabase/Clerk development instance.
- The static i18n audit reports `UNUSED_COUNT=137`; these are keys reached through dynamic `t(locale, key)` sites or retained catalog copy. `MISSING=[]` and `DUPLICATES=[]` are the enforced gates.

## Live smoke evidence

- `GET /api/health`: `200`, `"status":"healthy"`.
- `GET /`: `200`, `MonMag=True`, `MoneyFlow=False`, localized landing copy present.
- `GET /sign-in`: `200`, exact `Sign In to MonMag`, no `Development mode`, no `Secured by Clerk`.
- Unauthenticated `GET /api/transactions/export`: `401`.
- Authenticated protected pages (`/dashboard`, `/transactions`, `/accounts`, `/budgets`, `/goals`, `/debts`, `/recurring`, `/reports`, `/notifications`, `/settings`, `/onboarding`): all `200`.
- Authenticated export: `200`, `text/csv; charset=utf-8`, `attachment; filename="monmag-transactions.csv"`, UTF-8 BOM present, quoted `Date` and `Currency` headers present.

## Merge evidence

- RED: `npm test -- tests/i18n.test.ts` before the final localization pass - `40 tests | 5 failed | 35 passed`.
- GREEN: same command after the pass - `40 tests | 40 passed`.
- RED: full suite at the source-guard stage - `1 failed | 227 passed (228)`.
- GREEN: full suite after fixes - `228 passed (228)`; after the CSV locale regression was added - `229 passed (229)`.
- Final gates after the anti-slop DURING pass: `npm test -- tests/anti-slop.test.ts` PASS (6/6), `npm run typecheck` PASS, `npm run lint` PASS, `npm audit --audit-level=high` found 0 vulnerabilities, `npm run test:coverage` PASS (235/235 across 20 files; Statements 99.18%, Branches 91.85%, Functions 100%, Lines 99.7%), `npm run build` PASS (19 pages/routes emitted).
- Anti-slop gate RED was observed at 5/5 failures before fixes and GREEN at 6/6 after fixes. Fixes included plain punctuation across copy/docs/schema, visible keyboard focus, two intentional glass surfaces, a localized sample-data label on the landing preview, and removal of an unsupported free-tier claim.
- Lighthouse on `/` and `/sign-in`: accessibility 1.0, best practices 1.0, SEO 1.0, no failures, no console errors.
- No commit was created and nothing was pushed. Secrets remained only in git-ignored `.env.local` and temporary operator files; no secret value was printed or staged.
