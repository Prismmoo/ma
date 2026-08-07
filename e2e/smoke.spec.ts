import { test, expect } from '@playwright/test';

test.describe('PRISM smoke', () => {
  test('الصفحة تُقلع وجذر React يمتلئ', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('./');
    await expect(page).toHaveTitle(/NN Cyberspace/i);

    const root = page.locator('#root');
    await expect(root).not.toBeEmpty({ timeout: 30000 });

    expect(errors, 'أخطاء JS وقت التشغيل').toEqual([]);
  });

  test('لا أصل مكسور 404 عند الإقلاع', async ({ page }) => {
    const dead: string[] = [];
    page.on('response', (r) => {
      if (r.status() === 404 && new URL(r.url()).host.includes('localhost')) dead.push(r.url());
    });
    await page.goto('./');
    await page.waitForLoadState('networkidle');
    expect(dead, 'أصول محلية مفقودة — غالباً base خاطئ').toEqual([]);
  });
});
