'use client';
// Preview player. The audio clock (AudioContext) is the master; video frames
// are pulled from per-clip iterators to match it. Paused seeks fetch one frame.
import type { WrappedCanvas } from 'mediabunny';
import { type Project, locate, starts, clipLength, duration } from './project';
import { getSource } from './sources';
import { drawFrame } from './compositor';

export class Engine {
  private ctx2d: CanvasRenderingContext2D;
  private audio: AudioContext | null = null;
  private gain: GainNode | null = null;
  private playing = false;
  private startCtx = 0; private startMs = 0;
  private raf = 0; private seekToken = 0; private runToken = 0;
  private scheduled: AudioBufferSourceNode[] = [];
  private iter: { clipId: string; it: AsyncGenerator<WrappedCanvas | null, void, unknown>; next: WrappedCanvas | null } | null = null;
  onTime: (ms: number) => void = () => {};
  onEnded: () => void = () => {};

  constructor(private canvas: HTMLCanvasElement, private projectId: string, private p: Project) {
    this.ctx2d = canvas.getContext('2d')!;
  }
  setProject(p: Project) { const was = this.playing; const t = this.time(); if (was) this.pause(); this.p = p; if (was) this.play(Math.min(t, duration(p))); }
  isPlaying() { return this.playing; }
  time() { return this.playing && this.audio ? this.startMs + (this.audio.currentTime - this.startCtx) * 1000 : this.startMs; }

  /** Show the exact frame at t (paused). Latest call wins. */
  async seek(t: number) {
    this.startMs = t;
    const token = ++this.seekToken;
    const hit = locate(this.p, t);
    if (!hit) { drawFrame(this.ctx2d, this.canvas.width, this.canvas.height, null, 'fill'); return; }
    const asset = this.p.assets.find((a) => a.id === hit.clip.assetId)!;
    const src = await getSource(this.projectId, asset);
    let img: CanvasImageSource & { width: number; height: number } | null = src.image ?? null;
    if (src.sink) img = (await src.sink.getCanvas(hit.sourceMs / 1000))?.canvas as HTMLCanvasElement ?? null;
    if (token !== this.seekToken || this.playing) return;
    drawFrame(this.ctx2d, this.canvas.width, this.canvas.height, img, hit.clip.fit);
  }

  async play(from = this.startMs) {
    if (this.playing) return;
    const total = duration(this.p);
    if (total === 0) return;
    if (from >= total - 1) from = 0;
    this.audio ??= new AudioContext({ latencyHint: 'playback' });
    if (!this.gain) { this.gain = this.audio.createGain(); this.gain.connect(this.audio.destination); }
    await this.audio.resume();
    this.playing = true; this.startMs = from; this.startCtx = this.audio.currentTime + 0.05;
    const token = ++this.runToken;
    this.scheduleAudio(token, from);
    const loop = async () => {
      if (!this.playing || token !== this.runToken) return;
      const t = this.time();
      if (t >= total) { this.pause(); this.startMs = total; this.onTime(total); this.onEnded(); return; }
      await this.drawAt(t, token);
      this.onTime(t);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  pause() {
    if (!this.playing) return;
    this.startMs = this.time(); this.playing = false; this.runToken++;
    cancelAnimationFrame(this.raf);
    for (const n of this.scheduled) { try { n.stop(); } catch {} }
    this.scheduled = [];
    this.iter?.it.return(); this.iter = null;
  }

  destroy() { this.pause(); this.audio?.close(); }

  private async drawAt(t: number, token: number) {
    const hit = locate(this.p, t);
    if (!hit) return;
    const asset = this.p.assets.find((a) => a.id === hit.clip.assetId)!;
    const src = await getSource(this.projectId, asset);
    if (token !== this.runToken) return;
    if (src.image) { drawFrame(this.ctx2d, this.canvas.width, this.canvas.height, src.image, hit.clip.fit); return; }
    if (!src.sink) return;
    const s = hit.sourceMs / 1000;
    if (!this.iter || this.iter.clipId !== hit.clip.id) {
      this.iter?.it.return();
      const it = src.sink.canvases(s, hit.clip.outMs / 1000);
      this.iter = { clipId: hit.clip.id, it, next: (await it.next()).value ?? null };
    }
    // advance to the newest frame not after s
    let shown: WrappedCanvas | null = null;
    while (this.iter.next && this.iter.next.timestamp <= s + 0.001) {
      shown = this.iter.next;
      const n = await this.iter.it.next();
      if (token !== this.runToken) return;
      this.iter.next = n.done ? null : n.value;
    }
    if (shown) drawFrame(this.ctx2d, this.canvas.width, this.canvas.height, shown.canvas as HTMLCanvasElement, hit.clip.fit);
  }

  private async scheduleAudio(token: number, from: number) {
    const st = starts(this.p);
    for (let i = 0; i < this.p.clips.length; i++) {
      const c = this.p.clips[i], s0 = st[i], len = clipLength(c);
      if (s0 + len <= from || c.volume === 0) continue;
      const asset = this.p.assets.find((a) => a.id === c.assetId)!;
      if (!asset.hasAudio) continue;
      const src = await getSource(this.projectId, asset);
      if (!src.audioSink) continue;
      const inS = (c.inMs + Math.max(0, from - s0)) / 1000, outS = c.outMs / 1000;
      for await (const { buffer, timestamp } of src.audioSink.buffers(inS, outS)) {
        if (token !== this.runToken || !this.audio || !this.gain) return;
        const tl = s0 + (timestamp * 1000 - c.inMs);                // timeline ms of this buffer's start
        const when = this.startCtx + (tl - from) / 1000;
        const n = this.audio.createBufferSource(); n.buffer = buffer;
        const g = this.audio.createGain(); g.gain.value = c.volume; n.connect(g).connect(this.gain);
        const offset = Math.max(0, this.audio.currentTime - when, inS - timestamp);
        const stopAt = this.startCtx + (s0 + len - from) / 1000;     // never past the clip's out point
        if (offset >= buffer.duration) continue;
        n.start(Math.max(when, this.audio.currentTime), offset);
        n.stop(stopAt);
        this.scheduled.push(n);
        // don't decode too far ahead
        while (when - this.audio.currentTime > 4 && token === this.runToken) await new Promise((r) => setTimeout(r, 250));
      }
    }
  }
}
