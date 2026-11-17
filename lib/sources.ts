'use client';
// One decoder setup per asset, reused by preview and export.
import { Input, ALL_FORMATS, BlobSource, CanvasSink, AudioBufferSink, type InputVideoTrack, type InputAudioTrack } from 'mediabunny';
import { readMedia } from './storage';
import type { AssetRef } from './project';

export interface Source { asset: AssetRef; video?: InputVideoTrack; audio?: InputAudioTrack; sink?: CanvasSink; audioSink?: AudioBufferSink; image?: ImageBitmap }
const cache = new Map<string, Promise<Source>>();

export function getSource(projectId: string, asset: AssetRef): Promise<Source> {
  const key = `${projectId}/${asset.id}`;
  if (!cache.has(key)) cache.set(key, (async () => {
    const file = await readMedia(projectId, asset.id);
    if (asset.kind === 'image') return { asset, image: await createImageBitmap(file) };
    const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
    const video = (await input.getPrimaryVideoTrack()) ?? undefined;
    const audio = asset.hasAudio ? (await input.getPrimaryAudioTrack()) ?? undefined : undefined;
    return { asset, video, audio, sink: video && new CanvasSink(video, { poolSize: 3 }), audioSink: audio && new AudioBufferSink(audio) };
  })());
  return cache.get(key)!;
}
export function dropSources(projectId: string) { for (const k of cache.keys()) if (k.startsWith(`${projectId}/`)) cache.delete(k); }
