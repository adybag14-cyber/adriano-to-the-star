import { test, expect } from '@playwright/test';

test('Starsector worker detailed network analysis', async ({ page }) => {
  const workerUrl = 'https://starisdons-swf-worker.adybag14.workers.dev/Starsector-0.97a-RC11/starsector.html?mode=combat';
  
  console.log('Navigating to worker URL:', workerUrl);
  
  // Capture all network requests
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
  
  // Analyze 404 errors
  const failedRequests = networkRequests.filter(r => r.status === 404);
  console.log('\n=== FAILED REQUESTS (404) ===');
  failedRequests.forEach(r => {
    const path = r.url.substring(r.url.lastIndexOf('/') + 1);
    console.log(`- ${path} (${r.contentType || 'no content-type'})`);
  });
  
  // Analyze successful requests
  const successfulRequests = networkRequests.filter(r => r.status === 200);
  console.log('\n=== SUCCESSFUL REQUESTS (200) ===');
  successfulRequests.slice(0, 20).forEach(r => {
    const path = r.url.substring(r.url.lastIndexOf('/') + 1);
    console.log(`- ${path} (${r.contentType || 'no content-type'})`);
  });
  
  // Check for specific files
  const x11Wasm = networkRequests.find(r => r.url.includes('x11.wasm'));
  console.log('\n=== SPECIFIC FILES ===');
  console.log('x11.wasm:', x11Wasm ? `${x11Wasm.status} (${x11Wasm.contentType})` : 'NOT REQUESTED');
  
  const cheerpOS = networkRequests.find(r => r.url.includes('cheerpOS'));
  console.log('cheerpOS files:', networkRequests.filter(r => r.url.includes('cheerpOS')).map(r => `${r.status} (${r.contentType})`));
  
  // Check canvas
  const canvasExists = await page.evaluate(() => !!document.querySelector('canvas'));
  console.log('Canvas exists:', canvasExists);
  
  // Summary
  console.log('\n=== SUMMARY ===');
  console.log('Total requests:', networkRequests.length);
  console.log('Successful (200):', successfulRequests.length);
  console.log('Failed (404):', failedRequests.length);
  console.log('Other errors:', networkRequests.filter(r => r.status >= 400 && r.status !== 404).length);
  
  // Save detailed log
  const fs = require('fs');
  fs.writeFileSync('test-results/network-requests.json', JSON.stringify(networkRequests, null, 2));
  console.log('Detailed network log saved to test-results/network-requests.json');
});
