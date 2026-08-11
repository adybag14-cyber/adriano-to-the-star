import { test, expect } from '@playwright/test';

test('clear all caches and reload', async ({ context, page }) => {
  // Clear all storage and caches
  await context.clearCookies();
  await context.clearPermissions();
  
  // Navigate to the page
  await page.goto('http://localhost:8000/starsector.html');
  
  // Clear all caches and service workers
  const cleared = await page.evaluate(async () => {
    // Clear service workers
    const registrations = await navigator.serviceWorker.getRegistrations();
    const swResults = [];
    for (const registration of registrations) {
      const result = await registration.unregister();
      swResults.push({
        scope: registration.scope,
        unregistered: result
      });
    }
    
    // Clear caches
    let cacheCount = 0;
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      cacheCount = cacheNames.length;
    }
    
    // Clear localStorage
    localStorage.clear();
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    return {
      serviceWorkers: swResults,
      cachesCleared: cacheCount
    };
  });
  
  console.log('Cleared:', JSON.stringify(cleared, null, 2));
  
  // Reload the page
  await page.reload({ waitUntil: 'networkidle' });
  
  // Wait for reload
  await page.waitForTimeout(3000);
  
  // Check requests
  const requests = [];
  page.on('request', request => {
    if (request.url().includes('loader.js') || request.url().includes('cj3.js')) {
      requests.push({
        url: request.url(),
        method: request.method()
      });
    }
  });
  
  // Wait a bit more
  await page.waitForTimeout(3000);
  
  console.log('\n=== REQUESTS AFTER CLEARING ===');
  requests.forEach((req, i) => {
    console.log(`${i + 1}. ${req.method} ${req.url}`);
  });
});
