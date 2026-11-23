# TDD Evidence - Visible All-Page Redesign

> The Terracotta journal and Slate + Electric Blue sections below are historical. The current, superseding direction is the **Copilot Money / Refero Midnight** follow-up at the end of this file.

## Source plan

No `*.plan.md` was supplied. Journeys were derived from the user's selected scope, `Semua halaman app`, and from the prior finding that the earlier pass was UX polish rather than a visible design change. Plan content was treated as intent only; no destructive or credential-handling instruction was accepted from it.

## User journeys

1. As a signed-in user, I want every app page to open with a distinct ledger masthead so I can immediately tell the redesign was applied.
2. As a user moving between dashboard, transactions, accounts, budgets, goals, debts, recurring, reports, notifications, and settings, I want one consistent workspace identity rather than page-specific card styles.
3. As a keyboard or screen-reader user, I want the redesign to preserve the existing focus, navigation, reduced-motion, and localization contracts.
4. As a mobile user, I want the stronger identity without horizontal overflow or unreadable figures.
5. As a maintainer, I want source gates that fail if the generic rounded-card look is reintroduced.

## Task report

| Task | Execution | Validation | Evidence | Guarantee |
|---|---|---|---|---|
| Define the redesign contract first | Added `tests/visual-redesign.test.ts` with masthead, ledger panel, numbered rail, stylesheet tokens, dashboard band, responsive/motion preservation, consistency, and square-control checks. | `npm test -- tests/visual-redesign.test.ts` | Initial RED: 5/6 failures. Consistency RED: 2/8 failures. Final GREEN: 8/8. | The intended visual change is specified before production code is changed. |
| Convert the shared page header | `PageHeader` now renders `page-masthead`, `masthead-kicker`, `masthead-title`, `masthead-body`, and `masthead-rule`. | `npm run typecheck`; visual probe | PASS; masthead present on all 13 renders. | All 10 app pages share the same editorial opener. |
| Convert the shared card primitive | `Card` now uses `ledger-panel` with square corners and a brass tab instead of `rounded-lg` and a custom drop shadow. | Source test; visual probe | PASS; `ledger-panel` present across dashboard, reports, budgets, and other routes. | Feature panels stop reading as generic SaaS cards. |
| Rebuild the workspace chrome | Added `app-brandmark`, numbered `nav-index` rail with section dividers, breadcrumb `header-context`, and ruled `app-canvas`. | Visual probe | 10 nav indices, 1 brandmark, and canvas on every render. | Navigation and canvas change on every app page, not just the dashboard. |
| Redesign the dashboard first viewport | Added `next-move-band` and four `figure-index` markers around on-hand, earned, spent, and saved figures. | Visual probe | Dark band `rgb(29, 26, 21)`; 4 indexed figures at desktop and mobile. | The first viewport still answers the money questions with a stronger visual hierarchy. |
| Normalize remaining surfaces | Replaced leftover `rounded-xl`/`rounded-lg` in feature views; square controls, fields, skeletons, empty states, and stat icon wells; added `ledger-panel` to remaining custom strips and mobile transaction cards. | Source test; full coverage | PASS; 8/8 visual tests, 270/270 suite tests. | The redesign does not stop at shared primitives. |
| Preserve behavior and access | Kept all action handlers, locale props, mobile tab bar, reduced-motion rules, and anti-slop guards unchanged. | `npm test -- tests/ui-polish.test.ts tests/anti-slop.test.ts` | 36/36 targeted tests PASS. | The visible redesign does not regress behavior, localization, or accessibility contracts. |

## Test specification

