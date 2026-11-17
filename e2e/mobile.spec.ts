import { test, expect, devices } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import path from 'node:path';

test.use({ ...devices['Pixel 7'] });

test('phone: import from the Medios sheet, add text, cut, export, no sideways scroll', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/app');
  await page.getByRole('button', { name: /Vertical/ }).click();
  await expect(page.getByRole('navigation', { name: 'Paneles' })).toBeVisible();
  await page.getByRole('button', { name: 'Medios' }).click();
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('dialog', { name: 'Medios' }).getByRole('button', { name: /Importar vídeos/ }).click();
  await (await chooser).setFiles([path.join(__dirname, 'media', 'red-5s.mp4')]);
  await expect(page.getByRole('listbox', { name: 'Pista de vídeo' }).getByRole('option')).toHaveCount(1);
  await page.getByRole('button', { name: 'Texto' }).click();
  await page.getByRole('dialog', { name: 'Texto' }).getByRole('button', { name: /Añadir título/ }).click();
  await page.getByRole('button', { name: 'Ajustes' }).click();
  await expect(page.getByRole('dialog', { name: 'Ajustes' }).getByRole('textbox', { name: 'Texto', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar panel' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
  await page.getByRole('button', { name: 'Cortar en el cabezal (S)' }).isVisible();
  const a11y = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(a11y.violations.map((v) => `${v.id}: ${v.nodes[0].target}`)).toEqual([]);
  await page.getByRole('button', { name: 'Exportar' }).click();
  const d = page.getByRole('dialog', { name: 'Exportar vídeo' });
  await d.getByRole('radio', { name: /720p/ }).click();
  await d.getByRole('button', { name: 'Exportar', exact: true }).click();
  await expect(d.getByText('Listo')).toBeVisible({ timeout: 60_000 });
  await page.screenshot({ path: path.join(__dirname, '..', 'replica', 'clone-screens', 'S03-editor-mobile.png') });
  expect(errors).toEqual([]);
});
