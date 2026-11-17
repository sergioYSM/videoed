'use client';
import { useId, useState, useEffect } from 'react';
import { Slider } from './Slider';
/** Label + slider + number input with a unit. Typing commits on Enter/blur; invalid input reverts. */
export function NumberField({ label, value, min, max, step, unit, onChange, disabled }: { label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void; disabled?: boolean }) {
  const id = useId();
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  const commit = () => { const n = Number(text.replace(',', '.')); if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n))); else setText(String(value)); };
  return (
    <div className="grid grid-cols-[88px_1fr_64px] items-center gap-3">
      <label htmlFor={id} className="truncate text-sm text-text-muted">{label}</label>
      <Slider label={label} value={value} min={min} max={max} step={step} onChange={onChange} valueText={`${value} ${unit}`} disabled={disabled} />
      <div className="flex items-center rounded-sm border border-border-input bg-surface-raised focus-within:border-focus">
        <input id={id} inputMode="decimal" value={text} disabled={disabled} onChange={(e) => setText(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === 'Enter' && commit()}
          className="mono w-full bg-transparent px-1.5 py-1 text-right text-sm focus:outline-none" />
        <span className="pr-1.5 text-2xs text-text-subtle">{unit}</span>
      </div>
    </div>
  );
}
