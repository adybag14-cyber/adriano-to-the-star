import { test, expect } from '@playwright/test';

test('diagnose starsector stall', async ({ page }) => {
  test.setTimeout(180000); // 3 minutes
  const failedRequests = [];
  const allRequests = [];

  // Monitor network activity
  page.on('request', request => allRequests.push(request.url()));
  page.on('requestfailed', request => {
    console.log(`[NET ERROR] Failed: ${request.url()} - ${request.failure()?.errorText}`);
    failedRequests.push({ url: request.url(), error: request.failure()?.errorText });
  });

  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`[NET ERROR] HTTP ${response.status()}: ${response.url()}`);
      failedRequests.push({ url: response.url(), status: response.status() });
    }
  });

  console.log('Navigating to http://localhost:8000/starsector_4.2_final.html...');
  await page.goto('http://localhost:8000/starsector_4.2_final.html', { waitUntil: 'load' });

  console.log('Monitoring for 120 seconds to catch "Late-Loading" stalls...');
  
  // Every 10 seconds, check if the canvas is still black
  for (let i = 0; i < 12; i++) {
    await page.waitForTimeout(10000);
    const canvasColor = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return 'NO_CANVAS';
      const gl = canvas.getContext('webgl');
      if (!gl) return 'NO_GL';
      const pixels = new Uint8Array(4);
      gl.readPixels(canvas.width/2, canvas.height/2, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      return Array.from(pixels);
    });
    console.log(`[T+${(i+1)*10}s] Canvas Sample: ${JSON.stringify(canvasColor)}`);
  }

  // Final check for missing files
  console.log('\n--- DIAGNOSTIC SUMMARY ---');
  const missingFiles = failedRequests.filter(r => !r.url.includes('/log'));
  if (missingFiles.length > 0) {
    console.log(`Potential Missing Resources (404s): ${missingFiles.length}`);
    missingFiles.forEach(f => console.log(` - ${f.url}`));
  } else {
    console.log('No 404s detected for game assets.');
  }

  await page.screenshot({ path: 'stall-diagnosis.png' });
});
