'use client';
import { useRef, useState } from 'react';
/** Horizontal slider: pointer drag + arrow keys (Shift = 10x). */
export function Slider({ value, min = 0, max, step, onChange, label, valueText, disabled, className = '' }: {
  value: number; min?: number; max: number; step: number; onChange: (v: number) => void; label: string; valueText?: string; disabled?: boolean; className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState(false);
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
  const clamp = (n: number) => Math.min(max, Math.max(min, Math.round(n / step) * step));
  const at = (x: number) => { const r = ref.current!.getBoundingClientRect(); return clamp(min + ((x - r.left) / r.width) * (max - min)); };
  return (
    <div ref={ref} role="slider" tabIndex={disabled ? -1 : 0} aria-label={label} aria-valuemin={min} aria-valuemax={max} aria-valuenow={value} aria-valuetext={valueText} aria-disabled={disabled}
      className={`group relative flex h-5 cursor-pointer touch-none items-center ${disabled ? 'pointer-events-none opacity-40' : ''} ${className}`}
      onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture(e.pointerId); setDrag(true); onChange(at(e.clientX)); }}
      onPointerMove={(e) => drag && onChange(at(e.clientX))}
      onPointerUp={() => setDrag(false)}
      onKeyDown={(e) => {
        const k = e.shiftKey ? step * 10 : step;
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); onChange(clamp(value + k)); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); onChange(clamp(value - k)); }
        if (e.key === 'Home') onChange(min); if (e.key === 'End') onChange(max);
      }}>
      <div className="relative h-1 w-full rounded-full bg-surface-active"><div className="absolute inset-y-0 left-0 rounded-full bg-accent" style={{ width: `${pct}%` }} /></div>
      <div className={`absolute h-3 w-3 -translate-x-1/2 rounded-full bg-text shadow-pop ${drag ? 'scale-125' : ''}`} style={{ left: `${pct}%` }} />
    </div>
  );
}
