'use client';
// Render the project to an MP4 in the browser: H.264 High + AAC (WASM fallback).
import { Output, Mp4OutputFormat, BufferTarget, CanvasSource, AudioBufferSource, QUALITY_HIGH, QUALITY_MEDIUM, canEncodeAudio, canEncodeVideo } from 'mediabunny';
import { registerAacEncoder } from '@mediabunny/aac-encoder';
import { type Project, starts, clipLength, duration } from './project';
import { getSource } from './sources';
import { drawFrame } from './compositor';

export interface ExportOptions { height: 720 | 1080; quality: 'standard' | 'high' }
export class ExportCancelled extends Error {}

export async function canExport(): Promise<string | null> {
  if (typeof VideoEncoder === 'undefined') return 'Tu navegador no permite exportar vídeo. Usa Chrome, Edge o Safari actualizados.';
  if (!(await canEncodeVideo('avc', { width: 1080, height: 1920, bitrate: 8e6 }))) return 'Tu navegador no puede codificar H.264. Usa Chrome, Edge o Safari actualizados.';
  return null;
}

/** Output size keeps the project's aspect; dimensions even (H.264 needs it). */
export function outputSize(p: Project, height: number) {
  const short = height; // "720p/1080p" refers to the short side
  const k = short / Math.min(p.width, p.height);
  const even = (n: number) => Math.round(n / 2) * 2;
  return { width: even(p.width * k), height: even(p.height * k) };
}

export async function exportProject(p: Project, projectId: string, opt: ExportOptions, onProgress: (f: number) => void, signal: AbortSignal): Promise<Blob> {
  const total = duration(p);
  if (!total) throw new Error('El proyecto está vacío.');
  if (!(await canEncodeAudio('aac'))) registerAacEncoder();
  const { width: W, height: H } = outputSize(p, opt.height);
  const fps = p.fps, frameMs = 1000 / fps;
  const canvas = new OffscreenCanvas(W, H); const ctx = canvas.getContext('2d')!;
  const out = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target: new BufferTarget() });
  const vs = new CanvasSource(canvas, { codec: 'avc', bitrate: opt.quality === 'high' ? QUALITY_HIGH : QUALITY_MEDIUM });
  out.addVideoTrack(vs, { frameRate: fps });
  const as = new AudioBufferSource({ codec: 'aac', bitrate: QUALITY_HIGH });
  out.addAudioTrack(as);
  await out.start();
  const check = () => { if (signal.aborted) { out.cancel(); throw new ExportCancelled(); } };

  // video: integer frame counter across the whole timeline (no float drift)
  const totalFrames = Math.round((total * fps) / 1000);
  const st = starts(p);
  let f = 0;
  for (let i = 0; i < p.clips.length; i++) {
    const c = p.clips[i], asset = p.assets.find((a) => a.id === c.assetId)!;
    const src = await getSource(projectId, asset);
    const clipEndFrame = Math.round(((st[i] + clipLength(c)) * fps) / 1000);
    const times: number[] = [];
    for (let k = f; k < clipEndFrame; k++) times.push((c.inMs + (k * frameMs - st[i])) / 1000);
    if (src.image) {
      for (const _ of times) { check(); drawFrame(ctx, W, H, src.image, c.fit); await vs.add(f * frameMs / 1000, frameMs / 1000); f++; onProgress((f / totalFrames) * 0.85); }
      continue;
    }
    let last: HTMLCanvasElement | OffscreenCanvas | null = null;
    for await (const w of src.sink!.canvasesAtTimestamps(times)) {
      check();
      if (w) last = w.canvas;
      drawFrame(ctx, W, H, last as never, c.fit);
      await vs.add(f * frameMs / 1000, frameMs / 1000); f++;
      onProgress((f / totalFrames) * 0.85);
    }
  }

  // audio: mix every clip into one 48 kHz stereo buffer (resampling handled by OfflineAudioContext)
  const sr = 48000;
  const mix = new OfflineAudioContext(2, Math.max(1, Math.ceil((total / 1000) * sr)), sr);
  for (let i = 0; i < p.clips.length; i++) {
    const c = p.clips[i], asset = p.assets.find((a) => a.id === c.assetId)!;
    if (!asset.hasAudio || c.volume === 0) continue;
    const src = await getSource(projectId, asset);
    if (!src.audioSink) continue;
    for await (const { buffer, timestamp } of src.audioSink.buffers(c.inMs / 1000, c.outMs / 1000)) {
      check();
      const n = mix.createBufferSource(); n.buffer = buffer;
      const g = mix.createGain(); g.gain.value = c.volume; n.connect(g).connect(mix.destination);
      const at = (st[i] + (timestamp * 1000 - c.inMs)) / 1000;      // seconds on the timeline
      const offset = Math.max(0, -at, c.inMs / 1000 - timestamp);
      n.start(Math.max(0, at), offset);
      n.stop((st[i] + clipLength(c)) / 1000);
    }
  }
  onProgress(0.9);
  const mixed = await mix.startRendering();
  check();
  await as.add(mixed);
  await out.finalize();
  onProgress(1);
  return new Blob([out.target.buffer!], { type: 'video/mp4' });
}
