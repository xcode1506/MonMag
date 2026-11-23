# Deployment Checklist

This document describes a deployment **procedure** for MonMag on Vercel or a self-managed Node host. It does not claim that any deployment has been performed or verified. Target acceptance requires an authorized maintainer with real environment access.

## Scope and preconditions

- Code is merged to the branch you intend to deploy.
- `npm run build` passes locally with the same Node version used in production (Next.js 16 requires Node `>=20.9.0`).
- `npm run typecheck`, `npm run lint`, and `npm test` pass locally.
- A production PostgreSQL database and a Clerk production instance are available.
- You have credentials to set environment variables on the target platform and to run migrations against the target database.

## Environment variables

Set these on the deployment platform (do not commit them):

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk production publishable key. |
| `CLERK_SECRET_KEY` | Yes | Clerk production secret key. Server-side only. |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Yes | Sign-in path. |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Yes | Sign-up path. |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Yes | Post sign-in destination. |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Yes | Post sign-up destination. |
| `CLERK_WEBHOOK_SIGNING_SECRET` | No | Reserved for webhook verification. No webhook route ships in this repository; set only if you add one. |
| `DATABASE_URL` | Yes | Production PostgreSQL connection string used by the app and Prisma CLI. Use the Supabase pooled URL for runtime. |
| `DIRECT_URL` | No | Direct PostgreSQL connection string. Documented for migrations; `prisma.config.ts` currently reads only `DATABASE_URL`. |
| `NEXT_PUBLIC_APP_URL` | Yes | Full production origin, e.g. `https://app.example.com`. |
| `DEMO_CLERK_USER_ID` | No | Demo seed only. Do not set in production. |
| `DEMO_SEED` | No | Set to `false` in production as a kill switch. When omitted/empty, seeding is enabled. |

Production safety rules:

- Use Clerk **production** keys, not `pk_test_...` / `sk_test_...`.
- Never run `npm run db:seed` against production. If the seed must be exercised, use a separate demo database and a Clerk test user.
- Keep `DEMO_SEED=false` in production even though the app itself does not call the seed.
- Rotate any key that was ever committed or printed in logs.

## Database configuration (Supabase pooler vs direct)

- `DATABASE_URL`: use a PostgreSQL connection string that the deployment platform can reach. `prisma.config.ts` and the runtime adapter both read this value via `src/lib/prisma.ts`.
- **Transaction pooler** (typically port `6543`, user `postgres.<ref>`, `pgbouncer=true&connection_limit=1`): best for serverless platforms with many short-lived connections.
- **Session pooler** (typically port `5432` on the regional pooler host, user `postgres.<ref>`): IPv4-compatible alternative for hosts without IPv6; do not add `pgbouncer=true`.
- **Direct** (`db.<ref>.supabase.co:5432`, user `postgres`): avoids the pooler but can be IPv6-only in some projects. Documented here as `DIRECT_URL`, but the current `prisma.config.ts` does **not** read it; migrations use `DATABASE_URL`.
- If the database password is unknown or must be rotated, reset it in Supabase (Dashboard: Project Settings → Database → Reset Database Password, or the Management API `PATCH /v1/projects/{project_ref}/database/password` with an authorized token). Update the connection strings in the deployment platform's secret store and in any local `.env.local`; never put the password in logs or commit it.
- Do not use the Supabase REST URL, anon key, or service-role key as `DATABASE_URL`. Prisma needs a PostgreSQL connection string.
- Confirm the production database is reachable from the deployment platform's network before migrating.

## Migration step

Migrations are **not** applied automatically by `npm run build`.

```bash
npm run db:migrate
```

- This runs `prisma migrate deploy` against `DATABASE_URL`.
- Run it once as a deliberate release step, from an environment that has the production env loaded and network access to the database.
- Review `prisma/migrations/` before applying. There is currently an initial up migration (`0001_init`) and no down migration; a rollback is not automatically generated.
- After schema changes, `npm run db:generate` must have been run before building. Generated client output lives in `src/generated/prisma`.

## Clerk production configuration

1. Switch to the Clerk production instance and copy its publishable/secret keys into the environment variables above.
2. Add the production origin (`NEXT_PUBLIC_APP_URL`) to Clerk's allowed origins and redirect URLs.
3. Verify the sign-in/sign-up paths exist in the deployed app and match the corresponding environment variables.
4. Ensure `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` and `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` point to reachable production routes.
5. If webhooks are added later, register the endpoint in Clerk and set `CLERK_WEBHOOK_SIGNING_SECRET` from that endpoint's signing secret. No webhook route exists in this repository today.

## Deploy: Vercel

1. Import the repository and select the target branch.
2. Set the build command to `npm run build`; framework output is auto-detected for Next.js.
3. Add all environment variables from the table above, using production values.
4. Run migrations separately (see above) before routing traffic to the new deployment. Vercel does not run `db:migrate` as part of the build.
5. Confirm the deployment uses Node `>=20.9.0` in its build/runtime settings if your project overrides the default.
6. Verify with the post-deploy checks below.

## Deploy: self-managed Node

1. On the host: install Node `>=20.9.0`, copy the repository at the target commit, and run `npm ci`.
2. Provide environment variables via the host's secret manager or a protected `.env.local` (never committed).
3. Run `npm run db:migrate` once against the production database.
4. Run `npm run build`.
5. Start with `npm run start` behind a reverse proxy that terminates TLS.
6. Ensure the proxy forwards the production host so Clerk redirects and `NEXT_PUBLIC_APP_URL` agree.
7. Verify with the post-deploy checks below.

## Health checks

- `GET /api/health` returns a success envelope with `status: "healthy"` and a timestamp when the app process and route are working.
- This is a lightweight liveness check, not a database or Clerk dependency check. A healthy response does not prove database connectivity or auth correctness.
- Use your platform's HTTP check against `https://<your-origin>/api/health`.

## Post-deploy verification (manual, by an authorized maintainer)

1. Confirm the deployed commit/sha matches the intended release.
2. `curl -sS https://<your-origin>/api/health` and confirm `success: true` and `status: "healthy"`.
3. Sign in with a Clerk production test account; confirm redirect to the configured post-sign-in route.
4. Open a representative page for each core area: accounts, transactions, budgets, goals, debts, recurring, notifications.
5. Create and delete one throwaway transaction; confirm it persists and is scoped to the signed-in user.
6. Confirm a second account cannot see the first account's rows (ownership checks return not-found behavior).
7. Check application logs for auth errors or database errors; ensure no secrets or connection strings are logged.
8. Confirm `DEMO_SEED=false` is set and that `npm run db:seed` was not run against production.

Record the observed environment (platform, commit sha, Node version) and results. Passing local checks does not establish target acceptance.

## Rollback

1. **Application:** redeploy the previous known-good deployment/commit on Vercel, or check out the previous commit, rebuild, and restart on Node.
2. **Environment:** if the release changed environment variables, revert them to the previous values as part of the same rollback.
3. **Database:** migrations have no generated down script. If a migration must be reversed, stop writes, take a verified backup, and prepare a reviewed SQL rollback that matches that migration. Do not assume `migrate deploy` is reversible.
4. Re-run the health check and a minimal sign-in/read smoke test after rollback.

## Target acceptance statement

Target acceptance is **NOT PERFORMED** by this document. An authorized maintainer with real production environment access must execute the post-deploy verification above and record evidence (environment, version, commit sha, observed results). No migration, seed, or deployment check has been run as part of preparing these docs.
