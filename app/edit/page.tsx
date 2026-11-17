'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { loadProject } from '@/lib/storage';
import { useEditor } from '@/store/editor';
import { Editor } from '@/components/editor/Editor';

// One static page for every project (?id=), so the service worker can serve it offline.
function EditorPage() {
  const id = useSearchParams().get('id') ?? '';
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');
  useEffect(() => {
    if (!id) { setState('missing'); return; }
    loadProject(id).then((p) => { if (p) { useEditor.getState().load(p); setState('ready'); } else setState('missing'); }, () => setState('missing'));
  }, [id]);
  if (state === 'loading') return <div className="flex h-dvh items-center justify-center text-text-muted" aria-busy="true">Abriendo proyecto…</div>;
  if (state === 'missing') return (
    <main className="flex h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-xl font-bold">No encontramos este proyecto</h1>
      <p className="max-w-md text-text-muted">Los proyectos se guardan en el navegador donde los creaste. Si lo hiciste en otro navegador o borraste los datos del sitio, aquí no está. Si tienes su archivo .ownframe, ábrelo desde tus proyectos.</p>
      <Link href="/app" className="underline">Volver a tus proyectos</Link>
    </main>
  );
  return <Editor projectId={id} />;
}
export default function Page() { return <Suspense><EditorPage /></Suspense>; }
