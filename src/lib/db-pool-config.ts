/**
 * Bounded connection settings for the serverless PostgreSQL pool.
 *
 * Supabase's session pooler caps clients (observed: pool_size 15). Each Vercel
 * function instance owns its own Prisma/pg pool, so an unbounded pool exhausts
 * the shared cap under concurrent page loads and surfaces as React error #441.
 * Keeping one connection per instance plus a short idle timeout lets warm
 * functions release their slot quickly instead of holding it indefinitely.
 */
export const MAX_POOL_CONNECTIONS = 1;
export const IDLE_TIMEOUT_MS = 2_000;
export const CONNECT_TIMEOUT_MS = 10_000;

export function buildPoolConfig(connectionString: string) {
  return {
    connectionString,
    max: MAX_POOL_CONNECTIONS,
    idleTimeoutMillis: IDLE_TIMEOUT_MS,
    connectionTimeoutMillis: CONNECT_TIMEOUT_MS,
  };
}
