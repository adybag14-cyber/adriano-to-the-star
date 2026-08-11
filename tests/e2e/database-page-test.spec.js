import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://adrianotothestar.com';

test.describe('Database Page Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Track console logs
        page.testData = {
            consoleLogs: [],
            pageErrors: [],
            networkRequests: [],
            networkResponses: []
        };

        page.on('console', msg => {
            page.testData.consoleLogs.push({
                type: msg.type(),
                text: msg.text(),
                location: msg.location()
            });
        });

        page.on('pageerror', error => {
            page.testData.pageErrors.push(error.message);
        });

        page.on('request', request => {
            page.testData.networkRequests.push({
                url: request.url(),
                method: request.method(),
                resourceType: request.resourceType(),
                headers: request.headers()
            });
        });

        page.on('response', response => {
            page.testData.networkResponses.push({
                url: response.url(),
                status: response.status(),
                headers: response.headers()
            });
        });
    });

    test('should load database page and verify core elements', async ({ page }) => {
        console.log(`\n🌐 Loading database page at: ${BASE_URL}/database.html`);
        
        await page.goto(`${BASE_URL}/database.html`, { waitUntil: 'networkidle', timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000);

        // Verify page title
        const title = await page.title();
        console.log(`Page title: ${title}`);
        expect(title).toContain('Exoplanet Database');

        // Check for API base configuration in console logs
        const apiConfigLog = page.testData.consoleLogs.find(log => 
            log.text.includes('API Base configured')
        );
        console.log(`API Base configured: ${apiConfigLog ? '✅' : '❌'}`);
        expect(apiConfigLog).toBeTruthy();

        // Check for page hero
        const pageTitle = await page.locator('.page-title').count();
        console.log(`Page title element: ${pageTitle > 0 ? '✅' : '❌'}`);
        expect(pageTitle).toBeGreaterThan(0);

        // Check for database console
        const databaseConsole = await page.locator('.database-console').count();
        console.log(`Database console: ${databaseConsole > 0 ? '✅' : '❌'}`);
        expect(databaseConsole).toBeGreaterThan(0);

        // Check for ESA API widget
        const esaWidget = await page.locator('#esa-api-widget').count();
        console.log(`ESA API widget: ${esaWidget > 0 ? '✅' : '❌'}`);
        expect(esaWidget).toBeGreaterThan(0);

        // Check for NASA data container
        const nasaContainer = await page.locator('#nasa-data-container').count();
        console.log(`NASA data container: ${nasaContainer > 0 ? '✅' : '❌'}`);
        expect(nasaContainer).toBeGreaterThan(0);

        // Check for quest log container
        const questLog = await page.locator('#quest-log-container').count();
        console.log(`Quest log container: ${questLog > 0 ? '✅' : '❌'}`);
        expect(questLog).toBeGreaterThan(0);

        // Log test data
        const { consoleLogs, pageErrors, networkRequests, networkResponses } = page.testData;
        console.log(`\n📊 Test Data:`);
        console.log(`  Console Logs: ${consoleLogs.length}`);
        console.log(`  Page Errors: ${pageErrors.length}`);
        console.log(`  Network Requests: ${networkRequests.length}`);
        console.log(`  Network Responses: ${networkResponses.length}`);

        // Check for critical errors
        const criticalErrors = pageErrors.filter(e => 
            e.includes('TypeError') || 
            e.includes('ReferenceError') || 
            e.includes('SyntaxError')
        );
        console.log(`Critical errors: ${criticalErrors.length}`);
        if (criticalErrors.length > 0) {
            console.log(`Critical error details:`);
            criticalErrors.slice(0, 5).forEach((error, i) => {
                console.log(`  ${i + 1}. ${error}`);
            });
        }
    });

    test('should test console logs and errors', async ({ page }) => {
        console.log(`\n📝 Testing console logs and errors`);
        
        await page.goto(`${BASE_URL}/database.html`, { waitUntil: 'networkidle', timeout: 60000 });
        await page.waitForTimeout(5000);

        const { consoleLogs, pageErrors } = page.testData;

        console.log(`\nConsole Log Analysis:`);
        console.log(`Total logs: ${consoleLogs.length}`);

        // Categorize logs by type
        const logTypes = {
            log: consoleLogs.filter(l => l.type === 'log'),
            warn: consoleLogs.filter(l => l.type === 'warning' || l.type === 'warn'),
            error: consoleLogs.filter(l => l.type === 'error'),
            info: consoleLogs.filter(l => l.type === 'info'),
            debug: consoleLogs.filter(l => l.type === 'debug')
        };

        console.log(`  Logs: ${logTypes.log.length}`);
        console.log(`  Warnings: ${logTypes.warn.length}`);
        console.log(`  Errors: ${logTypes.error.length}`);
        console.log(`  Info: ${logTypes.info.length}`);
        console.log(`  Debug: ${logTypes.debug.length}`);

        // Display sample logs
        if (logTypes.log.length > 0) {
            console.log(`\nSample logs:`);
            logTypes.log.slice(0, 10).forEach((log, i) => {
                console.log(`  ${i + 1}. ${log.text.substring(0, 100)}`);
            });
        }

        // Display warnings
        if (logTypes.warn.length > 0) {
            console.log(`\nWarnings:`);
            logTypes.warn.slice(0, 5).forEach((warn, i) => {
                console.log(`  ${i + 1}. ${warn.text.substring(0, 100)}`);
            });
        }

        // Display errors
        if (logTypes.error.length > 0) {
            console.log(`\nConsole errors:`);
            logTypes.error.slice(0, 5).forEach((err, i) => {
                console.log(`  ${i + 1}. ${err.text.substring(0, 100)}`);
            });
        }

        // Page errors
        console.log(`\nPage Errors: ${pageErrors.length}`);
        if (pageErrors.length > 0) {
            console.log(`Page error details:`);
            pageErrors.slice(0, 5).forEach((error, i) => {
                console.log(`  ${i + 1}. ${error.substring(0, 100)}`);
            });
        }

        // Check for specific expected logs
        const apiConfigLog = consoleLogs.find(log => log.text.includes('API Base configured'));
        console.log(`\nAPI configuration log: ${apiConfigLog ? '✅' : '❌'}`);
        expect(apiConfigLog).toBeTruthy();

        // Assert no critical page errors
        const criticalPageErrors = pageErrors.filter(e => 
            e.includes('TypeError') || 
            e.includes('ReferenceError') || 
            e.includes('SyntaxError')
        );
        expect(criticalPageErrors.length).toBe(0);
    });

    test('should test network API integrations', async ({ page }) => {
        console.log(`\n🌐 Testing network API integrations`);
        
        await page.goto(`${BASE_URL}/database.html`, { waitUntil: 'networkidle', timeout: 60000 });
        await page.waitForTimeout(5000);

        const { networkRequests, networkResponses } = page.testData;

        console.log(`\nNetwork Request Analysis:`);
        console.log(`Total requests: ${networkRequests.length}`);
        console.log(`Total responses: ${networkResponses.length}`);

        // Categorize requests by resource type
        const resourceTypes = {};
        networkRequests.forEach(req => {
            resourceTypes[req.resourceType] = (resourceTypes[req.resourceType] || 0) + 1;
        });
        console.log(`\nResource types:`);
        Object.entries(resourceTypes).forEach(([type, count]) => {
            console.log(`  ${type}: ${count}`);
        });

        // Check for API requests
        const apiRequests = networkRequests.filter(req => 
            req.url.includes('api.nasa.gov') ||
            req.url.includes('esa.int') ||
            req.url.includes('adrianotothestar.com/api') ||
            req.url.includes('api.adrianotothestar.com')
        );
        console.log(`\nAPI requests found: ${apiRequests.length}`);
        if (apiRequests.length > 0) {
            console.log(`API request details:`);
            apiRequests.slice(0, 10).forEach((req, i) => {
                console.log(`  ${i + 1}. ${req.url} (${req.method})`);
            });
        }

        // Check for failed requests
        const failedResponses = networkResponses.filter(res => res.status >= 400);
        console.log(`\nFailed responses (4xx, 5xx): ${failedResponses.length}`);
        if (failedResponses.length > 0) {
            console.log(`Failed response details:`);
            failedResponses.slice(0, 10).forEach((res, i) => {
                console.log(`  ${i + 1}. ${res.url.substring(0, 80)}... (${res.status})`);
            });
        }

        // Check for successful responses
        const successResponses = networkResponses.filter(res => res.status >= 200 && res.status < 300);
        console.log(`\nSuccessful responses (2xx): ${successResponses.length}`);

        // Check for script loading
        const scriptRequests = networkRequests.filter(req => req.resourceType === 'script');
        console.log(`\nScript requests: ${scriptRequests.length}`);
        expect(scriptRequests.length).toBeGreaterThan(0);

        // Check for stylesheet loading
        const styleRequests = networkRequests.filter(req => req.resourceType === 'stylesheet');
        console.log(`Stylesheet requests: ${styleRequests.length}`);
        expect(styleRequests.length).toBeGreaterThan(0);

        // Verify no critical failures (5xx errors on main resources)
        const criticalFailures = failedResponses.filter(res => 
            res.status >= 500 && 
            (res.resourceType === 'script' || res.resourceType === 'stylesheet' || res.resourceType === 'document')
        );
        console.log(`\nCritical failures: ${criticalFailures.length}`);
        expect(criticalFailures.length).toBe(0);
    });

    test('should test cosmic music player functionality', async ({ page }) => {
        console.log(`\n🎵 Testing cosmic music player`);
        
        await page.goto(`${BASE_URL}/database.html`, { waitUntil: 'networkidle', timeout: 60000 });
        await page.waitForTimeout(5000);

        // Check if cosmic music player script loaded
        const cosmicPlayerScript = await page.evaluate(() => {
            return typeof window.CosmicMusicPlayer !== 'undefined' || 
                   typeof window.cosmicMusicPlayer !== 'undefined' ||
                   document.querySelector('script[src*="cosmic-music-player.js"]') !== null;
        });
        console.log(`Cosmic music player script loaded: ${cosmicPlayerScript ? '✅' : '❌'}`);

        // Check for music player UI elements
        const musicPlayerContainer = await page.locator('.cosmic-music-player, #cosmic-music-player, [class*="music-player"]').count();
        console.log(`Music player container: ${musicPlayerContainer > 0 ? '✅' : '❌'}`);

        // Check for play/pause button
        const playPauseBtn = await page.locator('#play-pause').count();
        console.log(`Play/Pause button: ${playPauseBtn > 0 ? '✅' : '❌'}`);

        // Check for volume control
        const volumeControl = await page.locator('input[type="range"], .volume-control, #volume-control').count();
        console.log(`Volume control: ${volumeControl > 0 ? '✅' : '❌'}`);

        // Check for track info
        const trackInfo = await page.locator('.track-info, #track-info, [class*="track"]').count();
        console.log(`Track info: ${trackInfo > 0 ? '✅' : '❌'}`);

        // Check for audio elements
        const audioElements = await page.locator('audio').count();
        console.log(`Audio elements: ${audioElements}`);

        // Check if player is minimized (buttons would be hidden)
        const playerContent = await page.locator('#player-content').count();
        const playerContentVisible = await page.locator('#player-content').isVisible().catch(() => false);
        console.log(`Player content visible: ${playerContentVisible ? '✅' : '❌'}`);

        // Check console logs for music player initialization
        const musicPlayerLogs = page.testData.consoleLogs.filter(log => 
            log.text.toLowerCase().includes('music') ||
            log.text.toLowerCase().includes('player') ||
            log.text.toLowerCase().includes('audio')
        );
        console.log(`\nMusic player related logs: ${musicPlayerLogs.length}`);
        if (musicPlayerLogs.length > 0) {
            console.log(`Music player logs:`);
            musicPlayerLogs.slice(0, 5).forEach((log, i) => {
                console.log(`  ${i + 1}. ${log.text.substring(0, 100)}`);
            });
        }

        // Test if music player is accessible via window object
        const playerAccessible = await page.evaluate(() => {
            if (typeof window.CosmicMusicPlayer !== 'undefined') {
                return { accessible: true, name: 'CosmicMusicPlayer' };
            }
            if (typeof window.cosmicMusicPlayer !== 'undefined') {
                return { accessible: true, name: 'cosmicMusicPlayer' };
            }
            return { accessible: false, name: null };
        });
        console.log(`\nMusic player accessible via window: ${playerAccessible.accessible ? '✅' : '❌'}`);
        if (playerAccessible.accessible) {
            console.log(`  Window object name: ${playerAccessible.name}`);
        }

        // Check for music player errors
        const musicPlayerErrors = page.testData.pageErrors.filter(error => 
            error.toLowerCase().includes('music') ||
            error.toLowerCase().includes('player') ||
            error.toLowerCase().includes('audio')
        );
        console.log(`\nMusic player related errors: ${musicPlayerErrors.length}`);
        if (musicPlayerErrors.length > 0) {
            console.log(`Music player errors:`);
            musicPlayerErrors.forEach((error, i) => {
                console.log(`  ${i + 1}. ${error.substring(0, 100)}`);
            });
        }

        // Assert at least the script is loaded
        expect(cosmicPlayerScript).toBe(true);
    });

    test('should test ESA API widget functionality', async ({ page }) => {
        console.log(`\n🌍 Testing ESA API widget`);
        
        await page.goto(`${BASE_URL}/database.html`, { waitUntil: 'networkidle', timeout: 60000 });
        await page.waitForTimeout(5000);

        // Check for ESA widget container
        const esaWidget = await page.locator('#esa-api-widget').count();
        console.log(`ESA widget container: ${esaWidget > 0 ? '✅' : '❌'}`);
        expect(esaWidget).toBeGreaterThan(0);

        // Check for refresh button
        const refreshBtn = await page.locator('#refresh-esa-data').count();
        console.log(`ESA refresh button: ${refreshBtn > 0 ? '✅' : '❌'}`);
        expect(refreshBtn).toBeGreaterThan(0);

        // Check for ESA content area
        const esaContent = await page.locator('#esa-content').count();
        console.log(`ESA content area: ${esaContent > 0 ? '✅' : '❌'}`);
        expect(esaContent).toBeGreaterThan(0);

        // Wait for ESA data to load
        await page.waitForTimeout(3000);

        // Check if content was populated
        const esaContentText = await page.locator('#esa-content').textContent();
        const hasData = !esaContentText.includes('Loading ESA data') && esaContentText.trim().length > 50;
        console.log(`ESA data loaded: ${hasData ? '✅' : '⏳'}`);

        // Check for ESA-related network requests
        const esaRequests = page.testData.networkRequests.filter(req => 
            req.url.includes('esa.int') || 
            req.url.includes('esa')
        );
        console.log(`ESA API requests: ${esaRequests.length}`);
        if (esaRequests.length > 0) {
            console.log(`ESA request URLs:`);
            esaRequests.forEach((req, i) => {
                console.log(`  ${i + 1}. ${req.url}`);
            });
        }

        // Check for ESA-related console logs
        const esaLogs = page.testData.consoleLogs.filter(log => 
            log.text.toLowerCase().includes('esa')
        );
        console.log(`ESA related logs: ${esaLogs.length}`);
        if (esaLogs.length > 0) {
            console.log(`ESA logs:`);
            esaLogs.slice(0, 5).forEach((log, i) => {
                console.log(`  ${i + 1}. ${log.text.substring(0, 100)}`);
            });
        }
    });

    test('should test database feature containers', async ({ page }) => {
        console.log(`\n📊 Testing database feature containers`);
        
        await page.goto(`${BASE_URL}/database.html`, { waitUntil: 'networkidle', timeout: 60000 });
        await page.waitForTimeout(5000);

        const containers = [
            { id: 'nasa-data-container', name: 'NASA Data' },
            { id: 'planet-of-day-container', name: 'Planet of Day' },
            { id: 'my-universe-container', name: 'My Universe' },
            { id: 'wishlist-container', name: 'Wishlist' },
            { id: 'bookmarks-container', name: 'Bookmarks' },
            { id: 'rarity-calculator-container', name: 'Rarity Calculator' },
            { id: 'comparison-tool-container', name: 'Comparison Tool' },
            { id: 'discovery-timeline-container', name: 'Discovery Timeline' },
            { id: 'search-history-container', name: 'Search History' },
            { id: 'discovery-feed-container', name: 'Discovery Feed' },
            { id: 'discovery-statistics-container', name: 'Discovery Statistics' },
            { id: 'discovery-map-container', name: 'Discovery Map' },
            { id: 'discovery-notifications-container', name: 'Discovery Notifications' },
            { id: 'discovery-calendar-container', name: 'Discovery Calendar' },
            { id: 'video-tutorials-container', name: 'Video Tutorials' },
            { id: 'podcast-integration-container', name: 'Podcast Integration' },
            { id: 'quiz-container', name: 'Quiz' },
            { id: 'voice-commands-container', name: 'Voice Commands' },
            { id: 'mobile-notifications-container', name: 'Mobile Notifications' },
            { id: 'ar-filters-container', name: 'AR Filters' },
            { id: 'vr-tours-container', name: 'VR Tours' },
            { id: 'educational-courses-container', name: 'Educational Courses' }
        ];

        console.log(`\nFeature Container Status:`);
        let foundCount = 0;
        for (const container of containers) {
            const count = await page.locator(`#${container.id}`).count();
            const status = count > 0 ? '✅' : '❌';
            console.log(`  ${status} ${container.name} (#${container.id})`);
            if (count > 0) foundCount++;
        }

        console.log(`\nTotal containers found: ${foundCount}/${containers.length}`);
        expect(foundCount).toBeGreaterThan(10);
    });
});
