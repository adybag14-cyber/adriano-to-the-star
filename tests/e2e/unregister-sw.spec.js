import { test, expect } from '@playwright/test';

test('unregister service worker and reload', async ({ page, context }) => {
  // Navigate to the page
  await page.goto('http://localhost:8000/starsector.html');
  
  // Wait for page to load
  await page.waitForTimeout(2000);
  
  // Unregister all service workers
  const unregistered = await page.evaluate(async () => {
    const registrations = await navigator.serviceWorker.getRegistrations();
    const results = [];
    for (const registration of registrations) {
      const result = await registration.unregister();
      results.push({
        scope: registration.scope,
        unregistered: result
      });
    }
    return results;
  });
  
  console.log('Unregistered service workers:', JSON.stringify(unregistered, null, 2));
  
  // Clear caches
  await page.evaluate(async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      return `Cleared ${cacheNames.length} caches`;
    }
    return 'No caches to clear';
  });
  
  // Reload the page
  await page.reload({ waitUntil: 'networkidle' });
  
  // Wait for reload
  await page.waitForTimeout(3000);
  
  // Check if cj3.js is now loaded from local server
  const requests = [];
  page.on('request', request => {
    if (request.url().includes('cj3.js')) {
      requests.push(request.url());
    }
  });
  
  // Trigger a page action that might load cj3.js
  await page.evaluate(() => {
    console.log('Page reloaded after SW unregistration');
  });
  
  await page.waitForTimeout(5000);
  
  console.log('CJ3.js requests after SW unregistration:', requests);
});
