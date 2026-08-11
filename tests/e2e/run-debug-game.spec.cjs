const { test, expect } = require('@playwright/test');
const fs = require('fs');

test('capture debug_game logs', async ({ page }) => {
  test.setTimeout(300000); // 5 minutes

  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(`[${msg.type()}] ${text}`);
    console.log(`[BROWSER] ${text}`);
  });

  page.on('requestfailed', request => {
    console.log(`[REQUEST FAILED] ${request.url()} - ${request.failure()?.errorText}`);
  });

  page.on('response', response => {
    if (response.status() === 404) {
      console.log(`[404] ${response.url()}`);
    }
  });

  console.log('Navigating to http://127.0.0.1:8091/debug_game.html...');
  await page.goto('http://127.0.0.1:8091/debug_game.html');

  // Wait for the START ENGINE button
  await page.waitForSelector('#btn', { timeout: 60000 });
  console.log('Page loaded, waiting 5s...');
  await page.waitForTimeout(5000);
  console.log('Clicking START ENGINE...');
  await page.click('#btn');
  
  // Wait for status to change from Ready
  await expect(page.locator('#status')).not.toHaveText('Ready', { timeout: 30000 });
  console.log('Status changed, engine starting...');

  // Wait for some time
  console.log('Waiting for JVM boot and logs...');
  await page.waitForTimeout(180000); // 3 minutes

  await page.screenshot({ path: 'starsector-debug-screenshot.png' });
  
  // Write logs to file
  fs.writeFileSync('starsector-debug-console.log', consoleLogs.join('\n'));
});
