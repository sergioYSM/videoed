/** 83.5 s at 30 fps -> "1:23.15" (m:ss.ff); with hours when needed. Integer math, no float drift. */
export function timecode(ms: number, fps = 30): string {
  const totalFrames = Math.max(0, Math.round((ms * fps) / 1000));
  const ff = totalFrames % fps, totalS = Math.floor(totalFrames / fps);
  const s = totalS % 60, m = Math.floor(totalS / 60) % 60, h = Math.floor(totalS / 3600);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${h ? `${h}:${p(m)}` : m}:${p(s)}.${p(ff)}`;
}
export const shortDuration = (ms: number) => { const s = Math.round(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
