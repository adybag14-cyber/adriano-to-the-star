import { test, expect } from '@playwright/test';

test('check console for import errors', async ({ page }) => {
  // Capture console messages
  const consoleMessages = [];
  
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
  });
  
  // Capture page errors
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push({
      message: error.message,
      stack: error.stack
    });
  });
  
  // Navigate to page
  await page.goto('http://localhost:8000/starsector.html');
  
  // Wait for page to load
  await page.waitForTimeout(5000);
  
  console.log('\n=== CONSOLE MESSAGES ===');
  consoleMessages.forEach((msg, i) => {
    console.log(`${i + 1}. [${msg.type}] ${msg.text}`);
  });
  
  console.log('\n=== PAGE ERRORS ===');
  pageErrors.forEach((err, i) => {
    console.log(`${i + 1}. ${err.message}`);
    if (err.stack) {
      console.log(`   Stack: ${err.stack.substring(0, 200)}`);
    }
  });
  
  // Check if cheerpjInit is available
  const cheerpjAvailable = await page.evaluate(() => {
    return {
      cheerpjInit: typeof window.cheerpjInit,
      cheerpjRunMain: typeof window.cheerpjRunMain,
      cheerpjRunJar: typeof window.cheerpjRunJar,
      cjFileBlob: typeof window.cheerpJ_cjFileBlob
    };
  });
  
  console.log('\n=== CHEERPJ AVAILABILITY ===');
  console.log(JSON.stringify(cheerpjAvailable, null, 2));
});
