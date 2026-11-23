"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CashflowTrendPoint, RankedCategory } from "@/lib/finance/chart-view-models";
import { t, type Locale } from "@/lib/i18n";
import { money } from "@/lib/ui";

interface ChartProps {
  currency: string;
  locale: Locale;
  /** Optional display-only conversion target; stored amounts are unchanged. */
  displayCurrency?: string;
}

const tooltipStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-card)",
  color: "var(--foreground)",
  fontSize: "0.8125rem",
} as const;

function moneyFormatter(currency: string, locale: Locale, displayCurrency?: string) {
  return (value: unknown) =>
    money(String(value ?? 0), currency, locale, displayCurrency);
}

/** Income and expense as filled area bands over the selected month range. */
export function CashflowChart({
  data,
  currency,
  locale,
  displayCurrency,
}: ChartProps & { data: CashflowTrendPoint[] }) {
  const format = moneyFormatter(currency, locale, displayCurrency);

  return (
    <div
      className="cashflow-chart h-72 w-full"
      role="img"
      aria-label={t(locale, "dashboard.cashflow")}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.35} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis
            tickLine={false}
            axisLine={false}
            fontSize={11}
            width={72}
            tickFormatter={(value: number) => format(value)}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ fill: "var(--brand-soft)" }}
            formatter={(value) => format(value)}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="income"
            name={t(locale, "dashboard.income")}
            stroke="var(--brand)"
            fill="var(--brand)"
            fillOpacity={0.16}
            strokeWidth={2}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="expense"
            name={t(locale, "dashboard.expense")}
            stroke="var(--brand-accent)"
            fill="var(--brand-accent)"
            fillOpacity={0.12}
            strokeWidth={2}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Net result as a single line, with zero made explicit and the peak called out. */
export function NetTrendChart({
  data,
  currency,
  locale,
  displayCurrency,
}: ChartProps & { data: CashflowTrendPoint[] }) {
  const format = moneyFormatter(currency, locale, displayCurrency);
  const peak = data.reduce<CashflowTrendPoint | null>(
    (best, point) => (!best || point.net > best.net ? point : best),
    null,
  );

  return (
    <div className="net-trend-chart">
      <div
        className="h-64 w-full"
        role="img"
        aria-label={t(locale, "dashboard.netFlow")}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.35} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis
              tickLine={false}
              axisLine={false}
              fontSize={11}
              width={72}
              tickFormatter={(value: number) => format(value)}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ stroke: "var(--border)" }}
              formatter={(value) => format(value)}
            />
            <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
            <Line
              type="monotone"
              dataKey="net"
              name={t(locale, "dashboard.netFlow")}
              stroke="var(--brand)"
              strokeWidth={2}
              dot={{ r: 3, fill: "var(--brand)", stroke: "var(--card)" }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {peak ? (
        <p className="chart-caption">
          <span>{t(locale, "dashboard.peakMonth")}</span>
          <span className="numeric">
            {peak.month} · {format(peak.net)}
          </span>
        </p>
      ) : null}
    </div>
  );
}

/** Ranked horizontal bars; the list below carries the exact share and amount. */
export function CategoryRankingChart({
  data,
  currency,
  locale,
  displayCurrency,
}: ChartProps & { data: RankedCategory[] }) {
  const format = moneyFormatter(currency, locale, displayCurrency);

  return (
    <div
      className="category-chart category-ranking-chart flex min-h-72 flex-col gap-3"
      role="img"
      aria-label={`${t(locale, "dashboard.categoryRank")} · ${t(locale, "reports.byCategory")}`}
    >
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 12, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.35} />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              fontSize={11}
              tickFormatter={(value: number) => format(value)}
            />
            <YAxis
              type="category"
              dataKey="name"
              tickLine={false}
              axisLine={false}
              fontSize={12}
              width={110}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ fill: "var(--brand-soft)" }}
              formatter={(value) => format(value)}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} isAnimationActive={false}>
              {data.map((slice) => (
                <Cell key={slice.name} fill={slice.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="category-breakdown grid gap-2 sm:grid-cols-2">
        <p className="col-span-full flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          <span>{t(locale, "reports.byCategory")}</span>
          <span>{t(locale, "dashboard.share")}</span>
        </p>
        {data.map((slice) => (
          <div key={slice.name} className="flex items-center gap-3 text-xs">
            <span
              className="size-2 shrink-0"
              style={{ background: slice.color }}
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1 truncate">{slice.name}</span>
            <span className="numeric shrink-0 font-medium">{format(slice.value)}</span>
            <span className="numeric w-10 shrink-0 text-right text-muted-foreground">
              {slice.share}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
