'use client';
import { useEffect, useRef, useState } from 'react';
import { useEditor } from '@/store/editor';
import { Rail, type RailTab } from '@/components/ui/Rail';
import { TopBar } from './TopBar';
import { MediaPanel } from './MediaPanel';
import { Preview, type PreviewHandle } from './Preview';
import { Timeline } from './Timeline';
import { Inspector } from './Inspector';
import { ExportDialog } from './ExportDialog';
import { InspectorBody } from './Inspector';
import { Film, Type, Captions, Music, SlidersHorizontal, X } from 'lucide-react';
import { split, removeClip, removeText, removeAudio, removeCue, duration, locate, trim, duplicate } from '@/lib/project';
import { TextPanel } from './TextPanel';
import { AudioPanel } from './AudioPanel';
import { CaptionsPanel } from './CaptionsPanel';
import type { Project } from '@/lib/project';

/** Remove whatever is selected (clip, text, audio or caption line). */
export function removeSelected(p: Project, id: string): Project {
  if (p.clips.some((c) => c.id === id)) return removeClip(p, id);
  if (p.texts.some((t) => t.id === id)) return removeText(p, id);
  if (p.audio.some((a) => a.id === id)) return removeAudio(p, id);
  return removeCue(p, id);
}

const SHEET_LABEL = { media: 'Medios', text: 'Texto', captions: 'Subtítulos', audio: 'Audio', settings: 'Ajustes' } as const;
const SHEET_ICON = { media: Film, text: Type, captions: Captions, audio: Music, settings: SlidersHorizontal } as const;

export function Editor({ projectId }: { projectId: string }) {
  const [tab, setTab] = useState<RailTab>('media');
  const [exporting, setExporting] = useState(false);
  const [sheet, setSheet] = useState<RailTab | 'settings' | null>(null);   // phones: panels open as a bottom sheet
  const preview = useRef<PreviewHandle>(null);
  const name = useEditor((s) => s.project?.name);
  const toast = useEditor((s) => s.toast);
  useEffect(() => { document.title = `${name ?? 'Proyecto'} · Ownframe`; }, [name]);
  // Warm the export pieces while online, so exporting also works offline later (the service worker keeps them).
  useEffect(() => {
    const id = setTimeout(async () => {
      const { canEncodeAudio } = await import('mediabunny');
      if (!(await canEncodeAudio('aac'))) await import('@mediabunny/aac-encoder').catch(() => {});
    }, 1500);
    return () => clearTimeout(id);
  }, []);

  // keyboard shortcuts (not while typing in a field)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest('input, textarea, select, [contenteditable=true], [role=dialog], [role=slider]')) return;
      const s = useEditor.getState(); const p = s.project; if (!p) return;
      const frame = 1000 / p.fps;
      if (e.key === 'Escape' && s.selected) { s.select(null); return; }
      if (e.code === 'Space') { e.preventDefault(); preview.current?.toggle(); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); preview.current?.pause(); e.shiftKey ? s.redo() : s.undo(); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); s.redo(); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') { e.preventDefault(); setExporting(true); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && s.selected) { e.preventDefault(); s.apply((q) => duplicate(q, s.selected!)); s.notify('Duplicado', true); }
      else if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); preview.current?.pause(); const before = p.clips.length; s.apply((q) => split(q, s.playhead)); if (useEditor.getState().project!.clips.length > before) s.notify('Clip cortado', true); }
      else if ((e.key === 'Delete' || e.key === 'Backspace') && s.selected) { e.preventDefault(); s.apply((q) => removeSelected(q, s.selected!)); s.select(null); s.notify('Borrado', true); }
      else if (e.key === '[' || e.key === ']') {
        // trim the clip under the playhead: its start ([) or end (]) moves to the playhead
        e.preventDefault(); preview.current?.pause();
        const hit = locate(p, s.playhead); if (!hit) return;
        const at = hit.sourceMs, before = p;
        s.apply((q) => trim(q, hit.clip.id, e.key === '[' ? 'start' : 'end', at));
        if (useEditor.getState().project !== before) { s.notify(e.key === '[' ? 'Inicio recortado hasta el cabezal' : 'Final recortado hasta el cabezal', true); if (e.key === '[') preview.current?.seek(hit.startMs); }
      }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        if (el.closest('[role=option]')) return;  // clips handle their own arrows
        e.preventDefault(); preview.current?.pause();
        const d = (e.key === 'ArrowLeft' ? -1 : 1) * (e.shiftKey ? 1000 : frame);
        preview.current?.seek(Math.min(duration(p), Math.max(0, s.playhead + d)));
      }
      else if (e.key === '+' || e.key === '=') s.setPps(s.pps * 1.25);
      else if (e.key === '-') s.setPps(s.pps / 1.25);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="flex h-dvh flex-col">
      <TopBar onExport={() => setExporting(true)} />
      <div className="flex min-h-0 flex-1">
        <nav aria-label="Herramientas" className="flex max-md:hidden"><Rail active={tab} onChange={setTab} /></nav>
        <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`rail-${tab}`} className="w-panel shrink-0 overflow-y-auto border-r border-border bg-surface p-3 max-md:hidden">
          {tab === 'media' ? <MediaPanel projectId={projectId} /> : tab === 'text' ? <TextPanel /> : tab === 'captions' ? <CaptionsPanel projectId={projectId} /> : <AudioPanel projectId={projectId} />}
        </div>
        <Preview ref={preview} projectId={projectId} />
        <Inspector />
      </div>
      <Timeline onSeek={(ms) => preview.current?.seek(ms)} onPause={() => preview.current?.pause()} />
      {sheet && (
        <div role="dialog" aria-modal="false" aria-label={SHEET_LABEL[sheet]} className="fixed inset-x-0 bottom-14 z-40 max-h-[55dvh] overflow-y-auto rounded-t-lg border-t border-border bg-surface p-3 shadow-pop md:hidden">
          <button type="button" onClick={() => setSheet(null)} aria-label="Cerrar panel" className="float-right inline-flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-hover"><X size={18} /></button>
          {sheet === 'media' ? <MediaPanel projectId={projectId} /> : sheet === 'text' ? <TextPanel /> : sheet === 'captions' ? <CaptionsPanel projectId={projectId} /> : sheet === 'audio' ? <AudioPanel projectId={projectId} /> : <><h2 className="mb-3 font-semibold">Ajustes</h2><InspectorBody /></>}
        </div>
      )}
      <nav aria-label="Paneles" className="grid h-14 shrink-0 grid-cols-5 border-t border-border bg-surface md:hidden">
        {(Object.keys(SHEET_LABEL) as (keyof typeof SHEET_LABEL)[]).map((k) => {
          const Icon = SHEET_ICON[k];
          return (
            <button key={k} type="button" aria-pressed={sheet === k} onClick={() => setSheet(sheet === k ? null : k)}
              className={`flex flex-col items-center justify-center gap-0.5 text-2xs ${sheet === k ? 'text-accent' : 'text-text-muted'}`}>
              <Icon size={20} aria-hidden />{SHEET_LABEL[k]}
            </button>
          );
        })}
      </nav>
      {exporting && <ExportDialog projectId={projectId} onClose={() => setExporting(false)} />}
      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center max-md:bottom-[72px]">
        {toast && <div key={toast.id} className="pointer-events-auto flex items-center gap-4 rounded-md bg-text px-4 py-2 text-sm font-semibold text-bg shadow-pop">
          {toast.text}{toast.undo && <button type="button" className="underline" onClick={() => { useEditor.getState().undo(); useEditor.setState({ toast: null }); }}>Deshacer</button>}</div>}
      </div>
    </div>
  );
}
