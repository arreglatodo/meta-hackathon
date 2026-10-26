# Data policy

HomePlan is a **spin-off of ArreglaTodo** (SURYEN SA), a home-services marketplace in Uruguay,
built for the Meta Global AI Developer Hackathon. The code is public, as the rules require.
**ArreglaTodo's customer and provider data is not, and never will be, in this repository.**

## What is public and what is not

| Public (this repo) | Private (never in this repo) |
|---|---|
| All HomePlan code: agent, prompts, video pipeline, estimator code, training scripts | ArreglaTodo's historical requests, quotes, jobs and chats |
| The estimator's *shape*: which features it uses and how it combines them | The estimator's *calibration*: the numbers learned from ArreglaTodo's history |
| A synthetic demo calibration, so anyone can clone and run HomePlan | Prices, commission rules and provider rates |
| Aggregate evaluation results (number of examples, error in hours) | Any row-level data, even anonymized |
| Synthetic or anonymized demo media (people blurred, audio removed) | Raw customer videos and photos |

This is the same split as an open-source model with private weights: you can read exactly how
HomePlan decides, but the knowledge that comes from ArreglaTodo's operation stays with
ArreglaTodo.

**We do not encrypt private data inside the repo.** An encrypted file in a public repository is
public forever once its key leaks, and it stays in the git history. Private data lives outside
the repo, behind access control.

## How the hours estimator uses ArreglaTodo's history

The model never invents hours or prices. Hours come from an estimator calibrated on real jobs:

1. **Extraction (offline, run by the team).** A script reads ArreglaTodo's cleaning requests and
   quotes with read-only access and keeps only non-identifying features: number of bedrooms,
   bathrooms and other rooms, frequency, extras, and the hours actually quoted. Names, phones,
   addresses, free text and prices are dropped before anything is written. Text is redacted
   before any model sees it.
2. **Storage.** The resulting feature table lives in HomePlan's private database (Supabase,
   row-level security on, no public access). It is never exported to the repo.
3. **Calibration.** The estimator is fitted on that table. Its parameters are stored privately and
   loaded server-side at runtime; they never reach the browser or the repo.
4. **Demo mode.** Without access to the private calibration, HomePlan runs on the synthetic one
   in this repo, clearly labeled as such.

At the time of writing, more than a thousand of ArreglaTodo's cleaning jobs describe both the
home and the hours.

## Rights

ArreglaTodo authorizes HomePlan to use its operational history, under the rules above, to build
and evaluate the estimator during and after the hackathon. Customer media used in the demo is
used with consent, with people blurred and audio removed.

## For contributors (and coding agents)

- Never commit rows, exports, dumps or screenshots of ArreglaTodo's data, even "anonymized".
- Never commit the private calibration or anything derived row by row from private data.
- New private data goes to HomePlan's private database, never to `public/`, `docs/` or tests.
- If in doubt, it's private.
