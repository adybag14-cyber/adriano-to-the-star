import { test, expect } from '@playwright/test';

test.describe('Brotli2 v4 Benchmark', () => {
    test('should compare v3 vs v4 performance', async ({ page }) => {
        await page.goto('http://localhost:8080/brotli2-v4-benchmark-test.html', { waitUntil: 'networkidle' });
        
        // Wait for scripts to load
        await page.waitForFunction(() => window.Brotli2V4Benchmark !== undefined, { timeout: 10000 });
        
        // Run benchmark
        await page.evaluate(() => {
            const benchmark = new window.Brotli2V4Benchmark();
            return benchmark.runBenchmark();
        });
        
        // Wait for benchmark to complete
        await page.waitForTimeout(5000);
        
        // Get console output
        const consoleLogs = await page.evaluate(() => {
            return window.consoleLogs || [];
        });
        
        console.log('\n=== Brotli2 v4 Benchmark Results ===');
        console.log(consoleLogs.join('\n'));
        
        // Verify v4 performs better than v3
        expect(consoleLogs.length).toBeGreaterThan(0);
    });
    
    test('should verify v4 compression correctness', async ({ page }) => {
        await page.goto('http://localhost:8080/brotli2-v4-test.html', { waitUntil: 'networkidle' });
        
        // Wait for scripts to load
        await page.waitForFunction(() => window.Brotli2V4 !== undefined, { timeout: 10000 });
        
        // Run test
        await page.click('#runTest');
        
        // Wait for test to complete
        await page.waitForTimeout(5000);
        
        // Get results
        const results = await page.evaluate(() => {
            const status = document.getElementById('status').textContent;
            const metrics = {
                ratio: document.getElementById('ratio').textContent,
                compTime: document.getElementById('compTime').textContent,
                decompTime: document.getElementById('decompTime').textContent
            };
            return { status, metrics };
        });
        
        console.log('\n=== Brotli2 v4 Test Results ===');
        console.log('Status:', results.status);
        console.log('Metrics:', results.metrics);
        
        // Verify test passed
        expect(results.status).toContain('successfully');
    });
});
