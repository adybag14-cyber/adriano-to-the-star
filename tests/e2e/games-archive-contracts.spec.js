import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';

// Route fixtures must own their network responses; the real runtime probes keep
// production PWA behavior separately, without a service worker bypassing mocks.
test.use({ serviceWorkers: 'block' });

const games = Array.from({ length: 52 }, (_, index) => ({ name: `Archive ${String(index).padStart(2, '0')}`, file: `swf/archive-${index}.swf`, size: (index + 1) * 1024 }));
const swfHeader = Buffer.from([70, 87, 83, 9, 8, 0, 0, 0]);
const catalogueRoute = /\/games-manifest\.json(?:\?.*)?$/;
const archiveIndexRoute = /\/games-archive-index\.json(?:\?.*)?$/;

async function fixture(page, { available = true } = {}) {
    await page.route(catalogueRoute, route => route.fulfill({ json: games }));
    await page.route(archiveIndexRoute, route => route.fulfill({ json: indexFixture() }));
    await page.route('https://unpkg.com/**', route => route.fulfill({ contentType: 'text/javascript', body: `
        window.RufflePlayer = { newest() { return { createPlayer() {
            const player = document.createElement('div'); player.className = 'test-ruffle-runtime';
            player.load = async options => {
                window.archiveTestLoads = (window.archiveTestLoads || []).concat(options.url || options.swfFileName);
                window.archiveTestDataLength = options.data?.byteLength || 0;
                window.archiveTestOptions = { allowScriptAccess: options.allowScriptAccess, openUrlMode: options.openUrlMode };
                if (window.archiveTestReject) throw new Error('Fixture runtime rejection');
                if (window.archiveTestPending) await new Promise(resolve => window.archiveTestResolve = resolve);
                player.textContent = 'Legacy runtime started';
                player.metadata = { width: 640, height: 480 };
                player.readyState = 2;
                player.dispatchEvent(new Event('loadeddata'));
            };
            return player;
        } }; } };` }));
    await page.route('https://starisdons-archive-assets.adybag14.workers.dev/**', route => route.fulfill({ status: available ? 206 : 500,
        headers: { 'access-control-allow-origin': '*', 'access-control-expose-headers': '*' },
        body: available ? swfHeader : 'Storage unavailable' }));
    await page.goto('/games.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#archive-connection-message')).toContainText(available ? 'storage is reachable' : 'HTTP 500');
    await expect.poll(() => page.evaluate(() => window.gamesManager?.games.length)).toBe(games.length);
}

const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const indexFixture = () => ({ schemaVersion: 1, assetBaseUrl: 'https://starisdons-archive-assets.adybag14.workers.dev',
    entries: Object.fromEntries(games.map(game => [game.file, { status: 'verified-container', bytes: 8, sha256: digest(swfHeader) }])) });

test('a publisher-restricted first entry never disables the rest of the archive', async ({ page }) => {
    await fixture(page);
    const index = indexFixture();
    Object.assign(index.entries[games[0].file], { runtimeStatus: 'publisher-restricted', runtimeReason: 'Publisher-hosted edition.', publisherUrl: 'https://www.coolmathgames.com/0-bloxorz' });
    await page.route(archiveIndexRoute, route => route.fulfill({ json: index }));
    await page.evaluate(async () => { await window.gamesManager.loadArchiveIndex(); await window.gamesManager.checkArchiveAvailability(); });
    await expect(page.locator('.game-card').first()).toBeDisabled();
    await expect(page.locator('.game-card').nth(1)).toBeEnabled();
    await expect(page.getByRole('link', { name: /Play on publisher site/ })).toHaveAttribute('href', 'https://www.coolmathgames.com/0-bloxorz');
});

