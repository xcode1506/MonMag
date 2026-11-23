import { readFileSync, readdirSync } from "node:fs";
import { extname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { LOCALES, t, translations } from "@/lib/i18n";

const ROOT = process.cwd();
const SOURCE_DIRS = ["src/app", "src/components", "src/lib", "docs"] as const;

function source(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function sourceFiles(directory: string): string[] {
  const absolute = join(ROOT, directory);
  const files: string[] = [];

  for (const entry of readdirSync(absolute, { withFileTypes: true })) {
    const relative = `${directory}/${entry.name}`;
    if (entry.isDirectory()) {
      files.push(...sourceFiles(relative));
    } else if ([".ts", ".tsx", ".css", ".md"].includes(extname(entry.name))) {
      files.push(relative);
    }
  }

  return files;
}

describe("anti-slop source discipline", () => {
  it("uses plain punctuation in app copy, docs, and schema comments", () => {
    const files = [
      ...SOURCE_DIRS.flatMap((directory) => sourceFiles(directory)),
      "prisma/schema.prisma",
    ];

    for (const file of files) {
      expect(source(file), file).not.toMatch(/[—–]/);
    }
  });

  it("uses plain punctuation in every translated string", () => {
    const keys = Object.keys(translations) as Array<keyof typeof translations>;
    for (const locale of LOCALES) {
      for (const key of keys) {
        expect(t(locale, key), `${locale}:${key}`).not.toMatch(/[—–]/);
      }
    }
  });

  it("keeps keyboard focus visible on form fields and dialogs", () => {
    const files = SOURCE_DIRS.flatMap((directory) => sourceFiles(directory));
    for (const file of files) {
      expect(source(file), file).not.toMatch(/outline:\s*none/i);
      expect(source(file), file).not.toMatch(/focus:outline-none/i);
    }

    const css = source("src/app/globals.css");
    expect(css).toMatch(/\.field-input:focus-visible/);
  });

  it("limits glass effects to two intentional surfaces", () => {
    const css = source("src/app/globals.css");
    const classes = new Set(css.match(/\.glass-[a-z-]+/g) ?? []);
    expect(classes.size).toBeLessThanOrEqual(2);
  });

  it("labels the landing preview figures as sample data", () => {
    const landing = source("src/components/marketing/landing-content.tsx");
    expect(landing).toContain("landing.sampleData");
    expect(t("en", "landing.sampleData" as keyof typeof translations)).toMatch(
      /sample/i,
    );
  });

  it("avoids unsupported pricing claims in landing copy", () => {
    expect(t("en", "landing.ctaStart")).not.toMatch(/free/i);
  });
});
