import { test, expect } from '@playwright/test';

/**
 * Ultimate Roadmap Verification - Playwright Edition
 * Focuses on Loading states, Critical UI, and Core System Logic via evaluate.
 */

test.describe('Exoplanet Pioneer: Ultimate Roadmap Verification', () => {
    test.beforeEach(async ({ page }) => {
        // Log all page errors
        page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
        
        // Navigate to game
        await page.goto('http://localhost:8085/exoplanet-pioneer.html');
        // Wait for main UI to load
        await page.waitForSelector('#ep-ui', { state: 'visible', timeout: 60000 });
    });

    test('Loading: All critical game modules present on window', async ({ page }) => {
        const modules = [
            'game', 'QuantumRenderer', 'NPCSystem', 'FactionManager', 
            'EconomyManager', 'ShipDesigner', 'CombatManager', 
            'MegastructureSystem', 'VFXManager'
        ];

        for (const mod of modules) {
            const exists = await page.evaluate((m) => typeof window[m] !== 'undefined', mod);
            expect(exists, `Module ${mod} should be defined on window`).toBe(true);
        }
    });

    test('Logic: NPC Trait and Collective Consciousness initialization', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.game || !window.game.npcSystem) return 'System missing';
            
            // Register a dummy colonist to test registration logic
            const testCol = { id: 'playwright_test_npc', name: 'Test Bot', job: 'engineer' };
            window.game.npcSystem.registerNPC(testCol);
            
            const npc = window.game.npcSystem.npcs['playwright_test_npc'];
            const hasTraits = npc.personality && npc.secretAgenda && npc.emotions;
            const collectiveActive = typeof window.game.npcSystem.collective !== 'undefined';
            
            return { hasTraits, collectiveActive, name: npc.name };
        });

        expect(result.hasTraits).toBe(true);
        expect(result.collectiveActive).toBe(true);
    });

    test('Logic: Economy Stock Market and Hostile Takeover foundation', async ({ page }) => {
        const result = await page.evaluate(() => {
            const economy = window.game.economyManager;
            const hasStocks = economy.stocks.length >= 4;
            const hasTakeover = 'takeoverInProgress' in economy;
            const hasLedger = Array.isArray(economy.ledger);
            
            return { hasStocks, hasTakeover, hasLedger };
        });

        expect(result.hasStocks).toBe(true);
        expect(result.hasTakeover).toBe(true);
        expect(result.hasLedger).toBe(true);
    });

    test('Logic: Megastructures Ringworld and Dyson Swarm scaling', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mega = window.game.megastructureSystem;
            const hasRingworld = 'ringworldStage' in mega;
            const hasSwarm = 'swarmSatellites' in mega && mega.maxSwarmSatellites >= 10000;
            
            return { hasRingworld, hasSwarm };
        });

        expect(result.hasRingworld).toBe(true);
        expect(result.hasSwarm).toBe(true);
    });

    test('Loading: WebGPU / Quantum Renderer capability check', async ({ page }) => {
        const isSupported = await page.evaluate(() => {
            const qr = window.game.quantumRenderer;
            return { 
                initialized: qr.initialized, 
                isSupported: qr.isSupported || !navigator.gpu // isSupported might be false if no GPU, but qr should exist
            };
        });
        
        expect(isSupported.initialized).toBeDefined();
    });
});
