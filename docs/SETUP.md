# Local Setup

This guide covers a local MonMag setup with PostgreSQL (Supabase-compatible), Clerk development keys, and the Prisma 7 toolchain. It documents commands only; it does not create cloud resources or apply migrations for you.

## Prerequisites

- Node.js `>=20.9.0` (required by Next.js 16) and npm.
- A PostgreSQL database. Supabase works with the transaction pooler, session pooler, or direct connection; choose the one your network can reach.
- A Clerk development instance with an application and test users.
- Git access to this repository.

## 1. Install and configure environment

```bash
npm install
cp .env.example .env.local
```

`.env.local` is git-ignored and is the single source of real credentials. The Prisma CLI loads it through `prisma.config.ts`; the seed script loads it directly with `dotenv`.

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key for the development instance. Safe to expose to the browser. |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key for server-side auth calls. Keep secret. |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Yes | Path to the sign-in page. |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Yes | Path to the sign-up page. |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Yes | Destination after successful sign-in. |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Yes | Destination after successful sign-up. |
| `CLERK_WEBHOOK_SIGNING_SECRET` | No | Reserved for webhook signature verification. No webhook route ships in this repository yet. |
| `DATABASE_URL` | Yes | PostgreSQL connection string used by the app and Prisma CLI. For Supabase, use the transaction pooler (port 6543) or IPv4-compatible session pooler (port 5432 on the pooler host); see section 2. |
| `DIRECT_URL` | No | Direct PostgreSQL connection string (`db.<ref>.supabase.co:5432`). Documented for migration workflows; `prisma.config.ts` currently uses `DATABASE_URL`. |
| `NEXT_PUBLIC_APP_URL` | Yes | Absolute app origin used for redirects and links. Locally: `http://localhost:3000`. |
| `DEMO_CLERK_USER_ID` | Seed only | Clerk user id whose local user row receives the demo dataset. Must be a test user, not a real account. |
| `DEMO_SEED` | No | Set to `false` to skip seeding. When omitted or empty, seeding is enabled. |

Use placeholders only in `.env.example`. Never commit `.env.local` or real keys.

## 2. Create the Supabase database

1. Create a Supabase project and store the database password in a secret manager. If it is unknown or must be rotated, reset it in Supabase (Dashboard: Project Settings → Database → Reset Database Password, or Management API `PATCH /v1/projects/{project_ref}/database/password` with an authorized token). Put the new value only in `.env.local` or the deployment platform's secret store; never echo it in logs or shell history.
2. Choose a connection type that your network can reach:
   - **Transaction pooler**: regional pooler host, port `6543`, user `postgres.<ref>`, with `?pgbouncer=true&connection_limit=1`. Best for serverless runtimes.
   - **Session pooler**: regional pooler host, port `5432`, user `postgres.<ref>`, without `pgbouncer=true`. Use this when the direct host is IPv6-only or your local network cannot reach IPv6.
   - **Direct**: `db.<ref>.supabase.co:5432`, user `postgres`. Some projects expose only AAAA records on this host, so local IPv4 clients may fail.
3. Copy the chosen connection string into `DATABASE_URL`. Optionally copy a direct connection string into `DIRECT_URL`.
4. Do not use the Supabase REST URL or anon key for Prisma; Prisma needs a PostgreSQL connection string.

## 3. Create the Clerk application

1. Create a Clerk development instance and copy its publishable and secret keys into the corresponding environment variables.
2. In Clerk, add `http://localhost:3000` as an allowed development origin/redirect URL as applicable.
3. Ensure the sign-in and sign-up paths match `NEXT_PUBLIC_CLERK_SIGN_IN_URL` and `NEXT_PUBLIC_CLERK_SIGN_UP_URL`.
4. Copy one **test** user's Clerk id into `DEMO_CLERK_USER_ID` if you plan to seed.

## 4. Generate the client and apply migrations

```bash
npm run db:generate
npm run db:migrate
```

