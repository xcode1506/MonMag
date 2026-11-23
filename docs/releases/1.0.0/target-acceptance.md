# Target Acceptance Evidence - 1.0.0

Date: 2026-11-24  
Scope: local Next.js dev server at `http://localhost:3000`, live Supabase PostgreSQL, Clerk development instance.  
This is **not** a production deployment record. Production deployment remains an authorized-maintainer step.

All credentials, session tokens, dev-browser tokens, connection strings, and Clerk user ids are redacted in this report. Secret values were kept only in git-ignored `.env.local` or temporary operator files and were never printed, staged, or committed.

## Verdict

| Check | Result |
| --- | --- |
| Local build/typecheck/lint/tests/coverage | PASS |
| Anti-slop DURING review gate | PASS |
| Live Supabase migration status | PASS |
| Live Supabase schema + seed rows | PASS |
| Clerk-authenticated protected pages | PASS |
| Authenticated CSV export | PASS |
| Responsive UX polish contract | PASS |
| Visible all-page editorial redesign | PASS |
| Copilot Money / Refero midnight visual direction | PASS |
| Modern chart models and surfaces | PASS |
| Public and sign-in/sign-up midnight redesign | PASS |
| Production deployment | NOT PERFORMED (no production access/authorization) |

The Terracotta journal and Slate + Electric Blue sections below are retained as historical evidence only. The current visual direction is **Copilot Money / Refero Midnight** (`Midnight Canvas · Signal Blue · Candy accents`) with modern area, net-line, and ranked-bar charts. Where the historical sections say Terracotta, cream, olive, Fraunces, Slate, Electric Blue, Console, or square ledger panels, read them as superseded by the Midnight section at the end of this document and in `visible-redesign.tdd.md`.

## 1. Local quality gates

Current final-gate commands run from `D:\WEBAPP\MoneyFlow` (the earlier file-specific commands in the historical sections below are retained for provenance but no longer describe the final suite):

```bash
npm run typecheck
npm run lint
# PowerShell environment assignment for the current Vitest config warning policy
$env:VITE_CONFIG_NATIVE_IGNORE_WARNING='true'; npx vitest run tests/midnight-direction.test.ts tests/midnight-public.test.ts tests/midnight-app-surface.test.ts
$env:VITE_CONFIG_NATIVE_IGNORE_WARNING='true'; npx vitest run tests/anti-slop.test.ts tests/ui-polish.test.ts tests/modern-charts.test.ts tests/theme.test.ts tests/money-display.test.ts tests/date-range.test.ts
npm run test:coverage
npm run build
npm audit --audit-level=high
```

Current final results after the Midnight redesign and the `theme-provider.tsx` dark-first fix:

- `npm run typecheck`: PASS.
- `npm run lint`: PASS.
- Midnight contract set: PASS - 3 files, 19/19 tests. Initial RED before implementation was `Test Files 3 failed (3)`, `Tests 14 failed (14)`.
- Six-file regression set: PASS - 6 files, 52/52 tests (`anti-slop`, `ui-polish`, `modern-charts`, `theme`, `money-display`, `date-range`). Legacy chart class contracts, Clerk title/source branding contracts, currency display, localization, reduced motion, and theme behavior remain intact.
- `npm run test:coverage`: PASS - 26 test files, 289 tests.
  - Statements: 99.2% (376/379)
  - Branches: 91.93% (285/310)
  - Functions: 100% (126/126)
  - Lines: 99.71% (344/345)
  - `src/lib/finance/chart-view-models.ts` is included in coverage and is 100% covered.
- `npm run build`: PASS - 19 pages/routes emitted.
- `npm audit --audit-level=high`: PASS - 0 vulnerabilities.

Currency and date regression evidence is in `docs/releases/1.0.0/currency-and-date-fixes.tdd.md`.
Multilingual and global redesign evidence is in `docs/releases/1.0.0/multilingual-global-redesign.tdd.md`.
Visible all-page redesign plus the superseding Slate and current Midnight evidence are in `docs/releases/1.0.0/visible-redesign.tdd.md`.

### Anti-slop DURING gate

