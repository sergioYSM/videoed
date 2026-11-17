# Components (editor)

Icons: Lucide (MIT). UI font: Figtree (OFL). Caption/title fonts: OFL only, bundled.
Accessible bases: Radix (menus, dialogs, tooltips, select), own Slider (tested in Clipsong).
All labels written fresh. Density: 13-14px body, 32px controls (40px on touch).

## EditorShell (S03)
  layout    topbar 48 | rail 64 + panel 300 | canvas (flex) | inspector 280 / timeline below (resizable, 220-60vh)
  mobile    <900px: canvas top, timeline middle, panels as bottom sheets opened from a bottom tab bar
  a11y      landmarks: banner (topbar), navigation (rail), region "Vista previa", region "Línea de tiempo", complementary (inspector)
  keys      Space play/pause · S split · Delete remove · Ctrl+Z / Ctrl+Shift+Z · ←/→ 1 frame · Shift+←/→ 1 s · +/- zoom · Ctrl+E export

## TopBar
  project name (inline rename, 120 chars max, ellipsis), save state ("Guardado" / "Guardando…" / "Sin guardar: sin espacio"), undo/redo buttons, aspect badge, Export button (primary)

## Rail
  items     Medios, Texto, Subtítulos, Audio, (Plantillas later)
  states    default, hover, active (accent bar 3px + text), focus-visible ring `focus`
  a11y      tablist (vertical) controlling the panel; arrow keys move between tabs

## Panel
  header title + optional action; scroll body; empty state with one action
  states    empty, loading (skeleton tiles), filled, error

## Dropzone
  variants  panel (dashed box), timeline-empty (full track area), whole-window drag overlay
  states    idle, drag-over (accent border + "Suelta para importar"), importing (per-file progress), error per file ("Este vídeo usa HEVC y tu navegador no puede leerlo")
  a11y      real <button> opening the file picker; accepts keyboard; announces "3 archivos importados"

## MediaTile
  thumbnail 16:9 or 9:16 crop, duration badge (mono xs), kind icon, name (1 line)
  states    importing (progress ring), ready, used (dot), error (danger icon + reason), selected
  actions   double-click / Enter: add at playhead · drag to timeline · menu: Añadir, Mostrar info, Quitar del proyecto
  a11y      listitem with name "nombre, 0:12, vídeo"

## Canvas (preview)
  letterboxed frame in `canvas-bg`, aspect from project; safe-area guides (toggle)
  selection box: 8 handles + rotate handle; drag to move, handles to scale (Shift: free), snapping to centre/edges shows `snap-guide` lines
  states    empty project hint, playing, paused, buffering (spinner over frame), decode error tile
  a11y      arrow keys move selected layer 1px (Shift 10px); selection announced

## Transport
  play/pause (32), current time / duration (mono, hh:mm:ss.ff), step frame buttons, fit/fullscreen
  a11y      play button label toggles; time is aria-live=off (no spam)

## Timeline (S06)
  ruler 24 (ticks adapt to zoom; click/drag scrubs), tracks (video 48, text/caption 32, audio 40), playhead 2px `playhead` across all tracks with a handle on the ruler
  zoom      slider + Ctrl+wheel + pinch; "fit" button
  snapping  to playhead, clip edges, ruler marks; shown as `snap-guide` line; Alt disables
  states    empty ("Arrastra clips aquí"), scrolling, dragging, overlap blocked (red outline)
  a11y      each clip is a focusable option in a listbox per track; ←/→ moves the playhead; Enter selects; Alt+←/→ nudges the clip 1 frame

## ClipBlock
  variants  video (thumbnail strip, `track-video`), text (`track-text`, shows the text), caption (`track-caption`), audio (`track-audio` + `waveform`)
  parts     label (name or text, 2xs, ellipsis), trim handles 10px on hover/selected, fade triangles on audio
  states    default, hover, selected (2px `selection` ring), trimming (live duration tooltip), dragging (lifted, 0.9 opacity), muted (striped), error (missing media)
  a11y      name "Clip playa.mp4, de 0:03 a 0:08"; trim with Alt+Shift+←/→ when focused

## Inspector (S10)
  sections by selection: Transformación (x, y, escala, rotación), Ajuste (rellenar/encajar, recortar), Velocidad, Volumen + fundidos, Texto (fuente, tamaño, color, contorno, fondo, alineación, animación)
  control   NumberField = label + slider + number input (units: %, px, s, dB); scrubbing on the label
  states    nothing selected ("Selecciona algo en la línea de tiempo"), multiple selected (common fields only), disabled
  a11y      every control labelled; number inputs accept typing and arrows

## CaptionList (S08)
  rows: time range (mono) + editable text; active row follows the playhead; split/merge row; style presets row
  states    no captions yet (language select + "Generar subtítulos" + model size and "se descarga una vez"), downloading model (progress MB), transcribing (progress), done, no speech found, unsupported browser
  a11y      each row a textbox labelled with its time

## ExportDialog (S11)
  settings: resolución (720p, 1080p, 4K-Pro), fps (24/30/60), calidad (estándar/alta), nombre del archivo; estimated size
  states    settings, exporting (progress %, time left, cancel), done (download button + "Copiar créditos de la música"), failed (reason + retry), unsupported browser
  a11y      Radix Dialog; progress role=progressbar with aria-valuenow

## Shared (from Clipsong, re-skinned by tokens)
  Button (primary, secondary, ghost, danger · sm 28 / md 32 / lg 40), IconButton (32, tooltip required), Toggle, Select, Menu, Toast (undo action), Modal, Tooltip, Skeleton, Kbd (shortcut chip)