| # | What is guaranteed | Test file or command | Test type | Result | Evidence |
|---|---|---|---|---|---|
| 1 | Shared page header is a ledger masthead | `tests/visual-redesign.test.ts:turns the shared page header into a ledger masthead` | source contract | PASS | RED before change; GREEN after |
| 2 | Shared card is a square-edged ledger panel | `tests/visual-redesign.test.ts:turns the shared card into a square-edged ledger panel` | source contract | PASS | No `rounded-lg` or custom shadow in `card.tsx` |
| 3 | Chrome is a numbered financial rail | `tests/visual-redesign.test.ts:makes the workspace chrome read as a numbered financial rail` | source contract | PASS | `app-brandmark`, `nav-index`, `header-context`, `app-canvas` present |
| 4 | Tokens are defined once in the stylesheet | `tests/visual-redesign.test.ts:defines the new ledger surface tokens once in the stylesheet` | source contract | PASS | All six selectors present; tabular numerals enabled |
| 5 | Dashboard has a distinct next-move band and indexed figures | `tests/visual-redesign.test.ts:gives the dashboard a distinct next-move band and indexed figures` | source contract | PASS | `next-move-band` and `figure-index` present |
| 6 | Leftover generic rounding is removed from feature views | `tests/visual-redesign.test.ts:removes leftover generic rounding from app feature surfaces` | source contract | PASS | RED: 1 failure; GREEN after view normalization |
| 7 | Controls use the ledger square-corner identity | `tests/visual-redesign.test.ts:uses square controls as part of the ledger identity` | source contract | PASS | RED: 1 failure; GREEN after button/field changes |
| 8 | Existing responsive and motion contracts remain intact | `tests/visual-redesign.test.ts:keeps the existing responsive and motion contracts intact` | source contract | PASS | Mobile tab bar, progress animation, reduced-motion rule retained |
| 9 | All app routes render the redesign without overflow | HeadlessChrome probe via temporary `monmag-redesign-visual.mjs` | browser render | PASS | 13 renders; all mastheads/canvases/nav/brandmark; no overflow or page errors |
| 10 | Existing UX and anti-slop gates remain green | `npm test -- tests/ui-polish.test.ts tests/anti-slop.test.ts` | regression | PASS | 36/36 tests |

## Terracotta journal follow-up

After the editorial layout was verified as visible, the user chose `Terracotta journal` as the replacement color and identity direction. The same TDD order was used.

| Task | Execution | Validation | Evidence | Guarantee |
|---|---|---|---|---|
| Lock the new direction first | Added `tests/journal-direction.test.ts` for cream/brick/olive tokens, journal seal, terracotta panel spine, active rail accent, olive next-move band, and preserved square controls. | `npm test -- tests/journal-direction.test.ts` | Initial RED: 5/6 failures. Final GREEN: 6/6. | The color change is specified before production styling is replaced. |
| Replace the palette | Updated `src/app/globals.css` day/night tokens to cream, terracotta, olive, and deep olive, including Tailwind theme aliases and glass surfaces. | Source test; visual probe | PASS; cream `rgb(246, 239, 226)` on all 13 renders. | The visible color identity changes across the whole app. |
| Restyle shared identity surfaces | Changed the masthead kicker to a terracotta `MM` seal plus `Journal`, gave ledger panels a full-height terracotta spine, added a top-bar rule and active rail marker, and made the brandmark solid terracotta. | Source test; visual probe | PASS; seal, brandmark, and kicker true on all 13 renders. | The new direction is visible on every app page through shared components. |
| Recolor the dashboard next move and utility states | Set the next-move band to deep olive with terracotta edging and replaced leftover utility amber with muted heritage gold in `badge.tsx`, `budgets-view.tsx`, and the dashboard progress state. | Source test; visual probe | PASS; desktop band `rgb(61, 74, 40)`. | Accent hierarchy stays coherent without reintroducing generic SaaS colors. |
| Preserve behavior and layout contracts | Kept masthead, numbered rail, square controls, mobile tab bar, reduced motion, i18n, and all action handlers unchanged. | Targeted regression set | 42/42 tests across four files PASS. | The color change does not regress responsiveness, accessibility, or behavior. |

Additional test specification:

| # | What is guaranteed | Test file or command | Test type | Result | Evidence |
|---|---|---|---|---|---|
| 11 | Day and night palettes use cream, terracotta, olive, and deep olive without purple/blue accents | `tests/journal-direction.test.ts:replaces the paper and brass palette with cream, terracotta, and olive` | source contract | PASS | RED before change; GREEN after |
| 12 | Masthead uses an `MM` journal seal and `Journal` label | `tests/journal-direction.test.ts:turns the masthead kicker into a dated journal seal` | source contract | PASS | Present on all 13 browser renders |
| 13 | Ledger panels have a terracotta spine | `tests/journal-direction.test.ts:gives ledger panels a terracotta spine instead of a brass tab` | source contract | PASS | 3px full-height `var(--brand)` rule |
| 14 | Active rail item, top bar, and brandmark carry terracotta accents | `tests/journal-direction.test.ts:marks the active rail item and topbar with terracotta` | source contract | PASS | Brandmark `rgb(179, 68, 41)` on every render |
| 15 | Next-move band is deep olive with terracotta edging | `tests/journal-direction.test.ts:uses a deep olive next-move band with terracotta edging` | source contract | PASS | Band `rgb(61, 74, 40)` on desktop dashboard |
| 16 | Square controls and responsive/motion contracts remain intact | `tests/journal-direction.test.ts:keeps the square ledger controls and existing responsive contracts` | source contract | PASS | `rounded-sm`, field radius `2px`, mobile tab bar, reduced motion retained |
| 17 | Authenticated browser render verifies the new palette on every page | HeadlessChrome probe via temporary `monmag-redesign-visual.mjs` | browser render | PASS | 13 renders; all cream backgrounds, seals, kickers, brandmarks, no overflow or page errors |

## Public and auth journal extension

After the app-page redesign, the user reported that the old design was still visible while the in-app browser was on `/sign-in`. The user then confirmed the chosen direction with `iya itu yang saya mau`. The plan was intent only; no destructive or credential-handling instruction was accepted.

### User journeys

1. As a visitor, I want the landing page to use the same Terracotta journal identity as the app so the product feels coherent before sign-in.
2. As a visitor, I want sign-in and sign-up to read as journal ledger sheets rather than generic auth cards.
3. As a user on desktop, tablet, or mobile, I want the public surfaces to stay readable without horizontal overflow or decorative floating elements.
4. As a maintainer, I want a source gate that fails if parallax/glass language, rounded public cards, or non-square Clerk controls return.

### Task report

| Task | Execution | Validation | Evidence | Guarantee |
|---|---|---|---|---|
| Lock the public contract first | Added `tests/public-journal.test.ts` for the landing masthead, parallax removal, square ledger preview, olive CTA band, auth sheet, Clerk config, and preserved disclosure/theme contracts. | `npm test -- tests/public-journal.test.ts` | Initial RED: 6/7 failures. Final GREEN: 7/7. | The extension was specified before the public source was changed. |
| Redesign the landing page | Replaced the hero atmosphere with a cream masthead, journal rule, ruled square preview, and static ledger sheet; removed the obsolete `ParallaxLayer` component. | Source test; HeadlessChrome probe | PASS; 3 landing renders with preview and CTA band. | The first public surface now visibly matches the journal direction. |
| Redesign Clerk auth surfaces | `AuthFrame` now renders `auth-masthead`, `MM` seal, `Journal` label, and a square `auth-sheet` ledger panel for both sign-in and sign-up. | Source test; HeadlessChrome probe | PASS; auth sheet on all auth renders. | The exact page the user complained about now carries the redesign. |
| Keep Clerk controls supported and square | Set `borderRadius: "2px"` while preserving the supported dev-warning option, exact sign-in title, and theme-aware colors; no CSS hiding was introduced. | Source test; browser text probe | PASS; `Development mode` absent, no hidden-style rule, title exact. | Branding changes stay within supported Clerk mechanisms. |
| Preserve behavior and disclosure | Kept locale routing, theme toggle, sample-data disclosure, reduced motion, and all existing app routes unchanged. | Targeted regression set; full coverage | 49/49 targeted tests, 283/283 full tests PASS. | The public redesign does not regress behavior or localization. |

Additional test specification:

