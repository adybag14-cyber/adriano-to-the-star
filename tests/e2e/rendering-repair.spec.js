import { test, expect } from '@playwright/test';

async function withoutGpu(page) {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return /webgl/.test(type) ? null : original.call(this, type, ...args);
    };
    Object.defineProperty(navigator, 'gpu', { configurable: true, value: { requestAdapter: async () => null } });
  });
}

test('Earth retains real 2K/5.4K textures, clouds and planet switching without a GPU', async ({ page }, info) => {
  await withoutGpu(page);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/education.html');
  const viewer = page.locator('#viewer-container');
  await expect(viewer).toHaveAttribute('data-renderer', 'cpu-textured');
  await expect(viewer).toHaveAttribute('data-surface-ready', 'true');
  await expect(viewer).toHaveAttribute('data-surface-width', '2048');
  await expect(viewer).toHaveAttribute('data-clouds-ready', 'true');
  await page.getByRole('checkbox', { name: 'Use enhanced 5.4K planetary surface detail' }).check();
  await expect(viewer).toHaveAttribute('data-surface-width', '5400');
  await page.screenshot({ path: info.outputPath('earth-native-cpu-5400.png') });
  await page.getByRole('button', { name: 'Mars', exact: true }).click();
  await expect(page.locator('#planet-name')).toHaveText('MARS');
  await expect(viewer).toHaveAttribute('data-surface-ready', 'true');
  await expect(viewer).toHaveAttribute('data-clouds-ready', 'false');
  await page.getByRole('button', { name: 'Earth (High-Res)' }).click();
  await expect(viewer).toHaveAttribute('data-clouds-ready', 'true');
  expect(errors).toEqual([]);
});

test('galaxy works without an adapter, preserves particle count and exposes working controls', async ({ page }, info) => {
  await withoutGpu(page);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/experimental/webgpu-galaxy/galaxy-sim.html');
  await expect(page.locator('#gpu-status')).toHaveText('CPU ONLINE');
  await expect(page.locator('#particle-count')).toHaveText('50,000');
  await page.getByRole('button', { name: 'Pause simulation' }).click();
  await expect(page.getByRole('button', { name: 'Resume simulation' })).toHaveAttribute('aria-pressed', 'true');
  const paused = await page.evaluate(() => window.galaxySim.params.time);
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => window.galaxySim.params.time)).toBe(paused);
  await page.getByRole('slider', { name: 'Star Count', exact: true }).press('ArrowRight');
  await page.getByRole('slider', { name: 'Gravity Well Strength' }).press('ArrowRight');
  await page.getByRole('slider', { name: 'Time Dilation' }).press('ArrowRight');
  await page.getByRole('button', { name: 'Resume simulation' }).click();
  await expect(page.locator('#particle-count')).toHaveText('60,000');
  await expect(page.locator('#sim-speed')).toHaveText('1.1x');
  await expect(page.locator('#gravity-label')).toHaveText('1.1');
  await page.waitForFunction(time => window.galaxySim.params.time > time, paused);
  await page.screenshot({ path: info.outputPath('galaxy-cpu-active.png') });
  expect(errors).toEqual([]);
});

test('usable WebGPU adapters retain the preferred GPU renderer', async ({ page }) => {
  await page.goto('/experimental/webgpu-galaxy/galaxy-sim.html');
  const hasAdapter = await page.evaluate(async () => Boolean(navigator.gpu && await navigator.gpu.requestAdapter()));
  await expect(page.locator('#galaxy-canvas')).toHaveAttribute('data-renderer', hasAdapter ? 'webgpu' : 'cpu-worker');
  await expect(page.locator('#particle-count')).toHaveText('50,000');
  await expect(page.locator('#error-overlay')).toBeHidden();
});

test('Projects does not advertise an unusable GPU and its primary button has dark readable styling', async ({ page }) => {
  await withoutGpu(page);
  await page.goto('/projects.html');
  await expect(page.locator('[data-capability="webgpu"] b')).toHaveText('Unavailable');
  const button = page.getByRole('link', { name: 'Open project catalog', exact: true });
  const styles = await button.evaluate(node => {
    const style = getComputedStyle(node);
    return { color: style.color, background: style.backgroundImage };
  });
  expect(styles.color).toBe('rgb(234, 252, 255)');
  expect(styles.background).toContain('rgb(18, 49, 60)');
  expect(styles.background).toContain('rgb(37, 38, 77)');
  await button.click();
  await expect(page.locator('#project-search')).toBeVisible();
});

test('home preserves star density and resolution while pausing only offscreen decorative work', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/index.html');
  const field = page.locator('#ita-cosmic-field');
  await expect(field).toHaveAttribute('data-star-count', '196');
  await expect(field).toHaveAttribute('width', '1920');
  await expect(field).toHaveAttribute('height', '1080');
  await expect(page.locator('.passage-section')).toHaveAttribute('data-motion-offscreen', '');
  await page.locator('.passage-section').scrollIntoViewIfNeeded();
  await expect(page.locator('.passage-section')).not.toHaveAttribute('data-motion-offscreen', '');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(field).toHaveAttribute('data-render-mode', 'static-starfield');
});
