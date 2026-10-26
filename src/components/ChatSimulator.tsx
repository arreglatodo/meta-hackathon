"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage, TraceStep } from "@/lib/agent/types";
import { sampleFrames } from "@/lib/client/frames";
import type { ProviderOption, Quote } from "@/lib/home/quote";
import { Carousel, CAROUSEL_INTRO, VISITS_PER_MONTH } from "./Carousel";
import { FREQUENCIES, type Frequency, money, WhatsAppText } from "./quote-ui";

const GREETING: ChatMessage = {
  role: "assistant",
  content: "¡Hola! Soy HomePlan, de ArreglaTodo. ¿Querés armar un plan de limpieza para tu casa?",
};

/** What the agent reads when the customer sends a video (it can't see the video itself). */
const VIDEO_PLACEHOLDER = "[El cliente mandó un video recorriendo la casa]";

interface Bubble extends ChatMessage {
  /** What the customer sees, when it differs from what the agent reads. */
  display?: string;
  /** Thumbnail shown on the customer's video bubble. */
  thumbnail?: string;
  /** Quick-reply buttons asking how often (WhatsApp interactive buttons). */
  askFrequency?: boolean;
  /** Provider carousel for the chosen frequency. */
  carousel?: { options: ProviderOption[]; frequency: Frequency };
  /** Booking link after the customer picks a provider. */
  bookingHref?: string | null;
  /** Quick-reply buttons for the booking steps. */
  choices?: { kind: "slot" | "pay"; id: string; label: string }[];
  /** Image the customer sent (payment receipt). */
  image?: string;
  /** Document the customer sent (payment receipt as PDF). */
  document?: string;
}

type Stage = "chat" | "slot" | "slotText" | "address" | "payment" | "receipt" | "done";

interface Booking {
  provider: ProviderOption;
  number: string;
  hours: number;
  visits: number;
  service: number;
  fee: number;
  total: number;
  deposit: number;
  dates: string[];
  address: string;
}

const DAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const cap = (x: string) => x[0].toUpperCase() + x.slice(1);
const pesos = (n: number) => `${n.toLocaleString("es-UY")} pesos`;
const TRANSFER_TEXT =
  process.env.NEXT_PUBLIC_TRANSFER_TEXT ?? "Banco: (configurar)\nNombre de beneficiario: (configurar)\nNúmero de cuenta: (configurar)";

/** Next `visits` dates on `weekday` at `hour`, starting at least 2 days from now. */
function visitDates(weekday: number, hour: number, visits: number, everyDays: number) {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  while (d.getDay() !== weekday) d.setDate(d.getDate() + 1);
  return Array.from({ length: visits }, (_, i) => {
    const x = new Date(d);
    x.setDate(d.getDate() + i * everyDays);
    const dd = String(x.getDate()).padStart(2, "0");
    const mm = String(x.getMonth() + 1).padStart(2, "0");
    return `${cap(DAYS[weekday])} ${dd}/${mm} a las ${String(hour).padStart(2, "0")}:00hs`;
  });
}

/** "el viernes a las 10" → weekday and hour, Monday to Friday 9–19. */
function parseSlot(text: string): { weekday: number; hour: number } | null {
  const t = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const weekday = ["lunes", "martes", "miercoles", "jueves", "viernes"].findIndex((d) => t.includes(d)) + 1;
  const h = t.match(/(\d{1,2})(?:[:.]\d{2})?\s*(?:hs|h|horas)?/);
  const hour = h ? Number(h[1]) : NaN;
  if (weekday < 1 || !(hour >= 9 && hour <= 18)) return null;
  return { weekday, hour };
}

const COSTA = /costa|lagomar|solymar|el pinar|shangri|san jos[eé] de carrasco|lomas de solymar/i;

