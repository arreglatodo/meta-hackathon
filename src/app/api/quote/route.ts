import { NextResponse } from "next/server";
import { z } from "zod";
import { availableZones, quoteFromFrames } from "@/lib/home/quote";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  zone: z.string().max(60),
  frames: z
    .array(z.string().startsWith("data:image/jpeg;base64,").max(400_000))
    .min(3)
    .max(40),
});

export async function GET() {
  return NextResponse.json(availableZones());
}

/** Frames sampled in the browser from the walkthrough video → a quote. */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  try {
    return NextResponse.json(await quoteFromFrames(parsed.data.frames, parsed.data.zone));
  } catch (err) {
    console.error("[quote] failed", err);
    return NextResponse.json({ error: "quote_failed" }, { status: 502 });
  }
}
