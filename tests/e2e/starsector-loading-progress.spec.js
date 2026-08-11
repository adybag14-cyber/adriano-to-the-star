import { test, expect } from '@playwright/test';
import * as fs from 'fs';

const BASE_URL = process.env.BASE_URL || 'https://adrianotothestar.com';

test.describe('Starsector Loading Progress - Extended with Screenshots', () => {
    test('should capture loading progress with screenshots', async ({ page }) => {
        console.log(`\n📸 Starting Starsector Loading Progress Test`);
        console.log(`URL: ${BASE_URL}/starsector.html`);
        
        // Track console logs
        page.testData = {
            consoleLogs: [],
            pageErrors: [],
            networkRequests: [],
            networkResponses: [],
            networkFailures: [],
            screenshots: [],
            loadingStatusHistory: [],
            debugLogs: [],
            startTime: Date.now()
        };

        // Enhanced console logging
        page.on('console', msg => {
            const logEntry = {
                type: msg.type(),
                text: msg.text(),
                args: msg.args().map(arg => arg.toString()),
                timestamp: Date.now(),
                elapsedSeconds: Math.floor((Date.now() - page.testData.startTime) / 1000)
            };
            page.testData.consoleLogs.push(logEntry);
            
            // Debug: Log important console messages
            if (msg.type() === 'error' || msg.text().toLowerCase().includes('cheerpj') || msg.text().toLowerCase().includes('jvm') || msg.text().toLowerCase().includes('lwjgl')) {
                page.testData.debugLogs.push({
                    type: 'CONSOLE',
                    level: msg.type().toUpperCase(),
                    message: msg.text(),
                    timestamp: logEntry.timestamp,
                    elapsedSeconds: logEntry.elapsedSeconds
                });
            }
        });

        page.on('pageerror', error => {
            const errorEntry = {
                message: error.message,
                stack: error.stack,
                timestamp: Date.now(),
                elapsedSeconds: Math.floor((Date.now() - page.testData.startTime) / 1000)
            };
            page.testData.pageErrors.push(errorEntry);
            
            // Debug: Log all page errors
            page.testData.debugLogs.push({
                type: 'ERROR',
                level: 'ERROR',
                message: error.message,
                stack: error.stack,
                timestamp: errorEntry.timestamp,
                elapsedSeconds: errorEntry.elapsedSeconds
            });
        });

        // Enhanced network request logging
        page.on('request', request => {
            const requestEntry = {
                url: request.url(),
                method: request.method(),
                resourceType: request.resourceType(),
                headers: request.headers(),
                postData: request.postData(),
                timestamp: Date.now(),
                elapsedSeconds: Math.floor((Date.now() - page.testData.startTime) / 1000)
            };
            page.testData.networkRequests.push(requestEntry);
            
            // Debug: Log important network requests
            if (request.url().includes('cheerpj') || request.url().includes('.wasm') || request.url().includes('.jar') || request.url().includes('starsector')) {
                page.testData.debugLogs.push({
                    type: 'NETWORK_REQUEST',
                    level: 'INFO',
                    message: `${request.method()} ${request.url()}`,
                    resourceType: request.resourceType(),
                    timestamp: requestEntry.timestamp,
                    elapsedSeconds: requestEntry.elapsedSeconds
                });
            }
        });

        // Enhanced network response logging
        page.on('response', response => {
            const responseEntry = {
                url: response.url(),
                status: response.status(),
                statusText: response.statusText(),
                headers: response.headers(),
                timestamp: Date.now(),
                elapsedSeconds: Math.floor((Date.now() - page.testData.startTime) / 1000)
            };
            page.testData.networkResponses.push(responseEntry);
            
            // Track failed responses
            if (response.status() >= 400) {
                page.testData.networkFailures.push({
                    url: response.url(),
                    status: response.status(),
                    statusText: response.statusText(),
                    timestamp: responseEntry.timestamp,
                    elapsedSeconds: responseEntry.elapsedSeconds
                });
                
                // Debug: Log failed responses
                page.testData.debugLogs.push({
                    type: 'NETWORK_FAILURE',
                    level: 'ERROR',
                    message: `${response.status()} ${response.statusText()} - ${response.url()}`,
                    timestamp: responseEntry.timestamp,
                    elapsedSeconds: responseEntry.elapsedSeconds
                });
            }
            
            // Debug: Log important successful responses
            if (response.url().includes('cheerpj') || response.url().includes('.wasm') || response.url().includes('.jar')) {
                page.testData.debugLogs.push({
                    type: 'NETWORK_RESPONSE',
                    level: 'INFO',
                    message: `${response.status()} ${response.statusText()} - ${response.url()}`,
                    timestamp: responseEntry.timestamp,
                    elapsedSeconds: responseEntry.elapsedSeconds
                });
            }
        });

        // Navigate to Starsector page
        console.log(`\n🚀 Navigating to Starsector...`);
        page.testData.debugLogs.push({
            type: 'NAVIGATION',
            level: 'INFO',
            message: `Navigating to ${BASE_URL}/starsector.html`,
            timestamp: Date.now(),
            elapsedSeconds: 0
        });
        
        await page.goto(`${BASE_URL}/starsector.html`, { waitUntil: 'domcontentloaded', timeout: 180000 });
        
        const navigationTime = Date.now() - page.testData.startTime;
        console.log(`✅ Page loaded successfully in ${navigationTime}ms`);
        page.testData.debugLogs.push({
            type: 'NAVIGATION',
            level: 'INFO',
            message: `Page loaded successfully in ${navigationTime}ms`,
            timestamp: Date.now(),
            elapsedSeconds: Math.floor(navigationTime / 1000)
        });

        // Capture screenshots at regular intervals
        const totalDuration = 40000; // 40 seconds
        const screenshotInterval = 5000; // 5 seconds
        const numScreenshots = Math.floor(totalDuration / screenshotInterval);

        console.log(`\n📸 Will capture ${numScreenshots} screenshots every ${screenshotInterval / 1000} seconds for ${totalDuration / 1000} seconds`);

        for (let i = 0; i <= numScreenshots; i++) {
            const elapsedTime = Date.now() - page.testData.startTime;
            const elapsedSeconds = Math.floor(elapsedTime / 1000);
            const remainingSeconds = Math.floor((totalDuration - elapsedTime) / 1000);

            console.log(`\n[${elapsedSeconds}s / ${totalDuration / 1000}s] Capturing screenshot ${i + 1}/${numScreenshots}...`);

            // Capture screenshot
            const screenshotPath = `test-results/starsector-loading-progress-${i + 1}-${elapsedSeconds}s.png`;
            const screenshot = await page.screenshot({
                path: screenshotPath,
                fullPage: true,
                animations: 'disabled',
                type: 'png'
            });
            
            page.testData.screenshots.push({
                number: i + 1,
                timestamp: Date.now(),
                elapsedSeconds,
                remainingSeconds,
                size: screenshot.length
            });

            // Get current loading status
            const loadingStatus = await page.locator('#loading-status').textContent().catch(() => 'Not found');
            const loadingSubstatus = await page.locator('#loading-substatus').textContent().catch(() => 'Not found');
            const loadingBarWidth = await page.locator('#loading-bar').evaluate(el => el ? el.style.width : '0%').catch(() => '0%');

            page.testData.loadingStatusHistory.push({
                screenshot: i + 1,
                elapsedSeconds,
                loadingStatus,
                loadingSubstatus,
                loadingBarWidth
            });

            console.log(`   Status: ${loadingStatus}`);
            console.log(`   Substatus: ${loadingSubstatus}`);
            console.log(`   Progress: ${loadingBarWidth}`);
            console.log(`   Screenshot size: ${screenshot.length} bytes`);

            // Check for LWJGL canvas
            const lwjglCanvas = await page.locator('#lwjgl').count();
            if (lwjglCanvas > 0) {
                console.log(`   🎮 LWJGL Canvas: ✅ Created`);
            }

            // Check for top bar (game is running)
            const topBarVisible = await page.locator('#top-bar').isVisible().catch(() => false);
            if (topBarVisible) {
                console.log(`   🎯 Top Bar: ✅ Visible (game running)`);
            }

            // Check for errors
            if (page.testData.pageErrors.length > 0) {
                console.log(`   ❌ Page errors: ${page.testData.pageErrors.length}`);
                page.testData.pageErrors.slice(0, 3).forEach((error, idx) => {
                    console.log(`      ${idx + 1}. ${error.message.substring(0, 100)}`);
                });
            }

            // Check for recent console logs
            const recentLogs = page.testData.consoleLogs.slice(-10);
            if (recentLogs.length > 0) {
                console.log(`   📋 Recent logs (${recentLogs.length}):`);
                recentLogs.forEach(log => {
                    const logType = log.type.toUpperCase().padEnd(7);
                    const elapsed = log.elapsedSeconds ? `[${log.elapsedSeconds}s]` : '';
                    console.log(`      [${logType}] ${elapsed} ${log.text.substring(0, 100)}`);
                });
            }
            
            // Check for recent network activity
            const recentRequests = page.testData.networkRequests.slice(-5);
            if (recentRequests.length > 0) {
                console.log(`   🌐 Recent network requests (${recentRequests.length}):`);
                recentRequests.forEach(req => {
                    const elapsed = req.elapsedSeconds ? `[${req.elapsedSeconds}s]` : '';
                    console.log(`      [${req.method}] ${elapsed} ${req.resourceType} - ${req.url.substring(0, 80)}`);
                });
            }
            
            // Check for network failures
            const recentFailures = page.testData.networkFailures.slice(-5);
            if (recentFailures.length > 0) {
                console.log(`   ❌ Recent network failures (${recentFailures.length}):`);
                recentFailures.forEach(fail => {
                    const elapsed = fail.elapsedSeconds ? `[${fail.elapsedSeconds}s]` : '';
                    console.log(`      [${fail.status}] ${elapsed} ${fail.url.substring(0, 80)}`);
                });
            }

            // Continue capturing screenshots for full duration to get complete logs
            // Don't stop early even if game appears to be running

            // Wait for next interval
            if (i < numScreenshots) {
                console.log(`   ⏳ Waiting ${screenshotInterval / 1000}s for next screenshot...`);
                await page.waitForTimeout(screenshotInterval);
            }
        }

        // Final summary
        const finalElapsedTime = Date.now() - page.testData.startTime;
        const finalLoadingStatus = await page.locator('#loading-status').textContent().catch(() => 'Not found');
        const finalLwjglCanvas = await page.locator('#lwjgl').count();
        const finalTopBarVisible = await page.locator('#top-bar').isVisible().catch(() => false);

        console.log(`\n📊 Final Summary:`);
        console.log(`   Total duration: ${Math.floor(finalElapsedTime / 1000)}s`);
        console.log(`   Screenshots captured: ${page.testData.screenshots.length}`);
        console.log(`   Total console logs: ${page.testData.consoleLogs.length}`);
        console.log(`   Console errors: ${page.testData.consoleLogs.filter(l => l.type === 'error').length}`);
        console.log(`   Console warnings: ${page.testData.consoleLogs.filter(l => l.type === 'warning').length}`);
        console.log(`   Page errors: ${page.testData.pageErrors.length}`);
        console.log(`   Network requests: ${page.testData.networkRequests.length}`);
        console.log(`   Network responses: ${page.testData.networkResponses.length}`);
        console.log(`   Failed responses: ${page.testData.networkResponses.filter(r => r.status >= 400).length}`);
        console.log(`   Debug logs: ${page.testData.debugLogs.length}`);
        console.log(`   LWJGL Canvas: ${finalLwjglCanvas > 0 ? '✅ Created' : '❌ Not created'}`);
        console.log(`   Top Bar: ${finalTopBarVisible ? '✅ Visible (game running)' : '❌ Not visible'}`);
        console.log(`   Final status: ${finalLoadingStatus}`);
        
        // Save debug logs to file
        const debugLogPath = `test-results/starsector-loading-debug-${Date.now()}.json`;
        fs.writeFileSync(debugLogPath, JSON.stringify(page.testData, null, 2));
        console.log(`\n💾 Debug logs saved to: ${debugLogPath}`);
        
        // Save console logs to file
        const consoleLogPath = `test-results/starsector-loading-console-${Date.now()}.txt`;
        const consoleLogContent = page.testData.consoleLogs.map(log => {
            const elapsed = log.elapsedSeconds ? `[${log.elapsedSeconds}s]` : '';
            return `[${log.type.toUpperCase()}] ${elapsed} ${log.text}`;
        }).join('\n');
        fs.writeFileSync(consoleLogPath, consoleLogContent);
        console.log(`💾 Console logs saved to: ${consoleLogPath}`);
        
        // Save network logs to file
        const networkLogPath = `test-results/starsector-loading-network-${Date.now()}.txt`;
        const networkLogContent = [
            '=== NETWORK REQUESTS ===',
            ...page.testData.networkRequests.map(req => {
                const elapsed = req.elapsedSeconds ? `[${req.elapsedSeconds}s]` : '';
                return `[${req.method}] ${elapsed} ${req.resourceType} - ${req.url}`;
            }),
            '',
            '=== NETWORK RESPONSES ===',
            ...page.testData.networkResponses.map(res => {
                const elapsed = res.elapsedSeconds ? `[${res.elapsedSeconds}s]` : '';
                return `[${res.status}] ${elapsed} ${res.url}`;
            }),
            '',
            '=== NETWORK FAILURES ===',
            ...page.testData.networkFailures.map(fail => {
                const elapsed = fail.elapsedSeconds ? `[${fail.elapsedSeconds}s]` : '';
                return `[${fail.status}] ${elapsed} ${fail.url}`;
            })
        ].join('\n');
        fs.writeFileSync(networkLogPath, networkLogContent);
        console.log(`💾 Network logs saved to: ${networkLogPath}`);

        // Save screenshot summary
        console.log(`\n💾 Screenshot Summary:`);
        page.testData.screenshots.forEach((screenshot, i) => {
            console.log(`   ${i + 1}. ${screenshot.elapsedSeconds}s - ${screenshot.size} bytes`);
        });

        // Save loading status history
        console.log(`\n📈 Loading Progress History:`);
        page.testData.loadingStatusHistory.forEach((status, i) => {
            console.log(`   Screenshot ${status.screenshot}: ${status.elapsedSeconds}s`);
            console.log(`     Status: ${status.loadingStatus}`);
            console.log(`     Substatus: ${status.loadingSubstatus}`);
            console.log(`     Progress: ${status.loadingBarWidth}`);
        });

        // Take final screenshot
        const finalScreenshot = await page.screenshot({
            fullPage: true,
            animations: 'disabled',
            type: 'png'
        });
        console.log(`\n📸 Final screenshot captured (${finalScreenshot.length} bytes)`);

        // Assert game is running
        expect(finalTopBarVisible).toBe(true);

        console.log(`\n✅ Starsector loaded successfully!`);
    });
});
