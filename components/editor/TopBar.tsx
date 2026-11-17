'use client';
import Link from 'next/link';
import { ArrowLeft, Undo2, Redo2, Download, Check, Loader2, AlertTriangle, FileArchive } from 'lucide-react';
import { useState } from 'react';
import { exportProjectFile } from '@/lib/projectFile';
import { useEditor } from '@/store/editor';
import { rename } from '@/lib/project';
import { Button, IconButton } from '@/components/ui/Button';

export function TopBar({ onExport }: { onExport: () => void }) {
  const p = useEditor((s) => s.project)!;
  const save = useEditor((s) => s.save);
  const canUndo = useEditor((s) => s.past.length > 0), canRedo = useEditor((s) => s.future.length > 0);
  const { apply, undo, redo } = useEditor.getState();
  const [saving, setSaving] = useState(false);
  return (
    <header className="flex h-topbar shrink-0 items-center gap-2 border-b border-border bg-surface px-2">
      <Link href="/app" aria-label="Volver a tus proyectos" title="Volver a tus proyectos" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-hover hover:text-text"><ArrowLeft size={18} /></Link>
      <label className="sr-only" htmlFor="pname">Nombre del proyecto</label>
      <input id="pname" defaultValue={p.name} key={p.id} maxLength={120} onBlur={(e) => apply((q) => rename(q, e.target.value))} onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        className="w-64 min-w-0 truncate rounded-sm max-md:w-auto max-md:flex-1 bg-transparent px-2 py-1 font-semibold hover:bg-surface-hover focus:bg-surface-raised focus:outline-none" />
      <span className="mono rounded-xs border border-border px-1.5 text-2xs text-text-muted max-sm:hidden">{p.aspect}</span>
      <span className="flex items-center gap-1 text-xs text-text-muted max-md:sr-only" role="status">
        {save === 'saving' ? <><Loader2 size={12} className="animate-spin" aria-hidden />Guardando…</> : save === 'error' ? <span className="flex items-center gap-1 text-warning"><AlertTriangle size={12} aria-hidden />Sin guardar: el navegador no tiene espacio</span> : <><Check size={12} aria-hidden />Guardado en este dispositivo</>}
      </span>
      <div className="ml-auto flex shrink-0 items-center gap-1">
        <IconButton label={saving ? 'Guardando el archivo del proyecto…' : 'Guardar el proyecto como archivo (con sus vídeos)'} disabled={saving || !p.assets.length} onClick={async () => {
          setSaving(true);
          try { const blob = await exportProjectFile(useEditor.getState().project!); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${p.name.replace(/[\\/:*?"<>|]+/g, '').trim() || 'proyecto'}.ownframe`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); useEditor.getState().notify('Proyecto guardado como archivo'); }
          catch { useEditor.getState().notify('No se ha podido guardar el archivo del proyecto.'); }
          setSaving(false);
        }}>{saving ? <Loader2 size={16} className="animate-spin" /> : <FileArchive size={16} />}</IconButton>
        <IconButton label="Deshacer (Ctrl+Z)" onClick={undo} disabled={!canUndo}><Undo2 size={16} /></IconButton>
        <IconButton label="Rehacer (Ctrl+Shift+Z)" onClick={redo} disabled={!canRedo}><Redo2 size={16} /></IconButton>
        <Button variant="primary" className="ml-2 max-sm:px-2" onClick={onExport} disabled={!p.clips.length} aria-label="Exportar"><Download size={16} aria-hidden /><span className="max-sm:hidden">Exportar</span></Button>
      </div>
    </header>
  );
}
