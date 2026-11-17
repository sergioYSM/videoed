import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { execFileSync, spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const media = (f: string) => path.join(__dirname, 'media', f);
async function setup(page: Page, files: string[]) {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' && !/huggingface|Failed to load resource|ERR_/.test(m.text())) errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/'); await page.getByRole('button', { name: /Vertical/ }).click();
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: /Importar vídeos/ }).click();
  await (await chooser).setFiles(files.map(media));
  await expect(page.getByRole('listbox', { name: 'Pista de vídeo' }).getByRole('option')).toHaveCount(files.length);
  return errors;
}
const tab = (page: Page, name: string) => page.getByRole('tab', { name }).click();
async function exportFile(page: Page, out: string) {
  await page.getByRole('button', { name: 'Exportar' }).click();
  const d = page.getByRole('dialog', { name: 'Exportar vídeo' });
  await d.getByRole('radio', { name: /720p/ }).click();
  await d.getByRole('button', { name: 'Exportar', exact: true }).click();
  await expect(d.getByText('Listo')).toBeVisible({ timeout: 60_000 });
  const dl = page.waitForEvent('download'); await d.getByRole('link', { name: 'Descargar' }).click(); await (await dl).saveAs(out);
  await d.getByRole('button', { name: 'Cerrar' }).click();
}
/** Average RGB of a region of the exported frame at t (fractions of the frame). */
function region(file: string, t: number, x: number, y: number, w: number, h: number) {
  const out = execFileSync('ffmpeg', ['-v', 'error', '-ss', String(t), '-i', file, '-frames:v', '1', '-vf', `crop=iw*${w}:ih*${h}:iw*${x}:ih*${y},scale=1:1:flags=area`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']);
  return [...out.subarray(0, 3)];
}
const meanVolume = (file: string, ss: number, t: number) => Number(spawnSync('ffmpeg', ['-v', 'info', '-ss', String(ss), '-t', String(t), '-i', file, '-af', 'volumedetect', '-f', 'null', '-']).stderr.toString().match(/mean_volume: (-?[\d.]+) dB/)?.[1] ?? -99);

test('text: add a label, edit it, move it on the canvas, and it is in the export', async ({ page }, info) => {
  const errors = await setup(page, ['red-5s.mp4']);
  await tab(page, 'Texto');
  await page.getByRole('button', { name: /Añadir etiqueta/ }).click();
  await expect(page.getByRole('listbox', { name: 'Pista de texto' }).getByRole('option')).toHaveCount(1);
  await page.getByRole('textbox', { name: 'Texto', exact: true }).fill('OFERTA');
  // move it to the vertical centre with the keyboard on the canvas
  const onCanvas = page.getByRole('button', { name: /Texto «OFERTA» en el vídeo/ });
  await expect(onCanvas).toBeVisible();
  await onCanvas.focus();
  for (let i = 0; i < 7; i++) await page.keyboard.press('Shift+ArrowDown');   // 0.15 -> 0.50
  await expect(page.getByRole('slider', { name: 'Vertical' })).toHaveAttribute('aria-valuenow', '50');
  // drag it a bit to the right with the mouse
  const box = (await onCanvas.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2, { steps: 5 }); await page.mouse.up();
  expect(Number(await page.getByRole('slider', { name: 'Horizontal' }).getAttribute('aria-valuenow'))).toBeGreaterThan(55);
  const a11y = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(a11y.violations.map((v) => `${v.id}: ${v.nodes[0].target} ${v.nodes[0].failureSummary}`)).toEqual([]);
  const file = info.outputPath('text.mp4'); await exportFile(page, file);
  // the label (yellow box) is near the centre at 1 s, gone at 4 s (it lasts 3 s)
  const at1 = region(file, 1, 0.5, 0.47, 0.2, 0.06), at4 = region(file, 4, 0.5, 0.47, 0.2, 0.06);
  // pure red has no green; the yellow label adds green where it is drawn, and only while it lasts
  expect(at4[1], `no label at 4 s ${at4}`).toBeLessThan(40);   // H.264 colour rounding: pure red reads G≈24
  expect(at1[1] - at4[1], `label adds green at 1 s: ${at1} vs ${at4}`).toBeGreaterThan(50);
  expect(errors).toEqual([]);
});

test('captions: import .srt, style, download .srt, captions burned into the export', async ({ page }, info) => {
  const errors = await setup(page, ['red-5s.mp4']);
  await tab(page, 'Subtítulos');
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Importar .srt' }).click();
  await (await chooser).setFiles(media('demo.srt'));
  await expect(page.getByRole('list', { name: 'Líneas de subtítulos' }).getByRole('listitem')).toHaveCount(2);
  await expect(page.getByRole('listbox', { name: 'Pista de subtítulos' }).getByRole('option')).toHaveCount(2);
  await page.getByRole('radio', { name: 'Con caja' }).click();
  await page.getByRole('textbox', { name: /Subtítulo de 0:00.15/ }).fill('Hola, gente');
  await page.getByRole('textbox', { name: /Subtítulo de 0:00.15/ }).blur();
  const dl = page.waitForEvent('download'); await page.getByRole('button', { name: 'Descargar .srt' }).click();
  const srt = info.outputPath('out.srt'); await (await dl).saveAs(srt);
  expect(fs.readFileSync(srt, 'utf8')).toBe('1\n00:00:00,500 --> 00:00:02,000\nHola, gente\n\n2\n00:00:02,000 --> 00:00:04,500\nHoy os enseño a editar\n');
  const a11y = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(a11y.violations.map((v) => `${v.id}: ${v.nodes[0].target}`)).toEqual([]);
  const file = info.outputPath('cap.mp4'); await exportFile(page, file);
  // caption box (dark) at 80% height while a cue is on; plain red after 4.5 s
  const on = region(file, 1, 0.3, 0.78, 0.4, 0.04), off = region(file, 4.8, 0.3, 0.78, 0.4, 0.04);
  expect(on[0], `caption box darkens the red ${on}`).toBeLessThan(200);
  expect(off[0], `no caption at 4.8 s ${off}`).toBeGreaterThan(220);
  expect(errors).toEqual([]);
});

test('music: added on a silent clip, faded in, mixed into the export', async ({ page }, info) => {
  const errors = await setup(page, ['mute-6s.mp4']);
  await tab(page, 'Audio');
  await page.getByRole('button', { name: 'Añadir Valle abierto en el cabezal' }).click();
  await expect(page.getByRole('listbox', { name: 'Pista de audio' }).getByRole('option')).toHaveCount(1);
  await expect(page.getByText(/Crédito \(ponlo en la descripción\)/)).toBeVisible();
  const fadeIn = page.getByRole('textbox', { name: 'Entrada' });
  await fadeIn.fill('2'); await fadeIn.press('Enter');
  await expect(page.getByRole('slider', { name: 'Entrada' })).toHaveAttribute('aria-valuenow', '2');
  const file = info.outputPath('music.mp4'); await exportFile(page, file);
  const pj = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'json', file]).toString());
  expect(Math.abs(Number(pj.format.duration) - 6)).toBeLessThan(0.1);   // music is longer, cut at the video's end
  const start = meanVolume(file, 0, 0.4), middle = meanVolume(file, 3, 1);
  expect(middle, `music audible ${middle} dB`).toBeGreaterThan(-35);
  expect(start, `fade-in: start ${start} dB quieter than middle ${middle} dB`).toBeLessThan(middle - 6);
  expect(errors).toEqual([]);
});

