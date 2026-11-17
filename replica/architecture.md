# Architecture: videoed (a rebuild of the original's core web-editor features)

Reads `recon.md` and `features.csv`. The product promise drives the design:
**the user's footage never leaves their device**. Editing, preview, captions
and export all run in the browser. The server only knows who you are, what
you pay, and (opt-in) a backup of the project's edit list, never the media.

## Spikes run before choosing (2026-11-17, `replica/spikes/`)

| question | result |
| --- | --- |
| Can the browser encode a social-ready MP4? | Yes. WebCodecs H.264 **High** at 1080×1920/30 (Baseline at that size: refused, level too low). MP4 muxed with mediabunny. `ffprobe`: h264 High + AAC LC, 10.0 s |
| AAC audio (needed: some platforms reject Opus in MP4)? | Not native in this Linux Chromium (Opus only). `@mediabunny/aac-encoder` (WASM) fills the gap; used automatically when `canEncodeAudio('aac')` is false |
| Speed | 10 s of 1080×1920 rendered + encoded in **3.4 s** (headless, software encoder). Real devices with hardware H.264 should be faster; phones to be measured |
| Decode → trim → overlay → encode | Works: trim 2–6 s of a clip, caption drawn on top, audio kept. Frame at t=1 s is source frame 90 (exact). Off-by-one frame (4.03 s) from a float loop in the spike: use integer frame counters |
| Not tested here | Whisper captions (model download blocked by this network), Safari and Firefox, phones, HEVC input from iPhones |

## Stack

