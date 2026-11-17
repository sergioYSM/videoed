// The project document and every edit as a pure function (old doc in, new doc out).
// Undo/redo = keep old docs. Times are integer milliseconds; edits snap to frames.

export type Aspect = '9:16' | '16:9' | '1:1';
export const SIZES: Record<Aspect, { width: number; height: number }> = {
  '9:16': { width: 1080, height: 1920 }, '16:9': { width: 1920, height: 1080 }, '1:1': { width: 1080, height: 1080 },
};

export interface AssetRef {
  id: string; name: string; kind: 'video' | 'audio' | 'image'; mime: string; size: number;
  durationMs: number; width?: number; height?: number; hasAudio: boolean; thumb?: string;
}
export interface Adjust { brightness: number; contrast: number; saturation: number }   // 1 = unchanged
export const NO_ADJUST: Adjust = { brightness: 1, contrast: 1, saturation: 1 };
export const LOOKS: Record<string, { label: string; adjust: Adjust }> = {
  original: { label: 'Original', adjust: NO_ADJUST },
  vivo: { label: 'Vivo', adjust: { brightness: 1.05, contrast: 1.15, saturation: 1.35 } },
  calido: { label: 'Cálido', adjust: { brightness: 1.05, contrast: 1.05, saturation: 1.15 } },
  suave: { label: 'Suave', adjust: { brightness: 1.08, contrast: 0.9, saturation: 0.9 } },
  bn: { label: 'Blanco y negro', adjust: { brightness: 1, contrast: 1.1, saturation: 0 } },
  dramatico: { label: 'Dramático', adjust: { brightness: 0.92, contrast: 1.35, saturation: 0.85 } },
};
export const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];
/** A clip on the main track. Main track is magnetic: clips play back to back, no gaps.
 *  inMs/outMs are in SOURCE time; the clip lasts (outMs - inMs) / speed on the timeline. */
export interface Clip {
  id: string; assetId: string; inMs: number; outMs: number; fit: 'fill' | 'fit'; volume: number;
  speed?: number; fadeInMs?: number; fadeOutMs?: number; adjust?: Adjust; bg?: 'black' | 'blur';
}
export type FontId = 'Figtree' | 'Anton' | 'Montserrat' | 'Bebas Neue' | 'Permanent Marker';
export const FONTS: FontId[] = ['Figtree', 'Anton', 'Montserrat', 'Bebas Neue', 'Permanent Marker'];
export interface TextStyle { font: FontId; size: number /* px at 1920 tall */; color: string; stroke: string | null; bg: string | null; weight: 400 | 700 | 900; align: 'left' | 'center' | 'right' }
/** Overlays live at absolute times (not magnetic). x, y = centre, as a fraction of the frame. */
export type TextAnim = 'none' | 'fade' | 'pop' | 'slide' | 'type';
export interface TextItem { id: string; text: string; startMs: number; endMs: number; x: number; y: number; scale: number; style: TextStyle; anim?: TextAnim }
export interface AudioItem { id: string; assetId: string; startMs: number; inMs: number; outMs: number; volume: number; fadeInMs: number; fadeOutMs: number; credit?: string }
export interface Cue { id: string; startMs: number; endMs: number; text: string }
export type CaptionPreset = 'clasico' | 'caja' | 'grande' | 'karaoke';
export interface Captions { cues: Cue[]; preset: CaptionPreset; y: number; lang?: string }
export interface Project {
  id: string; name: string; aspect: Aspect; width: number; height: number; fps: number;
  createdAt: number; updatedAt: number; assets: AssetRef[]; clips: Clip[];
  texts: TextItem[]; audio: AudioItem[]; captions: Captions;
}

export const MIN_CLIP_MS = 100;
const uid = () => (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2));
export const frameMs = (fps: number) => 1000 / fps;
/** Snap to the nearest frame boundary of the project. */
export const snap = (ms: number, fps: number) => Math.round(Math.round((ms * fps) / 1000) * (1000 / fps));
const touch = (p: Project, patch: Partial<Project>): Project => ({ ...p, ...patch, updatedAt: Date.now() });

