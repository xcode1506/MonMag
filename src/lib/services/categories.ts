import { assertOwnership } from "@/lib/auth";
import { localizedError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { categorySchema } from "@/lib/validation";

export async function listCategories(
  userId: string,
  type?: "INCOME" | "EXPENSE",
) {
  return prisma.category.findMany({
    where: { userId, ...(type ? { type } : {}) },
    orderBy: { name: "asc" },
  });
}

export async function createCategory(
  userId: string,
  raw: Parameters<typeof categorySchema.parse>[0],
) {
  const input = categorySchema.parse(raw);
  return prisma.category.create({
    data: {
      userId,
      name: input.name,
      type: input.type,
      color: input.color,
      icon: input.icon,
    },
  });
}

export async function deleteCategory(userId: string, categoryId: string) {
  const found = await prisma.category.findFirst({ where: { id: categoryId, userId } });
  const category = assertOwnership(found, userId, "Category");
  if (category.isDefault) {
    throw localizedError(409, "conflict", "error.defaultCategoriesNotDeletable");
  }
  await prisma.category.delete({ where: { id: categoryId } });
}

const DEFAULT_CATEGORIES: Array<{
  name: string;
  type: "INCOME" | "EXPENSE";
  icon: string;
  color: string;
}> = [
  { name: "Salary", type: "INCOME", icon: "briefcase", color: "#00cc4b" },
  { name: "Freelance", type: "INCOME", icon: "laptop", color: "#00acfe" },
  { name: "Investment", type: "INCOME", icon: "trending-up", color: "#ff8833" },
  { name: "Other income", type: "INCOME", icon: "circle-plus", color: "#5c6f8a" },
  { name: "Food & drinks", type: "EXPENSE", icon: "utensils", color: "#ff8833" },
  { name: "Transport", type: "EXPENSE", icon: "car", color: "#00acfe" },
  { name: "Housing", type: "EXPENSE", icon: "house", color: "#9019e6" },
  { name: "Shopping", type: "EXPENSE", icon: "shopping-bag", color: "#ff33aa" },
  { name: "Bills", type: "EXPENSE", icon: "receipt", color: "#ff4433" },
  { name: "Health", type: "EXPENSE", icon: "heart-pulse", color: "#ea687c" },
  { name: "Entertainment", type: "EXPENSE", icon: "clapperboard", color: "#ffcc02" },
  { name: "Other expense", type: "EXPENSE", icon: "circle-minus", color: "#5c6f8a" },
];

/** Safe to call repeatedly: uses the unique (userId, name, type) constraint. */
export async function ensureDefaultCategories(userId: string) {
  await Promise.all(
    DEFAULT_CATEGORIES.map((category) =>
      prisma.category.upsert({
        where: {
          userId_name_type: {
            userId,
            name: category.name,
            type: category.type,
          },
        },
        create: { userId, ...category, isDefault: true },
        update: {},
      }),
    ),
  );
}
