// Text and caption drawing, shared by preview and export. Sizes are in "design
// pixels" for a 1080-px short side, scaled to the real canvas.
import type { Project, TextItem, CaptionPreset, TextStyle } from './project.ts';
import { textsAt, cueAt } from './project.ts';

type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
export const unit = (W: number, H: number) => Math.min(W, H) / 1080;

const CAPTION: Record<CaptionPreset, TextStyle & { upper?: boolean }> = {
  clasico: { font: 'Figtree', size: 60, color: '#ffffff', stroke: '#000000', bg: null, weight: 700, align: 'center' },
  caja: { font: 'Figtree', size: 54, color: '#ffffff', stroke: null, bg: 'rgba(0,0,0,0.72)', weight: 700, align: 'center' },
  grande: { font: 'Anton', size: 92, color: '#ffd400', stroke: '#000000', bg: null, weight: 400, align: 'center', upper: true },
  karaoke: { font: 'Montserrat', size: 66, color: '#ffffff', stroke: '#000000', bg: null, weight: 900, align: 'center', upper: true },
};
const KARAOKE_ON = '#ffd400';
const ANIM_MS = 350;
const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
const easeBack = (x: number) => { const c = 1.7, y = Math.min(1, Math.max(0, x)) - 1; return 1 + (c + 1) * y * y * y + c * y * y; };

/** Words of a cue with the time each one is spoken (proportional to its length: no word timings yet). */
export function wordTimes(text: string, startMs: number, endMs: number): { w: string; t0: number; t1: number }[] {
  const words = text.split(/\s+/).filter(Boolean);
  const weights = words.map((w) => Math.max(2, w.length)), total = weights.reduce((a, b) => a + b, 0) || 1;
  let t = startMs;
  return words.map((w, i) => { const d = ((endMs - startMs) * weights[i]) / total; const r = { w, t0: t, t1: t + d }; t += d; return r; });
}

function drawKaraoke(ctx: Ctx, W: number, H: number, text: string, startMs: number, endMs: number, t: number, cy: number) {
  const st = CAPTION.karaoke, k = unit(W, H), size = st.size * k;
  ctx.font = `${st.weight} ${size}px "${st.font}", sans-serif`; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  const words = wordTimes(text.toUpperCase(), startMs, endMs), space = ctx.measureText(' ').width, maxW = W * 0.84;
  const lines: (typeof words)[] = [[]]; let lw = 0;
  for (const w of words) { const ww = ctx.measureText(w.w).width; if (lw + ww > maxW && lines[lines.length - 1].length) { lines.push([]); lw = 0; } lines[lines.length - 1].push(w); lw += ww + space; }
  const lh = size * 1.18, top = cy - (lines.length * lh) / 2 + lh / 2;
  lines.forEach((line, li) => {
    const total = line.reduce((a, w) => a + ctx.measureText(w.w).width, 0) + space * (line.length - 1);
    let x = W / 2 - total / 2; const y = top + li * lh;
    for (const w of line) {
      const on = t >= w.t0 && t < w.t1, ww = ctx.measureText(w.w).width;
      ctx.save();
      if (on) { ctx.translate(x + ww / 2, y); ctx.scale(1.08, 1.08); ctx.translate(-(x + ww / 2), -y); }
      ctx.lineJoin = 'round'; ctx.lineWidth = size * 0.16; ctx.strokeStyle = st.stroke!; ctx.strokeText(w.w, x, y);
      ctx.fillStyle = on ? KARAOKE_ON : st.color; ctx.fillText(w.w, x, y);
      ctx.restore();
      x += ww + space;
    }
  });
}

function wrap(ctx: Ctx, text: string, maxW: number): string[] {
  const out: string[] = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const word of para.split(/\s+/)) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxW && line) { out.push(line); line = word; } else line = test;
    }
    out.push(line);
  }
  return out;
}

export interface TextBox { x: number; y: number; w: number; h: number }

