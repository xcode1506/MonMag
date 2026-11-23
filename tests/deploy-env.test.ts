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
});
