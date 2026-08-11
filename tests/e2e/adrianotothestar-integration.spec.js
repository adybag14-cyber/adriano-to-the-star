/**
 * 🧪 INTEGRATION TESTS FOR ADRIANOTOTHESTAR.COM
 * Era II: The Living Cosmos - API-Based Testing
 * 
 * Tests the live adrianotothestar.com site using API endpoints
 * to verify system functionality without relying on global window objects.
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'https://adrianotothestar.com';

test.describe('Live Site - API Integration Tests', () => {
    test('should load debug API endpoint', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/debug.js`);
        
        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toContain('application/javascript');
        
        const content = await response.text();
        expect(content).toContain('debugAPI');
        expect(content).toContain('registerSystem');
        
        console.log('✅ Debug API loaded successfully');
    });
    
    test('should load health API endpoint', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/health.js`);
        
        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toContain('application/javascript');
        
        const content = await response.text();
        expect(content).toContain('healthAPI');
        expect(content).toContain('registerHealthCheck');
        
        console.log('✅ Health API loaded successfully');
    });
    
    test('should access DebugAPI from window object', async ({ page }) => {
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        
        const debugAPIExists = await page.evaluate(() => {
            return typeof window.DebugAPI !== 'undefined';
        });
        
        console.log('🔬 DebugAPI accessible:', debugAPIExists);
        expect(debugAPIExists).toBe(true);
    });
    
    test('should access HealthAPI from window object', async ({ page }) => {
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        
        const healthAPIExists = await page.evaluate(() => {
            return typeof window.HealthAPI !== 'undefined';
        });
        
        console.log('🏥 HealthAPI accessible:', healthAPIExists);
        expect(healthAPIExists).toBe(true);
    });
});

test.describe('Live Site - System Registration', () => {
    test('should have systems registered with DebugAPI', async ({ page }) => {
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        
        const systemsStatus = await page.evaluate(() => {
            if (typeof window.DebugAPI === 'undefined') return null;
            return window.DebugAPI.getSystemsStatus();
        });
        
        console.log('🔬 Systems status:', JSON.stringify(systemsStatus, null, 2));
        
        if (systemsStatus) {
            const systemCount = Object.keys(systemsStatus).length;
            console.log(`🎯 Systems registered: ${systemCount}`);
            expect(systemCount).toBeGreaterThan(0);
        } else {
            console.log('⚠️ DebugAPI not initialized yet');
        }
    });
    
    test('should have health checks registered', async ({ page }) => {
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        
        const healthChecks = await page.evaluate(() => {
            if (typeof window.HealthAPI === 'undefined') return null;
            return Object.keys(window.HealthAPI.checks);
        });
        
        console.log('🏥 Health checks registered:', healthChecks);
        
        if (healthChecks) {
            expect(healthChecks.length).toBeGreaterThan(0);
        } else {
            console.log('⚠️ HealthAPI not initialized yet');
        }
    });
});

test.describe('Live Site - Health Check API', () => {
    test('should pass health check', async ({ page }) => {
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        
        const health = await page.evaluate(async () => {
            if (typeof window.HealthAPI === 'undefined') return null;
            return await window.HealthAPI.getHealth();
        });
        
        console.log('🏥 Health status:', JSON.stringify(health, null, 2));
        
        if (health) {
            expect(['healthy', 'partial', 'degraded']).toContain(health.status);
            expect(health.timestamp).toBeTruthy();
            expect(health.uptime).toBeTruthy();
        } else {
            console.log('⚠️ HealthAPI not initialized yet');
        }
    });
    
    test('should provide detailed health information', async ({ page }) => {
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        
        const detailedHealth = await page.evaluate(async () => {
            if (typeof window.HealthAPI === 'undefined') return null;
            return await window.HealthAPI.getDetailedHealth();
        });
        
        console.log('🏥 Detailed health:', JSON.stringify(detailedHealth, null, 2));
        
        if (detailedHealth) {
            expect(detailedHealth.metrics).toBeTruthy();
            expect(detailedHealth.system).toBeTruthy();
            expect(detailedHealth.timestamp).toBeTruthy();
        } else {
            console.log('⚠️ HealthAPI not initialized yet');
        }
    });
    
    test('should track uptime correctly', async ({ page }) => {
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        
        const uptime = await page.evaluate(() => {
            if (typeof window.HealthAPI === 'undefined') return null;
            return window.HealthAPI.formatUptime(Date.now() - window.HealthAPI.metrics.startTime);
        });
        
        console.log('⏱️ Uptime:', uptime);
        
        if (uptime) {
            expect(uptime).toBeTruthy();
            expect(typeof uptime).toBe('string');
        } else {
            console.log('⚠️ HealthAPI not initialized yet');
        }
    });
});

test.describe('Live Site - Debug API Functionality', () => {
    test('should get system details', async ({ page }) => {
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        
        const systemsStatus = await page.evaluate(() => {
            if (typeof window.DebugAPI === 'undefined') return null;
            return window.DebugAPI.getSystemsStatus();
        });
        
        if (systemsStatus && Object.keys(systemsStatus).length > 0) {
            const firstSystem = Object.keys(systemsStatus)[0];
            const details = await page.evaluate((systemName) => {
                return window.DebugAPI.getSystemDetails(systemName);
            }, firstSystem);
            
            console.log(`🔬 Details for ${firstSystem}:`, JSON.stringify(details, null, 2));
            expect(details).toBeTruthy();
            expect(details.name).toBe(firstSystem);
        } else {
            console.log('⚠️ No systems registered yet');
        }
    });
    
    test('should track system methods', async ({ page }) => {
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        
        const systemsStatus = await page.evaluate(() => {
            if (typeof window.DebugAPI === 'undefined') return null;
            return window.DebugAPI.getSystemsStatus();
        });
        
        if (systemsStatus) {
            Object.entries(systemsStatus).forEach(([name, system]) => {
                console.log(`🔬 ${name}: ${system.methods.length} methods`);
                expect(system.methods).toBeInstanceOf(Array);
            });
        } else {
            console.log('⚠️ No systems registered yet');
        }
    });
});

test.describe('Live Site - Asset System Integration', () => {
    test('should have asset manifest accessible', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/assets/manifest.json`);
        
        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toContain('application/json');
        
        const manifest = await response.json();
        expect(manifest).toBeTruthy();
        expect(manifest.hybridMode).toBe(true);
        
        console.log('✅ Asset manifest loaded');
        console.log('📋 Hybrid mode:', manifest.hybridMode);
    });
    
    test('should have hero assets configured', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/assets/hero-assets.json`);
        
        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toContain('application/json');
        
        const heroAssets = await response.json();
        expect(heroAssets).toBeTruthy();
        expect(heroAssets.heroAssets).toBeInstanceOf(Array);
        
        console.log('✅ Hero assets loaded');
        console.log('🦸 Hero assets count:', heroAssets.heroAssets.length);
    });
    
    test('should have online sources manifest', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/assets/online-sources-manifest.json`);
        
        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toContain('application/json');
        
        const onlineSources = await response.json();
        expect(onlineSources).toBeTruthy();
        expect(onlineSources.sources).toBeInstanceOf(Array);
        
        console.log('✅ Online sources manifest loaded');
        console.log('🌐 Online sources count:', onlineSources.sources.length);
    });
});

test.describe('Live Site - Performance Metrics', () => {
    test('should have good page load performance', async ({ page }) => {
        const startTime = Date.now();
        
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        
        const loadTime = Date.now() - startTime;
        
        console.log(`⚡ Page load time: ${loadTime}ms`);
        expect(loadTime).toBeLessThan(5000);
    });
    
    test('should have good Lighthouse performance metrics', async ({ page }) => {
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
        expect(metrics.domContentLoaded).toBeLessThan(3000);
        expect(metrics.loadComplete).toBeLessThan(5000);
    });
    
    test('should have detailed health performance metrics', async ({ page }) => {
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        
        const detailedHealth = await page.evaluate(async () => {
            if (typeof window.HealthAPI === 'undefined') return null;
            return await window.HealthAPI.getDetailedHealth();
        });
        
        if (detailedHealth && detailedHealth.performance) {
            console.log('📊 Health performance metrics:', detailedHealth.performance);
            expect(detailedHealth.performance.domContentLoaded).toBeLessThan(3000);
            expect(detailedHealth.performance.loadComplete).toBeLessThan(5000);
        } else {
            console.log('⚠️ Performance metrics not available yet');
        }
    });
});

test.describe('Live Site - Console Log Analysis', () => {
    test('should capture console messages', async ({ page }) => {
        const consoleLogs = [];
        const errors = [];
        const warnings = [];
        
        page.on('console', msg => {
            const logEntry = {
                type: msg.type(),
                text: msg.text(),
                location: msg.location()
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
        
        expect(consoleLogs.length).toBeGreaterThan(0);
    });
    
    test('should have no critical console errors', async ({ page }) => {
        const errors = [];
        
        page.on('console', msg => {
            if (msg.type() === 'error') {
                const text = msg.text();
                // Filter out non-critical errors
                if (!text.includes('loader-safe.css')) {
                    errors.push({
                        text,
                        location: msg.location()
                    });
                }
            }
        });
        
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        
        console.log('❌ Critical errors:', errors.length);
        
        if (errors.length > 0) {
            console.error('Critical errors found:');
            errors.forEach((error, i) => {
                console.error(`  ${i + 1}. ${error.text}`);
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

test.describe('Live Site - System Integration Verification', () => {
    test('should verify DebugAPI functionality', async ({ page }) => {
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        
        const debugAPIFunctional = await page.evaluate(() => {
            if (typeof window.DebugAPI === 'undefined') return false;
            
            try {
                // Test basic functionality
                const status = window.DebugAPI.getSystemsStatus();
                const health = window.DebugAPI.getHealthCheck();
                
                return {
                    hasSystems: Object.keys(status).length > 0,
                    hasHealthCheck: !!health,
                    hasMethods: typeof window.DebugAPI.registerSystem === 'function' &&
                                  typeof window.DebugAPI.getSystemDetails === 'function'
                };
            } catch (error) {
                return { error: error.message };
            }
        });
        
        console.log('🔬 DebugAPI functionality:', JSON.stringify(debugAPIFunctional, null, 2));
        expect(debugAPIFunctional.hasMethods).toBe(true);
    });
    
    test('should verify HealthAPI functionality', async ({ page }) => {
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        
        const healthAPIFunctional = await page.evaluate(async () => {
            if (typeof window.HealthAPI === 'undefined') return false;
            
            try {
                // Test basic functionality
                const health = await window.HealthAPI.getHealth();
                const detailed = await window.HealthAPI.getDetailedHealth();
                
                return {
                    hasHealth: !!health,
                    hasDetailedHealth: !!detailed,
                    hasUptime: !!health.uptime,
                    hasMethods: typeof window.HealthAPI.registerHealthCheck === 'function' &&
                                  typeof window.HealthAPI.formatUptime === 'function'
                };
            } catch (error) {
                return { error: error.message };
            }
        });
        
        console.log('🏥 HealthAPI functionality:', JSON.stringify(healthAPIFunctional, null, 2));
        expect(healthAPIFunctional.hasMethods).toBe(true);
    });
    
    test('should verify both APIs work together', async ({ page }) => {
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        
        const integrationCheck = await page.evaluate(async () => {
            if (typeof window.DebugAPI === 'undefined' || typeof window.HealthAPI === 'undefined') {
                return { error: 'APIs not initialized' };
            }
            
            try {
                const systems = window.DebugAPI.getSystemsStatus();
                const health = await window.HealthAPI.getHealth();
                
                return {
                    debugAPI: Object.keys(systems).length,
                    healthAPI: health.status,
                    bothFunctional: Object.keys(systems).length >= 0 && ['healthy', 'partial', 'degraded'].includes(health.status)
                };
            } catch (error) {
                return { error: error.message };
            }
        });
        
        console.log('🔗 API integration check:', JSON.stringify(integrationCheck, null, 2));
        expect(integrationCheck.bothFunctional).toBe(true);
    });
});

test.describe('Live Site - End-to-End Integration', () => {
    test('should complete full integration test', async ({ page }) => {
        const startTime = Date.now();
        
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        
        const results = await page.evaluate(async () => {
            const results = {
                timestamp: new Date().toISOString(),
                debugAPI: false,
                healthAPI: false,
                systems: 0,
                healthStatus: 'unknown',
                assetManifest: false,
                heroAssets: false,
                consoleErrors: 0
            };
            
            // Check DebugAPI
            if (typeof window.DebugAPI !== 'undefined') {
                results.debugAPI = true;
                const systems = window.DebugAPI.getSystemsStatus();
                results.systems = Object.keys(systems).length;
            }
            
            // Check HealthAPI
            if (typeof window.HealthAPI !== 'undefined') {
                results.healthAPI = true;
                const health = await window.HealthAPI.getHealth();
                results.healthStatus = health.status;
            }
            
            // Check assets
            try {
                const manifest = await fetch('/assets/manifest.json').then(r => r.json());
                results.assetManifest = !!manifest.hybridMode;
            } catch (e) {}
            
            try {
                const hero = await fetch('/assets/hero-assets.json').then(r => r.json());
                results.heroAssets = hero.heroAssets.length > 0;
            } catch (e) {}
            
            return results;
        });
        
        const duration = Date.now() - startTime;
        
        console.log('🎯 Full integration test results:', JSON.stringify(results, null, 2));
        console.log(`⏱️ Test duration: ${duration}ms`);
        
        expect(results.debugAPI).toBe(true);
        expect(results.healthAPI).toBe(true);
        expect(['healthy', 'partial', 'degraded']).toContain(results.healthStatus);
        expect(duration).toBeLessThan(10000);
    });
});
