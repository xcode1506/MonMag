# TDD Evidence - Currency Display, Write Path, and Date-Range Fixes

## Source plan

No `*.plan.md` was supplied. Journeys were derived from the code-review findings for the local MonMag build.

## User journeys

1. As a user with a scale-2 currency such as USD, I want saved amounts displayed at their real value so I do not misread my balances by 100x.
2. As a user, I want to reopen an edit dialog for a non-IDR amount without a `BigInt("123.45")` crash so I can correct existing records.
3. As a user exporting or filtering transactions, I want the selected end date to include the whole day so same-day entries are not silently omitted.
4. As a user with repeated row actions, I want each icon-only submit button to have a distinct accessible name.
5. As a user in USD, I want typed amounts written as 1234 minor units for `12.34` so a save cannot corrupt my balance by 100x.
6. As a user with accounts in different currencies, I want each transaction row and its edit form to use that account's currency rather than my global preference.
7. As a user with large balances, I want goal and debt totals summed with BigInt so floating-point drift cannot alter displayed money.
8. As a user with a recurring rule on a USD account but an IDR preference, I want the row and edit dialog to use USD so saving the rule cannot multiply my money by 100.
9. As a user exporting a mixed-currency ledger, I want each CSV amount scaled with its own account currency so the file matches what the app shows.
10. As a user creating a transaction or transfer, I want the amount label to follow the selected account so I do not enter major units under the wrong currency scale.

## Task report

| Task | Execution | Validation | Evidence | Guarantee |
|---|---|---|---|---|
| Treat `bigint` as minor units and `string`/`number` as major units in `money()` | Changed `src/lib/ui.ts` to pass `bigint` through and convert other values with `toMinorUnits(value, currency)`. | `npm test -- tests/ui.test.ts tests/date-range.test.ts` | RED: 6 failures in `tests/ui.test.ts`, including `$12.34` instead of `$1,234.00`. GREEN: 18/18 passed. | Display values produced by `amountInput()` are no longer shrunk by the currency scale. |
| Use currency-aware conversion for edit-dialog defaults | Replaced `BigInt(editing.<field>)` with `toMinorUnits(..., currency)` in goals, debts, recurring, transactions, budgets, and accounts views. Accounts use the account's own currency. | `npm run typecheck`; full test suite | PASS. | Decimal defaults for USD/EUR/SGD/MYR round-trip to the stored minor-unit amount instead of throwing. |
| Include the full selected end date | Added `endOfInputDate()` and applied it to transaction list/export filters. | `npm test -- tests/date-range.test.ts` | RED: 2 failures before helper existed. GREEN: 2/2 passed. | A transaction later on the selected day remains within `lte` filtering. |
| Cap export rows in the database query | Added `MAX_EXPORT_ROWS`/`take` in `getTransactionsForExport()` and removed in-memory `.slice()` from the route. | `npm run typecheck`; `npm run build` | PASS. | Large ledgers are bounded at the Prisma query rather than loaded fully into memory. |
| Fix repeated-action accessible names and pending refresh | Added `submitAriaLabel` to `ActionForm`; removed misleading `sr-only` siblings; gated `router.refresh()` behind successful form submissions. | `npm run lint`; `npm run build` | PASS. | Pause/Activate and Mark read buttons expose item-specific names; dismissing a modal no longer forces a refresh. |
| Add currency-aware validation factories | Replaced the default IDR-only money parsing with `parseMoneyInput()` and `*_schemaFor(currency)` factories; BigInt values remain minor units while strings/numbers use the supplied currency scale. | `npm test -- tests/currency-write-path.test.ts tests/validation.test.ts` | RED: USD `"12.34"` was parsed with IDR scale and USD account assertions failed. GREEN: 32/32 passed. | Write-side schemas produce correct minor units for supported currencies. |
| Wire write services and actions to the correct currency | Transactions, recurring rules, and transfers derive currency from owned accounts; budgets, goals, and debts use `user.preferredCurrency` from Server Actions. Transfers reject mixed-currency accounts. | `npm run typecheck`; `npm run lint`; `npm run build` | PASS. | No financial write silently applies IDR scale to a non-IDR amount. |
| Preserve account currency in transaction view models | Added `toTransactionRow()` with `accountCurrency`; rows display and edit using the account's currency. | `tests/currency-write-path.test.ts` | PASS. | Mixed-currency ledgers render and reopen with the currency attached to each transaction. |
| Sum goal and debt totals with BigInt | Replaced `Number()` accumulators in debts/goals views with `sumMoneyValues()` and exact `parseMoneyInput()`/`percentOf()` calculations. | `npm run test:coverage` | PASS. | Large balances are not rounded through IEEE-754 before display. |
| Preserve account currency in recurring rules | Added `toRecurringRow()` with `accountCurrency`, included `account.currency` in `listRecurring()`, and used the row currency for display and edit defaults. | `npm test -- tests/recurring-row.test.ts`; `npm run typecheck` | RED: module missing, suite could not resolve `@/lib/view-models/recurring`. GREEN: 2/2 passed. | A USD rule with an IDR preference displays `$12.34` and reopens as `12.34`, not `1234`. |
| Scale CSV amounts per account currency | Added `buildTransactionCsv()` with a `Currency` column; the export service now selects `account.currency` and the route delegates formatting to the helper. | `npm test -- tests/transaction-export.test.ts` | RED: module missing; GREEN: 2/2 passed. | USD minor units export as `12.34`/USD while IDR minor units stay `1234`/IDR. |
| Follow the selected account in money forms | Added `resolveAccountCurrency()`/`rescaleAmountText()` and a shared form hook used by transaction, recurring, and transfer forms; transfers restrict destinations to the source currency. | `npm test -- tests/form-currency.test.ts`; `npm run lint` | RED: helper missing. GREEN: 4/4 passed; lint initially flagged a setState-in-effect, fixed by deriving the destination in the source change handler. | Amount labels and entered values follow the selected account, including when an account is switched after typing. |
| Clear independent-review warnings | Made the transfer amount controlled and rescaled it on source-account change, renamed the misleading `Amount (minor units)` CSV header to `Amount (decimal)`, and tightened formula-injection escaping for leading whitespace. | `npm test -- tests/form-currency.test.ts tests/transaction-export.test.ts`; full suite | PASS. | Switching a transfer source from USD to IDR preserves the entered value in minor units; the CSV header matches its decimal values; spaced formulas are neutralized. |

