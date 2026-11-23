import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export type DeployEnvInput = Record<string, string | undefined>;

export type DeployEnvResult = {
  ok: boolean;
  issues: string[];
  checked: string[];
};

const REQUIRED_ENV_NAMES = [
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "NEXT_PUBLIC_CLERK_SIGN_IN_URL",
  "NEXT_PUBLIC_CLERK_SIGN_UP_URL",
  "NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL",
  "NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL",
  "DATABASE_URL",
  "NEXT_PUBLIC_APP_URL",
] as const;

const CLERK_PATH_NAMES = [
  "NEXT_PUBLIC_CLERK_SIGN_IN_URL",
  "NEXT_PUBLIC_CLERK_SIGN_UP_URL",
  "NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL",
  "NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL",
] as const;

const PLACEHOLDER_PATTERN =
  /replace[_-]?me|your[_-]?|changeme|xxxx|placeholder|user:password@|\b(?:HOST|USERNAME|PASSWORD|DATABASE)\b|example\.invalid/i;

const SECRET_LIKE_PATTERN =
  /(sk_live_|pk_live_|sk_test_|pk_test_|whsec_)[A-Za-z0-9_-]{4,}|postgresql?:\/\/[^\s]+/gi;

function redactSecrets(text: string): string {
  return text.replace(
    SECRET_LIKE_PATTERN,
    (match, prefix: string | undefined) =>
      prefix ? `${prefix}[REDACTED]` : "[REDACTED_DB_URL]",
  );
}

function readValue(env: DeployEnvInput, name: string): string {
  const value = env[name];
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Validate production deployment inputs without ever returning or printing a
 * secret value. Issues contain variable names and remediation hints only.
 */
export function validateDeployEnv(env: DeployEnvInput): DeployEnvResult {
  const issues: string[] = [];
  const checked: string[] = [];
  const values = new Map<string, string>();

  for (const name of REQUIRED_ENV_NAMES) {
    const value = readValue(env, name);
    values.set(name, value);

    if (!value) {
      issues.push(`${name} is required`);
      continue;
    }

    checked.push(name);

    if (PLACEHOLDER_PATTERN.test(value)) {
      issues.push(`${name} still contains a placeholder`);
    }
  }

  const publishableKey = values.get("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY") ?? "";
  if (publishableKey && !publishableKey.startsWith("pk_live_")) {
    issues.push(
      "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY must be a production key (pk_live_...)",
    );
  }

  const clerkSecretKey = values.get("CLERK_SECRET_KEY") ?? "";
  if (clerkSecretKey && !clerkSecretKey.startsWith("sk_live_")) {
    issues.push("CLERK_SECRET_KEY must be a production key (sk_live_...)");
  }

  for (const name of CLERK_PATH_NAMES) {
    const value = values.get(name) ?? "";
    if (value && !value.startsWith("/")) {
      issues.push(`${name} must be an absolute path beginning with "/"`);
    }
  }

  const webhookSecret = readValue(env, "CLERK_WEBHOOK_SIGNING_SECRET");
  if (webhookSecret && PLACEHOLDER_PATTERN.test(webhookSecret)) {
    issues.push("CLERK_WEBHOOK_SIGNING_SECRET still contains a placeholder");
  }

  const appUrl = values.get("NEXT_PUBLIC_APP_URL") ?? "";
  if (appUrl) {
    try {
      const parsed = new URL(appUrl);
      const hasCredentials = Boolean(parsed.username || parsed.password);
      const isOrigin =
        parsed.pathname === "/" && !parsed.search && !parsed.hash;
      if (parsed.protocol !== "https:" || hasCredentials || !isOrigin) {
        issues.push("NEXT_PUBLIC_APP_URL must be an absolute https origin");
      }
    } catch {
      issues.push("NEXT_PUBLIC_APP_URL must be an absolute https origin");
    }
  }

  const databaseUrl = values.get("DATABASE_URL") ?? "";
  if (databaseUrl) {
    try {
      const parsed = new URL(databaseUrl);
      const protocol = parsed.protocol.replace(":", "").toLowerCase();
      if (protocol !== "postgres" && protocol !== "postgresql") {
        issues.push("DATABASE_URL must be a PostgreSQL connection string");
      }

      const user = parsed.username.toLowerCase();
      if (user === "anon" || user === "service_role") {
        issues.push(
          "DATABASE_URL must not use anon or service_role credentials",
        );
      }

      const sslmode = parsed.searchParams.get("sslmode")?.toLowerCase();
      if (sslmode && sslmode !== "require" && sslmode !== "verify-full") {
        issues.push("DATABASE_URL must require TLS in production");
      }
    } catch {
      issues.push("DATABASE_URL must be a PostgreSQL connection string");
    }
  }

  if (readValue(env, "DEMO_SEED") !== "false") {
    issues.push("DEMO_SEED must be false in production");
  }

  return { ok: issues.length === 0, issues, checked };
}

/** Build a human-readable report containing names only, never raw values. */
export function formatDeployEnvReport(result: DeployEnvResult): string {
  if (result.ok) {
    return [
      "Deployment environment check: PASS",
      `Checked ${result.checked.length} required variables. No secret values were printed.`,
    ].join("\n");
  }

  return [
    "Deployment environment check: FAIL",
    ...result.issues.map((issue) => `- ${redactSecrets(issue)}`),
    "No secret values were printed.",
  ].join("\n");
}

/** Load git-ignored local values for local preflight; Vercel env stays authoritative. */
export function loadDeployEnv(): DeployEnvInput {
  loadEnv({
    path: fileURLToPath(new URL("../.env.local", import.meta.url)),
    quiet: true,
  });
  return process.env as DeployEnvInput;
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const result = validateDeployEnv(loadDeployEnv());
  console.log(formatDeployEnvReport(result));
  process.exit(result.ok ? 0 : 1);
}
