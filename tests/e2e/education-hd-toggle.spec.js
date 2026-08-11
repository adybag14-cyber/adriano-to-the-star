import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8082';

async function waitForTexture(page, predicate, timeoutMs = 60000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        const info = await page.evaluate(() => {
            const mesh = window.viewer?.planetMesh;
            const img = mesh?.material?.map?.image;
            return {
                url: img?.currentSrc || img?.src || null,
                width: img?.naturalWidth || img?.width || 0,
                height: img?.naturalHeight || img?.height || 0,
                hdTexturesEnabled: window.viewer?.hdTexturesEnabled
            };
        });

        if (predicate(info)) {
            return info;
        }

        await page.waitForTimeout(250);
    }

    const last = await page.evaluate(() => {
        const mesh = window.viewer?.planetMesh;
        const img = mesh?.material?.map?.image;
        return {
            url: img?.currentSrc || img?.src || null,
            width: img?.naturalWidth || img?.width || 0,
            height: img?.naturalHeight || img?.height || 0,
            hdTexturesEnabled: window.viewer?.hdTexturesEnabled
        };
    });

    throw new Error(`Timed out waiting for texture. Last seen: ${JSON.stringify(last)}`);
}

async function setHdToggle(page, enabled) {
    const toggle = page.locator('#hd-textures-toggle');
    await expect(toggle).toHaveCount(1);

    try {
        await toggle.setChecked(enabled, { timeout: 10000 });
    } catch (e) {
        await page.evaluate((value) => {
            const el = document.getElementById('hd-textures-toggle');
            if (!el) throw new Error('HD toggle not found');
            el.checked = value;
            el.dispatchEvent(new Event('change', { bubbles: true }));
        }, enabled);
    }
}

test('Education: HD textures toggle switches Mercury 2K <-> 8K', async ({ page }) => {
    test.setTimeout(3 * 60 * 1000);

    await page.goto(`${BASE_URL}/education.html?cb=playwright-hd-toggle`, { waitUntil: 'domcontentloaded' });

    await page.waitForFunction(() => Boolean(window.viewer && typeof window.viewer.loadPlanet === 'function'), null, { timeout: 60000 });

    await setHdToggle(page, false);

    await page.evaluate(() => {
        window.viewer.loadPlanet('Mercury');
    });

    const base = await waitForTexture(
        page,
        (info) => info.width === 2048 && info.height === 1024 && String(info.url || '').includes('texture_2k_mercury') && info.hdTexturesEnabled === false,
        90000
    );

    await setHdToggle(page, true);

    const hd = await waitForTexture(
        page,
        (info) => info.width === 8192 && info.height === 4096 && String(info.url || '').includes('texture_8k_mercury') && info.hdTexturesEnabled === true,
        150000
    );

    await setHdToggle(page, false);

    const back = await waitForTexture(
        page,
        (info) => info.width === 2048 && info.height === 1024 && String(info.url || '').includes('texture_2k_mercury') && info.hdTexturesEnabled === false,
        90000
    );

    expect(base.width).toBe(2048);
    expect(hd.width).toBe(8192);
    expect(back.width).toBe(2048);
});

