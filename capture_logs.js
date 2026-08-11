import { chromium } from '@playwright/test';

(async () => {
  console.log("Starting log capture...");
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log(`[BROWSER] ${msg.text()}`));
  page.on('pageerror', err => console.log(`[BROWSER ERROR] ${err.message}`));
  
  try {
    console.log("Navigating to http://localhost:8000/starsector.html");
    await page.goto('http://localhost:8000/starsector.html', { timeout: 60000 });
    console.log("Waiting 60 seconds...");
    await new Promise(r => setTimeout(r, 60000));
    await page.screenshot({ path: 'latest-check.png' });
  } catch (e) {
    console.error("Capture failed:", e.message);
  } finally {
    await browser.close();
    console.log("Done.");
  }
})();
