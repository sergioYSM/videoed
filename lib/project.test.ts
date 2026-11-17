import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as P from './project.ts';

const asset = (id: string, durationMs: number, kind: P.AssetRef['kind'] = 'video'): P.AssetRef => ({ id, name: id, kind, mime: 'video/mp4', size: 1, durationMs, hasAudio: true });
function base() {
  let p = P.createProject('9:16');
  p = P.addAsset(p, asset('a', 5000)); p = P.addAsset(p, asset('b', 3000));
  p = P.addClip(p, 'a'); p = P.addClip(p, 'b');
  return p;
}

test('new 9:16 project is 1080x1920 at 30 fps and empty', () => {
  const p = P.createProject('9:16');
  assert.deepEqual([p.width, p.height, p.fps, p.clips.length], [1080, 1920, 30, 0]);
});

test('clips play back to back; duration and locate', () => {
  const p = base();
  assert.equal(P.duration(p), 8000);
  assert.deepEqual(P.starts(p), [0, 5000]);
  assert.equal(P.locate(p, 6000)!.clip.assetId, 'b');
  assert.equal(P.locate(p, 6000)!.sourceMs, 1000);
  assert.equal(P.locate(p, 8000)!.index, 1, 'the very end belongs to the last clip');
  assert.equal(P.locate(p, 9000), null);
});

test('audio assets are not placed on the video track; images get 3 s', () => {
  let p = P.addAsset(P.createProject('1:1'), asset('m', 9000, 'audio'));
  p = P.addAsset(p, asset('i', 0, 'image'));
  p = P.addClip(P.addClip(p, 'm'), 'i');
  assert.equal(p.clips.length, 1); assert.equal(P.duration(p), 3000);
});

test('trim snaps to frames and stays inside the source with a minimum length', () => {
  let p = base(); const id = p.clips[0].id;
  p = P.trim(p, id, 'start', 1010);
  assert.equal(p.clips[0].inMs, 1000);          // 1010 ms -> frame 30 -> 1000 ms
  p = P.trim(p, id, 'end', 99999);
  assert.equal(p.clips[0].outMs, 5000);         // never beyond the source
  p = P.trim(p, id, 'start', 4990);
  assert.equal(p.clips[0].inMs, 4900);          // keeps MIN_CLIP_MS
  assert.equal(P.duration(p), 100 + 3000);
});

test('split at the playhead makes two clips that cover the same source', () => {
  let p = base();
  p = P.split(p, 2000);
  assert.equal(p.clips.length, 3);
  assert.deepEqual(p.clips.slice(0, 2).map((c) => [c.inMs, c.outMs]), [[0, 2000], [2000, 5000]]);
  assert.notEqual(p.clips[0].id, p.clips[1].id);
  assert.equal(P.duration(p), 8000, 'splitting never changes the length');
});

test('split at an edge or too close to one does nothing', () => {
  const p = base();
  assert.equal(P.split(p, 5000).clips.length, 2);
  assert.equal(P.split(p, 30).clips.length, 2);
  assert.equal(P.split(p, 20000).clips.length, 2);
});

test('remove and move clips; removing an asset removes its clips', () => {
  let p = base();
  p = P.moveClip(p, 1, 0);
  assert.deepEqual(p.clips.map((c) => c.assetId), ['b', 'a']);
  p = P.removeClip(p, p.clips[0].id);
  assert.deepEqual(p.clips.map((c) => c.assetId), ['a']);
  p = P.removeAsset(P.addClip(p, 'a'), 'a');
  assert.equal(p.clips.length, 0);
});

test('edits never mutate the previous document (undo relies on it)', () => {
  const p = base(); const frozen = JSON.stringify(p);
  P.split(p, 1000); P.trim(p, p.clips[0].id, 'end', 2000); P.moveClip(p, 0, 1); P.removeClip(p, p.clips[0].id); P.rename(p, 'x');
  assert.equal(JSON.stringify(p), frozen);
});

