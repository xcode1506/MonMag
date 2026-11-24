# Clerk secret rotation - 2026-11-24

Secret values are deliberately omitted. This file records names, actions, and verification outcomes only.

## Scope

- Clerk application: `app_3MVCkwxZyH1LO34fouXJfiDqznc`
- Clerk instance: `ins_3MXl3YH1uro5NG1SPYyfqHieBhI`
- Vercel project: `monmag` (team `lhs21`)
- Variable rotated: `CLERK_SECRET_KEY`, target `Production`

## Rotation sequence

1. Existing keys were audited in the Clerk Dashboard. Full secret values were never copied into chat, source files, or commits.
2. A staged key `vercel-production-20261124-r3` was created after the dashboard verification challenge. It has not been used by any deployment.
3. A new key `vercel-production-20261124-r4` was created. Its full value was read only in memory and written directly to the Vercel Production `CLERK_SECRET_KEY` field.
4. Vercel returned `PATCH /api/v7/projects/monmag/env/NXr0GadtUhYe0MwB` with HTTP 200 and confirmed the environment variable was updated.
5. The manual redeploy action from the success dialog did not create a deployment. A Vercel deployment-actions redeploy was attempted but stopped at the account verification challenge; it was cancelled rather than bypassed.
6. This documentation commit intentionally triggered a fresh Production build so the rotated environment value was picked up without entering a verification code in chat.

## Deployment evidence

| Item | Value |
| --- | --- |
| Commit | `f956b45` |
| Deployment | `dpl_8iYF2yS6bodxzFsFfK2PNo7411Hb` |
| Deployment URL | `monmag-es1mdufrj-lhs21.vercel.app` |
| Production alias | `monmag.vercel.app` |
| State | `READY` |
| Alias error | `null` |
| Stale | `false` |
| Previous code deployment | `ef879c0` / `6x8oZSWLj9JeKMcwoGdGzPaYp9Vt` |

The Vercel production-deployment API reported the new deployment and alias as current at verification time. The earlier `f6bca8a` deployment was superseded. Later docs-only commits may create new alias deployments with identical application code.

## Verification outcomes

| Check | Result | Evidence |
| --- | --- | --- |
| Production deployment using rotated key is Ready | PASS | Production API: `dpl_8iYF2yS6bodxzFsFfK2PNo7411Hb`, `READY`, alias `monmag.vercel.app` |
| Clerk reports rotated key in use | PASS | After authenticated requests, `vercel-production-20261124-r4` showed `just now` |
| Old key stopped receiving production traffic | PASS | `vercel-production-20261124` aged from `3m ago` to `4m ago` to `6m ago` across later authenticated requests |
| Unused staged keys remain unused | PASS | `vercel-production-20261124-r2` and `vercel-production-20261124-r3` show no usage timestamp; `default` shows no usage timestamp |
| Authenticated smoke after rotation | PASS | `/transactions?verify=rotation` and `/settings?verify=rotation2` rendered the signed-in user's data with 0 console errors |
| Authenticated CSV export after rotation | PASS | `GET /api/transactions/export`: HTTP 200, `text/csv; charset=utf-8`, `attachment; filename="monmag-transactions.csv"`, `Cache-Control: no-store` |
| Runtime logs after rotation | PASS | Vercel Runtime Logs, last 30 minutes: Error 0, Fatal 0 |

No secret value was printed, staged, committed, or pasted into chat during verification.

## Cleanup status

Cleanup is complete. The unused Clerk keys `default`, `vercel-production-20261124-r2`, and `vercel-production-20261124-r3` were deleted, together with the superseded key `vercel-production-20261124`. Exactly one active secret key remains: `vercel-production-20261124-r4`.

Deletion used the Clerk Dashboard confirmation dialogs only. No verification code, full key value, or password was requested, captured, or sent to chat, source files, or this repository.

Evidence: after cleanup the API keys page lists only `vercel-production-20261124-r4`, used by the live production traffic. A fresh production smoke test at `/dashboard?verify=keys-cleanup` rendered the authenticated page with 0 console errors and 0 numeric navigation prefixes.

## Session review

The Production user's device list shows three active sessions, all reported in Indonesia on the latest Clerk detail view: Linux Chrome 157 at `103.190.46.246` (Pekanbaru) at 18:15, Windows Chrome 158 at `104.28.226.248` (Medan) at 18:14, and Windows Chrome 152.0.7977.167 at `104.28.194.247` (Medan) at 18:19. The earlier "Singapore" label was from an older snapshot of the same IP. The last session matches the user agent of the browser used for the authenticated production checks and warm navigation measurement. Decision: keep it active. Revoking it would only sign out the operator's own verification browser, with no security benefit. No sessions were revoked.

## Related evidence

- `docs/releases/1.0.0/target-acceptance.md`
- `docs/releases/1.0.0/deployment-readiness.md`
- `docs/releases/1.0.0/clerk-proxy.tdd.md`
