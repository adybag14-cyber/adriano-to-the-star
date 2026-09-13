import { test, expect } from '@playwright/test';
test.use({ viewport: { width: 640, height: 480 }, deviceScaleFactor: 0.25 });
test('isolated gas compatibility diagnostics', async ({ page }, testInfo) => {
    test.setTimeout(120000);
    const start = Date.now();
    page.on('console', (m) => {
        if (m.type() === 'error' || m.text().startsWith('engine frame'))
            console.log(m.text().slice(0, 500));
    });
    await page.goto(
        (process.env.ENGINE_DEV_RENDERER ? '/test-exoplanet-preview.html' : '/database.html') +
            '?engine=K00752.01&scenario=volatile-rich&backend=webgl2&quality=Low&traceEngine=1'
    );
    await page.waitForFunction(
        () => window.planet3DViewer?.renderer?.ready,
        {},
        { timeout: 60000 }
    );
    console.log('ready', Date.now() - start);
    console.log(await page.evaluate(() => window.planet3DViewer.renderer.diagnostics()));
    await page.waitForFunction(
        () => window.planet3DViewer?.renderer?.frame > 2,
        {},
        { timeout: 60000 }
    );
    console.log('rendered', Date.now() - start);
    await expect(page.locator('#engine-mode')).toHaveText('Partially constrained view');
    await page.screenshot({ path: testInfo.outputPath('gas.png') });
    console.log('captured', Date.now() - start);
});
