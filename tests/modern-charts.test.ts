import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildCashflowTrend, rankCategories } from "@/lib/finance/chart-view-models";
import { LOCALES, t } from "@/lib/i18n";

function source(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function copy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

describe("modern dashboard chart view models", () => {
  it("builds a net trend from income and expense without mutating input", () => {
    const input = [
      { month: "Jan", income: "1000.00", expense: "420.50" },
      { month: "Feb", income: "800.00", expense: "950.00" },
    ];
    const before = copy(input);

    expect(buildCashflowTrend(input)).toEqual([
      { month: "Jan", income: 1000, expense: 420.5, net: 579.5 },
      { month: "Feb", income: 800, expense: 950, net: -150 },
    ]);
    expect(input).toEqual(before);
  });

  it("ranks categories and derives share from displayed values", () => {
    const input = [
      { name: "Food", value: "300.00", color: "#F59E0B" },
      { name: "Housing", value: "600.00", color: "#3B82F6" },
      { name: "Transport", value: "100.00", color: "#60A5FA" },
    ];
    const before = copy(input);

    const ranked = rankCategories(input, 2);
    expect(ranked.map((slice) => slice.name)).toEqual(["Housing", "Food"]);
    expect(ranked[0]?.share).toBe(60);
    expect(ranked[1]?.share).toBe(30);
    expect(input).toEqual(before);
  });

  it("returns stable empty models", () => {
    expect(buildCashflowTrend([])).toEqual([]);
    expect(rankCategories([])).toEqual([]);
  });

  it("handles a zero total without dividing by zero", () => {
    expect(rankCategories([{ name: "Empty", value: "0", color: "#3B82F6" }])).toEqual([
      { name: "Empty", value: 0, color: "#3B82F6", share: 0 },
    ]);
  });
});

describe("modern chart surfaces", () => {
  it("uses area, net line, and ranked bar models instead of a pie", () => {
    const charts = source("src/components/charts/charts.tsx");
    expect(charts).toContain("AreaChart");
    expect(charts).toContain("LineChart");
    expect(charts).toContain("ReferenceLine");
    expect(charts).toContain('dataKey="net"');
    expect(charts).toContain('layout="vertical"');
    expect(charts).not.toContain("PieChart");
    expect(charts).toContain("cashflow-chart");
    expect(charts).toContain("net-trend-chart");
    expect(charts).toContain("category-ranking-chart");
    expect(charts).toContain("money(");
  });

  it("wires all three models into the dashboard", () => {
    const dashboard = source("src/app/(app)/dashboard/page.tsx");
    expect(dashboard).toContain("buildCashflowTrend");
    expect(dashboard).toContain("rankCategories");
    expect(dashboard).toContain("<CashflowChart");
    expect(dashboard).toContain("<NetTrendChart");
    expect(dashboard).toContain("<CategoryRankingChart");
  });

  it("uses the modern models on reports too", () => {
    const reports = source("src/app/(app)/reports/page.tsx");
    expect(reports).toContain("<NetTrendChart");
    expect(reports).toContain("<CategoryRankingChart");
    expect(reports).not.toContain("<CategoryChart");
  });

  it("localizes the new chart labels in all ten locales", () => {
    const keys = [
      "dashboard.netFlow",
      "dashboard.peakMonth",
      "dashboard.categoryRank",
      "dashboard.share",
    ] as const;
    for (const key of keys) {
      for (const locale of LOCALES) {
        const value = t(locale, key);
        expect(value).toBeTruthy();
        expect(value).not.toBe(key);
      }
    }
    expect(t("en", "dashboard.netFlow")).toBe("Net flow");
    expect(t("en", "dashboard.peakMonth")).toBe("Peak month");
    expect(t("en", "dashboard.categoryRank")).toBe("Spending rank");
    expect(t("en", "dashboard.share")).toBe("Share");
  });
});
