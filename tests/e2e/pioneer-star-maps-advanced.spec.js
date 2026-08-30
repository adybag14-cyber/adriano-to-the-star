import { expect, test } from '@playwright/test';

const consoleFailures = (page) => {
  const failures = [];
  page.on('pageerror', (error) => failures.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') failures.push(`console: ${message.text()}`);
  });
  return failures;
};

test.describe('Advanced Star Maps', () => {
  test('renders the GPU-assisted educational console with complete keyboard and tutorial flows', async ({ page }) => {
    const failures = consoleFailures(page);
    await page.goto('/star-maps.html', { waitUntil: 'domcontentloaded' });
    const container = page.locator('#star-map-container');
    await expect(container).toHaveAttribute('data-star-map-ready', 'true');
    await expect(container).toHaveAttribute('data-cosmos-renderer', /^(webgl|canvas-fallback)$/);
    await expect(page.locator('#star-map')).toHaveAttribute('role', 'application');
    await expect(page.locator('#stellar-map-object-list [role="option"]')).toHaveCount(17);

    await page.locator('#stellar-map-tutorial').click();
    const tutorial = page.locator('#stellar-map-tutorial-dialog');
    await expect(tutorial).toBeVisible();
    await expect(page.locator('#stellar-map-tutorial-count')).toHaveText('1 / 5');
    for (let step = 2; step <= 5; step += 1) {
      await page.locator('#stellar-map-tutorial-next').click();
      await expect(page.locator('#stellar-map-tutorial-count')).toHaveText(`${step} / 5`);
    }
    await page.locator('#stellar-map-tutorial-next').click();
    await expect(tutorial).not.toBeVisible();
    await expect(page.locator('#star-map')).toBeFocused();

    await page.locator('#star-map').press('v');
    await expect(page.locator('#stellar-map-projection')).toHaveValue('xz');
    await page.locator('#star-map').press('n');
    await expect(container).toHaveAttribute('data-star-map-selected', 'proxima');
    await expect(page.locator('#stellar-map-parallax')).toContainText('mas');
    await expect(page.locator('#stellar-map-derivation')).toContainText('m−M');
    await page.locator('#star-map').press('l');
    await expect(page.locator('#stellar-map-routes')).toHaveAttribute('aria-pressed', 'false');

    await page.locator('#stellar-map-search').fill('TRAPPIST-1');
    await expect(page.locator('#stellar-map-name')).toHaveText('TRAPPIST-1');
    await expect(page.locator('#stellar-map-temperature')).toContainText('2,566');
    await expect(page.locator('#stellar-map-education')).toHaveAttribute('href', /education\.html\?target=TRAPPIST-1/i);
    await expect(page.locator('.stellar-map-source-links a')).toHaveCount(4);

    expect(failures).toEqual([]);
  });

  test('keeps the map console visible and operable on a phone viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/star-maps.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#star-map-container')).toHaveAttribute('data-star-map-ready', 'true');
    const geometry = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
      canvas: document.querySelector('#star-map')?.getBoundingClientRect().toJSON(),
      detail: document.querySelector('.stellar-map-detail')?.getBoundingClientRect().toJSON()
    }));
    expect(geometry.scroll).toBeLessThanOrEqual(geometry.viewport + 1);
    expect(geometry.canvas?.width).toBeGreaterThan(300);
    expect(geometry.detail?.width).toBeLessThanOrEqual(390);
    await page.locator('#stellar-map-filter').selectOption('kepler');
    await expect(page.locator('#stellar-map-object-list [role="option"]')).toHaveCount(2);
  });
});

