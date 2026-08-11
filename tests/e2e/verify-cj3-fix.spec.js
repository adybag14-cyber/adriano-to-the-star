import { test, expect } from '@playwright/test';

test('verify cj3.js loads as regular script', async ({ page }) => {
  // Capture console messages
  const consoleMessages = [];
  page.on('console', msg => {
    if (msg.text().includes('cj3.js') || msg.text().includes('cjFileBlob')) {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text()
      });
    }
  });
  
  // Capture requests
  const requests = [];
  page.on('request', request => {
    if (request.url().includes('cj3.js')) {
      requests.push({
        url: request.url(),
        method: request.method()
      });
    }
  });
  
  // Navigate to page
  await page.goto('http://localhost:8000/starsector.html');
  
  // Wait for page to load
  await page.waitForTimeout(5000);
  
  console.log('\n=== CONSOLE MESSAGES ===');
  consoleMessages.forEach((msg, i) => {
    console.log(`${i + 1}. [${msg.type}] ${msg.text}`);
  });
  
  console.log('\n=== CJ3.JS REQUESTS ===');
  requests.forEach((req, i) => {
    console.log(`${i + 1}. ${req.method} ${req.url}`);
  });
  
  // Check if cjFileBlob is defined
  const cjFileBlobDefined = await page.evaluate(() => {
    return {
      cjFileBlob: typeof window.cheerpJ_cjFileBlob,
      cheerpjInit: typeof window.cheerpjInit,
      cheerpjRunMain: typeof window.cheerpjRunMain,
      cheerpjRunJar: typeof window.cheerpjRunJar
    };
  });
  
  console.log('\n=== CHEERPJ AVAILABILITY ===');
  console.log(JSON.stringify(cjFileBlobDefined, null, 2));
  
  // Verify cj3.js was requested
  expect(requests.length).toBeGreaterThan(0);
  expect(requests[0].url).toContain('/cheerpj/4.2/cj3.js');
  
  // Verify cjFileBlob is defined
  expect(cjFileBlobDefined.cheerpjInit).toBe('function');
});
