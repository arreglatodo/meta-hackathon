# HomePlan

**A WhatsApp agent that turns one-off home cleaning into a recurring plan, quoted from a
60-second home video and verified after every visit with before/after photos.**

Built by [ArreglaTodo](https://arreglatodo.uy), a home-services marketplace in Uruguay, for the
Meta Global AI Developer Hackathon (Oct 26 – Nov 4, 2026), Startup track, theme
*Build for Your World*.

## The problem

Our customers book a one-time cleaning and rarely come back on a plan: only about 1 in 21
moves to a monthly plan. Quoting a plan takes a site visit or a long chat, and once a plan
starts, customers can't see what was done on each visit, so they churn.

## What HomePlan does

1. **Video → plan.** The customer sends a short walkthrough video on WhatsApp. SAM 3.1
   segments rooms, surfaces and appliances; Muse Spark builds a structured home profile and
   proposes a weekly or biweekly plan with hours and price. The customer accepts in the chat.
2. **Proof of work → retention.** After each visit, the cleaner sends before/after photos.
   SAM 3.1 matches the same surfaces, and Muse Spark writes a visit report, flags missed areas
   and spots churn risk in the conversation.

## Meta models used

| Task | Model |
|---|---|
| Agent brain: video understanding, tool use, planning | `muse-spark-1.3` (Meta Model API) |
| Room, surface and appliance segmentation; before/after matching | `sam-3.1` (Meta Model API) |
| Customer voice notes | `muse-voice-transcribe-1.0` (Meta Model API) |
| Hour estimation and message routing | Muse Spark Open (Baseten / Fireworks), Muse Glimmer fine-tune (Modal) — planned |

See [`STACK.md`](STACK.md) for the full stack and the reasons behind each choice.

## What existed before the hackathon vs. what we built during it

The hackathon rules require new work to be clearly identified. **Everything in this repository
was written during the hackathon**, starting Oct 26, 2026. [`CAMBIOS.md`](CAMBIOS.md) is a dated
log of every change, and the git history backs it.

| Existed before (not in this repo) | Built during the hackathon (this repo) |
|---|---|
| ArreglaTodo's marketplace operations, provider network and WhatsApp channel through Kapso | The HomePlan agent, its prompts and tools |
| Our internal CRM, quoting tool and pricing rules (private) | Video → home profile → plan pipeline on SAM 3.1 + Muse Spark |
| | Before/after visit verification |
| | Web chat simulator and agent trace view |

No customer data, provider data or real prices are in this repo. Demo data is synthetic.

## Run it locally

```bash
pnpm install
cp .env.example .env.local   # add your MODEL_API_KEY
pnpm smoke                   # checks Meta Model API access
pnpm dev                     # http://localhost:3000
```

Checks: `pnpm typecheck` and `pnpm lint`.

## License

MIT
