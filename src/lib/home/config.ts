/**
 * Private configuration, loaded server-side from environment variables.
 *
 * - HOMEPLAN_HOURS_CALIBRATION: the hours calibration computed inside
 *   ArreglaTodo's database (calibration/hours.sql). Private: see
 *   docs/DATA-POLICY.md.
 * - HOMEPLAN_PRICING: rates per zone and the management fee brackets. Private.
 * - HOMEPLAN_PROVIDERS: the cleaning providers offered in the carousel, with
 *   their own rates per zone. Private.
 *
 * Without them, HomePlan runs on the DEMO values below, which are synthetic
 * and labeled as such in every quote.
 */

export interface HoursBucket {
  bedrooms: string; // "0" | "1" | "2" | "3" | "4+"
  median: number;
  p75: number;
  n: number;
}

export interface HoursCalibration {
  version: string;
  by_bedrooms: HoursBucket[];
  global_median: number;
}

export interface ZoneRate {
  hourly: number;
  products?: { amount: number; per: "hour" | "visit" };
  vacuum?: { amount: number; per: "hour" | "visit" };
}

export interface PricingConfig {
  currency: string;
  zones: Record<string, ZoneRate>;
  /** [upper bound (exclusive) or null for the rest, rate] */
  feeBrackets: [number | null, number][];
}

export interface Provider {
  name: string;
  company?: string | null;
  rating?: number;
  reviews?: number;
  jobs?: number;
  profileUrl?: string;
  photoUrl?: string;
  /** Optional gift for a given frequency, shown on the card. */
  gift?: { frequency: "once" | "weekly" | "biweekly"; text: string };
  rates: Record<string, ZoneRate>;
}

const DEMO_PROVIDERS: Provider[] = [
  { name: "Ana (demo)", reviews: 32, jobs: 210, rates: { Demo: { hourly: 14 } } },
  { name: "Brillo SAS (demo)", reviews: 18, jobs: 95, rates: { Demo: { hourly: 16, products: { amount: 2, per: "hour" } } } },
  { name: "Lucía (demo)", reviews: 51, jobs: 640, rates: { Demo: { hourly: 18, vacuum: { amount: 10, per: "visit" } } } },
];

const DEMO_CALIBRATION: HoursCalibration = {
  version: "demo",
  by_bedrooms: [
    { bedrooms: "0", median: 3, p75: 3.5, n: 0 },
    { bedrooms: "1", median: 3, p75: 4, n: 0 },
    { bedrooms: "2", median: 4, p75: 4.5, n: 0 },
    { bedrooms: "3", median: 4, p75: 5, n: 0 },
    { bedrooms: "4+", median: 5, p75: 6, n: 0 },
  ],
  global_median: 4,
};

const DEMO_PRICING: PricingConfig = {
  currency: "USD",
  zones: {
    Demo: { hourly: 15, products: { amount: 2, per: "hour" }, vacuum: { amount: 10, per: "visit" } },
  },
  feeBrackets: [[null, 0.15]],
};

function readJson<T>(name: string): T | null {
  const raw = process.env[name];
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    console.error(`[config] ${name} is not valid JSON; using demo values`);
    return null;
  }
}

export function hoursCalibration(): { value: HoursCalibration; demo: boolean } {
  const v = readJson<HoursCalibration>("HOMEPLAN_HOURS_CALIBRATION");
  return v ? { value: v, demo: false } : { value: DEMO_CALIBRATION, demo: true };
}

export function pricingConfig(): { value: PricingConfig; demo: boolean } {
  const v = readJson<PricingConfig>("HOMEPLAN_PRICING");
  return v ? { value: v, demo: false } : { value: DEMO_PRICING, demo: true };
}

export function providers(): { value: Provider[]; demo: boolean } {
  const v = readJson<Provider[]>("HOMEPLAN_PROVIDERS");
  return v ? { value: v, demo: false } : { value: DEMO_PROVIDERS, demo: true };
}
