import fs from 'node:fs/promises';
import path from 'node:path';
import { inflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, '.artifacts/audit-20260904/archive');
await fs.mkdir(output, { recursive: true });
const manifest = JSON.parse(await fs.readFile(path.join(root, 'games-manifest.json'), 'utf8'));
const remoteBase = 'https://starisdons-archive-assets.adybag14.workers.dev';
const sourceBase = process.env.BASE_URL || 'http://127.0.0.1:8096';
const assetDirectory = process.env.ARCHIVE_ASSET_DIR;
const originalFilename = file => path.basename(file) === 'four_second_frenzy.swf' ? '______four_second_frenzy.swf' : path.basename(file);
const artifactPrefix = assetDirectory ? 'local-assets-' : '';

function validateSwf(buffer) {
    if (buffer.length < 8) return { status: 'invalid-short-header', bytes: buffer.length };
    const signature = buffer.toString('ascii', 0, 3);
    const declaredBytes = buffer.readUInt32LE(4);
    if (!['FWS', 'CWS', 'ZWS'].includes(signature)) return { status: 'invalid-signature', signature, bytes: buffer.length };
    if (signature === 'ZWS') return { status: 'header-valid-lzma-not-decoded', signature, declaredBytes, bytes: buffer.length };
    try {
        const decodedBytes = signature === 'CWS' ? inflateSync(buffer.subarray(8), { maxOutputLength: 128 * 1024 * 1024 }).length + 8 : buffer.length;
        return { status: decodedBytes === declaredBytes ? 'structure-valid-not-gameplay-certified' : 'decoded-length-mismatch', signature, declaredBytes, decodedBytes, bytes: buffer.length };
    } catch (error) { return { status: 'decompression-failed', message: error.message }; }
}

const paths = [];
for (const entry of manifest) {
    const validPath = /^swf\/[^/]+\.swf$/i.test(entry.file);
    const result = { file: entry.file, name: entry.name, manifestBytes: entry.size, validPath };
    if (validPath) {
        try { result.local = validateSwf(await fs.readFile(assetDirectory ? path.join(assetDirectory, originalFilename(entry.file)) : path.join(root, entry.file))); }
        catch (error) { result.local = error.code === 'ENOENT' ? { status: 'remote-asset-not-in-gitlab-worktree' } : { status: 'read-error', message: error.message }; }
    }
    paths.push(result);
}
const sampleIndices = [0, 2, 3, Math.floor(manifest.length / 2), manifest.length - 1, manifest.findIndex(game => game.size === 0)];
const remote = [];
for (const index of [...new Set(sampleIndices)].filter(value => value >= 0)) {
    const entry = manifest[index];
    const url = `${remoteBase}/${entry.file.split('/').map(encodeURIComponent).join('/')}`;
    try {
        const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
        const buffer = Buffer.from(await response.arrayBuffer());
        remote.push({ file: entry.file, url, httpStatus: response.status, cors: response.headers.get('access-control-allow-origin'),
            validation: response.ok ? validateSwf(buffer) : { status: 'asset-service-error', message: buffer.toString('utf8', 0, 250) } });
    } catch (error) { remote.push({ file: entry.file, url, validation: { status: 'network-error', message: error.message } }); }
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const launches = [];
try {
    if (assetDirectory) {
        await page.route(`${remoteBase}/swf/**`, async route => {
            const filename = decodeURIComponent(new URL(route.request().url()).pathname.split('/').at(-1));
            if (!manifest.some(game => path.basename(game.file) === filename)) return route.abort();
            return route.fulfill({ path: path.join(assetDirectory, originalFilename(filename)), contentType: 'application/x-shockwave-flash', headers: { 'access-control-allow-origin': '*' } });
        });
    }
    await page.goto(`${sourceBase}/games.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.gamesManager?.archiveState !== 'checking' && Boolean(window.gamesManager?.games.length));
    const state = await page.evaluate(() => ({ archive: window.gamesManager.archiveState, games: window.gamesManager.games.length,
        message: document.getElementById('archive-connection-message')?.textContent,
        enabledLaunches: document.querySelectorAll('.game-card:not([disabled])').length }));
    await page.screenshot({ path: path.join(output, `${artifactPrefix}archive-desktop.png`), fullPage: true });
    // Container load checks only. Separate manual gameplay screenshots certify
    // specific Start / movement / firing actions, not every game's completion.
    for (const index of ['swf/tank_trouble.swf', 'swf/zombieinvaders.swf', 'swf/four_second_frenzy.swf'].map(file => manifest.findIndex(game => game.file === file))) {
        const entry = manifest[index];
        await page.locator('#game-search').fill(entry.name);
        await page.locator(`.game-card[data-game="${entry.file}"]`).click();
        await page.waitForFunction(() => document.querySelector('.game-error') || window.gamesManager.currentGame, null, { timeout: 40000 });
        const result = await page.evaluate(() => ({ loaded: Boolean(window.gamesManager.currentGame), error: document.querySelector('.game-error')?.textContent?.trim(), metadata: window.gamesManager.rufflePlayer?.ruffle?.().metadata }));
        if (result.loaded) await page.waitForTimeout(1500);
        await page.screenshot({ path: path.join(output, `${artifactPrefix}launch-${index}.png`) });
        launches.push({ file: entry.file, ...result });
        await page.getByRole('button', { name: 'Close game', exact: true }).first().click();
    }
    await page.evaluate(() => window.gamesManager.checkArchiveAvailability());
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('#game-search').fill('');
    await page.screenshot({ path: path.join(output, `${artifactPrefix}archive-mobile.png`), fullPage: true });
    const report = { generatedAt: new Date().toISOString(), manifestEntries: manifest.length,
        duplicatePaths: manifest.length - new Set(manifest.map(game => game.file)).size,
        invalidPaths: paths.filter(entry => !entry.validPath).length,
        localAssets: paths.filter(entry => entry.local?.status !== 'remote-asset-not-in-gitlab-worktree').length,
        assetDirectory,
        scope: assetDirectory ? 'Every original local path inventoried. Browser network interception serves originals to the real Ruffle runtime for three representative container loads. Remote service samples remain separate production availability evidence. Container loads do not certify completed gameplay.' : 'Every manifest record and local path inventoried. Six remote payload samples and three UI container-load attempts. No assertion about unsampled binary integrity or complete gameplay.',
        pageState: state, remote, launches, pageErrors: errors, paths };
    await fs.writeFile(path.join(output, `${artifactPrefix}archive-audit.json`), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ ...report, paths: undefined }, null, 2));
} finally { await browser.close(); }
