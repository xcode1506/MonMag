import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("midnight dashboard and workspace surface", () => {
  it("turns shared cards into rounded inset vault panels", () => {
    const card = source("src/components/ui/card.tsx");
    expect(card).toContain("vault-panel");
    expect(card).not.toContain("ledger-panel");
    expect(card).not.toContain("rounded-sm");
    expect(card).not.toContain("shadow-[");

    const css = source("src/app/globals.css");
    expect(css).toMatch(/\.vault-panel/);
    expect(css).toMatch(/\.vault-panel[\s\S]{0,240}box-shadow:\s*var\(--inset-panel\)/);
  });

  it("keeps a signal-blue active state on the workspace rail", () => {
    const chrome = source("src/components/layout/app-chrome.tsx");
    expect(chrome).toContain("app-brandmark");
    expect(chrome).toContain("nav-index");
    expect(chrome).toContain("app-canvas");
    expect(chrome).toMatch(/data-active=\{active \? "true" : undefined\}/);
    expect(chrome).toMatch(/key=\{pathname\}/);

    const css = source("src/app/globals.css");
    expect(css).toMatch(/\.app-nav-link\[data-active="true"\]/);
    expect(css).toMatch(/\.app-nav-link\[data-active="true"\]::before[\s\S]{0,220}var\(--brand\)/);
  });

  it("uses candy accents for the default category palette", () => {
    const categories = source("src/lib/services/categories.ts");
    for (const color of [
      "#00cc4b",
      "#00acfe",
      "#ff8833",
      "#9019e6",
      "#ff33aa",
      "#ff4433",
      "#ffcc02",
    ]) {
      expect(categories, color).toContain(color);
    }
    expect(categories).not.toMatch(/#16A34A|#0D9488|#2563EB|#F97316|#7C3AED|#DB2777|#DC2626|#0891B2|#CA8A04/i);
  });

  it("defines the midnight workspace surface classes once", () => {
    const css = source("src/app/globals.css");
    for (const selector of [
      ".page-masthead",
      ".vault-panel",
      ".midnight-band",
      ".hero-tag",
      ".app-canvas",
      ".next-move-band",
      ".figure-index",
      ".chart-grid",
      ".net-trend-chart",
      ".category-ranking-chart",
    ]) {
      expect(css, selector).toContain(selector);
    }
    expect(css).toMatch(/font-feature-settings:\s*"tnum"/);
  });

  it("keeps the dashboard focus band and figure indexing", () => {
    const dashboard = source("src/app/(app)/dashboard/page.tsx");
    expect(dashboard).toContain("next-move-band");
    expect(dashboard).toContain("figure-index");
  });

  it("preserves responsive and motion behavior across feature views", () => {
    const css = source("src/app/globals.css");
    expect(css).toMatch(/\.mobile-tabbar/);
    expect(css).toMatch(/prefers-reduced-motion: reduce/);

    const chrome = source("src/components/layout/app-chrome.tsx");
    expect(chrome).toContain("mobile-tabbar");
    expect(chrome).toContain("data-active=");
  });
});
