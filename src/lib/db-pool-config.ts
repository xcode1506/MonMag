/**
 * Bounded connection settings for the serverless PostgreSQL pool.
 *
 * Supabase's session pooler caps clients (observed: pool_size 15). Each Vercel
 * function instance owns its own Prisma/pg pool, so an unbounded pool exhausts
 * the shared cap under concurrent page loads and surfaces as React error #441.
 * Keeping one connection per instance plus a short idle timeout lets warm
 * functions release their slot quickly instead of holding it indefinitely.
 *
 * Supabase's shared session pooler is still reachable on port 5432, but it is
 * not designed for serverless traffic: once 15 clients are attached, new
 * connections hang until the pg connect timeout expires. Supabase documents
 * the transaction pooler on port 6543 (200 clients on the free compute tier)
 * as the correct endpoint for serverless functions. The stored DATABASE_URL may
 * still carry the session-pooler port, so runtime traffic is normalized here
 * without changing or exposing the credential itself.
 */

const SUPABASE_POOLER_HOST_SUFFIX = ".pooler.supabase.com";
const SESSION_POOLER_PORT = "5432";
const TRANSACTION_POOLER_PORT = "6543";

export const MAX_POOL_CONNECTIONS = 1;
export const IDLE_TIMEOUT_MS = 2_000;
export const CONNECT_TIMEOUT_MS = 10_000;

/**
 * Return a serverless-appropriate connection string.
 *
 * Only Supabase shared pooler URLs on the session port are rewritten; direct
 * connections, other hosts, and already-correct transaction URLs pass through
 * unchanged. Malformed values are returned untouched so existing validation
 * and driver errors remain attributable to the original configuration.
 */
export function toServerlessConnectionString(connectionString: string): string {
  let parsed: URL;
  try {
    parsed = new URL(connectionString);
  } catch {
    return connectionString;
  }

  const isSupabasePooler = parsed.hostname
    .toLowerCase()
    .endsWith(SUPABASE_POOLER_HOST_SUFFIX);
  const usesSessionPort = parsed.port === SESSION_POOLER_PORT || parsed.port === "";

  if (!isSupabasePooler || !usesSessionPort) {
    return connectionString;
  }

  parsed.port = TRANSACTION_POOLER_PORT;
  return parsed.toString();
}

export function buildPoolConfig(connectionString: string) {
  return {
    connectionString: toServerlessConnectionString(connectionString),
    max: MAX_POOL_CONNECTIONS,
    idleTimeoutMillis: IDLE_TIMEOUT_MS,
    connectionTimeoutMillis: CONNECT_TIMEOUT_MS,
  };
}