export function createProject(aspect: Aspect, name = 'Proyecto sin título', fps = 30): Project {
  const now = Date.now();
  return { id: uid(), name, aspect, ...SIZES[aspect], fps, createdAt: now, updatedAt: now, assets: [], clips: [], texts: [], audio: [], captions: { cues: [], preset: 'clasico', y: 0.8 } };
}

/** Projects saved before overlays existed get the new fields. */
export function migrate(p: Project): Project {
  return { ...p, texts: p.texts ?? [], audio: p.audio ?? [], captions: p.captions ?? { cues: [], preset: 'clasico', y: 0.8 } };
}

export const speedOf = (c: Clip) => c.speed ?? 1;
/** Length on the timeline (source length divided by speed), whole milliseconds. */
export const clipLength = (c: Clip) => Math.round((c.outMs - c.inMs) / speedOf(c));
/** The video ends with the main track; overlays past the end are cut at export. */
export const duration = (p: Project) => p.clips.reduce((s, c) => s + clipLength(c), 0);
/** Start time of each clip on the timeline. */
export function starts(p: Project): number[] { const r: number[] = []; let t = 0; for (const c of p.clips) { r.push(t); t += clipLength(c); } return r; }

/** Which clip plays at timeline time t, and where in its source. */
export function locate(p: Project, t: number): { index: number; clip: Clip; sourceMs: number; startMs: number } | null {
  let s = 0;
  for (let i = 0; i < p.clips.length; i++) {
    const c = p.clips[i], len = clipLength(c);
    if (t < s + len || (i === p.clips.length - 1 && t === s + len)) return { index: i, clip: c, sourceMs: c.inMs + Math.min(t - s, len) * speedOf(c), startMs: s };
    s += len;
  }
  return null;
}

export function rename(p: Project, name: string): Project { return touch(p, { name: name.trim().slice(0, 120) || p.name }); }
export function addAsset(p: Project, a: AssetRef): Project { return touch(p, { assets: [...p.assets, a] }); }
export function removeAsset(p: Project, assetId: string): Project {
  return touch(p, { assets: p.assets.filter((a) => a.id !== assetId), clips: p.clips.filter((c) => c.assetId !== assetId), audio: p.audio.filter((a) => a.assetId !== assetId) });
}

/** Append (or insert at index) the whole asset as a clip. Images get 3 s. */
export function addClip(p: Project, assetId: string, at = p.clips.length): Project {
  const a = p.assets.find((x) => x.id === assetId);
  if (!a || a.kind === 'audio') return p;
  const len = a.kind === 'image' ? 3000 : snap(a.durationMs, p.fps);
  const clip: Clip = { id: uid(), assetId, inMs: 0, outMs: Math.max(MIN_CLIP_MS, len), fit: 'fill', volume: 1 };
  const clips = [...p.clips]; clips.splice(Math.max(0, Math.min(at, clips.length)), 0, clip);
  return touch(p, { clips });
}

/** Move a clip edge. 'start' changes inMs, 'end' changes outMs; clamped to the source and a minimum length. */
export function trim(p: Project, clipId: string, edge: 'start' | 'end', toSourceMs: number): Project {
  const a = (id: string) => p.assets.find((x) => x.id === id);
  return touch(p, {
    clips: p.clips.map((c) => {
      if (c.id !== clipId) return c;
      const asset = a(c.assetId);
      const max = asset?.kind === 'image' ? 60 * 60 * 1000 : asset?.durationMs ?? c.outMs;
      const v = snap(toSourceMs, p.fps);
      return edge === 'start'
        ? { ...c, inMs: Math.max(0, Math.min(v, c.outMs - MIN_CLIP_MS)) }
        : { ...c, outMs: Math.min(max, Math.max(v, c.inMs + MIN_CLIP_MS)) };
    }),
  });
}

