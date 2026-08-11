import { test, expect } from '@playwright/test';

test('verify real loader game boot', async ({ page }) => {
  test.setTimeout(300000); // 5 minutes
  
  const startTime = Date.now();
  let jvmStarted = false;
  let jvmEnded = false;

  page.on('console', msg => {
    const t = ((Date.now() - startTime) / 1000).toFixed(1);
    const text = msg.text();
    console.log(`[${t}s][BROWSER] ${text}`);
    if (text.includes('Starting CombatMain')) jvmStarted = true;
    if (text.includes('JVM process finished')) jvmEnded = true;
  });

  console.log('Navigating to Optimized Starsector...');
  await page.goto('http://localhost:8000/starsector_4.2_final.html', { waitUntil: 'load' });

  console.log('\n--- MONITORING BOOT SEQUENCE ---');
  
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(10000);
    
    const view = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      let color = [0,0,0,0];
      if (canvas) {
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
          const p = new Uint8Array(4);
          gl.readPixels(canvas.width/2, canvas.height/2, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, p);
          color = Array.from(p);
        }
      }
      return { 
        hasCanvas: !!canvas, 
        color, 
        status: document.getElementById('loading-status')?.textContent 
      };
    });

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const hasGraphics = view.color[3] > 0 && (view.color[0] > 0 || view.color[1] > 0 || view.color[2] > 0);
    const state = hasGraphics ? 'RENDER_DETECTED' : (view.hasCanvas ? (view.color[3] > 0 ? 'BLACK_OPAQUE' : 'INITIAL_CANVAS') : 'WAITING_FOR_JVM');

    console.log(`[${elapsed}s] State: ${state.padEnd(15)} | Color: ${JSON.stringify(view.color)} | UI: ${view.status}`);

    if (hasGraphics) {
      console.log('\n[SUCCESS] Game is rendering graphics!');
      await page.screenshot({ path: 'game-success.png' });
      return;
    }

    if (jvmEnded) {
      console.log('\n[FAIL] JVM exited prematurely.');
      break;
    }
  }

  await page.screenshot({ path: 'game-boot-final.png' });
  console.log('Final screenshot captured.');
});
