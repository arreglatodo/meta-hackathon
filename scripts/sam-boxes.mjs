// Runs SAM 3.1 on a video for one concept and writes the boxes per frame as
// JSON: { concept, frames: { "<frame>": [{ id, x1, y1, x2, y2, w, h, c }] } }.
//
// Long videos are split into chunks processed in parallel: a 62 s / 1,872
// frame request returned 502 while 300-frame chunks worked (2026-10-26), even
// though the documented limit is 15,000 frames. Object ids restart per chunk.
//
// Usage: pnpm sam:boxes <video.mp4> <concept> <out.json>
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import OpenAI from "openai";

const CHUNK_FRAMES = 300;

const [video, concept, out] = process.argv.slice(2);
if (!video || !concept || !out) {
  console.error("usage: sam-boxes.mjs <video.mp4> <concept> <out.json>");
  process.exit(1);
}
const apiKey = process.env.MODEL_API_KEY;
const client = new OpenAI({
  baseURL: process.env.META_BASE_URL ?? "https://api.meta.ai/v1",
  apiKey: apiKey ?? "injected-by-proxy",
  defaultHeaders: apiKey ? undefined : { Authorization: null },
});

const total = Number(
  execFileSync("ffprobe", ["-v", "error", "-count_frames", "-select_streams", "v:0",
    "-show_entries", "stream=nb_read_frames", "-of", "csv=p=0", video]).toString().trim(),
);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sam-"));

async function runChunk(start) {
  const end = Math.min(start + CHUNK_FRAMES, total) - 1;
  const chunk = path.join(tmp, `chunk-${start}.mp4`);
  // Frame-exact cut: select by frame number and reset timestamps.
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", video, "-an",
    "-vf", `select=between(n\\,${start}\\,${end}),setpts=N/FRAME_RATE/TB`,
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "veryfast", "-crf", "26", chunk]);
  const file = await client.files.create({ file: fs.createReadStream(chunk), purpose: "user_data" });
  const res = await client.responses.create({
    model: "sam-3.1",
    input: [{ type: "message", role: "user", content: [
      { type: "input_text", text: concept },
      { type: "input_video", file_id: file.id },
    ] }],
    metadata: { mask_encoding: "one_bit", include_confidence: "true" },
  });
  const frames = {};
  for (const line of (res.output_text ?? "").split("\n")) {
    const m = line.match(/^<(\d+)f>(.*)$/);
    if (!m) continue;
    frames[start + Number(m[1])] = [...m[2].matchAll(/(\d+)<\|box;([^|]*)\|>/g)].map((r) => ({
      id: Number(r[1]),
      ...Object.fromEntries(r[2].split(";").map((kv) => kv.split("=")).map(([k, v]) => [k, Number(v)])),
    }));
  }
  return frames;
}

const t0 = Date.now();
const starts = Array.from({ length: Math.ceil(total / CHUNK_FRAMES) }, (_, i) => i * CHUNK_FRAMES);
const frames = Object.assign({}, ...(await Promise.all(starts.map(runChunk))));
fs.rmSync(tmp, { recursive: true, force: true });
fs.writeFileSync(out, JSON.stringify({ concept, frames }));
console.log(
  `${concept}: ${Object.keys(frames).length}/${total} frames with hits, ` +
    `${starts.length} chunks, ${Date.now() - t0} ms`,
);