`tests/anti-slop.test.ts` is a source-level gate derived from the `miqdadbadjuber/anti-slop` guidance, used as reference material only. It enforces plain punctuation in app copy, translated strings, docs, and the Prisma schema; visible keyboard focus; at most two intentional glass surfaces; an explicit sample-data label on the landing preview; and no unsupported free-tier claim. RED was observed at 5/5 failures before fixes; GREEN is 6/6 after fixes. No skill folders were installed and no agent configuration was edited.

### Responsive UX polish

`tests/ui-polish.test.ts` is a source-contract and behavior gate for the final UX pass. RED was first observed with a missing `@/lib/dashboard-focus` module, then two source-contract failures for mobile padding and the recoverable error reset. GREEN is 22/22 after implementation. It verifies the exact `nextActionFor` priority, responsive navigation and secondary menu, restrained motion and reduced-motion fallbacks, press/dialog/progress/toast feedback, mobile transaction cards, clear-filter recovery, readable chart amounts, first-viewport money figures, announced loading/error states, and all seven new labels in ten locales.

Rendered `/sign-in` was checked in HeadlessChrome 159 at 1440x900, 768x1024, and 390x844:

| Viewport | Result |
| --- | --- |
| 1440x900 | exact `Sign In to MonMag` heading, title `MonMag: Personal money management`, no horizontal overflow, no page errors |
| 768x1024 | same heading/title, no horizontal overflow, no page errors |
| 390x844 | same heading/title, no horizontal overflow, no page errors |

Screenshots were written to temporary operator files and were not added to the repository. In-app browser Lighthouse was rerun on `/` and `/sign-in` after the UX edits: accessibility 1.0, best practices 1.0, SEO 1.0, `failures=[]`; console error checks were empty for both pages. Clerk-rendered inline controls were not restyled or hidden.

### Visible editorial redesign

The follow-up redesign intentionally changes shared app surfaces so the difference is visible on every app page rather than being another behavior-only polish pass:

- `PageHeader` is now a newspaper-style masthead with kicker, oversized Fraunces title, and brass-ruled baseline.
- `Card` is now a square-edged ledger panel with a small brass tab instead of a rounded, shadowed card.
- `AppChrome` uses a monogram brandmark, numbered navigation rail with section dividers, breadcrumb-style `header-context`, and a ruled `app-canvas`.
- Controls, fields, skeleton blocks, empty states, and remaining feature-view surfaces were normalized to square `2px` corners or `ledger-panel`.
- The dashboard adds a dark `next-move-band` and four indexed figures in the first viewport.

`tests/visual-redesign.test.ts` locks these contracts. An authenticated HeadlessChrome probe read Clerk session/dev-browser tokens from temporary operator files without printing them, refreshed the one-time dev-browser token per navigation, and rendered 13 page/viewport combinations: all 10 app routes at 1440x900 plus dashboard, transactions, and settings at 390x844.

| Probe result | Value |
| --- | --- |
| Renders checked | 13 |
| Masthead present on every render | true |
| Ledger canvas present on every render | true |
| Numbered rail with 10 indices on every render | true |
| Brandmark present on every render | true |
| Horizontal overflow | none |
| Page errors | none |
| Masthead title font | Fraunces, 56px desktop / 36px mobile |
| Dashboard next-move band | initially dark charcoal, later updated to deep olive `rgb(61, 74, 40)` |
| Dashboard indexed figures | 4 |

Clerk tokens were regenerated only for the local probe, kept outside the repository, and never staged or committed. Screenshots were written to temporary operator files only.

### Terracotta journal direction

The selected direction `Terracotta journal` replaces the earlier paper and brass palette without changing the shared layout contracts:

- Day mode uses warm cream `#f6efe2`, brick terracotta `#b34429`, olive `#566b35`, and deep olive `#3d4a28`.
- Night mode uses `#1d1a14` with terracotta `#e07b52` and olive `#a8b878` accents.
- The masthead kicker now shows a terracotta `MM` journal seal and `Journal` label.
- Ledger panels use a full-height terracotta spine, the top bar uses a terracotta rule, and the active rail item uses a terracotta marker.
- The dashboard next-move band is deep olive with terracotta edging.
- Remaining amber utility colors were replaced with a muted heritage gold so utility states stay distinct without reintroducing generic SaaS colors.