test.describe('Exoplanet Pioneer flight-safety upgrades', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('ep_tutorial_complete_v1', '1'));
    await page.goto('/exoplanet-pioneer.html', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForFunction(() => window.game && typeof window.game.ensureCombatScene === 'function', null, { timeout: 60_000 });
  });

  test('provides a replayable seven-step tutorial and complete resize ARIA values', async ({ page }) => {
    await expect(page.locator('main#game-container')).toHaveAttribute('aria-label', /simulation/i);
    await expect(page.locator('#game-container canvas')).toHaveAttribute('role', 'application');
    await page.locator('#ep-btn-tutorial').click();
    await expect(page.locator('#ep-tutorial')).toBeVisible();
    await expect(page.locator('#ep-tutorial-progress')).toHaveText('1/7');
    await expect(page.locator('#ep-tutorial-back')).toBeDisabled();
    await page.locator('#ep-tutorial-next').click();
    await expect(page.locator('#ep-tutorial-progress')).toHaveText('2/7');
    await page.locator('#ep-tutorial-back').click();
    await expect(page.locator('#ep-tutorial-progress')).toHaveText('1/7');
    const grip = page.locator('#ep-tutorial > .ep-window-resize-handle');
    await expect(grip).toHaveAttribute('aria-valuemin', /\d+/);
    await expect(grip).toHaveAttribute('aria-valuemax', /\d+/);
    await expect(grip).toHaveAttribute('aria-valuenow', /\d+/);
    await expect(grip).toHaveAttribute('aria-valuetext', /pixels/);
  });

  test('guards dangerous simulation acceleration and still permits an explicit override', async ({ page }) => {
    const result = await page.evaluate(() => {
      window.game.colonists = Array.from({ length: 5 }, (_, id) => ({ id }));
      window.game.resources.food = 100;
      window.game.resources.oxygen = 100;
      window.game.setTimeSpeed(4);
      const guarded = window.game.timeScale;
      window.game.setTimeSpeed(4);
      const overridden = window.game.timeScale;
      window.game.resources.food = 4;
      window.game.evaluateSimulationSafety();
      const slowed = window.game.timeScale;
      window.game.resources.food = 0;
      window.game.evaluateSimulationSafety();
      return { guarded, overridden, slowed, paused: window.game.timeScale };
    });
    expect(result).toEqual({ guarded: 2, overridden: 10, slowed: 2, paused: 0 });
    await expect(page.locator('#ep-time-controls .ep-time-btn').first()).toHaveAttribute('aria-pressed', 'true');
  });

  test('launches an interceptable battle and requires a completed homing-missile lock', async ({ page }) => {
    const failures = consoleFailures(page);
    await page.evaluate(async () => {
      document.querySelector('#ep-tutorial')?.setAttribute('hidden', '');
      await window.game.launchFighters([]);
    });
    await expect(page.locator('#combat-hud')).toBeVisible({ timeout: 30_000 });
    await page.waitForFunction(() => window.game.combatScene && !window.game.combatScene._launchSequence, null, { timeout: 10_000 });

    const balance = await page.evaluate(() => ({
      playerMax: window.game.combatScene.player.maxSpeed,
      enemyMax: Math.max(...window.game.combatScene.enemies.map((enemy) => enemy.speed)),
      enemyCount: window.game.combatScene.enemies.length
    }));
    expect(balance.enemyCount).toBeGreaterThan(0);
    expect(balance.playerMax).toBeGreaterThan(balance.enemyMax * 2);

    await page.evaluate(() => window.game.combatScene.toggleTargetLock());
    await page.waitForFunction(() => window.game.combatScene.isTargetLockReady(), null, { timeout: 6_000 });
    await expect(page.locator('#hud-lock-status')).toHaveText('MISSILE LOCK CONFIRMED');
    await expect(page.locator('#hud-lock-bar')).toHaveCSS('width', /[1-9]\d*(?:\.\d+)?px/);

    const missile = await page.evaluate(() => {
      const scene = window.game.combatScene;
      window.game.isPaused = true;
      scene.player.currentWeapon = 'missile';
      scene.player.energy = 100;
      scene.player.lastShotTime = 0;
      scene.player.shoot();
      const projectile = scene.projectileSystem.projectiles.find((item) => item.active && item.type === 'missile');
      const beforeDirection = projectile?.velocity.clone().normalize();
      if (projectile?.lockTarget?.mesh) projectile.lockTarget.mesh.position.x += 80;
      if (projectile) scene.projectileSystem.update(0.18);
      const afterDirection = projectile?.velocity.clone().normalize();
      window.game.isPaused = false;
      return projectile && {
        life: projectile.life,
        turnRate: projectile.turnRate,
        maxSpeed: projectile.maxSpeed,
        hasTarget: projectile.lockTarget === scene.targetLock,
        hasPlume: !!projectile.mesh.getObjectByName?.('missile-plume'),
        homingAdjusted: beforeDirection && afterDirection ? beforeDirection.distanceTo(afterDirection) > 0.001 : false
      };
    });
    expect(missile).toMatchObject({ hasTarget: true, hasPlume: true, homingAdjusted: true });
    expect(missile.life).toBeGreaterThan(5);
    expect(missile.turnRate).toBeGreaterThan(4);
    expect(missile.maxSpeed).toBeGreaterThan(100);
    await expect(page.locator('#hud-combat-flash')).toHaveClass(/missile-launch/);
    expect(failures).toEqual([]);
    await page.evaluate(() => window.game.retreatFromCombat());
  });

  test('exposes usable touch combat controls without phone-width overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(async () => window.game.launchFighters([]));
    await expect(page.locator('#combat-touch-controls')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('#combat-touch-controls button')).toHaveCount(8);
    await expect(page.locator('#ep-touch-controls')).toBeHidden();
    const layout = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
      controls: document.querySelector('#combat-touch-controls')?.getBoundingClientRect().toJSON(),
      overlaps: (() => {
        const ids = ['hud-status', 'ep-btn-retreat', 'hud-lock', 'hud-target', 'hud-speed', 'combat-touch-controls'];
        const nodes = ids.map((id) => [id, document.getElementById(id)]).filter(([, node]) => node && getComputedStyle(node).display !== 'none');
        const collisions = [];
        for (let i = 0; i < nodes.length; i += 1) {
          for (let j = i + 1; j < nodes.length; j += 1) {
            const a = nodes[i][1].getBoundingClientRect();
            const b = nodes[j][1].getBoundingClientRect();
            if (Math.min(a.right, b.right) > Math.max(a.left, b.left) && Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top)) collisions.push(`${nodes[i][0]}:${nodes[j][0]}`);
          }
        }
        return collisions;
      })()
    }));
    expect(layout.scroll).toBeLessThanOrEqual(layout.viewport + 1);
    expect(layout.controls?.left).toBeGreaterThanOrEqual(0);
    expect(layout.controls?.right).toBeLessThanOrEqual(390);
    expect(layout.overlaps).toEqual([]);
    await page.locator('[data-combat-action="weapon"]').click();
    await expect(page.locator('[data-combat-action="weapon"]')).toHaveText('MSL');
    await page.evaluate(() => window.game.retreatFromCombat());
  });
});
