import { test, expect } from '@playwright/test';

test('check actual requests made by browser', async ({ page }) => {
  const allRequests = [];
  const allResponses = [];

  page.on('request', request => {
    allRequests.push({
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType(),
      headers: request.headers()
    });
  });

  page.on('response', response => {
    allResponses.push({
      url: response.url(),
      status: response.status(),
      headers: response.headers()
    });
  });

  await page.goto('http://localhost:8000/starsector.html');
  await page.waitForTimeout(5000);

  console.log('\n=== ALL REQUESTS ===');
  allRequests.forEach((req, i) => {
    console.log(`${i + 1}. ${req.method} ${req.url}`);
    console.log(`   Type: ${req.resourceType}`);
  });

  console.log('\n=== ALL RESPONSES ===');
  allResponses.forEach((res, i) => {
    console.log(`${i + 1}. ${res.status} ${res.url}`);
  });

  // Find cj3.js requests
  const cj3Requests = allRequests.filter(r => r.url.includes('cj3.js'));
  console.log('\n=== CJ3.JS REQUESTS ===');
  cj3Requests.forEach((req, i) => {
    console.log(`${i + 1}. ${req.method} ${req.url}`);
    console.log(`   Type: ${req.resourceType}`);
  });

  // Check if cj3.js was requested from local path
  const localCj3Request = cj3Requests.find(r => r.url.includes('/cheerpj/4.2/cj3.js'));
  const cdnCj3Request = cj3Requests.find(r => r.url.includes('cjrtnc.leaningtech.com'));

  console.log('\n=== ANALYSIS ===');
  console.log(`Local cj3.js request found: ${!!localCj3Request}`);
  console.log(`CDN cj3.js request found: ${!!cdnCj3Request}`);

  if (cdnCj3Request) {
    console.log(`CDN request URL: ${cdnCj3Request.url}`);
  }
});
