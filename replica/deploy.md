# Deploy checklist: Ownframe

Date: 2026-11-17  Commit: see git log  Go from user: **not yet**

## Verdict
**Public launch: blocked.** A **private beta preview** (not indexed, not
announced) can go up now so the user can test on real phones; it needs no
secrets because the app has no server-side data.

## Preflight (all must pass for a public launch)

| check | result |
| --- | --- |
| e2e suite | 11/11 passed (desktop + Pixel 7; exports verified with ffprobe, pixels, audio) |
| unit tests | 15/15 |
| open S1/S2 bugs | none known (no bug list kept for this app yet: run /replica-test) |
| parity: all must-haves | **FAIL**: 15/16. Auto-captions written but never run end to end (model host blocked in the build environment) |
| feature score | 64.5 (shippable needs 80) |
| rebrand sweep | clean (exit 0) |
| store listing | 0 errors, 0 warnings |
| production build | passes |
| privacy policy and terms | **FAIL**: not written. Must say: no licence over user content, media never uploaded, local storage, processors (host, analytics), model download from Hugging Face |
| account deletion | n/a (no accounts) |
| cookie banner | n/a: no cookies; localStorage only for an essential flag; analytics must be cookieless |
| favicon, titles, OG image | own; OG image URL was pointing to localhost: **fixed** (now from `NEXT_PUBLIC_SITE_URL`) |
| trademark/domain for "Ownframe" | **to run** (brand.md) |
| dependencies | 1 high (postcss inside Next 15, build-time only): upgrade to Next 16 before launch |
| real devices | **not tested**: iPhone Safari, mid-range Android |

## Production services
None needed for the beta: no database, no auth, no payments, no email.
Later (Pro): reuse Clipsong's Supabase + Stripe setup (`/replica-backend`).

## Host (user does this, ~5 minutes)
1. https://vercel.com → sign in with GitHub → **Add New → Project** → import `sergioYSM/videoed` → Deploy (defaults are right: Next.js, `npm run build`).
2. Project → Settings → Environment Variables: `NEXT_PUBLIC_SITE_URL` = the Vercel URL (later the real domain). Leave `NEXT_PUBLIC_ALLOW_INDEXING` unset (beta stays out of search engines). Redeploy.
3. Every push to `main` deploys; pull requests get preview URLs.

## Domain (after the trademark checks, user buys it)
| record | name | value |
| --- | --- | --- |
| A | @ | the apex IP Vercel shows in Settings → Domains |
| CNAME | www | `cname.vercel-dns.com` |
| TXT | as Vercel asks | verification value |
Canonical: apex (`ownframe.xx`), www redirects to it. HTTPS automatic.
No email sending yet, so no SPF/DKIM/DMARC needed until accounts exist.

## Watch (first week of the beta)
- Vercel Analytics or Plausible (cookieless). Never send file names, media or captions text.
- Error tracking (Sentry) with `beforeSend` stripping file names; watch: export failures, import errors by codec, memory errors.
- Do the core flow on the live URL: import → cut → text → captions → music → export, on desktop **and on the user's phone**.

## Before switching to public
1. Auto-captions verified in a real browser (Chrome, Edge, Safari) with Spanish and English speech.
2. iPhone + Android tested; limits documented.
3. Privacy/terms pages live (lawyer review).
4. Trademark/domain checks done; domain bought and connected.
5. Next 16 upgrade (postcss advisory).
6. `NEXT_PUBLIC_ALLOW_INDEXING=true`, then the launch plan.
