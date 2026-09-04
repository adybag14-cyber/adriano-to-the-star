import { test, expect } from '@playwright/test';

test.describe('catalogue action final effects', () => {
  test('every atmospheric world is reachable through pagination and search', async ({ page }) => {
    await page.goto('/database.html', { waitUntil: 'domcontentloaded' });
    const cards = page.locator('.atmosphere-model-card');
    await expect(cards).toHaveCount(60, { timeout: 20_000 });
    const names = new Set();
    let pages = 0;
    do {
      for (const name of await cards.locator('h3').allTextContents()) names.add(name);
      pages += 1;
      const next = page.getByRole('button', { name: 'Next worlds' });
      if (await next.isDisabled()) break;
      await next.click();
      await expect(page.locator('#atmosphere-catalog-page')).toContainText(`Page ${pages + 1}`);
    } while (pages < 20);
    const total = await page.evaluate(() => window.__exoplanetAtmosphereCatalog.systems.reduce((n, system) => n + system.planets.length, 0));
    expect(names.size).toBe(total);
    await page.locator('#atmosphere-catalog-search').fill('TRAPPIST-1');
    await expect(cards).toHaveCount(7);
    await expect(page.locator('#atmosphere-catalog-page')).toContainText('Page 1 of 1');
    await page.locator('#atmosphere-catalog-search').fill('a world absent from the catalogue');
    await expect(page.locator('#atmosphere-catalog-list')).toContainText('No worlds match');
    await page.locator('#atmosphere-catalog-search').fill('');
    await page.locator('#atmosphere-catalog-filter').selectOption('spectra');
    expect(await cards.count()).toBeGreaterThan(0);
    await expect(page.locator('#atmosphere-catalog-status')).toContainText('matching worlds');
  });

  test('sibling planets retain identity in details, saves, comparison, claims and 3D', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/database.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.databaseInstance?.allData?.length === 9564 && window.databaseAdvancedFeatures);
    await page.locator('#planet-search').fill('Kepler-227');
    const b = page.locator('.planet-card[data-record-id="K00752.01"]');
    const c = page.locator('.planet-card[data-record-id="K00752.02"]');
    await expect(page.locator('.planet-card')).toHaveCount(2);
    await expect(page.locator('.planet-card').filter({ hasText: 'Kepler-229' })).toHaveCount(0);
    await page.locator('#planet-search').fill('10797460');
    await expect(page).toHaveURL(/q=10797460(?:&|$)/);
    await expect(page.locator('.planet-card')).toHaveCount(2);
    await expect(b).toBeVisible();
    await expect(c).toBeVisible();
    await page.locator('#planet-search').fill('Kepl');
    await expect.poll(() => page.locator('.planet-card').count()).toBeGreaterThan(2);
    expect(await page.locator('.planet-card .planet-name').evaluateAll(nodes => nodes.every(node => node.textContent.startsWith('Kepler')))).toBe(true);
    await page.locator('#planet-search').fill('K00752.02');
    await expect(page.locator('.planet-card')).toHaveCount(1);
    await expect(c).toBeVisible();
    await page.locator('#planet-search').fill('Kepler-227');
    await expect(page.locator('.planet-card')).toHaveCount(2);
    await expect(b).toBeVisible();
    await expect(c).toBeVisible();
    await expect(c.locator('.ita-card-metrics')).toContainText('Not reported');
    await expect(c.locator('.ita-card-metrics')).not.toContainText('0.00');
    await expect(c.locator('.ita-card-telemetry')).not.toContainText('null');
    await c.getByRole('button', { name: 'Details', exact: true }).click();
    await expect(page.locator('#planet-details-modal')).toContainText('Kepler-227 c');
    await expect(page).toHaveURL(/planet=K00752.02/);
    await page.evaluate(() => window.closePlanetDetails());

    await c.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(c.getByRole('button', { name: 'Saved', exact: true })).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('planet_favorites')))).toEqual(['K00752.02']);
    await c.getByRole('button', { name: 'Saved', exact: true }).click();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('planet_favorites')))).toEqual([]);
    await c.getByRole('button', { name: 'Save', exact: true }).click();
    await page.locator('#planet-search').fill('Kepler-229');
    await expect(c).toHaveCount(0);
    await page.locator('#planet-search').fill('Kepler-227');
    await expect(c.getByRole('button', { name: 'Saved', exact: true })).toHaveAttribute('aria-pressed', 'true');

    await c.getByRole('button', { name: 'Habitability', exact: true }).click();
    await expect(page.getByRole('dialog')).toContainText('Habitability evidence: Kepler-227 c');
    await expect(page.getByRole('dialog')).toContainText('No habitability percentage');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await b.getByRole('button', { name: 'Compare', exact: true }).click();
    await c.getByRole('button', { name: 'Compare', exact: true }).click();
    await expect(page.locator('#comparison-modal')).toContainText('Kepler-227 b');
    await expect(page.locator('#comparison-modal')).toContainText('Kepler-227 c');
    const download = page.waitForEvent('download');
    await page.locator('#export-comparison-btn').click();
    expect((await download).suggestedFilename()).toMatch(/comparison.*\.csv/);
    await page.locator('#comparison-modal').getByRole('button', { name: 'Close', exact: true }).click();
    await page.evaluate(async () => window.authManager.register('Audit Navigator', 'audit@example.test', 'unique-password-1'));
    await c.getByRole('button', { name: 'Claim world', exact: true }).click();
    await expect(page.getByRole('dialog')).toContainText('Claim saved: Kepler-227 c');
    await page.keyboard.press('Escape');
    const claims = await page.evaluate(() => JSON.parse(localStorage.getItem('planet-claims')));
    expect(claims).toHaveLength(1);
    expect(claims[0]).toMatchObject({ recordId: 'K00752.02', planetName: 'Kepler-227 c', kepid: 10797460 });
    await expect(b.getByRole('button', { name: 'Claim world', exact: true })).toBeEnabled();
    await expect(c.getByRole('button', { name: 'Claimed', exact: true })).toBeDisabled();
    await c.getByRole('button', { name: 'View in 3D' }).click();
    await expect(page.locator('#planet-3d-modal')).toContainText('Kepler-227 c', { timeout: 15_000 });
    await page.locator('#close-3d-btn').click();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.databaseInstance?.allData?.length === 9564);
    if (await page.locator('#planet-details-modal').count()) await page.evaluate(() => window.closePlanetDetails());
    await expect(b.getByRole('button', { name: 'Claim world', exact: true })).toBeEnabled();
    await expect(c.getByRole('button', { name: 'Claimed', exact: true })).toBeDisabled();
    expect(errors).toEqual([]);
  });
});