test('rename trims, caps at 120 and ignores empty names', () => {
  const p = base();
  assert.equal(P.rename(p, '  Vlog  ').name, 'Vlog');
  assert.equal(P.rename(p, 'x'.repeat(200)).name.length, 120);
  assert.equal(P.rename(p, '   ').name, p.name);
});

test('text overlays: add at the playhead, clamp position/size, move in time', () => {
  let p = base();
  p = P.addText(p, 'titulo', 1010);
  const t = p.texts[0];
  assert.deepEqual([t.startMs, t.endMs], [1000, 4000]);
  p = P.updateText(p, t.id, { x: 2, y: -1, scale: 99, style: { size: 9999 } });
  assert.deepEqual([p.texts[0].x, p.texts[0].y, p.texts[0].scale, p.texts[0].style.size], [1, 0, 8, 400]);
  assert.equal(p.texts[0].style.font, 'Anton', 'style patch merges');
  assert.equal(P.textsAt(p, 3999).length, 1); assert.equal(P.textsAt(p, 4000).length, 0);
  assert.deepEqual(P.moveSpan(30, p.texts[0], 'move', 2000), { startMs: 2000, endMs: 5000 });
  assert.deepEqual(P.moveSpan(30, p.texts[0], 'end', 500), { startMs: 1000, endMs: 1100 });
});

test('audio items: fades never exceed the length, trim start moves the in-point', () => {
  let p = P.addAsset(base(), { id: 'm', name: 'm', kind: 'audio', mime: 'audio/mpeg', size: 1, durationMs: 10000, hasAudio: true });
  p = P.addAudio(p, 'm', 0);
  const id = p.audio[0].id;
  p = P.updateAudio(p, id, { fadeInMs: 8000, fadeOutMs: 8000, volume: 5 });
  assert.deepEqual([p.audio[0].fadeInMs, p.audio[0].fadeOutMs, p.audio[0].volume], [8000, 2000, 2]);
  p = P.trimAudioStart(p, id, 1500);
  assert.deepEqual([p.audio[0].startMs, p.audio[0].inMs, P.audioEnd(p.audio[0])], [1500, 1500, 10000]);
  p = P.removeAsset(p, 'm');
  assert.equal(p.audio.length, 0);
});

test('captions: sorted, empty lines dropped, style y clamped', () => {
  let p = P.addCue(P.addCue(base(), 3000, 'dos'), 1000, 'uno');
  assert.deepEqual(p.captions.cues.map((c) => c.text), ['uno', 'dos']);
  p = P.updateCue(p, p.captions.cues[0].id, { text: '   ' });
  assert.deepEqual(p.captions.cues.map((c) => c.text), ['dos']);
  assert.equal(P.cueAt(p, 3500)?.text, 'dos');
  assert.equal(P.setCaptionStyle(p, { y: 2 }).captions.y, 0.95);
});

test('old projects are migrated', () => {
  const old = { ...P.createProject('9:16') } as Partial<P.Project>;
  delete old.texts; delete old.audio; delete old.captions;
  const m = P.migrate(old as P.Project);
  assert.deepEqual([m.texts, m.audio, m.captions.cues], [[], [], []]);
});

test('fade gain curve', async () => {
  const { gainAt } = await import('./fades.ts');
  const a = { id: 'x', assetId: 'm', startMs: 1000, inMs: 0, outMs: 5000, volume: 0.8, fadeInMs: 1000, fadeOutMs: 2000 };
  assert.equal(gainAt(a, 500), 0);
  assert.ok(Math.abs(gainAt(a, 1500) - 0.4) < 1e-9);
  assert.equal(gainAt(a, 3000), 0.8);
  assert.ok(Math.abs(gainAt(a, 5000) - 0.4) < 1e-9);
  assert.equal(gainAt(a, 6000), 0);
});
