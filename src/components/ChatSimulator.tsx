"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage, TraceStep } from "@/lib/agent/types";

const GREETING: ChatMessage = {
  role: "assistant",
  content: "¡Hola! Soy HomePlan, de ArreglaTodo. ¿Querés armar un plan de limpieza para tu casa?",
};

export function ChatSimulator() {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [trace, setTrace] = useState<TraceStep[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function send() {
    const text = draft.trim();
    if (!text || sending) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setDraft("");
    setSending(true);
    setError(null);
    try {
      // The greeting is UI-only; the agent sees the conversation from the user's first message.
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(1) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setMessages([...next, { role: "assistant", content: data.reply }]);
      setTrace((t) => [...t, ...data.trace]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid flex-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
      <section className="flex h-[70dvh] flex-col overflow-hidden rounded-2xl border border-line bg-chat">
        <div className="bg-[#075e54] px-4 py-3 text-sm font-medium text-white">ArreglaTodo · HomePlan</div>
        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <p
                className={`max-w-[80%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm shadow-sm ${
                  m.role === "user" ? "bg-bubble-user" : "bg-bubble-agent"
                }`}
              >
                {m.content}
              </p>
            </div>
          ))}
          {sending && <p className="text-xs text-muted">escribiendo…</p>}
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
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Escribí un mensaje"
            className="flex-1 rounded-full border border-line bg-background px-4 py-2 text-sm outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="rounded-full bg-[#128c7e] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Enviar
          </button>
        </form>
      </section>

      <aside className="flex h-[70dvh] flex-col overflow-hidden rounded-2xl border border-line bg-surface">
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
