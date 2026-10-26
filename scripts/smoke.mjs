// Smoke test: confirms Meta Model API is reachable with the configured key.
// Usage: pnpm smoke
import OpenAI from "openai";

const apiKey = process.env.MODEL_API_KEY;
const client = new OpenAI({
  baseURL: process.env.META_BASE_URL ?? "https://api.meta.ai/v1",
  apiKey: apiKey ?? "injected-by-proxy",
  // Without a key, let the dev sandbox proxy inject Authorization.
  defaultHeaders: apiKey ? undefined : { Authorization: null },
});

const models = await client.models.list();
console.log("models:", models.data.map((m) => m.id).join(", "));

const res = await client.responses.create({
  model: "muse-spark-1.3",
  input: "Reply with exactly: ok",
});
console.log("muse-spark-1.3:", res.output_text);
