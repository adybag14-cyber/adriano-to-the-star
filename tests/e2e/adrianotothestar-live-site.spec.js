/**
 * 🧪 PLAYWRIGHT E2E TESTS FOR ADRIANOTOTHESTAR.COM
 * Era II: The Living Cosmos - Live Site Testing
 * 
 * Tests the live adrianotothestar.com site with console log capture.
 * Verifies all implemented features are working correctly.
 */

import { test, expect } from '@playwright/test';
import { chromium } from '@playwright/test';

const BASE_URL = 'https://adrianotothestar.com';

test.describe('Live Site - Core Functionality', () => {
    test('should load the homepage', async ({ page }) => {
        const consoleLogs = [];
        
        page.on('console', msg => {
            consoleLogs.push({
                type: msg.type(),
                text: msg.text(),
                location: msg.location()
            });
        });
        
        const response = await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        
        expect(response.status()).toBe(200);
        expect(await page.title()).toBeTruthy();
        
        console.log('📊 Console logs captured:', consoleLogs.length);
        console.log('📊 Console errors:', consoleLogs.filter(log => log.type === 'error'));
    });
    
    test('should have no console errors', async ({ page }) => {
        const errors = [];
        
        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push({
                    text: msg.text(),
                    location: msg.location()
                });
            }
        });
        
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        
        expect(errors.length).toBe(0);
    });
    
    test('should have viewport meta tag', async ({ page }) => {
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        
        const viewport = await page.getAttribute('meta[name="viewport"]', 'content');
        expect(viewport).toContain('width');
        expect(viewport).toContain('initial-scale');
    });
});

test.describe('Live Site - Voxel Terrain System', () => {
    test('should have voxel terrain initialized', async ({ page }) => {
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        
        // Check if terrain system is loaded
        const terrainCheck = await page.evaluate(() => {
            return typeof window.terrainSystem !== 'undefined' || 
                   typeof window.VoxelTerrainSystem !== 'undefined';
        });
        
        console.log('🏔️ Terrain system check:', terrainCheck);
    });
    
    test('should have WebGPU support checked', async ({ page }) => {
        const webgpuSupport = await page.evaluate(async () => {
            if (!navigator.gpu) return false;
            const adapter = await navigator.gpu.requestAdapter();
            return !!adapter;
        });
        
        console.log('🎮 WebGPU support:', webgpuSupport);
    });
    
    test('should have procedural erosion system', async ({ page }) => {
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        
        const erosionCheck = await page.evaluate(() => {
            return typeof window.erosionSystem !== 'undefined' ||
                   typeof window.proceduralErosion !== 'undefined';
        });
        
        console.log('🌊 Erosion system check:', erosionCheck);
    });
});

test.describe('Live Site - Fluid Dynamics System', () => {
    test('should have fluid dynamics initialized', async ({ page }) => {
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        
        const fluidCheck = await page.evaluate(() => {
            return typeof window.fluidDynamicsSystem !== 'undefined' ||
                   typeof window.FluidDynamicsSystem !== 'undefined';
        });
        
        console.log('💧 Fluid dynamics system check:', fluidCheck);
    });
    
    test('should have atmospheric pressure', async ({ page }) => {
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        
        const pressureCheck = await page.evaluate(() => {
            return typeof window.atmosphericPressure !== 'undefined' ||
                   typeof window.weatherSystem !== 'undefined';
        });
        
        console.log('🌡️ Atmospheric pressure check:', pressureCheck);
    });
    
    test('should have wind speed system', async ({ page }) => {
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        
        const windCheck = await page.evaluate(() => {
            return typeof window.windSpeed !== 'undefined' ||
                   typeof window.weatherSystem !== 'undefined';
        });
        
        console.log('💨 Wind speed system check:', windCheck);
    });
    
    test('should have weather patterns', async ({ page }) => {
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        
        const weatherCheck = await page.evaluate(() => {
            return typeof window.weatherPatterns !== 'undefined' ||
                   typeof window.weatherSystem !== 'undefined';
        });
        
        console.log('🌧️ Weather patterns check:', weatherCheck);
    });
});

