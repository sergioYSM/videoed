# Brand: Ownframe

Angle (from `fixes.md`, option A): your footage stays yours. Edited on your
device, never uploaded, no licence asked over it. Second line: what is free
stays free, in writing.

## 1. Name

20 candidates:

| style | candidates |
| --- | --- |
| descriptive | Homeedit, Mineclip, Localreel, Keepframe |
| compound | Ownframe, Framekeep, Selfreel, Hometake, Safereel |
| invented | Tomavi, Edivo, Velo, Rodiva |
| metaphor | Atelier, Taller, Hearth, Burrow, Darkroom |
| verb | Montar, Rodaje |

Cut, with reasons:
- **Anything with "cut"** (Localcut, Owncut…): plays on the original's name. Out by rule.
- **Keepframe**: close in sound and concept to *KeeperTake: Video Frame Picker*, an on-device frame app (https://apps.apple.com/app/id6757968605). Out.
- **Darkroom**: an existing, well-known photo/video editing app name. Out.
- **Atelier, Taller, Hearth, Burrow, Velo**: generic words, unownable or unrelated to video.
- **Montar, Rodaje**: everyday Spanish film words; hard to register, and they say "editing", not the angle.
- **Edivo, Rodiva, Mineclip, Safereel, Selfreel, Homeedit, Localreel, Framekeep**: weaker or awkward ("mine", "self").

### The 5

| name | why |
| --- | --- |
| **Ownframe** (recommended) | "own the frame": the angle in two plain words, easy to spell after hearing it once, works in English and reads fine in Spanish |
| **Hometake** | your takes stay home; warm, a bit less clear |
| **Tomavi** | invented, from "toma" (take); ownable, says nothing yet |
| **Rodaje** | Spanish "filming"; strong for a Spanish audience, weak as a trademark |
| **Framekeep** | close to Ownframe's idea, clumsier |

### Checks

Web search is a screening signal, not clearance. Everything else is **to run**.

| check | Ownframe | Hometake | Tomavi | Rodaje | Framekeep |
| --- | --- | --- | --- | --- | --- |
| web: "name + video app" | 2026-11-17: no app found; nearby: MovieFrame, Video Frame Editor | 2026-11-17: no app found | 2026-11-17: no app found (Tomappo, TOM: unrelated) | 2026-11-17: no app found; common Spanish word | to run |
| US trademark (USPTO, classes 9, 41, 42) | to run | to run | to run | to run | to run |
| EU trademark (EUIPO / TMview) | to run | to run | to run | to run | to run |
| Spain (OEPM) | to run | to run | to run | to run | to run |
| global (WIPO Global Brand Database) | to run | to run | to run | to run | to run |
| domains .com / .app / .es | to run | to run | to run | to run | to run |
| App Store and Google Play exact name | to run | to run | to run | to run | to run |
| handles X, Instagram, TikTok, YouTube, GitHub | to run | to run | to run | to run | to run |

Trademark, domain and store checks could not be run here (network restricted). A trademark lawyer should search before money is spent on the name.

Internal names stay "videoed" (repository, IndexedDB database) so existing local projects are not lost; nothing user-visible says videoed.

## 2. Palette (tokens updated, contrast: 26 pairs, 0 AA failures)

| role | value | note |
| --- | --- | --- |
| accent / selection | `#ff8a3d` | Ownframe orange: warm, "film" and "home"; far from the original's cyan |
| on-accent | `#1a0c02` | 8.16:1 on accent |
| focus | `#ffc49e` | focus rings |
| bg / surface | `#0b0b0e` / `#141418` | dark editor UI |
| warning | `#ffd166` | moved to yellow so it does not read as the brand orange |
| snap-guide | `#ff4fd8` | magenta, deliberately not cyan |

The original's brand is black and white with a cyan accent. Its exact hex values were **not measured** (domain blocked), so `brand.json` has no colours yet: measure them from its own logo and add them before /replica-deploy so the sweep catches them.

Sibling: Clipsong is violet. Ownframe gets its own colour on purpose; they can share a "made by" footer later.

## 3. Logo brief

- **Idea**: a viewfinder (four frame corners) holding a small house-shaped notch or a solid dot: your frame, kept at home.
- **Mark type**: symbol + wordmark ("ownframe", lowercase, Figtree ExtraBold).
- **Sizes**: the symbol alone must read at 16px (the four corners + dot); app icon 1024×1024 with no transparency (orange symbol on `#0b0b0e`).
- **Deliverables**: SVG (symbol, wordmark, lockup), app icon 1024 (iOS, no alpha), Android adaptive icon, favicon set (16, 32, 180, 192, 512), social image 1200×630.
- **Must not resemble the original's mark**: no stylised scissors, no letter "C" shapes, no interlocking black-and-white geometry, no cyan. Put the drafts next to the original's logo and check shape, colour pair and silhouette at 32 px.
- A placeholder icon following this brief is in `public/icon.svg` (to be replaced by a designer's version).

## 4. Voice

- **Calm**, not cold: an editor that does not rush you or upsell you mid-task.
- **Plain**, not technical: "se queda en tu dispositivo", never "almacenamiento OPFS".
- **Trustworthy**, not preachy: state what we do with your files once, clearly; no fear marketing about others.

| do | don't |
| --- | --- |
| "Tus vídeos no salen de este dispositivo." | "Utilizamos tecnología de procesamiento local de última generación." |
| "Exportado. Sin marca de agua." | "¡Desbloquea exportaciones premium!" |
| "No hemos podido leer este vídeo: usa HEVC. Prueba en Safari." | "Error de códec 0x8004." |
| "Esto es gratis y seguirá siéndolo." | "Oferta por tiempo limitado." |
| "Borrado. Deshacer." | "¿Estás completamente seguro de que deseas eliminar…?" |

### The 10 most-seen strings (rewritten in the app)

| # | where | string |
| --- | --- | --- |
| 1 | projects title + tagline | "Tus proyectos" · "Tus vídeos no salen de este dispositivo." |
| 2 | new project buttons | "Vertical · TikTok, Reels, Shorts" (unchanged, already plain) |
| 3 | empty projects | "Aún no tienes proyectos. Elige un formato arriba para empezar." |
| 4 | dropzone | "Importar vídeos, audio o imágenes" · "No se suben a ningún sitio." |
| 5 | empty preview | "Importa vídeos desde Medios para empezar." |
| 6 | save state | "Guardado en este dispositivo" |
| 7 | export button / done | "Exportar" · "Listo. Sin marca de agua." |
| 8 | export failure | "No se ha podido exportar" + cause + what to try |
| 9 | toast after delete | "Borrado · Deshacer" |
| 10 | captions | "Generar desde la voz" · "Se hace en tu dispositivo." |

## 5. Sweep

`python3 ~/.claude/skills/replica-brand/sweep.py . --config replica/brand.json` → see the result in the chat/log. Checked by eye: page titles, favicon, export file names (project name, never the brand of the original).
