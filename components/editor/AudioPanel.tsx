'use client';
import { useMemo, useRef, useState } from 'react';
import { Play, Pause, Plus, BadgeCheck, Search } from 'lucide-react';
import { useEditor } from '@/store/editor';
import { addAsset, addAudio } from '@/lib/project';
import { MUSIC, MOODS, LICENCE, creditFor, type MusicTrack } from '@/lib/music';
import { importOne } from '@/lib/importFile';
import { shortDuration } from '@/lib/time';
import { IconButton } from '@/components/ui/Button';

export function AudioPanel({ projectId }: { projectId: string }) {
  const p = useEditor((s) => s.project)!;
  const [busy, setBusy] = useState<string | null>(null);
  const [listening, setListening] = useState<string | null>(null);
  const [mood, setMood] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const player = useRef<HTMLAudioElement | null>(null);
  const own = p.assets.filter((a) => (a.kind === 'audio' || (a.kind === 'video' && a.hasAudio)) && !MUSIC.some((m) => a.name === fileName(m)));
  const list = useMemo(() => MUSIC.filter((m) => (!mood || m.moods.includes(mood)) && (!q.trim() || `${m.title} ${m.moods.join(' ')}`.toLowerCase().includes(q.trim().toLowerCase()))), [mood, q]);

  const preview = (m: MusicTrack) => {
    player.current?.pause();
    if (listening === m.id) { setListening(null); return; }
    player.current = new Audio(m.file); player.current.volume = 0.6; player.current.play().catch(() => {}); setListening(m.id);
    player.current.onended = () => setListening(null);
  };
  const add = async (m: MusicTrack) => {
    setBusy(m.id); player.current?.pause(); setListening(null);
    try {
      const s = useEditor.getState();
      let asset = s.project!.assets.find((a) => a.name === fileName(m));
      if (!asset) {
        const blob = await (await fetch(m.file)).blob();
        asset = await importOne(projectId, new File([blob], fileName(m), { type: 'audio/mpeg' }));
        const a = asset; s.apply((q2) => addAsset(q2, a));
      }
      const id = asset.id;
      s.apply((q2) => addAudio(q2, id, s.playhead, creditFor(m)));
      s.select(useEditor.getState().project!.audio.at(-1)!.id);
      s.notify(`«${m.title}» añadida en el cabezal`);
    } catch { useEditor.getState().notify('No se ha podido añadir esta canción.'); }
    setBusy(null);
  };

  return (
    <div>
      <h2 className="mb-1 font-semibold">Audio</h2>
      <p className="mb-3 text-xs text-text-muted">Música de Kevin MacLeod con licencia <a href={LICENCE.url} target="_blank" rel="noopener noreferrer" className="underline">{LICENCE.name}</a>. {LICENCE.explain}</p>
      <label className="mb-2 flex items-center gap-2 rounded-sm border border-border-input bg-surface-raised px-2 py-1.5">
        <Search size={14} className="text-text-muted" aria-hidden />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar canción o ánimo" aria-label="Buscar música" className="w-full bg-transparent text-sm placeholder:text-text-subtle focus:outline-none" />
      </label>
      <div className="mb-2 flex flex-wrap gap-1" role="group" aria-label="Filtrar por ánimo">
        {MOODS.map((m) => (
          <button key={m} type="button" aria-pressed={mood === m} onClick={() => setMood(mood === m ? null : m)}
            className={`rounded-full px-2.5 py-0.5 text-xs ${mood === m ? 'bg-accent text-on-accent' : 'bg-surface-raised text-text-muted hover:text-text'}`}>{m}</button>
        ))}
      </div>
      <ul className="space-y-1" aria-label="Música con licencia">
        {list.map((m) => (
          <li key={m.id} className="flex items-center gap-2 rounded-md p-1.5 hover:bg-surface-hover">
            <IconButton label={listening === m.id ? `Parar ${m.title}` : `Escuchar ${m.title}`} onClick={() => preview(m)}>{listening === m.id ? <Pause size={14} /> : <Play size={14} />}</IconButton>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{m.title}</p>
              <p className="truncate text-xs text-text-muted">{m.moods.slice(0, 2).join(' · ')} · {shortDuration(m.durationMs)}</p>
            </div>
            <span title={`${LICENCE.name}: apta para vídeos monetizados citando al autor`} className="text-success"><BadgeCheck size={16} aria-label="Apta para monetizar con crédito" /></span>
            <IconButton label={`Añadir ${m.title} en el cabezal`} onClick={() => add(m)} disabled={busy === m.id}><Plus size={16} /></IconButton>
          </li>
        ))}
        {!list.length && <li className="p-2 text-sm text-text-muted">Ninguna canción con ese filtro.</li>}
      </ul>
      {own.length > 0 && <>
        <h3 className="mb-1 mt-4 text-sm font-semibold">Tus archivos</h3>
        <ul className="space-y-1" aria-label="Tus archivos de audio">
          {own.map((a) => (
            <li key={a.id} className="flex items-center gap-2 rounded-md p-1.5 hover:bg-surface-hover">
              <div className="min-w-0 flex-1"><p className="truncate text-sm">{a.name}</p><p className="text-xs text-text-muted">{a.kind === 'video' ? 'Audio del vídeo' : 'Audio'} · {shortDuration(a.durationMs)}</p></div>
              <IconButton label={`Añadir el audio de ${a.name} en el cabezal`} onClick={() => { const s = useEditor.getState(); s.apply((q2) => addAudio(q2, a.id, s.playhead)); }}><Plus size={16} /></IconButton>
            </li>
          ))}
        </ul>
      </>}
      <p className="mt-4 text-xs text-text-subtle">Para usar tu propia música, impórtala desde Medios. Asegúrate de tener derecho a usarla.</p>
    </div>
  );
}
const fileName = (m: MusicTrack) => `${m.title} — ${m.artist}.mp3`;
