/**
 * 🧪 COMPREHENSIVE LIVE SITE TESTS
 * Enhanced Playwright tests with full log capture and API testing
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://adrianotothestar.com';

test.describe('Comprehensive Live Site Tests', () => {
    test('should capture full logs and test APIs', async ({ page, context }) => {
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
            pageErrors.push({
                message: error.message,
                stack: error.stack
            });
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
                ok: response.ok()
            });
        });

        // Navigate to the site
        await page.goto(`${BASE_URL}/exoplanet-pioneer.html`, { waitUntil: 'networkidle', timeout: 60000 });

        // Wait for main UI to load
        await page.waitForSelector('#ep-ui', { state: 'visible', timeout: 60000 });

        // Test Debug API
        console.log('\n🔍 Testing Debug API...');
        const debugResponse = await page.evaluate(async () => {
            try {
                if (window.DebugAPI) {
                    const status = window.DebugAPI.getStatus();
                    return {
                        success: true,
                        data: status
                    };
                }
                return { success: false, error: 'DebugAPI not found' };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        console.log('Debug API Response:', JSON.stringify(debugResponse, null, 2));

        // Test Health API
        console.log('\n🏥 Testing Health API...');
        const healthResponse = await page.evaluate(async () => {
            try {
                if (window.HealthAPI) {
                    const status = window.HealthAPI.getStatus();
                    return {
                        success: true,
                        data: status
                    };
                }
                return { success: false, error: 'HealthAPI not found' };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        console.log('Health API Response:', JSON.stringify(healthResponse, null, 2));

        // Test API endpoints via HTTP
        console.log('\n🌐 Testing API endpoints via HTTP...');
        
        const debugHttpTest = await page.evaluate(async (baseUrl) => {
            try {
                const response = await fetch(`${baseUrl}/api/debug.js`);
                const text = await response.text();
                return {
                    success: response.ok,
                    status: response.status,
                    contentType: response.headers.get('content-type'),
                    length: text.length
                };
            } catch (error) {
                return { success: false, error: error.message };
            }
        }, BASE_URL);

        console.log('Debug HTTP Test:', JSON.stringify(debugHttpTest, null, 2));

        const healthHttpTest = await page.evaluate(async (baseUrl) => {
            try {
                const response = await fetch(`${baseUrl}/api/health.js`);
                const text = await response.text();
                return {
                    success: response.ok,
                    status: response.status,
                    contentType: response.headers.get('content-type'),
                    length: text.length
                };
            } catch (error) {
                return { success: false, error: error.message };
            }
        }, BASE_URL);

        console.log('Health HTTP Test:', JSON.stringify(healthHttpTest, null, 2));

        // Test Workers
        console.log('\n⚙️ Testing Workers...');
        const workersTest = await page.evaluate(async () => {
            const workers = [];
            
            // Check for Service Workers
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const registration of registrations) {
                    workers.push({
                        type: 'service-worker',
                        scope: registration.scope,
                        state: registration.active?.state,
                        scriptURL: registration.active?.scriptURL
                    });
                }
            }

            // Check for Web Workers
            if (window.workers && Array.isArray(window.workers)) {
                for (const worker of window.workers) {
                    workers.push({
                        type: 'web-worker',
                        status: worker.status
                    });
                }
            }

            return {
                count: workers.length,
                workers: workers
            };
        });

        console.log('Workers Test:', JSON.stringify(workersTest, null, 2));

        // Click interactions with enhanced handling
        console.log('\n🖱️ Testing Click Interactions...');

        // Click missions button with retry logic
        let missionsClicked = false;
        for (let i = 0; i < 3; i++) {
            try {
                await page.waitForSelector('#ep-btn-missions', { timeout: 10000 });
                await page.click('#ep-btn-missions', { timeout: 5000, force: true });
                missionsClicked = true;
                console.log('✅ Missions button clicked successfully');
                break;
            } catch (error) {
                console.log(`⚠️ Attempt ${i + 1} failed:`, error.message);
                await page.waitForTimeout(1000);
            }
        }

        if (missionsClicked) {
            // Wait for modal to appear
            await page.waitForFunction(() => {
                const modal = document.getElementById('ep-missions-modal');
                if (!modal) return false;
                const display = getComputedStyle(modal).display;
                return display !== 'none' && display !== '';
            }, null, { timeout: 10000 });

            // Get missions content
            const missionsContent = await page.locator('#ep-missions-content').innerText();
            console.log('📋 Missions Content:', missionsContent.substring(0, 500) + '...');
        }

        // Test other buttons
        const buttons = [
            '#ep-btn-colony',
            '#ep-btn-research',
            '#ep-btn-combat',
            '#ep-btn-trade'
        ];

        for (const buttonSelector of buttons) {
            try {
                const button = page.locator(buttonSelector);
                if (await button.isVisible({ timeout: 5000 })) {
                    await button.click({ timeout: 5000, force: true });
                    console.log(`✅ Clicked ${buttonSelector}`);
                    await page.waitForTimeout(1000);
                } else {
                    console.log(`⚠️ ${buttonSelector} not visible`);
                }
            } catch (error) {
                console.log(`❌ Error clicking ${buttonSelector}:`, error.message);
            }
        }

        // Print summary
        console.log('\n📊 TEST SUMMARY:');
        console.log('================');
        console.log(`Console Logs: ${consoleLogs.length}`);
        console.log(`Page Errors: ${pageErrors.length}`);
        console.log(`Network Requests: ${networkRequests.length}`);
        console.log(`Network Responses: ${networkResponses.length}`);
        console.log(`Debug API: ${debugResponse.success ? '✅ Working' : '❌ Failed'}`);
        console.log(`Health API: ${healthResponse.success ? '✅ Working' : '❌ Failed'}`);
        console.log(`Debug HTTP: ${debugHttpTest.success ? '✅ Working' : '❌ Failed'}`);
        console.log(`Health HTTP: ${healthHttpTest.success ? '✅ Working' : '❌ Failed'}`);
        console.log(`Workers: ${workersTest.count} found`);

        // Print errors if any
        if (pageErrors.length > 0) {
            console.log('\n❌ PAGE ERRORS:');
            pageErrors.forEach((error, i) => {
                console.log(`  ${i + 1}. ${error.message}`);
            });
        }

        // Print console warnings/errors
        const consoleErrors = consoleLogs.filter(log => 
            log.type === 'error' || log.type === 'warning'
        );
        if (consoleErrors.length > 0) {
            console.log('\n⚠️ CONSOLE WARNINGS/ERRORS:');
            consoleErrors.forEach((log, i) => {
                console.log(`  ${i + 1}. [${log.type}] ${log.text}`);
            });
        }

        // Assertions
        expect(debugResponse.success).toBe(true);
        expect(healthResponse.success).toBe(true);
        expect(missionsClicked).toBe(true);
    });
});
