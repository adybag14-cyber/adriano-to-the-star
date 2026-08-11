import { test, expect } from '@playwright/test';

test('real-time instrumentation of starsector loading', async ({ page }) => {
  test.setTimeout(300000); // 5 minute diagnostic
  
  let totalBytesIngested = 0;
  let requestCount = 0;
  let lastLogTime = Date.now();
  const startTime = Date.now();

  // 1. Track Real-Time Network Ingestion
  page.on('request', request => {
    const headers = request.headers();
    if (headers['range']) {
      const match = headers['range'].match(/bytes=(\d+)-(\d+)/);
      if (match) {
        const bytes = parseInt(match[2]) - parseInt(match[1]) + 1;
        totalBytesIngested += bytes;
        requestCount++;
      }
    }
  });

  // 2. Capture Console with Heartbeat
  page.on('console', msg => {
    lastLogTime = Date.now();
    if (msg.text().includes('JVM') || msg.text().includes('Error')) {
      console.log(`[REAL-TIME][CORE] ${msg.text()}`);
    }
  });

  console.log('Navigating to http://localhost:8000/starsector_4.2_final.html ...');
  await page.goto('http://localhost:8000/starsector_4.2_final.html', { waitUntil: 'load' });

  console.log('\n--- REAL-TIME LOADING MONITOR ---');
  console.log('TIME | INGESTED | REQS | HEAP SIZE | STATUS');
  console.log('-------------------------------------------');

  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(10000); // Sample every 10s
    
    const metrics = await page.evaluate(() => {
      const mem = window.performance && window.performance.memory ? 
                  Math.round(window.performance.memory.usedJSHeapSize / 1024 / 1024) : 'N/A';
      const canvas = document.querySelector('canvas');
      const gl = canvas?.getContext('webgl');
      const pixels = new Uint8Array(4);
      if (gl) gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      return { mem, pixelAlpha: pixels[3] };
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    const ingestedMB = (totalBytesIngested / 1024 / 1024).toFixed(2);
    const idleSeconds = ((Date.now() - lastLogTime) / 1000).toFixed(0);
    
    let status = ingestedMB > 0 ? 'ACTIVE_READ' : 'INITIALIZING';
    if (idleSeconds > 30 && ingestedMB > 0) status = 'STALLED?';
    if (metrics.pixelAlpha > 0) status = 'RENDERING_CORE';

    console.log(`${elapsed.padStart(3)}s | ${ingestedMB.padStart(6)} MB | ${String(requestCount).padStart(4)} | ${String(metrics.mem).padStart(5)} MB | ${status}`);
    
    if (status === 'RENDERING_CORE') {
      console.log('\n[SUCCESS] Game engine has reached rendering state!');
      break;
    }
  }

  await page.screenshot({ path: 'realtime-peek-final.png' });
});