`tests/journal-direction.test.ts` locks the palette and surface contracts. A rerun of the authenticated HeadlessChrome probe checked 13 page/viewport combinations:

| Probe result | Value |
| --- | --- |
| Renders checked | 13 |
| Masthead/canvas/nav/brandmark contracts | all true |
| Journal seal on every render | true |
| Cream body background on every render | `rgb(246, 239, 226)` |
| Terracotta brandmark on every render | `rgb(179, 68, 41)` |
| Journal kicker on every render | true |
| Olive next-move band on desktop dashboard | `rgb(61, 74, 40)` |
| Horizontal overflow | none |
| Page errors | none |

### Public and auth journal extension

The user reported that the old design was still visible while the in-app browser was on `/sign-in`. Diagnosis: the app pages had already adopted the Terracotta journal palette, but the landing and Clerk auth surfaces still used the earlier rounded/atmospheric language. The same journal identity was therefore extended to the public surfaces:

- `/` now has a cream `landing-masthead`, `MM` issue seal, `Journal` label, and ruled `journal-rule`.
- The floating parallax orbs, glass surfaces, and `hero-float-card` were removed. The hero preview is now a square `journal-preview-panel` ledger sheet with a ruled top edge.
- The final call to action is a deep olive `journal-cta-band` with terracotta left edging and legible muted copy.
- `/sign-in` and `/sign-up` share an `auth-masthead` and a square `auth-sheet` ledger panel.
- Clerk controls use the supported `borderRadius: "2px"` and theme-aware `var(--brand)` / `var(--foreground)` appearance options. No CSS hiding was added for Clerk branding.

`tests/public-journal.test.ts` locks these contracts. A HeadlessChrome probe rendered `/`, `/sign-in`, and `/sign-up` at 1440x900, 768x1024, and 390x844:

| Probe result | Value |
| --- | --- |
| Renders checked | 9 (3 routes x 3 viewports) |
| Masthead on every render | true |
| Journal rule on every render | true |
| `MM` issue seal on every render | true |
| Cream body background on every render | `rgb(246, 239, 226)` |
| Terracotta brand token on every render | `#b34429` |
| Landing ledger preview on all landing renders | true |
| Deep olive CTA band on all landing renders | `rgb(61, 74, 40)` |
| Auth ledger sheet on all auth renders | true |
| Exact sign-in heading | `Sign In to MonMag` |
| `Development mode` text | absent via supported Clerk option |
| `Secured by Clerk` text | absent in this development render; full removal remains a Clerk Dashboard Branding setting as documented in `clerk-branding.md` |
| Horizontal overflow | none |
| Page errors | none |

A stale intermediate dev-server bundle briefly logged a `ParallaxLayer` reference error from the partially edited landing file. The remaining JSX was removed, the obsolete `src/components/marketing/parallax-layer.tsx` file was deleted, the dev server was restarted, and the final 9-render probe recorded no page errors. Screenshots were written to temporary operator files only and were not added to the repository.

## 2. Live Supabase database

### Migration

Supabase MCP calls (project ref redacted):

```text
initialize
tools/list
list_tables
apply_migration { "name": "0001_init", "sql": "<contents of prisma/migrations/0001_init/migration.sql>" }
list_migrations
```

Observed:

- MCP `initialize`: PASS, server `supabase`, version `0.19.0`.
- `tools/list`: 29 tools available, including `list_tables`, `list_migrations`, `apply_migration`, and `execute_sql`.
- Before migration, the app schema was empty apart from the pre-existing `public.MonMag` table.
- `0001_init` applied successfully.
- `list_migrations` reported version `20261123123012` for `0001_init`.
- `prisma/schema.prisma` contains 13 application models: `User`, `Account`, `Category`, `Transaction`, `Transfer`, `Budget`, `SavingsGoal`, `SavingsContribution`, `Debt`, `DebtPayment`, `RecurringTransaction`, `Notification`, `AuditLog`.

Prisma confirmation:

```bash
npx prisma migrate status
```

Result: `Database schema is up to date!`

### Connection path

