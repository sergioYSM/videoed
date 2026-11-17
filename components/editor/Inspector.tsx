'use client';
import { useId } from 'react';
import { useEditor } from '@/store/editor';
import { setClip, clipLength, updateText, updateAudio, updateCue, duplicate, detachAudio, speedOf, FONTS, SPEEDS, LOOKS, NO_ADJUST, type FontId, type TextItem, type AudioItem, type Cue, type Clip, type TextAnim } from '@/lib/project';
import { NumberField } from '@/components/ui/NumberField';
import { shortDuration, timecode } from '@/lib/time';

export function Inspector() {
  const p = useEditor((s) => s.project)!;
  const sel = useEditor((s) => s.selected);
  const clip = p.clips.find((x) => x.id === sel), text = p.texts.find((x) => x.id === sel), audio = p.audio.find((x) => x.id === sel), cue = p.captions.cues.find((x) => x.id === sel);
  return (
    <aside aria-label="Ajustes" className="w-inspector shrink-0 overflow-y-auto border-l border-border bg-surface p-3 max-lg:hidden">
      <h2 className="mb-3 font-semibold">Ajustes</h2>
      {clip ? <ClipSettings c={clip} /> : text ? <TextSettings t={text} /> : audio ? <AudioSettings a={audio} /> : cue ? <CueSettings c={cue} fps={p.fps} />
        : <p className="rounded-md bg-surface-raised p-3 text-sm text-text-muted">Selecciona algo en la línea de tiempo o un texto en el vídeo para ver sus ajustes.</p>}
    </aside>
  );
}
export function InspectorBody() {
  const p = useEditor((s) => s.project)!; const sel = useEditor((s) => s.selected);
  const clip = p.clips.find((x) => x.id === sel), text = p.texts.find((x) => x.id === sel), audio = p.audio.find((x) => x.id === sel), cue = p.captions.cues.find((x) => x.id === sel);
  return clip ? <ClipSettings c={clip} /> : text ? <TextSettings t={text} /> : audio ? <AudioSettings a={audio} /> : cue ? <CueSettings c={cue} fps={p.fps} /> : <p className="text-sm text-text-muted">Selecciona algo para ver sus ajustes.</p>;
}

const apply = (...a: Parameters<ReturnType<typeof useEditor.getState>['apply']>) => useEditor.getState().apply(...a);
const end = () => useEditor.getState().endCoalesce();

