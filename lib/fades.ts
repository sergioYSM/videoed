import type { AudioItem } from './project.ts';
import { audioEnd } from './project.ts';

/** Gain of an audio item at timeline time t (ms), including fades. */
export function gainAt(a: AudioItem, t: number): number {
  const s = a.startMs, e = audioEnd(a);
  if (t < s || t >= e) return 0;
  let g = a.volume;
  if (a.fadeInMs > 0 && t < s + a.fadeInMs) g *= (t - s) / a.fadeInMs;
  if (a.fadeOutMs > 0 && t > e - a.fadeOutMs) g *= (e - t) / a.fadeOutMs;
  return g;
}

/** Program a GainNode with the item's fades, for playback starting at timeline time `from` (ms)
 *  when the context clock reads `ctxAtFrom` (s). */
export function scheduleGain(param: AudioParam, a: AudioItem, from: number, ctxAtFrom: number) {
  const at = (tl: number) => ctxAtFrom + Math.max(0, tl - from) / 1000;
  const e = audioEnd(a);
  param.setValueAtTime(gainAt(a, Math.max(from, a.startMs)), at(Math.max(from, a.startMs)));
  const points = [a.startMs + a.fadeInMs, e - a.fadeOutMs, e].filter((tl) => tl > from);
  for (const tl of points) param.linearRampToValueAtTime(gainAt(a, Math.min(tl, e - 0.001)), at(tl));
}
