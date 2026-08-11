import { test, expect } from '@playwright/test';

test('trace cj3.js network requests', async ({ page }) => {
  const requests = [];
  
  page.on('request', request => {
    if (request.url().includes('cj3.js') || request.url().includes('loader.js')) {
      requests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType()
      });
      console.log(`[REQUEST] ${request.method()} ${request.url()}`);
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('cj3.js') || response.url().includes('loader.js')) {
      console.log(`[RESPONSE] ${response.status()} ${response.url()}`);
    }
  });
  
  await page.goto('http://localhost:8000/starsector.html');
  await page.waitForTimeout(5000);
  
  console.log('\n=== SUMMARY ===');
  console.log('Total requests for cj3.js/loader.js:', requests.length);
  requests.forEach((req, i) => {
    console.log(`${i + 1}. ${req.method()} ${req.url}`);
  });
});
