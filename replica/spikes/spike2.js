import { Input, ALL_FORMATS, BlobSource, CanvasSink, AudioBufferSink, Output, Mp4OutputFormat, BufferTarget, CanvasSource, AudioBufferSource, QUALITY_HIGH, canEncodeAudio } from 'mediabunny';
import { registerAacEncoder } from '@mediabunny/aac-encoder';

// Trim [inS, outS] of an input file, draw a caption over it, export MP4.
window.runTrim = async (inS, outS) => {
  const t0 = performance.now();
  if (!(await canEncodeAudio('aac'))) registerAacEncoder();
  const blob = await (await fetch('out.mp4')).blob();
  const input = new Input({ source: new BlobSource(blob), formats: ALL_FORMATS });
  const vTrack = await input.getPrimaryVideoTrack();
  const aTrack = await input.getPrimaryAudioTrack();
  const W = vTrack.displayWidth, H = vTrack.displayHeight, FPS = 30;
  const canvas = new OffscreenCanvas(W, H); const ctx = canvas.getContext('2d');
  const out = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target: new BufferTarget() });
  const vs = new CanvasSource(canvas, { codec: 'avc', bitrate: QUALITY_HIGH });
  out.addVideoTrack(vs, { frameRate: FPS });
  const as = new AudioBufferSource({ codec: 'aac', bitrate: QUALITY_HIGH });
  out.addAudioTrack(as);
  await out.start();
  const sink = new CanvasSink(vTrack, { poolSize: 2 });
  const times = []; for (let t = inS; t < outS; t += 1 / FPS) times.push(t);
  let i = 0;
  for await (const wrapped of sink.canvasesAtTimestamps(times)) {
    if (wrapped) ctx.drawImage(wrapped.canvas, 0, 0);
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(80, H - 420, W - 160, 180);
    ctx.fillStyle = '#ffd400'; ctx.font = 'bold 90px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Subtítulo de prueba', W / 2, H - 300);
    await vs.add(i / FPS, 1 / FPS); i++;
  }
  const asink = new AudioBufferSink(aTrack);
  for await (const { buffer, timestamp } of asink.buffers(inS, outS)) {
    // re-base timestamps to the start of the trim
    const start = Math.max(0, Math.round((inS - timestamp) * buffer.sampleRate));
    const len = Math.min(buffer.length - start, Math.round((outS - Math.max(timestamp, inS)) * buffer.sampleRate));
    if (len <= 0) continue;
    const b = new AudioBuffer({ length: len, numberOfChannels: buffer.numberOfChannels, sampleRate: buffer.sampleRate });
    for (let c = 0; c < buffer.numberOfChannels; c++) b.copyToChannel(buffer.getChannelData(c).subarray(start, start + len), c);
    await as.add(b);
  }
  await out.finalize();
  const buf = new Uint8Array(out.target.buffer);
  let bin = ''; for (let k = 0; k < buf.length; k += 0x8000) bin += String.fromCharCode(...buf.subarray(k, k + 0x8000));
  return { frames: i, ms: Math.round(performance.now() - t0), b64: btoa(bin) };
};
