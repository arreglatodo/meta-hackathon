import { NextResponse } from "next/server";
import { z } from "zod";
import { checkReceipt } from "@/lib/home/receipt";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  /** Screenshot or the bank's PDF, as a data URL. */
  file: z.string().regex(/^data:(image\/(jpeg|png|webp)|application\/pdf);base64,/).max(3_000_000),
  expectedAmount: z.number().positive(),
});

/** Payment receipt (image or PDF) → amount, beneficiary and whether it covers what was due. */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  try {
    const beneficiary = process.env.HOMEPLAN_BENEFICIARY ?? "SURYEN";
    return NextResponse.json(await checkReceipt(parsed.data.file, { amount: parsed.data.expectedAmount, beneficiary }));
  } catch (err) {
    console.error("[receipt] failed", err);
    return NextResponse.json({ error: "receipt_failed" }, { status: 502 });
  }
}