test('Education: all main buttons work without console errors', async ({ page }) => {
     test.setTimeout(3 * 60 * 1000);

     const consoleErrors = [];
     const pageErrors = [];
     const dialogs = [];

     const onConsole = (msg) => {
         if (msg.type() === 'error') {
             consoleErrors.push(msg.text());
         }
     };

     const onPageError = (exception) => {
         pageErrors.push(String(exception));
     };

     const onDialog = async (dialog) => {
         dialogs.push({ type: dialog.type(), message: dialog.message() });
         await dialog.dismiss().catch(() => {});
     };

     page.on('console', onConsole);
     page.on('pageerror', onPageError);
     page.on('dialog', onDialog);

     await page.goto(`${BASE_URL}/education.html?cb=playwright-education-buttons`, { waitUntil: 'domcontentloaded' });

     await page.waitForFunction(() => Boolean(window.viewer && typeof window.viewer.loadPlanet === 'function'), null, { timeout: 60000 });
     await page.waitForFunction(
         () => Boolean(window.educationalGames && typeof window.educationalGames.createGamesWidget === 'function'),
         null,
         { timeout: 60000 }
     );
     await page.waitForFunction(
         () => Boolean(window.astronomyCourses && typeof window.astronomyCourses.renderCourseList === 'function'),
         null,
         { timeout: 60000 }
     );

     const sidebar = page.locator('#ui-sidebar');
     const sidebarToggle = page.locator('button.toggle-btn');
     const planetName = page.locator('#planet-name');

     await expect(sidebar).toHaveCount(1);
     await expect(sidebarToggle).toHaveCount(1);
     await expect(planetName).toHaveCount(1);

     await expect(sidebar).toHaveClass(/active/);
     await sidebarToggle.click();
     await expect(sidebar).not.toHaveClass(/active/);
     await sidebarToggle.click();
     await expect(sidebar).toHaveClass(/active/);

     const clickPlanet = async (label, expectedDisplayName) => {
         const button = page.locator('#ui-sidebar button.planet-btn', { hasText: label }).first();
         await expect(button).toHaveCount(1);
         await button.click();
         await expect(planetName).toHaveText(expectedDisplayName);
     };

     await clickPlanet('Mercury', 'MERCURY');
     await clickPlanet('Venus', 'VENUS');
     await clickPlanet('Earth', 'EARTH');
     await clickPlanet('Mars', 'MARS');
     await clickPlanet('Jupiter', 'JUPITER');
     await clickPlanet('Saturn', 'SATURN');
     await clickPlanet('Uranus', 'URANUS');
     await clickPlanet('Neptune', 'NEPTUNE');
     await clickPlanet('Kepler-186f', 'KEPLER-186f');
     await clickPlanet('Trappist-1e', 'TRAPPIST-1e');

     await setHdToggle(page, true);
     expect(await page.evaluate(() => window.viewer?.hdTexturesEnabled)).toBe(true);
     await setHdToggle(page, false);
     expect(await page.evaluate(() => window.viewer?.hdTexturesEnabled)).toBe(false);

     const gamesBtn = page.locator('#ui-sidebar button.planet-btn', { hasText: 'Launch Games' }).first();
     await expect(gamesBtn).toHaveCount(1);
     await gamesBtn.click();

     const gamesWidget = page.locator('#educational-games-widget');
     await expect(gamesWidget).toHaveCount(1);
     await expect(gamesWidget).toBeVisible();

     const gamesClose = gamesWidget.locator('button', { hasText: '×' }).first();
     await expect(gamesClose).toHaveCount(1);
     await gamesClose.click();
     await expect(gamesWidget).toBeHidden();

     await gamesBtn.click();
     await expect(gamesWidget).toBeVisible();

     await gamesClose.click();
     await expect(gamesWidget).toBeHidden();

     const coursesBtn = page.locator('#ui-sidebar button.planet-btn', { hasText: 'Astronomy Courses' }).first();
     await expect(coursesBtn).toHaveCount(1);
     await coursesBtn.click();

     const coursesModal = page.locator('#courses-modal');
     await expect(coursesModal).toHaveCount(1);
     await expect(coursesModal).toBeVisible();

     const coursesClose = coursesModal.locator('button', { hasText: '×' }).first();
     await expect(coursesClose).toHaveCount(1);
     await coursesClose.click();
     await expect(coursesModal).toHaveCount(0);

     const menuToggle = page.locator('#menu-toggle');
     await expect(menuToggle).toHaveCount(1);
     await menuToggle.click();

     const menuOverlay = page.locator('#menu-overlay');
     await expect(menuOverlay).toHaveCount(1);
     await expect(menuOverlay).toHaveClass(/active/);

     const menuClose = page.locator('#menu-close');
     await expect(menuClose).toHaveCount(1);
     await menuClose.click();
     await expect(menuOverlay).not.toHaveClass(/active/);

     expect(dialogs, JSON.stringify(dialogs, null, 2)).toEqual([]);
     expect(pageErrors, JSON.stringify(pageErrors, null, 2)).toEqual([]);
     expect(consoleErrors, JSON.stringify(consoleErrors, null, 2)).toEqual([]);

     page.off('console', onConsole);
     page.off('pageerror', onPageError);
     page.off('dialog', onDialog);

     const exitLink = page.locator('#ui-sidebar a', { hasText: 'EXIT SIMULATION' }).first();
     await expect(exitLink).toHaveCount(1);
     await expect(exitLink).toHaveAttribute('href', 'index.html');
     await Promise.all([
         page.waitForURL('**/index.html', { timeout: 60000 }),
         exitLink.click()
     ]);
 });
