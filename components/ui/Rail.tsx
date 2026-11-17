'use client';
import { Film, Type, Captions, Music } from 'lucide-react';
export type RailTab = 'media' | 'text' | 'captions' | 'audio';
const tabs: { id: RailTab; label: string; Icon: typeof Film }[] = [
  { id: 'media', label: 'Medios', Icon: Film }, { id: 'text', label: 'Texto', Icon: Type },
  { id: 'captions', label: 'Subtítulos', Icon: Captions }, { id: 'audio', label: 'Audio', Icon: Music },
];
export function Rail({ active, onChange }: { active: RailTab; onChange: (t: RailTab) => void }) {
  return (
    <div role="tablist" aria-orientation="vertical" aria-label="Paneles" className="flex w-rail flex-col items-stretch gap-1 border-r border-border bg-surface py-2"
      onKeyDown={(e) => {
        const i = tabs.findIndex((t) => t.id === active);
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const n = tabs[(i + (e.key === 'ArrowDown' ? 1 : tabs.length - 1)) % tabs.length]; onChange(n.id); document.getElementById(`rail-${n.id}`)?.focus(); }
      }}>
      {tabs.map(({ id, label, Icon }) => (
        <button key={id} id={`rail-${id}`} role="tab" aria-selected={active === id} aria-controls={`panel-${id}`} tabIndex={active === id ? 0 : -1} onClick={() => onChange(id)}
          className={`relative mx-1 flex flex-col items-center gap-1 rounded-md py-2 text-2xs ${active === id ? 'bg-surface-raised text-text' : 'text-text-muted hover:bg-surface-hover hover:text-text'}`}>
          {active === id && <span className="absolute left-0 top-2 h-[calc(100%-16px)] w-[3px] rounded-full bg-accent" aria-hidden />}
          <Icon size={20} aria-hidden />{label}
        </button>
      ))}
    </div>
  );
}
