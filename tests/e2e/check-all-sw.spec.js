import { test, expect } from '@playwright/test';

test('check all service workers and caches', async ({ context, page }) => {
  // Clear all storage and caches
  await context.clearCookies();
  await context.clearPermissions();
  
  // Navigate to page
  await page.goto('http://localhost:8000/starsector.html');
  
  // Check all service workers
  const swInfo = await page.evaluate(async () => {
    const registrations = await navigator.serviceWorker.getRegistrations();
    return registrations.map(reg => ({
      scope: reg.scope,
      active: reg.active ? reg.active.scriptURL : null,
      installing: reg.installing ? reg.installing.scriptURL : null,
      waiting: reg.waiting ? reg.waiting.scriptURL : null
    }));
  });
  
  console.log('All Service Workers:', JSON.stringify(swInfo, null, 2));
  
  // Check all caches
  const cacheInfo = await page.evaluate(async () => {
    if (!('caches' in window)) return [];
    const cacheNames = await caches.keys();
    return cacheNames;
  });
  
  console.log('All Caches:', cacheInfo);
  
  // Check if there's an import map
  const importMapInfo = await page.evaluate(() => {
    const maps = [];
    document.querySelectorAll('script[type="importmap"]').forEach(el => {
      maps.push(el.textContent);
    });
    return maps;
  });
  
  console.log('Import Maps:', importMapInfo);
  
  // Check document.baseURI
  const baseURI = await page.evaluate(() => document.baseURI);
  console.log('Base URI:', baseURI);
});
