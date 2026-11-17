'use client';
import { useRef, useState } from 'react';
import { Play, Pause, Plus, BadgeCheck } from 'lucide-react';
import { useEditor } from '@/store/editor';
import { addAsset, addAudio } from '@/lib/project';
import { MUSIC, creditFor, type MusicTrack } from '@/lib/music';
import { importOne } from '@/lib/importFile';
import { shortDuration } from '@/lib/time';
import { IconButton } from '@/components/ui/Button';

export function AudioPanel({ projectId }: { projectId: string }) {
  const p = useEditor((s) => s.project)!;
  const [busy, setBusy] = useState<string | null>(null);
  const [listening, setListening] = useState<string | null>(null);
  const player = useRef<HTMLAudioElement | null>(null);
  const own = p.assets.filter((a) => a.kind === 'audio' || (a.kind === 'video' && a.hasAudio));

  const preview = (m: MusicTrack) => {
    player.current?.pause();
    if (listening === m.id) { setListening(null); return; }
    player.current = new Audio(m.file); player.current.volume = 0.6; player.current.play().catch(() => {}); setListening(m.id);
    player.current.onended = () => setListening(null);
  };
  const add = async (m: MusicTrack) => {
    setBusy(m.id);
    try {
      const s = useEditor.getState();
      let asset = s.project!.assets.find((a) => a.name === `${m.title} — ${m.artist}.mp3`);
      if (!asset) {
        const blob = await (await fetch(m.file)).blob();
        asset = await importOne(projectId, new File([blob], `${m.title} — ${m.artist}.mp3`, { type: 'audio/mpeg' }));
        const a = asset; s.apply((q) => addAsset(q, a));
      }
      const id = asset.id;
      s.apply((q) => addAudio(q, id, s.playhead, creditFor(m)));
      s.select(useEditor.getState().project!.audio.at(-1)!.id);
      s.notify('Música añadida en el cabezal');
    } catch { useEditor.getState().notify('No se ha podido añadir esta canción.'); }
    setBusy(null);
  };

  return (
    <div>
      <h2 className="mb-1 font-semibold">Audio</h2>
      <p className="mb-3 text-xs text-text-muted">Música con licencia de Clipsong (catálogo de demostración). El crédito se copia al exportar.</p>
      <ul className="space-y-1" aria-label="Música">
        {MUSIC.map((m) => (
          <li key={m.id} className="flex items-center gap-2 rounded-md p-1.5 hover:bg-surface-hover">
            <IconButton label={listening === m.id ? `Parar ${m.title}` : `Escuchar ${m.title}`} onClick={() => preview(m)}>{listening === m.id ? <Pause size={14} /> : <Play size={14} />}</IconButton>
            <div className="min-w-0 flex-1"><p className="truncate text-sm">{m.title}</p><p className="truncate text-xs text-text-muted">{m.artist} · {shortDuration(m.durationMs)}</p></div>
            {m.monetizable && <span title={`${m.licence}: apta para vídeos monetizados`} className="text-success"><BadgeCheck size={16} aria-label="Apta para monetizar" /></span>}
            <IconButton label={`Añadir ${m.title} en el cabezal`} onClick={() => add(m)} disabled={busy === m.id}><Plus size={16} /></IconButton>
          </li>
        ))}
      </ul>
      {own.length > 0 && <>
        <h3 className="mb-1 mt-4 text-sm font-semibold">Tus archivos</h3>
        <ul className="space-y-1" aria-label="Tus archivos de audio">
          {own.map((a) => (
            <li key={a.id} className="flex items-center gap-2 rounded-md p-1.5 hover:bg-surface-hover">
              <div className="min-w-0 flex-1"><p className="truncate text-sm">{a.name}</p><p className="text-xs text-text-muted">{a.kind === 'video' ? 'Audio del vídeo' : 'Audio'} · {shortDuration(a.durationMs)}</p></div>
              <IconButton label={`Añadir el audio de ${a.name} en el cabezal`} onClick={() => { const s = useEditor.getState(); s.apply((q) => addAudio(q, a.id, s.playhead)); }}><Plus size={16} /></IconButton>
            </li>
          ))}
        </ul>
      </>}
      <p className="mt-4 text-xs text-text-subtle">Para usar tu propia música, impórtala desde Medios.</p>
    </div>
  );
}
