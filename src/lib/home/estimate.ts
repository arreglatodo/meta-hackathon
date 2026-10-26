import type { HomeProfile } from "./profile";
import type { HoursCalibration } from "./config";

export const MIN_HOURS = 3;
/** Above this, one visit is split between two cleaners. */
export const MAX_HOURS_ONE_CLEANER = 8;

export interface HoursEstimate {
  /** Hours we recommend booking per visit. */
  hours: number;
  /** Typical and upper end for this kind of home. */
  range: [number, number];
  cleaners: 1 | 2;
  /** Why, in plain Spanish, for the customer and the cleaner. */
  reasons: string[];
  calibrationVersion: string;
}

/** Visits are sold in whole hours (ArreglaTodo books 3 to 8). */
const roundHours = (x: number) => Math.round(x);

/**
 * Hours per visit = what similar homes book (calibration, by bedrooms) plus
 * the extra load the video shows. The calibration says history describes
 * bookings, not need (docs/probes/2026-10-26-hours-calibration.md), so the
 * video's load moves the estimate toward the upper end of the range.
 */
export function estimateHours(p: HomeProfile, cal: HoursCalibration): HoursEstimate {
  const key = p.bedrooms >= 4 ? "4+" : String(p.bedrooms);
  const bucket = cal.by_bedrooms.find((b) => b.bedrooms === key);
  const median = bucket?.median ?? cal.global_median;
  const p75 = Math.max(bucket?.p75 ?? median + 1, median);

  const reasons: string[] = [
    `Casas como la tuya (${p.bedrooms} dormitorio${p.bedrooms === 1 ? "" : "s"}) suelen reservar ${median} horas.`,
  ];
  let load = 0;
  const add = (hours: number, why: string) => {
    load += hours;
    reasons.push(why);
  };
  if (p.bathrooms > 1) add(0.5 * (p.bathrooms - 1), `${p.bathrooms} baños.`);
  if (p.glass === "many") add(0.5, "Muchos vidrios y ventanales.");
  if (p.clutter === "medium") add(0.5, "Algo de desorden para acomodar.");
  if (p.clutter === "high") add(1, "Bastante desorden para acomodar.");
  if (p.dirt === "heavy") add(1, "Necesita una limpieza más profunda.");
  if (p.dirt === "light") add(-0.5, "Está bastante limpia.");
  if (p.petsVisible) add(0.5, "Hay mascotas (pelos).");
  if (p.balconies > 0) add(0.25 * p.balconies, p.balconies === 1 ? "Un balcón." : `${p.balconies} balcones.`);

  const typical = Math.max(MIN_HOURS, roundHours(median + load));
  const high = Math.max(typical, roundHours(p75 + load));
  const cleaners = typical > MAX_HOURS_ONE_CLEANER ? 2 : 1;
  if (cleaners === 2) reasons.push("Es mucho para una persona: van dos.");
  if (median + load < MIN_HOURS) reasons.push(`El mínimo es de ${MIN_HOURS} horas.`);

  return { hours: typical, range: [typical, high], cleaners, reasons, calibrationVersion: cal.version };
}
