import { test, expect, devices, type Page } from '@playwright/test';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const media = (f: string) => path.join(__dirname, 'media', f);
async function importOn(page: Page, files: string[], sheet = false) {
  if (sheet) await page.getByRole('button', { name: 'Medios' }).click();
  const scope = sheet ? page.getByRole('dialog', { name: 'Medios' }) : page;
  const ch = page.waitForEvent('filechooser');
  await scope.getByRole('button', { name: /Importar vídeos/ }).click();
  await (await ch).setFiles(files.map(media));
}
/** Real touch drag through the DevTools protocol (not mouse events). */
async function touchDrag(page: Page, x0: number, y0: number, dx: number, dy: number) {
  const cdp = await page.context().newCDPSession(page);
  const pt = (x: number, y: number) => [{ x, y, id: 1 }];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(x0, y0) });
  for (let i = 1; i <= 8; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(x0 + (dx * i) / 8, y0 + (dy * i) / 8) });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

test('browser without OPFS file writing (some Safari, private windows): import, reload and export still work', async ({ page }, info) => {
  await page.addInitScript(() => { try { delete (FileSystemFileHandle.prototype as unknown as Record<string, unknown>).createWritable; } catch { /* */ } });
  await page.goto('/app'); await page.getByRole('button', { name: /Vertical/ }).click();
  await importOn(page, ['red-5s.mp4']);
  await expect(page.getByRole('listbox', { name: 'Pista de vídeo' }).getByRole('option')).toHaveCount(1);
  await page.waitForTimeout(700); await page.reload();
  await expect(page.getByRole('listbox', { name: 'Pista de vídeo' }).getByRole('option')).toHaveCount(1);
  await page.getByRole('button', { name: 'Exportar' }).click();
  const d = page.getByRole('dialog', { name: 'Exportar vídeo' });
  await d.getByRole('radio', { name: /720p/ }).click(); await d.getByRole('button', { name: 'Exportar', exact: true }).click();
  await expect(d.getByText(/Listo/)).toBeVisible({ timeout: 60_000 });
  const dl = page.waitForEvent('download'); await d.getByRole('link', { name: 'Descargar' }).click();
  const f = info.outputPath('fallback.mp4'); await (await dl).saveAs(f);
  expect(Number(JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'json', f]).toString()).format.duration)).toBeGreaterThan(4.9);
});
