# Fixes and angle (PROVISIONAL)

## Sample size: 0 verbatim reviews

Trustpilot, Reddit and the App Store review feed are blocked from this
environment, so no review was read and copied word for word. `reviews.csv`
is empty and `reviews.py` was not run. Everything below comes from
**secondary sources** (articles, review aggregators, complaint sites) found
by web search, 2026-11-17. Their counts are theirs and unverified. No quote
below is presented as a user's words unless the source quoted it.

Before betting money: collect 100+ real reviews by hand (Google Play 1-3 stars,
App Store, Trustpilot, r/CapCut, r/VideoEditing) into `reviews.csv` and rerun.

Secondary sources:
- Unstar, "CapCut Locked It Behind Pro: 900 Reviews (2026)": https://unstar.app/blog/capcut-everything-is-pro-now-cant-export-reviews-2026
- VEED, CapCut review 2026: https://www.veed.io/learn/capcut-review
- CostBench, CapCut reviews: https://costbench.com/software/video-editing/capcut/reviews/
- Trustpilot (UK), CapCut: https://uk.trustpilot.com/review/capcut.com
- Şikayetvar, paywall complaints: https://www.sikayetvar.com/en/capcut-us/capcut-locked-everything-behind-pronow-we-cant-use-basic-features
- Şikayetvar, pricing: https://www.sikayetvar.com/en/capcut-us/capcuts-high-pricing-leaves-long-time-users-frustrated
- eesel, CapCut alternatives 2026: https://www.eesel.ai/blog/capcut-alternatives
- unanswered.io, people leaving CapCut: https://unanswered.io/guide/are-people-leaving-capcut-why-users-switching
- Digital Camera World, terms of service: https://www.digitalcameraworld.com/tech/social-media/capcuts-new-terms-of-service-are-angering-the-internet-and-so-confusing-that-video-editors-are-asking-chatgpt-to-decipher-them
- 2B Advice, GDPR angle: https://2b-advice.com/en/2025/07/04/capcut-trouble-over-new-terms-of-service-legal-risks-lurk-here/
- CapCut's own answer: https://capcut.com/resource/about-capcut-terms-of-service

## 1. What they hate

| # | problem | evidence (secondary) | strength |
| --- | --- | --- | --- |
| H1 | Features that were free moved to Pro ("paywall creep"): effects, dynamic captions, cloud storage, 4K | Unstar: 900 of 2,881 negative Google Play reviews in 56 days name Pro/paywall; VEED; Şikayetvar (2024-25); Trustpilot | strong: 4+ sources |
| H2 | Billing: hard to cancel, charges after cancelling, paid Pro and still saw watermarks | CostBench themes; Trustpilot reviewers (per aggregators) | medium: 2 sources, small Trustpilot sample (24 reviews per CostBench) |
| H3 | Terms of service: broad, perpetual licence over users' content and likeness | Digital Camera World, TechRadar, 2B Advice, eesel (Reddit reactions second-hand); CapCut says the clause is not new | strong in press; user volume unknown |
| H4 | Lag, crashes and failed exports with long or overlay-heavy videos | eesel, unanswered.io | medium, second-hand |
| H5 | Dependence on its servers/platform: projects stuck during outages and the US ban period | unanswered.io (one Reddit quote reported second-hand) | thin |

## 2. What is missing (asked for by name)
Not measurable without verbatim reviews. Implied by H1: free auto-captions without a monthly limit, 4K export, a way to know what will stay free.

## 3. What is unsolved (positioning)
- **Creators who do not want to grant a platform rights over their footage** (brands, journalists, therapists, teachers, anyone filming clients or minors): an editor where the footage physically never leaves the device.
- **Creators burned by paywall creep**: a written promise that free features stay free.
- **People in places or times where the service is unavailable** (bans, outages, poor connection): an editor that works from the browser's own storage.

## 4. Fix plan

| # | fix | size | skill | evidence | status |
| --- | --- | --- | --- | --- | --- |
| X1 | **Footage never leaves the device**, shown in the UI (already true) + a plain-language terms page with **no licence over user content** | S | launch (+ lawyer) | H3 | product done; page to write |
| X2 | **Unlimited auto-captions on the device** (no per-month cap: it costs us nothing to run) | M | build/test | H1 (captions), H3 | written; never run end to end here: verify in a real browser |
| X3 | **"Free stays free" promise**: a public list of free features; anything free today stays free; changes announced 60 days ahead | S | launch | H1 | to write |
| X4 | **No watermark, ever**, on any plan, including with Pro elements (Pro elements simply show as locked before export) | S | build | H1, H2 | true today (no watermark code exists) |
| X5 | **Cancel in two clicks**, renewal email 7 days before, refunds policy in plain words | S | backend/launch | H2 | Clipsong billing code reusable |
| X6 | **Project file export/import** (`.videoed`: edit list + media in one file) so a project is never stuck in one browser or service | M | build | H5, H4 | new |
| X7 | **Works offline after the first visit** (PWA cache; editing and export need no network) | M | build | H5 | new |
| X8 | **Export resilience**: on failure, explain and offer 720p automatically; autosave survives a crash | S | build/test | H4 | partial (autosave done; auto-fallback not) |

Added to `features.csv` with `original = no`.

## 5. Angle

```
A. For creators who don't want to hand an app the rights to their footage,
   videoed edits on your own device: your videos are never uploaded and we
   ask for no licence over them.
   Evidence: H3 (terms backlash, strong press coverage) + the product's architecture.

B. For creators tired of free features turning paid overnight,
   videoed puts its free list in writing: unlimited captions and
   watermark-free 1080p, free for good.
   Evidence: H1 (paywall creep, 4+ sources incl. an analysis of 900 reviews).

C. For creators who lost projects to outages or bans,
   videoed keeps everything in your browser and works offline.
   Evidence: H5 (thin).
```

**Recommended: A, with B as the second line.** A is something the original
cannot copy without rebuilding its business (server-side AI and storage), and
it is already true in the code. B answers the most frequent complaint and is
cheap because captions run on the user's device. C is thin and folds into A.

Do not use the original's name in the app name, ads or store listing.