/** Split the clip under timeline time t into two. No-op at an edge or too close to one. */
export function split(p: Project, t: number): Project {
  const hit = locate(p, snap(t, p.fps));
  if (!hit) return p;
  const cut = hit.sourceMs;
  if (cut - hit.clip.inMs < MIN_CLIP_MS || hit.clip.outMs - cut < MIN_CLIP_MS) return p;
  const left = { ...hit.clip, outMs: cut }, right = { ...hit.clip, id: uid(), inMs: cut };
  const clips = [...p.clips]; clips.splice(hit.index, 1, left, right);
  return touch(p, { clips });
}

export function removeClip(p: Project, clipId: string): Project { return touch(p, { clips: p.clips.filter((c) => c.id !== clipId) }); }

export function moveClip(p: Project, from: number, to: number): Project {
  if (from === to || from < 0 || from >= p.clips.length) return p;
  const clips = [...p.clips]; const [c] = clips.splice(from, 1); clips.splice(Math.max(0, Math.min(to, clips.length)), 0, c);
  return touch(p, { clips });
}

export function setClip(p: Project, clipId: string, patch: Partial<Pick<Clip, 'fit' | 'volume' | 'speed' | 'fadeInMs' | 'fadeOutMs' | 'adjust' | 'bg'>>): Project {
  return touch(p, { clips: p.clips.map((c) => {
    if (c.id !== clipId) return c;
    const n = { ...c, ...patch };
    if (n.speed !== undefined) n.speed = Math.min(4, Math.max(0.25, n.speed));
    const len = clipLength(n);
    n.fadeInMs = Math.min(len, Math.max(0, n.fadeInMs ?? 0)); n.fadeOutMs = Math.min(len - n.fadeInMs, Math.max(0, n.fadeOutMs ?? 0));
    if (n.adjust) n.adjust = { brightness: clamp(n.adjust.brightness, 0, 2), contrast: clamp(n.adjust.contrast, 0, 2), saturation: clamp(n.adjust.saturation, 0, 3) };
    return n;
  }) });
}
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));


// ───────── text ─────────
export const TEXT_PRESETS: Record<'titulo' | 'subtitulo' | 'etiqueta', Omit<TextItem, 'id' | 'startMs' | 'endMs'>> = {
  titulo: { text: 'Tu título', x: 0.5, y: 0.3, scale: 1, style: { font: 'Anton', size: 120, color: '#ffffff', stroke: '#000000', bg: null, weight: 400, align: 'center' } },
  subtitulo: { text: 'Escribe aquí', x: 0.5, y: 0.5, scale: 1, style: { font: 'Figtree', size: 72, color: '#ffffff', stroke: null, bg: null, weight: 700, align: 'center' } },
  etiqueta: { text: 'NUEVO', x: 0.5, y: 0.15, scale: 1, style: { font: 'Montserrat', size: 56, color: '#0b0b14', stroke: null, bg: '#ffd400', weight: 900, align: 'center' } },
};
const clampOverlay = (p: Project, start: number, end: number) => {
  const s = Math.max(0, snap(start, p.fps));
  return { startMs: s, endMs: Math.max(s + MIN_CLIP_MS, snap(end, p.fps)) };
};
export function addText(p: Project, preset: keyof typeof TEXT_PRESETS, atMs: number, lengthMs = 3000): Project {
  const t: TextItem = { id: uid(), ...structuredClone(TEXT_PRESETS[preset]), ...clampOverlay(p, atMs, atMs + lengthMs) };
  return touch(p, { texts: [...p.texts, t] });
}
export function updateText(p: Project, id: string, patch: Partial<Omit<TextItem, 'id' | 'style'>> & { style?: Partial<TextStyle> }): Project {
  return touch(p, { texts: p.texts.map((t) => {
    if (t.id !== id) return t;
    const n = { ...t, ...patch, style: { ...t.style, ...(patch.style ?? {}) } };
    n.text = n.text.slice(0, 500);
    n.x = Math.min(1, Math.max(0, n.x)); n.y = Math.min(1, Math.max(0, n.y)); n.scale = Math.min(8, Math.max(0.1, n.scale));
    n.style.size = Math.min(400, Math.max(8, n.style.size));
    return { ...n, ...clampOverlay(p, n.startMs, n.endMs) };
  }) });
}
export function removeText(p: Project, id: string): Project { return touch(p, { texts: p.texts.filter((t) => t.id !== id) }); }
export const textsAt = (p: Project, t: number) => p.texts.filter((x) => t >= x.startMs && t < x.endMs);

