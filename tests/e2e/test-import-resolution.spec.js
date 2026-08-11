import { test, expect } from '@playwright/test';

test('test import resolution with fresh context', async ({ context }) => {
  // Create a fresh context with no extensions or cache
  const page = await context.newPage();
  
  // Navigate to a simple test page
  await page.goto('http://localhost:8000/starsector.html');
  
  // Wait for page to load
  await page.waitForTimeout(3000);
  
  // Check what URL the browser uses for cj3.js
  const requests = [];
  page.on('request', request => {
    if (request.url().includes('cj3.js')) {
      requests.push({
        url: request.url(),
        resourceType: request.resourceType()
      });
    }
  });
  
  // Wait a bit more
  await page.waitForTimeout(2000);
  
  console.log('\n=== CJ3.JS REQUESTS ===');
  requests.forEach((req, i) => {
    console.log(`${i + 1}. ${req.url}`);
  });
  
  // Check if cjFileBlob is defined
  const cjFileBlobDefined = await page.evaluate(() => {
    return typeof window.cheerpJ_cjFileBlob !== 'undefined';
  });
  
  console.log(`\ncjFileBlob defined: ${cjFileBlobDefined}`);
});
