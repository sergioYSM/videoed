import { Film, Music, Image as ImageIcon, AlertTriangle, Loader2 } from 'lucide-react';
import { shortDuration } from '@/lib/time';
export function MediaTile({ name, kind, durationMs, thumb, state = 'ready', used, selected, reason }: {
  name: string; kind: 'video' | 'audio' | 'image'; durationMs?: number; thumb?: string; state?: 'importing' | 'ready' | 'error'; used?: boolean; selected?: boolean; reason?: string;
}) {
  const Icon = kind === 'video' ? Film : kind === 'audio' ? Music : ImageIcon;
  const label = `${name}, ${kind === 'video' ? 'vídeo' : kind === 'audio' ? 'audio' : 'imagen'}${durationMs ? `, ${shortDuration(durationMs)}` : ''}${state === 'error' ? ', error' : ''}`;
  return (
    <div role="option" tabIndex={0} aria-label={label} aria-selected={!!selected}
      className={`group rounded-md p-1 outline-none hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-focus ${selected ? 'bg-surface-hover ring-2 ring-selection' : ''}`}>
      <div className="relative aspect-video overflow-hidden rounded-sm bg-surface-active" style={thumb ? { background: thumb } : undefined}>
        <Icon size={18} className="absolute left-1.5 top-1.5 text-text" aria-hidden />
        {durationMs !== undefined && <span className="mono absolute bottom-1 right-1 rounded-xs bg-bg/80 px-1 text-2xs">{shortDuration(durationMs)}</span>}
        {used && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent" aria-hidden />}
        {state === 'importing' && <div className="absolute inset-0 flex items-center justify-center bg-bg/60"><Loader2 size={20} className="animate-spin" aria-hidden /></div>}
        {state === 'error' && <div className="absolute inset-0 flex items-center justify-center bg-bg/70 text-danger" title={reason}><AlertTriangle size={20} aria-hidden /></div>}
      </div>
      <div className="mt-1 truncate px-0.5 text-xs text-text-muted" title={name}>{name}</div>
    </div>
  );
}
