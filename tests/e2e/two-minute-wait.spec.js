import { test, expect } from '@playwright/test';

test('two minute wait for starsector diagnostic', async ({ page }) => {
  test.setTimeout(200000); // 3.3 minutes total timeout
  
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    logs.push(`[${msg.type()}] ${text}`);
    console.log(`[BROWSER][${msg.type()}] ${text}`);
  });

  page.on('pageerror', err => {
    console.log(`[BROWSER][ERROR] ${err.message}`);
  });

  // Intercept /log POST requests to capture Java-level logs
  await page.route('**/log', async route => {
    const postData = route.request().postData();
    console.log(`[PAGE LOG] ${postData}`);
    await route.fulfill({ status: 200, contentType: 'text/plain', body: 'ok' });
  });

  console.log('Navigating to http://localhost:8000/starsector_4.2_final.html ...');
  await page.goto('http://localhost:8000/starsector_4.2_final.html', { waitUntil: 'load' });

  console.log('Waiting for canvas to be created...');
  try {
    await page.waitForSelector('canvas', { timeout: 30000 });
    console.log('Canvas found.');
  } catch (e) {
    console.log('Canvas not found via selector, might be inside a shadow root or delayed.');
  }

  console.log('--- STARTING 120 SECOND SUSTAINED MONITORING ---');
  
  // Sample the canvas every 30 seconds
  for (let i = 0; i < 4; i++) {
    await page.waitForTimeout(30000);
    const canvasData = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') || document.getElementById('lwjgl');
      if (!canvas) return { error: 'No canvas found' };
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return { error: 'No WebGL context' };
      const pixels = new Uint8Array(4);
      gl.readPixels(canvas.width/2, canvas.height/2, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      return { pixel: Array.from(pixels), timestamp: performance.now() };
    });
    console.log(`[T+${(i+1)*30}s] Canvas Sample: ${JSON.stringify(canvasData)}`);
  }

  console.log('--- MONITORING COMPLETE ---');

  // Extract internal logs from CheerpJ virtual file system
  const virtualLog = await page.evaluate(async () => {
    try {
      // CheerpJ 4.2 provides access to the file system via standard APIs or internal helpers
      // We can try to read the file using a simple fetch if mapped, or a Java snippet
      const response = await fetch('/app/Starsector/starsector.log');
      if (response.ok) return await response.text();
      return `Failed to fetch log: ${response.status} ${response.statusText}`;
    } catch (e) {
      return `Error reading virtual log: ${e.message}`;
    }
  });

  console.log('\n--- VIRTUAL STARSECTOR LOG ---');
  console.log(virtualLog.substring(0, 5000)); // Show first 5000 chars
  
  const title = await page.title();
  console.log(`[FINAL] Page Title: ${title}`);

  await page.screenshot({ path: 'two-minute-diagnostic.png', fullPage: true });
  console.log('Diagnostic screenshot saved.');
});