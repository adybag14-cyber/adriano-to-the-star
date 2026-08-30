import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { SITE_PAGES } from '../../scripts/site-pages.mjs';

const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 }
];

test.describe('WCAG 2.2 AA rendered-page audit', () => {
  for (const viewport of viewports) {
    test(`${viewport.name}: every production page has no rendered Axe violations`, async ({ page }, testInfo) => {
      test.setTimeout(12 * 60 * 1000);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      const violations = [];
      for (const entry of SITE_PAGES) {
        if (entry.path === 'starsector.html') continue;
        const response = await page.goto(`/${entry.path}`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        expect(response?.status(), `${entry.path} response`).toBeLessThan(400);
        await page.waitForTimeout(120);
        const result = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze();
        result.violations.forEach(violation => violations.push({
          page: entry.path,
          id: violation.id,
          impact: violation.impact,
          help: violation.help,
          helpUrl: violation.helpUrl,
          nodes: violation.nodes.slice(0, 12).map(node => ({ target: node.target, html: node.html, summary: node.failureSummary }))
        }));
      }
      await testInfo.attach(`axe-${viewport.name}.json`, { body: JSON.stringify(violations, null, 2), contentType: 'application/json' });
      expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
    });
  }
});
