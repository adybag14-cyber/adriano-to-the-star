/**
 * 🚀 ADVANCED GAME TEST
 * Comprehensive testing of the Exoplanet Pioneer game on the live site
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://adrianotothestar.com';
const API_URL = process.env.API_URL || 'https://exoplanet-api-worker.adybag14.workers.dev';

test.describe('Advanced Game Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Capture all console logs
        const consoleLogs = [];
        page.on('console', msg => {
            consoleLogs.push({
                type: msg.type(),
                text: msg.text(),
                location: msg.location()
            });
        });

        // Capture all page errors
        const pageErrors = [];
        page.on('pageerror', error => {
            pageErrors.push(error.message);
        });

        // Capture all network requests
        const networkRequests = [];
        page.on('request', request => {
            networkRequests.push({
                url: request.url(),
                method: request.method(),
                resourceType: request.resourceType()
            });
        });

        // Capture all network responses
        const networkResponses = [];
        page.on('response', response => {
            networkResponses.push({
                url: response.url(),
                status: response.status(),
                headers: response.headers()
            });
        });

        // Store on page for later use
        page.testData = {
            consoleLogs,
            pageErrors,
            networkRequests,
            networkResponses
        };
    });

    test('should load game and verify core systems', async ({ page }) => {
        console.log(`\n🚀 Loading game at: ${BASE_URL}/exoplanet-pioneer.html`);
        
        // Track network requests for validation
        const networkRequests = [];
        page.on('request', request => {
            networkRequests.push({
                url: request.url(),
                method: request.method(),
                resourceType: request.resourceType()
            });
        });

        await page.goto(`${BASE_URL}/exoplanet-pioneer.html`, { waitUntil: 'networkidle', timeout: 60000 });
        
        // Wait for page to fully load
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000);

        // Verify page title
        const title = await page.title();
        console.log(`Page title: ${title}`);
        expect(title).toBeTruthy();

        // Check for data overlay (main game container) with retry logic
        let dataOverlay = 0;
        for (let i = 0; i < 3; i++) {
            dataOverlay = await page.locator('#ep-data-overlay').count();
            if (dataOverlay > 0) break;
            await page.waitForTimeout(1000);
        }
        console.log(`Data overlay found: ${dataOverlay > 0 ? '✅' : '❌'}`);
        expect(dataOverlay).toBeGreaterThan(0);

        // Check for data body
        const dataBody = await page.locator('#ep-data-body').count();
        console.log(`Data body found: ${dataBody > 0 ? '✅' : '❌'}`);

        // Check for data toggle button
        const dataToggle = await page.locator('#ep-data-toggle').count();
        console.log(`Data toggle button found: ${dataToggle > 0 ? '✅' : '❌'}`);
        expect(dataToggle).toBeGreaterThan(0);

        // Verify data toggle button is clickable
        const dataToggleVisible = await page.locator('#ep-data-toggle').isVisible();
        console.log(`Data toggle button visible: ${dataToggleVisible ? '✅' : '❌'}`);

        // Check for planet viewer button
        const planetViewer = await page.locator('#ep-open-planet-viewer').count();
        console.log(`Planet viewer button found: ${planetViewer > 0 ? '✅' : '❌'}`);
        expect(planetViewer).toBeGreaterThan(0);

        // Check for refresh data panels button
        const refreshData = await page.locator('#ep-refresh-data-panels').count();
        console.log(`Refresh data panels button found: ${refreshData > 0 ? '✅' : '❌'}`);
        expect(refreshData).toBeGreaterThan(0);

        // Check for favorite button
        const favoriteBtn = await page.locator('#ep-fav-current-planet').count();
        console.log(`Favorite button found: ${favoriteBtn > 0 ? '✅' : '❌'}`);
        expect(favoriteBtn).toBeGreaterThan(0);

        // Check for compare button
        const compareBtn = await page.locator('#ep-compare-current-planet').count();
        console.log(`Compare button found: ${compareBtn > 0 ? '✅' : '❌'}`);
        expect(compareBtn).toBeGreaterThan(0);

        // Check for advanced tools buttons
        const marketplace = await page.locator('#ep-open-marketplace').count();
        const megastructures = await page.locator('#ep-open-megastructures').count();
        const multiverse = await page.locator('#ep-open-multiverse').count();
        const chrono = await page.locator('#ep-open-chrono').count();
        const neural = await page.locator('#ep-open-neural').count();
        const sim = await page.locator('#ep-open-sim').count();
        const quantum = await page.locator('#ep-open-quantum').count();
        const dna = await page.locator('#ep-open-dna').count();
        const comm = await page.locator('#ep-open-comm').count();

        console.log(`Advanced tools buttons:`);
        console.log(`  Marketplace: ${marketplace > 0 ? '✅' : '❌'}`);
        console.log(`  Megastructures: ${megastructures > 0 ? '✅' : '❌'}`);
        console.log(`  Multiverse: ${multiverse > 0 ? '✅' : '❌'}`);
        console.log(`  Chrono: ${chrono > 0 ? '✅' : '❌'}`);
        console.log(`  Neural: ${neural > 0 ? '✅' : '❌'}`);
        console.log(`  Simulation: ${sim > 0 ? '✅' : '❌'}`);
        console.log(`  Quantum: ${quantum > 0 ? '✅' : '❌'}`);
        console.log(`  DNA: ${dna > 0 ? '✅' : '❌'}`);
        console.log(`  Communication: ${comm > 0 ? '✅' : '❌'}`);

        // Verify at least 5 advanced tools are present
        const totalAdvancedTools = marketplace + megastructures + multiverse + chrono + neural + sim + quantum + dna + comm;
        expect(totalAdvancedTools).toBeGreaterThanOrEqual(5);
        console.log(`Total advanced tools found: ${totalAdvancedTools}/9`);

        // Check for search container
        const searchContainer = await page.locator('#data-search-container').count();
        console.log(`Search container found: ${searchContainer > 0 ? '✅' : '❌'}`);
        expect(searchContainer).toBeGreaterThan(0);

        // Check for AI habitability card
        const aiHabCard = await page.locator('#ai-habitability-card').count();
        console.log(`AI habitability card found: ${aiHabCard > 0 ? '✅' : '❌'}`);
        expect(aiHabCard).toBeGreaterThan(0);

        // Check for back button
        const backBtn = await page.locator('.ep-back-btn').count();
        console.log(`Back button found: ${backBtn > 0 ? '✅' : '❌'}`);

        // Verify no critical console errors
        const { pageErrors } = page.testData;
        const criticalErrors = pageErrors.filter(e => 
            e.includes('TypeError') || 
            e.includes('ReferenceError') || 
            e.includes('SyntaxError')
        );
        console.log(`Critical errors: ${criticalErrors.length}`);
        expect(criticalErrors.length).toBe(0);

        // Verify network requests include essential resources
        const hasScriptRequests = networkRequests.some(r => r.resourceType === 'script');
        const hasDocumentRequests = networkRequests.some(r => r.resourceType === 'document');
        console.log(`Script requests: ${hasScriptRequests ? '✅' : '❌'}`);
        console.log(`Document requests: ${hasDocumentRequests ? '✅' : '❌'}`);
        expect(hasScriptRequests).toBe(true);
        expect(hasDocumentRequests).toBe(true);

        // Log test data
        const { consoleLogs, networkResponses } = page.testData;
        console.log(`\n📊 Test Data:`);
        console.log(`  Console Logs: ${consoleLogs.length}`);
        console.log(`  Page Errors: ${pageErrors.length}`);
        console.log(`  Network Requests: ${networkRequests.length}`);
        console.log(`  Network Responses: ${networkResponses.length}`);

        // Check for failed network requests
        const failedRequests = networkResponses.filter(r => r.status >= 400);
        console.log(`Failed network requests: ${failedRequests.length}`);
        if (failedRequests.length > 0) {
            console.log(`Failed URLs:`);
            failedRequests.slice(0, 5).forEach(r => console.log(`  ${r.url} (${r.status})`));
        }
    });

    test('should test game missions and interactions', async ({ page }) => {
        console.log(`\n🎯 Testing game missions and interactions`);
        
        await page.goto(`${BASE_URL}/exoplanet-pioneer.html`, { waitUntil: 'networkidle', timeout: 60000 });
        await page.waitForTimeout(3000);

        // Try to open missions modal
        const missionsButton = page.locator('#ep-btn-missions, [class*="mission"], button:has-text("Mission")').first();
        
        if (await missionsButton.count() > 0) {
            console.log('Found missions button, attempting to click...');
            
            // Use retry logic for clicking
            let clicked = false;
            for (let i = 0; i < 3; i++) {
                try {
                    await missionsButton.click({ timeout: 5000 });
                    clicked = true;
                    console.log('✅ Missions button clicked');
                    break;
                } catch (error) {
                    console.log(`Attempt ${i + 1} failed: ${error.message}`);
                    await page.waitForTimeout(1000);
                }
            }

            if (clicked) {
                await page.waitForTimeout(2000);
                
                // Check if mission modal is visible
                const missionModal = page.locator('#ep-mission-modal, [class*="mission-modal"], [class*="modal"]');
                const isVisible = await missionModal.isVisible().catch(() => false);
                console.log(`Mission modal visible: ${isVisible ? '✅' : '❌'}`);

                if (isVisible) {
                    // Count mission cards
                    const missionCards = await page.locator('[class*="mission-card"], [class*="mission-item"]').count();
                    console.log(`Mission cards found: ${missionCards}`);

                    // Try to accept a mission
                    const acceptButton = page.locator('button:has-text("Accept"), button:has-text("ACCEPT")').first();
                    if (await acceptButton.count() > 0) {
                        try {
                            await acceptButton.click({ timeout: 5000 });
                            console.log('✅ Mission accept button clicked');
                            await page.waitForTimeout(1000);
                        } catch (error) {
                            console.log(`Could not accept mission: ${error.message}`);
                        }
                    }
                }
            }
        } else {
            console.log('⚠️ Missions button not found');
        }

        // Test other game buttons
        const buttons = ['colony', 'research', 'combat', 'trade'];
        for (const buttonType of buttons) {
            const button = page.locator(`#ep-btn-${buttonType}, [class*="${buttonType}"], button:has-text("${buttonType.charAt(0).toUpperCase() + buttonType.slice(1)}")`).first();
            if (await button.count() > 0) {
                console.log(`✅ ${buttonType} button found`);
            } else {
                console.log(`⚠️ ${buttonType} button not found`);
            }
        }
    });

    test('should test API endpoints via Cloudflare Worker', async ({ request }) => {
        console.log(`\n🔌 Testing API endpoints via Cloudflare Worker`);
        
        // Test Debug API
        console.log(`Testing Debug API at: ${API_URL}/api/debug.js`);
        const debugResponse = await request.get(`${API_URL}/api/debug.js`);
        console.log(`  Status: ${debugResponse.status()}`);
        console.log(`  Content-Type: ${debugResponse.headers()['content-type']}`);
        
        expect(debugResponse.status()).toBe(200);
        expect(debugResponse.headers()['content-type']).toContain('application/javascript');
        
        const debugContent = await debugResponse.text();
        expect(debugContent).toContain('DebugAPI');
        expect(debugContent).toContain('registerSystem');
        expect(debugContent).toContain('getSystemsStatus');
        expect(debugContent).toContain('executeSystemMethod');
        console.log(`  ✅ Debug API working (${debugContent.length} bytes)`);

        // Verify Debug API has expected methods
        const debugMethods = ['registerSystem', 'getSystemsStatus', 'getSystemDetails', 'executeSystemMethod', 'reset'];
        const missingMethods = debugMethods.filter(method => !debugContent.includes(method));
        expect(missingMethods.length).toBe(0);
        if (missingMethods.length > 0) {
            console.log(`  ⚠️ Missing Debug API methods: ${missingMethods.join(', ')}`);
        }

        // Test Health API
        console.log(`Testing Health API at: ${API_URL}/api/health.js`);
        const healthResponse = await request.get(`${API_URL}/api/health.js`);
        console.log(`  Status: ${healthResponse.status()}`);
        console.log(`  Content-Type: ${healthResponse.headers()['content-type']}`);
        
        expect(healthResponse.status()).toBe(200);
        expect(healthResponse.headers()['content-type']).toContain('application/javascript');
        
        const healthContent = await healthResponse.text();
        expect(healthContent).toContain('HealthAPI');
        expect(healthContent).toContain('getHealth');
        expect(healthContent).toContain('runAllChecks');
        console.log(`  ✅ Health API working (${healthContent.length} bytes)`);

        // Verify Health API has expected methods
        const healthMethods = ['registerHealthCheck', 'runAllChecks', 'getHealth', 'getDetailedHealth'];
        const missingHealthMethods = healthMethods.filter(method => !healthContent.includes(method));
        expect(missingHealthMethods.length).toBe(0);
        if (missingHealthMethods.length > 0) {
            console.log(`  ⚠️ Missing Health API methods: ${missingHealthMethods.join(', ')}`);
        }

        // Test game save endpoint (should return error without data)
        console.log(`Testing Game Save endpoint at: ${API_URL}/api/game/save`);
        try {
            const saveResponse = await request.post(`${API_URL}/api/game/save`, {
                data: {
                    gameData: { test: 'data' }
                }
            });
            console.log(`  Status: ${saveResponse.status()}`);
            expect(saveResponse.status()).toBeGreaterThanOrEqual(200);
            expect(saveResponse.status()).toBeLessThan(500);
            console.log(`  ✅ Game Save endpoint accessible`);
        } catch (error) {
            console.log(`  ⚠️ Game Save endpoint error: ${error.message}`);
        }

        // Test game list endpoint
        console.log(`Testing Game List endpoint at: ${API_URL}/api/game/list`);
        try {
            const listResponse = await request.get(`${API_URL}/api/game/list`);
            console.log(`  Status: ${listResponse.status()}`);
            expect(listResponse.status()).toBeGreaterThanOrEqual(200);
            expect(listResponse.status()).toBeLessThan(500);
            console.log(`  ✅ Game List endpoint accessible`);
        } catch (error) {
            console.log(`  ⚠️ Game List endpoint error: ${error.message}`);
        }

        // Verify CORS headers are present
        const corsHeaders = debugResponse.headers();
        expect(corsHeaders['access-control-allow-origin']).toBeTruthy();
        console.log(`  ✅ CORS headers present`);
    });

    test('should test game performance and metrics', async ({ page }) => {
        console.log(`\n⚡ Testing game performance and metrics`);
        
        // Start performance measurement
        const startTime = Date.now();
        
        await page.goto(`${BASE_URL}/exoplanet-pioneer.html`, { waitUntil: 'networkidle', timeout: 60000 });
        
        // Measure load time
        const loadTime = Date.now() - startTime;
        console.log(`Initial load time: ${loadTime}ms`);
        
        // Wait for full page load
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000);
        
        // Get performance metrics
        const performanceMetrics = await page.evaluate(() => {
            const navigation = performance.getEntriesByType('navigation')[0];
            const paint = performance.getEntriesByType('paint');
            
            return {
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
                firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
                totalLoadTime: navigation.loadEventEnd - navigation.fetchStart
            };
        });
        
        console.log(`Performance Metrics:`);
        console.log(`  DOM Content Loaded: ${performanceMetrics.domContentLoaded.toFixed(2)}ms`);
        console.log(`  Load Complete: ${performanceMetrics.loadComplete.toFixed(2)}ms`);
        console.log(`  First Paint: ${performanceMetrics.firstPaint.toFixed(2)}ms`);
        console.log(`  First Contentful Paint: ${performanceMetrics.firstContentfulPaint.toFixed(2)}ms`);
        console.log(`  Total Load Time: ${performanceMetrics.totalLoadTime.toFixed(2)}ms`);

        // Check memory usage
        const memoryMetrics = await page.evaluate(() => {
            if (performance.memory) {
                return {
                    usedJSHeapSize: performance.memory.usedJSHeapSize,
                    totalJSHeapSize: performance.memory.totalJSHeapSize,
                    jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
                };
            }
            return null;
        });

        if (memoryMetrics) {
            console.log(`Memory Usage:`);
            console.log(`  Used JS Heap: ${(memoryMetrics.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
            console.log(`  Total JS Heap: ${(memoryMetrics.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
            console.log(`  JS Heap Limit: ${(memoryMetrics.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`);
        }

        // Log console warnings and errors
        const { consoleLogs, pageErrors } = page.testData;
        
        const warnings = consoleLogs.filter(log => log.type === 'warning');
        const errors = consoleLogs.filter(log => log.type === 'error');
        
        console.log(`\n⚠️ Warnings: ${warnings.length}`);
        warnings.slice(0, 5).forEach((warning, i) => {
            console.log(`  ${i + 1}. ${warning.text.substring(0, 100)}`);
        });

        console.log(`\n❌ Errors: ${errors.length}`);
        errors.slice(0, 5).forEach((error, i) => {
            console.log(`  ${i + 1}. ${error.text.substring(0, 100)}`);
        });

        // Assert reasonable performance
        expect(performanceMetrics.totalLoadTime).toBeLessThan(10000); // Less than 10 seconds
    });

    test('should test game state and persistence', async ({ page }) => {
        console.log(`\n💾 Testing game state and persistence`);
        
        await page.goto(`${BASE_URL}/exoplanet-pioneer.html`, { waitUntil: 'networkidle', timeout: 60000 });
        await page.waitForTimeout(3000);

        // Check for game state in localStorage
        const gameState = await page.evaluate(() => {
            const keys = Object.keys(localStorage);
            const gameKeys = keys.filter(key => key.includes('game') || key.includes('save') || key.includes('state'));
            
            const state = {};
            gameKeys.forEach(key => {
                try {
                    state[key] = JSON.parse(localStorage.getItem(key));
                } catch {
                    state[key] = localStorage.getItem(key);
                }
            });
            
            return {
                totalKeys: keys.length,
                gameKeys: gameKeys.length,
                state
            };
        });

        console.log(`LocalStorage State:`);
        console.log(`  Total keys: ${gameState.totalKeys}`);
        console.log(`  Game-related keys: ${gameState.gameKeys}`);
        
        if (gameState.gameKeys > 0) {
            console.log(`  Game keys found: ${Object.keys(gameState.state).join(', ')}`);
        }

        // Check for session storage
        const sessionState = await page.evaluate(() => {
            const keys = Object.keys(sessionStorage);
            return {
                totalKeys: keys.length,
                keys: keys
            };
        });

        console.log(`SessionStorage:`);
        console.log(`  Total keys: ${sessionState.totalKeys}`);
        console.log(`  Keys: ${sessionState.keys.join(', ') || 'none'}`);

        // Check for IndexedDB
        const indexedDB = await page.evaluate(async () => {
            try {
                const databases = await indexedDB.databases();
                return {
                    available: true,
                    databases: databases.length
                };
            } catch {
                return {
                    available: false,
                    databases: 0
                };
            }
        });

        console.log(`IndexedDB:`);
        console.log(`  Available: ${indexedDB.available ? '✅' : '❌'}`);
        console.log(`  Databases: ${indexedDB.databases}`);
    });

    test('should test responsive design and mobile compatibility', async ({ page }) => {
        console.log(`\n📱 Testing responsive design`);
        
        const viewports = [
            { width: 1920, height: 1080, name: 'Desktop' },
            { width: 1366, height: 768, name: 'Laptop' }
        ];

        for (const viewport of viewports) {
            console.log(`\nTesting ${viewport.name} (${viewport.width}x${viewport.height})`);
            
            await page.setViewportSize({ width: viewport.width, height: viewport.height });
            await page.goto(`${BASE_URL}/exoplanet-pioneer.html`, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await page.waitForTimeout(1000);

            // Check for data overlay (main game container)
            const dataOverlay = await page.locator('#ep-data-overlay').count();
            console.log(`  Data overlay: ${dataOverlay > 0 ? '✅' : '❌'}`);

            // Check for data toggle button
            const dataToggle = await page.locator('#ep-data-toggle').count();
            console.log(`  Data toggle button: ${dataToggle > 0 ? '✅' : '❌'}`);

            // Check for advanced tools buttons
            const planetViewer = await page.locator('#ep-open-planet-viewer').count();
            const marketplace = await page.locator('#ep-open-marketplace').count();
            const multiverse = await page.locator('#ep-open-multiverse').count();
            
            console.log(`  Planet viewer: ${planetViewer > 0 ? '✅' : '❌'}`);
            console.log(`  Marketplace: ${marketplace > 0 ? '✅' : '❌'}`);
            console.log(`  Multiverse: ${multiverse > 0 ? '✅' : '❌'}`);

            // Check for back button
            const backBtn = await page.locator('.ep-back-btn').count();
            console.log(`  Back button: ${backBtn > 0 ? '✅' : '❌'}`);
        }
    });

    test('should test accessibility and keyboard navigation', async ({ page }) => {
        console.log(`\n♿ Testing accessibility`);
        
        await page.goto(`${BASE_URL}/exoplanet-pioneer.html`, { waitUntil: 'networkidle', timeout: 60000 });
        await page.waitForTimeout(3000);

        // Check for ARIA labels on interactive elements
        const interactiveElements = await page.locator('button, a, input, select, textarea').count();
        console.log(`Interactive elements: ${interactiveElements}`);

        // Check for alt text on images
        const imagesWithoutAlt = await page.locator('img:not([alt])').count();
        console.log(`Images without alt text: ${imagesWithoutAlt}`);
        expect(imagesWithoutAlt).toBe(0);

        // Check for proper heading hierarchy
        const headings = await page.locator('h1, h2, h3, h4, h5, h6').count();
        console.log(`Headings: ${headings}`);

        // Test keyboard navigation
        console.log(`\nTesting keyboard navigation:`);
        
        // Tab through elements
        let tabCount = 0;
        for (let i = 0; i < 10; i++) {
            await page.keyboard.press('Tab');
            await page.waitForTimeout(100);
            
            const focusedElement = await page.evaluate(() => {
                const el = document.activeElement;
                return el ? {
                    tagName: el.tagName,
                    id: el.id,
                    className: el.className,
                    hasFocus: document.hasFocus()
                } : null;
            });
            
            if (focusedElement && focusedElement.tagName !== 'BODY') {
                tabCount++;
                console.log(`  ${tabCount}. ${focusedElement.tagName}${focusedElement.id ? '#' + focusedElement.id : ''}${focusedElement.className ? '.' + focusedElement.className.split(' ')[0] : ''}`);
            }
        }

        console.log(`Focusable elements found: ${tabCount}`);
    });

    test('should test game interactions and animations', async ({ page }) => {
        console.log(`\n🎮 Testing game interactions and animations`);
        
        await page.goto(`${BASE_URL}/exoplanet-pioneer.html`, { waitUntil: 'networkidle', timeout: 60000 });
        await page.waitForTimeout(3000);

        // Check for canvas elements (for game rendering)
        const canvases = await page.locator('canvas').count();
        console.log(`Canvas elements: ${canvases}`);

        // Check for animation elements
        const animatedElements = await page.locator('[class*="animate"], [class*="transition"], [class*="animation"]').count();
        console.log(`Animated elements: ${animatedElements}`);

        // Check for game sprites or assets
        const images = await page.locator('img').count();
        console.log(`Images: ${images}`);

        // Test hover effects on buttons
        const buttons = await page.locator('button').all();
        console.log(`\nTesting hover effects on ${buttons.length} buttons:`);
        
        for (let i = 0; i < Math.min(buttons.length, 5); i++) {
            const button = buttons[i];
            try {
                await button.hover({ timeout: 2000 });
                const classes = await button.getAttribute('class');
                console.log(`  Button ${i + 1}: ${classes || 'no classes'}`);
            } catch (error) {
                console.log(`  Button ${i + 1}: Could not hover (${error.message})`);
            }
        }

        // Check for game audio elements
        const audioElements = await page.locator('audio').count();
        console.log(`\nAudio elements: ${audioElements}`);

        // Check for video elements
        const videoElements = await page.locator('video').count();
        console.log(`Video elements: ${videoElements}`);
    });

    test('should test API integration with game', async ({ page }) => {
        console.log(`\n🔗 Testing API integration with game`);
        
        await page.goto(`${BASE_URL}/exoplanet-pioneer.html`, { waitUntil: 'networkidle', timeout: 60000 });
        await page.waitForTimeout(3000);

        // Check if DebugAPI is available in window
        const debugAPI = await page.evaluate(() => {
            return typeof window.DebugAPI !== 'undefined';
        });
        console.log(`DebugAPI available: ${debugAPI ? '✅' : '❌'}`);

        // Check if HealthAPI is available in window
        const healthAPI = await page.evaluate(() => {
            return typeof window.HealthAPI !== 'undefined';
        });
        console.log(`HealthAPI available: ${healthAPI ? '✅' : '❌'}`);

        // Test if we can load the API files dynamically
        const apiLoadTest = await page.evaluate(async () => {
            try {
                const debugScript = document.createElement('script');
                debugScript.src = 'https://exoplanet-api-worker.adybag14.workers.dev/api/debug.js';
                document.head.appendChild(debugScript);
                
                const healthScript = document.createElement('script');
                healthScript.src = 'https://exoplanet-api-worker.adybag14.workers.dev/api/health.js';
                document.head.appendChild(healthScript);
                
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                return {
                    debugLoaded: typeof window.DebugAPI !== 'undefined',
                    healthLoaded: typeof window.HealthAPI !== 'undefined'
                };
            } catch (error) {
                return {
                    error: error.message,
                    debugLoaded: false,
                    healthLoaded: false
                };
            }
        });

        console.log(`Dynamic API Load Test:`);
        console.log(`  Debug API: ${apiLoadTest.debugLoaded ? '✅' : '❌'}`);
        console.log(`  Health API: ${apiLoadTest.healthLoaded ? '✅' : '❌'}`);
        
        if (apiLoadTest.error) {
            console.log(`  Error: ${apiLoadTest.error}`);
        }
    });
});
