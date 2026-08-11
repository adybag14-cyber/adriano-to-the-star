import { test, expect } from '@playwright/test';

test('test cj3.js loads from CDN path and cheerpjInit is available', async ({ page }) => {
  const consoleMessages = [];
  const errors = [];

  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text()
    });
  });

  page.on('pageerror', error => {
    errors.push(error.toString());
  });

  await page.goto('http://localhost:8000/starsector.html');
  await page.waitForTimeout(5000);

  console.log('\n=== CONSOLE MESSAGES ===');
  consoleMessages.forEach(msg => {
    console.log(`[${msg.type}] ${msg.text}`);
  });

  console.log('\n=== ERRORS ===');
  errors.forEach(err => {
    console.log(err);
  });

  // Check if cheerpjInit is defined
  const cheerpjInitDefined = await page.evaluate(() => {
    return typeof window.cheerpjInit === 'function';
  });
  console.log(`\ncheerpjInit defined: ${cheerpjInitDefined}`);

  // Check if cheerpjRunMain is defined
  const cheerpjRunMainDefined = await page.evaluate(() => {
    return typeof window.cheerpjRunMain === 'function';
  });
  console.log(`cheerpjRunMain defined: ${cheerpjRunMainDefined}`);

  // Check if cheerpjRunJar is defined
  const cheerpjRunJarDefined = await page.evaluate(() => {
    return typeof window.cheerpjRunJar === 'function';
  });
  console.log(`cheerpjRunJar defined: ${cheerpjRunJarDefined}`);

  // Check if cjFileBlob is defined
  const cjFileBlobDefined = await page.evaluate(() => {
    return typeof window.cjFileBlob === 'function';
  });
  console.log(`cjFileBlob defined: ${cjFileBlobDefined}`);

  // Verify all required functions are defined
  expect(cheerpjInitDefined).toBe(true);
  expect(cheerpjRunMainDefined).toBe(true);
  expect(cheerpjRunJarDefined).toBe(true);
  expect(cjFileBlobDefined).toBe(true);

  console.log('\n✓ All CheerpJ functions are available');
});
