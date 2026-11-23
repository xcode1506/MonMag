/**
 * All money values are stored and calculated as integer minor units (BigInt).
 * Never use floating point for monetary math.
 */
export const CURRENCIES = [
  "IDR",
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "CNY",
  "SGD",
  "MYR",
  "AUD",
  "CAD",
  "CHF",
  "HKD",
  "NZD",
  "SEK",
  "NOK",
  "DKK",
  "INR",
  "KRW",
  "THB",
  "PHP",
  "VND",
  "BRL",
  "MXN",
  "ZAR",
  "AED",
  "SAR",
  "BHD",
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number];

/** Currencies offered as display preferences in settings. */
export const CONVERTIBLE_CURRENCIES: readonly CurrencyCode[] = CURRENCIES;

/** Human names for every selectable currency code. */
export const CURRENCY_NAMES: Record<CurrencyCode, string> = {
  IDR: "IDR: Indonesian rupiah",
  USD: "USD: US dollar",
  EUR: "EUR: Euro",
  GBP: "GBP: British pound",
  JPY: "JPY: Japanese yen",
  CNY: "CNY: Chinese yuan",
  SGD: "SGD: Singapore dollar",
  MYR: "MYR: Malaysian ringgit",
  AUD: "AUD: Australian dollar",
  CAD: "CAD: Canadian dollar",
  CHF: "CHF: Swiss franc",
  HKD: "HKD: Hong Kong dollar",
  NZD: "NZD: New Zealand dollar",
  SEK: "SEK: Swedish krona",
  NOK: "NOK: Norwegian krone",
  DKK: "DKK: Danish krone",
  INR: "INR: Indian rupee",
  KRW: "KRW: South Korean won",
  THB: "THB: Thai baht",
  PHP: "PHP: Philippine peso",
  VND: "VND: Vietnamese đồng",
  BRL: "BRL: Brazilian real",
  MXN: "MXN: Mexican peso",
  ZAR: "ZAR: South African rand",
  AED: "AED: UAE dirham",
  SAR: "SAR: Saudi riyal",
  BHD: "BHD: Bahraini dinar",
};

/** Number of decimal places used by each currency's minor unit. */
const CURRENCY_SCALE: Record<CurrencyCode, number> = {
  IDR: 0,
  USD: 2,
  EUR: 2,
  GBP: 2,
  JPY: 0,
  CNY: 2,
  SGD: 2,
  MYR: 2,
  AUD: 2,
  CAD: 2,
  CHF: 2,
  HKD: 2,
  NZD: 2,
  SEK: 2,
  NOK: 2,
  DKK: 2,
  INR: 2,
  KRW: 0,
  THB: 2,
  PHP: 2,
  VND: 0,
  BRL: 2,
  MXN: 2,
  ZAR: 2,
  AED: 2,
  SAR: 2,
  BHD: 3,
};

/**
 * Indicative reference rates: units of the currency per 1 USD. These are
 * deliberately static and documented as reference-only in the UI; they are
 * never used to alter stored ledger amounts.
 */
const USD_RATES: Record<CurrencyCode, number> = {
  USD: 1,
  IDR: 16_000,
  EUR: 0.8,
  GBP: 0.5,
  JPY: 150,
  CNY: 7.2,
  SGD: 1.35,
  MYR: 4.7,
  AUD: 1.5,
  CAD: 1.35,
  CHF: 0.9,
  HKD: 7.8,
  NZD: 1.65,
  SEK: 10.5,
  NOK: 10.8,
  DKK: 6.8,
  INR: 83,
  KRW: 1_350,
  THB: 36,
  PHP: 57,
  VND: 25_000,
  BRL: 5,
  MXN: 17,
  ZAR: 18,
  AED: 3.6725,
  SAR: 3.75,
  BHD: 0.377,
};

const RATE_PRECISION = 1_000_000;

function normalizeCode(value: string | null | undefined): CurrencyCode | null {
  if (!value) return null;
  const code = value.toUpperCase();
  return isCurrencyCode(code) ? code : null;
}

export function isCurrencyCode(
  value: string | null | undefined,
): value is CurrencyCode {
  return !!value && (CURRENCIES as readonly string[]).includes(value.toUpperCase());
}

export function currencyScale(currency: string): number {
  const code = normalizeCode(currency);
  return code ? CURRENCY_SCALE[code] : 2;
}

/** Normalize human input ("Rp 1.250,50", "1,250.50", "-500") to a decimal string. */
export function normalizeDecimalInput(value: string | number | bigint): string {
  let text = String(value).trim().replace(/[^\d.,-]/g, "");
  if (!text) return "0";

  const negative = text.startsWith("-");
  text = text.replace(/-/g, "");

  const lastDot = text.lastIndexOf(".");
  const lastComma = text.lastIndexOf(",");
  if (lastDot > -1 && lastComma > -1) {
    const decimalSeparator = lastDot > lastComma ? "." : ",";
    const thousandsSeparator = decimalSeparator === "." ? "," : ".";
    text = text
      .split(thousandsSeparator)
      .join("")
      .replace(decimalSeparator, ".");
  } else if (lastComma > -1) {
    text = lastComma > 0 && text.length - lastComma - 1 === 3
      ? text.split(",").join("") // "1,234" means thousands
      : text.replace(",", ".");
  } else if (lastDot > -1 && text.length - lastDot - 1 === 3) {
    text = text.split(".").join(""); // "1.234" means thousands
  }

  const parts = text.split(".");
  const integer = parts[0]?.replace(/^0+(?=\d)/, "") || "0";
  const fraction = (parts[1] ?? "").slice(0, 6);
  return `${negative && Number(integer) + Number(`0.${fraction || 0}`) > 0 ? "-" : ""}${integer}${
    fraction ? `.${fraction}` : ""
  }`;
}