The direct database host resolved to AAAA records only and could not be reached over IPv4. The successful connection used the regional **session pooler** host on port `5432` with the `postgres.<ref>` username. The password was rotated through the Supabase Management API:

```text
PATCH /v1/projects/{project_ref}/database/password
```

Result: HTTP 200, `Successfully updated password`. The new password was written only to `.env.local`. A direct SQL attempt to alter the role was rejected with `42501: permission denied to alter role`, so the Management API path was used instead.

Guidance from this run is documented in `docs/SETUP.md`, `docs/DEPLOYMENT.md`, and `.env.example`.

## 3. Seed data

Command:

```bash
DEMO_CLERK_USER_ID=<test-user-id> npm run db:seed
```

Result: PASS. Seed output reported:

- 3 accounts
- 6 categories
- 16 transactions
- 2 transfers
- 2 budgets
- 2 savings goals
- 4 savings contributions
- 1 debt
- 3 debt payments
- 2 recurring rules
- 3 notifications

Supabase MCP `execute_sql` count query separately confirmed the seeded rows for `User`, `Account`, `Category`, `Transaction`, `Transfer`, `Budget`, `SavingsGoal`, `Debt`, `RecurringTransaction`, and `Notification`.

## 4. HTTP smoke tests

Dev server was started in the background with:

```bash
npm run dev
```

Health readiness probe:

```bash
curl.exe -s -o NUL -w '%{http_code}' --max-time 5 http://localhost:3000/api/health
```

Result: `200`.

### Public routes

| Request | Result |
| --- | --- |
| `GET /api/health` | `200`, body contained `"status":"healthy"` |
| `GET /` | `200`, contained `MonMag`, no `MoneyFlow`, localized landing copy present |
| `GET /sign-in` | `200`, exact heading `Sign In to MonMag`, no `Development mode`, no `Secured by Clerk` |
| `GET /sign-up` | `200`, journal auth sheet and masthead present |
| `GET /api/transactions/export` without cookies | `401` |

Post anti-slop landing probe on `/`: contained `Sample figures shown for illustration only.`, no `glass-chip` or `glass-stat` markup, and no `Create your free workspace` claim. The later public-surface probe additionally confirmed the journal masthead, square ledger preview, deep olive CTA band, and no horizontal overflow across desktop, tablet, and mobile.

### Clerk development session setup

A Clerk test session was created through the Backend API and a dev-browser token through the Frontend API:

```text
POST /v1/sessions
POST /v1/sessions/{session_id}/tokens
POST /v1/dev_browser   (Frontend API, with Origin: http://localhost:3000)
```

All returned token values were stored in temporary operator files and redacted here.

The session JWT `iat` was decoded locally and reused as `__client_uat`. The final authenticated cookie shape was:

```text
__session=<redacted>; __clerk_db_jwt=<redacted>; __client_uat=<session iat>
```

Diagnostic sequence:

- `__session` only: `x-clerk-auth-status: signed-out`, reason `dev-browser-missing`.
- `__session` + `__clerk_db_jwt` with current time as `__client_uat`: `signed-out`, reason `session-token-iat-before-client-uat`.
- `__session` + `__clerk_db_jwt` with session `iat` as `__client_uat`: authenticated; seeded dashboard content rendered.

PowerShell smoke pattern (values read from temp files, never echoed):

```powershell
$sessionToken = (Get-Content 'C:\Users\XcodeAdmirer\AppData\Local\Temp\opencode\clerk-session-token.txt' -Raw).Trim()
$dbToken = (Get-Content 'C:\Users\XcodeAdmirer\AppData\Local\Temp\opencode\clerk-dev-browser-token.txt' -Raw).Trim()
$cookie = "__session=$sessionToken; __clerk_db_jwt=$dbToken; __client_uat=<session iat>"
curl.exe -s -o NUL -w '%{http_code} %{redirect_url}' --max-time 90 -H "Cookie: $cookie" http://localhost:3000/dashboard
```

### Protected pages

Authenticated requests using the cookie above:

| Route | HTTP | Redirect |
| --- | --- | --- |
| `/dashboard` | 200 | none |
| `/transactions` | 200 | none |
| `/accounts` | 200 | none |
| `/budgets` | 200 | none |
| `/goals` | 200 | none |
| `/debts` | 200 | none |
| `/recurring` | 200 | none |
| `/reports` | 200 | none |
| `/notifications` | 200 | none |
| `/settings` | 200 | none |
| `/onboarding` | 200 | none |

Rendered data markers:

- `/dashboard` contained `Demo Cash Wallet`, `Demo Bank Account`, `Net worth`, `Hello,`, and `Cash flow`.
- `/accounts` contained `Demo E-Wallet`.
- `/goals` contained `Demo emergency fund`.

An early probe of `/savings` returned `404`; that path is not implemented. The correct savings-goal route is `/goals`, verified as `200` above.

### Authenticated export

```bash
curl.exe -s -D - -o NUL --max-time 90 -H "Cookie: $cookie" http://localhost:3000/api/transactions/export
```

Result:

- `HTTP/1.1 200 OK`
- `content-type: text/csv; charset=utf-8`
- `content-disposition: attachment; filename="monmag-transactions.csv"`

A dedicated post-localization probe confirmed the BOM and quoted header row:

```text
STATUS=200
CONTENT_TYPE=text/csv; charset=utf-8
CONTENT_DISPOSITION=attachment; filename="monmag-transactions.csv"
HAS_UTF8_BOM=True
HAS_DATE_HEADER=True
HAS_CURRENCY_HEADER=True
FILENAME_OK=True
```

The seeded test user's stored locale is English, so the live header row is English. Indonesian and Japanese header localization is covered by `tests/transaction-export.test.ts`.

### Multilingual catalog check

```text
DEFINED_KEYS=469
USED_KEYS=328
DUPLICATES=[]
MISSING=[]
UNUSED_COUNT=141
```

`MISSING=[]` and `DUPLICATES=[]` are the translation gates. `UNUSED_COUNT` reflects keys reached through dynamic `t(locale, key)` call sites or retained catalog copy, not missing translations. This count predates the four Slate chart labels; those keys are verified in all ten locales by `tests/modern-charts.test.ts`.

## 5. Notes and next permitted step

- Next.js Cache Components emitted prefetch-time `NEXT_REDIRECT` diagnostics in the dev console for signed-out prefetches. These are expected for protected routes; page-level smoke still returned `200` with the correct sign-in redirect behavior for anonymous users and rendered seeded data for the authenticated user.
- No production deployment, production migration, or production smoke test was performed.
- Next permitted step: an authorized maintainer deploys to the target platform with production Clerk keys and a production database, runs `npm run db:migrate` once, then repeats the public/authenticated smoke checks above against the production origin.

## 6. Secret and git handling

- No secret value was printed into tool output, source files, or this report.
- `.env.local` remains git-ignored, untracked, and absent from the staged diff. Git confirms the ignore rule `.gitignore:34:.env*`; the only secret-shaped staged paths are the documented placeholders in `.env.example` and deployment notes.
- A local checkpoint commit was created after the final verification pass. No push was performed.
- No production credentials, session tokens, dev-browser tokens, or connection strings were staged or committed.

## 7. Slate + Electric Blue redesign and modern charts (historical evidence)

The user's later instruction `pakai desain warna ini Slate + Electric Blue` superseded the earlier Terracotta direction at the time. That pass used the `Technology · Clean · Data-driven` namespace.

### Source and behavior gates

- RED baseline for the five current gates: `Test Files 4 failed | 1 passed (5)`, `Tests 10 failed | 33 passed (43)`.
- GREEN command: `$env:VITE_CONFIG_NATIVE_IGNORE_WARNING='true'; npx vitest run tests/slate-direction.test.ts tests/public-console.test.ts tests/visual-redesign.test.ts tests/modern-charts.test.ts tests/ui-polish.test.ts`.
- GREEN result: `Test Files 5 passed (5)`, `Tests 51 passed (51)`.
- New chart model coverage: `npx vitest run tests/modern-charts.test.ts --coverage --coverage.include='src/lib/finance/chart-view-models.ts'` reported 100% statements, branches, functions, and lines.
- Full suite after the redesign: 26 files, 291 tests passed; coverage 99.2% statements, 91.93% branches, 100% functions, 99.71% lines.
- `npm run typecheck`, `npm run lint`, `npm run build`, and `npm audit --audit-level=high` all passed after the redesign; audit reported 0 high-or-worse vulnerabilities.

