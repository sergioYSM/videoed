import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toSrt, fromSrt } from './srt.ts';

test('SRT round trip, with CRLF, BOM, tags and bad blocks', () => {
  let n = 0; const id = () => String(n++);
  const cues = [{ id: 'a', startMs: 1000, endMs: 2500, text: 'Hola' }, { id: 'b', startMs: 3723004, endMs: 3725000, text: 'dos\nlíneas' }];
  const srt = toSrt(cues);
  assert.match(srt, /1\n00:00:01,000 --> 00:00:02,500\nHola/);
  assert.match(srt, /01:02:03,004 --> 01:02:05,000/);
  assert.deepEqual(fromSrt(srt, id).map((c) => [c.startMs, c.endMs, c.text]), [[1000, 2500, 'Hola'], [3723004, 3725000, 'dos\nlíneas']]);
  const messy = '﻿1\r\n00:00:01.5 --> 00:00:02,000 X1:0\r\n<i>cursiva</i>\r\n\r\nbasura\r\n\r\n3\r\n00:00:05,000 --> 00:00:04,000\r\nal revés\r\n';
  assert.deepEqual(fromSrt(messy, id).map((c) => [c.startMs, c.text]), [[1500, 'cursiva']]);
});
