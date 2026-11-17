# Recon map: CapCut (web editor, short vertical video)

Scope (proposed): the browser editor's core loop for short vertical videos:
import clips, cut them on a timeline, add text, captions and music, export
an MP4. Not: the mobile app's effects catalogue, AI avatars, AI video
generation, team spaces, the template marketplace, stock libraries.
For: a product to sell to the same people as Clipsong (video creators). Working
angle (to confirm in /replica-entrepreneur): **your footage stays yours**:
editing happens in the browser, files are not uploaded, no broad licence over
your content; music with clear licences (Clipsong).
Date: 2026-11-17

## Recon limits (read this first)
- capcut.com was not opened from this environment (network restricted). The map
  comes from public reviews and press found by search (below) and general
  knowledge of video editors. Screens marked `(verify)` need a look by hand in
  the user's own browser.
- No account was used. No code, bundles or network calls of the original were read.
- `replica/screens/` is empty.

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | CapCut: Standard vs Pro (official resource page) | https://capcut.com/resource/capcut-standard-vs-pro | tiers; not opened here |
| 2 | CapCut: About our Terms of Service (official) | https://capcut.com/resource/about-capcut-terms-of-service | its answer to the 2025 backlash |
| 3 | BIGVU: online desktop editor review | https://bigvu.tv/blog/capcut-online-desktop-editor-review | web editor walkthrough |
| 4 | BIGVU: pricing 2026 free vs pro | https://www.bigvu.tv/blog/capcut-pricing-2026-free-vs-pro-included-alternatives | $19.99/mo or $179.99/yr (Oct 2026) |
| 5 | Marc Andrews: AI features 2026 | https://marcandrews.com/capcut-ai-features-review-2026-which-ones-are-worth-it/ | web editor left rail, Pro badges |
| 6 | fluxnote: AI features free vs paid 2026 | https://fluxnote.io/guides/capcut-ai-features-free-vs-paid-2026 | captions limits |
| 7 | flowith: pricing strategy | https://flowith.io/blog/capcut-pricing-2026-free-vs-pro-vs-team | tiers |
| 8 | vidpros: Pro vs Free 2026 | https://vidpros.com/capcut-pro-vs-free/ | export limits, watermark |
| 9 | Digital Camera World: new terms anger the internet | https://www.digitalcameraworld.com/tech/social-media/capcuts-new-terms-of-service-are-angering-the-internet-and-so-confusing-that-video-editors-are-asking-chatgpt-to-decipher-them | ToS backlash |
| 10 | TechRadar: terms explained | https://www.techradar.com/pro/popular-video-editing-app-capcut-wants-to-use-any-content-you-produce-for-free-forever-heres-what-you-should-know | the other side |
| 11 | 2B Advice: legal risks (GDPR) | https://2b-advice.com/en/2025/07/04/capcut-trouble-over-new-terms-of-service-legal-risks-lurk-here/ | EU angle |

## Core loop
Drop clips in, cut out what is not needed, put words on screen (captions,
titles), add music, export a vertical video ready to post. Users pay for:
auto-captions without limits, 4K, Pro effects/templates without a watermark,
cloud storage.

## Screens

| ID | screen | route / how to reach | purpose | key components | states seen |
| --- | --- | --- | --- | --- | --- |
| S01 | Sign up / log in | /login | account | inputs, OAuth | error |
| S02 | Projects (home) | / | recent projects, new project, sizes (9:16, 16:9, 1:1) | project cards, "New" button, size picker | empty, filled, loading |
| S03 | Editor shell | /editor/{id} | left rail + panel, preview, properties, timeline | rail, panel, canvas, inspector, timeline | empty project, loading media |
| S04 | Media panel | editor rail "Media" | import files, see uploads | dropzone, media grid, upload progress | empty, uploading, error (codec/size) |
| S05 | Preview canvas | editor centre | play, scrub, select and move/scale layers on the frame | canvas, transport (play, time), aspect frame, safe areas | playing, paused, buffering |
| S06 | Timeline | editor bottom | clips on tracks: trim, split, move, delete, zoom; playhead | tracks (video, text, audio), clip blocks, playhead, zoom | empty, many clips, overlap |
| S07 | Text panel | rail "Text" | add title / text layer, styles | style presets, font, size, colour, stroke, position | - |
| S08 | Captions panel | rail "Captions" | auto-captions from speech, edit lines, style | language select, generate button, line list, style | generating, done, no speech, limit reached (Free) |
| S09 | Audio panel | rail "Audio" | music library, sound effects, voice volume | track list, preview, add, volume, fade | - |
| S10 | Inspector | right side | properties of the selected item: transform, speed, volume, fades, crop | sliders, inputs, toggles | nothing selected |
| S11 | Export dialog | "Export" | resolution, frame rate, format, file name; progress | selects, progress bar, download | exporting, done, failed, Pro gate (4K) |
| S12 | Upsell / Pro gate | Pro item used | explain Pro, upgrade | modal | - |
| S13 | Templates (verify) | rail "Templates" | start from a template | grid, preview | - |
| S14 | Settings / account / plan | menu | plan, storage, billing | - | - |

## Flows