test('observed startup-blocked original offers its publisher without being called corrupt', async ({ page }) => {
    await fixture(page);
    const index = indexFixture();
    Object.assign(index.entries[games[0].file], { runtimeStatus: 'startup-blocked', runtimeReason: 'Observed loader stall; the exact guard is unproven.', publisherUrl: 'https://www.coolmathgames.com/0-sugar-sugar' });
    await page.route(archiveIndexRoute, route => route.fulfill({ json: index }));
    await page.evaluate(async () => { await window.gamesManager.loadArchiveIndex(); await window.gamesManager.checkArchiveAvailability(); });
    await expect(page.locator('.game-card').first()).toBeDisabled();
    await expect(page.locator('.game-card').first()).toContainText('Observed loader stall');
    await expect(page.getByRole('link', { name: /Play on publisher site/ })).toHaveAttribute('href', 'https://www.coolmathgames.com/0-sugar-sugar');
    await expect(page.locator('.game-card').nth(1)).toBeEnabled();
});

test('confirmed invalid original cannot launch and exact split bytes reach Ruffle after SHA validation', async ({ page }) => {
    await fixture(page);
    const index = indexFixture();
    index.entries[games[1].file] = { status: 'unavailable', reason: 'Original download is HTML, not SWF.' };
    const splitFile = Buffer.concat([swfHeader, Buffer.from([1, 2, 3, 4])]);
    index.entries[games[0].file] = { status: 'verified-container', bytes: splitFile.length, sha256: digest(splitFile), chunks: [
        { path: `${games[0].file}.part-0`, bytes: 8, sha256: digest(swfHeader) },
        { path: `${games[0].file}.part-1`, bytes: 4, sha256: digest(splitFile.subarray(8)) }
    ] };
    await page.route(archiveIndexRoute, route => route.fulfill({ json: index }));
    await page.route('https://starisdons-archive-assets.adybag14.workers.dev/**', route => route.fulfill({
        headers: { 'access-control-allow-origin': '*' }, body: route.request().url().endsWith('part-1') ? splitFile.subarray(8) : swfHeader
    }));
    await page.evaluate(async () => { await window.gamesManager.loadArchiveIndex(); await window.gamesManager.checkArchiveAvailability(); });
    await expect(page.locator('.game-card').nth(1)).toBeDisabled();
    await expect(page.locator('.game-card').nth(1)).toContainText('Original download is HTML');
    await page.locator('.game-card').first().click();
    await expect(page.locator('.test-ruffle-runtime')).toHaveText('Legacy runtime started');
    expect((await page.locator('.test-ruffle-runtime').boundingBox()).height).toBeGreaterThanOrEqual(260);
    await expect.poll(() => page.evaluate(() => window.archiveTestDataLength)).toBe(splitFile.length);
    expect(await page.evaluate(() => window.archiveTestOptions)).toEqual({ allowScriptAccess: false, openUrlMode: 'confirm' });
    await page.locator('#close-game-modal').click();
    await page.route('https://starisdons-archive-assets.adybag14.workers.dev/**', route => route.fulfill({
        headers: { 'access-control-allow-origin': '*' }, body: route.request().url().endsWith('part-1') ? Buffer.from([4, 3, 2, 1]) : swfHeader
    }));
    await page.locator('.game-card').first().click();
    await expect(page.locator('.game-error')).toContainText('Archive integrity check failed');
    expect(await page.evaluate(() => window.archiveTestLoads.length)).toBe(1);
});

test('archive outage is explicit and retry restores launch availability', async ({ page }) => {
    await fixture(page, { available: false });
    await expect(page.locator('.game-card:enabled')).toHaveCount(0);
    await page.locator('#game-search').fill('Archive 51');
    await expect(page.locator('.game-card')).toHaveCount(1);
    await page.route('https://starisdons-archive-assets.adybag14.workers.dev/**', route => route.fulfill({ status: 206, headers: { 'access-control-allow-origin': '*' }, body: swfHeader }));
    await page.getByRole('button', { name: 'Check archive connection' }).click();
    await expect(page.locator('.game-card:enabled')).toHaveCount(1);
    await page.locator('.game-card').click();
    await expect(page.locator('.test-ruffle-runtime')).toHaveText('Legacy runtime started');
    await expect.poll(() => page.evaluate(() => window.archiveTestLoads.at(-1))).toBe('https://starisdons-archive-assets.adybag14.workers.dev/swf/archive-51.swf');
});

