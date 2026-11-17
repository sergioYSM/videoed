'use client';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Engine } from '@/lib/engine';
import { duration } from '@/lib/project';
import { useEditor } from '@/store/editor';
import { Transport } from '@/components/ui/Transport';
import { CanvasOverlay } from './CanvasOverlay';

export interface PreviewHandle { toggle: () => void; pause: () => void; seek: (ms: number) => void }

/** Preview renders at half the export size (fast), same drawing code as export. */
export const Preview = forwardRef<PreviewHandle, { projectId: string }>(function Preview({ projectId }, ref) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<Engine | null>(null);
  const p = useEditor((s) => s.project)!;
  const playhead = useEditor((s) => s.playhead);
  const playing = useEditor((s) => s.playing);
  const W = Math.round(p.width / 2), H = Math.round(p.height / 2);

  useEffect(() => {
    const e = new Engine(canvas.current!, projectId, useEditor.getState().project!);
    e.onTime = (ms) => useEditor.getState().setPlayhead(ms);
    e.onEnded = () => useEditor.getState().setPlaying(false);
    engine.current = e; e.seek(useEditor.getState().playhead);
    const unsub = useEditor.subscribe((s, prev) => {
      if (s.project && s.project !== prev.project) {
        const total = duration(s.project);
        if (s.playhead > total) s.setPlayhead(total);
        e.setProject(s.project);
        if (!e.isPlaying()) e.seek(Math.min(s.playhead, total));
      }
    });
    return () => { unsub(); e.destroy(); };
  }, [projectId]);

  const api: PreviewHandle = {
    toggle: () => { const e = engine.current!; if (e.isPlaying()) api.pause(); else { e.play(useEditor.getState().playhead); useEditor.getState().setPlaying(true); } },
    pause: () => { engine.current?.pause(); useEditor.getState().setPlaying(false); },
    seek: (ms) => { const e = engine.current!; const t = Math.max(0, Math.min(ms, duration(useEditor.getState().project!))); useEditor.getState().setPlayhead(t); if (e.isPlaying()) { e.pause(); e.play(t); } else e.seek(t); },
  };
  useImperativeHandle(ref, () => api);

  return (
    <section aria-label="Vista previa" className="flex min-w-0 flex-1 flex-col bg-bg">
      <div className="relative flex min-h-0 flex-1 items-center justify-center p-4">
        <canvas ref={canvas} width={W} height={H} className="max-h-full max-w-full bg-canvas-bg shadow-pop" style={{ aspectRatio: `${p.width} / ${p.height}` }}
          role="img" aria-label={p.clips.length ? 'Fotograma actual del vídeo' : 'Vista previa vacía'} />
        <CanvasOverlay canvas={canvas} />
        {!p.clips.length && <p className="absolute text-center text-sm text-text-muted">Importa vídeos desde el panel <b>Medios</b> para empezar.</p>}
      </div>
      <Transport playing={playing} timeMs={playhead} durationMs={duration(p)} fps={p.fps} onToggle={api.toggle} onStep={(d) => { api.pause(); api.seek(playhead + (d * 1000) / p.fps); }} />
    </section>
  );
});
