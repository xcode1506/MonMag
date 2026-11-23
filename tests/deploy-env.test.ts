import { describe, expect, it } from "vitest";
import {
  formatDeployEnvReport,
  validateDeployEnv,
  type DeployEnvInput,
} from "../scripts/check-deploy-env";

const validEnv: DeployEnvInput = {
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_live_example",
  CLERK_SECRET_KEY: "sk_live_example",
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: "/sign-in",
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: "/sign-up",
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: "/dashboard",
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: "/onboarding",
  DATABASE_URL:
    "postgresql://postgres.ref:example@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1",
  NEXT_PUBLIC_APP_URL: "https://app.example.com",
  DEMO_SEED: "false",
};

describe("validateDeployEnv", () => {
  it("accepts a complete production-shaped environment", () => {
    const result = validateDeployEnv(validEnv);

    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.checked).toContain("DATABASE_URL");
    expect(result.checked).toContain("NEXT_PUBLIC_APP_URL");
  });

  it("reports missing required variables by name without echoing values", () => {
    const result = validateDeployEnv({
      ...validEnv,
      CLERK_SECRET_KEY: undefined,
      DATABASE_URL: "",
    });

    expect(result.ok).toBe(false);
    expect(result.issues.join("\n")).toContain("CLERK_SECRET_KEY is required");
    expect(result.issues.join("\n")).toContain("DATABASE_URL is required");
    expect(result.issues.join("\n")).not.toContain("sk_live_example");
  });

  it("rejects Clerk development keys", () => {
    const result = validateDeployEnv({
      ...validEnv,
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_example",
      CLERK_SECRET_KEY: "sk_test_example",
    });

    expect(result.issues.join("\n")).toContain(
      "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY must be a production key (pk_live_...)",
    );
    expect(result.issues.join("\n")).toContain(
      "CLERK_SECRET_KEY must be a production key (sk_live_...)",
    );
  });

  it("rejects placeholder values", () => {
    const result = validateDeployEnv({
      ...validEnv,
      NEXT_PUBLIC_APP_URL: "https://replace_me.example.com",
    });

    expect(result.issues.join("\n")).toContain(
      "NEXT_PUBLIC_APP_URL still contains a placeholder",
    );
  });

  it("requires an absolute https application origin", () => {
    const httpResult = validateDeployEnv({
      ...validEnv,
      NEXT_PUBLIC_APP_URL: "http://app.example.com",
    });
    const relativeResult = validateDeployEnv({
      ...validEnv,
      NEXT_PUBLIC_APP_URL: "/dashboard",
    });

    expect(httpResult.issues.join("\n")).toContain(
      "NEXT_PUBLIC_APP_URL must be an absolute https origin",
    );
    expect(relativeResult.issues.join("\n")).toContain(
      "NEXT_PUBLIC_APP_URL must be an absolute https origin",
    );
  });

  it("requires a PostgreSQL connection string for the application", () => {
    const result = validateDeployEnv({
      ...validEnv,
      DATABASE_URL: "https://example.supabase.co/rest/v1",
    });

    expect(result.issues.join("\n")).toContain(
      "DATABASE_URL must be a PostgreSQL connection string",
    );
  });

  it("rejects Supabase anon and service role credentials as DATABASE_URL", () => {
    const anonResult = validateDeployEnv({
      ...validEnv,
      DATABASE_URL: "postgresql://anon:example@db.example.supabase.co:5432/postgres",
    });
    const serviceResult = validateDeployEnv({
      ...validEnv,
      DATABASE_URL:
        "postgresql://service_role:example@db.example.supabase.co:5432/postgres",
    });

    expect(anonResult.issues.join("\n")).toContain(
      "DATABASE_URL must not use anon or service_role credentials",
    );
    expect(serviceResult.issues.join("\n")).toContain(
      "DATABASE_URL must not use anon or service_role credentials",
    );
  });

  it("requires the demo seed kill switch in production", () => {
    const result = validateDeployEnv({ ...validEnv, DEMO_SEED: "true" });

    expect(result.issues.join("\n")).toContain(
      "DEMO_SEED must be false in production",
    );
  });

  it("rejects the DATABASE_URL template shipped in .env.example", () => {
    const result = validateDeployEnv({
      ...validEnv,
      DATABASE_URL:
        "postgresql://USER:PASSWORD@HOST:6543/DATABASE?pgbouncer=true&connection_limit=1",
    });

    expect(result.issues.join("\n")).toContain(
      "DATABASE_URL still contains a placeholder",
    );
  });

  it("requires TLS for the production database connection", () => {
    for (const sslmode of ["disable", "allow", "prefer"]) {
      const result = validateDeployEnv({
        ...validEnv,
        DATABASE_URL: `postgresql://postgres.ref:pw@db.example.supabase.com:6543/postgres?sslmode=${sslmode}`,
      });

      expect(result.issues.join("\n")).toContain(
        "DATABASE_URL must require TLS in production",
      );
    }
  });

  it("requires an origin-only https application URL", () => {
    const result = validateDeployEnv({
      ...validEnv,
      NEXT_PUBLIC_APP_URL: "https://app.example.com/some/path?x=1",
    });

    expect(result.issues.join("\n")).toContain(
      "NEXT_PUBLIC_APP_URL must be an absolute https origin",
    );
  });

  it("rejects credentials embedded in the application URL", () => {
    const result = validateDeployEnv({
      ...validEnv,
      NEXT_PUBLIC_APP_URL: "https://user:secret@app.example.com",
    });

    expect(result.issues.join("\n")).toContain(
      "NEXT_PUBLIC_APP_URL must be an absolute https origin",
    );
  });

  it("rejects absolute Clerk redirect values", () => {
    const result = validateDeployEnv({
      ...validEnv,
      NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: "https://evil.example.com",
    });

    expect(result.issues.join("\n")).toContain(
      "NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL must be an absolute path beginning with \"/\"",
    );
  });

  it("rejects a placeholder Clerk webhook secret", () => {
    const result = validateDeployEnv({
      ...validEnv,
      CLERK_WEBHOOK_SIGNING_SECRET: "your_webhook_signing_secret_here",
    });

    expect(result.issues.join("\n")).toContain(
      "CLERK_WEBHOOK_SIGNING_SECRET still contains a placeholder",
    );
  });

  it("formats a report that never contains secret values", () => {
    const report = formatDeployEnvReport(
      validateDeployEnv({
        ...validEnv,
        CLERK_SECRET_KEY: "sk_live_DO_NOT_PRINT_THIS_VALUE",
      }),
    );

    expect(report).toContain("Deployment environment check: PASS");
    expect(report).not.toContain("sk_live_DO_NOT_PRINT_THIS_VALUE");
    expect(report).not.toContain("postgres.ref:example");
  });

  it("formats a failing report without echoing supplied secrets", () => {
    const report = formatDeployEnvReport(
      validateDeployEnv({
        ...validEnv,
        CLERK_SECRET_KEY: "sk_live_SENTINEL_DO_NOT_PRINT",
        DATABASE_URL: "",
      }),
    );

    expect(report).toContain("Deployment environment check: FAIL");
    expect(report).toContain("DATABASE_URL is required");
    expect(report).not.toContain("sk_live_SENTINEL_DO_NOT_PRINT");
  });

  it("redacts secret-like content from caller-supplied issues", () => {
    const report = formatDeployEnvReport({
      ok: false,
      issues: ["CLERK_SECRET_KEY sk_live_SENTINEL_VALUE leaked"],
      checked: [],
    });

    expect(report).toContain("CLERK_SECRET_KEY");
    expect(report).not.toContain("sk_live_SENTINEL_VALUE");
  });
});
