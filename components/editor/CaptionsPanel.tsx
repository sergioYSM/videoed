'use client';
import { useState } from 'react';
import { Plus, Upload, Download, Sparkles, Trash2 } from 'lucide-react';
import { useEditor } from '@/store/editor';
import { addCue, updateCue, removeCue, setCues, setCaptionStyle, type CaptionPreset } from '@/lib/project';
import { toSrt, fromSrt } from '@/lib/srt';
import { transcribe, MODEL_SIZE_MB } from '@/lib/transcribe';
import { timecode } from '@/lib/time';
import { Button, IconButton } from '@/components/ui/Button';

const presets: { id: CaptionPreset; label: string }[] = [{ id: 'clasico', label: 'Clásico' }, { id: 'caja', label: 'Con caja' }, { id: 'grande', label: 'Grande' }];

export function CaptionsPanel({ projectId }: { projectId: string }) {
  const p = useEditor((s) => s.project)!;
  const playhead = useEditor((s) => s.playhead);
  const { apply, notify } = useEditor.getState();
  const [lang, setLang] = useState(p.captions.lang ?? 'es');
  const [status, setStatus] = useState<{ text: string; f?: number; error?: boolean } | null>(null);
  const cues = p.captions.cues;

  const auto = async () => {
    if (cues.length && !confirm('Se sustituirán los subtítulos actuales. ¿Seguir?')) return;
    if (!localStorage.getItem('videoed-model-ok') && !confirm(`La primera vez se descargan unos ${MODEL_SIZE_MB} MB para reconocer la voz en tu dispositivo. Tu audio no sale de aquí. ¿Descargar?`)) return;
    try {
      const out = await transcribe(useEditor.getState().project!, projectId, lang, (text, f) => setStatus({ text, f }));
      localStorage.setItem('videoed-model-ok', '1');
      if (!out.length) { setStatus({ text: 'No hemos encontrado voz en el audio del vídeo.' }); return; }
      apply((q) => setCues(q, out, lang)); setStatus(null); notify(`${out.length} subtítulos creados`, true);
    } catch (e) {
      setStatus({ text: /fetch|network|Failed to load/i.test(String(e)) ? 'No se ha podido descargar el modelo de voz. Revisa tu conexión e inténtalo de nuevo.' : `No se han podido generar: ${(e as Error).message}`, error: true });
    }
  };
  const importSrt = () => {
    const i = document.createElement('input'); i.type = 'file'; i.accept = '.srt,text/plain';
    i.onchange = async () => {
      const f = i.files?.[0]; if (!f) return;
      const parsed = fromSrt(await f.text(), () => crypto.randomUUID());
      if (!parsed.length) return notify('Ese archivo no tiene subtítulos válidos (.srt).');
      apply((q) => setCues(q, parsed)); notify(`${parsed.length} subtítulos importados`, true);
    };
    i.click();
  };
  const exportSrt = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([toSrt(cues)], { type: 'application/x-subrip' }));
    a.download = `${p.name.replace(/[\\/:*?"<>|]+/g, '') || 'subtitulos'}.srt`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  return (
    <div>
      <h2 className="mb-3 font-semibold">Subtítulos</h2>
      <section aria-label="Generar automáticamente" className="mb-4 rounded-md border border-border bg-surface-raised p-3">
        <div className="mb-2 flex items-center gap-2">
          <label htmlFor="cap-lang" className="text-sm text-text-muted">Idioma</label>
          <select id="cap-lang" value={lang} onChange={(e) => setLang(e.target.value)} className="flex-1 rounded-sm border border-border-input bg-surface px-2 py-1 text-sm">
            <option value="es">Español</option><option value="en">Inglés</option><option value="pt">Portugués</option><option value="fr">Francés</option><option value="it">Italiano</option><option value="de">Alemán</option><option value="ca">Catalán</option>
          </select>
        </div>
        <Button variant="primary" className="w-full" onClick={auto} disabled={!p.clips.length || (!!status && !status.error && status.f !== undefined && status.f < 1)}><Sparkles size={14} aria-hidden />Generar desde la voz</Button>
        <p className="mt-2 text-xs text-text-subtle">Se hace en tu dispositivo. La primera vez descarga ~{MODEL_SIZE_MB} MB.</p>
        {status && <div role={status.error ? 'alert' : 'status'} className={`mt-2 text-sm ${status.error ? 'text-danger' : 'text-text-muted'}`}>{status.text}
          {status.f !== undefined && <div role="progressbar" aria-label="Descarga del modelo" aria-valuenow={Math.round(status.f * 100)} aria-valuemin={0} aria-valuemax={100} className="mt-1 h-1 rounded-full bg-surface-active"><div className="h-full rounded-full bg-accent" style={{ width: `${status.f * 100}%` }} /></div>}</div>}
      </section>

      <fieldset className="mb-4"><legend className="mb-2 text-sm text-text-muted">Estilo</legend>
        <div className="grid grid-cols-3 gap-1 rounded-md bg-surface-raised p-1" role="radiogroup" aria-label="Estilo de subtítulos">
          {presets.map((x) => <button key={x.id} type="button" role="radio" aria-checked={p.captions.preset === x.id} onClick={() => apply((q) => setCaptionStyle(q, { preset: x.id }))}
            className={`rounded-sm py-1.5 text-sm ${p.captions.preset === x.id ? 'bg-surface-active text-text' : 'text-text-muted hover:text-text'}`}>{x.label}</button>)}
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-text-muted">Altura
          <input type="range" min={5} max={95} value={Math.round(p.captions.y * 100)} onChange={(e) => apply((q) => setCaptionStyle(q, { y: Number(e.target.value) / 100 }), 'cap-y')} className="flex-1 accent-[var(--color-accent)]" aria-label="Altura de los subtítulos" />
        </label>
      </fieldset>

      <div className="mb-2 flex items-center gap-1">
        <h3 className="flex-1 text-sm font-semibold">Líneas ({cues.length})</h3>
        <IconButton label="Añadir una línea en el cabezal" onClick={() => apply((q) => addCue(q, playhead))}><Plus size={16} /></IconButton>
        <IconButton label="Importar .srt" onClick={importSrt}><Upload size={16} /></IconButton>
        <IconButton label="Descargar .srt" onClick={exportSrt} disabled={!cues.length}><Download size={16} /></IconButton>
      </div>
      {!cues.length ? <p className="rounded-md border border-dashed border-border p-3 text-sm text-text-muted">Aún no hay subtítulos. Genéralos desde la voz, importa un .srt o añade líneas a mano.</p> : (
        <ul className="space-y-1" aria-label="Líneas de subtítulos">
          {cues.map((c) => {
            const active = playhead >= c.startMs && playhead < c.endMs;
            return (
              <li key={c.id} className={`rounded-md p-2 ${active ? 'bg-surface-active' : 'bg-surface-raised'}`}>
                <div className="mb-1 flex items-center gap-1">
                  <span className="mono flex-1 text-2xs text-text-muted">{timecode(c.startMs, p.fps)} → {timecode(c.endMs, p.fps)}</span>
                  <IconButton label="Borrar esta línea" className="h-6 w-6" onClick={() => apply((q) => removeCue(q, c.id))}><Trash2 size={12} /></IconButton>
                </div>
                <textarea aria-label={`Subtítulo de ${timecode(c.startMs, p.fps)}`} defaultValue={c.text} rows={2} maxLength={300}
                  onBlur={(e) => e.target.value !== c.text && apply((q) => updateCue(q, c.id, { text: e.target.value }))}
                  className="w-full resize-none rounded-sm bg-surface px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-focus" />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
