import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

const centeredOverlayPatterns = [
  /fixed inset-0 z-40/,
  /grid place-items-center/,
  /pointer-events-none fixed inset-0 z-50/,
  /pointer-events-auto relative/,
];

describe("auth and modal layout", () => {
  it("renders Clerk directly on the midnight page without a decorative CSS box", () => {
    const frame = source("src/components/auth/auth-frame.tsx");
    expect(frame).not.toContain("auth-sheet");
    expect(frame).not.toContain("vault-panel");
    expect(frame).not.toContain("01 / ACCESS");
    expect(frame).not.toContain("landing.sampleData");
    expect(frame).not.toContain("hero-eyebrow");
    expect(frame).toContain("<ThemeToggle");
    expect(frame).toContain("{children}");

    const signIn = source("src/app/sign-in/[[...sign-in]]/page.tsx");
    const signUp = source("src/app/sign-up/[[...sign-up]]/page.tsx");
    expect(signIn).toContain("<SignIn />");
    expect(signUp).toContain("<SignUp />");
    expect(signIn).not.toContain("width=");
    expect(signUp).not.toContain("width=");

    const css = source("src/app/globals.css");
    expect(css).not.toMatch(/\.auth-sheet/);
  });

  it("centers dialog panels with a grid overlay instead of top/left transforms", () => {
    const modal = source("src/components/ui/modal.tsx");
    const confirm = source("src/components/ui/confirm-action-button.tsx");

    for (const component of [modal, confirm]) {
      for (const pattern of centeredOverlayPatterns) {
        expect(component, pattern.source).toMatch(pattern);
      }
      expect(component).not.toContain("left-1/2");
      expect(component).not.toContain("top-1/2");
      expect(component).not.toContain("-translate-x-1/2");
      expect(component).not.toContain("-translate-y-1/2");
    }
  });

  it("uses a scale-only dialog entrance animation that cannot shift the center", () => {
    const css = source("src/app/globals.css");
    const keyframe = css.match(/@keyframes dialog-panel-in[\s\S]*?\n}\n/)?.[0] ?? "";
    expect(keyframe).toContain("scale(0.98)");
    expect(keyframe).toContain("scale(1)");
    expect(keyframe).not.toMatch(/translate\(/);
  });

  it("keeps dialog animation on a dedicated class so stale translate keyframes cannot hit it", () => {
    const modal = source("src/components/ui/modal.tsx");
    const confirm = source("src/components/ui/confirm-action-button.tsx");
    const css = source("src/app/globals.css");

    for (const component of [modal, confirm]) {
      expect(component).toContain("dialog-panel");
      expect(component).not.toContain("dialog-content");
    }
    expect(css).toMatch(/\.dialog-panel \{[\s\S]*?animation: dialog-panel-in/);
    expect(css).toMatch(/\.dialog-panel,[\s\S]*?animation: none !important/);
    expect(css).not.toMatch(/\.dialog-content/);
    expect(css).not.toMatch(/ledger-dialog-in/);
  });
});
