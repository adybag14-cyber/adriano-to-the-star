import { test, expect } from '@playwright/test';
test.use({ serviceWorkers: 'block' });

// Contract tests isolate download/retry/cancel/disposal. They do not certify
// model quality or real inference; the separate Chrome run uses actual weights.
const runtime = `export class WebGPUUnavailableError extends Error {};
export async function createEngine(opts) {
  await opts.fetchJson(opts.manifestUrl);
  await opts.fetchArrayBuffer(opts.auxUrl);
  const reader = (await opts.fetchStream(opts.dataUrl)).getReader();
  while (!(await reader.read()).done) {}
  window.__bonsaiEngineCreated = true;
  return { capabilities: { adapter: {vendor:'test-adapter'} }, dispose(){window.__bonsaiDisposed = (window.__bonsaiDisposed || 0) + 1;} };
}`;
const chat = `export async function createChat(engine,opts) {
  await opts.fetchJson(opts.tokenizerJsonUrl); await opts.fetchJson(opts.tokenizerConfigUrl);
  return { send: async()=>({text:'contract reply',finishReason:'stop',tokensPerSecond:1}) };
}`;

async function fixture(page, intercept) {
  await page.addInitScript(() => Object.defineProperty(navigator, 'gpu', {value:{},configurable:true}));
  await page.route('**/vendor/bitgpu/index.js*', route => route.fulfill({ contentType:'application/javascript',body:runtime }));
  await page.route('**/vendor/bitgpu/chat.js*', route => route.fulfill({ contentType:'application/javascript',body:chat }));
  await page.route('https://cdn.jsdelivr.net/gh/stfurkan/bitgpu@v0.19.1/models/**', route => route.fulfill({contentType:'application/json',body:'{}'}));
  await page.route('https://huggingface.co/**', intercept);
  await page.goto('/stellar-ai.html', { waitUntil:'domcontentloaded' });
}

test('Bonsai retries transient weight fetch failures and reaches ready state', async ({page}) => {
  let attempts = 0;
  await fixture(page, route => {
    if (route.request().url().endsWith('.gguf') && ++attempts < 3) return route.abort('connectionreset');
    return route.fulfill({contentType:'application/json',body:'{}'});
  });
  await page.locator('#bonsai-load').click();
  await expect.poll(()=>page.evaluate(()=>window.stellarBonsai.isReady()),{timeout:10000}).toBe(true);
  await expect(page.locator('#bonsai-status')).toHaveAttribute('data-state','ready',{timeout:10000});
  expect(attempts).toBe(3);
  expect(await page.evaluate(()=>window.stellarBonsai.isReady())).toBe(true);
  expect(await page.evaluate(()=>window.stellarBonsai.lastFailure())).toBeNull();
  await expect(page.locator('#bonsai-load')).toBeEnabled();
});

test('Bonsai cancel aborts retry backoff without publishing a late ready model', async ({page}) => {
  let attempts = 0;
  await fixture(page, route => { attempts += 1; return route.abort('connectionreset'); });
  await page.locator('#bonsai-load').click();
  await expect.poll(()=>attempts).toBeGreaterThan(0);
  await page.locator('#bonsai-cancel').click();
  await expect(page.locator('#bonsai-status')).toContainText('cancelled');
  const cancelledAttempts = attempts;
  await page.waitForTimeout(1400);
  expect(attempts).toBe(cancelledAttempts);
  expect(await page.evaluate(()=>window.stellarBonsai.isReady())).toBe(false);
  await expect(page.locator('#bonsai-load')).toBeEnabled();
  await expect(page.locator('#bonsai-cancel')).toBeDisabled();
});

test('Bonsai tokenizer failure identifies source and disposes the allocated engine', async ({page}) => {
  await fixture(page, route => route.request().url().includes('tokenizer')
    ? route.fulfill({status:503,body:'temporarily unavailable'})
    : route.fulfill({contentType:'application/octet-stream',body:'weights'}));
  await page.locator('#bonsai-load').click();
  await expect(page.locator('#bonsai-status')).toContainText('tokenizer.json from huggingface.co',{timeout:10000});
  await expect(page.locator('#bonsai-status')).toContainText('HTTP 503');
  expect(await page.evaluate(()=>window.__bonsaiDisposed)).toBe(1);
  expect(await page.evaluate(()=>window.stellarBonsai.isReady())).toBe(false);
  expect(await page.evaluate(()=>window.stellarBonsai.lastFailure().attempts)).toBe(3);
  await page.locator('#bonsai-remove').click();
  await expect(page.locator('#bonsai-status')).toContainText('removed');
  expect(await page.evaluate(async()=> (await caches.open('ita-bitgpu-models-v0.19.1').then(cache=>cache.keys())).length)).toBe(0);
});
