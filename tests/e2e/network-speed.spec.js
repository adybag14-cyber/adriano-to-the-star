import { test, expect } from '@playwright/test';

test('measure download speed of large assets', async ({ page }) => {
  test.setTimeout(120000);
  const downloads = [];

  // Monitor all responses
  page.on('response', response => {
    const url = response.url();
    if (url.endsWith('.jar')) {
      const timing = response.timing();
      const duration = timing.responseEnd - timing.requestStart; // in ms
      
      // Get content length from headers
      const sizeHeader = response.headers()['content-length'];
      const sizeBytes = sizeHeader ? parseInt(sizeHeader, 10) : 0;

      if (sizeBytes > 0) {
        const speedMbps = (sizeBytes * 8 / (duration / 1000)) / 1000000;
        downloads.push({
          file: url.split('/').pop(),
          sizeMB: (sizeBytes / 1024 / 1024).toFixed(2),
          durationSec: (duration / 1000).toFixed(2),
          speedMbps: speedMbps.toFixed(2)
        });
      }
    }
  });

  console.log('Navigating to measure transfer speeds...');
  await page.goto('http://localhost:8000/starsector_4.2_final.html', { waitUntil: 'load' });
  
  // Wait a bit for the prefetch to finish
  console.log('Waiting for downloads to complete...');
  await page.waitForTimeout(60000);

  console.log('\n--- NETWORK PERFORMANCE REPORT ---');
  downloads.forEach(d => {
    console.log(`FILE: ${d.file.padEnd(30)} | SIZE: ${d.sizeMB.padStart(6)} MB | TIME: ${d.durationSec.padStart(6)} s | SPEED: ${d.speedMbps.padStart(8)} Mbps`);
  });
  
  const totalSize = downloads.reduce((acc, d) => acc + parseFloat(d.sizeMB), 0);
  console.log(`\nTotal Downloaded: ${downloads.length} files (${totalSize.toFixed(2)} MB)`);
});