### Chart changes

- Added `src/lib/finance/chart-view-models.ts` with `buildCashflowTrend` and `rankCategories`. Inputs are not mutated; net flow is derived from income/expense; category share is derived from the full category set even when the bar view is truncated.
- Replaced the pie chart with `CashflowChart` (area bands), `NetTrendChart` (line with explicit zero reference and peak caption), and `CategoryRankingChart` (ranked horizontal bars with share and amount labels).
- Dashboard uses all three views; reports uses the net-line and ranked-bar views.
- Added `dashboard.netFlow`, `dashboard.peakMonth`, `dashboard.categoryRank`, and `dashboard.share` to all ten locales.
- Preserved legacy class contracts required by `tests/ui-polish.test.ts`: `cashflow-chart`, `category-chart`, `category-breakdown`, and `money(` formatting.

### Local browser render evidence

Production build was served locally with `npm run start -- -p 3100` and rendered in the in-app Chromium. After clearing stale theme storage, the public and sign-in pages reported:

| Probe | Value |
| --- | --- |
| Body background | `rgb(15, 23, 42)` (Slate `#0F172A`) |
| `--brand` | `#3b82f6` (Electric Blue `#3B82F6`) |
| `--brand-accent` | `#60a5fa` (Light Blue `#60A5FA`) |
| `--surface` | `#1e293b` (Surface `#1E293B`) |
| `--foreground` | `#f1f5f9` (Text `#F1F5F9`) |
| Landing seal / label | `MM` / `CONSOLE` |
| Landing `Journal` text | absent |
| Sign-in heading | `Sign In to MonMag` |
| Clerk root radius | `0px` |
| Horizontal overflow | none on `/` or `/sign-in` |
| Screenshots | temporary operator files only; not added to the repository |

Known gap from the live render: Clerk's `Secured by` footer text remains visible. Full removal requires Clerk Dashboard Branding as documented in `clerk-branding.md`; no CSS hiding was introduced. Clerk telemetry requests failed in this sandbox with `ERR_TUNNEL_CONNECTION_FAILED`; this is an environment network limitation, not an application page error.

Authenticated dashboard and reports were not re-rendered in that Slate pass because no fresh Clerk dev-browser token was available. Their contracts are covered by source tests, the full suite, typecheck, lint, build, and the earlier authenticated probe. The Slate section is historical; see section 8 for the current Midnight evidence.

## 8. Copilot Money / Refero Midnight redesign (current)

