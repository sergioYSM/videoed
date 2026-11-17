import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { execFileSync, spawnSync } from 'node:child_process';
import path from 'node:path';

const media = (f: string) => path.join(__dirname, 'media', f);
const errors: string[] = [];

async function newVertical(page: Page) {
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/app');
  await page.getByRole('button', { name: /Vertical/ }).click();
  await expect(page).toHaveURL(/\/edit\?id=/);
  await expect(page.getByRole('region', { name: 'Vista previa' })).toBeVisible();
}
async function importFiles(page: Page, files: string[]) {
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: /Importar vídeos/ }).click();
  await (await chooser).setFiles(files.map(media));
}
const clips = (page: Page) => page.getByRole('listbox', { name: 'Pista de vídeo' }).getByRole('option');
const timeline = (page: Page) => page.getByRole('region', { name: 'Línea de tiempo' });
/** RGB of the exported video at second t, sampled at the centre. */
function colourAt(file: string, t: number) {
  const out = execFileSync('ffmpeg', ['-v', 'error', '-ss', String(t), '-i', file, '-frames:v', '1', '-vf', 'crop=8:8:iw/2:ih/2,scale=1:1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']);
  return [...out.subarray(0, 3)];
}
const near = (rgb: number[], target: number[]) => rgb.every((v, i) => Math.abs(v - target[i]) < 60);
const probeJson = (file: string) => JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_name,profile,width,height:format=duration', '-of', 'json', file]).toString());

