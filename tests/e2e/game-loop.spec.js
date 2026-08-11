import { test, expect } from '@playwright/test';

test.describe('Exoplanet Pioneer - Game Loop', () => {
    test.beforeEach(async ({ page }) => {
        // Console logging for debugging
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', exception => console.log(`PAGE ERROR: "${exception}"`));

        // Go to the game page
        await page.goto('http://localhost:8085/exoplanet-pioneer.html');

        // Wait for game to initialize (canvas or UI)
        await page.waitForSelector('#ep-ui', { state: 'visible', timeout: 30000 });
    });

    test('should start with default resources', async ({ page }) => {
        // Check Energy
        const energy = await page.locator('.ep-res-item:has-text("⚡") .ep-res-val').first().innerText();
        console.log('Energy Text:', energy);
        // Extracts "50/200" -> 50
        const energyVal = parseInt(energy.split('/')[0]);
        expect(energyVal).toBeGreaterThanOrEqual(50);

        // Check Minerals
        const minerals = await page.locator('.ep-res-item:has-text("⛏️") .ep-res-val').innerText();
        console.log('Minerals Text:', minerals);
        const mineralsVal = parseInt(minerals.split('/')[0]);
        expect(mineralsVal).toBeGreaterThanOrEqual(50);
    });

    test('should allow building a Solar Array', async ({ page }) => {
        // Find Solar Array button in build menu
        const buildBtn = page.locator('.ep-build-btn').filter({ hasText: 'Solar Array' });
        await expect(buildBtn).toBeVisible();

        // Click to select
        await buildBtn.click();

        // Should notify "Select a tile"
        // Then click anywhere on the planet (center of screen)
        // Canvas is full screen, click center
        await page.mouse.click(400, 300); // Approximate center

        // Wait for construction or resource update
        await page.waitForTimeout(2000);

        // Verify resource decrease?
        // Or check notification "Constructed!"
    });
});
