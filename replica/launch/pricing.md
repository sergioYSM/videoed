# Pricing

## The market (read 2026-11-17, through search summaries: verify on each official page before publishing)

| product | plan | price | source |
| --- | --- | --- | --- |
| The original | Pro | $19.99/mo or $179.99/yr (Oct 2026); older pages show $7.99-9.99 | https://www.bigvu.tv/blog/capcut-pricing-2026-free-vs-pro-included-alternatives |
| The original | Free | 1080p, no watermark on standard edits; auto-captions limited (reported ~1 use/month by one source) | https://fluxnote.io/guides/capcut-ai-features-free-vs-paid-2026 |
| Kapwing | Pro | $16/member/mo billed yearly, $24 monthly | https://www.kapwing.com/pricing |
| Kapwing | Business | $50/member/mo billed yearly, $64 monthly | same |
| VN, InShot | Pro | not found in this search: to check | - |

## What users said about price and billing (from `fixes.md`, secondary sources, no verbatim sample)
- H1 paywall creep: features moved from free to Pro (4+ sources; one analysis: 900 of 2,881 negative Play reviews).
- H2 billing: hard to cancel, charges after cancelling, Pro bought and watermark still shown (2 sources, small sample).

## The model

Our costs are tiny: editing, captions and export run on the user's device. So:

- **Free is the product**, not a demo: everything needed to make and publish a short video, forever, written down (fix X3).
- **Pro is for extras that cost us something or are niche**: 4K/60, backup of edit lists to the cloud, brand kit.
- **Flat price**, no seats, monthly and yearly (2 months free).
- **Bundle with Clipsong** for creators who also need licensed music.

| tier | for | monthly | yearly | what's in it | built? |
| --- | --- | --- | --- | --- | --- |
| **Gratis** | everyone | 0 € | 0 € | unlimited projects, 1080p export without watermark, **unlimited auto-captions on your device**, text, music track, .srt, phone and desktop | yes (auto-captions: verify in a real browser) |
| **Pro** | creators who publish a lot | 4 € | 40 € | everything in Gratis + 4K/60 export, cloud backup of edit lists (never the footage), brand kit (fonts/colours/logo presets) | **not built**: do not sell until it is |
| **Creador+** | creators who need music | 8 € | 80 € | Ownframe Pro + Clipsong Creador (downloads, licence receipts) | depends on both |

### The free promise (published on the site, fix X3)
> Lo que hoy es gratis en Ownframe seguirá siendo gratis. Si algún día cambiamos algo del plan gratuito, lo anunciaremos con 60 días de antelación y no afectará a los proyectos que ya tengas.

## Billing fixes, in the product (reuse Clipsong's tested Stripe code)
- Cancel in two clicks (Stripe portal), Pro stays until the period ends.
- Email 7 days before every yearly renewal.
- One charge per period (idempotent webhooks, tested in Clipsong).
- **No watermark on any plan, ever** (fix X4). A Pro-only option is simply not selectable without Pro; it never silently stamps the export.
- Refund policy in plain words: full refund within 14 days of a charge, no questions (EU withdrawal right covers digital services; check with a lawyer).

## Stripe (the user creates these, test mode first)

| product | lookup_key | amount | interval |
| --- | --- | --- | --- |
| Ownframe Pro | ownframe_pro_monthly | 4.00 EUR | month |
| Ownframe Pro | ownframe_pro_yearly | 40.00 EUR | year |
| Creador+ (Ownframe Pro + Clipsong Creador) | creador_plus_monthly | 8.00 EUR | month |
| Creador+ | creador_plus_yearly | 80.00 EUR | year |
