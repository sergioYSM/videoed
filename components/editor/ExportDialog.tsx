'use client';
import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useEditor } from '@/store/editor';
import { exportProject, outputSize, canExport, ExportCancelled, type ExportOptions } from '@/lib/export';
import { duration } from '@/lib/project';
import { shortDuration } from '@/lib/time';
import { Button, IconButton } from '@/components/ui/Button';

type State = { k: 'settings' } | { k: 'running'; f: number; t0: number } | { k: 'done'; url: string; size: number; name: string } | { k: 'failed'; msg: string };

export function ExportDialog({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const p = useEditor((s) => s.project)!;
  const [opt, setOpt] = useState<ExportOptions>({ height: 1080, quality: 'high' });
  const [st, setSt] = useState<State>({ k: 'settings' });
  const [unsupported, setUnsupported] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  const first = useRef<HTMLButtonElement>(null);
  const fileName = `${p.name.replace(/[\\/:*?"<>|]+/g, '').trim() || 'video'}.mp4`;
  const credits = [...new Set(p.audio.map((a) => a.credit).filter(Boolean))].join('\n\n');
  const size = outputSize(p, opt.height);
  useEffect(() => { canExport().then(setUnsupported); first.current?.focus(); }, []);
  // cancel only when the dialog closes (not on every state change)
  useEffect(() => () => abort.current?.abort(), []);
  const doneUrl = st.k === 'done' ? st.url : null;
  useEffect(() => () => { if (doneUrl) URL.revokeObjectURL(doneUrl); }, [doneUrl]);

  const [retried, setRetried] = useState(false);
  const exportProjectRetry = () => { setOpt({ ...opt, height: 720 }); return exportProject(p, projectId, { ...opt, height: 720 }, (f) => setSt({ k: 'running', f, t0: performance.now() }), abort.current!.signal); };
  const run = async () => {
    abort.current = new AbortController();
    const t0 = performance.now(); setSt({ k: 'running', f: 0, t0 });
    try {
      const blob = await exportProject(p, projectId, opt, (f) => setSt({ k: 'running', f, t0 }), abort.current.signal);
      setSt({ k: 'done', url: URL.createObjectURL(blob), size: blob.size, name: fileName });
    } catch (e) {
      if (!(e instanceof ExportCancelled) && opt.height === 1080) {
        // fix X8: one automatic retry at 720p before giving up
        try {
          setSt({ k: 'running', f: 0, t0: performance.now() }); setRetried(true);
          const blob = await exportProjectRetry();
          setSt({ k: 'done', url: URL.createObjectURL(blob), size: blob.size, name: fileName }); return;
        } catch (e2) { e = e2; }
      }
      if (e instanceof ExportCancelled) setSt({ k: 'settings' });
      else setSt({ k: 'failed', msg: /memory|allocation/i.test(String(e)) ? 'Tu navegador se quedó sin memoria. Prueba a 720p o cierra otras pestañas.' : `No se ha podido exportar: ${(e as Error).message}` });
    }
  };
  const close = () => { if (st.k === 'running' && !confirm('¿Cancelar la exportación?')) return; abort.current?.abort(); onClose(); };
  const left = st.k === 'running' && st.f > 0.05 ? ((performance.now() - st.t0) / st.f) * (1 - st.f) / 1000 : null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-bg/70 p-4" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && close()} onKeyDown={(e) => e.key === 'Escape' && close()}>
      <div role="dialog" aria-modal="true" aria-labelledby="exp-t" className="w-full max-w-md rounded-lg border border-border bg-surface-raised p-5 shadow-pop">
        <div className="mb-4 flex items-center"><h2 id="exp-t" className="text-xl font-bold">Exportar vídeo</h2><IconButton label="Cerrar" className="ml-auto" onClick={close}><X size={18} /></IconButton></div>
        {unsupported ? <p role="alert" className="text-danger">{unsupported}</p>
          : st.k === 'settings' ? (
          <>
            <fieldset className="mb-4"><legend className="mb-2 text-sm text-text-muted">Resolución</legend>
              <div className="grid grid-cols-2 gap-2">{([720, 1080] as const).map((h, i) => (
                <button key={h} ref={i === 1 ? first : undefined} type="button" role="radio" aria-checked={opt.height === h} onClick={() => setOpt({ ...opt, height: h })}
                  className={`rounded-md border p-2 text-left ${opt.height === h ? 'border-accent bg-surface-active' : 'border-border hover:bg-surface-hover'}`}>
                  <span className="block font-semibold">{h}p</span><span className="mono text-xs text-text-muted">{outputSize(p, h).width}×{outputSize(p, h).height}</span></button>))}</div>
              <p className="mt-1 text-xs text-text-subtle">4K llegará con el plan Pro.</p>
            </fieldset>
            <fieldset className="mb-4"><legend className="mb-2 text-sm text-text-muted">Calidad</legend>
              <div className="grid grid-cols-2 gap-2">{(['standard', 'high'] as const).map((q) => (
                <button key={q} type="button" role="radio" aria-checked={opt.quality === q} onClick={() => setOpt({ ...opt, quality: q })}
                  className={`rounded-md border p-2 text-left ${opt.quality === q ? 'border-accent bg-surface-active' : 'border-border hover:bg-surface-hover'}`}>{q === 'high' ? 'Alta' : 'Estándar (archivo más ligero)'}</button>))}</div>
            </fieldset>
            <p className="mb-4 text-sm text-text-muted">{fileName} · {shortDuration(duration(p))} · {size.width}×{size.height} · {p.fps} fps · MP4 (H.264 + AAC). Sin marca de agua.</p>
            <Button variant="primary" size="lg" className="w-full" onClick={run}>Exportar</Button>
          </>
        ) : st.k === 'running' ? (
          <>
            {retried && <p role="status" className="mb-2 text-sm text-warning">La exportación a 1080p falló; lo intentamos a 720p.</p>}
            <p className="mb-2 font-semibold">Exportando… {Math.round(st.f * 100)} %</p>
            <div role="progressbar" aria-label="Progreso de exportación" aria-valuenow={Math.round(st.f * 100)} aria-valuemin={0} aria-valuemax={100} className="h-2 rounded-full bg-surface-active"><div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${st.f * 100}%` }} /></div>
            <p className="mt-2 text-sm text-text-muted">{left !== null ? `Quedan unos ${Math.ceil(left)} s` : 'Preparando…'} · no cierres esta pestaña</p>
            <Button size="sm" className="mt-3" onClick={() => abort.current?.abort()}>Cancelar</Button>
          </>
        ) : st.k === 'done' ? (
          <>
            <p className="mb-1 font-semibold text-success">Listo. Sin marca de agua.</p>
            <p className="mb-4 text-sm text-text-muted">{st.name} · {size.width}×{size.height} · {(st.size / 1e6).toFixed(1).replace('.', ',')} MB{retried ? ' · exportado a 720p porque 1080p falló' : ''}</p>
            <a href={st.url} download={st.name} className="inline-flex h-10 w-full items-center justify-center rounded-md bg-accent font-semibold text-on-accent hover:brightness-110">Descargar</a>
            {credits && <div className="mt-4 rounded-md bg-surface p-3 text-sm">
              <p className="mb-1 font-semibold">Pon esto en la descripción de tu vídeo</p>
              <p className="mb-2 text-xs text-text-muted">La licencia de la música pide citar al autor.</p>
              <pre className="mb-2 whitespace-pre-wrap break-words font-mono text-xs text-text-muted">{credits}</pre>
              <Button size="sm" onClick={() => navigator.clipboard.writeText(credits).then(() => useEditor.getState().notify('Créditos copiados'), () => useEditor.getState().notify('No se ha podido copiar'))}>Copiar créditos de la música</Button>
            </div>}
          </>
        ) : (
          <div role="alert"><p className="mb-1 font-semibold text-danger">No se ha podido exportar</p><p className="mb-4 text-sm text-text-muted">{st.msg}</p><Button onClick={() => setSt({ k: 'settings' })}>Volver</Button></div>
        )}
      </div>
    </div>
  );
}
