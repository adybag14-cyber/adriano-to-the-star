import { test, expect } from '@playwright/test';
import fs from 'fs';

test('debug cj3.js import path rewriting', async ({ page, context }) => {
  // Capture all network requests
  const requests = [];
  page.on('request', request => {
    requests.push({
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType(),
      headers: request.headers(),
      postData: request.postData()
    });
    console.log(`[REQUEST] ${request.method()} ${request.url()}`);
  });

  page.on('response', response => {
    console.log(`[RESPONSE] ${response.status()} ${response.url()}`);
  });

  // Navigate to starsector.html
  await page.goto('http://localhost:8000/starsector.html');

  // Wait for the page to load
  await page.waitForTimeout(5000);

  // Find all requests for cj3.js
  const cj3Requests = requests.filter(r => r.url.includes('cj3.js'));
  console.log('\n=== CJ3.JS REQUESTS ===');
  cj3Requests.forEach(req => {
    console.log(`URL: ${req.url}`);
    console.log(`Method: ${req.method}`);
    console.log(`Resource Type: ${req.resourceType}`);
    console.log(`Initiator: ${JSON.stringify(req.initiator)}`);
    console.log('---');
  });

  // Check for service worker registration
  const swRegistration = await page.evaluate(() => {
    return navigator.serviceWorker.getRegistration();
  });
  console.log('\n=== SERVICE WORKER ===');
  console.log(`Registered: ${swRegistration !== null}`);
  if (swRegistration) {
    console.log(`Scope: ${swRegistration.scope}`);
    console.log(`Active: ${swRegistration.active !== null}`);
  }

  // Check for import maps
  const importMaps = await page.evaluate(() => {
    const maps = [];
    document.querySelectorAll('script[type="importmap"]').forEach(el => {
      maps.push(el.textContent);
    });
    return maps;
  });
  console.log('\n=== IMPORT MAPS ===');
  console.log(`Count: ${importMaps.length}`);
  if (importMaps.length > 0) {
    importMaps.forEach((map, i) => {
      console.log(`Map ${i + 1}: ${map}`);
    });
  }

  // Check document.baseURI
  const baseURI = await page.evaluate(() => document.baseURI);
  console.log('\n=== DOCUMENT INFO ===');
  console.log(`baseURI: ${baseURI}`);
  console.log(`location.href: ${await page.evaluate(() => location.href)}`);

  // Save results
  fs.writeFileSync(
    'test-results/debug-cj3-import.json',
    JSON.stringify({
      cj3Requests,
      serviceWorker: swRegistration ? { scope: swRegistration.scope } : null,
      importMaps,
      baseURI,
      allRequests: requests
    }, null, 2)
  );

  console.log('\n=== RESULTS SAVED TO test-results/debug-cj3-import.json ===');
});
