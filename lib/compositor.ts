// The single drawing function used by preview AND export (what you see is what you export).
import type { Clip } from './project.ts';
export type Drawable = CanvasImageSource & { width: number; height: number };
type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

/** 0..1 visibility of a clip at `localMs` since it started (fade from/to black). */
export function clipFade(c: Clip | null, localMs: number, lengthMs: number): number {
  if (!c) return 1;
  let a = 1;
  if (c.fadeInMs && localMs < c.fadeInMs) a = Math.min(a, Math.max(0, localMs / c.fadeInMs));
  if (c.fadeOutMs && localMs > lengthMs - c.fadeOutMs) a = Math.min(a, Math.max(0, (lengthMs - localMs) / c.fadeOutMs));
  return a;
}

/** Canvas filters (Chrome, Edge, Firefox; Safari ignores them: the frame is drawn unadjusted). */
const filterOf = (c: Clip | null) => {
  const a = c?.adjust; if (!a) return 'none';
  return a.brightness === 1 && a.contrast === 1 && a.saturation === 1 ? 'none' : `brightness(${a.brightness}) contrast(${a.contrast}) saturate(${a.saturation})`;
};

export function drawFrame(ctx: Ctx, W: number, H: number, img: Drawable | null, fit: 'fill' | 'fit', clip: Clip | null = null, alpha = 1) {
  ctx.save();
  ctx.fillStyle = '#000';               // letterbox colour: the canvas-bg token
  ctx.fillRect(0, 0, W, H);
  if (img && img.width && img.height) {
    const f = filterOf(clip);
    if (fit === 'fit' && clip?.bg === 'blur') {
      // blurred, darkened copy filling the frame behind the fitted image
      const sc = Math.max(W / img.width, H / img.height) * 1.1, bw = img.width * sc, bh = img.height * sc;
      ctx.filter = `blur(${Math.round(Math.min(W, H) / 30)}px) brightness(0.65)${f === 'none' ? '' : ' ' + f}`;
      ctx.drawImage(img, (W - bw) / 2, (H - bh) / 2, bw, bh);
    }
    ctx.filter = f;
    const s = fit === 'fill' ? Math.max(W / img.width, H / img.height) : Math.min(W / img.width, H / img.height);
    const w = img.width * s, h = img.height * s;
    ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
    ctx.filter = 'none';
  }
  if (alpha < 1) { ctx.globalAlpha = 1 - alpha; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); }
  ctx.restore();
}