test('trim with [ and ] at the playhead', async ({ page }) => {
  await setup(page, ['red-5s.mp4', 'blue-3s.mp4']);
  const tl = page.getByRole('region', { name: 'Línea de tiempo' });
  await page.locator('body').click({ position: { x: 700, y: 300 } });
  for (let i = 0; i < 2; i++) await page.keyboard.press('Shift+ArrowRight');     // 2 s into the red clip
  await page.keyboard.press(']');
  await expect(tl.getByText('2 clips · 0:05')).toBeVisible();                  // red now 2 s + blue 3 s
  await page.keyboard.press('Shift+ArrowRight');                                 // 3 s: 1 s into blue
  await page.keyboard.press('[');
  await expect(tl.getByText('2 clips · 0:04')).toBeVisible();                  // blue now 2 s
  await page.keyboard.press('Control+z');
  await expect(tl.getByText('2 clips · 0:05')).toBeVisible();
});

test('auto captions: a failed model download is explained (model host blocked here)', async ({ page }) => {
  await setup(page, ['red-5s.mp4']);
  await tab(page, 'Subtítulos');
  page.on('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Generar desde la voz' }).click();
  await expect(page.getByRole('tabpanel').getByRole('alert')).toContainText(/No se ha podido (descargar el modelo|generar)/, { timeout: 60_000 });
});
