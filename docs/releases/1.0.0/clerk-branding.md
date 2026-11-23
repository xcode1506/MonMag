# Clerk branding and MonMag sign-in surface

This note records the supported Clerk v7 customization used for the MonMag rebrand in release 1.0.0.

## Development mode badge

The **Development mode** badge is suppressed with Clerk's documented appearance option, not with CSS:

```tsx
<ClerkProvider
  appearance={{
    options: {
      unsafe_disableDevelopmentModeWarnings: true,
    },
  }}
>
```

Clerk documents this option as a way to preview how components look in production. It is an `unsafe_*` option, so it is intentionally explicit in `src/app/layout.tsx`. No `cl-internal-*` selector, `display: none`, or other CSS concealment is used for this badge.

## Sign-in heading

The sign-in heading comes from Clerk localization, so it remains Clerk's real rendered heading rather than a duplicate page-level `<h1>`:

```tsx
localization={{
  signIn: {
    start: {
      title: "Sign In to MonMag",
    },
  },
  signUp: {
    start: {
      title: "Create your MonMag account",
    },
  },
}}
```

The sign-in page therefore renders exactly **Sign In to MonMag** from `signIn.start.title`.

## Direct auth surface

The previous decorative `.auth-sheet` / `.vault-panel` wrapper was removed from `src/components/auth/auth-frame.tsx`. The sign-in and sign-up pages now pass `<SignIn />` and `<SignUp />` directly into `AuthFrame`; the frame keeps only the masthead, theme toggle, and centered content slot.

Evidence:

- `tests/auth-modal-layout.test.ts:renders Clerk directly on the midnight page without a decorative CSS box` - RED before the fix, GREEN after.
- `tests/midnight-public.test.ts:lets Clerk render directly on midnight without a decorative auth box` - source contract for the frame, both pages, and the absence of `.auth-sheet` in `globals.css`.
- Refreshed headless probe at five viewport sizes: `authSheet=0`, `authDecor=0` on `/sign-in`, no page errors.
- Visible-browser probe with Clerk JS loaded: `clerkRootCount=1`, `authSheetCount=0`, `vaultPanelCount=0`, and the exact heading `Sign In to MonMag`.

The headless browser could not load Clerk JS in the isolated sandbox, so its result proves the removed decorative box and the app shell, not Clerk's mounted card. The visible-browser probe covers the mounted Clerk card.

## "Secured by Clerk" branding

There is no safe code-only `<SignIn />` prop for removing the **Secured by Clerk** badge, and this repository does not hide it with CSS.

Removal is a Dashboard/plan setting:

1. Open the Clerk Dashboard.
2. Go to **Settings → Branding**.
3. Enable **Remove "Secured by Clerk" branding**.

This requires a paid Clerk plan (Pro or above). Until that plan and Dashboard setting are in place, the badge remains visible; that is the supported and terms-compliant behavior.

## Supported styling approach

Styling is applied through `ClerkProvider appearance`:

- `appearance.options` for documented layout/behavior options such as `unsafe_disableDevelopmentModeWarnings`.
- `appearance.variables` for theme tokens such as `colorPrimary`, `colorForeground`, and `borderRadius`.
- `appearance.elements` for stable element keys such as `card`, `cardBox`, `headerTitle`, `formButtonPrimary`, and `footerActionLink`.

Do not target `cl-internal-*` selectors: they are Clerk implementation details and can change in any SDK release. Prefer documented `cl-*` classes and the stable `elements` keys listed in Clerk's Bring Your Own CSS guide when advanced styling is needed.

## Sources

- Appearance prop overview: <https://clerk.com/docs/nextjs/guides/customizing-clerk/appearance-prop/overview>
- Appearance options: <https://clerk.com/docs/nextjs/guides/customizing-clerk/appearance-prop/options>
- Localization: <https://clerk.com/docs/guides/customizing-clerk/localization?sdk=nextjs>
- Bring your own CSS: <https://clerk.com/docs/nextjs/guides/customizing-clerk/appearance-prop/bring-your-own-css>
- Clerk terms: <https://clerk.com/legal/terms>
- Clerk pricing: <https://clerk.com/pricing>
