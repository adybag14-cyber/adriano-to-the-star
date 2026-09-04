import { test, expect } from '@playwright/test';

const assets = ['three.min.js', 'OrbitControls-r128.js', 'planet-3d-viewer.js'];
const fixturePath = '/__database-lazy-loader-contract.html';

async function openCatalogue(page) {
  await page.goto('/database.html?q=Kepler-227', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.databaseInstance?.allData.length === 9564 && window.databaseVisualizationFeatures && window.databaseAdvancedFeatures);
  await expect(page.locator('#view-3d-btn')).toHaveCount(1);
  await expect(page.locator('#view-3d-btn')).toBeDisabled();
}

test('a delayed viewer has visible progress and closing it prevents a late modal', async ({ page }) => {
  let releaseViewer;
  const viewerReady = new Promise(resolve => { releaseViewer = resolve; });
  await page.route('**/planet-3d-viewer.js*', async route => { await viewerReady; await route.continue(); });
  try {
    await openCatalogue(page);
    const open = page.locator('.planet-card[data-record-id="K00752.02"]').getByRole('button', { name: 'View in 3D' });
    await open.click();
    const progress = page.locator('#database-3d-loading-dialog');
    await expect(progress).toBeVisible();
    await expect(progress).toContainText('Loading planet viewer');
    await progress.getByRole('button', { name: 'Close', exact: true }).click();
    releaseViewer();
    await page.waitForFunction(() => Boolean(window.Planet3DViewer));
    await expect(page.locator('#planet-3d-modal')).toHaveCount(0);
    await open.click();
    await expect(page.locator('#planet-3d-title')).toHaveText('Kepler-227 c');
    await expect(page.locator('#close-3d-btn')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('#planet-3d-modal')).toHaveCount(0);
    await expect(open).toBeFocused();
  } finally { releaseViewer(); }
});

test('a visible script error can be retried into a real viewer without reloading the page', async ({ page }) => {
  let requests = 0;
  await page.route('**/three.min.js*', route => ++requests === 1 ? route.abort('failed') : route.continue());
  await openCatalogue(page);
  const card = page.locator('.planet-card[data-record-id="K00752.01"]');
  await card.getByRole('button', { name: 'View in 3D' }).click();
  await expect(page.locator('#database-3d-loading-status')).toHaveAttribute('data-state', 'error');
  await expect(page.locator('#database-3d-loading-status')).toContainText('three.min.js');
  await page.getByRole('button', { name: 'Retry 3D viewer' }).click();
  await expect(page.locator('#planet-3d-title')).toHaveText('Kepler-227 b');
  expect(requests).toBe(2);
  await page.keyboard.press('Escape');
  await card.getByRole('button', { name: 'Compare', exact: true }).click();
  const selected = page.getByRole('button', { name: 'View selected planet in 3D' });
  await expect(selected).toBeEnabled();
  await selected.click();
  await expect(page.locator('#planet-3d-title')).toHaveText('Kepler-227 b');
  await page.keyboard.press('Escape');
  await expect(selected).toBeFocused();
});

async function openLoader(page) {
  await page.addInitScript(() => {
    window.lazyProgress = [];
    document.addEventListener('ita:database-3d-progress', event => window.lazyProgress.push(event.detail));
  });
  await page.route(`**${fixturePath}`, route => route.fulfill({
    contentType: 'text/html',
    body: '<!doctype html><html><head><title>Database loader contract</title></head><body><script src="/database-3d-loader.js?v=loader-contract"></script></body></html>'
  }));
  await page.goto(fixturePath);
}

async function beginLoad(page, concurrent = false) {
  await page.evaluate(concurrent => {
    window.lazyResult = null;
    const pending = window.ensureDatabase3D();
    if (concurrent) window.lazySamePromise = pending === window.ensureDatabase3D();
    pending.then(viewer => {
      window.lazyResult = { ok: true, registered: viewer === window.Planet3DViewer && Boolean(window.THREE?.OrbitControls) };
    }, error => {
      window.lazyResult = { ok: false, message: error.message };
    });
  }, concurrent);
}

async function loaded(page) {
  await expect.poll(() => page.evaluate(() => window.lazyResult)).toEqual({ ok: true, registered: true });
}

