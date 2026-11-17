import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { execFileSync, spawnSync } from 'node:child_process';
import path from 'node:path';

const media = (f: string) => path.join(__dirname, 'media', f);
async function setup(page: Page, files: string[]) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/app'); await page.getByRole('button', { name: /Vertical/ }).click();
  await expect(page).toHaveURL(/\/edit\?id=/);
  const ch = page.waitForEvent('filechooser'); await page.getByRole('button', { name: /Importar vídeos/ }).click(); await (await ch).setFiles(files.map(media));
  await expect(page.getByRole('listbox', { name: 'Pista de vídeo' }).getByRole('option')).toHaveCount(files.length);
  return errors;
}
const clips = (page: Page) => page.getByRole('listbox', { name: 'Pista de vídeo' }).getByRole('option');
async function exportFile(page: Page, out: string, h: '720p' | '1080p' = '720p') {
  await page.getByRole('button', { name: 'Exportar' }).click();
  const d = page.getByRole('dialog', { name: 'Exportar vídeo' });
  await d.getByRole('radio', { name: new RegExp(h) }).click(); await d.getByRole('button', { name: 'Exportar', exact: true }).click();
  await expect(d.getByText(/Listo/)).toBeVisible({ timeout: 90_000 });
  const dl = page.waitForEvent('download'); await d.getByRole('link', { name: 'Descargar' }).click(); await (await dl).saveAs(out);
  await d.getByRole('button', { name: 'Cerrar' }).click();
}
const region = (file: string, t: number, x = 0.4, y = 0.4, w = 0.2, h = 0.2) => [...execFileSync('ffmpeg', ['-v', 'error', '-ss', String(t), '-i', file, '-frames:v', '1', '-vf', `crop=iw*${w}:ih*${h}:iw*${x}:ih*${y},scale=1:1:flags=area`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']).subarray(0, 3)];
const dur = (file: string) => Number(JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'json', file]).toString()).format.duration);