## Test specification

| # | What is guaranteed | Test file or command | Test type | Result | Evidence |
|---|---|---|---|---|---|
| 1 | Server aggregates passed as bigint minor units format unchanged | `tests/ui.test.ts:money display scaling` | unit | PASS | `npm test -- tests/ui.test.ts` |
| 2 | Major-unit decimal strings scale by currency | `tests/ui.test.ts:treats major-unit decimal strings as human amounts` | unit | PASS | `npm test -- tests/ui.test.ts` |
| 3 | Form defaults render identically to stored minor units for IDR, USD, EUR, SGD, MYR | `tests/ui.test.ts:renders a form default identically...` | unit | PASS | `npm test -- tests/ui.test.ts` |
| 4 | Edit-dialog defaults round-trip to stored minor units for all supported currencies | `tests/ui.test.ts:round-trips edit-dialog defaults...` | unit | PASS | `npm test -- tests/ui.test.ts` |
| 5 | Numeric chart formatter values still display correctly | `tests/ui.test.ts:handles the numeric values produced by chart formatters` | unit | PASS | `npm test -- tests/ui.test.ts` |
| 6 | UTC-midnight input dates expand to inclusive end of day | `tests/date-range.test.ts:endOfInputDate` | unit | PASS | `npm test -- tests/date-range.test.ts` |
| 7 | USD `"12.34"` becomes `1234n` minor units | `tests/currency-write-path.test.ts:parses transaction amounts...` | unit | PASS | `npm test -- tests/currency-write-path.test.ts` |
| 8 | BigInt input is not rescaled by currency | `tests/currency-write-path.test.ts:keeps bigint amounts...` | unit | PASS | `npm test -- tests/currency-write-path.test.ts` |
| 9 | Budget and debt amounts use the user's currency scale | `tests/currency-write-path.test.ts:parses budget and debt amounts...` | unit | PASS | `npm test -- tests/currency-write-path.test.ts` |
| 10 | Account creation parses initial balance and credit limit in the account's currency | `tests/validation.test.ts:transforms localized balances and accepts explicit optional fields` | unit | PASS | `npm test -- tests/validation.test.ts` |
| 11 | Transaction rows carry account currency for display and edit defaults | `tests/currency-write-path.test.ts:keeps the account currency...` | unit | PASS | `npm test -- tests/currency-write-path.test.ts` |
| 12 | Decimal-string totals sum exactly in BigInt minor units | `tests/currency-write-path.test.ts:sums decimal strings...` | unit | PASS | `npm test -- tests/currency-write-path.test.ts` |
| 13 | Recurring rows carry the account currency and fall back safely | `tests/recurring-row.test.ts:recurring row view model` | unit | PASS | `npm test -- tests/recurring-row.test.ts` |
| 14 | CSV export scales USD amounts and emits a Currency column | `tests/transaction-export.test.ts:formats each amount using that transaction's account currency` | unit | PASS | `npm test -- tests/transaction-export.test.ts` |
| 15 | CSV export keeps IDR amounts on the zero-decimal scale | `tests/transaction-export.test.ts:keeps IDR rows on the zero-decimal scale` | unit | PASS | `npm test -- tests/transaction-export.test.ts` |
| 16 | Form currency follows the selected account, not the preference | `tests/form-currency.test.ts:form amount currency` | unit | PASS | `npm test -- tests/form-currency.test.ts` |
| 17 | Switching account rescales an entered amount through minor units | `tests/form-currency.test.ts:rescales an entered amount...` | unit | PASS | `npm test -- tests/form-currency.test.ts` |

