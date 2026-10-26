// Probe Muse Spark 1.3 on a home walkthrough video: ask for a structured
// inventory (rooms, fixtures, surfaces) and time the call.
// Usage: pnpm probe:spark <video.mp4> | <file-id>
import fs from "node:fs";
import OpenAI from "openai";

const arg = process.argv[2];
if (!arg) {
  console.error("usage: probe-spark-video.mjs <video.mp4|file-id>");
  process.exit(1);
}
const apiKey = process.env.MODEL_API_KEY;
const client = new OpenAI({
  baseURL: process.env.META_BASE_URL ?? "https://api.meta.ai/v1",
  apiKey: apiKey ?? "injected-by-proxy",
  defaultHeaders: apiKey ? undefined : { Authorization: null },
});

const fileId = arg.startsWith("file-")
  ? arg
  : (await client.files.create({ file: fs.createReadStream(arg), purpose: "user_data" })).id;

const prompt = `You are inspecting a phone walkthrough video of a home to quote a recurring cleaning plan.
Return ONLY JSON with this shape:
{
  "rooms": [{"type": "bedroom|bathroom|kitchen|living|dining|office|hallway|balcony|laundry|other", "seconds": [start, end], "notes": "short"}],
  "counts": {"bedrooms": n, "bathrooms": n, "kitchens": n, "living_areas": n, "balconies": n},
  "floor_types": ["wood|tile|carpet|other"],
  "windows_and_glass": "few|some|many",
  "clutter": "low|medium|high",
  "pets_visible": true|false,
  "people_visible": true|false,
  "special_tasks": ["short items, e.g. large glass doors, grease on stove"],
  "uncertain": ["what you could not see well"]
}
Count each room once even if the camera passes through it twice. Do not guess rooms you did not see.`;

const start = Date.now();
const res = await client.responses.create({
  model: "muse-spark-1.3",
  input: [
    {
      role: "user",
      content: [
        { type: "input_text", text: prompt },
        { type: "input_video", file_id: fileId },
      ],
    },
  ],
});
console.log(`muse-spark-1.3: ${Date.now() - start} ms, usage ${JSON.stringify(res.usage)}`);
console.log(res.output_text);
