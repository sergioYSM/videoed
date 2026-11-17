import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import path from 'node:path';
const media = (f: string) => path.join(__dirname, 'media', f);
test('landing screenshot from the real editor + landing checks', async ({ page }) => {
  await page.goto('/app'); await page.getByRole('button', { name: /Vertical/ }).click();
  await page.getByLabel('Nombre del proyecto').fill('Mañana de rodaje'); await page.keyboard.press('Enter');
  let ch = page.waitForEvent('filechooser'); await page.getByRole('button', { name: /Importar vídeos/ }).click(); await (await ch).setFiles(media('demo-gradient.mp4'));
  await expect(page.getByRole('listbox', { name: 'Pista de vídeo' }).getByRole('option')).toHaveCount(1);
  await page.getByRole('tab', { name: 'Texto' }).click(); await page.getByRole('button', { name: /Añadir título/ }).click();
  await page.getByRole('textbox', { name: 'Texto', exact: true }).fill('Mañana de rodaje');
  await page.getByRole('tab', { name: 'Audio' }).click(); await page.getByRole('button', { name: 'Añadir Easy Lemon en el cabezal' }).click();
  await page.getByRole('tab', { name: 'Subtítulos' }).click();
  ch = page.waitForEvent('filechooser'); await page.getByRole('button', { name: 'Importar .srt' }).click(); await (await ch).setFiles(media('demo.srt'));
  await page.getByRole('radio', { name: 'Con caja' }).click();
  await page.locator('body').click({ position: { x: 700, y: 300 } });
  await page.keyboard.press('Escape');
  for (let i = 0; i < 2; i++) await page.keyboard.press('Shift+ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.getByRole('tab', { name: 'Medios' }).click();
  await page.locator('body').click({ position: { x: 700, y: 300 } });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('status').filter({ hasText: 'importados' })).toHaveCount(0, { timeout: 8000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(__dirname, '..', 'public', 'landing', 'editor.png') });
  // landing page checks
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('sin entregarlos');
  await expect(page.getByRole('img', { name: /El editor de Ownframe/ })).toBeVisible();
  const a11y = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(a11y.violations.map((v) => `${v.id}: ${v.nodes[0].target} ${v.nodes[0].failureSummary}`)).toEqual([]);
  for (const w of [390, 1280]) { await page.setViewportSize({ width: w, height: 900 }); expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(w); }
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({ path: path.join(__dirname, '..', 'replica', 'clone-screens', 'landing.png'), fullPage: true });
  await page.getByRole('link', { name: 'Abrir el editor' }).first().click();
  await expect(page).toHaveURL(/\/app$/);
});
