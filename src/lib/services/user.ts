import { notFoundError } from "@/lib/errors";
import type { Locale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { onboardingSchema, settingsSchema, type SettingsInput } from "@/lib/validation";
import { ensureDefaultCategories } from "./categories";

export async function updateSettings(
  userId: string,
  raw: SettingsInput,
) {
  const input = settingsSchema.parse(raw);
  if (input.defaultAccountId) {
    const account = await prisma.account.findFirst({
      where: { id: input.defaultAccountId, userId },
      select: { id: true },
    });
    if (!account) throw notFoundError("Default account");
  }
  return prisma.user.update({
    where: { id: userId },
    data: {
      fullName: input.fullName,
      email: input.email,
      preferredCurrency: input.preferredCurrency,
      preferredLanguage: input.preferredLanguage,
      timezone: input.timezone,
      dateFormat: input.dateFormat,
      firstDayOfWeek: input.firstDayOfWeek,
      defaultAccountId: input.defaultAccountId ?? null,
      theme: input.theme,
    },
  });
}

export async function completeProfileStep(
  userId: string,
  raw: {
    fullName?: string;
    preferredCurrency?: string;
    preferredLanguage?: Locale;
    timezone?: string;
  },
) {
  const input = onboardingSchema.parse({
    step: 1,
    ...raw,
  });
  return prisma.user.update({
    where: { id: userId },
    data: {
      onboardingStep: 1,
      ...(input.fullName ? { fullName: input.fullName } : {}),
      ...(input.preferredCurrency ? { preferredCurrency: input.preferredCurrency } : {}),
      ...(input.preferredLanguage ? { preferredLanguage: input.preferredLanguage } : {}),
      ...(input.timezone ? { timezone: input.timezone } : {}),
    },
  });
}

export async function completeOnboarding(userId: string) {
  await ensureDefaultCategories(userId);
  return prisma.user.update({
    where: { id: userId },
    data: { onboardingCompleted: true, onboardingStep: 3 },
  });
}
