import { z } from "zod";
import { meta, MODELS } from "@/lib/meta";

/**
 * What HomePlan needs to know about a home to quote a cleaning. Muse Spark
 * fills it from the walkthrough; every field falls back to a safe value so a
 * partial answer still produces a quote (and says what it couldn't see).
 */
export const HomeProfile = z.object({
  bedrooms: z.number().int().min(0).max(12).catch(1),
  bathrooms: z.number().int().min(0).max(8).catch(1),
  kitchens: z.number().int().min(0).max(3).catch(1),
  livingAreas: z.number().int().min(0).max(5).catch(1),
  balconies: z.number().int().min(0).max(5).catch(0),
  otherRooms: z.array(z.string()).catch([]),
  floors: z.array(z.string()).catch([]),
  glass: z.enum(["few", "some", "many"]).catch("some"),
  clutter: z.enum(["low", "medium", "high"]).catch("medium"),
  dirt: z.enum(["light", "normal", "heavy"]).catch("normal"),
  petsVisible: z.boolean().catch(false),
  specialTasks: z.array(z.string()).catch([]),
  uncertain: z.array(z.string()).catch([]),
  providerBrief: z.string().catch(""),
});
export type HomeProfile = z.infer<typeof HomeProfile>;

const PROMPT = `You are inspecting frames sampled in order from a walkthrough video of a home, to quote a cleaning.
Count each room ONCE even if it appears in several frames. Do not guess rooms you did not see.
Judge clutter (objects out of place, crowded surfaces) and dirt (dust, grease, stains, dishes) separately.
Return ONLY JSON:
{
  "bedrooms": n, "bathrooms": n, "kitchens": n, "livingAreas": n, "balconies": n,
  "otherRooms": ["in Spanish, e.g. 'escritorio', 'lavadero'"],
  "floors": ["in Spanish, e.g. 'madera', 'cerámica', 'alfombra'"],
  "glass": "few|some|many",
  "clutter": "low|medium|high",
  "dirt": "light|normal|heavy",
  "petsVisible": true|false,
  "specialTasks": ["short Spanish phrases, e.g. 'ventanal corredizo grande', 'vajilla acumulada'"],
  "uncertain": ["short Spanish phrases: what you could not see well"],
  "providerBrief": "3-4 short sentences in Rioplatense Spanish for the cleaner: what they will find, what takes time, what to bring"
}`;

function firstJsonObject(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("no JSON object in model output");
  return JSON.parse(text.slice(start, end + 1));
}

/** Builds the home profile from frames (data URLs, in walkthrough order). */
export async function extractHomeProfile(frames: string[]) {
  const response = await meta().responses.create({
    model: MODELS.planner,
    input: [
      {
        role: "user",
        content: [
          { type: "input_text", text: PROMPT },
          ...frames.map((url) => ({ type: "input_image" as const, image_url: url, detail: "auto" as const })),
        ],
      },
    ],
  });
  return {
    profile: HomeProfile.parse(firstJsonObject(response.output_text)),
    usage: response.usage,
  };
}
