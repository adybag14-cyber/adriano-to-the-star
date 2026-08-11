const { test, expect } = require('@playwright/test');
const fs = require('fs');

test('debug starsector loading with long timeout and console logging', async ({ page }) => {
  test.setTimeout(120000); // 2 minutes

  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(`[${msg.type()}] ${text}`);
    console.log(`[BROWSER] ${text}`); // Print to test runner output
  });

  console.log('Navigating to Starsector...');
  await page.goto('http://localhost:8000/starsector.html');

  // Wait for the canvas to exist
  await page.waitForSelector('#lwjgl', { timeout: 60000 });
  console.log('LWJGL canvas found.');

  // Take periodic screenshots to monitor progress
  for (let i = 0; i < 12; i++) {
    await page.waitForTimeout(10000); // Wait 10 seconds
    await page.screenshot({ path: `starsector-debug-${i * 10}s.png` });
    console.log(`Screenshot taken at ${i * 10}s`);
  }

  // Write logs to file
  fs.writeFileSync('starsector-console.log', consoleLogs.join('\n'));
});