## Coverage and known gaps

- Coverage command: `npm run test:coverage`
- Result: 16 test files, 164 tests passed; Statements 99.68%, Branches 94.05%, Functions 100%, Lines 99.65%.
- Branch gaps are in defensive paths in `date.ts`, `money.ts`, `validation.ts`, `analytics.ts`, and the new `src/lib/view-models/*.ts` helpers; no threshold is missed.
- No browser-level component test was added because the project has no DOM test harness installed. The edit-dialog and form-label regressions are covered at the exact conversion helpers used by the dialogs (`amountInput()`, `toMinorUnits()`, `resolveAccountCurrency()`, `rescaleAmountText()`).
- Live database migration, seed, and deployment checks remain `NOT PERFORMED` in `docs/DEPLOYMENT.md`; Supabase was unreachable from this environment.

## Merge evidence

- RED: `npm test -- tests/ui.test.ts tests/date-range.test.ts` before display/date implementation - 2 test files failed, 8 tests failed (6 money scaling, 2 missing date helper).
- GREEN: same command after implementation - 2 test files passed, 18 tests passed.
- RED: `npm test -- tests/currency-write-path.test.ts tests/validation.test.ts` before write-path implementation - missing transaction view model and IDR-scaled USD account assertions failed.
- GREEN: same command after implementation - 2 test files passed, 32 tests passed.
- RED: `npm test -- tests/recurring-row.test.ts tests/transaction-export.test.ts tests/form-currency.test.ts` before implementation - 2 suites failed to resolve the new view-model modules and one failed on the missing currency helper.
- GREEN: same command after implementation - 3 test files passed, 7 tests passed; 8 after the rescale regression was added.
- Full verification: `npm run typecheck` PASS, `npm run lint` PASS, `npm run test:coverage` PASS (164/164; Statements 99.68%, Branches 94.05%, Functions 100%, Lines 99.65%), `npm run build` PASS (19 static pages/routes generated).
- No commit was created and nothing was pushed; all current changes are staged in the working tree.
