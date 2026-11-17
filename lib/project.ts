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
/** A clip on the main track. Main track is magnetic: clips play back to back, no gaps. */
export interface Clip { id: string; assetId: string; inMs: number; outMs: number; fit: 'fill' | 'fit'; volume: number }
export interface Project {
  id: string; name: string; aspect: Aspect; width: number; height: number; fps: number;
  createdAt: number; updatedAt: number; assets: AssetRef[]; clips: Clip[];
}

export const MIN_CLIP_MS = 100;
const uid = () => (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2));
export const frameMs = (fps: number) => 1000 / fps;
/** Snap to the nearest frame boundary of the project. */
export const snap = (ms: number, fps: number) => Math.round(Math.round((ms * fps) / 1000) * (1000 / fps));
const touch = (p: Project, patch: Partial<Project>): Project => ({ ...p, ...patch, updatedAt: Date.now() });

export function createProject(aspect: Aspect, name = 'Proyecto sin título', fps = 30): Project {
  const now = Date.now();
  return { id: uid(), name, aspect, ...SIZES[aspect], fps, createdAt: now, updatedAt: now, assets: [], clips: [] };
}

export const clipLength = (c: Clip) => c.outMs - c.inMs;
export const duration = (p: Project) => p.clips.reduce((s, c) => s + clipLength(c), 0);
/** Start time of each clip on the timeline. */
export function starts(p: Project): number[] { const r: number[] = []; let t = 0; for (const c of p.clips) { r.push(t); t += clipLength(c); } return r; }

/** Which clip plays at timeline time t, and where in its source. */
export function locate(p: Project, t: number): { index: number; clip: Clip; sourceMs: number; startMs: number } | null {
  let s = 0;
  for (let i = 0; i < p.clips.length; i++) {
    const c = p.clips[i], len = clipLength(c);
    if (t < s + len || (i === p.clips.length - 1 && t === s + len)) return { index: i, clip: c, sourceMs: c.inMs + Math.min(t - s, len), startMs: s };
    s += len;
  }
  return null;
}

export function rename(p: Project, name: string): Project { return touch(p, { name: name.trim().slice(0, 120) || p.name }); }
export function addAsset(p: Project, a: AssetRef): Project { return touch(p, { assets: [...p.assets, a] }); }
export function removeAsset(p: Project, assetId: string): Project {
  return touch(p, { assets: p.assets.filter((a) => a.id !== assetId), clips: p.clips.filter((c) => c.assetId !== assetId) });
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

export function setClip(p: Project, clipId: string, patch: Partial<Pick<Clip, 'fit' | 'volume'>>): Project {
  return touch(p, { clips: p.clips.map((c) => (c.id === clipId ? { ...c, ...patch } : c)) });
}
