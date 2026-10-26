import type { VisitPrice } from "@/lib/home/pricing";

export const BOOKING_WHATSAPP = process.env.NEXT_PUBLIC_BOOKING_WHATSAPP;

export const FREQUENCIES = [
  { id: "once", label: "Una vez" },
  { id: "weekly", label: "Cada semana" },
  { id: "biweekly", label: "Cada 2 semanas" },
] as const;
export type Frequency = (typeof FREQUENCIES)[number]["id"];

export const money = (o: VisitPrice, n = o.total) =>
  `${o.currency === "UYU" ? "$" : o.currency + " "}${n.toLocaleString("es-UY")}`;

export function optionLabel(o: VisitPrice) {
  if (o.products && o.vacuum) return "Con productos y aspiradora";
  if (o.products) return "Con productos";
  if (o.vacuum) return "Con aspiradora";
  return "Vos ponés los productos";
}

/** The message the booking WhatsApp receives, so the team books as usual. */
export function bookingText(o: VisitPrice, frequency: Frequency, provider?: string) {
  const freq = FREQUENCIES.find((f) => f.id === frequency)!.label.toLowerCase();
  const who = provider ? ` con ${provider}` : "";
  return `Hola! Quiero reservar una limpieza${who} con HomePlan: ${o.hours} horas, ${optionLabel(o).toLowerCase()}, ${freq}, en ${o.zone}. Precio por visita: ${money(o)}.`;
}

export function bookingHref(o: VisitPrice, frequency: Frequency, provider?: string) {
  return BOOKING_WHATSAPP
    ? `https://wa.me/${BOOKING_WHATSAPP}?text=${encodeURIComponent(bookingText(o, frequency, provider))}`
    : null;
}

/** Renders WhatsApp-style *bold*. */
export function WhatsAppText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*[^*]+\*)/g).map((part, i) =>
        part.startsWith("*") && part.endsWith("*") ? <strong key={i}>{part.slice(1, -1)}</strong> : part,
      )}
    </>
  );
}