```
F01 Make a short video from clips (core)
    S02 new 9:16 -> S04 import 3 clips -> S06 drop on timeline -> trim + split + delete -> S11 export -> download
    happy path clicks: ~10 (verify)
    edge: unsupported codec, 4 GB file, vertical vs horizontal clips mixed, export interrupted, tab closed mid-edit

F02 Auto-captions
    S08 choose language -> generate -> edit a line -> style -> preview
    edge: no speech, music over speech, two speakers, Free limit reached

F03 Add title text
    S07 add -> type -> style -> S05 drag on frame -> S06 set duration

F04 Add music
    S09 pick a track -> S06 place -> trim -> fade out -> lower volume under voice

F05 Reframe / transform
    S05 select clip -> scale/move to fill 9:16 -> S10 crop

F06 Speed and volume
    S10 speed 0.5x-2x, mute original audio, fade in/out

F07 Undo / redo, autosave, reopen a project
    any -> Ctrl+Z / Ctrl+Shift+Z ; close tab -> S02 reopen -> same state

F08 Export
    S11 1080p/30 -> progress -> download MP4
    edge: Pro element used (watermark/upsell), long video, low-memory device
```

## Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| Left rail | icon + label | default, active | S03 |
| Panel | media, text, captions, audio | empty, filled, loading | S04, S07-S09 |
| Dropzone | full panel, empty-timeline | idle, drag-over, uploading, error | S04, S06 |
| Media tile | video, image, audio | thumbnail, duration, importing, error, used-on-timeline | S04 |
| Canvas | 9:16, 16:9, 1:1 | selection box with handles, snapping guides, safe areas | S05 |
| Transport | play/pause, time, fullscreen | playing, paused | S05 |
| Timeline | tracks, ruler, playhead, zoom slider | empty, scrolling, selection, snapping | S06 |
| Clip block | video (thumbnails strip), audio (waveform), text | selected, trimming (edge handles), dragging, overlapped | S06 |
| Inspector controls | slider + number input, colour, font select, toggle | disabled when nothing selected | S10, S07 |
| Caption line | time range + text | editing, active (playhead inside) | S08 |
| Export dialog | settings, progress, done | exporting %, failed, done | S11 |
| Toast, modal, menu, tooltip | - | - | all |

## Inferred data model

```
Project     id, owner_id, name, aspect (9:16|16:9|1:1), width, height, fps,
            duration_ms, created_at, updated_at, thumbnail
            evidence: S02 cards, size picker   confidence: high
Asset       id, project_id, kind (video|image|audio), file name, mime, size,
            duration_ms, width, height, has_audio, storage (local|cloud)
            evidence: S04 tiles   confidence: high
Track       id, project_id, kind (video|text|audio|caption), order, muted, locked
            evidence: S06   confidence: medium
Item        id, track_id, asset_id?, start_ms (on timeline), in_ms, out_ms (in source),
            speed, volume, fade_in_ms, fade_out_ms, transform {x,y,scale,rotation,crop}
            evidence: S06 trim handles, S10 inspector   confidence: high (fields: guess)
TextItem    item + text, style {font, size, colour, stroke, bg, align}, animation?
            evidence: S07   confidence: medium
CaptionCue  id, track_id, start_ms, end_ms, text, speaker?   evidence: S08   confidence: high
Export      id, project_id, settings {res, fps, format}, status, progress, file
            evidence: S11   confidence: medium
History     undo/redo stack of edits (client)   evidence: F07   confidence: medium
```

Relationships: User 1-n Project, Project 1-n Asset, Project 1-n Track, Track 1-n Item,
Item n-1 Asset, Track(caption) 1-n CaptionCue.

## Feature matrix
See `features.csv`. Must: 16, should: 13, could: 9, skip: 7.

## Out of scope (cannot or should not be cloned)
- Stock libraries: CapCut's music, sound effects, stickers, footage, fonts it licenses.
  The clone uses Clipsong's CC music, open fonts, the user's own files.
- The template marketplace and its creators (their network).
- Proprietary AI models and generative features (AI avatars, text-to-video,
  AI voices from its partners). Some have open alternatives (speech-to-text).
- Integration with TikTok (its parent company's platform deal).
- CapCut's brand, effects and transitions as designed by them.

## Size
Screens 14, flows 8, entities 8. Hard parts:
1. **Rendering and export in the browser**: decoding several clips, compositing
   frames with text, mixing audio and encoding MP4 (WebCodecs + a muxer, or
   ffmpeg.wasm as fallback), fast enough on a normal laptop and on phones.
2. **Timeline engine**: trim/split/move with snapping, multi-track, frame-accurate
   preview synced with audio, undo/redo.
3. **Auto-captions**: speech-to-text. In the browser (Whisper-class model,
   large download, slow on weak devices) or a server API (cost, privacy).
4. Big files and memory: hour-long 4K clips will not fit; limits and proxies.
5. Codec support differs per browser (HEVC from iPhones, etc.).

Size: **XL** for "CapCut". The proposed slice (single video track + text +
captions + one music track + 1080p export) is **L**; a usable vertical slice
(import, trim/split, text, export) is **M**.
