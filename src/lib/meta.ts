import OpenAI from "openai";

/**
 * Single client for every model on Meta Model API (Muse Spark, SAM 3.1,
 * Muse Image). The API is drop-in compatible with the OpenAI SDK.
 *
 * MODEL_API_KEY is required in production (Vercel). In our cloud dev
 * sandbox an outbound proxy injects the key, but only when the request has
 * no Authorization header, so without a key we strip the SDK's own header.
 */
export const META_BASE_URL = process.env.META_BASE_URL ?? "https://api.meta.ai/v1";

export const MODELS = {
  planner: "muse-spark-1.3",
  segmenter: "sam-3.1",
  transcriber: "muse-voice-transcribe-1.0",
  image: "muse-image-1.0",
} as const;

let client: OpenAI | null = null;

export function meta(): OpenAI {
  if (!client) {
    const apiKey = process.env.MODEL_API_KEY;
    client = new OpenAI({
      baseURL: META_BASE_URL,
      apiKey: apiKey ?? "injected-by-proxy",
      defaultHeaders: apiKey ? undefined : { Authorization: null },
    });
  }
  return client;
}
