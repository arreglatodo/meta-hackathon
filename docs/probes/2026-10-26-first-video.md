# Probe 1 — first real walkthrough video (2026-10-26)

Goal: decide how SAM 3.1 and Muse Spark split the work in the video → plan pipeline, and
whether the pipeline fits a Vercel function.

**Input.** A 62-second hands-free walkthrough of a one-bedroom apartment (office, living room
with balcony, dining area, kitchen, bedroom, bathroom), **recorded with Meta Ray-Ban Gen 3
Wayfarer glasses** and shared through WhatsApp, which delivered it at 464×624, H.264. So the
whole probe ran on the exact path a customer would use: glasses → WhatsApp → HomePlan.
Re-encoded to 5 fps (312 frames) before upload, since SAM bills per processed frame. The video
itself is not in the repo (it shows a real home and people).

## SAM 3.1 — one request per concept, run in parallel

`scripts/probe-sam.mjs`. Latency 12–15 s per concept; 7 concepts in ~20 s total including the
upload. Distinct object ids per concept vs. what is actually in the home:

| Concept | Ids returned | Real | Read |
|---|---|---|---|
| toilet | 1 | 1 | correct |
| sink | 1 | 2 | missed the bathroom's vessel sink |
| bed | 2 | 1 | one extra track |
| sofa | 4 | 1–2 | fragmented tracks |
| table | 10 | ~4 | fragmented |
| window | 13 | — | fragmented |
| door | 16 | — | hits the 16-objects-per-frame cap |

**Finding.** Ids are stable while an object stays in view, but a handheld walkthrough re-enters
the same objects and rooms, so ids fragment. **Counting distinct SAM ids does not give a room or
fixture inventory.** SAM is reliable for *where* an object is in each frame (boxes and masks)
and fast enough to run several concepts in parallel.

## Muse Spark 1.3 — the same video, asked for a structured inventory

`scripts/probe-spark-video.mjs`. 19.7 s, ~15k input tokens. Output matched the video:
office, hallway, living room, balcony, dining area, kitchen, bedroom, bathroom; counts 1
bedroom / 1 bathroom / 1 kitchen / 1 living / 1 balcony; wood and tile floors; many windows and
glass; medium clutter; special tasks such as large sliding glass doors and shower glass; and it
listed what it could not see (laundry area, inside cabinets, a dark bedroom).

## Decision

- **Muse Spark builds the inventory** (rooms, counts, conditions, uncertainties). It
  deduplicates rooms across the walkthrough, which SAM ids can't.
- **SAM 3.1 provides the visual evidence**: masks of the surfaces that drive time (glass,
  floors, kitchen counters, bathroom fixtures), shown as overlays to the customer and team, and
  the per-surface before/after comparison after each visit.
- Both run in parallel on the same uploaded file: ~20 s end to end, inside a 60 s Vercel
  function. **No Modal needed for this step.**
- WhatsApp's compression (464×624) was enough for both models; we don't need the original file
  from the glasses.
- Next probe: SAM on still before/after photos of the same surface.

## Follow-up: anonymizing the footage with SAM 3.1

To use this walkthrough in the public demo, we blurred the two people at the dining table and
dropped the audio, using SAM 3.1 itself (`scripts/sam-boxes.mjs` with the concept `person`,
then `scripts/blur-boxes.py`).

- **A full 62 s / 1,872-frame request returned `502 upstream request failed`** twice, while
  10-second chunks of 300 frames worked, even though the documented limit is 15,000 frames.
  `sam-boxes.mjs` now splits long videos into frame-exact chunks and runs them in parallel:
  7 chunks in ~32 s.
- SAM flagged people in 442 of 1,872 frames: the two people at the table (23.7–31.5 s) and a few
  short hits on clothes hanging in the bathroom. Blurring all of them is the safe default.
- Checked one frame per second by eye: nobody left uncovered.
- Cost: about $0.37 at $0.20 per 1,000 frames.
- This is a product feature, not just demo prep: HomePlan can blur people in every customer
  video before storing it.
