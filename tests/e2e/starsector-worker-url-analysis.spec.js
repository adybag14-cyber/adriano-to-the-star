import { test, expect } from '@playwright/test';

test('Starsector worker URL analysis', async ({ page }) => {
  const workerUrl = 'https://starisdons-swf-worker.adybag14.workers.dev/Starsector-0.97a-RC11/starsector.html?mode=combat';
  
  console.log('Navigating to worker URL:', workerUrl);
  
  // Capture all network requests with full URLs
  const networkRequests = [];
  page.on('request', request => {
    networkRequests.push({
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType()
    });
  });
  
  page.on('response', response => {
    const req = networkRequests.find(r => r.url === response.url());
    if (req) {
      req.status = response.status();
      req.contentType = response.headers()['content-type'];
    }
  });
  
  // Navigate to page
  await page.goto(workerUrl, { waitUntil: 'networkidle', timeout: 15000 });
  
  // Wait 15 seconds for initialization
  await page.waitForTimeout(15000);
  
  // Check CheerpJ initialization
  const cheerpjInit = await page.evaluate(() => typeof cheerpjInit);
  console.log('cheerpjInit type:', cheerpjInit);
  
  // Analyze failed requests with full URLs
  const failedRequests = networkRequests.filter(r => r.status === 404);
  console.log('\n=== FAILED REQUESTS (404) - FULL URLs ===');
  failedRequests.forEach(r => {
    console.log(`- ${r.url}`);
    console.log(`  Status: ${r.status}, Content-Type: ${r.contentType || 'none'}`);
  });
  
  // Check for specific CheerpJ files
  const cheerpjRequests = networkRequests.filter(r => r.url.includes('cheerpj'));
  console.log('\n=== CHEERPJ REQUESTS ===');
  cheerpjRequests.forEach(r => {
    const path = r.url.substring(r.url.lastIndexOf('/cheerpj/'));
    console.log(`- ${path}`);
    console.log(`  Status: ${r.status}`);
  });
  
  // Summary
  console.log('\n=== SUMMARY ===');
  console.log('Total requests:', networkRequests.length);
  console.log('Successful (200):', networkRequests.filter(r => r.status === 200).length);
  console.log('Failed (404):', failedRequests.length);
});
