// SubRip (.srt) import/export for captions.
import type { Cue } from './project';

const ts = (ms: number) => {
  const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60, r = Math.round(ms % 1000);
  const p = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${p(h)}:${p(m)}:${p(s)},${p(r, 3)}`;
};
export function toSrt(cues: Cue[]): string {
  return cues.map((c, i) => `${i + 1}\n${ts(c.startMs)} --> ${ts(c.endMs)}\n${c.text}\n`).join('\n');
}
const parseTs = (t: string) => { const m = t.trim().match(/^(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})$/); if (!m) return NaN; return ((+m[1] * 60 + +m[2]) * 60 + +m[3]) * 1000 + +m[4].padEnd(3, '0'); };
export function fromSrt(text: string, uid: () => string): Cue[] {
  const out: Cue[] = [];
  for (const block of text.replace(/\r/g, '').replace(/^﻿/, '').split(/\n{2,}/)) {
    const lines = block.trim().split('\n');
    const i = lines.findIndex((l) => l.includes('-->'));
    if (i < 0) continue;
    const [a, b] = lines[i].split('-->');
    const startMs = parseTs(a), endMs = parseTs(b.split(/\s/).filter(Boolean)[0] ?? '');
    const body = lines.slice(i + 1).join('\n').replace(/<[^>]+>/g, '').trim();
    if (Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs && body) out.push({ id: uid(), startMs, endMs, text: body });
  }
  return out;
}
