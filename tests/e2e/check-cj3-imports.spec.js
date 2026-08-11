import { test, expect } from '@playwright/test';

test('check what cj3.js imports', async ({ page }) => {
  // Capture all requests
  const requests = [];
  page.on('request', request => {
    requests.push({
      url: request.url(),
      resourceType: request.resourceType()
    });
  });
  
  // Navigate to page
  await page.goto('http://localhost:8000/starsector.html');
  await page.waitForTimeout(5000);
  
  // Check if cj3.js is loaded and what it imports
  const cj3Info = await page.evaluate(async () => {
    // Check if cheerpjInit is available
    if (typeof window.cheerpjInit === 'function') {
      return {
        cheerpjInit: 'available',
        cheerpjRunMain: typeof window.cheerpjRunMain,
        cheerpjRunJar: typeof window.cheerpjRunJar,
        cjFileBlob: typeof window.cheerpJ_cjFileBlob
      };
    }
    
    // Try to import cj3.js
    try {
      const module = await import('/cheerpj/4.2/cj3.js');
      return {
        imported: true,
        keys: Object.keys(module),
        cheerpjInit: typeof module.cheerpjInit,
        cheerpjRunMain: typeof module.cheerpjRunMain,
        cheerpjRunJar: typeof module.cheerpjRunJar,
        cjFileBlob: typeof module.cjFileBlob
      };
    } catch (error) {
      return {
        error: error.message
      };
    }
  });
  
  console.log('CJ3.js info:', JSON.stringify(cj3Info, null, 2));
  
  // Find cj3.js requests
  const cj3Requests = requests.filter(r => r.url.includes('cj3.js'));
  console.log('\nCJ3.js requests:', cj3Requests.length);
  cj3Requests.forEach((req, i) => {
    console.log(`${i + 1}. ${req.url}`);
  });
});