/** Lay out (and optionally draw) a block of text centred at (cx, cy). Returns its box. */
export function textBlock(ctx: Ctx, W: number, H: number, text: string, style: TextStyle, cx: number, cy: number, scale: number, draw: boolean, maxWFrac = 0.9): TextBox {
  const k = unit(W, H) * scale, size = style.size * k;
  ctx.font = `${style.weight} ${size}px "${style.font}", sans-serif`;
  ctx.textBaseline = 'middle';
  const lines = wrap(ctx, text, W * maxWFrac);
  const lh = size * 1.15, padX = style.bg ? size * 0.35 : 0, padY = style.bg ? size * 0.15 : 0;
  const widths = lines.map((l) => ctx.measureText(l).width);
  const w = Math.max(1, ...widths) + padX * 2, h = lines.length * lh + padY * 2;
  const box = { x: cx - w / 2, y: cy - h / 2, w, h };
  if (!draw) return box;
  lines.forEach((l, i) => {
    const lw = widths[i];
    const lx = style.align === 'left' ? box.x + padX : style.align === 'right' ? box.x + w - padX - lw : cx - lw / 2;
    const ly = box.y + padY + lh * (i + 0.5);
    if (style.bg) { ctx.fillStyle = style.bg; const r = size * 0.18; roundRect(ctx, lx - padX, ly - lh / 2, lw + padX * 2, lh, r); }
    if (style.stroke) { ctx.lineJoin = 'round'; ctx.lineWidth = size * 0.14; ctx.strokeStyle = style.stroke; ctx.strokeText(l, lx, ly); }
    ctx.fillStyle = style.color; ctx.textAlign = 'left'; ctx.fillText(l, lx, ly);
  });
  return box;
}
function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); }

export function textBox(ctx: Ctx, W: number, H: number, t: TextItem): TextBox {
  return textBlock(ctx, W, H, t.text, t.style, t.x * W, t.y * H, t.scale, false);
}

/** Draw every overlay visible at time t (texts in order, captions on top). */
export function drawOverlays(ctx: Ctx, W: number, H: number, p: Project, t: number) {
  for (const x of textsAt(p, t)) {
    const inP = (t - x.startMs) / ANIM_MS, outP = (x.endMs - t) / ANIM_MS;
    let text = x.text, alpha = 1, scale = x.scale, dy = 0;
    switch (x.anim ?? 'none') {
      case 'fade': alpha = Math.min(1, inP, outP); break;
      case 'pop': alpha = Math.min(1, inP * 2, outP); scale *= 0.6 + 0.4 * easeBack(inP); break;
      case 'slide': alpha = Math.min(1, inP, outP); dy = (1 - ease(Math.min(inP, outP))) * H * 0.05; break;
      case 'type': { const per = Math.max(30, Math.min(80, 1200 / Math.max(1, x.text.length))); text = x.text.slice(0, Math.ceil((t - x.startMs) / per)); break; }
    }
    if (!text || alpha <= 0) continue;
    ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    textBlock(ctx, W, H, text, x.style, x.x * W, x.y * H + dy, scale, true);
    ctx.restore();
  }
  const cue = cueAt(p, t);
  if (cue && p.captions.preset === 'karaoke') { drawKaraoke(ctx, W, H, cue.text, cue.startMs, cue.endMs, t, p.captions.y * H); return; }
  if (cue) {
    const st = CAPTION[p.captions.preset];
    textBlock(ctx, W, H, st.upper ? cue.text.toUpperCase() : cue.text, st, W / 2, p.captions.y * H, 1, true, 0.84);
  }
}

/** Make sure every font used is loaded before drawing (canvas does not wait for fonts). */
export async function ensureFonts(p: Project) {
  if (typeof document === 'undefined') return;
  const specs = new Set<string>([...p.texts.map((t) => `${t.style.weight} 40px "${t.style.font}"`), '700 40px "Figtree"', '400 40px "Anton"', '900 40px "Montserrat"']);
  await Promise.all([...specs].map((s) => document.fonts.load(s).catch(() => [])));
}