test('mobile modal close control stays above floating site widgets', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await fixture(page);
    await page.locator('.game-card').first().click();
    await expect(page.locator('.test-ruffle-runtime')).toHaveText('Legacy runtime started');
    expect(await page.locator('#game-modal').evaluate(modal => modal.parentElement === document.body)).toBe(true);
    const close = page.locator('#close-game-btn');
    await close.scrollIntoViewIfNeeded();
    expect(await close.evaluate(button => { const box = button.getBoundingClientRect(); return button.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)); })).toBe(true);
    await close.click();
    await expect(page.locator('#game-modal')).toBeHidden();
});

test('launch clears the shared runtime native hidden flag before displaying its player', async ({ page }) => {
    await fixture(page);
    await expect(page.locator('#close-game-modal')).not.toHaveAttribute('hidden');
    await expect(page.locator('#close-game-modal')).not.toHaveAttribute('aria-hidden', 'true');
    await page.locator('#game-modal').evaluate(modal => { modal.hidden = true; });
    await page.locator('.game-card').first().click();
    await expect(page.locator('#game-modal')).toBeVisible();
    await expect(page.locator('.test-ruffle-runtime')).toBeVisible();
    await page.locator('#close-game-modal').click();
    await expect(page.locator('#game-modal')).toBeHidden();
});

test('archive search counts, size units, pagination and focus remain correct', async ({ page }) => {
    await fixture(page);
    await expect(page.locator('#game-count')).toContainText('Showing 48 of 52 matches');
    await expect(page.locator('.game-size').first()).toHaveText('1 KB');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page.locator('#game-count')).toContainText('Showing 4 of 52 matches');
    await expect(page.getByRole('button', { name: 'Previous', exact: true })).toBeFocused();
    await page.locator('#game-search').fill('Archive');
    await expect(page.locator('#game-count')).toContainText('Showing 48 of 52 matches');
    await page.locator('#game-sort').selectOption('size-desc');
    await expect(page.locator('.game-name').first()).toHaveText('Archive 51');
    await page.locator('#game-search').fill('does not exist');
    await expect(page.locator('#games-grid')).toContainText('No games found');
});

test('failed game retries only that game and modal focus stays contained', async ({ page }) => {
    await fixture(page);
    await page.evaluate(() => { window.archiveTestReject = true; });
    await page.locator('.game-card').first().click();
    await expect(page.locator('.game-error')).toContainText('Fixture runtime rejection');
    await page.evaluate(() => { window.archiveTestReject = false; });
    await page.getByRole('button', { name: 'Retry this game' }).click();
    await expect(page.locator('.test-ruffle-runtime')).toHaveText('Legacy runtime started');
    await expect.poll(() => page.evaluate(() => window.archiveTestLoads.length)).toBe(2);
    await page.locator('#close-game-btn').focus();
    await page.keyboard.press('Tab');
    await expect(page.locator('#close-game-modal')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('#game-modal')).toBeHidden();
    await expect(page.locator('.game-card').first()).toBeFocused();
});

test('closing an unfinished launch prevents stale game state and fullscreen rejection is visible', async ({ page }) => {
    await fixture(page);
    await page.evaluate(() => { window.archiveTestPending = true; });
    await page.locator('.game-card').first().click();
    await page.waitForFunction(() => Boolean(window.archiveTestResolve));
    await page.locator('#close-game-modal').click();
    await page.evaluate(() => window.archiveTestResolve());
    await expect.poll(() => page.evaluate(() => window.gamesManager.currentGame)).toBeNull();
    await page.evaluate(() => { window.archiveTestPending = false; });
    await page.locator('.game-card').first().click();
    await page.evaluate(() => { document.getElementById('game-container').requestFullscreen = () => Promise.reject(new Error('Fullscreen denied')); });
    await page.locator('#fullscreen-btn').click();
    await expect(page.locator('#archive-fullscreen-status')).toHaveText('Fullscreen denied');
});
