import { test, expect } from '@playwright/test';

test('check module resolution', async ({ page, context }) => {
  // Clear all service workers and caches before starting
  await context.clearCookies();
  await context.clearPermissions();
  
  // Navigate to the page
  await page.goto('http://localhost:8000/starsector.html');
  
  // Wait for page to load
  await page.waitForTimeout(3000);
  
  // Check what URL the browser is using for cj3.js
  const moduleInfo = await page.evaluate(async () => {
    // Try to import the module and see what URL is used
    try {
      const module = await import('/cheerpj/4.2/cj3.js');
      return {
        success: true,
        moduleKeys: Object.keys(module)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  });
  
  console.log('Module import result:', JSON.stringify(moduleInfo, null, 2));
  
  // Check document.baseURI
  const baseURI = await page.evaluate(() => document.baseURI);
  console.log('Document baseURI:', baseURI);
  
  // Check if there are any import maps
  const importMaps = await page.evaluate(() => {
    const maps = [];
    document.querySelectorAll('script[type="importmap"]').forEach(el => {
      maps.push(el.textContent);
    });
    return maps;
  });
  console.log('Import maps found:', importMaps.length);
});
