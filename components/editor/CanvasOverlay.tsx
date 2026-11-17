'use client';
// Selection box over the preview for text items: click to select, drag to move,
// corner to scale, arrows to nudge. Uses the same layout as the renderer.
import { useEffect, useState } from 'react';
import { useEditor } from '@/store/editor';
import { textsAt, updateText } from '@/lib/project';
import { textBox } from '@/lib/overlays';

export function CanvasOverlay({ canvas }: { canvas: React.RefObject<HTMLCanvasElement | null> }) {
  const p = useEditor((s) => s.project)!;
  const playhead = useEditor((s) => s.playhead), selected = useEditor((s) => s.selected), playing = useEditor((s) => s.playing);
  const [rect, setRect] = useState<DOMRect | null>(null);
  useEffect(() => {
    const el = canvas.current; if (!el) return;
    const ro = new ResizeObserver(() => setRect(el.getBoundingClientRect())); ro.observe(el); setRect(el.getBoundingClientRect());
    const on = () => setRect(el.getBoundingClientRect()); addEventListener('resize', on);
    return () => { ro.disconnect(); removeEventListener('resize', on); };
  }, [canvas]);
  if (!rect || playing || !canvas.current) return null;
  const ctx = canvas.current.getContext('2d')!;
  const W = canvas.current.width, H = canvas.current.height, k = rect.width / W;
  const visible = textsAt(p, playhead);
  const parentRect = canvas.current.parentElement!.getBoundingClientRect();
  const ox = rect.left - parentRect.left, oy = rect.top - parentRect.top;
  const { apply, select, endCoalesce } = useEditor.getState();

  const drag = (e: React.PointerEvent, id: string, mode: 'move' | 'scale') => {
    e.stopPropagation(); select(id);   // no preventDefault: on touch it swallows the click of the next tap (found in e2e)
    const t = p.texts.find((q) => q.id === id)!, x0 = e.clientX, y0 = e.clientY, key = `${mode}-${id}-${Date.now()}`;
    const b = textBox(ctx, W, H, t), half = Math.hypot(b.w, b.h) / 2 * k;
    const move = (ev: PointerEvent) => {
      if (mode === 'move') apply((q) => updateText(q, id, { x: t.x + (ev.clientX - x0) / rect.width, y: t.y + (ev.clientY - y0) / rect.height }), key);
      else { const d = Math.hypot(ev.clientX - (rect.left + t.x * rect.width), ev.clientY - (rect.top + t.y * rect.height)); apply((q) => updateText(q, id, { scale: t.scale * (d / half) }), key); }
    };
    const up = () => { endCoalesce(); removeEventListener('pointermove', move); removeEventListener('pointerup', up); };
    addEventListener('pointermove', move); addEventListener('pointerup', up);
  };

  return (
    <div className="pointer-events-none absolute inset-0">
      {visible.map((t) => {
        const b = textBox(ctx, W, H, t), sel = t.id === selected;
        return (
          <div key={t.id} role="button" tabIndex={0} aria-label={`Texto «${t.text}» en el vídeo. Arrastra para moverlo; flechas para ajustarlo.`} aria-pressed={sel}
            onPointerDown={(e) => drag(e, t.id, 'move')}
            onKeyDown={(e) => {
              const d = e.shiftKey ? 0.05 : 0.005;
              const m = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, -d], ArrowDown: [0, d] }[e.key];
              if (m) { e.preventDefault(); e.stopPropagation(); select(t.id); apply((q) => updateText(q, t.id, { x: t.x + m[0], y: t.y + m[1] }), `nudge-${t.id}`); }
            }}
            className={`pointer-events-auto absolute cursor-move touch-none select-none outline-none ${sel ? 'ring-2 ring-selection' : 'hover:ring-1 hover:ring-focus focus-visible:ring-2 focus-visible:ring-focus'}`}
            style={{ left: ox + b.x * k, top: oy + b.y * k, width: b.w * k, height: b.h * k }}>
            {sel && <span aria-hidden onPointerDown={(e) => drag(e, t.id, 'scale')} className="absolute -bottom-1.5 -right-1.5 h-3 w-3 cursor-nwse-resize touch-none rounded-full border-2 border-selection bg-text [@media(hover:none)]:-bottom-3 [@media(hover:none)]:-right-3 [@media(hover:none)]:h-6 [@media(hover:none)]:w-6" />}
          </div>
        );
      })}
    </div>
  );
}
