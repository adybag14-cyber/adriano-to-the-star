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

const nebulaPath = '/experimental/webgpu-galaxy/nebula-sim.html';

async function waitForNebulaFrames(page) {
  await page.evaluate(() => new Promise(resolve => {
    let frames = 0;
    const next = () => ++frames === 4 ? resolve() : requestAnimationFrame(next);
    requestAnimationFrame(next);
  }));
}

async function openNebula(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
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
  await page.goto(nebulaPath, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#nebula-canvas')).toHaveAttribute('data-renderer', /webgpu|canvas2d/);
  return errors;
}

async function verifyNebulaFallback(page, errors, { deviceLost = false } = {}) {
  const canvas = page.locator('#nebula-canvas');
  await expect(canvas).toHaveAttribute('data-renderer', 'canvas2d');
  await expect(page.locator('#gpu-load')).toHaveText('Canvas 2D');
  await expect(page.locator('#nebula-status')).toContainText('interactive Canvas 2D particle study is active');
  if (deviceLost) await expect(page.locator('#nebula-status')).toContainText('The WebGPU device was lost');
  else await expect(page.locator('#nebula-status')).toHaveText(/^(WebGPU is unavailable|No WebGPU adapter is available|The WebGPU device was lost)\./);
  expect(await canvas.evaluate(node => node.getContext('2d') === window.nebulaSimulation.context)).toBe(true);
  expect(await page.evaluate(() => window.nebulaSimulation.particles.length)).toBeGreaterThan(0);
  if (!(await page.evaluate(() => window.nebulaSimulation.paused))) {
    await page.getByRole('button', { name: 'Pause simulation' }).click();
  }
  await expect(page.getByRole('button', { name: 'Resume simulation' })).toHaveAttribute('aria-pressed', 'true');
  await waitForNebulaFrames(page);
  const pausedTime = await canvas.getAttribute('data-simulation-time');
  const pausedImage = await canvas.evaluate(node => node.toDataURL());
  await page.locator('#vorticity').focus();
  await page.keyboard.press('End');
  await waitForNebulaFrames(page);
  await expect(canvas).toHaveAttribute('data-simulation-time', pausedTime);
  expect(await canvas.evaluate(node => node.toDataURL())).toBe(pausedImage);
  await page.getByRole('button', { name: 'Resume simulation' }).click();
  await expect.poll(() => canvas.getAttribute('data-simulation-time')).not.toBe(pausedTime);
  await expect.poll(() => canvas.evaluate(node => node.toDataURL())).not.toBe(pausedImage);
  await waitForNebulaFrames(page);
  expect(errors).toEqual([]);
  test.info().annotations.push({ type: 'renderer-coverage', description: deviceLost
    ? 'Validated Canvas 2D recovery after device loss, including static pause and moving resume; no completed GPU-state proof.'
    : 'Validated Canvas 2D initialization, static pause and moving resume; no GPU-state proof.' });
}

async function readParticleState(page, destroyDuringReadback = false) {
  return page.evaluate(async destroyDuringReadback => {
    const simulation = window.nebulaSimulation;
    if (simulation.mode !== 'webgpu') return { mode: simulation.mode };
    const device = simulation.device;
    let output;
    try {
      const size = 32 * 64;
      output = device.createBuffer({ size, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
      const encoder = device.createCommandEncoder();
      encoder.copyBufferToBuffer(simulation.particleBuffers[simulation.step], 0, output, 0, size);
      device.queue.submit([encoder.finish()]);
      const mapped = output.mapAsync(window.GPUMapMode.READ);
      if (destroyDuringReadback) device.destroy();
      await mapped;
      return { mode: 'webgpu', state: Array.from(new Uint32Array(output.getMappedRange())) };
    } catch (error) {
      let timer;
      const loss = await Promise.race([
        device.lost.then(info => ({ reason: info.reason, message: info.message })),
        new Promise(resolve => { timer = setTimeout(() => resolve(null), 1000); })
      ]);
      clearTimeout(timer);
      // A readback error is recoverable here only when the real device confirms
      // loss. Healthy-device validation/mapping errors must still fail the test.
      if (!loss) throw error;
      return { mode: 'device-lost', loss, readbackError: error.name };
    } finally {
      if (output?.mapState === 'mapped') output.unmap();
      output?.destroy();
    }
  }, destroyDuringReadback);
}

test('WebGPU pause preserves particle state while controls change', async ({ page }) => {
  const errors = await openNebula(page);
  const canvas = page.locator('#nebula-canvas');
  if (await canvas.getAttribute('data-renderer') !== 'webgpu') {
    await verifyNebulaFallback(page, errors);
    return;
  }
  await expect(page.getByRole('button', { name: 'Resume simulation' })).toBeVisible();
  const pausedState = await readParticleState(page);
  if (pausedState.mode !== 'webgpu') {
    await verifyNebulaFallback(page, errors, { deviceLost: true });
    return;
  }
  await page.locator('#vorticity').focus();
  await page.keyboard.press('End');
  await waitForNebulaFrames(page);
  const changedControls = await readParticleState(page);
  if (changedControls.mode !== 'webgpu') {
    await verifyNebulaFallback(page, errors, { deviceLost: true });
    return;
  }
  expect(changedControls.state).toEqual(pausedState.state);
  await expect(canvas).toHaveAttribute('data-simulation-time', '0.000');
  await page.getByRole('button', { name: 'Resume simulation' }).click();
  await expect.poll(() => canvas.getAttribute('data-simulation-time')).not.toBe('0.000');
  const resumedState = await readParticleState(page);
  if (resumedState.mode !== 'webgpu' || await canvas.getAttribute('data-renderer') !== 'webgpu') {
    await verifyNebulaFallback(page, errors, { deviceLost: true });
    return;
  }
  expect(resumedState.state).not.toEqual(pausedState.state);
  expect(errors).toEqual([]);
  test.info().annotations.push({ type: 'renderer-coverage', description: 'Validated bit-exact WebGPU pause across a control change and changed GPU state after resume.' });
});

test('WebGPU readback interrupted by device destruction recovers to a working Canvas study', async ({ page }) => {
  const errors = await openNebula(page);
  const canvas = page.locator('#nebula-canvas');
  if (await canvas.getAttribute('data-renderer') !== 'webgpu') {
    await verifyNebulaFallback(page, errors);
    return;
  }
  const result = await readParticleState(page, true);
  if (result.mode === 'device-lost') {
    test.info().annotations.push({ type: 'device-loss-trigger', description: result.loss.reason === 'destroyed'
      ? 'Destroyed the real WebGPU device with mapAsync pending.'
      : `The real device reported ${result.loss.reason} loss before the explicit destruction completed.` });
  } else {
    // Hardware loss can precede the explicit destroy call on a shared runner.
    expect(result.mode).toBe('canvas2d');
  }
  await verifyNebulaFallback(page, errors, { deviceLost: true });
});

test('WebGPU absence initializes an interactive Canvas fallback without skipping', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'gpu', { value: undefined, configurable: true }));
  const errors = await openNebula(page);
  await expect(page.locator('#nebula-status')).toContainText('WebGPU is unavailable');
  await verifyNebulaFallback(page, errors);
});
