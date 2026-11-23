import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("midnight landing and sign-in surfaces", () => {
  it("renders the hero as a display statement with an all-caps eyebrow", () => {
    const landing = source("src/components/marketing/landing-content.tsx");
    expect(landing).toContain("hero-display");
    expect(landing).toContain("hero-eyebrow");
    expect(landing).toContain("landing.heroTitleBefore");
    expect(landing).toContain("landing.heroTitleAccent");
    expect(landing).not.toContain("Console");

    const css = source("src/app/globals.css");
    expect(css).toMatch(/\.hero-display/);
    expect(css).toMatch(/\.hero-eyebrow/);
  });

  it("scatters rotated candy tags around the hero instead of a rigid grid", () => {
    const landing = source("src/components/marketing/landing-content.tsx");
    expect(landing).toContain("hero-tag-cloud");
    expect(landing).toContain("hero-tag");
    expect(landing).toContain("data-rotate={tag.rotate}");
    expect(landing).toContain('rotate: "-12"');
    expect(landing).toContain('rotate: "12"');
    expect(landing).toContain("--candy-");

    const css = source("src/app/globals.css");
    expect(css).toMatch(/\.hero-tag\[data-rotate="-12"\]/);
    expect(css).toMatch(/\.hero-tag\[data-rotate="12"\]/);
    expect(css).toMatch(/\.hero-tag[\s\S]{0,260}border-radius:\s*var\(--radius-tag\)/);
  });

  it("uses flat midnight tonal bands and an inset preview vault", () => {
    const landing = source("src/components/marketing/landing-content.tsx");
    expect(landing).toContain("midnight-band");
    expect(landing).toContain("vault-panel");
    expect(landing).not.toContain("linear-gradient");

    const css = source("src/app/globals.css");
    expect(css).toMatch(/\.midnight-band/);
    expect(css).toMatch(/\.vault-panel[\s\S]{0,240}box-shadow:\s*var\(--inset-panel\)/);
    expect(css).toMatch(/\.vault-panel[\s\S]{0,240}border-radius:\s*var\(--radius-card\)/);
  });

  it("keeps one primary signal-blue CTA and a quiet secondary action", () => {
    const landing = source("src/components/marketing/landing-content.tsx");
    expect(landing).toContain('size="lg"');
    expect(landing).toContain('variant="outline"');
    expect(landing).not.toContain("bg-positive");
    expect(landing).not.toContain("bg-negative");
    expect(landing).not.toContain("bg-candy");
  });

  it("lets Clerk render directly on midnight without a decorative auth box", () => {
    const frame = source("src/components/auth/auth-frame.tsx");
    expect(frame).not.toContain("auth-sheet");
    expect(frame).not.toContain("vault-panel");
    expect(frame).not.toContain("ledger-panel");
    expect(frame).not.toContain("01 / ACCESS");
    expect(frame).not.toContain("Console");
    expect(frame).toContain("auth-masthead");
    expect(frame).toContain("<ThemeToggle");
    expect(frame).toContain("{children}");
    expect(frame).not.toMatch(/display:\s*none|visibility:\s*hidden/i);

    const signIn = source("src/app/sign-in/[[...sign-in]]/page.tsx");
    const signUp = source("src/app/sign-up/[[...sign-up]]/page.tsx");
    expect(signIn).toContain("<SignIn />");
    expect(signUp).toContain("<SignUp />");
    expect(signIn).not.toContain("width=");
    expect(signUp).not.toContain("width=");

    const layout = source("src/app/layout.tsx");
    expect(layout).toContain('title: "Sign In to MonMag"');
    expect(layout).toContain('borderRadius: "16px"');
    expect(layout).toContain('colorPrimary: "var(--brand)"');
    expect(layout).not.toMatch(/Secured by Clerk/i);

    const css = source("src/app/globals.css");
    expect(css).not.toMatch(/\.auth-sheet/);
  });

  it("preserves the public theme toggle and sample-data disclosure", () => {
    const landing = source("src/components/marketing/landing-content.tsx");
    expect(landing).toContain("<ThemeToggle");
    expect(landing).toContain("landing.sampleData");

    const frame = source("src/components/auth/auth-frame.tsx");
    expect(frame).toContain("<ThemeToggle");
  });
});
