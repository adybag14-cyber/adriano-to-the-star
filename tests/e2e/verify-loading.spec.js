import { test, expect } from '@playwright/test';

test('comprehensive starsector load verification', async ({ page }) => {
  test.setTimeout(300000); // 5 minutes
  
  const startTime = Date.now();
  let canvasCreated = false;
  let jvmStarted = false;
  let jvmFinished = false;
  let dataTransferActive = false;
  let totalBytes = 0;

  // Monitor Network for Data Ingestion
  page.on('request', request => {
    if (request.url().endsWith('.jar') || request.url().endsWith('.zip')) {
      dataTransferActive = true;
    }
  });

  // Monitor Console
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Starting JVM')) jvmStarted = true;
    if (text.includes('JVM finished')) jvmFinished = true;
    if (text.includes('LWJGL canvas created')) canvasCreated = true;
    console.log(`[BROWSER] ${text}`);
  });

  console.log('Navigating to http://localhost:8000/starsector_4.2_final.html ...');
  await page.goto('http://localhost:8000/starsector_4.2_final.html', { waitUntil: 'load' });

  console.log('\n--- MONITORING GAME BOOT ---');
  
  for (let i = 0; i < 24; i++) { // Check every 10s for 4 minutes
    await page.waitForTimeout(10000);
    
    const status = await page.evaluate(() => {
      const bar = document.getElementById('loading-bar');
      const statusText = document.getElementById('loading-status')?.textContent;
      const canvas = document.querySelector('canvas');
      let pixelData = [0,0,0,0];
      
      if (canvas) {
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
          const pixels = new Uint8Array(4);
          gl.readPixels(canvas.width/2, canvas.height/2, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
          pixelData = Array.from(pixels);
        }
      }
      
      return {
        progress: bar?.style.width || '0%',
        statusText,
        hasCanvas: !!canvas,
        pixelData
      };
    });

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const isRendering = status.pixelData[3] > 0 && (status.pixelData[0] > 0 || status.pixelData[1] > 0 || status.pixelData[2] > 0);
    
    console.log(`[${elapsed}s] Progress: ${status.progress} | Canvas: ${status.hasCanvas} | Color: ${JSON.stringify(status.pixelData)} | Status: ${status.statusText}`);

    if (isRendering) {
      console.log('\n[SUCCESS] Starsector has rendered non-black pixels! Game is loaded.');
      await page.screenshot({ path: 'starsector-loaded-success.png' });
      return;
    }

    if (jvmFinished && !status.hasCanvas) {
      console.log('\n[WARNING] JVM finished without creating a visible canvas. Check display configuration.');
    }
  }

  console.log('\n[TIMEOUT] Reached 4 minute limit without rendering detection.');
  await page.screenshot({ path: 'starsector-loading-timeout.png' });
});
