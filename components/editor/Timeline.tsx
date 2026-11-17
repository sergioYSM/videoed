'use client';
import { useRef, useState } from 'react';
import { Scissors, Trash2, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { useEditor } from '@/store/editor';
import { starts, clipLength, duration, trim, moveClip, split, removeClip, type Clip } from '@/lib/project';
import { ClipBlock } from '@/components/ui/ClipBlock';
import { IconButton } from '@/components/ui/Button';
import { shortDuration } from '@/lib/time';

const PAD = 12; // px before 0:00

export function Timeline({ onSeek, onPause }: { onSeek: (ms: number) => void; onPause: () => void }) {
  const p = useEditor((s) => s.project)!;
  const pps = useEditor((s) => s.pps), playhead = useEditor((s) => s.playhead), selected = useEditor((s) => s.selected);
  const { apply, select, setPps, endCoalesce, notify } = useEditor.getState();
  const scroller = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ from: number; to: number; dx: number } | null>(null);
  const total = duration(p), st = starts(p);
  const x = (ms: number) => PAD + (ms / 1000) * pps;
  const msAt = (clientX: number) => { const r = scroller.current!.getBoundingClientRect(); return Math.max(0, ((clientX - r.left + scroller.current!.scrollLeft - PAD) / pps) * 1000); };
  const width = Math.max(x(total) + 200, 600);
  const step = pps >= 160 ? 1 : pps >= 60 ? 2 : pps >= 25 ? 5 : 15;

  const scrub = (e: React.PointerEvent) => {
    onPause(); onSeek(Math.min(total, msAt(e.clientX)));
    const move = (ev: PointerEvent) => onSeek(Math.min(total, msAt(ev.clientX)));
    const up = () => { removeEventListener('pointermove', move); removeEventListener('pointerup', up); };
    addEventListener('pointermove', move); addEventListener('pointerup', up);
  };

  const startTrim = (e: React.PointerEvent, c: Clip, edge: 'start' | 'end') => {
    e.stopPropagation(); onPause(); select(c.id);
    const x0 = e.clientX, base = edge === 'start' ? c.inMs : c.outMs, key = `trim-${c.id}-${Date.now()}`;
    const move = (ev: PointerEvent) => apply((q) => trim(q, c.id, edge, base + ((ev.clientX - x0) / pps) * 1000), key);
    const up = () => { endCoalesce(); removeEventListener('pointermove', move); removeEventListener('pointerup', up); };
    addEventListener('pointermove', move); addEventListener('pointerup', up);
  };

  const startMove = (e: React.PointerEvent, i: number) => {
    if (e.button !== 0) return;
    onPause(); select(p.clips[i].id);
    const x0 = e.clientX;
    let to = i, moved = false;
    const centers = st.map((s, k) => x(s + clipLength(p.clips[k]) / 2));
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - x0; if (Math.abs(dx) > 4) moved = true;
      const pos = centers[i] + dx; to = centers.filter((c, k) => k !== i && c < pos).length;
      setDrag({ from: i, to, dx });
    };
    const up = () => { removeEventListener('pointermove', move); removeEventListener('pointerup', up); setDrag(null); if (moved && to !== i) { apply((q) => moveClip(q, i, to)); notify('Clip movido', true); } };
    addEventListener('pointermove', move); addEventListener('pointerup', up);
  };

  const dropX = drag && drag.to !== drag.from ? (drag.to >= p.clips.length - 1 && drag.to > drag.from ? x(total) : x(st[drag.to > drag.from ? drag.to + 1 : drag.to] ?? total)) : null;

  return (
    <section aria-label="Línea de tiempo" className="flex h-[var(--timeline-default)] shrink-0 flex-col border-t border-border bg-surface">
      <div className="flex items-center gap-1 border-b border-border px-2 py-1">
        <IconButton label="Cortar en el cabezal (S)" onClick={() => { onPause(); const n = p.clips.length; apply((q) => split(q, playhead)); if (useEditor.getState().project!.clips.length > n) notify('Clip cortado', true); }} disabled={!p.clips.length}><Scissors size={16} /></IconButton>
        <IconButton label="Borrar el clip seleccionado (Supr)" onClick={() => { if (selected) { apply((q) => removeClip(q, selected)); select(null); notify('Clip borrado', true); } }} disabled={!selected}><Trash2 size={16} /></IconButton>
        <span className="mono ml-3 text-xs text-text-muted">{p.clips.length} clips · {shortDuration(total)}</span>
        <div className="ml-auto flex items-center gap-1">
          <IconButton label="Alejar (-)" onClick={() => setPps(pps / 1.25)}><ZoomOut size={16} /></IconButton>
          <IconButton label="Acercar (+)" onClick={() => setPps(pps * 1.25)}><ZoomIn size={16} /></IconButton>
          <IconButton label="Ajustar a la ventana" onClick={() => total && setPps(((scroller.current!.clientWidth - PAD * 2 - 40) / total) * 1000)}><Maximize2 size={16} /></IconButton>
        </div>
      </div>
      <div ref={scroller} className="relative min-h-0 flex-1 overflow-x-auto overflow-y-hidden">
        <div className="relative h-full" style={{ width }}>
          <div className="relative h-6 cursor-pointer border-b border-border" onPointerDown={scrub} aria-label="Regla de tiempo: pulsa o arrastra para mover el cabezal" role="presentation">
            {Array.from({ length: Math.ceil((width - PAD) / pps / step) + 1 }, (_, k) => k * step).map((s) => (
              <span key={s} className="mono absolute top-0.5 select-none border-l border-border pl-1 text-2xs text-text-subtle" style={{ left: x(s * 1000) }}>{shortDuration(s * 1000)}</span>
            ))}
          </div>
          {!p.clips.length && <p className="absolute top-8 flex h-track items-center justify-center rounded-md border-2 border-dashed border-border text-sm text-text-muted" style={{ left: PAD, right: 12 }}>Aquí aparecerán tus clips</p>}
          <div role={p.clips.length ? 'listbox' : undefined} aria-label={p.clips.length ? 'Pista de vídeo' : undefined} aria-orientation={p.clips.length ? 'horizontal' : undefined} className="relative mt-2 h-track" onPointerDown={(e) => { if (e.target === e.currentTarget) { select(null); scrub(e); } }}>
            {p.clips.map((c, i) => {
              const a = p.assets.find((q) => q.id === c.assetId);
              const left = x(st[i]) + (drag?.from === i ? drag.dx : 0), w = Math.max(6, (clipLength(c) / 1000) * pps);
              const label = a?.name ?? 'Archivo no encontrado';
              return (
                <div key={c.id} onPointerDown={(e) => startMove(e, i)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') select(c.id);
                    if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { e.preventDefault(); const to = i + (e.key === 'ArrowLeft' ? -1 : 1); if (to >= 0 && to < p.clips.length) { apply((q) => moveClip(q, i, to)); requestAnimationFrame(() => document.getElementById(`clip-${c.id}`)?.focus()); } }
                    else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); const n = document.getElementById(`clip-${p.clips[i + (e.key === 'ArrowLeft' ? -1 : 1)]?.id}`); n?.focus(); }
                  }}
                  onFocus={() => select(c.id)} className="contents">
                  <ClipBlock id={`clip-${c.id}`} focusable kind="video" label={label} left={left} width={w} selected={selected === c.id} dragging={drag?.from === i} error={!a}
                    thumbs={a?.thumb ? Array.from({ length: Math.max(1, Math.floor(w / 80)) }, () => `center / cover no-repeat url(${a.thumb})`) : undefined}
                    describe={`Clip ${label}, de ${shortDuration(st[i])} a ${shortDuration(st[i] + clipLength(c))}${selected === c.id ? ', seleccionado' : ''}`} />
                  {selected === c.id && <>
                    <span aria-hidden onPointerDown={(e) => startTrim(e, c, 'start')} className="absolute top-1 z-20 h-[calc(100%-8px)] w-3 cursor-ew-resize" style={{ left: left - 2 }} data-trim="start" />
                    <span aria-hidden onPointerDown={(e) => startTrim(e, c, 'end')} className="absolute top-1 z-20 h-[calc(100%-8px)] w-3 cursor-ew-resize" style={{ left: left + w - 10 }} data-trim="end" />
                  </>}
                </div>
              );
            })}
            {dropX !== null && <div className="absolute -top-1 bottom-[-4px] z-30 w-0.5 bg-snap-guide" style={{ left: dropX }} aria-hidden />}
          </div>
          <div className="pointer-events-none absolute inset-y-0 z-30 w-[var(--playhead-width)] bg-playhead" style={{ left: x(playhead) }} aria-hidden>
            <div className="absolute -left-[5px] top-0 h-3 w-3 rotate-45 bg-playhead" />
          </div>
        </div>
      </div>
    </section>
  );
}
