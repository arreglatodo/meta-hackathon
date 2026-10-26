import type { TraceStep } from "@/lib/agent/types";
import { MODELS } from "@/lib/meta";
import { hoursCalibration, pricingConfig } from "./config";
import { estimateHours, type HoursEstimate } from "./estimate";
import { priceOptions, type VisitPrice } from "./pricing";
import { extractHomeProfile, type HomeProfile } from "./profile";

export interface Quote {
  profile: HomeProfile;
  estimate: HoursEstimate;
  zone: string;
  options: VisitPrice[];
  customerMessage: string;
  providerBrief: string;
  demo: { calibration: boolean; pricing: boolean };
  trace: TraceStep[];
}

const money = (n: number, currency: string) =>
  `${currency === "UYU" ? "$" : currency + " "}${n.toLocaleString("es-UY")}`;

function optionLabel(o: VisitPrice) {
  if (o.products && o.vacuum) return "con productos y aspiradora";
  if (o.products) return "con productos";
  if (o.vacuum) return "con aspiradora";
  return "vos ponés los productos";
}

const GLASS = { few: "pocos", some: "algunos", many: "muchos" } as const;
const CLUTTER = { low: "poco", medium: "medio", high: "mucho" } as const;
const DIRT = { light: "poca", normal: "normal", heavy: "mucha" } as const;

function rooms(p: HomeProfile) {
  const parts = [
    `${p.bedrooms} dormitorio${p.bedrooms === 1 ? "" : "s"}`,
    `${p.bathrooms} baño${p.bathrooms === 1 ? "" : "s"}`,
  ];
  if (p.kitchens) parts.push("cocina");
  if (p.livingAreas) parts.push("living");
  if (p.balconies) parts.push(p.balconies === 1 ? "balcón" : `${p.balconies} balcones`);
  return parts.concat(p.otherRooms).join(", ");
}

function customerMessage(p: HomeProfile, e: HoursEstimate, options: VisitPrice[]) {
  const lines = [
    `¡Listo! Vimos tu casa: ${rooms(p)}.`,
    "",
    `Te recomendamos *${e.hours} horas* por visita${e.cleaners === 2 ? " (van dos personas)" : ""}.`,
    ...e.reasons.slice(1).map((r) => `• ${r}`),
    "",
    "Precio por visita:",
    ...options.map((o) => `• ${optionLabel(o)}: *${money(o.total, o.currency)}* (${money(o.perHour, o.currency)} la hora)`),
    "",
    "¿Cada cuánto? Una vez, cada semana o cada 2 semanas: con el plan te queda siempre la misma persona.",
  ];
  if (p.uncertain.length) lines.push("", `No llegamos a ver: ${p.uncertain.join(", ")}.`);
  return lines.join("\n");
}

function providerBrief(p: HomeProfile, e: HoursEstimate) {
  return [
    `Casa: ${rooms(p)}. Pisos: ${p.floors.join(", ") || "sin dato"}.`,
    `Vidrios: ${GLASS[p.glass]}. Desorden: ${CLUTTER[p.clutter]}. Suciedad: ${DIRT[p.dirt]}.${p.petsVisible ? " Hay mascotas." : ""}`,
    `Tiempo: ${e.hours} h${e.cleaners === 2 ? ", dos personas" : ""} (rango ${e.range[0]}–${e.range[1]} h).`,
    p.specialTasks.length ? `Ojo con: ${p.specialTasks.join("; ")}.` : "",
    p.providerBrief,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Video frames → home profile → hours → prices → messages, with a trace. */
export async function quoteFromFrames(frames: string[], zone: string): Promise<Quote> {
  const trace: TraceStep[] = [];
  const cal = hoursCalibration();
  const pricing = pricingConfig();
  const zoneName = pricing.value.zones[zone] ? zone : Object.keys(pricing.value.zones)[0];

  let t = Date.now();
  const { profile, usage } = await extractHomeProfile(frames);
  trace.push({
    kind: "model",
    name: MODELS.planner,
    input: `${frames.length} frames from the walkthrough`,
    output: `${profile.bedrooms} bed · ${profile.bathrooms} bath · glass ${profile.glass} · clutter ${profile.clutter} · dirt ${profile.dirt}` +
      (usage ? ` · ${usage.input_tokens} tokens in` : ""),
    ms: Date.now() - t,
  });

  t = Date.now();
  const estimate = estimateHours(profile, cal.value);
  trace.push({
    kind: "tool",
    name: "estimate_hours",
    input: `calibration ${cal.demo ? "DEMO" : cal.value.version}`,
    output: `${estimate.hours} h (range ${estimate.range.join("–")}), ${estimate.cleaners} cleaner(s)`,
    ms: Date.now() - t,
  });

  t = Date.now();
  const options = priceOptions(pricing.value, zoneName, estimate.hours);
  trace.push({
    kind: "tool",
    name: "price_visit",
    input: `${zoneName}, ${estimate.hours} h, pricing ${pricing.demo ? "DEMO" : "private"}`,
    output: options.map((o) => `${optionLabel(o)} ${o.total}`).join(" · "),
    ms: Date.now() - t,
  });

  return {
    profile,
    estimate,
    zone: zoneName,
    options,
    customerMessage: customerMessage(profile, estimate, options),
    providerBrief: providerBrief(profile, estimate),
    demo: { calibration: cal.demo, pricing: pricing.demo },
    trace,
  };
}

export function availableZones() {
  const pricing = pricingConfig();
  return { zones: Object.keys(pricing.value.zones), demo: pricing.demo };
}
