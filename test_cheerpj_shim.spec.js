import { test, expect } from '@playwright/test';

test('Starsector Shim Loader Test', async ({ page }) => {
  // 1. Navigate to the debug page
  console.log('Navigating to game page...');
  await page.goto('http://127.0.0.1:8091/debug_game.html');

  // 2. Setup console listener to capture Shim logs
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(text);
    console.log(`[BROWSER]: ${text}`);
  });

  // 3. Wait for and click the Start button
  const startBtn = page.locator('#btn');
  await expect(startBtn).toBeVisible();
  console.log('Clicking START ENGINE...');
  await startBtn.click();

  // 4. Wait for Shim execution logs
  // We expect "Running Shim..." in the status div and specific logs from Java
  await expect(page.locator('#status')).toContainText('Running Shim...', { timeout: 10000 });

  // Increase timeout for JVM boot and file operations
  test.setTimeout(120000); 

  // Wait for the Shim to download settings.json
  await expect.poll(() => consoleLogs.some(l => l.includes('[SHIM] Saved data/config/settings.json')), {
    message: 'Shim failed to save settings.json',
    timeout: 60000,
  }).toBeTruthy();

  console.log('Shim successfully injected settings.json!');

  // Wait for Starsector launch attempt
  await expect.poll(() => consoleLogs.some(l => l.includes('[SHIM] Launching Starsector...')), {
    message: 'Shim failed to launch Starsector class',
    timeout: 30000,
  }).toBeTruthy();

  console.log('Starsector launch initiated!');

  // Optional: Wait to see if it crashes or runs. 
  // A successful "run" might just be a lack of immediate crash log, 
  // or seeing "Starsector exited with code:" if it fails later.
  // For now, getting to the launch phase confirms the Shim worked.
  
  // Take a screenshot for visual verification
  await page.screenshot({ path: 'starsector_shim_test.png' });
});