| # | What is guaranteed | Test file or command | Test type | Result | Evidence |
|---|---|---|---|---|---|
| 18 | Landing header is a journal masthead | `tests/public-journal.test.ts:turns the landing header into a journal masthead` | source contract | PASS | `landing-masthead`, `issue-seal`, `Journal`, `journal-rule` present |
| 19 | Floating parallax and glass language are gone | `tests/public-journal.test.ts:removes floating parallax atmosphere from the landing page` | source contract | PASS | No `parallax-orb`, `hero-float-card`, `glass-card`, or `glass-panel` |
| 20 | Landing preview is a square ledger sheet | `tests/public-journal.test.ts:renders the landing preview as a square ledger sheet` | source contract | PASS | `ledger-panel`, `journal-preview-panel`, ruled `::before` |
| 21 | Landing CTA is a deep olive journal band | `tests/public-journal.test.ts:uses a deep olive journal band for the landing call to action` | source contract | PASS | `--olive-deep` background and 3px `--brand` left border |
| 22 | Sign-in and sign-up use auth ledger sheets | `tests/public-journal.test.ts:turns sign-in and sign-up into journal ledger sheets` | source contract | PASS | `auth-masthead`, `auth-sheet`, `ledger-panel` present |
| 23 | Clerk config is square, theme-aware, and uses supported branding | `tests/public-journal.test.ts:keeps Clerk square and theme aware without hiding supported UI` | source contract | PASS | `2px`, `--brand`, `--foreground`, exact title, no hidden-style rule |
| 24 | Public routes render the redesign on three viewports | HeadlessChrome probe via temporary `monmag-public-visual.mjs` | browser render | PASS | 9 renders; all mastheads/rules/seals, no overflow or page errors |

A stale intermediate dev-server bundle briefly logged a `ParallaxLayer` error from the partially edited landing file. The remaining JSX was removed, the obsolete component file was deleted, the dev server was restarted, and the final 9-render probe recorded no page errors.

## Coverage and known gaps

- Coverage command: `npm run test:coverage`
- Final result after the public/auth extension: 25 test files, 283 tests passed; Statements 99.18% (364/367), Branches 91.85% (282/307), Functions 100% (118/118), Lines 99.7% (334/335). Earlier editorial-redesign result was 23 test files, 270 tests passed with the same percentages; the terracotta app-page follow-up was 24 files and 276 tests.
- The branch gap remains defensive paths and stays well above the 80% threshold.
- The public/auth browser probe needs no Clerk session. The earlier authenticated app-page probe used temporary Clerk session/dev-browser tokens read from operator temp files; values were never printed, staged, or committed. The one-time dev-browser token was refreshed per navigation.
- Screenshots were written only to temporary operator files and were not added to the repository.
- Full Clerk `Secured by` footer removal requires the Clerk Dashboard Branding setting described in `docs/releases/1.0.0/clerk-branding.md`; no CSS hiding was introduced.
- No production deployment or production visual check was performed; production acceptance remains an authorized-maintainer step.

## Merge evidence

Checkpoint commits were not created because the user has not requested a commit. RED/GREEN evidence is preserved in this report and in `docs/releases/1.0.0/target-acceptance.md`. Final gates after the public/auth extension: typecheck PASS, lint PASS, targeted 49/49 tests PASS across 5 files, full 283/283 tests PASS across 25 files, coverage PASS above all 80% thresholds, build PASS with 19 routes, `npm audit --audit-level=high` PASS with 0 vulnerabilities. The authenticated 13-render app-page probe and the 9-render public/auth probe both passed with no overflow or page errors. Production acceptance remains not performed because no production access or authorization was provided.

## Slate + Electric Blue and modern charts (historical follow-up)

The later user instruction `pakai desain warna ini Slate + Electric Blue` superseded the Terracotta journal direction above at the time. That pass used the `Technology · Clean · Data-driven` identity. No plan file was provided; the user's palette, chart direction, and anti-excessive-motion guidance were treated as intent. No destructive command, credential handling, or instruction-override text was accepted from any source document.

### User journeys

1. As a user, I want the whole product to use Slate `#0F172A`, Surface `#1E293B`, Electric Blue `#3B82F6`, Light Blue `#60A5FA`, and Text `#F1F5F9` so the redesign is unmistakably different from Terracotta.
2. As a user reviewing money over time, I want income/expense areas, a net-flow line with an explicit zero baseline, and ranked spending bars so each chart answers a concrete question.
3. As a maintainer, I want chart calculations separated from React rendering and covered by tests, including immutability, zero-share, empty, and net-negative cases.
4. As a visitor or signed-in user on desktop or mobile, I want the Console identity and charts to stay readable, square-cornered, localized, and free of horizontal overflow.
5. As a maintainer, I want source gates that fail if PieChart, unwired charts, missing locales, rounded generic cards, or excessive animation return.

