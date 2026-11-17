'use client';
import { useEditor } from '@/store/editor';
import { setClip, clipLength } from '@/lib/project';
import { NumberField } from '@/components/ui/NumberField';
import { shortDuration } from '@/lib/time';

export function Inspector() {
  const p = useEditor((s) => s.project)!;
  const sel = useEditor((s) => s.selected);
  const c = p.clips.find((x) => x.id === sel);
  const a = c && p.assets.find((x) => x.id === c.assetId);
  const { apply, endCoalesce } = useEditor.getState();
  return (
    <aside aria-label="Ajustes del clip" className="w-inspector shrink-0 overflow-y-auto border-l border-border bg-surface p-3 max-lg:hidden">
      <h2 className="mb-3 font-semibold">Ajustes</h2>
      {!c ? <p className="rounded-md bg-surface-raised p-3 text-sm text-text-muted">Selecciona un clip en la línea de tiempo para ver sus ajustes.</p> : (
        <div className="space-y-4">
          <div className="text-sm"><p className="truncate font-semibold" title={a?.name}>{a?.name}</p>
            <p className="mono text-text-muted">{shortDuration(clipLength(c))} usados de {shortDuration(a?.durationMs ?? 0)}{a?.width ? ` · ${a.width}×${a.height}` : ''}</p></div>
          <fieldset><legend className="mb-2 text-sm text-text-muted">Encaje en el formato</legend>
            <div className="grid grid-cols-2 gap-1 rounded-md bg-surface-raised p-1" role="radiogroup" aria-label="Encaje">
              {(['fill', 'fit'] as const).map((f) => (
                <button key={f} type="button" role="radio" aria-checked={c.fit === f} onClick={() => apply((q) => setClip(q, c.id, { fit: f }))}
                  className={`rounded-sm py-1.5 text-sm ${c.fit === f ? 'bg-surface-active text-text' : 'text-text-muted hover:text-text'}`}>{f === 'fill' ? 'Rellenar' : 'Encajar'}</button>
              ))}
            </div>
            <p className="mt-1 text-xs text-text-subtle">{c.fit === 'fill' ? 'Ocupa todo el formato; recorta los bordes que sobran.' : 'Se ve entero; añade bandas negras.'}</p>
          </fieldset>
          {a?.hasAudio && <div onPointerUp={endCoalesce}><NumberField label="Volumen" value={Math.round(c.volume * 100)} min={0} max={200} step={5} unit="%" onChange={(v) => apply((q) => setClip(q, c.id, { volume: v / 100 }), `vol-${c.id}`)} /></div>}
        </div>
      )}
    </aside>
  );
}