- `db:generate` writes the Prisma client to `src/generated/prisma` (do not hand-edit it).
- `db:migrate` runs `prisma migrate deploy` against `DATABASE_URL`.
- For local schema iteration, use `npm run db:dev` instead; it runs `prisma migrate dev` and can create new migration files.

Prisma 7 reads `prisma.config.ts`, which loads `.env.local`, points at `prisma/schema.prisma`, and registers `tsx prisma/seed.ts` as the seed command.

## 5. Start the app

```bash
npm run dev
```

Open <http://localhost:3000> and sign in with a Clerk test user. The local `User` row is created automatically on the first authenticated request.

## 6. Seed the demo data

The seed is opt-in, idempotent, and scoped to one Clerk user. It does not delete data or overwrite other users' rows.

```bash
DEMO_CLERK_USER_ID=user_your_test_id npm run db:seed
```

- If the local user row already exists, its profile settings are left unchanged.
- Re-running the seed upserts the same deterministic rows; it does not duplicate them.
- `DEMO_SEED=false npm run db:seed` skips seeding and exits successfully.
- The seed fails fast if `DATABASE_URL` or `DEMO_CLERK_USER_ID` is missing. It never prints connection strings.

## 7. Verify and test

```bash
npm run typecheck
npm run lint
npm test
npm run test:coverage
npm run build
```

Unit tests do not require Clerk or database credentials. Health check endpoint: `GET /api/health` returns a success envelope with `status: "healthy"` when the running app is reachable.

## Timezone and locale assumptions

- App timezone: `Asia/Jakarta` (`src/lib/date.ts`).
- Date input format: `DD/MM/YYYY` (`src/lib/date.ts`).
- Default display locale: `id-ID` (`src/lib/money.ts`).
- Money is stored as BigInt integer minor units. IDR scale is `0` (1 unit = 1 rupiah); USD/EUR/SGD/MYR scale is `2`.
- The demo dataset uses IDR and synthetic values only.

## Troubleshooting

### Prisma error P1001 (can't reach database server)

- Confirm `DATABASE_URL` is set in `.env.local` and uses a PostgreSQL connection string, not a Supabase REST URL.
- Check that the Supabase project is not paused and that the host/port match the connection type you selected in section 2.
- For the transaction pooler (port `6543`), keep `pgbouncer=true` and a low `connection_limit`.
- For the session pooler (port `5432` on the pooler host), use the `postgres.<ref>` username and do not add `pgbouncer=true`.
- Some Supabase direct hosts (`db.<ref>.supabase.co`) are IPv6-only. If DNS returns only AAAA records or local IPv4 connections fail, use the regional session pooler instead.
- Verify network access from the local shell; corporate proxies or firewalls can block ports `5432`/`6543`.
- Re-run `npm run db:migrate` after fixing the URL.

### Prisma 7 configuration issues

- Always run Prisma commands from the repository root so `prisma.config.ts` and `.env.local` resolve correctly.
- After changing `prisma/schema.prisma`, run `npm run db:generate` before typechecking.
- Generated client lives in `src/generated/prisma`; never edit it manually.
- `prisma.config.ts` uses `env("DATABASE_URL")` for the datasource. `DIRECT_URL` is documented but not currently wired into that config.

### Clerk redirect loops or "not allowed" redirects

- Ensure `NEXT_PUBLIC_APP_URL` matches the origin you are browsing (including protocol and port).
- Register the local origin in Clerk's allowed origins/redirect URLs for the development instance.
- Confirm `NEXT_PUBLIC_CLERK_SIGN_IN_URL` and `NEXT_PUBLIC_CLERK_SIGN_UP_URL` match the actual pages.
- Make sure `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` points to a route that exists and is accessible for the signed-in user.
- Clear browser cookies for the origin and retry with an incognito window to rule out stale Clerk sessions.
- Clerk middleware is configured in `src/proxy.ts`; do not rename it without updating the framework configuration.

### Seed fails with "already belongs to another user"

The deterministic demo id or idempotency key is already taken by a different local user. Do not overwrite it. Use a fresh test Clerk user, or resolve the conflict manually with database access you are authorized to use.
