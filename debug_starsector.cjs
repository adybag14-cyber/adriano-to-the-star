const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log("--- STARTING PLAYWRIGHT DEBUGGER ---");

  page.on('console', msg => {
    console.log(`[BROWSER] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });

  page.on('pageerror', err => {
    console.log(`[BROWSER-FATAL] ${err.message}`);
  });

  try {
    await page.goto('http://localhost:8091/game.html', { waitUntil: 'networkidle' });
    console.log("Page loaded. Clicking INITIALIZE...");
    
    await page.click('#btn');
    
    // Wait for a long time to capture prefetch and boot logs
    console.log("Waiting for 2 minutes...");
    await page.waitForTimeout(120000); 
    
  } catch (e) {
    console.error("Playwright Error:", e);
  } finally {
    await browser.close();
    console.log("--- DEBUGGER FINISHED ---");
  }
})();