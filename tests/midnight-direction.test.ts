import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Copilot Money midnight design direction", () => {
  it("uses the exact midnight canvas, steel border, signal blue, and paper tokens", () => {
    const css = source("src/app/globals.css");
    for (const token of [
      "--background: #000814",
      "--surface: #010d1e",
      "--indigo-surface: #001533",
      "--cobalt-surface: #00215e",
      "--border: #11263b",
      "--brand: #1c6cff",
      "--text: #ffffff",
      "--fog: #ccced0",
      "--mist: #999ca1",
    ]) {
      expect(css, token).toContain(token);
    }

    expect(css).not.toMatch(/#0F172A|#1E293B|#3B82F6|#60A5FA|#F1F5F9|#334155/i);
  });

  it("defines every candy category accent from the reference", () => {
    const css = source("src/app/globals.css");
    for (const token of [
      "--candy-coral: #ff4433",
      "--candy-lime: #00cc4b",
      "--candy-tangerine: #ff8833",
      "--candy-pink: #ff33aa",
      "--candy-violet: #9019e6",
      "--candy-sunflower: #ffcc02",
      "--candy-sky: #00acfe",
      "--candy-ember: #ea687c",
      "--candy-olive: #94ae43",
      "--candy-slate: #5c6f8a",
    ]) {
      expect(css, token).toContain(token);
    }
  });

  it("defines the four-based shape scale and viewport rhythm", () => {
    const css = source("src/app/globals.css");
    for (const token of [
      "--unit: 4px",
      "--radius-image: 8px",
      "--radius-button: 16px",
      "--radius-tag: 20px",
      "--radius-card: 24px",
      "--radius-container: 40px",
      "--content-max: 1200px",
      "--card-padding: 24px",
      "--element-gap: 16px",
    ]) {
      expect(css, token).toContain(token);
    }
    expect(css).toMatch(/--section-gap:\s*(80|88|96|104|112|120)px/);
  });

  it("uses condensed display type, thin body copy, and reference letter spacing", () => {
    const layout = source("src/app/layout.tsx");
    expect(layout).toContain("Space_Grotesk");
    expect(layout).toContain("--font-space-grotesk");
    expect(layout).toContain("Inter");
    expect(layout).toContain("--font-inter");

    const css = source("src/app/globals.css");
    expect(css).toMatch(/--font-display:[^;]*var\(--font-space-grotesk\)/);
    expect(css).toMatch(/--font-sans:[^;]*var\(--font-inter\)/);
    expect(css).toMatch(/body\s*\{[^}]*font-weight:\s*100/);
    expect(css).toMatch(/\.eyebrow,\s*\.hero-eyebrow\s*\{[^}]*letter-spacing:\s*0\.04em/);
    expect(css).toMatch(/\.hero-display\s*\{[^}]*letter-spacing:\s*-0\.02em/);
  });

  it("uses inset elevation only and no decorative gradients", () => {
    const css = source("src/app/globals.css");
    const shadows = css.match(/box-shadow:[^;]+/g) ?? [];
    expect(shadows.length).toBeGreaterThan(0);
    for (const shadow of shadows) {
      expect(shadow, shadow).toContain("inset");
    }
    expect(css).not.toMatch(/linear-gradient|radial-gradient/);

    const charts = source("src/components/charts/charts.tsx");
    expect(charts).not.toContain("boxShadow");
    expect(charts).not.toContain("borderRadius: \"2px\"");
  });

  it("makes signal blue the only filled call-to-action color", () => {
    const button = source("src/components/ui/button.tsx");
    expect(button).toContain('default: "bg-brand text-brand-foreground');
    expect(button).toMatch(/rounded-\[var\(--radius-button\)\]|rounded-2xl/);
    expect(button).not.toMatch(/rounded-sm|rounded-md/);

    const layout = source("src/app/layout.tsx");
    expect(layout).toContain('colorPrimary: "var(--brand)"');
    expect(layout).toContain("unsafe_disableDevelopmentModeWarnings: true");
  });

  it("keeps dark mode first and preserves the accessible motion contract", () => {
    const themeProvider = source("src/components/providers/theme-provider.tsx");
    expect(themeProvider).toContain('defaultTheme="dark"');

    const css = source("src/app/globals.css");
    expect(css).toMatch(/prefers-reduced-motion: reduce/);
    expect(css).toMatch(/@keyframes ledger-progress/);
    expect(css).toMatch(/\.mobile-tabbar/);
  });
});