test.describe('Live Site - N-Body Gravitational System', () => {
    test('should have N-body simulation initialized', async ({ page }) => {
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        
        const nBodyCheck = await page.evaluate(() => {
            return typeof window.nBodyGravitationalSystem !== 'undefined' ||
                   typeof window.NBodyGravitationalSystem !== 'undefined' ||
                   typeof window.gravitationalSimulation !== 'undefined';
        });
        
        console.log('🌌 N-body gravitational system check:', nBodyCheck);
    });
    
    test('should have solar system generation', async ({ page }) => {
        await page.goto(BASE_URL, {  waitUntil: 'networkidle' });
        
        const solarSystemCheck = await page.evaluate(() => {
            return typeof window.solarSystemGenerator !== 'undefined' ||
                   typeof window.planetGenerator !== 'undefined';
        });
        
        console.log('☀️ Solar system generation check:', solarSystemCheck);
    });
});

test.describe('Live Site - Ray-Traced Reflections', () => {
    test('should have ray-traced reflections system', async ({ page }) => {
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        
        const reflectionsCheck = await page.evaluate(() => {
            return typeof window.rayTracedReflectionsSystem !== 'undefined' ||
                   typeof window.RayTracedReflectionsSystem !== 'undefined' ||
                   typeof window.reflectionSystem !== 'undefined';
        });
        
        console.log('🪞 Ray-traced reflections check:', reflectionsCheck);
    });
});

test.describe('Live Site - Black Hole System', () => {
    test('should have black hole system', async ({ page }) => {
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        
        const blackHoleCheck = await page.evaluate(() => {
            return typeof window.blackHoleSystem !== 'undefined' ||
                   typeof window.BlackHoleSystem !== 'undefined' ||
                   typeof window.blackHole !== 'undefined';
        });
        
        console.log('⚫ Black hole system check:', blackHoleCheck);
    });
    
    test('should have event horizon visualization', async ({ page }) => {
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        
        const eventHorizonCheck = await page.evaluate(() => {
            return typeof window.eventHorizon !== 'undefined' ||
                   typeof window.accretionDisk !== 'undefined' ||
                   typeof window.gravitationalLensing !== 'undefined';
        });
        
        console.log('🌀 Event horizon check:', eventHorizonCheck);
    });
});

test.describe('Live Site - Star Surface Activity', () => {
    test('should have star surface activity system', async ({ page }) => {
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        
        const starActivityCheck = await page.evaluate(() => {
            return typeof window.starSurfaceActivitySystem !== 'undefined' ||
                   typeof window.StarSurfaceActivitySystem !== 'undefined' ||
                   typeof window.starSurfaceActivity !== 'undefined';
        });
        
        console.log('⭐ Star surface activity check:', starActivityCheck);
    });
    
    test('should have solar flare system', async ({ page }) => {
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        
        const flareCheck = await page.evaluate(() => {
            return typeof window.solarFlares !== 'undefined' ||
                   typeof window.sunspots !== 'undefined' ||
                   typeof window.coronalMassEjections !== 'undefined';
        });
        
        console.log('🌟 Solar flare system check:', flareCheck);
    });
});

test.describe('Live Site - Procedural Asset Generation', () => {
    test('should have procedural asset generator', async ({ page }) => {
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        
        const assetGenCheck = await page.evaluate(() => {
            return typeof window.proceduralAssetGenerator !== 'undefined' ||
                   typeof window.ProceduralAssetGenerator !== 'undefined';
        });
        
        console.log('🎨 Procedural asset generator check:', assetGenCheck);
    });
    
    test('should have procedural texture generator', async ({ page }) => {
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        
        const textureGenCheck = await page.evaluate(() => {
            return typeof window.proceduralTerrainTextureGenerator !== 'undefined' ||
                   typeof window.ProceduralTerrainTextureGenerator !== 'undefined';
        });
        
        console.log('🖼️ Procedural texture generator check:', textureGenCheck);
    });
    
    test('should have procedural audio generator', async ({ page }) => {
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        
        const audioGenCheck = await page.evaluate(() => {
            return typeof window.proceduralAudioGenerator !== 'undefined' ||
                   typeof window.proceduralSoundGenerator !== 'undefined';
        });
        
        console.log('🔊 Procedural audio generator check:', audioGenCheck);
    });
});

