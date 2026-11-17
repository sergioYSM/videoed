// Text and caption drawing, shared by preview and export. Sizes are in "design
// pixels" for a 1080-px short side, scaled to the real canvas.
import type { Project, TextItem, CaptionPreset, TextStyle } from './project';
import { textsAt, cueAt } from './project';

type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
export const unit = (W: number, H: number) => Math.min(W, H) / 1080;

const CAPTION: Record<CaptionPreset, TextStyle & { upper?: boolean }> = {
  clasico: { font: 'Figtree', size: 60, color: '#ffffff', stroke: '#000000', bg: null, weight: 700, align: 'center' },
  caja: { font: 'Figtree', size: 54, color: '#ffffff', stroke: null, bg: 'rgba(0,0,0,0.72)', weight: 700, align: 'center' },
  grande: { font: 'Anton', size: 92, color: '#ffd400', stroke: '#000000', bg: null, weight: 400, align: 'center', upper: true },
};

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
  for (const x of textsAt(p, t)) textBlock(ctx, W, H, x.text, x.style, x.x * W, x.y * H, x.scale, true);
  const cue = cueAt(p, t);
  if (cue) {
    const st = CAPTION[p.captions.preset];
    textBlock(ctx, W, H, st.upper ? cue.text.toUpperCase() : cue.text, st, W / 2, p.captions.y * H, 1, true, 0.84);
  }
}

/** Make sure every font used is loaded before drawing (canvas does not wait for fonts). */
export async function ensureFonts(p: Project) {
  if (typeof document === 'undefined') return;
  const specs = new Set<string>([...p.texts.map((t) => `${t.style.weight} 40px "${t.style.font}"`), '700 40px "Figtree"', '400 40px "Anton"']);
  await Promise.all([...specs].map((s) => document.fonts.load(s).catch(() => [])));
}
