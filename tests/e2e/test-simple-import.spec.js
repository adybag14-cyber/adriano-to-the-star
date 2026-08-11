import { test, expect } from '@playwright/test';

test('test simple cj3.js import', async ({ page }) => {
  // Navigate to test page
  await page.goto('http://localhost:8000/test-cj3-import.html');
  
  // Wait for page to load
  await page.waitForTimeout(3000);
  
  // Check if cj3.js loaded
  const results = await page.evaluate(() => {
    return window.testResults || { error: 'No results' };
  });
  
  console.log('Test Results:', JSON.stringify(results, null, 2));
  
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
  
  await page.waitForTimeout(2000);
  
  console.log('\n=== CJ3.JS REQUESTS ===');
  requests.forEach((req, i) => {
    console.log(`${i + 1}. ${req.method} ${req.url}`);
  });
});