/** Zone from what the customer said so far; Montevideo unless they named the coast. */
function guessZone(bubbles: Bubble[], zones: string[]) {
  const said = bubbles.filter((b) => b.role === "user").map((b) => b.content).join(" ");
  const costa = zones.find((z) => z === "Ciudad de la Costa");
  return costa && COSTA.test(said) ? costa : zones[0];
}

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** `phone`: full-screen chat only (for recordings and phones), without the trace panel. */
export function ChatSimulator({ phone = false }: { phone?: boolean }) {
  const [messages, setMessages] = useState<Bubble[]>([GREETING]);
  const [trace, setTrace] = useState<TraceStep[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [zones, setZones] = useState<string[]>([]);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [frequency, setFrequency] = useState<Frequency>("weekly");
  const [stage, setStage] = useState<Stage>("chat");
  const [booking, setBooking] = useState<Booking | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/quote")
      .then((r) => r.json())
      .then((d) => setZones(d.zones))
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  /** The agent sees plain text: the greeting is UI-only. */
  const history = (bubbles: Bubble[]): ChatMessage[] =>
    bubbles.slice(1).map(({ role, content }) => ({ role, content: content.slice(0, 4000) }));

  async function send() {
    const text = draft.trim();
    if (!text || busy) return;
    if (stage === "slotText") return void chooseSlotText(text);
    if (stage === "address") return void giveAddress(text);
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setDraft("");
    setBusy("escribiendo…");
    setError(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history(next) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setMessages([...next, { role: "assistant", content: data.reply }]);
      setTrace((t) => [...t, ...data.trace]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  async function sendVideo(file: File | undefined) {
    if (!file || busy) return;
    setError(null);
    try {
      setBusy("preparando el video…");
      const frames = await sampleFrames(file, (n, total) => setBusy(`preparando el video… ${n}/${total}`));
      const next: Bubble[] = [...messages, { role: "user", content: VIDEO_PLACEHOLDER, thumbnail: frames[0] }];
      setMessages(next);
      setBusy("mirando tu casa…");
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zone: guessZone(next, zones), frames }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      const q = data as Quote;
      setQuote(q);
      setMessages([...next, { role: "assistant", content: q.summaryMessage, askFrequency: true }]);
      setTrace((t) => [...t, ...q.trace]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  /** The customer taps how often: ArreglaTodo's carousel with real providers follows. */
  async function chooseFrequency(f: Frequency) {
    if (!quote || busy) return;
    setFrequency(f);
    const label = FREQUENCIES.find((x) => x.id === f)!.label;
    const next: Bubble[] = [...messages.map((m) => ({ ...m, askFrequency: false })), { role: "user", content: label }];
    setMessages(next);
    setBusy("buscando quién puede ir…");
    await pause(900);
    const visits = VISITS_PER_MONTH[f];
    const options = quote.providerOptions;
    const forAgent =
      CAROUSEL_INTRO +
      "\n" +
      options
        .map((o) => {
          const plan = f === "once" ? null : o.plans[f];
          return `${o.name}: ${money(o.prices[0])} por visita${plan ? `, plan mensual (${visits} visitas) ${money(o.prices[0], plan.total)}` : ""}`;
        })
        .join("\n");
    setMessages([...next, { role: "assistant", content: forAgent, display: CAROUSEL_INTRO, carousel: { options, frequency: f } }]);
    setTrace((t) => [
      ...t,
      { kind: "tool", name: "send_carousel", input: `${label}, ${options.length} providers`, output: options.map((o) => o.name).join(" · "), ms: 0 },
    ]);
    setBusy(null);
  }

  const say = (next: Bubble[], bubble: Bubble) => setMessages([...next, bubble]);
  const dropChoices = (bs: Bubble[]) => bs.map((m) => ({ ...m, choices: undefined, askFrequency: false }));
  const step = (name: string, input: string, output: string) =>
    setTrace((t) => [...t, { kind: "tool", name, input, output, ms: 0 }]);

  /** Customer picks a provider: plan price (fee on the whole plan) and the day/time question. */
  async function chooseProvider(o: ProviderOption) {
    if (busy) return;
    const visits = VISITS_PER_MONTH[frequency];
    const plan = frequency === "once" ? null : o.plans[frequency];
    const one = o.prices[0];
    const service = plan?.service ?? one.service;
    const fee = plan?.fee ?? one.fee;
    const total = plan?.total ?? one.total;
    setBooking({
      provider: o,
      number: `HP-${String(Date.now()).slice(-5)}`,
      hours: one.hours,
      visits,
      service,
      fee,
      total,
      deposit: Math.round(total / 2),
      dates: [],
      address: "",
    });
    const next: Bubble[] = [...messages, { role: "user", content: `Elijo a ${o.name}` }];
    setMessages(next);
    setBusy("escribiendo…");
    await pause(800);
    const what = frequency === "once" ? `una limpieza de ${one.hours} horas` : `${visits} limpiezas de ${one.hours} horas por mes`;
    say(next, {
      role: "assistant",
      content:
        `¡Genial! 🧡 Elegiste a *${o.name}*: ${what}.\n\n` +
        "¿Qué día y horario te queda mejor? Vamos de lunes a viernes, de 9 a 19.",
      choices: [
        { kind: "slot", id: "4-10", label: "Jueves a las 10:00" },
        { kind: "slot", id: "5-10", label: "Viernes a las 10:00" },
        { kind: "slot", id: "other", label: "Otro día u horario" },
      ],
    });
    step("plan_price", `${o.name}, ${what}`, `servicio ${service} · gestión ${fee} · total ${total}`);
    setStage("slot");
    setBusy(null);
  }

  /** Day and hour → dates for the whole plan → provider confirms → address. */
  async function confirmSlot(next: Bubble[], weekday: number, hour: number) {
    if (!booking) return;
    const everyDays = frequency === "biweekly" ? 14 : 7;
    const dates = visitDates(weekday, hour, booking.visits, everyDays);
    setBooking({ ...booking, dates });
    setBusy(`confirmando con ${booking.provider.name}…`);
    await pause(1400);
    step("confirm_provider", `${booking.provider.name} · ${dates.join(" · ")}`, "confirmed (simulated in the prototype)");
    say(next, {
      role: "assistant",
      content:
        `✅ *${booking.provider.name}* confirmó la disponibilidad:\n${dates.map((d) => `• ${d}`).join("\n")}\n\n` +
        "📍 ¿Cuál es tu dirección exacta (incluir número de puerta, número de apartamento y esquina)?",
    });
    setStage("address");
    setBusy(null);
  }

  async function chooseSlot(id: string, label: string) {
    const next: Bubble[] = [...dropChoices(messages), { role: "user", content: label }];
    setMessages(next);
    if (id === "other") {
      setBusy("escribiendo…");
      await pause(600);
      say(next, { role: "assistant", content: "Dale, decime qué día y a qué hora (por ejemplo: martes a las 14)." });
      setStage("slotText");
      setBusy(null);
      return;
    }
    const [weekday, hour] = id.split("-").map(Number);
    await confirmSlot(next, weekday, hour);
  }

  async function chooseSlotText(text: string) {
    setDraft("");
    const next: Bubble[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    const slot = parseSlot(text);
    if (!slot) {
      say(next, { role: "assistant", content: "No me quedó claro 🙈 Decime un día de lunes a viernes y una hora entre 9 y 18." });
      return;
    }
    await confirmSlot(next, slot.weekday, slot.hour);
  }

  async function giveAddress(text: string) {
    if (!booking) return;
    setDraft("");
    setBooking({ ...booking, address: text });
    const next: Bubble[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setBusy("escribiendo…");
    await pause(700);
    say(next, {
      role: "assistant",
      content:
        "*Formas de pago:*\n- 🏦 Transferencia bancaria\n- 🅰️ Giro en Abitab o RedPagos\n" +
        "- Ⓜ️ MercadoPago hasta en 12 cuotas sin interés (con esta opción hay que agregarle un 9,3% adicional por la comisión de ellos)",
      choices: [
        { kind: "pay", id: "transfer", label: "🏦 Transferencia" },
        { kind: "pay", id: "abitab", label: "🅰️ Abitab o RedPagos" },
        { kind: "pay", id: "mp", label: "Ⓜ️ MercadoPago" },
      ],
    });
    setStage("payment");
    setBusy(null);
  }

  async function choosePayment(id: string, label: string) {
    if (!booking) return;
    const next: Bubble[] = [...dropChoices(messages), { role: "user", content: label.replace(/^\S+\s/, "") }];
    setMessages(next);
    setBusy("escribiendo…");
    await pause(800);
    const b = booking;
    const howToPay =
      id === "mp"
        ? `Ⓜ️ Te pasamos el link de MercadoPago por el 50%: *${pesos(Math.round(b.deposit * 1.093))}* (con el 9,3% de MercadoPago).`
        : `🏦 *Datos para la transferencia (Online o RedPagos):*\n${TRANSFER_TEXT}`;
    const pay: Bubble = {
      role: "assistant",
      content:
        "😊 Para confirmar, es necesario realizar el pago. *¡No te preocupes!* El dinero queda protegido hasta que se complete el servicio 🔐\n\n" +
        `${howToPay}\n\n` +
        `Serían *${pesos(b.total)}*. Podés abonar el 50% ahora (*${pesos(b.deposit)}*) y el 50% al finalizar el servicio.\n\n` +
        "🧾 Mandanos el comprobante por acá, con el 📎, para *confirmar* el servicio.\n\n" +
        "Al coordinar, aceptás nuestros términos y condiciones: www.arreglatodo.uy/terminos",
    };
    const pause2: Bubble = {
      role: "assistant",
      content:
        `⏳ Coordinación en pausa: Enviar comprobante para confirmar el servicio *N° ${b.number}*.\n` +
        `👱‍♂️ Trabajador: ${b.provider.name}\n📍 Dirección: ${b.address}\n` +
        `⏰ Fechas:\n${b.dates.map((d) => `• ${d}`).join("\n")}\n` +
        "📌 Tenés tiempo hasta las 20.00 hrs para enviarlo.",
    };
    setMessages([...next, pay]);
    await pause(900);
    setMessages([...next, pay, pause2]);
    step("payment_request", `${label}, 50% of ${b.total}`, `deposit ${b.deposit}, hold until receipt`);
    setStage("receipt");
    setBusy(null);
  }

  /** The customer sends the receipt: Muse Spark reads it, then the purchase detail. */
  async function sendReceipt(file: File) {
    if (!booking) return;
    const data = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(new Error("No pudimos abrir el archivo."));
      r.readAsDataURL(file);
    });
    const isPdf = data.startsWith("data:application/pdf");
    const next: Bubble[] = [
      ...messages,
      {
        role: "user",
        content: "[El cliente mandó el comprobante de pago]",
        ...(isPdf ? { document: file.name } : { image: data }),
      },
    ];
    setMessages(next);
    setBusy("revisando el comprobante…");
    try {
      const res = await fetch("/api/receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: data, expectedAmount: booking.deposit }),
      });
      const check = await res.json();
      if (!res.ok) throw new Error(check.error ?? `HTTP ${res.status}`);
      setTrace((t) => [
        ...t,
        {
          kind: "model",
          name: "muse-spark-1.3",
          input: `payment receipt (${isPdf ? "PDF" : "image"})`,
          output: `${check.reading.amount} ${check.reading.currency ?? ""} to ${check.reading.beneficiary ?? "?"} · ${check.ok ? "OK" : check.problem}`,
          ms: check.ms,
        },
      ]);
      if (!check.ok) {
        say(next, { role: "assistant", content: `Mmm, ${check.problem} Lo reviso con el equipo y te confirmo enseguida 🙏` });
        return;
      }
      const b = booking;
      const paid = Math.round(check.reading.amount);
      const ok: Bubble = { role: "assistant", content: `✅ ¡Recibimos tu comprobante! ${pesos(paid)}. Gracias 😊` };
      setMessages([...next, ok]);
      await pause(1100);
      const partial = paid < b.total;
      const detail =
        `🧡 *Detalle de tu compra${partial ? " - Pago Parcial" : ""}*:\n*N° Solicitud: ${b.number}*\n` +
        `👨 *Trabajador*: ${b.provider.name}\n📍Dirección: ${b.address}\n` +
        `🗓️ *Fechas de Servicios:*\n${b.dates.join("\n")}\n\n` +
        `💳 *Resumen de pago:*\nPrecio del servicio: ${pesos(b.service)}.\nGestión ArreglaTodo: ${pesos(b.fee)}.\n` +
        `💰 *Precio Total:* ${pesos(b.total)}.\n` +
        (partial ? `💵 *Monto abonado:* ${pesos(paid)}.\n` : "") +
        "\n¡Cuándo se encuentre en 🛣️ camino, te estaremos avisando!";
      setMessages([...next, ok, { role: "assistant", content: detail }]);
      step("purchase_detail", `${b.number} · ${b.dates.length} visits`, `total ${b.total} · paid ${paid}`);
      setStage("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function onFile(file: File | undefined) {
    if (!file) return;
    if (stage === "receipt") void sendReceipt(file);
    else void sendVideo(file);
  }

  return (
    <div className={phone ? "flex h-dvh flex-col" : "grid flex-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,420px)]"}>
      <section
        className={`flex flex-col overflow-hidden bg-chat ${phone ? "h-dvh" : "h-[70dvh] rounded-2xl border border-line"}`}
      >
        <div className="flex items-center gap-3 bg-[#075e54] px-4 py-3 text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-bold">AT</span>
          <span className="leading-tight">
            <span className="block text-sm font-medium">ArreglaTodo · HomePlan</span>
            <span className="block text-xs opacity-80">en línea</span>
          </span>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex flex-col items-end" : "flex flex-col items-start"}>
              <div
                className={`max-w-[80%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm shadow-sm ${
                  m.role === "user" ? "bg-bubble-user" : "bg-bubble-agent"
                }`}
              >
                {m.document ? (
                  <span className="flex items-center gap-2 text-[#1a73e8] underline">📄 {m.document}</span>
                ) : m.image ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.image} alt="" className="mb-1 max-h-64 rounded-md" />
                    <span className="text-xs text-muted">🧾 Comprobante</span>
                  </>
                ) : m.thumbnail ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.thumbnail} alt="" className="mb-1 max-h-48 rounded-md" />
                    <span className="text-xs text-muted">🎥 Video de la casa</span>
                  </>
                ) : (
                  <WhatsAppText text={m.display ?? m.content} />
                )}
                {m.askFrequency && (
                  <div className="-mx-3 -mb-2 mt-2 border-t border-line">
                    {FREQUENCIES.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => void chooseFrequency(f.id)}
                        className="block w-full border-b border-line py-2 text-center text-sm font-medium text-[#128c7e] last:border-b-0"
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                )}
                {m.choices && (
                  <div className="-mx-3 -mb-2 mt-2 border-t border-line">
                    {m.choices.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => void (c.kind === "slot" ? chooseSlot(c.id, c.label) : choosePayment(c.id, c.label))}
                        className="block w-full border-b border-line py-2 text-center text-sm font-medium text-[#128c7e] last:border-b-0"
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                )}
                {m.bookingHref && (
                  <a
                    href={m.bookingHref}
                    target="_blank"
                    rel="noreferrer"
                    className="-mx-3 -mb-2 mt-2 block border-t border-line py-2 text-center text-sm font-medium text-[#128c7e]"
                  >
                    Coordinar día y pago
                  </a>
                )}
              </div>
              {m.carousel && (
                <div className="mt-2 w-full">
                  <Carousel options={m.carousel.options} frequency={m.carousel.frequency} onChoose={(o) => void chooseProvider(o)} />
                </div>
              )}
            </div>
          ))}
          {busy && <p className="text-xs text-muted">{busy}</p>}
          {error && <p className="text-xs text-red-600">No se pudo responder ({error}).</p>}
          <div ref={bottomRef} />
        </div>
        <form
          className="flex gap-2 border-t border-line bg-surface p-3"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <button
            type="button"
            title="Mandar un video de la casa"
            aria-label="Mandar un video de la casa"
            disabled={!!busy}
            onClick={() => fileRef.current?.click()}
            className="rounded-full border border-line px-3 text-lg disabled:opacity-50"
          >
            📎
          </button>
          <input
            ref={fileRef}
            type="file"
            accept={stage === "receipt" ? "image/*,application/pdf" : "video/*"}
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Escribí un mensaje"
            className="min-w-0 flex-1 rounded-full border border-line bg-background px-4 py-2 text-sm outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={!!busy || !draft.trim()}
            className="rounded-full bg-[#128c7e] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Enviar
          </button>
        </form>
      </section>

      <aside
        className={phone ? "hidden" : "flex h-[70dvh] flex-col overflow-hidden rounded-2xl border border-line bg-surface"}
      >
        <div className="border-b border-line px-4 py-3 text-sm font-medium">Agent trace</div>
        <ol className="flex-1 space-y-3 overflow-y-auto p-4 font-mono text-xs">
          {trace.length === 0 && <li className="text-muted">No steps yet. Send a message.</li>}
          {trace.map((s, i) => (
            <li key={i} className="rounded-lg border border-line p-3">
              <div className="mb-1 flex justify-between">
                <span className="font-semibold">
                  {s.kind === "tool" ? "tool" : "model"} · {s.name}
                </span>
                <span className="text-muted">{s.ms} ms</span>
              </div>
              <div className="text-muted">in: {s.input}</div>
              <div>out: {s.output}</div>
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}
