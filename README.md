# HomePlan

**A WhatsApp agent that turns one-off home cleaning into a recurring plan, quoted from a
60-second home video and verified after every visit with before/after photos.**

Built by [ArreglaTodo](https://arreglatodo.uy), a home-services marketplace in Uruguay, for the
Meta Global AI Developer Hackathon (Oct 26 – Nov 4, 2026), Startup track, theme
*Build for Your World*.

## The problem

Home services run on trust and site visits. To quote a recurring plan, someone has to see the
home; once the plan starts, the customer can't see what was done on each visit, so they churn.
At ArreglaTodo only about 1 in 21 customers who book a one-off cleaning moves to a monthly plan.

## Who it's for

Anyone with a smartphone and WhatsApp: the customer records the walkthrough, the cleaner sends
the photos. **Meta Ray-Ban glasses make both hands-free**: a point-of-view walkthrough for the
customer, and proof of work for the cleaner, whose hands are busy cleaning. Glasses videos reach
HomePlan the same way as phone videos, shared to WhatsApp. Our first test walkthrough was
recorded on Meta Ray-Ban Gen 3 Wayfarer glasses and quoted from the WhatsApp copy
([probe 1](docs/probes/2026-10-26-first-video.md)).

We validate in Uruguay, where ArreglaTodo operates, but nothing in HomePlan is local: any
WhatsApp-first market (Latin America, Brazil, India, Southeast Asia) and any recurring home
service (cleaning, gardening, pool, maintenance) fits the same loop.

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

See [`STACK.md`](STACK.md) for the full stack and the reasons behind each choice, and
[`docs/probes/`](docs/probes/) for the experiments behind each design decision.

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