function ClipSettings({ c }: { c: Clip }) {
  const a = useEditor((s) => s.project!.assets.find((x) => x.id === c.assetId));
  return (
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
      {c.fit === 'fit' && <fieldset><legend className="mb-2 text-sm text-text-muted">Fondo</legend>
        <div className="grid grid-cols-2 gap-1 rounded-md bg-surface-raised p-1" role="radiogroup" aria-label="Fondo">
          {(['black', 'blur'] as const).map((b) => <button key={b} type="button" role="radio" aria-checked={(c.bg ?? 'black') === b} onClick={() => apply((q) => setClip(q, c.id, { bg: b }))}
            className={`rounded-sm py-1.5 text-sm ${(c.bg ?? 'black') === b ? 'bg-surface-active text-text' : 'text-text-muted hover:text-text'}`}>{b === 'black' ? 'Negro' : 'Desenfocado'}</button>)}
        </div></fieldset>}
      <fieldset><legend className="mb-2 text-sm text-text-muted">Velocidad</legend>
        <div className="flex flex-wrap gap-1" role="radiogroup" aria-label="Velocidad">
          {SPEEDS.map((sp) => <button key={sp} type="button" role="radio" aria-checked={speedOf(c) === sp} onClick={() => apply((q) => setClip(q, c.id, { speed: sp }))}
            className={`rounded-sm px-2 py-1 text-sm ${speedOf(c) === sp ? 'bg-accent text-on-accent' : 'bg-surface-raised text-text-muted hover:text-text'}`}>{String(sp).replace('.', ',')}×</button>)}
        </div>
        {speedOf(c) !== 1 && a?.hasAudio && <p className="mt-1 text-xs text-text-subtle">A otra velocidad el sonido también cambia de tono.</p>}
      </fieldset>
      <div onPointerUp={end} className="space-y-3">
        {a?.hasAudio && <NumberField label="Volumen" value={Math.round(c.volume * 100)} min={0} max={200} step={5} unit="%" onChange={(v) => apply((q) => setClip(q, c.id, { volume: v / 100 }), `vol-${c.id}`)} />}
        <NumberField label="Fundido entrada" value={Math.round((c.fadeInMs ?? 0) / 100) / 10} min={0} max={Math.round(clipLength(c) / 100) / 10} step={0.1} unit="s" onChange={(v) => apply((q) => setClip(q, c.id, { fadeInMs: v * 1000 }), `cfi-${c.id}`)} />
        <NumberField label="Fundido salida" value={Math.round((c.fadeOutMs ?? 0) / 100) / 10} min={0} max={Math.round(clipLength(c) / 100) / 10} step={0.1} unit="s" onChange={(v) => apply((q) => setClip(q, c.id, { fadeOutMs: v * 1000 }), `cfo-${c.id}`)} />
      </div>
      <fieldset><legend className="mb-2 text-sm text-text-muted">Color</legend>
        <div className="mb-2 flex flex-wrap gap-1" role="group" aria-label="Estilos de color">
          {Object.entries(LOOKS).map(([k, l]) => <button key={k} type="button" onClick={() => apply((q) => setClip(q, c.id, { adjust: l.adjust }))}
            className="rounded-full bg-surface-raised px-2.5 py-1 text-xs text-text-muted hover:text-text">{l.label}</button>)}
        </div>
        <div onPointerUp={end} className="space-y-2">
          {(['brightness', 'contrast', 'saturation'] as const).map((k) => <NumberField key={k} label={{ brightness: 'Brillo', contrast: 'Contraste', saturation: 'Saturación' }[k]}
            value={Math.round((c.adjust ?? NO_ADJUST)[k] * 100)} min={0} max={k === 'saturation' ? 300 : 200} step={5} unit="%"
            onChange={(v) => apply((q) => setClip(q, c.id, { adjust: { ...(c.adjust ?? NO_ADJUST), [k]: v / 100 } }), `adj-${k}-${c.id}`)} />)}
        </div>
      </fieldset>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => { apply((q) => duplicate(q, c.id)); useEditor.getState().notify('Clip duplicado', true); }} className="rounded-sm bg-surface-raised px-2.5 py-1.5 text-sm hover:bg-surface-hover">Duplicar (Ctrl+D)</button>
        {a?.hasAudio && speedOf(c) === 1 && c.volume > 0 && <button type="button" onClick={() => { apply((q) => detachAudio(q, c.id)); useEditor.getState().notify('Audio separado a la pista de audio', true); }} className="rounded-sm bg-surface-raised px-2.5 py-1.5 text-sm hover:bg-surface-hover">Separar audio</button>}
      </div>
      <p className="text-xs text-text-subtle">Recorta con <b>[</b> y <b>]</b>: el inicio o el final del clip van al cabezal.</p>
    </div>
  );
}

