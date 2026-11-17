# Build log

App: Next.js 15, local-first. Media in OPFS, projects in IndexedDB, decode/encode with mediabunny (WebCodecs) + AAC WASM fallback.
Checks: `node --test lib/project.test.ts` (9), `npx playwright test` (4 e2e, incl. exported MP4 verified with ffprobe, frame colours at cut points and audio level).

| ID | date | status | missing | harder than expected |
| --- | --- | --- | --- | --- |
| S02 Projects | 2026-11-17 | done | rename from the list; storage warning when near quota | - |
| S03 Editor shell | 2026-11-17 | partial | mobile layout (panels hidden <900 px, so no import on phones); resizable timeline | - |
| S04 Media panel | 2026-11-17 | done | drag from panel to a position on the timeline (adds at the end today) | - |
| S05 Preview | 2026-11-17 | done | moving/scaling layers (comes with text) | keeping video frames in step with the audio clock |
| S06 Timeline | 2026-11-17 | partial | keyboard trim, snapping, more tracks | an empty listbox fails a11y rules; clip focus had to live on the clip itself |
| S07 Text | - | not started | | |
| S08 Captions | - | not started | Whisper model download blocked here: will need testing in a real browser | |
| S09 Audio | - | not started | | |
| S10 Inspector | 2026-11-17 | partial | fill/fit and volume only | |
| S11 Export | 2026-11-17 | done | 4K (Pro), run in a worker | a cleanup effect cancelled every export the moment it started (found by e2e, fixed) |

Measured: 1 clip of 5 s exported at 720p in under 2 s (headless, software encoder).

## Round 2

| ID | date | status | missing | harder than expected |
| --- | --- | --- | --- | --- |
| S07 Text | 2026-11-17 | done | text animations | axe reads the outline colour of a styled sample as its text colour |
| S08 Captions | 2026-11-17 | partial | auto-captions never run here (model host blocked): first real run must be in a normal browser; word-highlight style | - |
| S09 Audio | 2026-11-17 | done | real waveforms; real Clipsong catalogue | scheduling music fades from any start point |
| S05 Canvas transform | 2026-11-17 | done (text) | free transform of video clips | - |
| S06 Timeline | 2026-11-17 | done | snapping | - |
| S10 Inspector | 2026-11-17 | done | - | desktop and phone inspectors both mounted: duplicate ids broke the label of the text box on phones (found by e2e) |
| S03 Mobile | 2026-11-17 | done | gestures (pinch zoom on timeline) | - |

Tests: 15 unit, 10 e2e specs (desktop + Pixel 7), 30/30 over 3 repeats. Exports checked with ffprobe, pixels and audio levels.
