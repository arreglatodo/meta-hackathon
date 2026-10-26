import { NextResponse } from "next/server";
import { z } from "zod";
import { runAgentTurn } from "@/lib/agent/run";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(100),
});

/** Web chat simulator endpoint: same agent the WhatsApp webhook will use. */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  if (parsed.data.messages.at(-1)?.role !== "user") {
    return NextResponse.json({ error: "last_message_must_be_user" }, { status: 400 });
  }

  try {
    const turn = await runAgentTurn(parsed.data.messages);
    return NextResponse.json(turn);
  } catch (err) {
    console.error("[chat] agent turn failed", err);
    return NextResponse.json({ error: "agent_failed" }, { status: 502 });
  }
}
