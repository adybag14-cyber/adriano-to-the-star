import { test, expect } from '@playwright/test';
import { SITE_PAGES } from '../../scripts/site-pages.mjs';

// Each page gets a fresh browser context. This verifies the shared controls in
// the page layout where visitors actually use them, including overlays.
for (const entry of SITE_PAGES.filter(page => page.path !== 'starsector.html')) {
  test(`shared controls complete their effects on ${entry.path}`, async ({ page }) => {
    await page.goto(`/${entry.path}`, { waitUntil: 'domcontentloaded' });
    if (await page.locator('script[src*="theme-toggle"]').count()) {
    await page.locator('#theme-toggle-btn').click();
    await page.locator('.theme-option[data-theme="dark"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(await page.evaluate(() => localStorage.getItem('theme-preference'))).toBe('dark');
    await page.locator('#theme-toggle-btn').click();
    await page.locator('.theme-option[data-theme="cosmic"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'cosmic');
    }

    if (await page.locator('script[src*="i18n.js"]').count()) {
    await page.waitForFunction(() => window.i18n?.().ready);
    const translated = page.locator('[data-i18n]:visible').first();
    const hasTranslatedText = await translated.count() > 0;
    const englishText = hasTranslatedText ? await translated.textContent() : null;
    await page.locator('.ita-language-toggle').click();
    await page.locator('.ita-language-option[data-lang="es"]').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await page.locator('.ita-language-toggle').click();
    await page.locator('.ita-language-option[data-lang="en"]').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    if (hasTranslatedText) await expect(translated).toHaveText(englishText);
    expect(await page.evaluate(() => localStorage.getItem('language-preference'))).toBe('en');
    await page.locator('.ita-language-toggle').click();
    await page.locator('.ita-language-option[data-lang="es"]').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    if (hasTranslatedText) {
      const key = await translated.getAttribute('data-i18n');
      const expected = await page.evaluate(key => window.t(key), key);
      if (expected !== key) await expect(translated).toHaveText(expected);
    }
    await page.locator('.ita-language-toggle').click();
    await page.locator('.ita-language-option[data-lang="en"]').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    }

    if (await page.locator('script[src*="navigation.js"]').count()) {
    const trigger = page.locator('[data-atlas-trigger]:visible, #menu-toggle:visible').first();
    await trigger.click();
    await expect(page.locator('#ita-atlas-overlay')).toBeVisible();
    await page.locator('#ita-atlas-search').fill('database');
    await expect(page.locator('.ita-atlas-link[data-route="database.html"]')).toBeVisible();
    await expect(page.locator('.ita-atlas-link[data-route="database.html"]')).toHaveAttribute('href', /database\.html$/);
    await page.keyboard.press('Escape');
    await expect(page.locator('#ita-atlas-overlay')).not.toBeVisible();
    }

    // API reference pages intentionally omit audio; there is no player action
    // to exercise when the player script is not part of that page.
    if (await page.locator('script[src*="cosmic-music-player"]').count() === 0) return;
    if (!(await page.locator('#player-content').isVisible())) await page.locator('#minimize-player').click();
    await expect(page.locator('#player-content')).toBeVisible();
    const initial = await page.locator('#current-track').innerText();
    await page.locator('#next-track').click();
    await expect(page.locator('#current-track')).not.toHaveText(initial);
    await page.locator('#prev-track').click();
    await expect(page.locator('#current-track')).toHaveText(initial);
    const loop = page.locator('#loop-toggle');
    const wasChecked = await loop.isChecked();
    await loop.setChecked(!wasChecked);
    await expect(loop).toBeChecked({ checked: !wasChecked });
    const volume = page.locator('#volume-control');
    await volume.focus();
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#volume-display')).toHaveText('1%');
    await page.locator('#minimize-player').click();
    await expect(page.locator('#player-content')).not.toBeVisible();
  });
}
