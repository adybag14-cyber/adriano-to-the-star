import { test, expect } from '@playwright/test';

test('check if service worker intercepts requests', async ({ page }) => {
  // Navigate to page
  await page.goto('http://localhost:8000/starsector.html');
  
  // Check if there's a service worker
  const swInfo = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      return { hasSW: false };
    }
    
    // Check if the service worker is controlling the page
    const isControlled = !!navigator.serviceWorker.controller;
    
    return {
      hasSW: true,
      isControlled,
      scope: registration.scope,
      active: registration.active ? registration.active.scriptURL : null
    };
  });
  
  console.log('Service Worker Info:', JSON.stringify(swInfo, null, 2));
  
  // Try to load cj3.js directly and see what happens
  const cj3Test = await page.evaluate(async () => {
    try {
      const response = await fetch('/cheerpj/4.2/cj3.js');
      return {
        url: response.url,
        status: response.status,
        ok: response.ok
      };
    } catch (error) {
      return {
        error: error.message
      };
    }
  });
  
  console.log('Direct fetch result:', JSON.stringify(cj3Test, null, 2));
});
