import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

test.describe('Starsector JVM Initialization Debug', () => {
    test.beforeEach(async ({ page }) => {
        // Track console logs
        page.testData = {
            consoleLogs: [],
            pageErrors: [],
            networkRequests: [],
            networkResponses: [],
            jvmInitLogs: []
        };

        page.on('console', msg => {
            const logEntry = {
                type: msg.type(),
                text: msg.text(),
                location: msg.location(),
                timestamp: Date.now()
            };
            page.testData.consoleLogs.push(logEntry);
            
            // Track JVM initialization logs
            if (logEntry.text.toLowerCase().includes('cheerpj') || 
                logEntry.text.toLowerCase().includes('jvm') ||
                logEntry.text.toLowerCase().includes('java') ||
                logEntry.text.toLowerCase().includes('lwjgl') ||
                logEntry.text.toLowerCase().includes('initializing')) {
                page.testData.jvmInitLogs.push(logEntry);
            }
        });

        page.on('pageerror', error => {
            page.testData.pageErrors.push({
                message: error.message,
                stack: error.stack,
                timestamp: Date.now()
            });
        });

        page.on('request', request => {
            page.testData.networkRequests.push({
                url: request.url(),
                method: request.method(),
                resourceType: request.resourceType(),
                timestamp: Date.now()
            });
        });

        page.on('response', response => {
            page.testData.networkResponses.push({
                url: response.url(),
                status: response.status(),
                headers: response.headers(),
                timestamp: Date.now()
            });
        });
    });

    test('should capture JVM initialization and identify CheerpJ version issues', async ({ page }) => {
        console.log(`\n🔍 Debugging Starsector JVM Initialization`);
        console.log(`URL: ${BASE_URL}/starsector.html`);
        
        // Navigate to Starsector page
        await page.goto(`${BASE_URL}/starsector.html`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        
        // Wait for initial page load
        await page.waitForTimeout(5000);

        // Check for CheerpJ loader script
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

        // Check for CheerpJ version in imports
        const cheerpjImports = await page.evaluate(() => {
            const scripts = Array.from(document.querySelectorAll('script[type="module"]'));
            return scripts.map(s => s.textContent || s.innerHTML).join('\n');
        });
        
        console.log(`\n📋 CheerpJ Module Imports:`);
        if (cheerpjImports.includes('3.0')) {
            console.log(`  ❌ CRITICAL: Found CheerpJ 3.0 import (needs 4.2 for Java 17)`);
        } else if (cheerpjImports.includes('4.2')) {
            console.log(`  ✅ Found CheerpJ 4.2 import`);
        } else {
            console.log(`  ⚠️  No version found in imports`);
        }

        // Wait longer for JVM initialization
        await page.waitForTimeout(10000);

        // Check JVM initialization logs
        console.log(`\n🔄 JVM Initialization Logs (${page.testData.jvmInitLogs.length}):`);
        page.testData.jvmInitLogs.slice(0, 20).forEach((log, i) => {
            console.log(`  ${i + 1}. [${log.type}] ${log.text.substring(0, 150)}`);
        });

        // Check for specific error patterns
        const javaVersionLogs = page.testData.jvmInitLogs.filter(log => 
            log.text.toLowerCase().includes('java.version') ||
            log.text.toLowerCase().includes('java 17') ||
            log.text.toLowerCase().includes('java 8')
        );
        console.log(`\n🔢 Java Version Logs (${javaVersionLogs.length}):`);
        javaVersionLogs.forEach(log => {
            console.log(`  ${log.text}`);
        });

        // Check for CheerpJ initialization errors
        const cheerpjErrors = page.testData.jvmInitLogs.filter(log => 
            log.type === 'error' && 
            (log.text.toLowerCase().includes('cheerpj') || 
             log.text.toLowerCase().includes('jvm'))
        );
        console.log(`\n❌ CheerpJ/JVM Errors (${cheerpjErrors.length}):`);
        cheerpjErrors.forEach(log => {
            console.log(`  ${log.text}`);
        });

        // Check page errors
        console.log(`\n💥 Page Errors (${page.testData.pageErrors.length}):`);
        page.testData.pageErrors.slice(0, 10).forEach((error, i) => {
            console.log(`  ${i + 1}. ${error.message.substring(0, 200)}`);
        });

        // Check network requests for CheerpJ resources
        const cheerpjRequests = page.testData.networkRequests.filter(req => 
            req.url.includes('cheerpj') || 
            req.url.includes('cjrtnc') ||
            req.url.includes('lwjgl')
        );
        console.log(`\n🌐 CheerpJ Network Requests (${cheerpjRequests.length}):`);
        cheerpjRequests.forEach((req, i) => {
            console.log(`  ${i + 1}. ${req.url}`);
            console.log(`     Method: ${req.method}, Type: ${req.resourceType}`);
        });

        // Check for failed CheerpJ responses
        const cheerpjResponses = page.testData.networkResponses.filter(res => 
            (res.url.includes('cheerpj') || 
             res.url.includes('cjrtnc') ||
             res.url.includes('lwjgl')) && res.status >= 400
        );
        console.log(`\n⚠️  Failed CheerpJ Responses (${cheerpjResponses.length}):`);
        cheerpjResponses.forEach(res => {
            console.log(`  ${res.url} → ${res.status}`);
        });

        // Check if game canvas is created
        const lwjglCanvas = await page.locator('#lwjgl').count();
        console.log(`\n🎮 LWJGL Canvas: ${lwjglCanvas > 0 ? '✅ Created' : '❌ Not created'}`);

        // Check loading status
        const loadingStatus = await page.locator('#loading-status').textContent().catch(() => 'Not found');
        const loadingSubstatus = await page.locator('#loading-substatus').textContent().catch(() => 'Not found');
        console.log(`\n📊 Loading Status:`);
        console.log(`  Status: ${loadingStatus}`);
        console.log(`  Substatus: ${loadingSubstatus}`);

        // Take screenshot
        const screenshot = await page.screenshot({ fullPage: true });
        console.log(`\n📸 Screenshot captured (${screenshot.length} bytes)`);

        // Assert findings
        console.log(`\n📝 Summary:`);
        console.log(`  Total console logs: ${page.testData.consoleLogs.length}`);
        console.log(`  JVM init logs: ${page.testData.jvmInitLogs.length}`);
        console.log(`  Page errors: ${page.testData.pageErrors.length}`);
        console.log(`  Network requests: ${page.testData.networkRequests.length}`);
        console.log(`  Failed responses: ${page.testData.networkResponses.filter(r => r.status >= 400).length}`);

        // Check for critical issues
        const hasCheerpj30 = cheerpjImports.includes('3.0');
        const hasCheerpj42 = cheerpjImports.includes('4.2');
        const hasJava8 = javaVersionLogs.some(log => log.text.includes('1.8'));
        const hasJava17 = javaVersionLogs.some(log => log.text.includes('17'));

        console.log(`\n🔍 Critical Findings:`);
        console.log(`  CheerpJ 3.0 import: ${hasCheerpj30 ? '❌ YES (WRONG!)' : '✅ No'}`);
        console.log(`  CheerpJ 4.2 import: ${hasCheerpj42 ? '✅ YES' : '❌ No'}`);
        console.log(`  Java 8 detected: ${hasJava8 ? '❌ YES (WRONG!)' : '✅ No'}`);
        console.log(`  Java 17 detected: ${hasJava17 ? '✅ YES' : '❌ No'}`);

        // Save detailed logs to file
        const debugReport = {
            timestamp: new Date().toISOString(),
            url: `${BASE_URL}/starsector.html`,
            cheerpjScripts,
            cheerpjImports,
            jvmInitLogs: page.testData.jvmInitLogs,
            pageErrors: page.testData.pageErrors,
            cheerpjRequests: cheerpjRequests.map(r => ({ url: r.url, method: r.method })),
            cheerpjResponses: cheerpjResponses.map(r => ({ url: r.url, status: r.status })),
            findings: {
                hasCheerpj30,
                hasCheerpj42,
                hasJava8,
                hasJava17,
                lwjglCanvasCreated: lwjglCanvas > 0,
                loadingStatus,
                loadingSubstatus
            }
        };

        console.log(`\n💾 Debug report generated with ${JSON.stringify(debugReport).length} bytes`);
    });

    test('should test CheerpJ version compatibility', async ({ page }) => {
        console.log(`\n🧪 Testing CheerpJ Version Compatibility`);
        
        await page.goto(`${BASE_URL}/starsector.html`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.waitForTimeout(5000);

        // Check what CheerpJ version is actually loaded
        const cheerpjVersion = await page.evaluate(() => {
            // Check for CheerpJ 4.2 loader
            if (typeof window.cheerpjInit !== 'undefined') {
                return { version: '4.2', available: true, method: 'cheerpjInit' };
            }
            // Check for CheerpJ 3.0
            if (typeof window.cheerpJRunMain !== 'undefined') {
                return { version: '3.0', available: true, method: 'cheerpJRunMain' };
            }
            // Check for cjFileBlob (CheerpJ 3.0)
            if (typeof window.cheerpJ_cjFileBlob !== 'undefined') {
                return { version: '3.0', available: true, method: 'cjFileBlob' };
            }
            return { version: 'unknown', available: false, method: 'none' };
        });

        console.log(`CheerpJ Version Detected: ${cheerpjVersion.version}`);
        console.log(`Available: ${cheerpjVersion.available}`);
        console.log(`Method: ${cheerpjVersion.method}`);

        // Check Java version in properties
        const javaVersion = await page.evaluate(() => {
            // This would need to be checked in the cheerpjInit call
            // For now, we'll check the HTML source
            const html = document.documentElement.outerHTML;
            const javaVersionMatch = html.match(/java\.version=([^\s,]+)/);
            return javaVersionMatch ? javaVersionMatch[1] : 'not found';
        });

        console.log(`Java Version in config: ${javaVersion}`);

        // Verify compatibility
        console.log(`\n✅ Compatibility Check:`);
        if (cheerpjVersion.version === '3.0') {
            console.log(`  ❌ CheerpJ 3.0 loaded - Only supports Java 8`);
            console.log(`  ❌ Starsector requires Java 17 - INCOMPATIBLE`);
        } else if (cheerpjVersion.version === '4.2') {
            console.log(`  ✅ CheerpJ 4.2 loaded - Supports Java 17`);
            if (javaVersion.includes('17')) {
                console.log(`  ✅ Java 17 configured - COMPATIBLE`);
            } else if (javaVersion.includes('1.8')) {
                console.log(`  ⚠️  Java 8 configured but CheerpJ 4.2 can handle it`);
            } else {
                console.log(`  ⚠️  Java version: ${javaVersion}`);
            }
        } else {
            console.log(`  ❌ Unknown CheerpJ version: ${cheerpjVersion.version}`);
        }

        expect(cheerpjVersion.version).toBe('4.2');
    });
});
