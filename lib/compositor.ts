// The single drawing function used by preview AND export (what you see is what you export).
export type Drawable = CanvasImageSource & { width: number; height: number };

export function drawFrame(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, W: number, H: number, img: Drawable | null, fit: 'fill' | 'fit') {
  ctx.fillStyle = '#000';               // letterbox colour: the canvas-bg token
  ctx.fillRect(0, 0, W, H);
  if (!img || !img.width || !img.height) return;
  const s = fit === 'fill' ? Math.max(W / img.width, H / img.height) : Math.min(W / img.width, H / img.height);
  const w = img.width * s, h = img.height * s;
  ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
}
