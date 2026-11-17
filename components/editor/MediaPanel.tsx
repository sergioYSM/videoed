'use client';
import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Dropzone, type ImportRow } from '@/components/ui/Dropzone';
import { MediaTile } from '@/components/ui/MediaTile';
import { useEditor } from '@/store/editor';
import { addAsset, addClip, addAudio, removeAsset } from '@/lib/project';
import { removeMedia } from '@/lib/storage';
import { ImportError } from '@/lib/media';
import { importOne } from '@/lib/importFile';

export function MediaPanel({ projectId }: { projectId: string }) {
  const p = useEditor((s) => s.project)!;
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const setRow = (name: string, r: Partial<ImportRow>) => setRows((rs) => rs.map((x) => (x.name === name ? { ...x, ...r } : x)));

  const importFiles = async (files: File[]) => {
    setRows((rs) => [...rs.filter((r) => !files.some((f) => f.name === r.name)), ...files.map((f) => ({ name: f.name, progress: 0 }))]);
    let ok = 0;
    for (const file of files) {
      try {
        const asset = await importOne(projectId, file, (f) => setRow(file.name, { progress: f }));
        const s = useEditor.getState();
        s.apply((q) => { const withAsset = addAsset(q, asset); return asset.kind === 'audio' ? addAudio(withAsset, asset.id, s.playhead) : addClip(withAsset, asset.id); });
        setRows((rs) => rs.filter((r) => r.name !== file.name)); ok++;
      } catch (e) {
        setRow(file.name, { error: e instanceof ImportError ? e.message : 'No se ha podido importar este archivo.', progress: undefined });
      }
    }
    if (ok) useEditor.getState().notify(ok === 1 ? '1 archivo importado' : `${ok} archivos importados`);
  };

  return (
    <div>
      <h2 className="mb-3 font-semibold">Medios</h2>
      <Dropzone onFiles={importFiles} rows={rows} compact={p.assets.length > 0} />
      {p.assets.length > 0 && (
        <div role="listbox" aria-label="Medios del proyecto" className="mt-3 grid grid-cols-2 gap-1">
          {p.assets.map((a) => (
            <div key={a.id} className="relative" onClick={() => setSelected(a.id)} onDoubleClick={() => useEditor.getState().apply((q) => (a.kind === 'audio' ? addAudio(q, a.id, useEditor.getState().playhead) : addClip(q, a.id)))}
              onKeyDown={(e) => { if (e.key === 'Enter') useEditor.getState().apply((q) => (a.kind === 'audio' ? addAudio(q, a.id, useEditor.getState().playhead) : addClip(q, a.id))); }}>
              <MediaTile name={a.name} kind={a.kind} durationMs={a.durationMs} thumb={a.thumb ? `center / cover no-repeat url(${a.thumb})` : undefined} used={p.clips.some((c) => c.assetId === a.id) || p.audio.some((c) => c.assetId === a.id)} selected={selected === a.id} />
              {a.kind !== 'audio' && <button type="button" onClick={(e) => { e.stopPropagation(); useEditor.getState().apply((q) => addClip(q, a.id)); }} aria-label={`Añadir ${a.name} al final`} title="Añadir al final"
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-on-accent opacity-0 focus:opacity-100 [@media(hover:none)]:opacity-100 [div:hover>&]:opacity-100"><Plus size={14} /></button>}
              <button type="button" aria-label={`Quitar ${a.name} del proyecto`} title="Quitar del proyecto"
                onClick={async (e) => { e.stopPropagation(); if (!confirm(`¿Quitar «${a.name}» del proyecto? También se quitarán sus clips de la línea de tiempo.`)) return; useEditor.getState().apply((q) => removeAsset(q, a.id)); await removeMedia(projectId, a.id); useEditor.getState().notify('Archivo quitado'); }}
                className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-bg/80 text-text opacity-0 focus:opacity-100 [@media(hover:none)]:opacity-100 [div:hover>&]:opacity-100"><X size={14} /></button>
            </div>
          ))}
        </div>
      )}
      <p className="mt-4 text-xs text-text-subtle">Los archivos se copian al almacenamiento privado de este navegador. No se suben a ningún servidor.</p>
    </div>
  );
}
