import type { NotificationType } from "@/generated/prisma/enums";
import { assertOwnership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function countUnreadNotifications(userId: string) {
  return prisma.notification.count({ where: { userId, read: false } });
}

export async function listNotifications(userId: string, take = 50) {
  const [items, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: Math.min(take, 200),
    }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);
  return { items, unread };
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });
  assertOwnership(notification, userId, "Notification");
  return prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
}

export async function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
}

export async function createNotification(
  userId: string,
  input: { title: string; message: string; type?: NotificationType },
) {
  return prisma.notification.create({
    data: {
      userId,
      title: input.title,
      message: input.message,
      type: input.type ?? "SYSTEM",
    },
  });
}
