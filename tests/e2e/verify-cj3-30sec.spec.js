import { test, expect } from '@playwright/test';

test('verify cj3.js loads correctly with 30 second wait and check for errors', async ({ page }) => {
    const errors = [];
    const networkErrors = [];
    const consoleMessages = [];
    const networkRequests = [];

    // Capture console messages
    page.on('console', msg => {
        const text = msg.text();
        consoleMessages.push(text);
        console.log(`[log] ${text}`);
    });

    // Capture page errors
    page.on('pageerror', error => {
        errors.push(error.message);
        console.error(`ERROR: ${error.message}`);
    });

    // Capture network errors
    page.on('response', response => {
        networkRequests.push({
            url: response.url(),
            status: response.status(),
            method: response.request().method()
        });

        if (response.status() >= 400) {
            networkErrors.push({
                url: response.url(),
                status: response.status()
            });
            console.error(`ERROR: Failed to load resource: the server responded with a status of ${response.status()} (${response.statusText()})`);
        }
    });

    // Navigate to the page
    await page.goto('http://localhost:8000/starsector.html');

    // Wait 30 seconds for page to load
    console.log('Waiting 30 seconds for page to load...');
    await page.waitForTimeout(30000);

    // Check for CheerpJ functions
    const cheerpjInitDefined = await page.evaluate(() => typeof window.cheerpjInit === 'function');
    const cheerpjRunMainDefined = await page.evaluate(() => typeof window.cheerpjRunMain === 'function');
    const cheerpjRunJarDefined = await page.evaluate(() => typeof window.cheerpjRunJar === 'function');
    const cjFileBlobDefined = await page.evaluate(() => typeof window.cjFileBlob === 'function');

    console.log(`cheerpjInit defined: ${cheerpjInitDefined}`);
    console.log(`cheerpjRunMain defined: ${cheerpjRunMainDefined}`);
    console.log(`cheerpjRunJar defined: ${cheerpjRunJarDefined}`);
    console.log(`cjFileBlob defined: ${cjFileBlobDefined}`);

    // Count cj3.js requests
    const cj3Requests = networkRequests.filter(req => req.url.includes('cj3.js'));
    console.log(`cj3.js requests: ${cj3Requests.length}`);
    cj3Requests.forEach(req => {
        console.log(`  ${req.method} ${req.url}`);
    });

    // Check for module import errors
    const moduleImportErrors = errors.filter(err => 
        err.includes('does not provide an export named') || 
        err.includes('The requested module')
    );

    console.log(`\n=== ERRORS ===`);
    if (errors.length > 0) {
        errors.forEach(err => console.error(`ERROR: ${err}`));
    } else {
        console.log('No errors found');
    }

    console.log(`\n=== WARNINGS ===`);
    const warnings = consoleMessages.filter(msg => msg.toLowerCase().includes('warning'));
    if (warnings.length > 0) {
        warnings.forEach(warn => console.warn(`WARNING: ${warn}`));
    } else {
        console.log('No warnings found');
    }

    console.log(`\n=== NETWORK ERRORS ===`);
    if (networkErrors.length > 0) {
        networkErrors.forEach(err => console.error(`NETWORK ERROR: ${err.status} ${err.url}`));
    } else {
        console.log('No network errors found');
    }

    console.log(`\n=== NETWORK REQUESTS SUMMARY ===`);
    console.log(`Total requests: ${networkRequests.length}`);

    const requestsByType = {};
    networkRequests.forEach(req => {
        const type = req.resourceType || 'unknown';
        requestsByType[type] = (requestsByType[type] || 0) + 1;
    });

    console.log('Requests by type:');
    Object.entries(requestsByType).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
    });

    // Assertions
    expect(cheerpjInitDefined).toBe(true);
    expect(cheerpjRunMainDefined).toBe(true);
    expect(cheerpjRunJarDefined).toBe(true);
    expect(cjFileBlobDefined).toBe(true);

    // Check for critical module import errors
    console.log(`\nCritical errors: ${moduleImportErrors.length}`);
    expect(moduleImportErrors.length).toBe(0);

    // Take screenshot
    await page.screenshot({ path: 'test-results/starsector-30sec-screenshot.png' });

    console.log(`\n=== FINAL SUMMARY ===`);
    console.log(`✓ All CheerpJ functions are available`);
    console.log(`✓ Screenshot saved to test-results/starsector-30sec-screenshot.png`);
    console.log(`✓ Console messages captured: ${consoleMessages.length}`);
    console.log(`✓ Network requests captured: ${networkRequests.length}`);
    console.log(`✓ No critical errors found`);
});
