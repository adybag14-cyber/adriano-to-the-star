import { test, expect } from '@playwright/test';

test('inspect canvas content and detect stall/hang', async ({ page }) => {
    const errors = [];
    const networkErrors = [];
    const consoleMessages = [];
    const canvasSnapshots = [];

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
        if (response.status() >= 400) {
            networkErrors.push({
                url: response.url(),
                status: response.status()
            });
            console.error(`ERROR: Failed to load resource: ${response.status()} ${response.url()}`);
        }
    });

    // Navigate to the page
    await page.goto('http://localhost:8000/starsector.html');

    // Wait for canvas to be created
    await page.waitForSelector('#lwjgl', { timeout: 10000 });
    console.log('Canvas created');

    // Take initial canvas snapshot
    let canvas = await page.locator('#lwjgl');
    let initialSnapshot = await canvas.screenshot();
    canvasSnapshots.push({ time: 0, data: initialSnapshot });

    // Monitor canvas for changes over 60 seconds
    console.log('Monitoring canvas for 60 seconds...');
    let lastSnapshot = initialSnapshot;
    let canvasChanged = false;
    let canvasBlack = true;

    for (let i = 1; i <= 60; i++) {
        await page.waitForTimeout(1000);
        
        // Take canvas snapshot
        let snapshot = await canvas.screenshot();
        canvasSnapshots.push({ time: i, data: snapshot });
        
        // Check if canvas changed from previous snapshot
        let changed = !snapshot.equals(lastSnapshot);
        if (changed) {
            canvasChanged = true;
            console.log(`Canvas changed at second ${i}`);
        }
        
        // Check if canvas is black (all pixels are black)
        let isBlack = await page.evaluate(async () => {
            const canvas = document.getElementById('lwjgl');
            if (!canvas) return null;
            const ctx = canvas.getContext('2d');
            if (!ctx) return null;
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            // Check if all pixels are black (or very close to black)
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                // If any pixel is not black (allowing for some noise)
                if (r > 10 || g > 10 || b > 10) {
                    return false;
                }
            }
            return true;
        });
        
        if (isBlack === false) {
            canvasBlack = false;
            console.log(`Canvas has content (not black) at second ${i}`);
        }
        
        lastSnapshot = snapshot;
    }

    // Check for CheerpJ functions
    const cheerpjInitDefined = await page.evaluate(() => typeof window.cheerpjInit === 'function');
    const cheerpjRunMainDefined = await page.evaluate(() => typeof window.cheerpjRunMain === 'function');

    console.log(`\n=== CANVAS INSPECTION RESULTS ===`);
    console.log(`Canvas changed during monitoring: ${canvasChanged}`);
    console.log(`Canvas is black: ${canvasBlack}`);
    console.log(`Total snapshots: ${canvasSnapshots.length}`);
    console.log(`cheerpjInit defined: ${cheerpjInitDefined}`);
    console.log(`cheerpjRunMain defined: ${cheerpjRunMainDefined}`);

    console.log(`\n=== ERRORS ===`);
    if (errors.length > 0) {
        errors.forEach(err => console.error(`ERROR: ${err}`));
    } else {
        console.log('No errors found');
    }

    console.log(`\n=== NETWORK ERRORS ===`);
    if (networkErrors.length > 0) {
        networkErrors.forEach(err => console.error(`NETWORK ERROR: ${err.status} ${err.url}`));
    } else {
        console.log('No network errors found');
    }

    // Save final canvas screenshot
    await page.screenshot({ path: 'test-results/canvas-final.png' });
    console.log('Final screenshot saved to test-results/canvas-final.png');

    // Assertions
    expect(cheerpjInitDefined).toBe(true);
    expect(cheerpjRunMainDefined).toBe(true);

    // Check for critical errors
    const moduleImportErrors = errors.filter(err => 
        err.includes('does not provide an export named') || 
        err.includes('The requested module')
    );
    console.log(`\nCritical errors: ${moduleImportErrors.length}`);
    expect(moduleImportErrors.length).toBe(0);

    console.log(`\n=== FINAL SUMMARY ===`);
    console.log(`✓ Canvas inspection complete`);
    console.log(`✓ Canvas changed: ${canvasChanged}`);
    console.log(`✓ Canvas has content: ${!canvasBlack}`);
    console.log(`✓ Screenshot saved to test-results/canvas-final.png`);
    console.log(`✓ Console messages captured: ${consoleMessages.length}`);
    console.log(`✓ No critical errors found`);
});
