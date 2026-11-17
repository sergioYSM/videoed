'use client';
import { ClipBlock, type ClipKind } from '@/components/ui/ClipBlock';
import { shortDuration } from '@/lib/time';

export interface OverlayItem { id: string; startMs: number; endMs: number; label: string }

/** A track of items at absolute times (text, captions, audio): select, drag to move, drag edges to trim. */
export function OverlayTrack({ kind, name, items, height, x, pps, selected, onSelect, onDrag, onDragEnd, onKeyMove, extra }: {
  kind: ClipKind; name: string; items: OverlayItem[]; height: number; x: (ms: number) => number; pps: number; selected: string | null;
  onSelect: (id: string | null) => void;
  onDrag: (id: string, mode: 'move' | 'start' | 'end', deltaMs: number, key: string) => void;
  onDragEnd: () => void;
  onKeyMove: (id: string, deltaMs: number) => void;
  extra?: (it: OverlayItem) => Partial<React.ComponentProps<typeof ClipBlock>>;
}) {
  const begin = (e: React.PointerEvent, id: string, mode: 'move' | 'start' | 'end') => {
    e.stopPropagation(); if (e.button !== 0) return; onSelect(id);
    const x0 = e.clientX, key = `${mode}-${id}-${Date.now()}`;
    const move = (ev: PointerEvent) => onDrag(id, mode, ((ev.clientX - x0) / pps) * 1000, key);
    const up = () => { onDragEnd(); removeEventListener('pointermove', move); removeEventListener('pointerup', up); };
    addEventListener('pointermove', move); addEventListener('pointerup', up);
  };
  return (
    <div className="relative border-b border-border" style={{ height }}>
      {items.length === 0 && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-2xs text-text-subtle">{name}: vacía</span>}
      {items.length > 0 && (
        <div role="listbox" aria-label={`Pista de ${name.toLowerCase()}`} aria-orientation="horizontal" className="absolute inset-0">
          {items.map((it) => {
            const left = x(it.startMs), w = Math.max(6, ((it.endMs - it.startMs) / 1000) * pps);
            return (
              <div key={it.id} className="contents" onPointerDown={(e) => begin(e, it.id, 'move')} onFocus={() => onSelect(it.id)}
                onKeyDown={(e) => { if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { e.preventDefault(); onKeyMove(it.id, (e.key === 'ArrowLeft' ? -1 : 1) * (e.shiftKey ? 1000 : 100)); } }}>
                <ClipBlock id={`ov-${it.id}`} focusable kind={kind} label={it.label} left={left} width={w} selected={selected === it.id}
                  describe={`${name} «${it.label}», de ${shortDuration(it.startMs)} a ${shortDuration(it.endMs)}${selected === it.id ? ', seleccionado' : ''}. Alt+flechas para moverlo.`} {...extra?.(it)} />
                {selected === it.id && <>
                  <span aria-hidden onPointerDown={(e) => begin(e, it.id, 'start')} className="absolute top-1 z-20 h-[calc(100%-8px)] w-3 cursor-ew-resize touch-none [@media(hover:none)]:w-6" style={{ left: left - 2 }} />
                  <span aria-hidden onPointerDown={(e) => begin(e, it.id, 'end')} className="absolute top-1 z-20 h-[calc(100%-8px)] w-3 cursor-ew-resize touch-none [@media(hover:none)]:w-6" style={{ left: left + w - 10 }} />
                </>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
