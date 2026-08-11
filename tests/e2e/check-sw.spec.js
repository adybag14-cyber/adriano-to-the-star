import { test, expect } from '@playwright/test';

test('check active service worker', async ({ page }) => {
  await page.goto('http://localhost:8000/starsector.html');
  
  // Wait for page to load
  await page.waitForTimeout(2000);
  
  // Get active service worker
  const swInfo = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      return { registered: false };
    }
    
    return {
      registered: true,
      scope: registration.scope,
      active: registration.active ? registration.active.scriptURL : null,
      waiting: registration.waiting ? registration.waiting.scriptURL : null,
      installing: registration.installing ? registration.installing.scriptURL : null
    };
  });
  
  console.log('Service Worker Info:', JSON.stringify(swInfo, null, 2));
  
  // Also check if there are any service workers registered for the origin
  const allSw = await page.evaluate(async () => {
    const registrations = await navigator.serviceWorker.getRegistrations();
    return registrations.map(reg => ({
      scope: reg.scope,
      active: reg.active ? reg.active.scriptURL : null,
      scriptURL: reg.active ? reg.active.scriptURL : reg.installing?.scriptURL
    }));
  });
  
  console.log('All Service Workers:', JSON.stringify(allSw, null, 2));
});
