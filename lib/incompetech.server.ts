import 'server-only';
import { moodsEs } from './moods';

// Kevin MacLeod's catalogue (all CC BY 4.0, verified on incompetech.com on 2026-11-17).
const BASE = 'https://incompetech.com/music/royalty-free/';
export interface Piece { title: string; filename: string; length: string; feel: string; bpm: string; isrc: string | null; description: string }
export interface CatalogItem { id: string; title: string; moods: string[]; bpm: number; durationMs: number; description: string; file: string; source: string }

export async function pieces(): Promise<Piece[]> {
  const res = await fetch(BASE + 'pieces.json', { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`catalogue HTTP ${res.status}`);
  return res.json();
}
const ms = (len: string) => { const [h, m, s] = len.split(':').map(Number); return ((h * 60 + m) * 60 + s) * 1000; };

export async function catalog(): Promise<CatalogItem[]> {
  return (await pieces()).filter((p) => p.filename && p.title).map((p) => ({
    id: `kmc-${(p.isrc ?? p.filename).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    title: p.title, moods: moodsEs(p.feel ?? ''), bpm: Number(p.bpm) || 0, durationMs: ms(p.length ?? '00:00:00'),
    description: (p.description ?? '').slice(0, 160),
    file: `/api/music/file?name=${encodeURIComponent(p.filename)}`,
    source: BASE + 'mp3-royaltyfree/' + encodeURIComponent(p.filename),
  }));
}
export async function isInCatalog(filename: string) { return (await pieces()).some((p) => p.filename === filename); }
export const fileUrl = (filename: string) => BASE + 'mp3-royaltyfree/' + encodeURIComponent(filename);