| layer | choice | why |
| --- | --- | --- |
| web | Next.js (App Router) + TypeScript | same as Clipsong: shared auth, billing, tokens, deploy |
| styling | Tailwind on design tokens | same system as Clipsong (replica-design will add editor components) |
| editor state | Zustand + immutable project document, undo/redo as a capped history of snapshots | the whole edit is one JSON doc: easy to save, undo, back up, test |
| media I/O | **mediabunny** (MPL-2.0): demux, decode (WebCodecs), encode, mux MP4 | one library for reading any input and writing the MP4; pure TS, no 30 MB ffmpeg.wasm |
| AAC fallback | `@mediabunny/aac-encoder` (WASM) | browsers without native AAC encoding |
| compositor | one `drawFrame(project, t, ctx)` on Canvas 2D, used by **both** preview and export | what you see is exactly what you export |
| export | Web Worker + OffscreenCanvas | UI stays responsive; progress and cancel |
| local storage | media files in **OPFS** (Origin Private File System); projects in **IndexedDB** (`idb`) | survives reloads, no upload, large files without RAM |
| captions | Whisper (small multilingual) via `@huggingface/transformers` in a worker, WebGPU when available, WASM otherwise; model cached by the browser | private: audio never leaves the device. Risk: ~150-250 MB first download, slow on weak devices |
| music | Clipsong catalogue (CC, licence shown, credit copied into the export's description text) | same user, one subscription bundle later |
| auth / payments | Supabase Auth + Stripe Checkout/Portal/webhooks, copied from Clipsong (tested there) | proven code; RLS |
| hosting | Vercel | static editor + a few API routes |

No server-side media processing, no media storage bucket. One database.

## Local data model (browser)

```ts
Project   { id, name, aspect: '9:16'|'16:9'|'1:1', width, height, fps, createdAt, updatedAt,
            tracks: Track[], assets: AssetRef[], version }
AssetRef  { id, opfsPath, kind: 'video'|'image'|'audio', name, mime, size, durationMs, width?, height?,
            hasAudio, thumbStrip?: string /* OPFS path */, waveform?: number[] }
Track     { id, kind: 'video'|'overlay'|'text'|'caption'|'audio', muted, locked, items: Item[] }
Item      { id, assetId?, startMs /* on timeline */, inMs, outMs /* in source */, speed, volume,
            fadeInMs, fadeOutMs, transform: { x, y, scale, rotation, crop? }, fit: 'fill'|'fit' }
TextItem  Item & { text, style: { font, size, color, stroke, bg, align, weight }, anim?: 'none'|'fade'|'pop'|'slide' }
Cue       { id, startMs, endMs, text, words?: { t0, t1, w }[] }   // caption track items
Music     Item & { clipsongTrackId, licence, credit }
```
Stored: `projects` (IndexedDB, one record per project), media in OPFS under
`/projects/{id}/media/`. Thumbnails/waveforms computed once on import.
Times in integer milliseconds, frames derived from fps (no float drift).

## Server schema

Tables: 5 (`replica/schema.sql`). Access rules: Postgres RLS (pattern tested in Clipsong).

- `profiles`, `subscriptions`, `stripe_events`: as in Clipsong.
- `project_backups`: opt-in backup of the **edit list only** (JSON, no media), so a project can be reopened on another device after re-linking the same files.
- `usage_events`: counts exports and caption minutes per day (no content), for plan limits and abuse.

## API

| method path | does | who | input | output | flow |
| --- | --- | --- | --- | --- | --- |
| GET /auth/callback | magic link / Google sign-in | public | code | redirect | - |
| POST /auth/signout | sign out (scope=global for all devices) | user | - | ok | - |
| POST /api/billing/checkout | Stripe Checkout | user | plan, interval | url | - |
| POST /api/billing/portal | Stripe Portal | user | - | url | - |
| POST /api/webhooks/stripe | subscription state | Stripe (signed) | event | ok | - |
| GET /api/me/entitlements | plan + limits (4K, caption minutes) | user | - | json | F02, F08 |
| PUT /api/projects/:id/backup | save edit list (≤1 MB JSON, zod-validated) | user (Pro) | project doc | version | F07 |
| GET /api/projects/backups | list backups | user | - | list | F07 |
| POST /api/usage | record export / caption minutes (numbers only) | user | kind, amount | ok | F02, F08 |

Everything else (import, edit, preview, captions, export) has no route: it runs in the browser.
Webhooks in: Stripe. Out: none. Jobs: none needed at launch.

## The parts that bite

- **Codec support per browser**: H.264 decode is near-universal; HEVC (iPhone default) decodes only where the OS has it (Safari, Chrome on Mac/Windows with hardware). On import: probe with `canDecode`; if not, say so clearly and suggest "Most compatible" camera setting. Never fail silently.
- **Encoding support**: H.264 High via WebCodecs (Chrome, Edge, Safari 17+, Firefox 130+ to verify). AAC via WASM where missing. Feature-detect at load; unsupported browser gets a clear message, not a broken export.
- **Memory**: decode with small sink pools, never hold decoded frames; files in OPFS, read by range. Hard limits at launch: 4K input allowed, export ≤1080p on Free, ≤60 min timeline; measure on a mid-range phone.
- **A/V sync**: one clock (AudioContext time) drives preview; export walks integer frame numbers; audio mixed per item with speed/volume/fades into one AudioBuffer stream.
- **Frame accuracy**: timeline in ms, snapping to frame boundaries (1000/fps); the spike's off-by-one came from float accumulation.
- **Undo/redo**: every edit is a pure function on the project doc; history capped (200) and coalesced while dragging.
- **Autosave and crash safety**: debounce writes to IndexedDB (500 ms) and on `visibilitychange`; export is resumable from scratch only (document it).
- **Storage quota**: `navigator.storage.persist()` + show used space; OPFS can be evicted if not persisted.
- **Captions privacy vs speed**: local Whisper first download is large: ask before downloading, show size, cache it. No server fallback at launch (it would break the promise); revisit only as an explicit opt-in.
- **Fonts and licences**: only open fonts (OFL), bundled; music only from Clipsong with licence shown.
- **GDPR**: little personal data on the server by design; account deletion cascades (pattern from Clipsong). Local data: "Delete all local projects" button.

## Build order

1. **Vertical slice** (M): S02 new project (9:16) → S04 import (OPFS) → S06 timeline with one video track: trim, split, delete, reorder → S05 preview (shared compositor) → S11 export 1080p MP4 in a worker. No accounts. Done when: two clips in, cut, exported, plays in a phone's player and uploads to a social app.
2. **Must-haves**: undo/redo, autosave + projects list (S02), text layer (S07) + canvas move/scale (S05), music track from Clipsong + volume/fade (S09), captions with Whisper (S08) + edit/style, shortcuts.
3. **Should-haves**: overlay track, snapping, zoom, speed, detach audio, crop/fit, fades/transitions, text animations, word-highlight captions, 4K/60 (Pro), mobile layout, accounts + backups.
4. **Fixes from replica-entrepreneur** (to run): expected around privacy/ownership and caption limits.
