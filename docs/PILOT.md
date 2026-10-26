# Pilot: validating HomePlan with ArreglaTodo's customers

HomePlan's claim: **a 60-second video replaces the back-and-forth and the site visit**. The
customer gets a price in seconds; the cleaner knows what they'll find before arriving, so a home
booked for 4 hours doesn't turn out to need 8. This plan tests that claim with real customers.

## What we measure

| Question | Metric | How we get it |
|---|---|---|
| Is it faster? | Time from first message to price | Timestamp of the video vs. the quote |
| Is the price right? | Quoted hours vs. hours the cleaner says were needed | One question to the cleaner after the visit: "¿alcanzó el tiempo? ¿cuánto hacía falta?" |
| Does the cleaner avoid surprises? | Share of visits where the home didn't match the video | Same post-visit question |
| Do customers book? | Share of quotes that become a booking | Booking message from the quote page |
| Does it create recurrence? | Share of bookings that pick weekly or every two weeks | The frequency chosen on the quote; baseline is about 1 in 20 today |

## Steps

1. **Internal (this week).** The team quotes 5–10 homes of people they know, and compares with
   what customer support would have quoted by chat.
2. **Recurring customers.** Customer support asks customers who already know the service for a
   video before their next visit. They are the best judges of whether the quote is right.
3. **New cleaning leads.** Customer support answers new cleaning requests with the HomePlan link
   ("mandanos un video y te pasamos el precio al toque"). Booking continues on ArreglaTodo's
   usual WhatsApp, with the quote prefilled.
4. **After each visit**, the cleaner answers the one question above. That answer is the
   label the hours estimator was missing: hours that worked, not hours booked.

## What's not built yet

- Storing each quote and the cleaner's answer (needs HomePlan's database keys on the server).
- Receiving the video directly on WhatsApp (Kapso webhook) instead of the web page.
- Sending the brief and the video to the cleaner automatically.
