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

test.use({ ...devices['Pixel 7'] });

test.describe('on a touch phone (no hover)', () => {

  test('add a clip again, remove a file, delete a project: buttons are visible without hover', async ({ page }) => {
    await page.goto('/app'); await page.getByRole('button', { name: /Vertical/ }).click();
    await importOn(page, ['red-5s.mp4', 'blue-3s.mp4'], true);
    const sheet = page.getByRole('dialog', { name: 'Medios' });
    const tl = page.getByRole('listbox', { name: 'Pista de vídeo' }).getByRole('option');
    await expect(tl).toHaveCount(2);
    await expect(sheet.getByRole('button', { name: 'Añadir red-5s.mp4 al final' })).toBeVisible();
    await sheet.getByRole('button', { name: 'Añadir red-5s.mp4 al final' }).tap();
    await expect(tl).toHaveCount(3);
    page.once('dialog', (d) => d.accept());
    await sheet.getByRole('button', { name: 'Quitar red-5s.mp4 del proyecto' }).tap();
    await expect(tl).toHaveCount(1);                                      // both red clips gone with the file
    await page.getByRole('link', { name: 'Volver a tus proyectos' }).tap();
    await expect(page.getByRole('button', { name: /Borrar Proyecto sin título/ }).first()).toBeVisible();
  });

  test('drag a text with a finger on the video, and a clip on the timeline', async ({ page }) => {
    await page.goto('/app'); await page.getByRole('button', { name: /Vertical/ }).click();
    await importOn(page, ['red-5s.mp4', 'blue-3s.mp4'], true);
    await page.getByRole('button', { name: 'Texto' }).click();
    await page.getByRole('dialog', { name: 'Texto' }).getByRole('button', { name: /Añadir título/ }).tap();
    await page.getByRole('button', { name: 'Cerrar panel' }).tap();
    const box = (await page.getByRole('button', { name: /en el vídeo/ }).boundingBox())!;
    await touchDrag(page, box.x + box.width / 2, box.y + box.height / 2, 0, 120);
    // In Chrome's emulator, a simulated touch on a touch-action:none element swallows the click of the
    // next tap (reproduced on a plain span, without any app code). Use a click here; check on a real phone.
    await page.getByRole('button', { name: 'Ajustes' }).click();
    expect(Number(await page.getByRole('dialog', { name: 'Ajustes' }).getByRole('slider', { name: 'Vertical' }).getAttribute('aria-valuenow'))).toBeGreaterThan(40);   // was 30
    await page.getByRole('button', { name: 'Cerrar panel' }).click();
    // drag the blue clip before the red one
    await page.getByRole('button', { name: 'Ajustar a la ventana' }).click();   // both clips on screen
    const clips = page.getByRole('listbox', { name: 'Pista de vídeo' }).getByRole('option');
    const b = (await clips.nth(1).boundingBox())!, a = (await clips.nth(0).boundingBox())!;
    await touchDrag(page, b.x + b.width / 2, b.y + b.height / 2, a.x - b.x - 10, 0);
    await expect(clips.nth(0)).toHaveAccessibleName(/blue-3s/);
  });
});

