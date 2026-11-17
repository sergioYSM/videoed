import { NextResponse } from 'next/server';
import { isInCatalog, fileUrl } from '@/lib/incompetech.server';

// Serves a song from the catalogue (only names in the catalogue: not an open proxy).
// Cached for a year so each file is fetched from incompetech as rarely as possible.
export async function GET(req: Request) {
  const name = new URL(req.url).searchParams.get('name') ?? '';
  if (!name || name.length > 200 || !/\.mp3$/i.test(name)) return NextResponse.json({ error: 'nombre no válido' }, { status: 400 });
  try { if (!(await isInCatalog(name))) return NextResponse.json({ error: 'no está en el catálogo' }, { status: 404 }); }
  catch { return NextResponse.json({ error: 'catálogo no disponible' }, { status: 503 }); }
  const upstream = await fetch(fileUrl(name));
  if (!upstream.ok || !upstream.body) return NextResponse.json({ error: 'no se ha podido descargar' }, { status: 502 });
  return new Response(upstream.body, { headers: {
    'content-type': 'audio/mpeg',
    ...(upstream.headers.get('content-length') ? { 'content-length': upstream.headers.get('content-length')! } : {}),
    'cache-control': 'public, max-age=31536000, immutable',
  } });
}
