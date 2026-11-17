export type ClipKind = 'video' | 'text' | 'caption' | 'audio';
const bg: Record<ClipKind, string> = { video: 'bg-track-video text-track-video-text', text: 'bg-track-text text-track-text-text', caption: 'bg-track-caption text-track-caption-text', audio: 'bg-track-audio text-track-audio-text' };
/** A clip on the timeline. Positioned by the parent (left/width in px). */
export function ClipBlock({ kind, label, left, width, selected, muted, error, dragging, wave, thumbs, fadeIn = 0, fadeOut = 0, describe, id, focusable }: {
  kind: ClipKind; label: string; left: number; width: number; selected?: boolean; muted?: boolean; error?: boolean; dragging?: boolean;
  wave?: number[]; thumbs?: string[]; fadeIn?: number; fadeOut?: number; describe: string; id?: string; focusable?: boolean;
}) {
  return (
    <div role="option" id={id} aria-selected={!!selected} tabIndex={focusable ? 0 : selected ? 0 : -1} aria-label={describe}
      className={`group absolute top-1 bottom-1 overflow-hidden rounded-sm ${bg[kind]} ${selected ? 'shadow-selected z-10' : ''} ${dragging ? 'opacity-90 shadow-pop' : ''} ${error ? 'outline outline-2 outline-danger' : ''} ${muted ? 'stripes' : ''}`}
      style={{ left, width }}>
      {thumbs && <div className="absolute inset-0 flex opacity-60" aria-hidden>{thumbs.map((t, i) => <div key={i} className="h-full flex-1 border-r border-bg/30" style={{ background: t }} />)}</div>}
      {wave && <svg className="absolute inset-x-0 bottom-0 h-3/4 w-full" viewBox={`0 0 ${wave.length} 20`} preserveAspectRatio="none" aria-hidden>
        {wave.map((v, i) => <rect key={i} x={i} y={10 - v * 10} width={0.7} height={Math.max(0.5, v * 20)} fill="var(--color-waveform)" />)}</svg>}
      {fadeIn > 0 && <svg className="absolute left-0 top-0 h-full" width={fadeIn} viewBox="0 0 10 10" preserveAspectRatio="none" aria-hidden><path d="M0 10 L10 0 L0 0Z" fill="var(--color-bg)" opacity=".45" /></svg>}
      {fadeOut > 0 && <svg className="absolute right-0 top-0 h-full" width={fadeOut} viewBox="0 0 10 10" preserveAspectRatio="none" aria-hidden><path d="M10 10 L0 0 L10 0Z" fill="var(--color-bg)" opacity=".45" /></svg>}
      <span className="relative block truncate px-2 pt-0.5 text-2xs font-semibold drop-shadow">{label}</span>
      <span aria-hidden className={`absolute inset-y-0 left-0 w-[var(--trim-handle)] cursor-ew-resize rounded-l-sm bg-text/80 ${selected ? 'block' : 'hidden group-hover:block'}`} />
      <span aria-hidden className={`absolute inset-y-0 right-0 w-[var(--trim-handle)] cursor-ew-resize rounded-r-sm bg-text/80 ${selected ? 'block' : 'hidden group-hover:block'}`} />
    </div>
  );
}
