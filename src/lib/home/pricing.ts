import type { PricingConfig } from "./config";

export interface VisitPrice {
  zone: string;
  hours: number;
  products: boolean;
  vacuum: boolean;
  service: number;
  fee: number;
  total: number;
  perHour: number;
  currency: string;
}

const round = (x: number) => Math.round(x);

function feeFor(service: number, brackets: PricingConfig["feeBrackets"]) {
  for (const [upper, rate] of brackets) {
    if (upper === null || service < upper) return round(service * rate);
  }
  return 0;
}

/**
 * Price of one visit: hourly rate × hours, plus products and vacuum (per hour
 * or per visit), plus the management fee by bracket. The numbers come from
 * the private pricing config; the formula is public.
 */
export function priceVisit(
  cfg: PricingConfig,
  zone: string,
  hours: number,
  products: boolean,
  vacuum: boolean,
): VisitPrice | null {
  const rate = cfg.zones[zone];
  if (!rate) return null;
  if ((products && !rate.products) || (vacuum && !rate.vacuum)) return null;
  const extra = (e?: { amount: number; per: "hour" | "visit" }) =>
    e ? e.amount * (e.per === "hour" ? hours : 1) : 0;
  const service = round(rate.hourly * hours + (products ? extra(rate.products) : 0) + (vacuum ? extra(rate.vacuum) : 0));
  const fee = feeFor(service, cfg.feeBrackets);
  const total = service + fee;
  return { zone, hours, products, vacuum, service, fee, total, perHour: round(total / hours), currency: cfg.currency };
}

/** All option combinations a zone offers, for the given hours. */
export function priceOptions(cfg: PricingConfig, zone: string, hours: number) {
  const combos: [boolean, boolean][] = [
    [false, false],
    [true, false],
    [false, true],
    [true, true],
  ];
  return combos
    .map(([p, v]) => priceVisit(cfg, zone, hours, p, v))
    .filter((x): x is VisitPrice => x !== null);
}