test('slice: import, split, delete, undo, reorder, export a real MP4', async ({ page }, info) => {
  errors.length = 0;
  await newVertical(page);
  const a11y = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(a11y.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`), 'axe on the empty editor').toEqual([]);

  await importFiles(page, ['red-5s.mp4', 'green2-yellow2.mp4']);
  await expect(clips(page)).toHaveCount(2);
  await expect(timeline(page).getByText('2 clips · 0:09')).toBeVisible();

  // put the playhead at 7.0 s (inside the green/yellow clip, on its colour change) and split there
  await page.locator('body').click({ position: { x: 700, y: 300 } });
  for (let i = 0; i < 7; i++) await page.keyboard.press('Shift+ArrowRight');
  await expect(page.getByText('0:07.00')).toBeVisible();
  await page.keyboard.press('s');
  await expect(clips(page)).toHaveCount(3);
  await expect(page.getByRole('status').filter({ hasText: 'Clip cortado' })).toBeVisible();

  // delete the yellow half, then undo and redo
  await clips(page).nth(2).focus();
  await page.keyboard.press('Delete');
  await expect(clips(page)).toHaveCount(2);
  await expect(timeline(page).getByText('2 clips · 0:07')).toBeVisible();
  await page.keyboard.press('Control+z');
  await expect(clips(page)).toHaveCount(3);
  await page.keyboard.press('Control+Shift+z');
  await expect(clips(page)).toHaveCount(2);

  // move the green clip before the red one with the keyboard
  await clips(page).nth(1).focus();
  await page.keyboard.press('Alt+ArrowLeft');
  await expect(clips(page).nth(0)).toHaveAccessibleName(/green2-yellow2/);

  // the project is saved: reload keeps it
  await page.waitForTimeout(700);
  await page.reload();
  await expect(clips(page)).toHaveCount(2);
  await expect(clips(page).nth(0)).toHaveAccessibleName(/green2-yellow2/);

  // export 720p
  await page.getByRole('button', { name: 'Exportar' }).click();
  const dialog = page.getByRole('dialog', { name: 'Exportar vídeo' });
  await dialog.getByRole('radio', { name: /720p/ }).click();
  await dialog.getByRole('button', { name: 'Exportar', exact: true }).click();
  await expect(dialog.getByText('Listo')).toBeVisible({ timeout: 60_000 });
  const dl = page.waitForEvent('download');
  await dialog.getByRole('link', { name: 'Descargar' }).click();
  const file = info.outputPath('export.mp4');
  await (await dl).saveAs(file);

  const pj = probeJson(file);
  const v = pj.streams.find((s: { codec_name: string }) => s.codec_name === 'h264');
  expect(v).toMatchObject({ profile: 'High', width: 720, height: 1280 });
  expect(pj.streams.some((s: { codec_name: string }) => s.codec_name === 'aac')).toBe(true);
  expect(Math.abs(Number(pj.format.duration) - 7)).toBeLessThan(0.1);
  // order and cut points: 0-2 s green, 2-7 s red (yellow half was deleted)
  expect(near(colourAt(file, 1.0), [0, 128, 0]), 'green at 1 s').toBe(true);
  expect(near(colourAt(file, 1.9), [0, 128, 0]), 'still green at 1.9 s').toBe(true);
  expect(near(colourAt(file, 2.1), [255, 0, 0]), 'red at 2.1 s').toBe(true);
  expect(near(colourAt(file, 6.8), [255, 0, 0]), 'red at 6.8 s').toBe(true);
  // audio is there and not silent
  const vd = spawnSync('ffmpeg', ['-v', 'info', '-i', file, '-af', 'volumedetect', '-f', 'null', '-']).stderr.toString();
  const mean = Number(vd.match(/mean_volume: (-?[\d.]+) dB/)?.[1]);
  expect(mean, `mean volume ${mean} dB`).toBeGreaterThan(-35);
  expect(errors, errors.join('\n')).toEqual([]);
});

test('import errors are explained and do not break the project', async ({ page }) => {
  errors.length = 0;
  await newVertical(page);
  await importFiles(page, ['broken.mp4', 'blue-3s.mp4']);
  await expect(page.getByText(/No reconocemos este archivo|dañado/)).toBeVisible();
  await expect(clips(page)).toHaveCount(1);
});

test('projects list: the new project shows, opens, and can be deleted', async ({ page }) => {
  await newVertical(page);
  await importFiles(page, ['blue-3s.mp4']);
  await expect(clips(page)).toHaveCount(1);
  await page.getByLabel('Nombre del proyecto').fill('Mi primer vídeo');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(600);
  await page.getByRole('link', { name: 'Volver a tus proyectos' }).click();
  await expect(page.getByRole('link', { name: /Mi primer vídeo/ })).toBeVisible();
  const a11y = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(a11y.violations.map((v) => v.id), 'axe on projects').toEqual([]);
  page.once('dialog', (d) => d.accept());
  await page.getByRole('listitem').filter({ hasText: 'Mi primer vídeo' }).hover();
  await page.getByRole('button', { name: 'Borrar Mi primer vídeo' }).click();
  await expect(page.getByRole('link', { name: /Mi primer vídeo/ })).toHaveCount(0);
});

test('preview shows the right frame when paused and advances when playing', async ({ page }) => {
  await newVertical(page);
  await importFiles(page, ['red-5s.mp4', 'blue-3s.mp4']);
  await expect(clips(page)).toHaveCount(2);
  const px = () => page.locator('canvas').evaluate((c: HTMLCanvasElement) => [...c.getContext('2d')!.getImageData(c.width / 2, c.height / 2, 1, 1).data].slice(0, 3));
  await expect.poll(px).toEqual(expect.arrayContaining([expect.any(Number)]));
  await expect.poll(async () => near(await px(), [255, 0, 0]), { message: 'red at 0 s' }).toBe(true);
  // jump to 6 s with the keyboard: blue clip
  await page.locator('body').click({ position: { x: 700, y: 300 } });
  for (let i = 0; i < 6; i++) await page.keyboard.press('Shift+ArrowRight');
  await expect.poll(async () => near(await px(), [0, 0, 255]), { message: 'blue at 6 s' }).toBe(true);
  // play from 1 s: time advances, then pause stops it
  for (let i = 0; i < 5; i++) await page.keyboard.press('Shift+ArrowLeft');
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'Pausar' })).toBeVisible();
  await page.waitForTimeout(1500);
  await page.keyboard.press('Space');
  const t = await page.locator('section[aria-label="Vista previa"] .mono').first().innerText();
  const secs = Number(t.split(':')[1]);
  expect(secs, `playhead ${t}`).toBeGreaterThan(1.8);
  expect(secs).toBeLessThan(3.5);
  await page.screenshot({ path: path.join(__dirname, '..', 'replica', 'clone-screens', 'S03-editor.png') });
});
