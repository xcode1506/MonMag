import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: [
        "src/lib/money.ts",
        "src/lib/date.ts",
        "src/lib/finance/balances.ts",
        "src/lib/finance/budgets.ts",
        "src/lib/finance/analytics.ts",
        "src/lib/finance/chart-view-models.ts",
        "src/lib/finance/debt.ts",
        "src/lib/validation.ts",
        "src/lib/action-result.ts",
        "src/lib/ui.ts",
        "src/lib/view-models/*.ts",
        "src/lib/errors.ts",
        "src/lib/utils.ts",
      ],
      thresholds: { lines: 80, functions: 80, branches: 75, statements: 80 },
    },
  },
});
