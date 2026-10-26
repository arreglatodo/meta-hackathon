# Demo video script (3:00)

Living document: it changes as the product is built. Each block says what's on screen, the
voice-over (VO), and whether the feature exists yet. Voice: Máximo, in English, recorded clean.

**Rules from the organizers that shape the video**
- Show only what was built during the event. No ArreglaTodo CRM, no internal tools.
- Judges score from it: Impact 30%, Use of Meta AI 25%, Technical depth 20%, Demo 25%.
- It must hold up live: every shot is a real run, not a mock-up.

**Principle.** AI is not the pitch: every project in this hackathon uses AI. The pitch is the
loop nobody closes today: **the video that quotes the plan becomes the baseline every visit is
checked against.** That is what makes a one-off cleaning become a recurring plan.

**Budget.** ~150 words per minute, and the demo needs silence to breathe: VO stays around
330 words in total.

---

## 0:00–0:07 · Hook

**Screen.** First-person video from Meta Ray-Ban glasses walking into an apartment, fast cuts.
At 0:04, cut to a phone: a WhatsApp message arrives — *"Weekly plan: 4 hours, Tuesdays.
Accept?"* — and a thumb taps **Accept**.

**VO.**
> "I walked through my apartment wearing my glasses. One minute later, I had a weekly cleaning
> plan. On WhatsApp."

**Status.** Glasses footage: recorded (probe 1). WhatsApp plan message: to build.

## 0:07–0:25 · The problem

**Screen.** Founder on camera, or simple text cards over the glasses footage.

**VO.**
> "I run ArreglaTodo, a home-services marketplace in Uruguay. Our customers love one cleaning,
> and almost never sign up for more. Only one in twenty moves to a monthly plan. Why? Quoting a
> plan means visiting the home. And after each visit, the customer can't see what was actually
> done. Home cleaning runs on trust, and trust doesn't scale."

**Status.** Ready.

## 0:25–1:15 · From a walkthrough to a plan

**Screen.** Live WhatsApp chat (test number). Customer sends the walkthrough video. The video
plays with SAM 3.1 masks over glass, floors, counters and bathroom fixtures; people
automatically blurred. The agent replies with the inventory, the plan with an hour range, and
the price. Customer sends a voice note ("I have two dogs") and the plan adjusts. Accept.

**VO.**
> "So we built HomePlan. You send one video. Muse Spark watches the whole walkthrough and builds
> an inventory of the home: every room counted once, the floors, the glass, the clutter. SAM 3.1
> marks the surfaces that take time, and blurs anyone in the shot before we store it. The hours
> don't come from the model's imagination: they come from more than a thousand real jobs. You
> answer by voice, the plan adjusts, and you accept. No visit. No app."

**Status.** Inventory and SAM probes done; blur done as a script. In the chat flow: to build.
Voice notes (Muse Voice Transcribe): to build.

## 1:15–2:00 · Every visit, verified

**Screen.** The cleaner arrives, wearing the glasses. Before/after of the same bathroom, side by
side, SAM masks matching the same surfaces. One surface is flagged: *"Shower glass: not done."*
The customer receives the visit report on WhatsApp; the cleaner fixes it before leaving.

**VO.**
> "Here's the part nobody else closes. The video that quoted your plan becomes the baseline.
> On every visit, the cleaner records hands-free with the glasses. HomePlan matches each surface
> against the baseline and sends you a report: what was cleaned, and what wasn't. This one
> missed the shower glass. Fixed before leaving. That proof is what turns one cleaning into a
> plan you keep."

**Status.** To build. Needs real before/after footage from a cleaner (coming).

## 2:00–2:35 · Under the hood

**Screen.** The agent trace view, step by step: Muse Spark inventory, SAM 3.1 tracks, Voice
Transcribe, estimator with its range, Muse Spark Open on partner inference. A short card: "Code
public, ArreglaTodo's data private."

**VO.**
> "Under the hood, it's an agent, not a chatbot. Muse Spark plans, SAM 3.1 sees, Muse Voice
> Transcribe listens, and Muse Spark Open handles the high-volume steps. And we were honest
> with our data: ArreglaTodo's history showed us what customers book, not what homes need.
> That's exactly the gap the video fills. The code is open; our customers' data never leaves
> our database."

**Status.** Trace view exists (basic). Open-weights path: to build.

## 2:35–2:55 · Impact

**Screen.** Map: Uruguay highlighted, then Latin America, Brazil, India, Southeast Asia. Icons:
cleaning, gardening, pool, maintenance.

**VO.**
> "We're validating in Uruguay, but nothing here is local. Billions of people run their lives on
> WhatsApp, and every recurring home service has the same trust problem."

**Status.** Ready.

## 2:55–3:00 · Close

**Screen.** HomePlan logo, the WhatsApp number, the repo URL.

**VO.**
> "HomePlan. Show us your home once. We'll prove every visit."

---

## Recording the voice

- Quiet room with soft surfaces (a bedroom with curtains beats a kitchen). No AC or fan.
- Phone or mic at a hand's width from the mouth, slightly to the side to avoid pops.
- Record each block separately, three takes each; we keep the best one.
- Slow down: a pause after each sentence is easier to edit than a rushed take.
- We record the final VO only once the product shots are locked, so timing matches.

## Shot list (to collect during the build)

- [x] Glasses walkthrough of a home (probe 1; people blurred, audio removed).
- [ ] Glasses walkthrough without people, for the hook.
- [ ] Cleaner wearing the glasses: before and after of the same bathroom, kitchen and glass.
- [ ] Screen recording of the WhatsApp flow on the test number.
- [ ] Screen recording of the trace view.