### Task report

| Task | Execution | Validation | Evidence | Guarantee |
|---|---|---|---|---|
| Lock the new visual and chart contract first | Rewrote `tests/slate-direction.test.ts`, `tests/public-console.test.ts`, `tests/visual-redesign.test.ts`, and `tests/modern-charts.test.ts`; kept `tests/ui-polish.test.ts` as a regression gate. | Targeted Vitest run | RED: 5 files, 10 failed tests and 33 passed tests. | The new direction was specified before production styling and chart code were changed. |
| Replace the palette and shared identity | Rewrote `src/app/globals.css` with exact Slate tokens, Console selectors, square controls, dark-first base, reduced-motion handling, and chart styles; set `defaultTheme="dark"`; removed Fraunces; rebuilt page header, landing, auth frame, and app chrome around `system-seal`/`Console`. | Source gates and browser computed styles | GREEN: 51/51 targeted tests; browser tokens matched the exact palette. | The color and typography change is visible on public, auth, and app surfaces. |
| Add chart view models | Created `src/lib/finance/chart-view-models.ts` with `buildCashflowTrend` and `rankCategories`; added it to coverage includes. | `tests/modern-charts.test.ts` and targeted coverage | 8/8 chart tests; model file 100% statements/branches/functions/lines. | Chart data is numeric, net is derived, shares are derived from the full set, and source arrays are not mutated. |
| Replace chart surfaces | Rewrote `src/components/charts/charts.tsx` with `AreaChart`, `LineChart`, `ReferenceLine`, vertical `BarChart`, shared money formatting, and no `PieChart`. All series use `isAnimationActive={false}`. | Source gate; full suite | GREEN; `ui-polish` legacy class contracts still pass. | Charts are informative and restrained rather than decorative. |
| Wire dashboard and reports | Dashboard uses cashflow area, net line, and ranked bars; reports uses net line and ranked bars. Added four chart labels to all ten locales. | Source gate; typecheck; build | GREEN; 19 routes emitted. | Both money views expose the same modern, localized chart language. |
| Preserve quality gates | Ran full coverage, typecheck, lint, build, audit, and browser render checks. | Full verification | 291/291 tests; coverage above thresholds; audit 0 vulnerabilities. | The redesign does not regress behavior, security, localization, or accessibility contracts. |

### Test specification

| # | What is guaranteed | Test file or command | Test type | Result | Evidence |
|---|---|---|---|---|---|
| 1 | Slate tokens, Console masthead, square controls, dark default, and reduced motion are present | `tests/slate-direction.test.ts` | source contract | PASS | RED before rewrite; GREEN in 51/51 targeted run |
| 2 | Landing and auth use Console surfaces with supported Clerk config and exact title | `tests/public-console.test.ts` | source contract | PASS | RED before rewrite; GREEN in 51/51 targeted run |
| 3 | Shared app surfaces keep non-generic square identity | `tests/visual-redesign.test.ts` | source contract | PASS | GREEN after removing leftover rounded feature-view classes |
| 4 | Net and category models are correct and immutable | `tests/modern-charts.test.ts:builds a net trend...`, `:ranks categories...`, `:returns stable empty models`, `:handles a zero total...` | unit | PASS | 100% coverage of `chart-view-models.ts` |
| 5 | Chart surfaces use area/line/ranked-bar views and no pie | `tests/modern-charts.test.ts:uses area, net line, and ranked bar models instead of a pie` | source contract | PASS | `AreaChart`, `LineChart`, `ReferenceLine`, `layout="vertical"`, no `PieChart` |
| 6 | Dashboard and reports use the new views | `tests/modern-charts.test.ts:wires all three models into the dashboard`, `:uses the modern models on reports too` | source contract | PASS | All required component tags present; reports has no `<CategoryChart` |
| 7 | New labels exist in all ten locales | `tests/modern-charts.test.ts:localizes the new chart labels in all ten locales` | unit/i18n | PASS | English values exactly `Net flow`, `Peak month`, `Spending rank`, `Share` |
| 8 | Legacy chart and next-move contracts remain intact | `tests/ui-polish.test.ts` | source/behavior regression | PASS | 22/22 in full suite |
| 9 | Public/auth pages render with the exact palette | In-app Chromium on `http://localhost:3100` after clearing stale theme storage | browser render | PASS | Computed tokens `#3b82f6`, `#60a5fa`, `#1e293b`, `#f1f5f9`; body `rgb(15, 23, 42)`; no overflow |
| 10 | Clerk sign-in title remains exact | In-app Chromium body-text probe | browser render | PASS | `Sign In to MonMag` |

