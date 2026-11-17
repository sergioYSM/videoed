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
import { split, removeClip, removeText, removeAudio, removeCue, duration, locate, trim } from '@/lib/project';
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

export function Editor({ projectId }: { projectId: string }) {
  const [tab, setTab] = useState<RailTab>('media');
  const [exporting, setExporting] = useState(false);
  const preview = useRef<PreviewHandle>(null);
  const name = useEditor((s) => s.project?.name);
  const toast = useEditor((s) => s.toast);
  useEffect(() => { document.title = `${name ?? 'Proyecto'} · videoed`; }, [name]);

  // keyboard shortcuts (not while typing in a field)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest('input, textarea, select, [contenteditable=true], [role=dialog], [role=slider]')) return;
      const s = useEditor.getState(); const p = s.project; if (!p) return;
      const frame = 1000 / p.fps;
      if (e.code === 'Space') { e.preventDefault(); preview.current?.toggle(); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); preview.current?.pause(); e.shiftKey ? s.redo() : s.undo(); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); s.redo(); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') { e.preventDefault(); setExporting(true); }
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
        <nav aria-label="Herramientas" className="flex"><Rail active={tab} onChange={setTab} /></nav>
        <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`rail-${tab}`} className="w-panel shrink-0 overflow-y-auto border-r border-border bg-surface p-3 max-md:hidden">
          {tab === 'media' ? <MediaPanel projectId={projectId} /> : tab === 'text' ? <TextPanel /> : tab === 'captions' ? <CaptionsPanel projectId={projectId} /> : <AudioPanel projectId={projectId} />}
        </div>
        <Preview ref={preview} projectId={projectId} />
        <Inspector />
      </div>
      <Timeline onSeek={(ms) => preview.current?.seek(ms)} onPause={() => preview.current?.pause()} />
      {exporting && <ExportDialog projectId={projectId} onClose={() => setExporting(false)} />}
      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center">
        {toast && <div key={toast.id} className="pointer-events-auto flex items-center gap-4 rounded-md bg-text px-4 py-2 text-sm font-semibold text-bg shadow-pop">
          {toast.text}{toast.undo && <button type="button" className="underline" onClick={() => { useEditor.getState().undo(); useEditor.setState({ toast: null }); }}>Deshacer</button>}</div>}
      </div>
    </div>
  );
}