Source of truth: [Refero style 91b110da](https://styles.refero.design/style/91b110da-902b-4d09-8bf0-26bd1f25f8b2) and its [hero screenshot](https://images.refero.design/styles/refero.design/image/5d753801-0afe-456d-8726-4cce5626dd34.jpg). The earlier Slate + Electric Blue direction was superseded after the user reported that the prior result was not satisfactory.

### Design contract implemented

- Exact base tokens: Midnight Canvas `#000814`, Deep Surface `#010d1e`, Indigo Surface `#001533`, Cobalt Surface `#00215e`, Steel Border `#11263b`, Signal Blue `#1c6cff`, Paper White `#ffffff`, Fog `#ccced0`, Mist `#999ca1`.
- Candy accents: Coral `#ff4433`, Lime `#00cc4b`, Tangerine `#ff8833`, Hot Pink `#ff33aa`, Violet `#9019e6`, Sunflower `#ffcc02`, Sky `#00acfe`, Ember `#ea687c`, Olive `#94ae43`, Slate `#5c6f8a`.
- Typography: `Space Grotesk` display substitute, `Inter` body at weight `100`, all-caps eyebrows at `0.04em`, display tracking `-0.02em`.
- Shape and rhythm: 4px base unit, 1200px max width, 80-120px section gaps, 24px card padding, 16px element gaps, image radius 8px, button radius 16px, tag radius 20px, card radius 24px, container radius 40px.
- Elevation: inset shadows only; no drop shadows or decorative gradients. Signal Blue is the only filled CTA color.
- Hero: flat midnight tonal bands with six candy tags rotated `-12°`, `-9°`, `-6°`, `6°`, `9°`, `12°`, scattered rather than grid-aligned.
- App surfaces: rounded inset vault panels, numbered workspace rail with Signal Blue active state, midnight chart grid, and candy default category palette.
- Theme: `ThemeProvider` uses `attribute="class"`, `defaultTheme="dark"`, and `disableTransitionOnChange`. `enableSystem` was removed because system light mode overrode the midnight default.

### TDD and final gate evidence

- RED command and result: `npx vitest run tests/midnight-direction.test.ts tests/midnight-public.test.ts tests/midnight-app-surface.test.ts --reporter=dot` before implementation produced `Test Files 3 failed (3)`, `Tests 14 failed (14)`.
- GREEN command and result: the same command after implementation produced `Test Files 3 passed (3)`, `Tests 19 passed (19)`.
- Regression command and result: `$env:VITE_CONFIG_NATIVE_IGNORE_WARNING='true'; npx vitest run tests/anti-slop.test.ts tests/ui-polish.test.ts tests/modern-charts.test.ts tests/theme.test.ts tests/money-display.test.ts tests/date-range.test.ts --reporter=dot` produced `Test Files 6 passed (6)`, `Tests 52 passed (52)`.
- Full final suite: `npm run test:coverage` produced `Test Files 26 passed (26)`, `Tests 289 passed (289)`, Statements 99.2%, Branches 91.93%, Functions 100%, Lines 99.71%.
- `npm run typecheck`, `npm run lint`, `npm audit --audit-level=high` (0 vulnerabilities), and `npm run build` (19 routes) all passed after the final `theme-provider.tsx` edit.

### Local browser render evidence

The production build was served with `npm run start -- -p 3100` and probed with HeadlessChrome 159 at 1440x900, 768x1024, 390x844, 375x667, and 667x375. Both `/` and `/sign-in` were checked at every size: 10 render combinations.

| Probe | Value |
| --- | --- |
| `html` class on every render | includes `dark` |
| Body background on every render | `rgb(0, 8, 20)` |
| `--background` / `--surface` | `#000814` / `#010d1e` |
| `--indigo-surface` / `--cobalt-surface` | `#001533` / `#00215e` |
| `--border` / `--brand` | `#11263b` / `#1c6cff` |
| Body font weight | `100` |
| Landing display tracking | `-2.4px` at 120px display size (`-0.02em`) |
| Landing eyebrow tracking | `0.44px` at 11px size (`0.04em`) |
| Landing display font | `Space Grotesk` with the configured fallback stack |
| Landing tag count and rotations | 6 tags; `-12,-9,-6,6,9,12` |
| Vault preview background | `rgb(1, 13, 30)` |
| Vault shadow | inset-only: top `rgba(255,255,255,0.05)` and bottom `rgba(0,8,20,0.55)` |
| Primary landing CTA | `rgb(28, 108, 255)` (Signal Blue) |
| Auth sheet background | `rgb(1, 13, 30)` |
| Obsolete Slate/Terracotta palette in HTML or computed colors | none |
| Horizontal overflow | none on any render |
| Application page errors | none on any render |

Screenshots were written only to temporary operator files and were not added to the repository.

The Clerk sign-in component was unavailable in the final headless sandbox render (external Clerk JS did not load), so that 10-render probe measured the app-rendered auth shell rather than Clerk's form. The exact title is enforced by source contract in `tests/midnight-public.test.ts` through `src/app/layout.tsx` and was observed in an earlier post-theme browser check with a warmed Clerk session: `Sign In to MonMag`. The `Secured by` footer remains visible in Clerk's render; full removal requires Clerk Dashboard Branding as documented in `clerk-branding.md`. No CSS hiding was introduced.

Authenticated dashboard and reports were not re-rendered in this final Midnight pass because no fresh Clerk dev-browser token was available. Their Midnight source contracts are covered by `midnight-app-surface.test.ts`, the 52-test regression set, the full 289-test suite, typecheck, lint, build, and the earlier authenticated probe. Production target acceptance remains **NOT PERFORMED (no production access/authorization)**.
