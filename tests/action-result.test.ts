import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { formObject, formValues, runAction } from "@/lib/action-result";
import { ApiError } from "@/lib/errors";

afterEach(() => {
  vi.restoreAllMocks();
});

const makeFormData = () => {
  const formData = new FormData();
  formData.append("name", "  Alice  ");
  formData.append("blank", "   ");
  formData.append("upload", new Blob(["content"]), "note.txt");
  return formData;
};

const invalidParse = <T extends z.ZodType>(schema: T, value: unknown) => {
  const result = schema.safeParse(value);
  if (result.success) throw new Error("Expected parse to fail");
  return result.error;
};

describe("formObject", () => {
  it("trims strings and converts blank strings to null", () => {
    expect(formObject(makeFormData())).toEqual({ name: "Alice", blank: null });
  });

  it("skips non-string entries such as files", () => {
    expect(Object.keys(formObject(makeFormData()))).not.toContain("upload");
  });
});

describe("formValues", () => {
  it("returns the trimmed form object cast to the requested type", () => {
    const values = formValues<{ name: string; blank: null }>(makeFormData());
    expect(values.name).toBe("Alice");
    expect(values.blank).toBeNull();
  });
});

describe("runAction", () => {
  it("returns an explicit action result unchanged", async () => {
    const explicit = { ok: false as const, error: "Already exists" };
    await expect(
      runAction(async () => explicit, "ignored success message"),
    ).resolves.toEqual(explicit);
  });

  it("wraps a void operation with the success message", async () => {
    await expect(runAction(async () => {}, "Saved")).resolves.toEqual({
      ok: true,
      message: "Saved",
    });
  });

  it("allows a void operation without a success message", async () => {
    await expect(runAction(async () => {})).resolves.toEqual({
      ok: true,
      message: undefined,
    });
  });

  it("maps Zod issues to field errors, grouping repeated paths", async () => {
    const parseError = invalidParse(
      z.object({
        amount: z.string().min(5).refine((value) => /^\d+$/.test(value), "Must be numeric"),
        name: z.string().min(2),
      }),
      { amount: "ab", name: "" },
    );

    const result = await runAction(async () => {
      throw parseError;
    });

    expect(result).toMatchObject({
      ok: false,
      error: "Please check the highlighted fields.",
    });
    if (result.ok) throw new Error("Expected failure result");
    expect(Object.keys(result.fieldErrors ?? {})).toEqual(
      expect.arrayContaining(["amount", "name"]),
    );
    expect(result.fieldErrors?.amount.length).toBeGreaterThan(1);
  });

  it("uses the form key for issues without a field path", async () => {
    const parseError = invalidParse(
      z.object({}).refine(() => false, { message: "Form is invalid" }),
      {},
    );

    const result = await runAction(async () => {
      throw parseError;
    });

    expect(result).toMatchObject({
      ok: false,
      fieldErrors: { form: ["Form is invalid"] },
    });
  });

  it("preserves client-safe messages from 4xx ApiErrors", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await runAction(async () => {
      throw new ApiError(404, "not_found", "Category not found.");
    });

    expect(result).toEqual({ ok: false, error: "Category not found." });
    expect(log).not.toHaveBeenCalled();
  });

  it("sanitizes and logs unexpected Errors with internal details", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const internalError = new Error(
      'Unique constraint failed on the fields: (`"userId"`,`"name"`)',
    );

    const result = await runAction(async () => {
      throw internalError;
    });

    expect(result).toEqual({
      ok: false,
      error: "Something went wrong. Please try again.",
    });
    expect(log).toHaveBeenCalledWith("[monmag] action failed", internalError);
  });

  it("sanitizes 5xx ApiErrors without leaking internal details", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const internalError = new ApiError(500, "internal_error", "Connection refused");

    const result = await runAction(async () => {
      throw internalError;
    });

    expect(result).toEqual({
      ok: false,
      error: "Something went wrong. Please try again.",
    });
    expect(log).toHaveBeenCalledWith("[monmag] action failed", internalError);
  });

  it("falls back to a generic message for non-Error throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      runAction(async () => {
        throw "unexpected string";
      }),
    ).resolves.toEqual({
      ok: false,
      error: "Something went wrong. Please try again.",
    });
  });

  it("rethrows Next.js redirect signals so navigation is not swallowed", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const redirect = Object.assign(new Error("NEXT_REDIRECT"), {
      digest: "NEXT_REDIRECT;replace;/sign-in;307;",
    });

    await expect(
      runAction(async () => {
        throw redirect;
      }),
    ).rejects.toBe(redirect);
    expect(log).not.toHaveBeenCalled();
  });
});
