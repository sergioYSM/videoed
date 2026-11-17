'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Plus, Trash2, Smartphone, Monitor, Square, HardDrive } from 'lucide-react';
import { createProject, duration, type Aspect, type Project } from '@/lib/project';
import { deleteProject, listProjects, saveProject, storageInfo } from '@/lib/storage';
import { shortDuration } from '@/lib/time';
import { Button } from '@/components/ui/Button';

const sizes: { aspect: Aspect; label: string; hint: string; Icon: typeof Smartphone }[] = [
  { aspect: '9:16', label: 'Vertical', hint: 'TikTok, Reels, Shorts', Icon: Smartphone },
  { aspect: '16:9', label: 'Horizontal', hint: 'YouTube', Icon: Monitor },
  { aspect: '1:1', label: 'Cuadrado', hint: 'Publicaciones', Icon: Square },
];

export default function Projects() {
  const router = useRouter();
  const [list, setList] = useState<Project[] | null>(null);
  const [usage, setUsage] = useState('');
  const refresh = () => listProjects().then(setList).catch(() => setList([]));
  useEffect(() => {
    document.title = 'Proyectos · Ownframe';
    refresh();
    storageInfo().then((s) => setUsage(`· ${(s.usage / 1e6).toFixed(0)} MB usados`)).catch(() => {});
  }, []);
  const create = async (a: Aspect) => { const p = createProject(a); await saveProject(p); router.push(`/editor/${p.id}`); };

  return (
    <main className="mx-auto max-w-[1100px] px-4 py-8">
      <p className="mb-6 flex items-center gap-2 text-lg font-extrabold">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/icon.svg" alt="" width={28} height={28} />ownframe</p>
      <h1 className="text-2xl font-extrabold">Tus proyectos</h1>
      <p className="mt-1 flex items-center gap-2 text-sm text-text-muted"><HardDrive size={14} aria-hidden /> Tus vídeos no salen de este dispositivo. <span className="text-text-subtle">{usage}</span></p>
      <section aria-labelledby="new" className="mt-6">
        <h2 id="new" className="mb-3 text-lg font-semibold">Nuevo proyecto</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {sizes.map(({ aspect, label, hint, Icon }) => (
            <button key={aspect} type="button" onClick={() => create(aspect)} className="flex items-center gap-4 rounded-lg border border-border bg-surface p-4 text-left hover:border-accent hover:bg-surface-hover">
              <Icon size={28} className="text-accent" aria-hidden />
              <span><span className="block font-semibold">{label} <span className="mono text-sm text-text-subtle">{aspect}</span></span><span className="text-sm text-text-muted">{hint}</span></span>
              <Plus size={18} className="ml-auto text-text-muted" aria-hidden />
            </button>
          ))}
        </div>
      </section>
      <section aria-labelledby="recent" className="mt-8">
        <h2 id="recent" className="mb-3 text-lg font-semibold">Recientes</h2>
        {list === null ? <div className="grid gap-3 sm:grid-cols-3" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-40 rounded-lg" />)}</div>
          : list.length === 0 ? <p className="rounded-lg border border-dashed border-border p-8 text-center text-text-muted">Aún no tienes proyectos. Elige un formato arriba para empezar.</p>
          : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((p) => {
                const thumb = p.assets.find((a) => a.id === p.clips[0]?.assetId)?.thumb;
                return (
                  <li key={p.id} className="group relative overflow-hidden rounded-lg border border-border bg-surface hover:border-border-input">
                    <Link href={`/editor/${p.id}`} className="block">
                      <div className="flex h-32 items-center justify-center bg-canvas-bg">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {thumb ? <img src={thumb} alt="" className="h-full object-contain" /> : <span className="text-sm text-text-subtle">Sin clips</span>}
                      </div>
                      <div className="p-3"><p className="truncate font-semibold" title={p.name}>{p.name}</p>
                        <p className="text-sm text-text-muted"><span className="mono">{p.aspect}</span> · {p.clips.length} clips · {shortDuration(duration(p))} · {new Date(p.updatedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</p></div>
                    </Link>
                    <Button variant="ghost" size="sm" className="absolute right-2 top-2 bg-bg/70 opacity-0 focus:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100" aria-label={`Borrar ${p.name}`}
                      onClick={async () => { if (confirm(`¿Borrar «${p.name}» y sus vídeos de este navegador? No se puede deshacer.`)) { await deleteProject(p.id); refresh(); } }}><Trash2 size={14} /></Button>
                  </li>
                );
              })}
            </ul>
          )}
      </section>
    </main>
  );
}
