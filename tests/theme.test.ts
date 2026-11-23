import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LOCALES, t } from "@/lib/i18n";
import { themeActionKey } from "@/lib/theme";

function source(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("theme controls", () => {
  it("maps the resolved appearance to the next accessible action", () => {
    expect(themeActionKey("dark")).toBe("theme.switchToDay");
    expect(themeActionKey("light")).toBe("theme.switchToNight");
    expect(themeActionKey(undefined)).toBe("theme.switchToNight");
  });

  it("translates theme labels in all ten locales", () => {
    const keys = ["theme.toggleAria", "theme.switchToDay", "theme.switchToNight"] as const;
    for (const key of keys) {
      for (const locale of LOCALES) {
        const value = t(locale, key);
        expect(value).toBeTruthy();
        expect(value).not.toBe(key);
      }
    }
    expect(t("en", "theme.switchToNight")).toBe("Switch to night mode");
    expect(t("en", "theme.switchToDay")).toBe("Switch to day mode");
    expect(t("id", "theme.switchToNight")).toBe("Aktifkan mode malam");
  });

  it("uses a mounted, labeled next-themes toggle", () => {
    const toggle = source("src/components/ui/theme-toggle.tsx");
    expect(toggle).toContain('from "next-themes"');
    expect(toggle).toContain("useTheme()");
    expect(toggle).toContain("setTheme");
    expect(toggle).toContain("aria-label");
    expect(toggle).toContain("mounted");
    expect(toggle).not.toMatch(/outline:\s*none/i);
    expect(toggle).not.toMatch(/focus:outline-none/i);
  });

  it("wires the appearance toggle into app and public headers", () => {
    const chrome = source("src/components/layout/app-chrome.tsx");
    const landing = source("src/components/marketing/landing-content.tsx");
    expect(chrome).toContain("<ThemeToggle");
    expect(landing).toContain("<ThemeToggle");
  });

  it("keeps the editorial palette in the root Clerk appearance", () => {
    const layout = source("src/app/layout.tsx");
    // Clerk inherits the theme-aware tokens so its text stays legible in both
    // day and night modes; a hardcoded ink would render dark on dark.
    expect(layout).toContain('colorPrimary: "var(--brand)"');
    expect(layout).toContain('colorForeground: "var(--foreground)"');
    expect(layout).not.toContain("#0d9488");
  });
});
