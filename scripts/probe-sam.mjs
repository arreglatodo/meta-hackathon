// Probe SAM 3.1 on a home walkthrough video: one request per concept, in
// parallel. Reports latency, frames with detections and distinct object ids.
// Usage: pnpm probe:sam <video.mp4> [concept ...]
import fs from "node:fs";
import OpenAI from "openai";

const [video, ...rest] = process.argv.slice(2);
if (!video) {
  console.error("usage: probe-sam.mjs <video.mp4> [concept ...]");
  process.exit(1);
}
const concepts = rest.length ? rest : ["bed", "sofa", "sink", "toilet", "window", "door", "table"];

const apiKey = process.env.MODEL_API_KEY;
const client = new OpenAI({
  baseURL: process.env.META_BASE_URL ?? "https://api.meta.ai/v1",
  apiKey: apiKey ?? "injected-by-proxy",
  defaultHeaders: apiKey ? undefined : { Authorization: null },
});

const t0 = Date.now();
const file = await client.files.create({ file: fs.createReadStream(video), purpose: "user_data" });
console.log(`upload: ${file.id} in ${Date.now() - t0} ms`);

// A line looks like: <12f>0<|box;...|><|mask;...|>,3<|box;...|><|mask;...|>
function parse(text) {
  const frames = new Map(); // frame -> [{id, box}]
  for (const line of text.split("\n")) {
    const m = line.match(/^<(\d+)f>(.*)$/);
    if (!m) continue;
    const recs = [...m[2].matchAll(/(\d+)<\|box;([^|]*)\|>/g)].map((r) => ({
      id: Number(r[1]),
      box: Object.fromEntries(r[2].split(";").map((kv) => kv.split("=")).map(([k, v]) => [k, Number(v)])),
    }));
    frames.set(Number(m[1]), recs);
  }
  return frames;
}

async function probe(concept) {
  const start = Date.now();
  const res = await client.responses.create({
    model: "sam-3.1",
    input: [
      {
        type: "message",
        role: "user",
        content: [
          { type: "input_text", text: concept },
          { type: "input_video", file_id: file.id },
        ],
      },
    ],
    metadata: { mask_encoding: "one_bit", include_confidence: "true" },
  });
  const frames = parse(res.output_text ?? "");
  const ids = new Map();
  for (const [f, recs] of frames) for (const r of recs) {
    const e = ids.get(r.id) ?? { first: f, last: f, n: 0, cmax: 0 };
    e.first = Math.min(e.first, f); e.last = Math.max(e.last, f); e.n++; e.cmax = Math.max(e.cmax, r.box.c ?? 0);
    ids.set(r.id, e);
  }
  return { concept, ms: Date.now() - start, framesWithHits: frames.size, objects: Object.fromEntries(ids), status: res.status, usage: res.usage };
}

const results = await Promise.allSettled(concepts.map(probe));
for (const r of results) {
  if (r.status === "rejected") console.log("error:", r.reason?.message ?? r.reason);
  else console.log(JSON.stringify(r.value));
}
console.log(`total: ${Date.now() - t0} ms`);
