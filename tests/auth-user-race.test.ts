import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
  redirect: vi.fn(),
  findUnique: vi.fn(),
  upsert: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
  currentUser: mocks.currentUser,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mocks.findUnique,
      upsert: mocks.upsert,
    },
  },
}));

import { getCurrentUser } from "@/lib/auth";

const clerkUserId = "user_concurrent";

describe("getCurrentUser first-request race", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.auth.mockResolvedValue({ userId: clerkUserId });
    mocks.currentUser.mockResolvedValue(null);
  });

  it("returns the row committed by a concurrent request when upsert hits P2002", async () => {
    const winner = { id: "db_1", clerkUserId };
    mocks.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(winner);
    mocks.upsert.mockRejectedValueOnce({
      code: "P2002",
      message: "Unique constraint failed on the constraint: `User_clerkUserId_key`",
    });

    await expect(getCurrentUser()).resolves.toEqual(winner);
    expect(mocks.findUnique).toHaveBeenCalledTimes(2);
    expect(mocks.upsert).toHaveBeenCalledTimes(1);
  });

  it("does not swallow unrelated database errors", async () => {
    mocks.findUnique.mockResolvedValueOnce(null);
    mocks.upsert.mockRejectedValueOnce({ code: "P2025", message: "unrelated" });

    await expect(getCurrentUser()).rejects.toMatchObject({ code: "P2025" });
  });

  it("skips the write when the user row already exists", async () => {
    const existing = { id: "db_existing", clerkUserId };
    mocks.findUnique.mockResolvedValueOnce(existing);

    await expect(getCurrentUser()).resolves.toEqual(existing);
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
});
