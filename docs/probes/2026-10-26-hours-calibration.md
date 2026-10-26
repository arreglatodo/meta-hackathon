# Probe 2 — calibrating hours on ArreglaTodo's history (2026-10-26)

Goal: check whether ArreglaTodo's past cleaning jobs can tell HomePlan how many hours a home
needs, without any job-level data leaving ArreglaTodo's database.

**Method.** [`calibration/hours.sql`](../../calibration/hours.sql), run read-only inside
ArreglaTodo's database. More than a thousand cleaning jobs state both the home's size and the
hours. The query groups them by home profile (bedrooms × bathrooms × products), keeps only
groups of at least 20 jobs, falls back to bedrooms only and then to the overall median, and
scores the result on one in five jobs held out from fitting. Only aggregates came out; the
calibration itself is stored privately (see [data policy](../DATA-POLICY.md)).

## Result: the history describes what customers book, not what homes need

- **The calibration barely beats always guessing the most common booking.** Average error is
  about one hour, only ~5% better than predicting the most common value for everyone, which
  is 4 hours.
- **Medians are flat**: most profiles land on 4 hours, from one bedroom to four or more. What
  grows with the home is the upper end of the range, not the typical booking.
- **Products and vacuum don't change the hours**, only the price and what the cleaner brings.
- Bathrooms are missing from most descriptions, so the most detailed profiles are thin.

Our reading: customers choose a block of hours (3 or 4, often the minimum) before anyone sees
the home. So past bookings anchor on habit and budget, and the text rarely describes the home
well enough. **This is exactly the gap HomePlan fills**: the video shows what the text never
said (bathrooms, glass, clutter, size).

## What changes

1. HomePlan quotes a **range** (typical and upper end for the profile), not a single number,
   and moves toward the upper end when the video shows extra load (many windows and glass,
   high clutter, more bathrooms than usual).
2. The target should be **hours that worked**, not hours booked: jobs where the customer came
   back or renewed without complaints. That needs the rebooking history, also aggregated inside
   ArreglaTodo's database. Next calibration.
3. Every plan HomePlan quotes from a video adds the missing signal: home profile from the video
   → hours booked → whether the customer stayed. That is the data the history doesn't have.