/** Move an overlay in time (keeps its length) or move one of its edges. */
export function moveSpan<T extends { startMs: number; endMs: number }>(fps: number, item: T, mode: 'move' | 'start' | 'end', toMs: number): Pick<T, 'startMs' | 'endMs'> {
  const len = item.endMs - item.startMs, v = Math.max(0, snap(toMs, fps));
  if (mode === 'move') return { startMs: v, endMs: v + len };
  if (mode === 'start') return { startMs: Math.min(v, item.endMs - MIN_CLIP_MS), endMs: item.endMs };
  return { startMs: item.startMs, endMs: Math.max(v, item.startMs + MIN_CLIP_MS) };
}

// ───────── audio ─────────
export function addAudio(p: Project, assetId: string, atMs: number, credit?: string): Project {
  const a = p.assets.find((x) => x.id === assetId);
  if (!a || !a.hasAudio) return p;
  const item: AudioItem = { id: uid(), assetId, startMs: Math.max(0, snap(atMs, p.fps)), inMs: 0, outMs: snap(a.durationMs, p.fps), volume: 1, fadeInMs: 0, fadeOutMs: 0, credit };
  return touch(p, { audio: [...p.audio, item] });
}
export const audioEnd = (a: AudioItem) => a.startMs + (a.outMs - a.inMs);
export function updateAudio(p: Project, id: string, patch: Partial<Omit<AudioItem, 'id' | 'assetId'>>): Project {
  return touch(p, { audio: p.audio.map((a) => {
    if (a.id !== id) return a;
    const asset = p.assets.find((x) => x.id === a.assetId);
    const n = { ...a, ...patch };
    n.startMs = Math.max(0, snap(n.startMs, p.fps));
    n.inMs = Math.max(0, snap(n.inMs, p.fps));
    n.outMs = Math.min(asset?.durationMs ?? n.outMs, Math.max(n.inMs + MIN_CLIP_MS, snap(n.outMs, p.fps)));
    n.volume = Math.min(2, Math.max(0, n.volume));
    const len = n.outMs - n.inMs;
    n.fadeInMs = Math.min(len, Math.max(0, n.fadeInMs)); n.fadeOutMs = Math.min(len - n.fadeInMs, Math.max(0, n.fadeOutMs));
    return n;
  }) });
}
/** Trim an audio item's left edge on the timeline: start and in-point move together. */
export function trimAudioStart(p: Project, id: string, toTimelineMs: number): Project {
  const a = p.audio.find((x) => x.id === id); if (!a) return p;
  const d = Math.max(-a.inMs, Math.min(snap(toTimelineMs, p.fps) - a.startMs, a.outMs - a.inMs - MIN_CLIP_MS));
  return updateAudio(p, id, { startMs: a.startMs + d, inMs: a.inMs + d });
}
export function removeAudio(p: Project, id: string): Project { return touch(p, { audio: p.audio.filter((a) => a.id !== id) }); }

