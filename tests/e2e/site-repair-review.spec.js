import { test, expect } from '@playwright/test';

// The full Chromium headless channel exposes the adapter used by the GPU test.
test.use({ channel: 'chromium', launchOptions: { args: ['--enable-unsafe-webgpu'] } });

test('legacy favorites can be removed without losing unknown saved references', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('planet_favorites', JSON.stringify([
      10797460, '10797460', 'K00752.01', 'unresolved-favorite'
    ]));
  });
  await page.goto('/database.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.databaseInstance?.allData.length === 9564 && window.databaseAdvancedFeatures);
  await page.locator('#planet-search').fill('Kepler-227');
  const card = page.locator('.planet-card[data-record-id="K00752.01"]');
  await card.getByRole('button', { name: 'Saved', exact: true }).click();
  await expect(card.getByRole('button', { name: 'Save', exact: true })).toHaveAttribute('aria-pressed', 'false');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('planet_favorites')))).toEqual(['unresolved-favorite']);
  await card.getByRole('button', { name: 'Save', exact: true }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('planet_favorites')))).toEqual(['unresolved-favorite', 'K00752.01']);
  await page.evaluate(() => window.databaseAdvancedFeatures.toggleFavorite(10797460));
  await expect(card.getByRole('button', { name: 'Save', exact: true })).toHaveAttribute('aria-pressed', 'false');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('planet_favorites')))).toEqual(['unresolved-favorite']);
});

test('shared comparison restores after a delayed catalogue and does not reopen', async ({ page }) => {
  let releaseCatalogue;
  const catalogueReady = new Promise(resolve => { releaseCatalogue = resolve; });
  await page.route('**/data/exoplanets.jsonl', async route => {
    await catalogueReady;
    await route.continue();
  });
  try {
    await page.goto('/database.html?comparison=K00752.01%2CK00752.02', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.databaseAdvancedFeatures && window.databaseInstance?.allData.length === 0);
    await expect(page.locator('#comparison-modal')).toHaveCount(0);
    releaseCatalogue();
    await expect(page.locator('#comparison-modal')).toContainText('Kepler-227 b');
    await expect(page.locator('#comparison-modal')).toContainText('Kepler-227 c');
    expect(await page.evaluate(() => window.databaseAdvancedFeatures.comparisonList)).toEqual(['K00752.01', 'K00752.02']);
    await page.locator('#comparison-modal').getByRole('button', { name: 'Close', exact: true }).click();
    await page.evaluate(() => document.dispatchEvent(new CustomEvent('ita:database-ready')));
    await expect(page.locator('#comparison-modal')).toHaveCount(0);
  } finally {
    releaseCatalogue();
  }
});

test('WebGPU pause preserves particle state while controls change', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    if (!window.GPUDevice) return;
    const createBuffer = window.GPUDevice.prototype.createBuffer;
    window.GPUDevice.prototype.createBuffer = function (descriptor) {
      // Permit test-only readback of the particle state without changing the simulation.
      const options = descriptor.usage & GPUBufferUsage.STORAGE
        ? { ...descriptor, usage: descriptor.usage | GPUBufferUsage.COPY_SRC }
        : descriptor;
      return createBuffer.call(this, options);
    };
  });
  await page.goto('/experimental/webgpu-galaxy/nebula-sim.html', { waitUntil: 'domcontentloaded' });
  const canvas = page.locator('#nebula-canvas');
  await expect(canvas).toHaveAttribute('data-renderer', /webgpu|canvas2d/);
  test.skip(await canvas.getAttribute('data-renderer') !== 'webgpu', 'This browser has no WebGPU adapter; Canvas fallback is covered separately.');
  await expect(page.getByRole('button', { name: 'Resume simulation' })).toBeVisible();
  const readParticleState = () => page.evaluate(async () => {
    const simulation = window.nebulaSimulation;
    const size = 32 * 64;
    const output = simulation.device.createBuffer({ size, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
    const encoder = simulation.device.createCommandEncoder();
    encoder.copyBufferToBuffer(simulation.particleBuffers[simulation.step], 0, output, 0, size);
    simulation.device.queue.submit([encoder.finish()]);
    await output.mapAsync(window.GPUMapMode.READ);
    const state = Array.from(new Uint32Array(output.getMappedRange()));
    output.unmap();
    output.destroy();
    return state;
  });
  const pausedState = await readParticleState();
  await page.locator('#vorticity').focus();
  await page.keyboard.press('End');
  await page.evaluate(() => new Promise(resolve => {
    let frames = 0;
    const next = () => ++frames === 4 ? resolve() : requestAnimationFrame(next);
    requestAnimationFrame(next);
  }));
  expect(await readParticleState()).toEqual(pausedState);
  await expect(canvas).toHaveAttribute('data-simulation-time', '0.000');
  await page.getByRole('button', { name: 'Resume simulation' }).click();
  await expect.poll(() => canvas.getAttribute('data-simulation-time')).not.toBe('0.000');
  expect(await readParticleState()).not.toEqual(pausedState);
});
