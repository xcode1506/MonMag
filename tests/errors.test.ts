import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  forbiddenError,
  notFoundError,
  toApiError,
  unauthorizedError,
} from "@/lib/errors";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ApiError", () => {
  it("keeps status, code, details and the error prototype", () => {
    const details = { field: "amount" };
    const error = new ApiError(422, "validation_error", "Invalid amount", details);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.name).toBe("ApiError");
    expect(error.message).toBe("Invalid amount");
    expect(error.status).toBe(422);
    expect(error.code).toBe("validation_error");
    expect(error.details).toBe(details);
  });

  it("creates common HTTP-safe errors", () => {
    expect(unauthorizedError()).toMatchObject({ status: 401, code: "unauthorized" });
    expect(forbiddenError()).toMatchObject({ status: 403, code: "forbidden" });
    expect(notFoundError()).toMatchObject({
      status: 404,
      code: "not_found",
      message: "Resource not found.",
    });
    expect(notFoundError("Account").message).toBe("Account not found.");
  });
});

describe("toApiError", () => {
  it("passes through an existing ApiError", () => {
    const original = unauthorizedError();
    expect(toApiError(original)).toBe(original);
  });

  it("converts unknown errors without leaking details", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    const converted = toApiError(new Error("secret database URL"));
    expect(converted).toBeInstanceOf(ApiError);
    expect(converted.status).toBe(500);
    expect(converted.code).toBe("internal_error");
    expect(converted.message).toBe("An unexpected error occurred.");
    expect(converted.message).not.toContain("secret");
    expect(converted.messageKey).toBe("error.unexpected");
    expect(toApiError("oops")).toBeInstanceOf(ApiError);
    expect(log).toHaveBeenCalledWith("[monmag] unexpected error", expect.anything());
  });
});