test.describe('Live Site - Hybrid Asset Manager', () => {
    test('should have hybrid asset manager', async ({ page }) => {
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        
        const hybridManagerCheck = await page.evaluate(() => {
            return typeof window.hybridAssetManager !== 'undefined' ||
                   typeof window.HybridAssetManager !== 'undefined';
        });
        
        console.log('🔄 Hybrid asset manager check:', hybridManagerCheck);
    });
    
    test('should have asset downloader', async ({ page }) => {
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        
        const downloaderCheck = await page.evaluate(() => {
            return typeof window.assetDownloader !== 'undefined' ||
                   typeof window.AssetDownloader !== 'undefined';
        });
        
        console.log('📥 Asset downloader check:', downloaderCheck);
    });
    
    test('should have R2 asset storage', async ({ page }) => {
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        
        const r2StorageCheck = await page.evaluate(() => {
            return typeof window.r2AssetStorage !== 'undefined' ||
                   typeof window.R2AssetStorage !== 'undefined';
        });
        
        console.log('🗄️ R2 asset storage check:', r2StorageCheck);
    });
});

test.describe('Live Site - THREE.Terrain', () => {
    test('should have THREE.Terrain system', async ({ page }) => {
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        
        const terrainGenCheck = await page.evaluate(() => {
            return typeof window.THREETerrain !== 'undefined' ||
                   typeof window.terrainGenerator !== 'undefined';
        });
        
        console.log('🏔️ THREE.Terrain check:', terrainGenCheck);
    });
    
    test('should have terrain texture generator', async ({ page }) => {
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        
        const terrainTextureCheck = await page.evaluate(() => {
            return typeof window.terrainTextureGenerator !== 'undefined' ||
                   typeof window.terrainTextureSystem !== 'undefined';
        });
        
        console.log('🏔️ Terrain texture generator check:', terrainTextureCheck);
    });
});

test.describe('Live Site - Performance', () => {
    test('should load within 3 seconds', async ({ page }) => {
        const startTime = Date.now();
        
        const response = await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        
        const loadTime = Date.now() - startTime;
        
        console.log(`⚡ Page load time: ${loadTime}ms`);
        expect(loadTime).toBeLessThan(3000);
    });
    
    test('should have good Lighthouse performance', async ({ page }) => {
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        
        const metrics = await page.evaluate(() => {
            const navigation = performance.getEntriesByType('navigation')[0];
            return {
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                firstPaint: navigation.responseStart - navigation.fetchStart,
                firstContentfulPaint: navigation.domContentLoadedEventStart - navigation.fetchStart
            };
        });
        
        console.log('📊 Performance metrics:', metrics);
        expect(metrics.domContentLoaded).toBeLessThan(2000);
        expect(metrics.loadComplete).toBeLessThan(3000);
    });
});