// ───────── captions ─────────
export function setCues(p: Project, cues: Cue[], lang?: string): Project {
  const clean = cues.map((c) => ({ ...c, text: c.text.trim().slice(0, 300), startMs: Math.max(0, Math.round(c.startMs)), endMs: Math.max(Math.round(c.startMs) + 100, Math.round(c.endMs)) }))
    .filter((c) => c.text).sort((a, b) => a.startMs - b.startMs);
  return touch(p, { captions: { ...p.captions, cues: clean, lang: lang ?? p.captions.lang } });
}
export function addCue(p: Project, atMs: number, text = 'Nuevo subtítulo'): Project {
  const s = snap(atMs, p.fps);
  return setCues(p, [...p.captions.cues, { id: uid(), startMs: s, endMs: s + 2000, text }]);
}
export function updateCue(p: Project, id: string, patch: Partial<Omit<Cue, 'id'>>): Project {
  return setCues(p, p.captions.cues.map((c) => (c.id === id ? { ...c, ...patch } : c)));
}
export function removeCue(p: Project, id: string): Project { return setCues(p, p.captions.cues.filter((c) => c.id !== id)); }
export function setCaptionStyle(p: Project, patch: Partial<Pick<Captions, 'preset' | 'y'>>): Project {
  return touch(p, { captions: { ...p.captions, ...patch, y: Math.min(0.95, Math.max(0.05, patch.y ?? p.captions.y)) } });
}
export const cueAt = (p: Project, t: number) => p.captions.cues.find((c) => t >= c.startMs && t < c.endMs) ?? null;

/** Duplicate a clip right after itself, a text or audio item right after its end. */
export function duplicate(p: Project, id: string): Project {
  const i = p.clips.findIndex((c) => c.id === id);
  if (i >= 0) { const clips = [...p.clips]; clips.splice(i + 1, 0, { ...p.clips[i], id: uid() }); return touch(p, { clips }); }
  const t = p.texts.find((x) => x.id === id);
  if (t) { const len = t.endMs - t.startMs; return touch(p, { texts: [...p.texts, { ...structuredClone(t), id: uid(), startMs: t.endMs, endMs: t.endMs + len }] }); }
  const a = p.audio.find((x) => x.id === id);
  if (a) return touch(p, { audio: [...p.audio, { ...a, id: uid(), startMs: audioEnd(a) }] });
  return p;
}

/** Move a clip's sound to the audio track (same timing) and mute the clip. Only at normal speed. */
export function detachAudio(p: Project, clipId: string): Project {
  const i = p.clips.findIndex((c) => c.id === clipId); if (i < 0) return p;
  const c = p.clips[i], asset = p.assets.find((a) => a.id === c.assetId);
  if (!asset?.hasAudio || speedOf(c) !== 1) return p;
  const item: AudioItem = { id: uid(), assetId: c.assetId, startMs: starts(p)[i], inMs: c.inMs, outMs: c.outMs, volume: c.volume, fadeInMs: 0, fadeOutMs: 0 };
  return touch(p, { clips: p.clips.map((x) => (x.id === clipId ? { ...x, volume: 0 } : x)), audio: [...p.audio, item] });
}

/** Snap a timeline time to the nearest edge (clips, overlays, extra points like the playhead) within `tol` ms. */
export function snapTime(p: Project, t: number, tol: number, extra: number[] = [], ignoreId?: string): number {
  const pts = [0, ...extra, ...starts(p).flatMap((s, i) => [s, s + clipLength(p.clips[i])]),
    ...p.texts.filter((x) => x.id !== ignoreId).flatMap((x) => [x.startMs, x.endMs]),
    ...p.audio.filter((x) => x.id !== ignoreId).flatMap((x) => [x.startMs, audioEnd(x)]),
    ...p.captions.cues.filter((x) => x.id !== ignoreId).flatMap((x) => [x.startMs, x.endMs])];
  let best = t, d = tol + 1;
  for (const q of pts) { const dd = Math.abs(q - t); if (dd < d) { d = dd; best = q; } }
  return d <= tol ? best : t;
}