test.describe('page-specific end effects', () => {
  for (const width of [1440, 390]) {
    test(`Stellar composer remains clickable beside collapsed and expanded audio at ${width}px`, async ({ page }) => {
      await page.setViewportSize({width,height:844});
      await page.goto('/stellar-ai.html',{waitUntil:'domcontentloaded'});
      await expect(page.locator('#stellar-utility-dock #cosmic-music-player')).toHaveCount(1);
      for (const expanded of [false,true]) {
        if ((await page.locator('#player-content').isVisible()) !== expanded) await page.locator('#minimize-player').click();
        await page.locator('#message-input').fill(`Explain exoplanets ${expanded ? 'again' : 'briefly'}`);
        await page.evaluate(()=>{
          const rect=document.getElementById('send-btn').getBoundingClientRect();
          scrollTo({top:scrollY+rect.bottom-innerHeight+8,behavior:'instant'});
        });
        const geometry=await page.evaluate(()=>{
          const box=id=>document.getElementById(id).getBoundingClientRect();
          const overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
          const composer=document.querySelector('#stellar-chat-shell .input-wrapper').getBoundingClientRect();
          const send=box('send-btn');
          const controls=[...document.querySelectorAll('#stellar-chat-shell .input-wrapper button:not([hidden]),#stellar-chat-shell .input-wrapper textarea')].map(element=>element.getBoundingClientRect());
          const x=send.x+send.width/2,y=send.y+send.height/2;
          return {send:{x,y}, hit:document.elementFromPoint(x,y)?.closest('button')?.id,
            dockOverlap:['cosmic-music-player','theme-toggle-container'].some(id=>overlap(composer,box(id))),
            controlsOverlap:controls.some((a,i)=>controls.slice(i+1).some(b=>overlap(a,b))),
            overflow:document.documentElement.scrollWidth-innerWidth};
        });
        expect(geometry.dockOverlap).toBe(false);
        expect(geometry.controlsOverlap).toBe(false);
        expect(geometry.overflow).toBeLessThanOrEqual(2);
        expect(geometry.hit).toBe('send-btn');
        const replies=await page.locator('.message.ai-message').count();
        await page.mouse.click(geometry.send.x,geometry.send.y);
        await expect(page.locator('.message.ai-message')).toHaveCount(replies+1);
        await expect(page.locator('.message.ai-message').last()).toContainText(/exoplanet/i);
      }
    });
  }

  test('saved world counts propagate to dashboard, badges and analytics, then clear fully', async ({ page }) => {
    await page.addInitScript(() => {
      if (!sessionStorage.getItem('audit-seeded')) {
        localStorage.setItem('planet_favorites', JSON.stringify(['K00752.01', 'K00752.02']));
        localStorage.setItem('user_claims', JSON.stringify([{ recordId: 'K00752.02' }]));
        sessionStorage.setItem('audit-seeded', 'true');
      }
    });
    await page.goto('/dashboard.html');
    await expect(page.locator('.dashboard-local-controls')).toContainText('Saved worlds: 2');
    const download = page.waitForEvent('download');
    await page.locator('#dashboard-export').click();
    expect((await download).suggestedFilename()).toBe('ita-local-dashboard.json');
    await page.goto('/badges.html');
    expect(await page.evaluate(() => window.badgesPageInstance.metrics().worlds)).toBe(2);
    await page.getByRole('button', { name: 'Earned', exact: true }).click();
    await expect(page.locator('.badge-card.earned').first()).toBeVisible();
    await page.goto('/analytics-dashboard.html');
    await expect(page.locator('.analytics-metric-card').first()).toContainText('2');
    await page.goto('/dashboard.html');
    page.once('dialog', dialog => dialog.accept());
    await page.locator('#dashboard-reset').click();
    await expect(page.locator('.dashboard-local-controls')).toContainText('Saved worlds: 0');
    expect(await page.evaluate(() => localStorage.getItem('user_claims'))).toBeNull();
  });

  test('radio waveform sliders and pause control visibly affect the simulation', async ({ page }) => {
    await page.goto('/experimental/connected-cosmos/cosmic-radio.html');
    await expect(page.locator('#signal-strength')).toContainText('BROADCASTING');
    const before = await page.locator('#viz').evaluate(canvas => canvas.toDataURL());
    await page.locator('#knob-freq').focus();
    await page.keyboard.press('End');
    await expect(page.locator('#frequency-value')).toHaveText('4.0');
    await page.locator('#knob-gain').focus();
    await page.keyboard.press('Home');
    await expect(page.locator('#gain-value')).toHaveText('0.0');
    await expect.poll(() => page.locator('#viz').evaluate(canvas => canvas.toDataURL())).not.toBe(before);
    await page.getByRole('button', { name: 'Pause transmission' }).click();
    await expect(page.locator('#signal-strength')).toHaveText('PAUSED');
    await page.getByRole('button', { name: 'Resume transmission' }).click();
    await expect(page.locator('#signal-strength')).toContainText('BROADCASTING');
    expect(await page.locator('img').evaluateAll(images => images.every(image => image.getBoundingClientRect().width <= 44))).toBe(true);
  });

  test('Stellar AI offline chat sends, exports, shows metrics, and clears', async ({ page }) => {
    await page.goto('/stellar-ai.html');
    await page.locator('#message-input').fill('Tell me about exoplanets');
    await page.locator('#send-btn').click();
    await expect(page.locator('.message.ai-message').last()).toContainText(/exoplanet/i);
    const download = page.waitForEvent('download');
    await page.locator('#export-chat-btn').click();
    expect((await download).suggestedFilename()).toBe('stellar-ai-local-chat.json');
    await page.locator('#metrics-btn').click();
    await expect(page.getByRole('dialog')).toContainText('Messages stored in this browser: 2');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    page.once('dialog', dialog => dialog.accept());
    await page.locator('#clear-chat-btn').click();
    await expect(page.locator('.message.ai-message')).toHaveCount(0);
    const cli = page.waitForEvent('download');
    await page.locator('#download-cli-btn').click();
    expect((await cli).suggestedFilename()).toBe('stellar-ai-cli.zip');
  });

  test('nebula has an interactive fallback, working sliders and pause/resume', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => Object.defineProperty(navigator, 'gpu', { value: undefined, configurable: true }));
    await page.goto('/experimental/webgpu-galaxy/nebula-sim.html', { waitUntil: 'domcontentloaded' });
    const canvas = page.locator('#nebula-canvas');
    await expect(canvas).toHaveAttribute('data-renderer', 'canvas2d');
    await expect(page.locator('#nebula-status')).toContainText('interactive Canvas 2D');
    await expect.poll(() => canvas.getAttribute('data-simulation-time')).not.toBe('0.000');
    const before = await canvas.evaluate(node => node.toDataURL());
    await page.locator('#viscosity').focus();
    await page.keyboard.press('End');
    await expect(page.locator('#viscosity')).toHaveValue('1');
    await page.locator('#vorticity').focus();
    await page.keyboard.press('Home');
    await expect(page.locator('#vorticity')).toHaveValue('0');
    await expect.poll(() => canvas.evaluate(node => node.toDataURL())).not.toBe(before);
    await page.getByRole('button', { name: 'Pause simulation' }).click();
    const paused = await canvas.getAttribute('data-simulation-time');
    await page.waitForTimeout(120);
    await expect(canvas).toHaveAttribute('data-simulation-time', paused);
    await page.getByRole('button', { name: 'Resume simulation' }).click();
    await expect.poll(() => canvas.getAttribute('data-simulation-time')).not.toBe(paused);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole('button', { name: 'Pause simulation' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(2);
    expect(errors).toEqual([]);
  });

  test('two browser mesh tabs exchange an actual message', async ({ context, page }) => {
    await page.goto('/experimental/connected-cosmos/p2p-network.html', { waitUntil: 'domcontentloaded' });
    const receiver = await context.newPage();
    await receiver.goto('/experimental/connected-cosmos/p2p-network.html', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Broadcast Planet Data Chunk' }).click();
    await expect(page.locator('#data-log')).toContainText('Broadcasting Chunk:');
    await expect(receiver.locator('#data-log')).toContainText('Received Data Chunk:', { timeout: 8000 });
    await receiver.close();
  });

  test('telemetry starts, receives simulated samples, sends a command and stops', async ({ page }) => {
    await page.goto('/experimental/native-integration/telemetry.html', { waitUntil: 'domcontentloaded' });
    await page.locator('#simulate-btn').click();
    await expect(page.locator('#connection-status')).toHaveText('SIMULATION');
    await expect(page.locator('#terminal')).toContainText('[TELEMETRY]', { timeout: 4000 });
    await page.locator('#cmd-input').fill('STATUS');
    await page.locator('#send-btn').click();
    await expect(page.locator('#terminal')).toContainText('STATUS');
    await expect(page.locator('#cmd-input')).toHaveValue('');
    await page.locator('#simulate-btn').click();
    await expect(page.locator('#connection-status')).toHaveText('DISCONNECTED');
    await expect(page.locator('#send-btn')).toBeDisabled();
  });

  test('Captain log draft is saved and restored without a filesystem API', async ({ page }) => {
    await page.addInitScript(() => { delete window.showOpenFilePicker; delete window.showSaveFilePicker; });
    await page.goto('/experimental/native-integration/captains-log.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#open-btn')).toBeDisabled();
    await page.locator('#editor').fill('Audit expedition\nObserved Barnard b.');
    await page.locator('#save-btn').click();
    await expect(page.locator('#status-msg')).toHaveText('Draft saved in this browser');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('#editor')).toHaveValue('Audit expedition\nObserved Barnard b.');
  });

  test('shop free download produces the actual published image', async ({ page }) => {
    await page.goto('/shop.html', { waitUntil: 'domcontentloaded' });
    const download = page.waitForEvent('download');
    await page.locator('[data-product-id="andromedian-free-pirate"]').click();
    const file = await download;
    expect(file.suggestedFilename()).toBe('law-of-universe.png');
    expect(await file.failure()).toBeNull();
    await expect(page.locator('[data-product-id="andromedian-free-pirate"]')).toContainText('Download');
  });

  test('calendar changes period and view and opens an event source', async ({ page }) => {
    await page.goto('/event-calendar.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.calendar-day')).not.toHaveCount(0);
    const heading = page.locator('#calendar-view h3').first();
    const initial = (await heading.textContent()).trim();
    await page.locator('#next-month').click();
    await expect(heading).not.toHaveText(initial);
    await page.locator('#prev-month').click();
    await expect(heading).toHaveText(initial);
    for (const view of ['week', 'day', 'list', 'month']) {
      await page.locator(`#view-${view}`).click();
      await expect(page.locator(`#view-${view}`)).toHaveAttribute('aria-pressed', 'true');
    }
    const event = page.locator('[data-event-id]').first();
    await expect(event).toBeVisible();
    await event.click();
    await expect(page.locator('#event-details')).toBeVisible();
    await expect(page.locator('#event-details a')).toHaveAttribute('href', /^https:\/\//);
    await page.getByRole('button', { name: 'Close event details' }).click();
    await expect(page.locator('#event-details')).not.toBeVisible();
  });

  test('every playlist item decodes and plays, and a track can be downloaded', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#minimize-player')).toBeVisible();
    if (!(await page.locator('#player-content').isVisible())) await page.locator('#minimize-player').click();
    const tracks = page.locator('.playlist-item');
    expect(await tracks.count()).toBeGreaterThanOrEqual(19);
    for (let i = 0; i < await tracks.count(); i++) {
      await tracks.nth(i).click();
      await expect.poll(() => page.evaluate(() => {
        const player = window.cosmicMusicPlayer();
        return !player.audio.paused && player.audio.currentTime > .1 && !player.audio.error;
      }), { timeout: 8000 }).toBe(true);
      await expect(tracks.nth(i)).toHaveAttribute('aria-pressed', 'true');
    }
    await page.locator('#play-pause').click();
    expect(await page.evaluate(() => window.cosmicMusicPlayer().audio.paused)).toBe(true);
    const download = page.waitForEvent('download');
    await page.locator('#download-track').click();
    expect((await download).suggestedFilename()).toMatch(/\.mp3$/);
  });
});
