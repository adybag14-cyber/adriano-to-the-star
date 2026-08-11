const { test, expect } = require('@playwright/test');
const fs = require('fs');

test('capture starsector game.html logs', async ({ page }) => {
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

  console.log('Navigating to http://127.0.0.1:8091/game.html...');
  await page.goto('http://127.0.0.1:8091/game.html');

  // Wait for the START ENGINE button and click it
  await page.waitForSelector('#btn');
  console.log('Clicking START ENGINE...');
  await page.click('#btn');

  // Wait for the canvas to be initialized
  await page.waitForSelector('#display', { timeout: 60000 });
  console.log('Canvas found.');

  // Wait for some time to let the JVM boot and fail
  console.log('Waiting for JVM boot and logs...');
  await page.waitForTimeout(180000); // 3 minutes


  await page.screenshot({ path: 'starsector-game-screenshot.png' });
  
  // Write logs to file
  fs.writeFileSync('starsector-game-console.log', consoleLogs.join('\n'));
});