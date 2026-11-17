'use client';
// Read what an imported file is, and whether this browser can use it.
import { Input, ALL_FORMATS, BlobSource, CanvasSink } from 'mediabunny';
import type { AssetRef } from './project';

export class ImportError extends Error {}

const hevcHint = 'Este vídeo usa HEVC y tu navegador no puede leerlo. Prueba en Safari o Chrome en Mac/Windows, o graba en «Más compatible».';

export async function probe(file: File): Promise<Omit<AssetRef, 'id'>> {
  const base = { name: file.name, mime: file.type, size: file.size };
  if (file.type.startsWith('image/')) {
    const bmp = await createImageBitmap(file).catch(() => { throw new ImportError('No se ha podido abrir esta imagen.'); });
    const thumb = await thumbFrom(bmp, bmp.width, bmp.height); bmp.close();
    return { ...base, kind: 'image', durationMs: 3000, width: bmp.width, height: bmp.height, hasAudio: false, thumb };
  }
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  let v, a;
  try { v = await input.getPrimaryVideoTrack(); a = await input.getPrimaryAudioTrack(); }
  catch { throw new ImportError('No reconocemos este archivo. Usa MP4, MOV, WebM, MP3, WAV o M4A.'); }
  if (!v && !a) throw new ImportError('Este archivo no tiene vídeo ni audio.');
  const durationMs = Math.round((await input.computeDuration()) * 1000);
  if (!durationMs) throw new ImportError('Este archivo está vacío o dañado.');
  if (v) {
    if (!(await v.canDecode())) throw new ImportError(v.codec === 'hevc' ? hevcHint : `Tu navegador no puede leer el vídeo de este archivo (${v.codec ?? 'formato desconocido'}).`);
    const hasAudio = !!a && (await a.canDecode());
    const sink = new CanvasSink(v, { width: 320, fit: 'contain' });
    const frame = await sink.getCanvas(Math.min(0.5, durationMs / 2000));
    const thumb = frame ? await thumbFrom(frame.canvas, frame.canvas.width, frame.canvas.height) : undefined;
    return { ...base, kind: 'video', durationMs, width: v.displayWidth, height: v.displayHeight, hasAudio, thumb };
  }
  if (!(await a!.canDecode())) throw new ImportError(`Tu navegador no puede leer el audio de este archivo (${a!.codec ?? 'formato desconocido'}).`);
  return { ...base, kind: 'audio', durationMs, hasAudio: true };
}

async function thumbFrom(src: CanvasImageSource, w: number, h: number): Promise<string> {
  const W = 320, H = Math.max(1, Math.round((h / w) * W));
  const c = new OffscreenCanvas(W, H); c.getContext('2d')!.drawImage(src, 0, 0, W, H);
  const blob = await c.convertToBlob({ type: 'image/jpeg', quality: 0.7 });
  return new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(blob); });
}