function TextSettings({ t }: { t: TextItem }) {
  const uid = useId();   // two inspectors can be mounted (desktop + phone sheet): ids must be unique
  const up = (patch: Parameters<typeof updateText>[2], key?: string) => apply((q) => updateText(q, t.id, patch), key);
  return (
    <div className="space-y-3" onPointerUp={end}>
      <div><label htmlFor={`${uid}-txt`} className="mb-1 block text-sm text-text-muted">Texto</label>
        <textarea id={`${uid}-txt`} key={t.id} defaultValue={t.text} rows={3} maxLength={500} onChange={(e) => up({ text: e.target.value }, `txt-${t.id}`)} onBlur={end}
          className="w-full resize-y rounded-sm border border-border-input bg-surface-raised px-2 py-1.5 focus:border-focus focus:outline-none" /></div>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-sm text-text-muted">Fuente
          <select value={t.style.font} onChange={(e) => up({ style: { font: e.target.value as FontId } })} className="mt-1 w-full rounded-sm border border-border-input bg-surface-raised px-2 py-1 text-text">
            {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}</select></label>
        <label className="text-sm text-text-muted">Grosor
          <select value={t.style.weight} onChange={(e) => up({ style: { weight: Number(e.target.value) as 400 | 700 | 900 } })} className="mt-1 w-full rounded-sm border border-border-input bg-surface-raised px-2 py-1 text-text">
            <option value={400}>Normal</option><option value={700}>Negrita</option><option value={900}>Extra</option></select></label>
      </div>
      <NumberField label="Tamaño" value={t.style.size} min={8} max={400} step={2} unit="px" onChange={(v) => up({ style: { size: v } }, `size-${t.id}`)} />
      <div className="grid grid-cols-3 gap-2 text-sm text-text-muted">
        <label className="flex flex-col gap-1">Color<input type="color" value={t.style.color} onChange={(e) => up({ style: { color: e.target.value } }, `col-${t.id}`)} className="h-8 w-full rounded-sm bg-surface-raised" /></label>
        <label className="flex flex-col gap-1"><span><input type="checkbox" checked={!!t.style.stroke} onChange={(e) => up({ style: { stroke: e.target.checked ? '#000000' : null } })} className="mr-1 accent-[var(--color-accent)]" />Contorno</span>
          <input type="color" disabled={!t.style.stroke} value={t.style.stroke ?? '#000000'} onChange={(e) => up({ style: { stroke: e.target.value } }, `st-${t.id}`)} className="h-8 w-full rounded-sm bg-surface-raised disabled:opacity-40" aria-label="Color del contorno" /></label>
        <label className="flex flex-col gap-1"><span><input type="checkbox" checked={!!t.style.bg} onChange={(e) => up({ style: { bg: e.target.checked ? '#000000' : null } })} className="mr-1 accent-[var(--color-accent)]" />Fondo</span>
          <input type="color" disabled={!t.style.bg} value={t.style.bg ?? '#000000'} onChange={(e) => up({ style: { bg: e.target.value } }, `bg-${t.id}`)} className="h-8 w-full rounded-sm bg-surface-raised disabled:opacity-40" aria-label="Color del fondo" /></label>
      </div>
      <fieldset><legend className="mb-1 text-sm text-text-muted">Alineación</legend>
        <div className="grid grid-cols-3 gap-1 rounded-md bg-surface-raised p-1" role="radiogroup" aria-label="Alineación">
          {(['left', 'center', 'right'] as const).map((al) => <button key={al} type="button" role="radio" aria-checked={t.style.align === al} onClick={() => up({ style: { align: al } })}
            className={`rounded-sm py-1 text-sm ${t.style.align === al ? 'bg-surface-active text-text' : 'text-text-muted'}`}>{{ left: 'Izquierda', center: 'Centro', right: 'Derecha' }[al]}</button>)}
        </div></fieldset>
      <NumberField label="Horizontal" value={Math.round(t.x * 100)} min={0} max={100} step={1} unit="%" onChange={(v) => up({ x: v / 100 }, `x-${t.id}`)} />
      <NumberField label="Vertical" value={Math.round(t.y * 100)} min={0} max={100} step={1} unit="%" onChange={(v) => up({ y: v / 100 }, `y-${t.id}`)} />
      <NumberField label="Escala" value={Math.round(t.scale * 100)} min={10} max={800} step={5} unit="%" onChange={(v) => up({ scale: v / 100 }, `sc-${t.id}`)} />
      <NumberField label="Duración" value={Math.round((t.endMs - t.startMs) / 100) / 10} min={0.1} max={60} step={0.1} unit="s" onChange={(v) => up({ endMs: t.startMs + v * 1000 }, `dur-${t.id}`)} />
      <fieldset><legend className="mb-1 text-sm text-text-muted">Animación</legend>
        <div className="flex flex-wrap gap-1" role="radiogroup" aria-label="Animación">
          {([['none', 'Ninguna'], ['fade', 'Aparecer'], ['pop', 'Saltar'], ['slide', 'Deslizar'], ['type', 'Máquina de escribir']] as [TextAnim, string][]).map(([k, l]) => (
            <button key={k} type="button" role="radio" aria-checked={(t.anim ?? 'none') === k} onClick={() => up({ anim: k })}
              className={`rounded-sm px-2 py-1 text-sm ${(t.anim ?? 'none') === k ? 'bg-accent text-on-accent' : 'bg-surface-raised text-text-muted hover:text-text'}`}>{l}</button>))}
        </div></fieldset>
      <button type="button" onClick={() => { apply((q) => duplicate(q, t.id)); useEditor.getState().notify('Texto duplicado', true); }} className="rounded-sm bg-surface-raised px-2.5 py-1.5 text-sm hover:bg-surface-hover">Duplicar (Ctrl+D)</button>
    </div>
  );
}