test('delayed dependencies share one load and preserve versioned asset order', async ({ page }) => {
  const requests = [];
  page.on('request', request => {
    const url = new URL(request.url());
    if (assets.includes(url.pathname.split('/').pop())) requests.push(url);
  });
  let releaseControls;
  const controlsReady = new Promise(resolve => { releaseControls = resolve; });
  await page.route('**/OrbitControls-r128.js*', async route => {
    await controlsReady;
    await route.continue();
  });
  try {
    await openLoader(page);
    await beginLoad(page, true);
    await expect.poll(() => requests.length).toBe(2);
    expect(await page.evaluate(() => ({ shared: window.lazySamePromise, result: window.lazyResult, viewer: Boolean(window.Planet3DViewer) })))
      .toEqual({ shared: true, result: null, viewer: false });
    releaseControls();
    await loaded(page);
    expect(requests.map(url => url.pathname.split('/').pop())).toEqual(assets);
    expect(requests.every(url => url.searchParams.getAll('v').join(',') === 'loader-contract')).toBe(true);
    expect(await page.evaluate(() => window.lazyProgress.map(({ asset, state }) => [asset, state])))
      .toEqual(assets.flatMap(asset => [[asset, 'loading'], [asset, 'loaded']]));
    await beginLoad(page);
    await loaded(page);
    expect(requests).toHaveLength(3);
  } finally {
    releaseControls();
  }
});

test('a network failure removes the spent script and a fresh request succeeds', async ({ page }) => {
  let requests = 0;
  await page.route('**/three.min.js*', route => ++requests === 1 ? route.abort('failed') : route.continue());
  await openLoader(page);
  await beginLoad(page);
  await expect.poll(() => page.evaluate(() => window.lazyResult?.message)).toContain('Unable to load three.min.js');
  await expect(page.locator('script[src*="three.min.js"]')).toHaveCount(0);
  await beginLoad(page);
  await loaded(page);
  expect(requests).toBe(2);
  await expect(page.locator('script[src*="three.min.js"]')).toHaveCount(1);
  expect(await page.evaluate(() => window.lazyProgress.filter(event => event.state === 'error'))).toHaveLength(1);
});

test('a script missing its API retries without reloading successful dependencies', async ({ page }) => {
  const requests = [];
  page.on('request', request => {
    const name = new URL(request.url()).pathname.split('/').pop();
    if (assets.includes(name)) requests.push(name);
  });
  let controlsRequests = 0;
  await page.route('**/OrbitControls-r128.js*', route => ++controlsRequests === 1
    ? route.fulfill({ contentType: 'text/javascript', body: 'void 0;' })
    : route.continue());
  await openLoader(page);
  await beginLoad(page);
  await expect.poll(() => page.evaluate(() => window.lazyResult?.message)).toContain('without initializing its expected browser API');
  await expect(page.locator('script[src*="OrbitControls-r128.js"]')).toHaveCount(0);
  await beginLoad(page);
  await loaded(page);
  expect(requests).toEqual(['three.min.js', 'OrbitControls-r128.js', 'OrbitControls-r128.js', 'planet-3d-viewer.js']);
});

test('the 15-second deadline releases a stalled attempt and permits retry', async ({ page }) => {
  let requests = 0;
  let releaseStalled;
  const stalledFinished = new Promise(resolve => { releaseStalled = resolve; });
  await page.route('**/three.min.js*', async route => {
    if (++requests === 1) {
      await stalledFinished;
      await route.abort('failed');
    } else {
      await route.continue();
    }
  });
  try {
    await openLoader(page);
    await page.clock.install();
    await beginLoad(page);
    await expect.poll(() => requests).toBe(1);
    await page.clock.fastForward(15_001);
    await expect.poll(() => page.evaluate(() => window.lazyResult?.message)).toContain('timed out after 15 seconds');
    await expect(page.locator('script[src*="three.min.js"]')).toHaveCount(0);
    await beginLoad(page);
    await expect.poll(() => requests).toBe(2);
    await loaded(page);
    expect(requests).toBe(2);
    releaseStalled();
    await expect(page.locator('script[src*="three.min.js"]')).toHaveCount(1);
    expect(await page.evaluate(() => window.lazyProgress.filter(event => event.state === 'error'))).toHaveLength(1);
  } finally {
    releaseStalled();
  }
});
