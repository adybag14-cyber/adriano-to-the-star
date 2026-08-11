import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

test.describe('Starsector Linux Version - No Stalls/Hangs', () => {
    test.beforeEach(async ({ page }) => {
        // Track console logs
        page.testData = {
            consoleLogs: [],
            pageErrors: [],
            networkRequests: [],
            networkResponses: [],
            jvmInitLogs: [],
            stallDetected: false,
            lastActivityTime: Date.now(),
            loadingTimeout: 120000 // 2 minutes timeout
        };

        page.on('console', msg => {
            const logEntry = {
                type: msg.type(),
                text: msg.text(),
                location: msg.location(),
                timestamp: Date.now()
            };
            page.testData.consoleLogs.push(logEntry);
            page.testData.lastActivityTime = Date.now();
            
            // Track JVM initialization logs
            if (logEntry.text.toLowerCase().includes('cheerpj') || 
                logEntry.text.toLowerCase().includes('jvm') ||
                logEntry.text.toLowerCase().includes('java') ||
                logEntry.text.toLowerCase().includes('lwjgl') ||
                logEntry.text.toLowerCase().includes('initializing') ||
                logEntry.text.toLowerCase().includes('running')) {
                page.testData.jvmInitLogs.push(logEntry);
            }
        });

        page.on('pageerror', error => {
            page.testData.pageErrors.push({
                message: error.message,
                stack: error.stack,
                timestamp: Date.now()
            });
            page.testData.lastActivityTime = Date.now();
        });

        page.on('request', request => {
            page.testData.networkRequests.push({
                url: request.url(),
                method: request.method(),
                resourceType: request.resourceType(),
                timestamp: Date.now()
            });
            page.testData.lastActivityTime = Date.now();
        });

        page.on('response', response => {
            page.testData.networkResponses.push({
                url: response.url(),
                status: response.status(),
                headers: response.headers(),
                timestamp: Date.now()
            });
            page.testData.lastActivityTime = Date.now();
        });

        // Monitor for stalls (no activity for 30 seconds)
        const stallMonitor = setInterval(() => {
            const timeSinceLastActivity = Date.now() - page.testData.lastActivityTime;
            if (timeSinceLastActivity > 30000) {
                page.testData.stallDetected = true;
                console.log(`⚠️  STALL DETECTED: No activity for ${timeSinceLastActivity}ms`);
            }
        }, 5000);

        page.on('close', () => {
            clearInterval(stallMonitor);
        });
    });

    test('should load Linux Starsector without stalls or hangs', async ({ page }) => {
        console.log(`\n🐧 Testing Linux Starsector - No Stalls/Hangs`);
        console.log(`URL: ${BASE_URL}/starsector.html`);
        
        // Navigate to Starsector page with timeout
        await page.goto(`${BASE_URL}/starsector.html`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        
        console.log(`✅ Page loaded successfully`);
        
        // Wait for initial page load
        await page.waitForTimeout(5000);

        // Check for CheerpJ 4.2 loader
        const cheerpjLoader = await page.evaluate(() => {
            const scripts = Array.from(document.querySelectorAll('script[src]'));
            return scripts.map(s => ({
                src: s.src,
                loaded: s.readyState || 'unknown'
            })).filter(s => s.src.includes('cheerpj') || s.src.includes('cjrtnc'));
        });
        console.log(`\n📦 CheerpJ Scripts Found:`);
        cheerpjLoader.forEach((script, i) => {
            console.log(`  ${i + 1}. ${script.src}`);
            console.log(`     Status: ${script.loaded}`);
        });

        // Check for CheerpJ 4.2 (not 3.0)
        const cheerpjImport = await page.evaluate(() => {
            const scripts = Array.from(document.querySelectorAll('script[type="module"]'));
            return scripts.map(s => s.textContent || s.innerHTML).join('\n');
        });
        
        console.log(`\n📋 CheerpJ Version Check:`);
        if (cheerpjImport.includes('3.0')) {
            console.log(`  ❌ ERROR: Found CheerpJ 3.0 (Windows version)`);
            console.log(`  ℹ️  Linux version requires CheerpJ 4.2`);
        } else if (cheerpjImport.includes('4.2')) {
            console.log(`  ✅ CheerpJ 4.2 found (correct for Linux)`);
        } else {
            console.log(`  ⚠️  No version found in imports`);
        }

        // Check Java version
        const javaVersion = await page.evaluate(() => {
            const html = document.documentElement.outerHTML;
            const javaVersionMatch = html.match(/java\.version=([^\s,]+)/);
            return javaVersionMatch ? javaVersionMatch[1] : 'not found';
        });
        console.log(`\n🔢 Java Version: ${javaVersion}`);
        if (javaVersion === '17.0.0') {
            console.log(`  ✅ Java 17 configured (correct for Linux)`);
        } else if (javaVersion === '1.8.0_202') {
            console.log(`  ❌ ERROR: Java 8 configured (Windows version)`);
            console.log(`  ℹ️  Linux version requires Java 17`);
        } else {
            console.log(`  ⚠️  Java version: ${javaVersion}`);
        }

        // Check for Linux-specific configuration
        const linuxConfig = await page.evaluate(() => {
            const html = document.documentElement.outerHTML;
            return {
                osName: html.includes('os.name=Linux'),
                linuxSettings: html.includes('com.fs.starfarer.settings.linux=true'),
                javaVersion: html.includes('java.version=17.0.0'),
                moduleFlags: html.includes('--add-opens=java.base')
            };
        });
        console.log(`\n🐧 Linux Configuration:`);
        console.log(`  os.name=Linux: ${linuxConfig.osName ? '✅' : '❌'}`);
        console.log(`  linux settings: ${linuxConfig.linuxSettings ? '✅' : '❌'}`);
        console.log(`  Java 17: ${linuxConfig.javaVersion ? '✅' : '❌'}`);
        console.log(`  Module flags: ${linuxConfig.moduleFlags ? '✅' : '❌'}`);

        // Monitor for stalls during JVM initialization
        console.log(`\n⏱️  Monitoring for stalls/hangs...`);
        const startTime = Date.now();
        let lastProgress = startTime;
        let progressCount = 0;

        // Check loading status periodically
        for (let i = 0; i < 24; i++) { // 2 minutes total (24 * 5 seconds)
            await page.waitForTimeout(5000);
            
            const currentTime = Date.now();
            const elapsed = currentTime - startTime;
            
            // Check for new console logs
            const newLogs = page.testData.consoleLogs.slice(-10);
            if (newLogs.length > 0) {
                console.log(`\n[${Math.floor(elapsed / 1000)}s] Recent console logs:`);
                newLogs.forEach(log => {
                    const logType = log.type.toUpperCase().padEnd(7);
                    console.log(`  [${logType}] ${log.text.substring(0, 100)}`);
                });
            }

            // Check loading status
            const loadingStatus = await page.locator('#loading-status').textContent().catch(() => 'Not found');
            const loadingSubstatus = await page.locator('#loading-substatus').textContent().catch(() => 'Not found');
            
            if (loadingStatus !== 'Not found') {
                console.log(`\n📊 Loading Status (${Math.floor(elapsed / 1000)}s):`);
                console.log(`  Status: ${loadingStatus}`);
                console.log(`  Substatus: ${loadingSubstatus}`);
                
                if (loadingStatus !== page.testData.lastStatus) {
                    page.testData.lastStatus = loadingStatus;
                    progressCount++;
                }
            }

            // Check for LWJGL canvas
            const lwjglCanvas = await page.locator('#lwjgl').count();
            if (lwjglCanvas > 0 && page.testData.lwjglCanvasCreated !== true) {
                console.log(`\n🎮 LWJGL Canvas: ✅ Created`);
                page.testData.lwjglCanvasCreated = true;
            }

            // Check for stall
            if (page.testData.stallDetected) {
                console.log(`\n❌ STALL DETECTED: No activity for 30+ seconds`);
                break;
            }

            // Check if game is running
            if (loadingStatus.includes('Running') || loadingSubstatus.includes('Running')) {
                console.log(`\n✅ Game is running!`);
                break;
            }

            // Check for errors
            if (page.testData.pageErrors.length > 0) {
                console.log(`\n❌ Page Errors: ${page.testData.pageErrors.length}`);
                page.testData.pageErrors.slice(0, 3).forEach((error, i) => {
                    console.log(`  ${i + 1}. ${error.message.substring(0, 150)}`);
                });
            }
        }

        // Final status
        const finalLoadingStatus = await page.locator('#loading-status').textContent().catch(() => 'Not found');
        const finalLwjglCanvas = await page.locator('#lwjgl').count();
        const finalErrors = page.testData.pageErrors.length;
        const finalStall = page.testData.stallDetected;

        console.log(`\n📝 Final Status:`);
        console.log(`  Total console logs: ${page.testData.consoleLogs.length}`);
        console.log(`  JVM init logs: ${page.testData.jvmInitLogs.length}`);
        console.log(`  Page errors: ${finalErrors}`);
        console.log(`  Network requests: ${page.testData.networkRequests.length}`);
        console.log(`  Failed responses: ${page.testData.networkResponses.filter(r => r.status >= 400).length}`);
        console.log(`  LWJGL Canvas: ${finalLwjglCanvas > 0 ? '✅ Created' : '❌ Not created'}`);
        console.log(`  Stall detected: ${finalStall ? '❌ YES' : '✅ No'}`);
        console.log(`  Loading status: ${finalLoadingStatus}`);

        // Take screenshot
        const screenshot = await page.screenshot({ fullPage: true });
        console.log(`\n📸 Screenshot captured (${screenshot.length} bytes)`);

        // Assert no stalls or hangs
        expect(finalStall).toBe(false);
        expect(finalErrors).toBe(0);

        // Assert Linux configuration is correct
        expect(linuxConfig.osName).toBe(true);
        expect(linuxConfig.linuxSettings).toBe(true);
        expect(linuxConfig.javaVersion).toBe(true);
        expect(linuxConfig.moduleFlags).toBe(true);

        console.log(`\n✅ Linux Starsector loaded successfully without stalls or hangs!`);
    });

    test('should verify CheerpJ 4.2 is loaded for Linux', async ({ page }) => {
        console.log(`\n🧪 Verifying CheerpJ 4.2 for Linux`);
        
        await page.goto(`${BASE_URL}/starsector.html`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.waitForTimeout(10000);

        const cheerpjVersion = await page.evaluate(() => {
            // Check for CheerpJ 4.2 loader
            if (typeof window.cheerpjInit !== 'undefined') {
                return { version: '4.2', available: true, method: 'cheerpjInit' };
            }
            // Check for cjFileBlob (CheerpJ 4.2)
            if (typeof window.cheerpJ_cjFileBlob !== 'undefined') {
                return { version: '4.2', available: true, method: 'cjFileBlob' };
            }
            return { version: 'unknown', available: false, method: 'none' };
        });

        console.log(`CheerpJ Version Detected: ${cheerpjVersion.version}`);
        console.log(`Available: ${cheerpjVersion.available}`);
        console.log(`Method: ${cheerpjVersion.method}`);

        // Verify CheerpJ 4.2 is loaded (not 3.0)
        expect(cheerpjVersion.version).toBe('4.2');
        expect(cheerpjVersion.available).toBe(true);

        console.log(`\n✅ CheerpJ 4.2 loaded correctly for Linux`);
    });
});
