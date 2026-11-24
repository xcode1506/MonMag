import { describe, expect, it } from "vitest";
import {
  CONNECT_TIMEOUT_MS,
  IDLE_TIMEOUT_MS,
  MAX_POOL_CONNECTIONS,
  buildPoolConfig,
} from "@/lib/db-pool-config";

describe("serverless database pool configuration", () => {
  it("bounds each serverless instance to a single connection", () => {
    expect(MAX_POOL_CONNECTIONS).toBe(1);
  });

  it("releases idle connections quickly so warm lambdas do not hold pool slots", () => {
    expect(IDLE_TIMEOUT_MS).toBeLessThanOrEqual(5_000);
  });

  it("fails fast instead of hanging when the shared pool is exhausted", () => {
    expect(CONNECT_TIMEOUT_MS).toBeGreaterThan(0);
    expect(CONNECT_TIMEOUT_MS).toBeLessThanOrEqual(15_000);
  });

  it("builds a pg pool config with the bounded limits", () => {
    expect(buildPoolConfig("postgresql://example")).toEqual({
      connectionString: "postgresql://example",
      max: 1,
      idleTimeoutMillis: IDLE_TIMEOUT_MS,
      connectionTimeoutMillis: CONNECT_TIMEOUT_MS,
    });
  });
});