### Coverage and known gaps

- Coverage command: `$env:VITE_CONFIG_NATIVE_IGNORE_WARNING='true'; npm run test:coverage`.
- Final result: 26 test files, 291 tests passed; Statements 99.2% (376/379), Branches 91.93% (285/310), Functions 100% (126/126), Lines 99.71% (344/345). The branch gap remains defensive paths and stays above the configured threshold.
- `src/lib/finance/chart-view-models.ts` is explicitly included in coverage and is fully covered.
- Authenticated dashboard and reports were not re-rendered in this final pass because no fresh Clerk dev-browser token was available. Their source contracts, full suite, typecheck, lint, and build are green; the earlier authenticated probe remains historical evidence for the shared app chrome, not for the final chart pixels.
- Clerk's `Secured by` footer remains visible in the live sign-in render. Full removal requires Clerk Dashboard Branding; no CSS hiding was introduced.
- Clerk telemetry requests failed with `ERR_TUNNEL_CONNECTION_FAILED` in the sandbox browser. This was an external network limitation, not an application page error.
- Screenshots were written only to temporary operator files and were not added to the repository.

### Merge evidence

Checkpoint commits were not created during that Slate pass. Its RED/GREEN evidence is preserved here and in `docs/releases/1.0.0/target-acceptance.md`. Final gates after the Slate/modern-chart follow-up were: targeted 51/51 tests PASS across 5 files, full 291/291 tests PASS across 26 files, coverage PASS above all thresholds, typecheck PASS, lint PASS, production build PASS with 19 routes, `npm audit --audit-level=high` PASS with 0 vulnerabilities. That section is historical; see the current Midnight section below.

## Copilot Money / Refero Midnight (current, superseding follow-up)

