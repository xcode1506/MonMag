# MonMag

MonMag is a personal finance dashboard built with Next.js, Clerk authentication, and a Prisma 7 + PostgreSQL data layer. It tracks accounts, transactions, transfers, budgets, savings goals, debts, recurring rules, and notifications with money represented as integer minor units.

> Scope note: this README documents the current repository surface. Setup commands require a configured local environment; no database migration or deployment is performed by the documentation itself.

## Features

- Clerk-based authentication with server-side ownership checks for user data.
- Account ledger with income, expense, and transfer entries.
- Explicit transfers represented as one `Transfer` record plus two linked `TRANSFER` transactions.
- Category management and per-user budgets with alert thresholds.
- Savings goals with contributions and progress tracking.
- Debt tracking with installment payments.
- Recurring transaction rules with frequency calculations in the app timezone.
- BigInt money helpers with per-currency minor-unit scales.
- Deterministic, idempotent demo seed scoped to one Clerk test user.

## Architecture

```text
src/app/                  Next.js App Router pages and route handlers
src/components/           UI primitives and feature components
src/lib/auth.ts           Clerk auth + local user provisioning + ownership checks
src/lib/services/         Server-side business operations, scoped by userId
src/lib/finance/          Pure balance, budget, analytics, and debt math
src/lib/validation.ts     Zod schemas for user input
src/lib/money.ts          BigInt money parsing/formatting helpers
src/lib/prisma.ts         PrismaClient + PrismaPg adapter singleton
src/generated/prisma/     Generated Prisma client (do not hand-edit)
prisma/schema.prisma      Prisma schema and migrations source of truth
prisma/demo-data.ts       Deterministic demo dataset builders
prisma/seed.ts            Idempotent demo seed entrypoint
```

Server-side services call `auth()` and `assertOwnership(...)`; data access is scoped by the local user id. The local `User` row is provisioned on the first authenticated request.

## Tech Stack

- Next.js 16 with React 19 and TypeScript
- Clerk (`@clerk/nextjs`) for authentication
- Prisma 7 with the `@prisma/adapter-pg` PostgreSQL adapter
- PostgreSQL (Supabase-compatible; direct and pooled URLs supported)
- Zod for validation
- Vitest for unit tests and coverage
- ESLint + TypeScript checks
- Docker / Docker Compose for local container execution

## Quick Start

```bash
npm install
cp .env.example .env.local
# Fill in .env.local with your own Clerk and PostgreSQL values.
npm run db:generate
npm run db:migrate
npm run dev
```

Open <http://localhost:3000> and sign in with Clerk. See [docs/SETUP.md](docs/SETUP.md) for detailed local setup, including Supabase and Clerk configuration.

## Environment Variables

All configuration is documented in [.env.example](.env.example). Never commit real keys. Prisma CLI settings load `.env.local` through `prisma.config.ts`; the seed script also loads `.env.local` directly.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js development server. |
| `npm run build` | Build the production app. |
| `npm run start` | Start the built app. |
| `npm run lint` | Run ESLint. |
| `npm run typecheck` | Run TypeScript type checking. |
| `npm test` | Run the Vitest suite in run mode. |
| `npm run test:coverage` | Run Vitest with coverage thresholds. |
| `npm run db:generate` | Generate the Prisma client into `src/generated/prisma`. |
| `npm run db:migrate` | Run Prisma migrations against the configured database. |
| `npm run db:dev` | Run `prisma migrate dev` for local schema iteration. |
| `npm run db:studio` | Open Prisma Studio. |
| `npm run db:seed` | Run the demo seed against the configured database. |

## Testing

```bash
npm run typecheck
npm run lint
npm test
npm run test:coverage
npm run build
```

Coverage includes pure library modules configured in `vitest.config.ts`. Run `npm test` with no database or Clerk credentials required; those tests are unit-level.

## Demo Seed

The seed requires a real Clerk user id from a development/test instance and a migrated database:

```bash
DEMO_CLERK_USER_ID=user_your_test_id npm run db:seed
```

Optional controls:

- `DEMO_SEED=false` skips seeding without changing other configuration.
- All demo rows are scoped to the resolved local user for that Clerk id.
- Re-running the seed upserts deterministic demo rows; it does not delete rows or overwrite other users' data.
- Existing profile settings on the target user are left unchanged.

The dataset uses synthetic names and `example.invalid` email only. Money values are BigInt minor units in IDR. See [docs/SETUP.md](docs/SETUP.md#6-seed-the-demo-data) for the full procedure.

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for a Vercel/Node checklist, environment variables, migration guidance, health checks, rollback, and post-deploy verification. Target-environment acceptance requires an authorized maintainer with real environment access; documentation alone does not prove a deployment succeeded.

## Security

See [docs/SECURITY.md](docs/SECURITY.md) for the auth/ownership model, money-integrity rules, input validation, secrets handling, dependency audits, and incident rotation steps. Do not commit `.env.local` or real Clerk/PostgreSQL credentials.
