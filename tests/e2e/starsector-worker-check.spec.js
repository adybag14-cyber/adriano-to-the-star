import { test, expect } from '@playwright/test';

test('Starsector worker initialization check', async ({ page }) => {
  const workerUrl = 'https://starisdons-swf-worker.adybag14.workers.dev/Starsector-0.97a-RC11/starsector.html?mode=combat';
  
  console.log('Navigating to worker URL:', workerUrl);
  
  // Capture console logs
  const logs = [];
  page.on('console', msg => {
    logs.push({ type: msg.type(), text: msg.text() });
    console.log(`[${msg.type()}]`, msg.text());
  });
  
  // Capture page errors
  const errors = [];
  page.on('pageerror', error => {
    errors.push(error.message);
    console.error('[PAGE ERROR]', error.message);
  });
  
  // Capture network requests
  const networkRequests = [];
  page.on('request', request => {
    networkRequests.push({ url: request.url(), method: request.method() });
  });
  
  page.on('response', response => {
    const req = networkRequests.find(r => r.url === response.url());
    if (req) {
      req.status = response.status();
      req.contentType = response.headers()['content-type'];
    }
  });
  
  // Navigate to page
  await page.goto(workerUrl, { waitUntil: 'networkidle', timeout: 10000 });
  
  // Wait 10 seconds for initialization
  await page.waitForTimeout(10000);
  
  // Check CheerpJ initialization
  const cheerpjInit = await page.evaluate(() => typeof cheerpjInit);
  console.log('cheerpjInit type:', cheerpjInit);
  
  // Check document state
  const docState = await page.evaluate(() => document.readyState);
  console.log('Document readyState:', docState);
  
  // Check for canvas
  const canvasExists = await page.evaluate(() => !!document.querySelector('canvas'));
  console.log('Canvas exists:', canvasExists);
  
  // Check current URL
  const currentUrl = page.url();
  console.log('Current URL:', currentUrl);
  
  // Summary
  console.log('\n=== SUMMARY ===');
  console.log('Total logs:', logs.length);
  console.log('Total errors:', errors.length);
  console.log('Total network requests:', networkRequests.length);
  
  // Find CheerpJ-related logs
  const cheerpjLogs = logs.filter(l => l.text.includes('CheerpJ') || l.text.includes('cj3') || l.text.includes('shim'));
  console.log('CheerpJ-related logs:', cheerpjLogs.length);
  cheerpjLogs.forEach(l => console.log('  -', l.text));
  
  // Find error logs
  const errorLogs = logs.filter(l => l.type === 'error');
  console.log('Error logs:', errorLogs.length);
  errorLogs.forEach(l => console.log('  -', l.text));
  
  // Check loader.js request
  const loaderRequest = networkRequests.find(r => r.url.includes('loader.js'));
  console.log('loader.js request:', loaderRequest ? `${loaderRequest.status} (${loaderRequest.contentType})` : 'NOT FOUND');
  
  // Check cj3.js request
  const cj3Request = networkRequests.find(r => r.url.includes('cj3.js'));
  console.log('cj3.js request:', cj3Request ? `${cj3Request.status} (${cj3Request.contentType})` : 'NOT FOUND');
  
  // Check lwjgl requests
  const lwjglRequests = networkRequests.filter(r => r.url.includes('lwjgl'));
  console.log('LWJGL requests:', lwjglRequests.length);
  lwjglRequests.slice(0, 5).forEach(r => console.log('  -', r.url.substring(r.url.lastIndexOf('/') + 1), r.status));
  
  // Take screenshot
  await page.screenshot({ path: 'test-results/starsector-worker-check.png', fullPage: true });
  console.log('Screenshot saved to test-results/starsector-worker-check.png');
  
  // Assert basic expectations
  expect(currentUrl).toBe(workerUrl);
});
