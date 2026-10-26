# CLAUDE.md

Guide for Claude Code (or any coding agent) working in this repository.

## What this is

HomePlan, ArreglaTodo's project for the Meta Global AI Developer Hackathon (Oct 26 – Nov 4,
2026, Startup track). A WhatsApp agent that quotes recurring cleaning plans from a home video
(SAM 3.1 + Muse Spark) and verifies each visit with before/after photos. Stack and reasons in
`STACK.md`; pitch and "before vs. during the hackathon" table in `README.md`.

## Hackathon rules that shape the code

- **The repo is public.** No customer or provider data, no real prices or commission rules, no
  keys. Demo data is synthetic.
- **HomePlan is a spin-off of ArreglaTodo; its data stays private.** Read `docs/DATA-POLICY.md`
  before touching anything that reads ArreglaTodo's databases. Code is public, data and the
  estimator's calibration are private and live in HomePlan's private Supabase (RLS on). Never
  commit rows, exports or anything derived row by row, even anonymized, and never "solve" it by
  committing an encrypted file. Text from ArreglaTodo goes to a model only after redaction.
- **Only work done during the hackathon counts, and it must be identifiable.** Never copy code
  from ArreglaTodo's private repos (CRM, quoting tool) into this one; rewrite what's needed.
- Work before the kickoff (Oct 26, 12:00 PM ET) ends at commit `360f698` and is declared as
  existing work in the README. Never change commit dates or re-commit old work as new.
- Submission: 3-minute demo video, public repo (must open logged out), live product, by Nov 4,
  9:00 PM ET.
- **The demo video drives the build.** `docs/DEMO-SCRIPT.md` is the script, block by block, with
  what exists and what doesn't. When a feature lands, update its block's status and the shot
  list. AI is not the pitch; the loop is: the video that quotes the plan is the baseline every
  visit is checked against. Avoid the organizers' anti-projects (simple image analyzers,
  dashboards as the main feature): keep the agent and WhatsApp at the center.

## Change log — mandatory

**Every commit that changes the project gets an entry in `CAMBIOS.md`, and every PR must
include its entries.** It is the audit document for the team and the evidence of what was
built during the hackathon.

- Newest entry on top, heading `## YYYY-MM-DD HH:MM · Short title`, Montevideo time
  (`TZ=America/Montevideo date '+%Y-%m-%d %H:%M'`).
- Inside: commit hash(es), what changed and why in plain Spanish (before → now), key files, and
  what's pending (env vars, migrations, manual steps).
- Workflow: commit the change, then add the entry with that commit's short hash in a follow-up
  commit before pushing (amending would change the hash).
- `CAMBIOS.md` is written in Spanish; code, comments and README are in English for the judges.

## Commands

```bash
pnpm dev         # next dev on :3000 (NODE_USE_ENV_PROXY=1 for the cloud sandbox proxy)
pnpm typecheck   # tsc --noEmit
pnpm lint        # eslint
pnpm smoke       # checks Meta Model API access and a Muse Spark call
```

There is no test suite yet. Before every push: `pnpm typecheck` and `pnpm lint` must pass.

## Meta Model API

- One client in `src/lib/meta.ts` (OpenAI SDK, base URL `https://api.meta.ai/v1`). Model IDs
  live in `MODELS` there; don't hardcode them elsewhere.
- `MODEL_API_KEY` is required on Vercel and locally. In the Claude Code cloud sandbox the
  proxy injects the key only when the request has no `Authorization` header, which is why the
  client strips the header when the variable is unset. Node's built-in fetch ignores
  `HTTPS_PROXY` unless `NODE_USE_ENV_PROXY=1` (already in the `dev` and `smoke` scripts).

## Agent

- `src/lib/agent/run.ts` runs one turn; every model and tool call goes into the `trace`
  (`TraceStep`), which the UI shows and we keep for audits. New tools must record their steps.
- Customer-facing text is Spanish (Uruguayan voseo). The model never makes up hours or prices:
  facts come from the model, rules and numbers from code.