The latest user direction replaced Slate + Electric Blue with the [Refero style 91b110da](https://styles.refero.design/style/91b110da-902b-4d09-8bf0-26bd1f25f8b2) and its [hero screenshot](https://images.refero.design/styles/refero.design/image/5d753801-0afe-456d-8726-4cce5626dd34.jpg). No plan file was supplied; the palette, typography, shape scale, tag treatment, and midnight workspace direction were treated as intent. No destructive command, credential handling, or instruction-override text was accepted.

### User journeys

1. As a visitor, I want the landing page to read as a bold midnight display statement with scattered candy tags, not a generic grid of cards.
2. As a visitor, I want sign-in to put Clerk's real form directly on the midnight canvas without a decorative box behind it, while keeping the exact title and supported branding controls.
3. As a signed-in user, I want dashboard and workspace surfaces to use vault panels, Signal Blue active states, candy categories, and restrained midnight charts on every page.
4. As a mobile or small-screen user, I want the redesign to stay readable without horizontal overflow.
5. As a maintainer, I want source gates that fail if Slate/Terracotta tokens, drop shadows, decorative gradients, rigid hero tags, or light-system override return.

### Task report

| Task | Execution | Validation | Evidence | Guarantee |
| --- | --- | --- | --- | --- |
| Lock the Midnight contract first | Added `tests/midnight-direction.test.ts`, `tests/midnight-public.test.ts`, and `tests/midnight-app-surface.test.ts`. | Targeted Vitest run | RED: 3 files, 14 failed tests. | The new design was specified before production styling was replaced. |
| Replace the token system | Rewrote `src/app/globals.css` with exact Midnight, Fog, Mist, Signal Blue, candy accents, 4px shape scale, radii, inset-only shadows, and no decorative gradients. | Source gates and computed-style probe | GREEN: 19/19 Midnight tests; browser tokens matched exactly. | The palette and shape language are unmistakably different from Slate and Terracotta. |
| Redesign the public surfaces | Rebuilt `landing-content.tsx` around `hero-display`, `hero-eyebrow`, `hero-tag-cloud`, `midnight-band`, and `vault-panel`; later simplified `auth-frame.tsx` so Clerk owns the whole auth card. | Source gates; 10 browser renders | GREEN; six rotations observed; no obsolete palette or overflow. | The exact pages the user complained about now carry the reference direction. |
| Redesign the app surfaces | Changed shared `Card`, workspace chrome, dashboard band, charts, and default category colors to midnight vault panels, Signal Blue active states, midnight chart grid, and candy accents. | `midnight-app-surface.test.ts`; full suite | GREEN: 6/6 app-surface tests; full suite green. | The redesign is visible beyond the public pages. |
| Make dark mode authoritative | Removed `enableSystem` from `NextThemesProvider`, keeping `defaultTheme="dark"` and `disableTransitionOnChange`. | `theme.test.ts`; `midnight-direction.test.ts`; build | GREEN; 19 routes emitted. | System light mode can no longer override the midnight canvas. |
| Remove the login box and center dialogs | Added `tests/auth-modal-layout.test.ts`, removed `.auth-sheet`/`.vault-panel` from `AuthFrame`, switched both dialogs to a grid-centered wrapper, and made the entrance keyframe scale-only. | Focused Vitest run; 10-render browser probe; visible-browser probe | RED: 3 failed. GREEN: 31/31 focused tests; `dx=0,dy=0` dialog centering; Clerk title still exact. | Clerk renders directly on midnight and dialog panels are geometrically centered. |
| Preserve quality gates | Reran coverage, typecheck, lint, build, audit, and browser render checks after the final auth/dialog edit. | Full verification | 292/292 tests; coverage above thresholds; 0 vulnerabilities. | The redesign does not regress behavior, security, localization, or accessibility contracts. |

### Test specification

| # | What is guaranteed | Test file or command | Test type | Result | Evidence |
| --- | --- | --- | --- | --- | --- |
| 1 | Exact midnight canvas, surface, border, brand, and text tokens are present and obsolete Slate tokens are gone | `tests/midnight-direction.test.ts:uses the exact midnight canvas, steel border, signal blue, and paper tokens` | source contract | PASS | RED before rewrite; GREEN in 19/19 run |
| 2 | All ten candy accents and the 4px shape/radius scale are defined | `tests/midnight-direction.test.ts:defines every candy category accent from the reference`, `:defines the four-based shape scale and viewport rhythm` | source contract | PASS | Exact CSS tokens asserted |
| 3 | Space Grotesk display, weight 100 body, eyebrow and display tracking are present | `tests/midnight-direction.test.ts:uses condensed display type, thin body copy, and reference letter spacing` | source contract | PASS | Browser rendered `-2.4px` display and `0.44px` eyebrow tracking |
| 4 | Elevation is inset-only with no decorative gradients | `tests/midnight-direction.test.ts:uses inset elevation only and no decorative gradients` | source contract | PASS | Browser vault shadow was inset-only |
| 5 | Signal Blue is the only filled CTA and Clerk uses supported branding options | `tests/midnight-direction.test.ts:makes signal blue the only filled call-to-action color` | source contract | PASS | Browser CTA `rgb(28, 108, 255)`; exact Clerk title in source |
| 6 | Dark mode is first and reduced-motion/mobile contracts survive | `tests/midnight-direction.test.ts:keeps dark mode first and preserves the accessible motion contract` | source contract | PASS | `html.dark` on all 10 browser renders |
| 7 | Landing has a display hero, all-caps eyebrow, and scattered candy tags | `tests/midnight-public.test.ts:renders the hero as a display statement with an all-caps eyebrow`, `:scatters rotated candy tags around the hero instead of a rigid grid` | source/browser contract | PASS | Six tags; rotations `-12,-9,-6,6,9,12` |
| 8 | Landing uses flat midnight bands and an inset vault preview with one primary CTA | `tests/midnight-public.test.ts:uses flat midnight tonal bands and an inset preview vault`, `:keeps one primary signal-blue CTA and a quiet secondary action` | source/browser contract | PASS | Vault `rgb(1, 13, 30)`; CTA `rgb(28, 108, 255)` |
| 9 | Sign-in lets Clerk render directly without a decorative box or hidden branding | `tests/midnight-public.test.ts:lets Clerk render directly on midnight without a decorative auth box` | source contract | PASS | No `.auth-sheet`/`.vault-panel`; Clerk title exact; no CSS hiding rule |
| 10 | Workspace cards, rail, palette, charts, and dashboard focus band use Midnight | `tests/midnight-app-surface.test.ts` | source contract | PASS | 6/6 tests; Signal Blue active state and candy palette asserted |
| 11 | Existing behavior, charts, currency, localization, motion, and anti-slop gates remain green | `$env:VITE_CONFIG_NATIVE_IGNORE_WARNING='true'; npx vitest run tests/anti-slop.test.ts tests/ui-polish.test.ts tests/modern-charts.test.ts tests/theme.test.ts tests/money-display.test.ts tests/date-range.test.ts --reporter=dot` | regression | PASS | 6 files, 52/52 tests |
| 12 | Public and auth pages render at five viewport sizes without overflow or app errors | HeadlessChrome 159 probe via `monmag-midnight-visual.mjs` | browser render | PASS | 10 render combinations; all body backgrounds `rgb(0, 8, 20)`; no obsolete palette or overflow |
| 13 | Clerk login has no decorative CSS box behind it | `tests/auth-modal-layout.test.ts:renders Clerk directly on the midnight page without a decorative CSS box`, `tests/midnight-public.test.ts:lets Clerk render directly on midnight without a decorative auth box` | source/browser contract | PASS | RED: 3 failed; GREEN: 31/31; visible browser: `clerkRootCount=1`, `authSheetCount=0` |
| 14 | Dialog panels are centered without translate positioning | `tests/auth-modal-layout.test.ts:centers dialog panels with a grid overlay instead of top/left transforms`, `:uses a scale-only dialog entrance animation that cannot shift the center` | source/browser contract | PASS | Headless probe: `grid/center`, `transform: none`, `dx=0,dy=0` at 1000x700 and within 1px at odd viewports |

### Coverage and known gaps

- Coverage command: `npm run test:coverage`.
- Final result: 27 test files, 292 tests passed; Statements 99.2% (376/379), Branches 91.93% (285/310), Functions 100% (126/126), Lines 99.71% (344/345). The branch gap remains defensive paths and stays above the configured threshold.
- The refreshed headless probe verified the absence of `.auth-sheet`/`.vault-panel` on `/sign-in` and centered dialog geometry on all ten renders. Clerk's external JS did not load in that isolated sandbox (`clerkRoot=0`), so it did not re-render the Clerk form. A separate visible-browser probe with Clerk JS loaded confirmed `clerkRootCount=1`, no auth box, and the exact heading `Sign In to MonMag`.
- Clerk's `Secured by` footer remains visible in Clerk's render. Full removal requires Clerk Dashboard Branding; no CSS hiding was introduced.
- Authenticated dashboard and reports were not re-rendered in this final pass because no fresh Clerk dev-browser token was available. Their Midnight contracts are covered by source tests, the regression set, full suite, typecheck, lint, and build; the earlier authenticated probe remains historical evidence for shared app-shell behavior, not final chart pixels.
- Screenshots were written only to temporary operator files and were not added to the repository.
- Production target acceptance remains **NOT PERFORMED (no production access/authorization)**.

### Merge evidence

RED/GREEN evidence is preserved here and in `docs/releases/1.0.0/target-acceptance.md`. Final gates after the Midnight redesign and final auth/dialog edit: targeted 19/19 Midnight tests PASS across 3 files, auth/dialog reproducer RED 3 failed then GREEN 31/31 across 3 focused files, 52/52 regression tests PASS across 6 files, full 292/292 tests PASS across 27 files, coverage PASS above all thresholds, typecheck PASS, lint PASS, production build PASS with 19 routes, `npm audit --audit-level=high` PASS with 0 vulnerabilities. The refreshed 10-render public/auth probe passed with exact Midnight tokens, no auth box, centered dialog geometry, no obsolete palette, no horizontal overflow, and no application page errors. Local checkpoint commits were created for the reproducer and fix; no push was performed and `.env.local` remains ignored and uncommitted. Production target acceptance remains not performed because no production access or authorization was provided.
