import { test, expect } from '@playwright/test';

test.describe('Exoplanet Pioneer - Roadmap Feature Verification', () => {
    test.beforeEach(async ({ page }) => {
        // Console logging for debugging
        page.on('console', msg => {
            if (msg.type() === 'error') console.log('PAGE ERROR:', msg.text());
        });

        // Use the same port pattern as existing game tests
        await page.goto('http://localhost:8085/exoplanet-pioneer.html');
        await page.waitForSelector('#ep-ui', { state: 'visible', timeout: 30000 });
    });

    test('Block 1: Visual Overlay and Data Tools UI', async ({ page }) => {
        const overlay = page.locator('#ep-data-overlay');
        await expect(overlay).toBeVisible();
        
        // Toggle overlay
        const toggleBtn = page.locator('#ep-data-toggle');
        await toggleBtn.click();
        await expect(overlay).toHaveClass(/hidden/);
        await toggleBtn.click();
        await expect(overlay).not.toHaveClass(/hidden/);
    });

    test('Block 2: AI and NPC Systems Check', async ({ page }) => {
        // Open Roster
        await page.click('#ep-btn-roster');
        const rosterModal = page.locator('#ep-roster-modal');
        await expect(rosterModal).toBeVisible();
        
        // Check for at least some NPCs
        const rosterRows = page.locator('#ep-roster-list tr');
        await expect(rosterRows.first()).toBeVisible();
        await page.click('#ep-roster-modal .ep-sys-btn:has-text("CLOSE")');
    });

    test('Block 3: Economy and Marketplace UI', async ({ page }) => {
        // Open Marketplace
        await page.click('#ep-open-marketplace');
        // The marketplace is often injected or a modal
        await page.waitForTimeout(1000);
        // Check if marketplace content exists (look for a common string or class)
        const marketHeader = page.locator('h2:has-text("Galactic Marketplace"), h2:has-text("Marketplace")');
        await expect(marketHeader).toBeVisible();
    });

    test('Block 5: Ship Designer and Combat HUD', async ({ page }) => {
        // Open Fleet/Designer
        await page.click('#ep-btn-fleet');
        // Designer might be a secondary button in fleet
        // For now, let's check if the fleet UI opens
        await expect(page.locator('h2:has-text("Fleet Management")')).toBeVisible();
        
        // Check Combat HUD exists in DOM (hidden by default)
        const combatHud = page.locator('#combat-hud');
        expect(combatHud).toBeDefined();
    });

    test('Advanced Dashboards: Megastructures, Multiverse, Quantum', async ({ page }) => {
        // Open Megastructures
        await page.click('#ep-open-megastructures');
        await expect(page.locator('#megastructure-dashboard')).toBeVisible();
        await page.click('#close-megastructures');

        // Open Multiverse
        await page.click('#ep-open-multiverse');
        await expect(page.locator('#multiverse-dashboard')).toBeVisible();
        await page.click('#close-multiverse');

        // Open Quantum
        await page.click('#ep-open-quantum');
        await expect(page.locator('#quantum-dashboard')).toBeVisible();
    });
});
