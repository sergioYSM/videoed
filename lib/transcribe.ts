'use client';
// Automatic captions with Whisper, running on this device (WebGPU if available, else WASM).
// The model (~150-250 MB) is downloaded once from Hugging Face and cached by the browser.
// NOTE: not testable in the build environment (model host blocked); verify in a real browser.
import type { Project, Cue } from './project';
import { starts, clipLength } from './project';
import { getSource } from './sources';

export const MODEL = 'onnx-community/whisper-base';
export const MODEL_SIZE_MB = 200;

/** Mix the main track's audio into 16 kHz mono, as Whisper expects. */
export async function mixForSpeech(p: Project, projectId: string): Promise<Float32Array> {
  const total = p.clips.reduce((s, c) => s + clipLength(c), 0);
  const ctx = new OfflineAudioContext(1, Math.max(1, Math.ceil((total / 1000) * 16000)), 16000);
  const st = starts(p);
  for (let i = 0; i < p.clips.length; i++) {
    const c = p.clips[i], asset = p.assets.find((a) => a.id === c.assetId);
    if (!asset?.hasAudio) continue;
    const src = await getSource(projectId, asset);
    if (!src.audioSink) continue;
    for await (const { buffer, timestamp } of src.audioSink.buffers(c.inMs / 1000, c.outMs / 1000)) {
      const n = ctx.createBufferSource(); n.buffer = buffer; n.connect(ctx.destination);
      const at = (st[i] + timestamp * 1000 - c.inMs) / 1000;
      n.start(Math.max(0, at), Math.max(0, -at, c.inMs / 1000 - timestamp)); n.stop((st[i] + clipLength(c)) / 1000);
    }
  }
  return (await ctx.startRendering()).getChannelData(0);
}

export async function transcribe(p: Project, projectId: string, lang: string, onStatus: (s: string, f?: number) => void): Promise<Cue[]> {
  onStatus('Preparando el audio…');
  const audio = await mixForSpeech(p, projectId);
  if (!audio.some((v) => Math.abs(v) > 0.01)) return [];
  onStatus('Descargando el modelo (solo la primera vez)…', 0);
  const { pipeline } = await import('@huggingface/transformers');
  const device = 'gpu' in navigator ? 'webgpu' : 'wasm';
  const asr = await pipeline('automatic-speech-recognition', MODEL, {
    device, dtype: device === 'webgpu' ? 'fp32' : 'q8',
    progress_callback: (e: { status: string; progress?: number }) => { if (e.status === 'progress' && e.progress !== undefined) onStatus('Descargando el modelo (solo la primera vez)…', e.progress / 100); },
  });
  onStatus('Transcribiendo en tu dispositivo…');
  const out = await asr(audio, { language: lang, task: 'transcribe', return_timestamps: true, chunk_length_s: 30, stride_length_s: 5 }) as { chunks?: { text: string; timestamp: [number, number | null] }[] };
  return (out.chunks ?? []).map((c, i, all) => ({
    id: crypto.randomUUID(), text: c.text.trim(),
    startMs: Math.round(c.timestamp[0] * 1000),
    endMs: Math.round((c.timestamp[1] ?? all[i + 1]?.timestamp[0] ?? c.timestamp[0] + 2) * 1000),
  })).filter((c) => c.text);
}
