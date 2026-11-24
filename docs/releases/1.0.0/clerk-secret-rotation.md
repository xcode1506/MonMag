# Clerk secret rotation — 2026-11-24

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
4. Vercel returned `PATCH /api/v7/projects/monmag/env/NXr0GadtUhYe0MwB` with HTTP 200 and confirmed “Updated Environment Variable successfully.”
5. The manual redeploy action from the success dialog did not create a deployment. A Vercel deployment-actions redeploy was attempted but stopped at the account verification challenge; it was cancelled rather than bypassed.
6. This documentation commit intentionally triggers a fresh Production build so the rotated environment value is picked up without entering a verification code in chat.

## Deployment

Pending at the time of writing. The deployment ID and Ready state will be recorded after verification.

## Verification checklist

- [ ] Production deployment using the rotated `CLERK_SECRET_KEY` is Ready.
- [ ] Clerk Dashboard shows `vercel-production-20261124-r4` as used.
- [ ] Old keys are no longer used by Production.
- [ ] Authenticated smoke passes after rotation.
- [ ] Runtime logs show no new Clerk auth errors after rotation.

## Cleanup policy

Do not delete any Clerk key until the rotated key is confirmed active in Production. After confirmation, remove unused keys only: `default`, `vercel-production-20261124`, `vercel-production-20261124-r3`, and any other key not in active use. Keep exactly the active rotation key.
