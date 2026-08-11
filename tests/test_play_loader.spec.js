import { test, expect } from '@playwright/test';
import fs from 'fs';

test('capture logs and screenshot of play.html', async ({ page }) => {
  test.setTimeout(120000); // Increase to 2 minutes

  const logs = [];
  const network = [];
  
  page.on('console', msg => {
    const text = msg.text();
    logs.push(`[${msg.type()}] ${text}`);
    console.log(`[BROWSER] ${text}`);
  });

  page.on('pageerror', err => {
    const text = err.toString();
    logs.push(`[ERROR] ${text}`);
    console.error(`[BROWSER ERROR] ${text}`);
  });

  // Track Network
  page.on('request', request => {
    if (request.url().endsWith('.jar') || request.url().endsWith('.js') || request.url().endsWith('.wasm')) {
        network.push(`[REQ] ${request.method()} ${request.url()}`);
    }
  });

  page.on('response', response => {
    if (response.url().endsWith('.jar') || response.url().endsWith('.js') || response.url().endsWith('.wasm')) {
        network.push(`[RES] ${response.status()} ${response.url()}`);
        if (response.status() >= 400) {
            console.error(`[NET ERROR] ${response.status()} ${response.url()}`);
        }
    }
  });

  try {
    console.log('Navigating...');
    await page.goto('http://localhost:8000/play.html', { waitUntil: 'load' });

    console.log('Waiting for initialization...');
    await page.waitForTimeout(45000); // Wait longer

    console.log('Taking screenshot...');
    await page.screenshot({ path: 'play_loader_result.png', fullPage: true });

    console.log('Saving results...');
    fs.writeFileSync('play_browser_logs.txt', logs.join('\n'));
    fs.writeFileSync('play_network_logs.txt', network.join('\n'));
    
    expect(await page.title()).toContain('Starsector');

  } catch (error) {
    console.error('Test failed:', error);
    fs.writeFileSync('play_browser_logs.txt', logs.join('\n'));
    fs.writeFileSync('play_network_logs.txt', network.join('\n'));
    throw error;
  }
});
