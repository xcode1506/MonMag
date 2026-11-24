import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const proxySource = readFileSync(resolve(process.cwd(), "src/proxy.ts"), "utf8");

describe("Clerk proxy configuration", () => {
  it("includes the Clerk frontend API proxy path in the middleware matcher", () => {
    expect(proxySource).toContain('"/__clerk/(.*)"');
  });
});
