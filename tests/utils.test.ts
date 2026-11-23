import { describe, expect, it } from "vitest";
import { cn, createIdempotencyKey } from "@/lib/utils";

describe("cn", () => {
  it("combines class names", () => {
    expect(cn("px-2", "text-sm")).toBe("px-2 text-sm");
  });

  it("lets the last conflicting Tailwind class win", () => {
    expect(cn("px-2", "px-4", "text-sm")).toBe("px-4 text-sm");
  });

  it("ignores falsy inputs", () => {
    expect(cn("block", false, undefined, null, "hidden")).toBe("hidden");
  });
});

describe("createIdempotencyKey", () => {
  it("builds a namespaced, deterministic key", () => {
    expect(createIdempotencyKey("transaction", "abc-123")).toBe("transaction:abc-123");
    expect(createIdempotencyKey("transaction", "abc-123")).toBe(
      createIdempotencyKey("transaction", "abc-123"),
    );
  });
});
