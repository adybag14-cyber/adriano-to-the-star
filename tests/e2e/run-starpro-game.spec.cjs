const { test, expect } = require('@playwright/test');
const fs = require('fs');

test('capture starsector from starpro logs', async ({ page }) => {
  test.setTimeout(300000); // 5 minutes

  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(`[${msg.type()}] ${text}`);
    console.log(`[BROWSER] ${text}`);
  });

  page.on('pageerror', err => {
    consoleLogs.push(`[ERROR] ${err.message}`);
    console.log(`[BROWSER ERROR] ${err.message}`);
  });

  console.log('Navigating to http://127.0.0.1:8091/starsector_from_starpro.html...');
  await page.goto('http://127.0.0.1:8091/starsector_from_starpro.html');

  // Wait for the canvas
  await page.waitForSelector('#lwjgl', { timeout: 60000 });
  console.log('Canvas found.');

  // Wait for some time
  console.log('Waiting for JVM boot and logs...');
  await page.waitForTimeout(180000); // 3 minutes

  await page.screenshot({ path: 'starsector-starpro-screenshot.png' });
  
  // Write logs to file
  fs.writeFileSync('starsector-starpro-console.log', consoleLogs.join('\n'));
});
