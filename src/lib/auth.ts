import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { User } from "@/generated/prisma/client";
import { isLocale } from "./i18n";
import { notFoundError, unauthorizedError } from "./errors";
import { prisma } from "./prisma";

/** Clerk is the only authentication provider. */
export async function getClerkUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId ?? null;
}

/**
 * Returns the local user row, creating it on first authenticated request.
 * Clerk user profile data is used only as a source for the initial row.
 */
export async function getCurrentUser(): Promise<User | null> {
  const clerkUserId = await getClerkUserId();
  if (!clerkUserId) return null;

  const existing = await prisma.user.findUnique({
    where: { clerkUserId },
  });
  if (existing) return existing;

  const clerk = await currentUser();
  const primaryEmail =
    clerk?.emailAddresses.find((item) => item.id === clerk.primaryEmailAddressId)
      ?.emailAddress ??
    clerk?.emailAddresses[0]?.emailAddress ??
    "";
  const fullName =
    [clerk?.firstName, clerk?.lastName].filter(Boolean).join(" ") ||
    primaryEmail.split("@")[0] ||
    "MonMag user";
  const clerkLocale = clerk?.publicMetadata?.locale;
  const preferredLanguage =
    typeof clerkLocale === "string" && isLocale(clerkLocale) ? clerkLocale : "en";

  return prisma.user.upsert({
    where: { clerkUserId },
    create: {
      clerkUserId,
      fullName,
      email: primaryEmail,
      preferredLanguage,
    },
    update: {},
  });
}

/** Use in Server Components and Server Actions. Redirects when signed out. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}

/** Use in Route Handlers. Throws a 401 ApiError when signed out. */
export async function requireApiUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw unauthorizedError();
  return user;
}

/**
 * Ownership guard: never expose or mutate a row belonging to another user.
 * Throw 404 (not 403) so resource existence is not leaked.
 */
export function assertOwnership<T extends { userId: string }>(
  resource: T | null | undefined,
  userId: string,
  resourceName = "Resource",
): T {
  if (!resource || resource.userId !== userId) {
    throw notFoundError(resourceName);
  }
  return resource;
}
