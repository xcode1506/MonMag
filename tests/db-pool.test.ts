import { describe, expect, it } from "vitest";
import {
  CONNECT_TIMEOUT_MS,
  IDLE_TIMEOUT_MS,
  MAX_POOL_CONNECTIONS,
  buildPoolConfig,
  toServerlessConnectionString,
} from "@/lib/db-pool-config";

describe("serverless database pool configuration", () => {
  it("allows parallel page queries while staying bounded per instance", () => {
    expect(MAX_POOL_CONNECTIONS).toBeGreaterThanOrEqual(4);
    expect(MAX_POOL_CONNECTIONS).toBeLessThanOrEqual(8);
  });

  it("releases idle connections so warm lambdas do not hold pool slots", () => {
    expect(IDLE_TIMEOUT_MS).toBeLessThanOrEqual(30_000);
  });

  it("fails fast instead of hanging when the shared pool is exhausted", () => {
    expect(CONNECT_TIMEOUT_MS).toBeGreaterThan(0);
    expect(CONNECT_TIMEOUT_MS).toBeLessThanOrEqual(15_000);
  });

  it("builds a pg pool config with the bounded limits and IPv4", () => {
    expect(buildPoolConfig("postgresql://example")).toEqual({
      connectionString: "postgresql://example",
      max: MAX_POOL_CONNECTIONS,
      idleTimeoutMillis: IDLE_TIMEOUT_MS,
      connectionTimeoutMillis: CONNECT_TIMEOUT_MS,
      family: 4,
    });
  });

  it("routes Supabase session-pooler traffic to the transaction pooler", () => {
    const sessionUrl =
      "postgresql://postgres.project:secret@aws-0-region.pooler.supabase.com:5432/postgres";

    const result = toServerlessConnectionString(sessionUrl);

    expect(new URL(result).port).toBe("6543");
    expect(new URL(result).hostname).toBe(
      "aws-0-region.pooler.supabase.com",
    );
    expect(new URL(result).username).toBe("postgres.project");
    expect(new URL(result).password).toBe("secret");
  });

  it("leaves an already-correct transaction-pooler URL unchanged", () => {
    const transactionUrl =
      "postgresql://postgres.project:secret@aws-0-region.pooler.supabase.com:6543/postgres";

    expect(toServerlessConnectionString(transactionUrl)).toBe(transactionUrl);
  });

  it("does not rewrite direct Supabase or non-Supabase connection strings", () => {
    const directUrl =
      "postgresql://postgres:secret@db.project.supabase.co:5432/postgres";
    const otherUrl = "postgresql://user:secret@localhost:5432/app";

    expect(toServerlessConnectionString(directUrl)).toBe(directUrl);
    expect(toServerlessConnectionString(otherUrl)).toBe(otherUrl);
  });

  it("normalizes the connection string used by the pg pool", () => {
    const sessionUrl =
      "postgresql://postgres.project:secret@aws-0-region.pooler.supabase.com:5432/postgres";

    expect(buildPoolConfig(sessionUrl).connectionString).toBe(
      toServerlessConnectionString(sessionUrl),
    );
  });
});
