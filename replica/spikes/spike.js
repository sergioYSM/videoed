import { Output, Mp4OutputFormat, BufferTarget, CanvasSource, AudioBufferSource, QUALITY_HIGH, canEncodeAudio } from 'mediabunny';
import { registerAacEncoder } from '@mediabunny/aac-encoder';

window.runSpike = async (seconds = 10) => {
  const t0 = performance.now();
  const nativeAac = await canEncodeAudio('aac');
  if (!nativeAac) registerAacEncoder();
  const W = 1080, H = 1920, FPS = 30;
  const canvas = new OffscreenCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const output = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target: new BufferTarget() });
  const video = new CanvasSource(canvas, { codec: 'avc', bitrate: QUALITY_HIGH });
  output.addVideoTrack(video, { frameRate: FPS });
  const audio = new AudioBufferSource({ codec: 'aac', bitrate: QUALITY_HIGH });
  output.addAudioTrack(audio);
  await output.start();
  for (let i = 0; i < seconds * FPS; i++) {
    const t = i / FPS;
    ctx.fillStyle = `hsl(${(t * 36) % 360} 60% 35%)`; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 120px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(`Frame ${i}`, W / 2, H / 2 + Math.sin(t * 3) * 300);
    await video.add(t, 1 / FPS);
  }
  const sr = 48000, ab = new AudioBuffer({ length: sr * seconds, numberOfChannels: 2, sampleRate: sr });
  for (let c = 0; c < 2; c++) { const d = ab.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] = 0.2 * Math.sin(2 * Math.PI * 440 * i / sr); }
  await audio.add(ab);
  await output.finalize();
  const buf = new Uint8Array(output.target.buffer);
  let bin = ''; for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return { nativeAac, ms: Math.round(performance.now() - t0), bytes: buf.length, b64: btoa(bin) };
};
