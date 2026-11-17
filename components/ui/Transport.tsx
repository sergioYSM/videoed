'use client';
import { Pause, Play, StepBack, StepForward, Maximize } from 'lucide-react';
import { IconButton } from './Button';
import { timecode } from '@/lib/time';
export function Transport({ playing, timeMs, durationMs, fps, onToggle, onStep }: { playing: boolean; timeMs: number; durationMs: number; fps: number; onToggle: () => void; onStep: (d: -1 | 1) => void }) {
  return (
    <div className="flex items-center justify-center gap-2 border-t border-border bg-surface px-3 py-1.5">
      <span className="mono w-24 text-right text-sm">{timecode(timeMs, fps)}</span>
      <IconButton label="Fotograma anterior" onClick={() => onStep(-1)}><StepBack size={16} /></IconButton>
      <button type="button" onClick={onToggle} aria-label={playing ? 'Pausar' : 'Reproducir'} className="flex h-8 w-8 items-center justify-center rounded-full bg-text text-bg hover:scale-105">
        {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
      </button>
      <IconButton label="Fotograma siguiente" onClick={() => onStep(1)}><StepForward size={16} /></IconButton>
      <span className="mono w-24 text-sm text-text-subtle">{timecode(durationMs, fps)}</span>
      <IconButton label="Pantalla completa" className="ml-4"><Maximize size={16} /></IconButton>
    </div>
  );
}
