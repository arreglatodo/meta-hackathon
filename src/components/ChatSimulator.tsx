"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage, TraceStep } from "@/lib/agent/types";
import { sampleFrames } from "@/lib/client/frames";
import type { ProviderOption, Quote } from "@/lib/home/quote";
import { Carousel, CAROUSEL_INTRO, VISITS_PER_MONTH } from "./Carousel";
import { bookingHref, FREQUENCIES, type Frequency, money, WhatsAppText } from "./quote-ui";

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
}

const COSTA = /costa|lagomar|solymar|el pinar|shangril|lomas de solymar|parque del plata/i;

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
        .map((o) => `${o.name}: ${money(o.prices[0])} por visita${f === "once" ? "" : `, plan mensual ${money(o.prices[0], o.prices[0].total * visits)}`}`)
        .join("\n");
    setMessages([...next, { role: "assistant", content: forAgent, display: CAROUSEL_INTRO, carousel: { options, frequency: f } }]);
    setTrace((t) => [
      ...t,
      { kind: "tool", name: "send_carousel", input: `${label}, ${options.length} providers`, output: options.map((o) => o.name).join(" · "), ms: 0 },
    ]);
    setBusy(null);
  }

  async function chooseProvider(o: ProviderOption) {
    if (busy) return;
    const base = o.prices[0];
    const label = FREQUENCIES.find((x) => x.id === frequency)!.label.toLowerCase();
    const next: Bubble[] = [...messages, { role: "user", content: `Elijo a ${o.name}` }];
    setMessages(next);
    setBusy("escribiendo…");
    await pause(800);
    const text =
      `¡Buenísimo! 🧡 Reservamos con *${o.name}*: ${base.hours} horas, ${label}, ${money(base)} por visita.\n\n` +
      "Ahora coordinamos el día y la hora, y te pasamos el link de pago. Tocá abajo para seguir.";
    setMessages([...next, { role: "assistant", content: text, bookingHref: bookingHref(base, frequency, o.name) }]);
    setBusy(null);
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
                {m.thumbnail ? (
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
            accept="video/*"
            className="hidden"
            onChange={(e) => void sendVideo(e.target.files?.[0])}
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
