# Stack

Chosen to ship in nine days with what the team already runs in production.

| Layer | Choice | Why |
|---|---|---|
| App | Next.js 15 (App Router) + TypeScript + Tailwind v4, on Vercel | Same stack as ArreglaTodo's CRM. Judges need a live product; Vercel gives a public URL per branch. |
| Channel | WhatsApp Cloud API via Kapso, on a dedicated test number | Our existing WhatsApp provider. A test number keeps real customers out of the demo. |
| Web simulator | A WhatsApp-style chat page in this app | Judges can try the agent in seconds without a Uruguayan phone number, and the demo doesn't depend on a live WhatsApp round-trip. |
| Data | A new Supabase project (Postgres + Storage for videos/photos), separate from production | The repo is public; nothing here may touch real data. |
| Meta Model API client | OpenAI SDK pointed at `https://api.meta.ai/v1` | Model API is drop-in compatible; one client for every model. |
| Agent | Our own tool-calling loop, no framework | Every model and tool call is recorded in a trace we can show and audit. |
| Heavy video work | Modal functions, only if a step exceeds Vercel's function time limit | First thing measured with a real 60-second video. |

## Models

| Task | Model | Notes |
|---|---|---|
| Agent brain | `muse-spark-1.3` | Recommended for new work; accepts video. |
| Segmentation | `sam-3.1` | Boxes and masks on images or video. |
| Voice notes | `muse-voice-transcribe-1.0` | Muse Spark 1.3 audio support is not complete yet. |
| Hour estimation, routing | Muse Spark Open on Baseten (`meta-models/muse-spark-open-1026`), Fireworks as fast path/failover | Open-weights path. |
| Specialized estimator | Muse Glimmer fine-tuned on anonymized historical quotes, served on Modal Endpoints | Planned for days 4–5. |
| Plan card image | `muse-image-1.0` | Optional. |

Left out: Muse Wonder (preview, not needed) and self-hosting Muse Glimmer on our own hardware.

## Business rules stay in code

Hours and prices never come from the model's common sense. The model extracts facts (rooms,
surfaces, pets, frequency); code applies the rules (e.g. 3-hour minimum per visit) and the
estimator produces hours.
