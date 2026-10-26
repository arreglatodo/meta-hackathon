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
| | The providers offered in the carousel (names, rates, reviews, jobs), loaded server-side from private configuration |
| Aggregate evaluation results (number of examples, error in hours) | Any row-level data, even anonymized |
| Synthetic or anonymized demo media (people blurred, audio removed) | Raw customer videos and photos |

This is the same split as an open-source model with private weights: you can read exactly how
HomePlan decides, but the knowledge that comes from ArreglaTodo's operation stays with
ArreglaTodo.

**We do not encrypt private data inside the repo.** An encrypted file in a public repository is
public forever once its key leaks, and it stays in the git history. Private data lives outside
the repo, behind access control.

## How the hours estimator uses ArreglaTodo's history

The model never invents hours or prices. Hours come from an estimator calibrated on more than a
thousand real ArreglaTodo cleaning jobs, and **the raw data never leaves ArreglaTodo's
database**:

1. **Extraction and aggregation happen inside ArreglaTodo's database.**
   [`calibration/hours.sql`](../calibration/hours.sql) runs read-only there. It reads only
   qualitative features from each job (bedrooms, bathrooms, rooms, hours, with or without
   products, with or without vacuum) and returns **one JSON of aggregates**: median and range of
   hours per home profile, counting only groups of at least 20 jobs, plus a held-out evaluation.
   No row, free text, id, name, phone, address or price comes out.
2. **No customer text goes to any model for calibration.** The rules in the SQL are enough.
   If we ever use Muse Spark to read job descriptions, it will only receive text with names,
   addresses, phones and any other customer data removed, and it will only return qualitative
   features.
3. **Private storage.** The calibration is stored in HomePlan's private database (a schema not
   exposed by its API, row-level security on). It is loaded server-side at runtime and never
   reaches the browser or the repo.
4. **Demo mode.** Without access to the private calibration, HomePlan runs on a synthetic one in
   this repo, clearly labeled as such.

## How HomePlan uses this without exposing anything

HomePlan, the product, only ever sees the **aggregate calibration**: "homes with this profile
book between X and Y hours", learned from groups of 20 or more jobs. Nobody outside ArreglaTodo
sees anything else:

| Who | What they see |
|---|---|
| A customer on WhatsApp | Their own plan: the hours and price for *their* home, with the reasons. Never other people's jobs. |
| A judge or developer cloning the repo | All the code, including the SQL that computes the calibration, and a synthetic calibration to run it. |
| HomePlan's server | The private aggregate calibration, loaded at runtime. |
| ArreglaTodo's database | The only place where job-level data exists. |

Because each number in the calibration summarizes at least 20 jobs, it cannot be traced back to
a single customer. The same design lets any other home-services company plug in its own
history: run the same SQL against its own database and HomePlan works with its calibration,
without either company seeing the other's data.

## Rights

ArreglaTodo authorizes HomePlan to use its operational history, under the rules above, to build
and evaluate the estimator during and after the hackathon. Customer media used in the demo is
used with consent, with people blurred and audio removed.

## For contributors (and coding agents)

- Never commit rows, exports, dumps or screenshots of ArreglaTodo's data, even "anonymized".
- Never commit the private calibration or anything derived row by row from private data.
- New private data goes to HomePlan's private database, never to `public/`, `docs/` or tests.
- If in doubt, it's private.
