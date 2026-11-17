import { NextResponse } from 'next/server';
import { catalog } from '@/lib/incompetech.server';

export const revalidate = 86400;
export async function GET() {
  try {
    return NextResponse.json(await catalog(), { headers: { 'cache-control': 'public, s-maxage=86400, stale-while-revalidate=604800' } });
  } catch {
    return NextResponse.json({ error: 'El catálogo no está disponible ahora. Prueba más tarde o usa las destacadas.' }, { status: 503 });
  }
}