/** Convert a user-entered amount into integer minor units. */
export function toMinorUnits(
  value: string | number | bigint,
  currency = "IDR",
): bigint {
  const decimal = normalizeDecimalInput(value);
  const scale = currencyScale(currency);
  const negative = decimal.startsWith("-");
  const unsigned = negative ? decimal.slice(1) : decimal;
  const [integer = "0", fraction = ""] = unsigned.split(".");
  const padded = (fraction + "0".repeat(scale)).slice(0, scale);
  // Round half away from zero on the first discarded digit.
  const discarded = fraction.slice(scale);
  let units = BigInt(integer || "0") * 10n ** BigInt(scale) + BigInt(padded || "0");
  if (discarded && Number(discarded[0]) >= 5) units += 1n;
  return negative ? -units : units;
}

/**
 * Normalize validation input without rescaling values that are already minor
 * units. BigInt is the canonical stored representation; strings and numbers
 * are human-entered major units and must use the supplied currency scale.
 */
export function parseMoneyInput(
  value: string | number | bigint,
  currency = "IDR",
): bigint {
  return typeof value === "bigint" ? value : toMinorUnits(value, currency);
}

/** Sum human-entered decimal strings with BigInt precision. */
export function sumMoneyValues(
  values: readonly (string | number | bigint | null | undefined)[],
  currency = "IDR",
): bigint {
  return sumMoney(
    values
      .filter((value): value is string | number | bigint => value !== null && value !== undefined)
      .map((value) => parseMoneyInput(value, currency)),
  );
}

/** Convert integer minor units to a plain decimal string with no separators. */
export function fromMinorUnits(value: bigint, currency = "IDR"): string {
  const scale = currencyScale(currency);
  const negative = value < 0n;
  const digits = (negative ? -value : value).toString().padStart(scale + 1, "0");
  if (scale === 0) return `${negative ? "-" : ""}${digits}`;
  const integer = digits.slice(0, -scale);
  const fraction = digits.slice(-scale);
  return `${negative ? "-" : ""}${integer}.${fraction}`;
}

export function formatMoney(
  value: bigint,
  currency = "IDR",
  locale = "id-ID",
  options: { compact?: boolean; sign?: boolean } = {},
): string {
  const scale = currencyScale(currency);
  const amount = Number(fromMinorUnits(value, currency));
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: scale,
    maximumFractionDigits: scale,
    notation: options.compact ? "compact" : "standard",
    signDisplay: options.sign ? "always" : "auto",
  });
  return formatter.format(amount);
}

/**
 * Convert minor units between currencies using fixed reference rates.
 * Display-only: the ledger amount and its account currency are never changed.
 * Rates are expressed as units per USD and rescaled by each currency's minor
 * unit scale. Unknown codes return the source amount unchanged.
 */
export function convertMinorUnits(
  amount: bigint,
  source: string,
  target: string,
): bigint {
  const from = normalizeCode(source);
  const to = normalizeCode(target);
  if (!from || !to || from === to) return amount;

  const numerator =
    (amount < 0n ? -amount : amount) *
    10n ** BigInt(currencyScale(to)) *
    BigInt(Math.round(USD_RATES[to] * RATE_PRECISION));
  const denominator =
    10n ** BigInt(currencyScale(from)) *
    BigInt(Math.round(USD_RATES[from] * RATE_PRECISION));
  const quotient = numerator / denominator;
  const remainder = numerator % denominator;
  const converted = remainder * 2n >= denominator ? quotient + 1n : quotient;
  return amount < 0n ? -converted : converted;
}

/** Convert for display, then format the result in the target currency and locale. */
export function formatConvertedMoney(
  amount: bigint,
  source: string,
  target: string,
  locale = "id-ID",
): string {
  const targetCode = normalizeCode(target) ?? normalizeCode(source) ?? "IDR";
  return formatMoney(convertMinorUnits(amount, source, target), targetCode, locale);
}

export function sumMoney(values: readonly bigint[]): bigint {
  return values.reduce((total, value) => total + value, 0n);
}

export function absMoney(value: bigint): bigint {
  return value < 0n ? -value : value;
}

/** Percentage as a number from 0 to 100 (or above 100 when over budget). */
export function percentOf(part: bigint, total: bigint): number {
  if (total === 0n) return 0;
  return (Number(part) / Number(total)) * 100;
}

export function ratioOf(part: bigint, total: bigint): number {
  if (total === 0n) return 0;
  return Number(part) / Number(total);
}
