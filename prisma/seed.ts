/**
 * MonMag demo seed.
 *
 * Usage (from the repository root):
 *   DEMO_CLERK_USER_ID=user_... npm run db:seed
 *
 * Safety contract:
 * - Requires DEMO_CLERK_USER_ID; DEMO_SEED=false is an explicit kill switch.
 * - Every created row is scoped to the local User row for that Clerk id.
 * - Upserts use deterministic owner-scoped ids; existing rows owned by another
 *   user are never modified.
 * - No deletes, no truncation, no raw SQL, no env values in logs.
 * - Intended for development/demo databases. Never seed a real user by accident.
 */
import { config as loadEnv } from "dotenv";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { buildDemoData, buildDemoProfile } from "./demo-data";

// Prisma CLI loads .env.local via prisma.config.ts; this script is run by tsx,
// so it must load the same file itself. Run from the repository root.
loadEnv({ path: path.resolve(process.cwd(), ".env.local"), quiet: true });

interface OwnedRow {
  id: string;
  userId: string;
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required for the demo seed. See .env.example.`);
  }
  return value;
}

/** DEMO_SEED is optional; when present it must be "true" or "false". */
function isSeedEnabled(): boolean {
  const flag = process.env.DEMO_SEED?.trim();
  if (flag === undefined || flag === "") return true;
  if (flag === "true") return true;
  if (flag === "false") return false;
  throw new Error('DEMO_SEED must be "true" or "false" when set.');
}

function createClient(): PrismaClient {
  const connectionString = requiredEnv("DATABASE_URL");
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}

/** Fail instead of taking over a pre-existing row that belongs to another user. */
async function assertRowOwner(
  label: string,
  find: () => Promise<OwnedRow | null>,
  expectedUserId: string,
): Promise<void> {
  const existing = await find();
  if (existing && existing.userId !== expectedUserId) {
    throw new Error(
      `${label} already belongs to another user; refusing to overwrite demo data.`,
    );
  }
}

/** Idempotency keys are unique globally, not per user. */
async function assertKeyOwner(
  label: string,
  find: () => Promise<OwnedRow | null>,
  expected: OwnedRow,
): Promise<void> {
  const existing = await find();
  if (!existing) return;
  if (existing.id !== expected.id || existing.userId !== expected.userId) {
    throw new Error(
      `${label} idempotency key is already used by another row; refusing to overwrite.`,
    );
  }
}

/** Replace deterministic category ids with the real ids returned by upsert. */
function remapCategoryIds<T extends { categoryId: string | null }>(
  rows: T[],
  idByOriginalId: Map<string, string>,
): T[] {
  return rows.map((row) => ({
    ...row,
    categoryId:
      row.categoryId === null
        ? null
        : (idByOriginalId.get(row.categoryId) ?? row.categoryId),
  }));
}

/** Strip primary key and owner so the same data object can drive create + update. */
function updateFields<T extends OwnedRow>(row: T): Omit<T, "id" | "userId"> {
  const { id: _id, userId: _userId, ...fields } = row;
  void _id;
  void _userId;
  return fields;
}

/** Keep diagnostic output useful without echoing connection strings or secrets. */
function safeMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : "Unknown error";
  return raw
    .replace(/postgres(?:ql)?:\/\/[^\s"']+/gi, "[redacted connection string]")
    .replace(
      /(DATABASE_URL|CLERK_SECRET_KEY|CLERK_WEBHOOK_SIGNING_SECRET)=\S+/gi,
      "$1=[redacted]",
    );
}

async function main(): Promise<void> {
  if (!isSeedEnabled()) {
    console.log("DEMO_SEED is set to false; demo seed skipped.");
    return;
  }

  const clerkUserId = requiredEnv("DEMO_CLERK_USER_ID");
  const prisma = createClient();

  try {
    await prisma.$connect();

    // A local row may already exist from the user's first authenticated request.
    // Do not overwrite real profile/settings data if it does.
    const existingUser = await prisma.user.findUnique({ where: { clerkUserId } });
    const owner =
      existingUser ??
      (await prisma.user.create({
        data: {
          ...buildDemoProfile(clerkUserId),
          id: undefined,
        },
      }));
    const userId = owner.id;

    // Build ids only after the real user id is known, so every row is scoped
    // to the correct owner and no placeholder id can leak into the database.
    let data = buildDemoData(userId, clerkUserId);

    if (existingUser) {
      console.log("Existing local user row found; profile settings left unchanged.");
    } else {
      console.log("Created a local user row for the configured Clerk user.");
    }

    for (const row of data.accounts) {
      await assertRowOwner(
        "Account",
        () => prisma.account.findUnique({ where: { id: row.id } }),
        userId,
      );
      await prisma.account.upsert({
        where: { id: row.id },
        create: row,
        update: updateFields(row),
      });
    }

    // The app may already have created default categories with the same names.
    // Reuse those rows through the unique (userId, name, type) key and leave
    // their existing settings untouched; never collide with or overwrite them.
    const categoryIdByOriginalId = new Map<string, string>();
    for (const row of data.categories) {
      const byId = await prisma.category.findUnique({ where: { id: row.id } });
      if (byId) {
        await assertRowOwner("Category", async () => byId, userId);
        const saved = await prisma.category.upsert({
          where: { id: row.id },
          create: row,
          update: updateFields(row),
        });
        categoryIdByOriginalId.set(row.id, saved.id);
        continue;
      }

      const saved = await prisma.category.upsert({
        where: {
          userId_name_type: { userId, name: row.name, type: row.type },
        },
        create: row,
        update: {},
      });
      categoryIdByOriginalId.set(row.id, saved.id);
    }

    // Foreign keys must point at the rows that actually exist after upsert.
    data = {
      ...data,
      transactions: remapCategoryIds(data.transactions, categoryIdByOriginalId),
      budgets: remapCategoryIds(data.budgets, categoryIdByOriginalId),
      recurringTransactions: remapCategoryIds(
        data.recurringTransactions,
        categoryIdByOriginalId,
      ),
    };

    for (const row of data.transactions) {
      await assertRowOwner(
        "Transaction",
        () => prisma.transaction.findUnique({ where: { id: row.id } }),
        userId,
      );
      await assertKeyOwner(
        "Transaction",
        () =>
          prisma.transaction.findUnique({
            where: { idempotencyKey: row.idempotencyKey },
          }),
        row,
      );
      await prisma.transaction.upsert({
        where: { id: row.id },
        create: row,
        update: updateFields(row),
      });
    }

    for (const row of data.transfers) {
      await assertRowOwner(
        "Transfer",
        () => prisma.transfer.findUnique({ where: { id: row.id } }),
        userId,
      );
      await assertKeyOwner(
        "Transfer",
        () =>
          prisma.transfer.findUnique({
            where: { idempotencyKey: row.idempotencyKey },
          }),
        row,
      );
      await prisma.transfer.upsert({
        where: { id: row.id },
        create: row,
        update: updateFields(row),
      });
    }

    for (const row of data.budgets) {
      await assertRowOwner(
        "Budget",
        () => prisma.budget.findUnique({ where: { id: row.id } }),
        userId,
      );
      await prisma.budget.upsert({
        where: { id: row.id },
        create: row,
        update: updateFields(row),
      });
    }

    for (const row of data.savingsGoals) {
      await assertRowOwner(
        "SavingsGoal",
        () => prisma.savingsGoal.findUnique({ where: { id: row.id } }),
        userId,
      );
      await prisma.savingsGoal.upsert({
        where: { id: row.id },
        create: row,
        update: updateFields(row),
      });
    }

    for (const row of data.savingsContributions) {
      await assertRowOwner(
        "SavingsContribution",
        () => prisma.savingsContribution.findUnique({ where: { id: row.id } }),
        userId,
      );
      await prisma.savingsContribution.upsert({
        where: { id: row.id },
        create: row,
        update: updateFields(row),
      });
    }

    for (const row of data.debts) {
      await assertRowOwner(
        "Debt",
        () => prisma.debt.findUnique({ where: { id: row.id } }),
        userId,
      );
      await prisma.debt.upsert({
        where: { id: row.id },
        create: row,
        update: updateFields(row),
      });
    }

    for (const row of data.debtPayments) {
      await assertRowOwner(
        "DebtPayment",
        () => prisma.debtPayment.findUnique({ where: { id: row.id } }),
        userId,
      );
      await prisma.debtPayment.upsert({
        where: { id: row.id },
        create: row,
        update: updateFields(row),
      });
    }

    for (const row of data.recurringTransactions) {
      await assertRowOwner(
        "RecurringTransaction",
        () => prisma.recurringTransaction.findUnique({ where: { id: row.id } }),
        userId,
      );
      await prisma.recurringTransaction.upsert({
        where: { id: row.id },
        create: row,
        update: updateFields(row),
      });
    }

    for (const row of data.notifications) {
      await assertRowOwner(
        "Notification",
        () => prisma.notification.findUnique({ where: { id: row.id } }),
        userId,
      );
      await prisma.notification.upsert({
        where: { id: row.id },
        create: row,
        update: updateFields(row),
      });
    }

    console.log(
      [
        "Demo seed complete.",
        `${data.accounts.length} accounts,`,
        `${data.categories.length} categories,`,
        `${data.transactions.length} transactions,`,
        `${data.transfers.length} transfers,`,
        `${data.budgets.length} budgets,`,
        `${data.savingsGoals.length} savings goals,`,
        `${data.savingsContributions.length} contributions,`,
        `${data.debts.length} debts,`,
        `${data.debtPayments.length} debt payments,`,
        `${data.recurringTransactions.length} recurring rules,`,
        `${data.notifications.length} notifications.`,
      ].join(" "),
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(`Demo seed failed: ${safeMessage(error)}`);
  process.exitCode = 1;
});
