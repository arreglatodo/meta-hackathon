"use client";

import { useEffect, useRef, useState } from "react";
import type { Quote } from "@/lib/home/quote";
import type { VisitPrice } from "@/lib/home/pricing";
import { sampleFrames } from "@/lib/client/frames";

const FREQUENCIES = [
  { id: "once", label: "Una vez" },
  { id: "weekly", label: "Cada semana" },
  { id: "biweekly", label: "Cada 2 semanas" },
] as const;
type Frequency = (typeof FREQUENCIES)[number]["id"];

const BOOKING_WHATSAPP = process.env.NEXT_PUBLIC_BOOKING_WHATSAPP;

const money = (o: VisitPrice, n = o.total) =>
  `${o.currency === "UYU" ? "$" : o.currency + " "}${n.toLocaleString("es-UY")}`;

function optionLabel(o: VisitPrice) {
  if (o.products && o.vacuum) return "Con productos y aspiradora";
  if (o.products) return "Con productos";
  if (o.vacuum) return "Con aspiradora";
  return "Vos ponés los productos";
}

/** Renders WhatsApp-style *bold*. */
function WhatsAppText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*[^*]+\*)/g).map((part, i) =>
        part.startsWith("*") && part.endsWith("*") ? <strong key={i}>{part.slice(1, -1)}</strong> : part,
      )}
    </>
  );
}

export function QuoteFlow() {
  const [zones, setZones] = useState<string[]>([]);
  const [demo, setDemo] = useState(false);
  const [zone, setZone] = useState("");
  const [status, setStatus] = useState<"idle" | "sampling" | "thinking" | "done" | "error">("idle");
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [option, setOption] = useState(0);
  const [frequency, setFrequency] = useState<Frequency>("weekly");
  const [frames, setFrames] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/quote")
      .then((r) => r.json())
      .then((d) => {
        setZones(d.zones);
        setZone(d.zones[0] ?? "");
        setDemo(d.demo);
      })
      .catch(() => setError("No pudimos cargar las zonas."));
  }, []);

  async function onVideo(file: File | undefined) {
    if (!file) return;
    setQuote(null);
    setError("");
    try {
      setStatus("sampling");
      const sampled = await sampleFrames(file, (n, total) => setProgress(`Preparando el video… ${n}/${total}`));
      setFrames(sampled);
      setStatus("thinking");
      setProgress("Mirando tu casa…");
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zone, frames: sampled }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setQuote(data);
      setOption(0);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal.");
      setStatus("error");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const chosen = quote?.options[option];
  const freqLabel = FREQUENCIES.find((f) => f.id === frequency)!.label;
  const bookingText = chosen
    ? `Hola! Quiero reservar una limpieza con HomePlan: ${chosen.hours} horas, ${optionLabel(chosen).toLowerCase()}, ${freqLabel.toLowerCase()}, en ${chosen.zone}. Precio por visita: ${money(chosen)}.`
    : "";

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl border border-line bg-surface p-4">
        <h2 className="text-lg font-semibold">Grabá tu casa y te decimos el precio</h2>
        <p className="mt-1 text-sm text-muted">
          Un video de 30 a 60 segundos recorriendo todos los ambientes, sin apuro. Con el celular o con
          los lentes Meta Ray-Ban.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="text-sm">
            Zona{" "}
            <select
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="ml-1 rounded-lg border border-line bg-background px-2 py-1"
            >
              {zones.map((z) => (
                <option key={z}>{z}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={!zone || status === "sampling" || status === "thinking"}
            onClick={() => inputRef.current?.click()}
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {status === "done" ? "Probar con otro video" : "Grabar o elegir video"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            capture="environment"
            className="hidden"
            onChange={(e) => void onVideo(e.target.files?.[0])}
          />
        </div>
        {(status === "sampling" || status === "thinking") && <p className="mt-3 text-sm">{progress}</p>}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {demo && <p className="mt-3 text-xs text-muted">Modo demo: precios y horas de ejemplo.</p>}
      </section>

      {quote && chosen && (
        <>
          <section className="rounded-2xl border border-line bg-chat p-4">
            <p className="whitespace-pre-wrap rounded-lg bg-bubble-agent px-3 py-2 text-sm shadow-sm">
              <WhatsAppText text={quote.customerMessage} />
            </p>
          </section>

          <section className="rounded-2xl border border-line bg-surface p-4">
            <h3 className="font-semibold">Elegí tu plan</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {quote.options.map((o, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setOption(i)}
                  className={`rounded-xl border p-3 text-left text-sm ${
                    i === option ? "border-accent ring-2 ring-accent/30" : "border-line"
                  }`}
                >
                  <div className="font-medium">{optionLabel(o)}</div>
                  <div className="text-lg font-semibold">{money(o)}</div>
                  <div className="text-xs text-muted">
                    {o.hours} horas · {money(o, o.perHour)} la hora
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {FREQUENCIES.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFrequency(f.id)}
                  className={`rounded-full border px-3 py-1.5 text-sm ${
                    f.id === frequency ? "border-accent bg-accent text-white" : "border-line"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {BOOKING_WHATSAPP ? (
              <a
                href={`https://wa.me/${BOOKING_WHATSAPP}?text=${encodeURIComponent(bookingText)}`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block rounded-full bg-[#25d366] px-5 py-2.5 text-sm font-semibold text-white"
              >
                Reservar por WhatsApp
              </a>
            ) : (
              <p className="mt-4 text-sm text-muted">{bookingText}</p>
            )}
          </section>

          <details className="rounded-2xl border border-line bg-surface p-4" open>
            <summary className="cursor-pointer font-semibold">Lo que recibe el prestador</summary>
            <p className="mt-2 whitespace-pre-wrap text-sm">{quote.providerBrief}</p>
            <div className="mt-3 flex gap-1 overflow-x-auto">
              {frames.map((f, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={f} alt="" className="h-20 rounded-md" />
              ))}
            </div>
          </details>

          <details className="rounded-2xl border border-line bg-surface p-4">
            <summary className="cursor-pointer font-semibold">Cómo lo calculamos</summary>
            <ol className="mt-2 space-y-2 font-mono text-xs">
              {quote.trace.map((s, i) => (
                <li key={i} className="rounded-lg border border-line p-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">
                      {s.kind} · {s.name}
                    </span>
                    <span className="text-muted">{s.ms} ms</span>
                  </div>
                  <div className="text-muted">in: {s.input}</div>
                  <div>out: {s.output}</div>
                </li>
              ))}
            </ol>
          </details>
        </>
      )}
    </div>
  );
}
