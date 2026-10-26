import { z } from "zod";
import { meta, MODELS } from "@/lib/meta";

/** What Muse Spark reads from a payment receipt (screenshot or photo). */
export const ReceiptReading = z.object({
  isPaymentReceipt: z.boolean().catch(false),
  amount: z.number().nullable().catch(null),
  currency: z.string().nullable().catch(null),
  beneficiary: z.string().nullable().catch(null),
  bank: z.string().nullable().catch(null),
  date: z.string().nullable().catch(null),
  reference: z.string().nullable().catch(null),
});
export type ReceiptReading = z.infer<typeof ReceiptReading>;

export interface ReceiptCheck {
  reading: ReceiptReading;
  ok: boolean;
  /** Why it was not accepted, in Spanish, for the customer. */
  problem: string | null;
  ms: number;
}

const PROMPT = `This file should be a bank transfer or payment receipt from Uruguay.
Return ONLY JSON: {"isPaymentReceipt": true|false, "amount": number|null, "currency": "UYU"|"USD"|null,
"beneficiary": "account holder name"|null, "bank": "bank name"|null, "date": "as written"|null, "reference": "operation number"|null}.
Amounts like "$ 3.036" or "3.036,00" are 3036. Do not guess fields you can't read.`;

/**
 * Reads the receipt and checks it against what the customer had to pay. Any
 * doubt (unreadable, other beneficiary, less money) goes to a person.
 */
export async function checkReceipt(file: string, expected: { amount: number; beneficiary: string }): Promise<ReceiptCheck> {
  const started = Date.now();
  // Customers send screenshots (images) or the bank's PDF; Muse Spark reads both.
  const media = file.startsWith("data:application/pdf")
    ? { type: "input_file" as const, filename: "comprobante.pdf", file_data: file }
    : { type: "input_image" as const, image_url: file, detail: "high" as const };
  const response = await meta().responses.create({
    model: MODELS.planner,
    input: [
      {
        role: "user",
        content: [
          { type: "input_text", text: PROMPT },
          media,
        ],
      },
    ],
  });
  const text = response.output_text;
  const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
  const reading = ReceiptReading.parse(json);
  let problem: string | null = null;
  if (!reading.isPaymentReceipt) problem = "No parece un comprobante de pago.";
  else if (reading.amount === null) problem = "No llegamos a leer el monto.";
  else if (reading.amount < expected.amount * 0.99) problem = `El monto (${reading.amount}) es menor al que había que pagar.`;
  else if (reading.beneficiary && !reading.beneficiary.toLowerCase().includes(expected.beneficiary.toLowerCase()))
    problem = `La transferencia figura a nombre de ${reading.beneficiary}.`;
  return { reading, ok: problem === null, problem, ms: Date.now() - started };
}