test('speed 2x halves the clip; fade-in starts from black; B&W look removes colour', async ({ page }, info) => {
  const errors = await setup(page, ['red-5s.mp4']);
  await clips(page).first().click();
  await page.getByRole('radio', { name: '2×' }).click();
  await expect(page.getByText(/1 clip · 0:03/)).toBeVisible();          // 5 s at 2x = 2.5 s (rounded display)
  const fi = page.getByRole('textbox', { name: 'Fundido entrada' }); await fi.fill('1'); await fi.press('Enter');
  await page.getByRole('button', { name: 'Blanco y negro' }).click();
  const a11y = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(a11y.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target + ' ' + n.failureSummary).join(' | ')}`)).toEqual([]);
  const f = info.outputPath('fx.mp4'); await exportFile(page, f);
  expect(Math.abs(dur(f) - 2.5)).toBeLessThan(0.1);
  const start = region(f, 0.05), later = region(f, 2.0);
  expect(Math.max(...start), `near black at 0.05 s: ${start}`).toBeLessThan(40);
  expect(Math.max(...later) - Math.min(...later), `grey (no colour) at 2 s: ${later}`).toBeLessThan(20);
  expect(later[0], 'not black at 2 s').toBeGreaterThan(40);
  expect(errors).toEqual([]);
});

test('blurred background when a horizontal clip is fitted in a vertical frame', async ({ page }, info) => {
  await setup(page, ['red-5s.mp4']);                                     // 1280x720 into 9:16
  await clips(page).first().click();
  await page.getByRole('radio', { name: 'Encajar' }).click();
  await page.getByRole('radio', { name: 'Desenfocado' }).click();
  const f = info.outputPath('blur.mp4'); await exportFile(page, f);
  const top = region(f, 1, 0.3, 0.05, 0.4, 0.1);                        // above the fitted image
  expect(top[0], `top band is a dark red blur, not black: ${top}`).toBeGreaterThan(60);
});

test('text animations and karaoke captions render (and differ over time)', async ({ page }, info) => {
  await setup(page, ['mute-6s.mp4']);
  await page.getByRole('tab', { name: 'Texto' }).click();
  await page.getByRole('button', { name: /Añadir etiqueta/ }).click();
  await page.getByRole('radio', { name: 'Máquina de escribir' }).click();
  await page.getByRole('tab', { name: 'Subtítulos' }).click();
  const ch = page.waitForEvent('filechooser'); await page.getByRole('button', { name: 'Importar .srt' }).click(); await (await ch).setFiles(media('demo.srt'));
  await page.getByRole('radio', { name: 'Karaoke' }).click();
  const f = info.outputPath('anim.mp4'); await exportFile(page, f);
  // typewriter: the label box grows between 0.1 s and 1.5 s
  const early = region(f, 0.1, 0.35, 0.12, 0.3, 0.06), late = region(f, 1.5, 0.35, 0.12, 0.3, 0.06);
  expect(late[1] - early[1], `label grows: ${early} -> ${late}`).toBeGreaterThan(20);
  // karaoke: yellow appears in the caption band while a cue is on, none after the last cue
  const on = region(f, 3.0, 0.1, 0.76, 0.8, 0.08), off = region(f, 5.5, 0.1, 0.76, 0.8, 0.08);
  expect(on[0] + on[1] - off[0] - off[1], `caption band ${on} vs ${off}`).toBeGreaterThan(15);
});

test('duplicate with Ctrl+D, detach audio, magnet toggle', async ({ page }) => {
  await setup(page, ['blue-3s.mp4']);
  await clips(page).first().click();
  await page.keyboard.press('Control+d');
  await expect(clips(page)).toHaveCount(2);
  await page.getByRole('button', { name: 'Separar audio' }).click();
  await expect(page.getByRole('listbox', { name: 'Pista de audio' }).getByRole('option')).toHaveCount(1);
  await expect(page.getByRole('slider', { name: 'Volumen' }).first()).toHaveAttribute('aria-valuenow', '0');
  const magnet = page.getByRole('button', { name: /Imán activado/ });
  await magnet.click();
  await expect(page.getByRole('button', { name: 'Imán desactivado' })).toHaveAttribute('aria-pressed', 'false');
});

test('save the project as a file and open it again (new copy, same edit, media included)', async ({ page }, info) => {
  await setup(page, ['red-5s.mp4', 'blue-3s.mp4']);
  await page.getByLabel('Nombre del proyecto').fill('Viaje'); await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  const dl = page.waitForEvent('download');
  await page.getByRole('button', { name: /Guardar el proyecto como archivo/ }).click();
  const file = info.outputPath('viaje.ownframe'); await (await dl).saveAs(file);
  const list = spawnSync('unzip', ['-l', file]).stdout.toString();
  expect(list).toContain('project.json'); expect((list.match(/media\//g) ?? []).length).toBe(2);
  await page.getByRole('link', { name: 'Volver a tus proyectos' }).click();
  const ch = page.waitForEvent('filechooser'); await page.getByRole('button', { name: /Abrir archivo de proyecto/ }).click(); await (await ch).setFiles(file);
  await expect(page).toHaveURL(/\/edit\?id=/);
  await expect(clips(page)).toHaveCount(2);
  await expect(page.getByLabel('Nombre del proyecto')).toHaveValue('Viaje');
  await page.getByRole('link', { name: 'Volver a tus proyectos' }).click();
  await expect(page.getByRole('link', { name: /Viaje/ })).toHaveCount(2);   // original + imported copy
});

test('works offline after the first visit: open, edit and export without a connection', async ({ page, context }, info) => {
  await setup(page, ['red-5s.mp4']);
  const url = page.url();
  await page.waitForTimeout(2500);  // autosave + export pieces warmed
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();                                                   // now controlled by the worker
  await expect(clips(page)).toHaveCount(1);
  await page.waitForTimeout(800);
  await context.setOffline(true);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await expect(clips(page)).toHaveCount(1);
  await page.keyboard.press('Shift+ArrowRight'); await page.locator('body').click({ position: { x: 700, y: 300 } });
  await page.keyboard.press('Shift+ArrowRight'); await page.keyboard.press('s');
  await expect(clips(page)).toHaveCount(2);
  const f = info.outputPath('offline.mp4'); await exportFile(page, f);
  expect(dur(f)).toBeGreaterThan(4.9);
  await context.setOffline(false);
});