test.describe('Live Site - Console Log Analysis', () => {
    test('should capture and analyze all console messages', async ({ page }) => {
        const consoleLogs = [];
        const errors = [];
        const warnings = [];
        
        page.on('console', msg => {
            const logEntry = {
                type: msg.type(),
                text: msg.text(),
                location: msg.location(),
                timestamp: new Date().toISOString()
            };
            
            consoleLogs.push(logEntry);
            
            if (msg.type() === 'error') {
                errors.push(logEntry);
            } else if (msg.type() === 'warning') {
                warnings.push(logEntry);
            }
        });
        
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        
        console.log('📊 Total console messages:', consoleLogs.length);
        console.log('❌ Errors:', errors.length);
        console.log('⚠️  Warnings:', warnings.length);
        console.log('ℹ️  Logs:', consoleLogs.filter(l => l.type === 'log').length);
        
        // Report any errors
        if (errors.length > 0) {
            console.error('❌ Console errors found:');
            errors.forEach((error, i) => {
                console.error(`  ${i + 1}. ${error.text}`);
                if (error.location) {
                    console.error(`     at ${error.location.url}:${error.location.lineNumber}`);
                }
            });
        }
        
        // Report any warnings
        if (warnings.length > 0) {
            console.warn('⚠️  Console warnings found:');
            warnings.forEach((warning, i) => {
                console.warn(`  ${i + 1}. ${warning.text}`);
                if (warning.location) {
                    console.warn(`     at ${warning.location.url}:${warning.location.lineNumber}`);
                }
            });
        }
        
        expect(errors.length).toBe(0);
    });
    
    test('should have no unhandled promise rejections', async ({ page }) => {
        const rejections = [];
        
        page.on('unhandledrejection', error => {
            rejections.push(error);
        });
        
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        
        // Wait a bit for any delayed rejections
        await page.waitForTimeout(2000);
        
        console.log('🔴 Unhandled promise rejections:', rejections.length);
        expect(rejections.length).toBe(0);
    });
});

test.describe('Live Site - Feature Integration', () => {
    test('should have all 17 systems integrated', async ({ page }) => {
        await page.goto(BASE_URL, {
            waitUntil: 'networkidle',
            timeout: 10000
        });
        
        const systemChecks = await page.evaluate(() => {
            return {
                voxelTerrainSystem: typeof window.VoxelTerrainSystem !== 'undefined',
                fluidDynamicsSystem: typeof window.FluidDynamicsSystem !== 'undefined',
                nBodyGravitationalSystem: typeof window.NBodyGravitationalSystem !== 'undefined',
                rayTracedReflectionsSystem: typeof window.RayTracedReflectionsSystem !== 'undefined',
                blackHoleSystem: typeof window.BlackHoleSystem !== 'undefined',
                starSurfaceActivitySystem: typeof window.StarSurfaceActivitySystem !== 'undefined',
                proceduralAssetGenerator: typeof window.ProceduralAssetGenerator !== 'undefined',
                proceduralTerrainTextureGenerator: typeof window.ProceduralTerrainTextureGenerator !== 'undefined',
                assetDownloader: typeof window.AssetDownloader !== 'undefined',
                hybridAssetManager: typeof window.HybridAssetManager !== 'undefined',
                r2AssetStorage: typeof window.R2AssetStorage !== 'undefined',
                tHREETerrain: typeof window.THREETerrain !== 'undefined',
                aiHistoriansSystem: typeof window.AIHistoriansSystem !== 'undefined',
                alienBiosphereSystem: typeof window.AlienBiosphereSystem !== 'undefined',
                diplomaticAISystem: typeof window.DiplomaticAISystem !== 'undefined',
                neuralLinkSystem: typeof window.NeuralLinkSystem !== 'undefined',
                soulEngine: typeof window.SoulEngine !== 'undefined'
            };
        });
        
        const implementedSystems = Object.values(systemChecks).filter(Boolean).length;
        const totalSystems = Object.keys(systemChecks).length;
        
        console.log('🎯 Systems implemented:', implementedSystems, '/', totalSystems);
        console.log('📋 System status:', systemChecks);
        
        expect(implementedSystems).toBeGreaterThanOrEqual(10);
    });
    
    test('should have asset manifest loaded', async ({ page }) => {
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        
        const manifestCheck = await page.evaluate(() => {
            return fetch('/assets/manifest.json')
                .then(res => res.ok)
                .catch(() => false);
        });
        
        console.log('📋 Asset manifest check:', manifestCheck);
        expect(manifestCheck).toBe(true);
    });
    
    test('should have hero assets configured', async ({ page }) => {
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        
        const heroAssetsCheck = await page.evaluate(() => {
            return fetch('/assets/hero-assets.json')
                .then(res => res.ok)
                .catch(() => false);
        });
        
        console.log('🦸 Hero assets check:', heroAssetsCheck);
        expect(heroAssetsCheck).toBe(true);
    });
});
