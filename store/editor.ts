'use client';
import { create } from 'zustand';
import type { Project } from '@/lib/project';
import { saveProject } from '@/lib/storage';

type Save = 'saved' | 'saving' | 'error';
interface EditorState {
  project: Project | null;
  past: Project[]; future: Project[];
  coalesce: string | null;          // edits with the same key (a drag) become one undo step
  selected: string | null;
  playhead: number; playing: boolean;
  pps: number;                      // timeline zoom: pixels per second
  save: Save;
  toast: { id: number; text: string; undo?: boolean } | null;
  load: (p: Project) => void;
  apply: (fn: (p: Project) => Project, coalesceKey?: string) => void;
  endCoalesce: () => void;
  undo: () => void; redo: () => void;
  select: (id: string | null) => void;
  setPlayhead: (ms: number) => void; setPlaying: (b: boolean) => void; setPps: (n: number) => void;
  notify: (text: string, undo?: boolean) => void;
}

let saveTimer: ReturnType<typeof setTimeout> | undefined, toastTimer: ReturnType<typeof setTimeout> | undefined;
const LIMIT = 200;

export const useEditor = create<EditorState>()((set, get) => {
  const persist = (p: Project) => {
    clearTimeout(saveTimer); set({ save: 'saving' });
    saveTimer = setTimeout(() => saveProject(get().project ?? p).then(() => set({ save: 'saved' }), () => set({ save: 'error' })), 400);
  };
  return {
    project: null, past: [], future: [], coalesce: null, selected: null, playhead: 0, playing: false, pps: 80, save: 'saved', toast: null,
    load: (p) => set({ project: p, past: [], future: [], selected: null, playhead: 0, save: 'saved' }),
    apply: (fn, key) => {
      const cur = get().project; if (!cur) return;
      const next = fn(cur); if (next === cur) return;
      const merge = key && get().coalesce === key;
      set({ project: next, past: merge ? get().past : [...get().past, cur].slice(-LIMIT), future: [], coalesce: key ?? null });
      persist(next);
    },
    endCoalesce: () => set({ coalesce: null }),
    undo: () => { const { past, project, future } = get(); if (!past.length || !project) return; const prev = past[past.length - 1]; set({ project: prev, past: past.slice(0, -1), future: [project, ...future], coalesce: null }); persist(prev); },
    redo: () => { const { past, project, future } = get(); if (!future.length || !project) return; const nxt = future[0]; set({ project: nxt, past: [...past, project], future: future.slice(1), coalesce: null }); persist(nxt); },
    select: (id) => set({ selected: id }),
    setPlayhead: (ms) => set({ playhead: Math.max(0, ms) }),
    setPlaying: (b) => set({ playing: b }),
    setPps: (n) => set({ pps: Math.min(600, Math.max(10, n)) }),
    notify: (text, undo) => { clearTimeout(toastTimer); set({ toast: { id: Date.now(), text, undo } }); toastTimer = setTimeout(() => set({ toast: null }), undo ? 6000 : 3000); },
  };
});

// save before the tab goes away
if (typeof window !== 'undefined') addEventListener('visibilitychange', () => { const p = useEditor.getState().project; if (document.visibilityState === 'hidden' && p) saveProject(p); });
