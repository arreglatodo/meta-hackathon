import { meta, MODELS } from "@/lib/meta";
import { SYSTEM_PROMPT } from "./prompt";
import type { AgentTurn, ChatMessage, TraceStep } from "./types";

const MAX_HISTORY = 20;

function clip(text: string, max = 160): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

/**
 * Runs one agent turn over the conversation so far.
 *
 * Tools (video analysis with SAM 3.1, hour estimation, plan pricing) will be
 * plugged into this loop; every model call and tool call lands in `trace`.
 */
export async function runAgentTurn(history: ChatMessage[]): Promise<AgentTurn> {
  const trace: TraceStep[] = [];
  const messages = history.slice(-MAX_HISTORY);
  const last = messages.at(-1);

  const started = Date.now();
  const response = await meta().responses.create({
    model: MODELS.planner,
    instructions: SYSTEM_PROMPT,
    input: messages.map((m) => ({ role: m.role, content: m.content })),
  });
  const reply = response.output_text.trim();

  trace.push({
    kind: "model",
    name: MODELS.planner,
    input: clip(last?.content ?? ""),
    output: clip(reply),
    ms: Date.now() - started,
  });

  return { reply, trace };
}
