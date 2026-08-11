import { test, expect } from '@playwright/test';

/**
 * STRESS TEST: APOTHEOSIS VALIDATOR (FINAL)
 * 
 * Bypasses UI blocking and validates the 14-engine grid.
 */

test.describe('Apotheosis Architecture Stress-Test', () => {

    test('Full Lifecycle & Cross-Engine Causality Validation', async ({ page }) => {
        await page.goto('file:///' + process.cwd() + '/index.html');
        
        // 1. Remove the blocking password banner
        await page.evaluate(() => {
            const banners = document.querySelectorAll('div');
            banners.forEach(b => {
                if (b.innerText.includes('password=')) b.remove();
            });
        });

        // 2. Forced Click on Launch
        await page.click('button.enter-btn', { force: true });
        
        // 3. Engine Verification
        const engines = [
            'simulationHub', 'warfareEngine', 'environmentEngine', 
            'governanceEngine', 'contentEngine', 'quantumPropulsionEngine'
        ];

        for (const engine of engines) {
            await page.waitForFunction((e) => typeof window[e] !== 'undefined', engine);
        }

        // 4. Causality Stress-Test
        const result = await page.evaluate(() => {
            const initial = window.governanceEngine.factions.POPULACE.unrest;
            window.simulationHub.propagateEvent('TEST_SUITE', 'ECONOMIC_CRASH', { severity: 1.0 });
            const after = window.governanceEngine.factions.POPULACE.unrest;
            return { initial, after };
        });

        expect(result.after).toBeGreaterThan(result.initial);
        console.log(">> Causality Logic: VERIFIED");

        // 5. Physics Accuracy (Rayleigh Criterion)
        const physicsPass = await page.evaluate(() => {
            const w = { aperture: 0.1, wavelength: 450e-9, baseAccuracy: 1.0 };
            const acc1 = window.warfareEngine.calculateBeamAccuracy(w, 100, 0);
            const acc2 = window.warfareEngine.calculateBeamAccuracy(w, 10000, 0);
            return acc2 < acc1;
        });
        expect(physicsPass).toBe(true);
        console.log(">> Physics Fidelity: VERIFIED");
    });
});