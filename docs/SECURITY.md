# Security Notes

This document describes the security-relevant design of MonMag as implemented in this repository, plus operational checks. It is a guide, not a certification. Verify against the code before relying on it for a release decision.

## Auth and ownership model

- **Clerk is the only authentication provider.** `src/lib/auth.ts` reads the Clerk session via `auth()`; there are no local passwords or additional login flows.
- **Local user provisioning:** `getCurrentUser()` finds the `User` row by `clerkUserId` and creates it on first authenticated request using Clerk profile data. Server Components/Actions use `requireUser()` (redirects when signed out); route handlers use `requireApiUser()` (throws 401).
- **Ownership guard:** `assertOwnership(resource, userId, name)` throws a 404-style `ApiError` when a row is missing or belongs to another user. Returning 404 rather than 403 avoids revealing whether a resource exists.
- **Service-layer scoping:** business operations in `src/lib/services/` accept the authenticated user id and scope queries by `userId`. Add `userId` filters to every new query; do not rely on client-provided ids for authorization.
- **Row Level Security:** Supabase RLS policies are not defined in this repository. Tenant separation currently depends on application-layer query scoping. If you enable RLS, keep the application scoping as defense in depth.
- **Middleware:** Clerk middleware is registered in `src/proxy.ts`. Do not rename or remove it without updating the framework configuration.
- **Webhooks:** no webhook route is present. `CLERK_WEBHOOK_SIGNING_SECRET` is reserved for future user-sync webhooks; if you add one, verify signatures with the Clerk SDK before trusting any payload.

## Money integrity

- All money fields are `BigInt` integer **minor units** in `prisma/schema.prisma`. Never use floating point for monetary math.
- `src/lib/money.ts` defines currency scale: IDR = `0`, USD/EUR/SGD/MYR = `2`. `toMinorUnits` normalizes localized input and rounds half away from zero; `fromMinorUnits` renders a decimal string.
- Transfers follow the convention in `src/lib/services/transactions.ts`: one `Transfer` record plus two `TRANSFER` transactions (`:out` and `:in` idempotency keys). Amounts must balance.
- Account balances are derived from opening balance plus income minus expense minus transfers out plus transfers in (`src/lib/finance/balances.ts`). Do not cache a mutable cached balance without reconciling.
- Demo seed money values are BigInt literals in IDR minor units (`prisma/demo-data.ts`). Do not introduce `Number` or decimal strings for money in seeded rows.

## Input validation

- `src/lib/validation.ts` contains Zod schemas for accounts, categories, transactions, transfers, budgets, goals, contributions, debts, and recurring rules.
- `moneyMinor` / `positiveMoneyMinor` reject zero and negative amounts where appropriate; `debtSchema.interestRate` is validated as an annual percentage in the range 0-100, not money.
- Dates are parsed via `parseDateInput` with `DD/MM/YYYY` or ISO input and stored as UTC-midnight `Date` values.
- Route handlers wrap logic with the `route()` helper in `src/lib/api.ts`, returning a consistent success/error envelope. Zod errors become 422 `validation_error`; unexpected errors become generic 500 responses without stack traces.
- Validate at every trust boundary. Do not pass raw request bodies into Prisma or into service functions that expect validated input.

## Idempotency and replay safety

- `Transaction.idempotencyKey` and `Transfer.idempotencyKey` are unique in the schema. Use a stable client-generated key for create operations so retries do not double-post money movements.
- The demo seed uses globally unique, owner-scoped keys of the form `seed:<localUserId>:<logicalKey>` and deterministic owner-scoped ids. Re-running the seed upserts the same rows instead of duplicating them.
- The seed refuses to overwrite a row (or idempotency key) that belongs to a different user. It never deletes data, never truncates tables, and never issues raw SQL.
- `DEMO_CLERK_USER_ID` is required; `DEMO_SEED=false` is an explicit kill switch. Missing `DATABASE_URL` or `DEMO_CLERK_USER_ID` fails fast. Logs contain counts and status only, never connection strings or secrets.

## Secrets handling

- Real credentials live only in git-ignored `.env.local`. `.env.example` contains placeholders only.
- Clerk publishable key and `NEXT_PUBLIC_APP_URL` are intentionally public. `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SIGNING_SECRET`, and database URLs are secrets.
- Prisma CLI loads `.env.local` via `prisma.config.ts`; the seed loads the same file with `dotenv`. No seed or doc command prints env values.
- `next.config.ts` does not currently define custom security headers (CSP, `X-Frame-Options`, etc.). Add and test them if you need a hardened header posture.
- There is no application-level rate limiter in this repository. Put the app behind a gateway/WAF or add a shared-store rate limiter before exposing expensive or abusive endpoints publicly.
- Do not log request bodies containing personal financial data. Redact tokens, connection strings, and secrets in any error reporting.

## Dependency and audit checklist

Run these before a release and review the results:

```bash
npm audit
npm run typecheck
npm run lint
npm test
npm run test:coverage
npm run build
```

- Keep `package-lock.json` committed and use `npm ci` in CI/production for reproducible installs.
- Review Dependabot/security alerts for `next`, `@clerk/nextjs`, `prisma`, `@prisma/adapter-pg`, `zod`, and transitive packages.
- Regenerate the Prisma client (`npm run db:generate`) after any Prisma version change; verify no unexpected diff in `src/generated/prisma`.
- Re-check this document when adding auth routes, webhooks, file uploads, or new money fields.

## Incident and rotation steps

If a secret may have leaked:

1. **Contain:** remove the secret from the source, logs, and deployment configuration. If it was committed, treat git history as compromised.
2. **Rotate at the provider:**
   - Clerk secret key / webhook signing secret: create a new key in the Clerk dashboard, update the deployment secret, then revoke the old key.
   - Database password / connection string: rotate credentials in Supabase, update `DATABASE_URL`/`DIRECT_URL` in the deployment platform, and restart/redeploy so the new value is used.
   - Publishable key: replace the value and redeploy if the Clerk instance changed.
3. **Verify:** confirm the app still authenticates, `/api/health` responds, and database reads/writes work with the rotated values.
4. **Review:** search logs and code for the old secret. Confirm no demo seed was run against production and no user data was modified by an unauthorized party.
5. **Document:** record the affected secret, rotation time, scope, and follow-up actions in your incident log.

If unauthorized data access is suspected:

1. Preserve logs and snapshots; do not delete evidence.
2. Identify affected `userId` values and the queries/paths involved.
3. Revoke active Clerk sessions for affected users if appropriate.
4. Audit recent rows using `AuditLog` where present, plus database-level audit logs you control.
5. Notify the appropriate stakeholders according to your incident policy.

## Known boundaries

- No webhook route, RLS policies, CSP headers, or built-in rate limiting are present in this repository. Each is called out above so it can be addressed explicitly rather than assumed.
- This document does not claim a security audit, penetration test, or production verification has been performed.
