import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
const output = '.artifacts/audit-20260904/archive';
const game = process.env.ARCHIVE_PROBE_GAME || 'tank trouble';
const artifactName = game.replace(/[^a-z0-9]/gi, '-');
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const logs = [];
page.on('console', message => { if (message.type() === 'error' || message.type() === 'warning') logs.push(message.text().slice(0,500)); });
try {
    if (process.env.ARCHIVE_ASSET_DIR) await page.route('https://starisdons-archive-assets.adybag14.workers.dev/swf/**', route => route.fulfill({ path: path.join(process.env.ARCHIVE_ASSET_DIR, decodeURIComponent(new URL(route.request().url()).pathname.split('/').at(-1))), headers: { 'access-control-allow-origin': '*' }, contentType: 'application/x-shockwave-flash' }));
    await page.goto(`${process.env.BASE_URL || 'http://127.0.0.1:8096'}/games.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.gamesManager?.archiveState === 'available');
    await page.locator('#game-search').fill(game);
    await (process.env.ARCHIVE_PROBE_FILE ? page.locator(`.game-card[data-game="${process.env.ARCHIVE_PROBE_FILE}"]`) : page.locator('.game-card').first()).click();
    await page.waitForFunction(() => window.gamesManager.currentGame);
    await page.waitForTimeout(2000);
    for (const [index, action] of JSON.parse(process.env.ARCHIVE_PROBE_ACTIONS || '[]').entries()) {
        if (action.click) await page.mouse.click(...action.click);
        if (action.key) await page.keyboard.press(action.key);
        if (action.wait) await page.waitForTimeout(Math.min(10000, action.wait));
        await page.screenshot({ path: path.join(output, `rendering-probe-${artifactName}-action-${index}.png`) });
    }
    const details = await page.evaluate(() => {
        const player = window.gamesManager.rufflePlayer;
        const capture = element => { if (!element) return null; const style = getComputedStyle(element); return { tag: element.tagName, rect: element.getBoundingClientRect().toJSON(), opacity: style.opacity, visibility: style.visibility, display: style.display, position: style.position, zIndex: style.zIndex, transform: style.transform, color: style.color }; };
        return { title: document.getElementById('game-modal-title').textContent, nodes: ['game-modal','game-modal-title','game-container'].map(id => capture(document.getElementById(id))), player: capture(player), shadow: player.shadowRoot?.innerHTML.slice(-12000), child: capture(player.shadowRoot?.querySelector('canvas')), state: player.ruffle().readyState, metadata: player.ruffle().metadata, suspended: player.ruffle().suspended };
    });
    await fs.writeFile(path.join(output, `rendering-probe-${artifactName}.json`), JSON.stringify({ details, logs }, null, 2));
    await page.screenshot({ path: path.join(output, `rendering-probe-${artifactName}.png`) });
    console.log(JSON.stringify({ details: { ...details, shadow: details.shadow?.slice(-1500) }, logs }, null, 2));
} finally { await browser.close(); }
