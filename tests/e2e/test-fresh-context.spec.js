import { test, expect } from '@playwright/test';

test('test cj3.js loading with fresh browser context', async ({ browser }) => {
  // Create a fresh context with no extensions
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    serviceWorkers: 'block'
  });
  
  const page = await context.newPage();
  
  // Capture all requests
  const requests = [];
  page.on('request', request => {
    requests.push({
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType(),
      headers: request.headers()
    });
  });
  
  // Navigate to page
  await page.goto('http://localhost:8000/starsector.html');
  
  // Wait for page to load
  await page.waitForTimeout(5000);
  
  // Find cj3.js requests
  const cj3Requests = requests.filter(r => r.url.includes('cj3.js'));
  
  console.log('\n=== ALL CJ3.JS REQUESTS ===');
  cj3Requests.forEach((req, i) => {
    console.log(`${i + 1}. ${req.method} ${req.url}`);
    console.log(`   Resource Type: ${req.resourceType}`);
    console.log(`   Referer: ${req.headers['referer'] || 'none'}`);
  });
  
  await context.close();
});