function AudioSettings({ a }: { a: AudioItem }) {
  const asset = useEditor((s) => s.project!.assets.find((x) => x.id === a.assetId));
  const len = a.outMs - a.inMs;
  const up = (patch: Parameters<typeof updateAudio>[2], key: string) => apply((q) => updateAudio(q, a.id, patch), key);
  return (
    <div className="space-y-3" onPointerUp={end}>
      <div className="text-sm"><p className="truncate font-semibold" title={asset?.name}>{asset?.name}</p><p className="mono text-text-muted">{shortDuration(len)}</p></div>
      <NumberField label="Volumen" value={Math.round(a.volume * 100)} min={0} max={200} step={5} unit="%" onChange={(v) => up({ volume: v / 100 }, `av-${a.id}`)} />
      <NumberField label="Entrada" value={Math.round(a.fadeInMs / 100) / 10} min={0} max={Math.round(len / 100) / 10} step={0.1} unit="s" onChange={(v) => up({ fadeInMs: v * 1000 }, `fi-${a.id}`)} />
      <NumberField label="Salida" value={Math.round(a.fadeOutMs / 100) / 10} min={0} max={Math.round(len / 100) / 10} step={0.1} unit="s" onChange={(v) => up({ fadeOutMs: v * 1000 }, `fo-${a.id}`)} />
      {a.credit && <div className="break-words rounded-md bg-surface-raised p-2 text-xs text-text-muted"><p className="mb-1 font-semibold text-text">Crédito (ponlo en la descripción)</p><p className="whitespace-pre-line">{a.credit}</p>
        <button type="button" onClick={() => navigator.clipboard.writeText(a.credit!).then(() => useEditor.getState().notify('Crédito copiado'), () => useEditor.getState().notify('No se ha podido copiar'))} className="mt-2 rounded-sm bg-surface-active px-2 py-1 font-semibold text-text hover:brightness-110">Copiar crédito</button></div>}
    </div>
  );
}

function CueSettings({ c, fps }: { c: Cue; fps: number }) {
  return (
    <div className="space-y-3">
      <p className="mono text-sm text-text-muted">{timecode(c.startMs, fps)} → {timecode(c.endMs, fps)}</p>
      <label className="block text-sm text-text-muted">Texto
        <textarea key={c.id} defaultValue={c.text} rows={3} maxLength={300} onBlur={(e) => e.target.value !== c.text && apply((q) => updateCue(q, c.id, { text: e.target.value }))}
          className="mt-1 w-full resize-y rounded-sm border border-border-input bg-surface-raised px-2 py-1.5 text-text focus:border-focus focus:outline-none" /></label>
      <p className="text-xs text-text-subtle">Cambia el estilo de todos los subtítulos en el panel Subtítulos.</p>
    </div>
  );
}
