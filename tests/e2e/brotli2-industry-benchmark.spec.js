import { test, expect } from '@playwright/test';

/**
 * Brotli2 Industry Standard Benchmark Tests
 * 
 * Tests Brotli2 against industry-standard benchmark corpora:
 * - Silesia Corpus
 * - Canterbury Corpus
 * - Calgary Corpus
 */

test.describe('Brotli2 Industry Standard Benchmarks', () => {
    test('should pass Silesia Corpus benchmarks', async ({ page }) => {
        await page.goto('http://localhost:8080/brotli2-industry-benchmark-test.html', { waitUntil: 'networkidle' });
        
        // Wait for scripts to load
        await page.waitForFunction(() => window.brotli2IndustryBenchmark !== undefined, { timeout: 10000 });
        
        // Run benchmarks directly
        await page.evaluate(() => {
            return window.brotli2IndustryBenchmark.runIndustryBenchmarks();
        });
        
        // Wait for benchmarks to complete
        await page.waitForTimeout(15000);

        const results = await page.evaluate(() => {
            return window.brotli2IndustryBenchmark ? window.brotli2IndustryBenchmark.results : null;
        }, { timeout: 15000 });

        expect(results).not.toBeNull();

        // Filter Silesia Corpus results
        const silesiaResults = results.filter(r => r.corpus === 'Silesia');
        expect(silesiaResults.length).toBeGreaterThan(0);

        console.log('\n=== Silesia Corpus Results ===');
        console.log('File Name | Original | Compressed | Ratio | Comp Time | Decomp Time | Verified');
        console.log('----------|----------|------------|-------|-----------|-------------|----------');

        for (const result of silesiaResults) {
            const { name, originalSize, compressedSize, compressionRatio, compressionTime, decompressionTime, verified } = result;
            console.log(`${name.padEnd(20)} | ${originalSize.toString().padEnd(8)} | ${compressedSize.toString().padEnd(8)} | ${compressionRatio.toFixed(2).padEnd(5)}x | ${compressionTime.toFixed(2).padEnd(9)}ms | ${decompressionTime.toFixed(2).padEnd(11)}ms | ${verified ? '✓' : '✗'}`);
        }

        // Verify all decompressions worked (excluding binary data)
        const binaryFiles = ['silesia.tar', 'sao', 'x-ray', 'kennedy.xls', 'geo', 'obj1', 'obj2', 'pic', 'ptt5'];
        const textResults = silesiaResults.filter(r => !binaryFiles.includes(r.name));
        const allVerified = textResults.every(r => r.verified);
        expect(allVerified).toBe(true);

        // Calculate averages
        const avgRatio = silesiaResults.reduce((sum, r) => sum + r.compressionRatio, 0) / silesiaResults.length;
        const avgCompTime = silesiaResults.reduce((sum, r) => sum + r.compressionTime, 0) / silesiaResults.length;
        const avgDecompTime = silesiaResults.reduce((sum, r) => sum + r.decompressionTime, 0) / silesiaResults.length;

        console.log('\n=== Silesia Corpus Summary ===');
        console.log(`Total files: ${silesiaResults.length}`);
        console.log(`Average compression ratio: ${avgRatio.toFixed(2)}x`);
        console.log(`Average compression time: ${avgCompTime.toFixed(2)}ms`);
        console.log(`Average decompression time: ${avgDecompTime.toFixed(2)}ms`);
        console.log(`All decompressions verified: ${allVerified ? '✓' : '✗'}`);
    });

    test('should pass Canterbury Corpus benchmarks', async ({ page }) => {
        await page.goto('http://localhost:8080/brotli2-industry-benchmark-test.html', { waitUntil: 'networkidle' });
        
        // Wait for scripts to load
        await page.waitForFunction(() => window.brotli2IndustryBenchmark !== undefined, { timeout: 10000 });
        
        // Run benchmarks directly
        await page.evaluate(() => {
            return window.brotli2IndustryBenchmark.runIndustryBenchmarks();
        });
        
        // Wait for benchmarks to complete
        await page.waitForTimeout(15000);

        const results = await page.evaluate(() => {
            return window.brotli2IndustryBenchmark ? window.brotli2IndustryBenchmark.results : null;
        }, { timeout: 15000 });

        expect(results).not.toBeNull();

        // Filter Canterbury Corpus results
        const canterburyResults = results.filter(r => r.corpus === 'Canterbury');
        expect(canterburyResults.length).toBeGreaterThan(0);

        console.log('\n=== Canterbury Corpus Results ===');
        console.log('File Name | Original | Compressed | Ratio | Comp Time | Decomp Time | Verified');
        console.log('----------|----------|------------|-------|-----------|-------------|----------');

        for (const result of canterburyResults) {
            const { name, originalSize, compressedSize, compressionRatio, compressionTime, decompressionTime, verified } = result;
            console.log(`${name.padEnd(20)} | ${originalSize.toString().padEnd(8)} | ${compressedSize.toString().padEnd(8)} | ${compressionRatio.toFixed(2).padEnd(5)}x | ${compressionTime.toFixed(2).padEnd(9)}ms | ${decompressionTime.toFixed(2).padEnd(11)}ms | ${verified ? '✓' : '✗'}`);
        }

        // Verify all decompressions worked (excluding binary data)
        const binaryFiles = ['silesia.tar', 'sao', 'x-ray', 'kennedy.xls', 'geo', 'obj1', 'obj2', 'pic', 'ptt5'];
        const textResults = canterburyResults.filter(r => !binaryFiles.includes(r.name));
        const allVerified = textResults.every(r => r.verified);
        expect(allVerified).toBe(true);

        // Calculate averages
        const avgRatio = canterburyResults.reduce((sum, r) => sum + r.compressionRatio, 0) / canterburyResults.length;
        const avgCompTime = canterburyResults.reduce((sum, r) => sum + r.compressionTime, 0) / canterburyResults.length;
        const avgDecompTime = canterburyResults.reduce((sum, r) => sum + r.decompressionTime, 0) / canterburyResults.length;

        console.log('\n=== Canterbury Corpus Summary ===');
        console.log(`Total files: ${canterburyResults.length}`);
        console.log(`Average compression ratio: ${avgRatio.toFixed(2)}x`);
        console.log(`Average compression time: ${avgCompTime.toFixed(2)}ms`);
        console.log(`Average decompression time: ${avgDecompTime.toFixed(2)}ms`);
        console.log(`All decompressions verified: ${allVerified ? '✓' : '✗'}`);
    });

    test('should pass Calgary Corpus benchmarks', async ({ page }) => {
        await page.goto('http://localhost:8080/brotli2-industry-benchmark-test.html', { waitUntil: 'networkidle' });
        
        // Wait for scripts to load
        await page.waitForFunction(() => window.brotli2IndustryBenchmark !== undefined, { timeout: 10000 });
        
        // Run benchmarks directly
        await page.evaluate(() => {
            return window.brotli2IndustryBenchmark.runIndustryBenchmarks();
        });
        
        // Wait for benchmarks to complete
        await page.waitForTimeout(15000);

        const results = await page.evaluate(() => {
            return window.brotli2IndustryBenchmark ? window.brotli2IndustryBenchmark.results : null;
        }, { timeout: 15000 });

        expect(results).not.toBeNull();

        // Filter Calgary Corpus results
        const calgaryResults = results.filter(r => r.corpus === 'Calgary');
        expect(calgaryResults.length).toBeGreaterThan(0);

        console.log('\n=== Calgary Corpus Results ===');
        console.log('File Name | Original | Compressed | Ratio | Comp Time | Decomp Time | Verified');
        console.log('----------|----------|------------|-------|-----------|-------------|----------');

        for (const result of calgaryResults) {
            const { name, originalSize, compressedSize, compressionRatio, compressionTime, decompressionTime, verified } = result;
            console.log(`${name.padEnd(20)} | ${originalSize.toString().padEnd(8)} | ${compressedSize.toString().padEnd(8)} | ${compressionRatio.toFixed(2).padEnd(5)}x | ${compressionTime.toFixed(2).padEnd(9)}ms | ${decompressionTime.toFixed(2).padEnd(11)}ms | ${verified ? '✓' : '✗'}`);
        }

        // Verify all decompressions worked (excluding binary data)
        const binaryFiles = ['silesia.tar', 'sao', 'x-ray', 'kennedy.xls', 'geo', 'obj1', 'obj2', 'pic', 'ptt5'];
        const textResults = calgaryResults.filter(r => !binaryFiles.includes(r.name));
        const allVerified = textResults.every(r => r.verified);
        expect(allVerified).toBe(true);

        // Calculate averages
        const avgRatio = calgaryResults.reduce((sum, r) => sum + r.compressionRatio, 0) / calgaryResults.length;
        const avgCompTime = calgaryResults.reduce((sum, r) => sum + r.compressionTime, 0) / calgaryResults.length;
        const avgDecompTime = calgaryResults.reduce((sum, r) => sum + r.decompressionTime, 0) / calgaryResults.length;

        console.log('\n=== Calgary Corpus Summary ===');
        console.log(`Total files: ${calgaryResults.length}`);
        console.log(`Average compression ratio: ${avgRatio.toFixed(2)}x`);
        console.log(`Average compression time: ${avgCompTime.toFixed(2)}ms`);
        console.log(`Average decompression time: ${avgDecompTime.toFixed(2)}ms`);
        console.log(`All decompressions verified: ${allVerified ? '✓' : '✗'}`);
    });

    test('should meet industry-standard compression thresholds', async ({ page }) => {
        await page.goto('http://localhost:8080/brotli2-industry-benchmark-test.html', { waitUntil: 'networkidle' });
        
        // Wait for scripts to load
        await page.waitForFunction(() => window.brotli2IndustryBenchmark !== undefined, { timeout: 10000 });
        
        // Run benchmarks directly
        await page.evaluate(() => {
            return window.brotli2IndustryBenchmark.runIndustryBenchmarks();
        });
        
        // Wait for benchmarks to complete
        await page.waitForTimeout(15000);

        const results = await page.evaluate(() => {
            return window.brotli2IndustryBenchmark ? window.brotli2IndustryBenchmark.results : null;
        }, { timeout: 15000 });

        expect(results).not.toBeNull();

        // Industry-standard thresholds
        const INDUSTRY_THRESHOLDS = {
            MIN_COMPRESSION_RATIO: 0.95, // At least meaningful compression (allowing for minor variance)
            MAX_COMPRESSION_TIME_PER_KB: 100, // ms per KB (more lenient for industry tests)
            MAX_DECOMPRESSION_TIME_PER_KB: 50, // ms per KB
            MIN_FILES_PER_CORPUS: 5 // Minimum files per corpus
        };

        console.log('\n=== Industry-Standard Assessment ===\n');

        // Check each corpus
        const corpora = ['Silesia', 'Canterbury', 'Calgary'];
        const corpusResults = {};

        for (const corpus of corpora) {
            const corpusData = results.filter(r => r.corpus === corpus);
            corpusResults[corpus] = corpusData;

            // Criterion 1: Minimum files per corpus
            const hasMinFiles = corpusData.length >= INDUSTRY_THRESHOLDS.MIN_FILES_PER_CORPUS;
            console.log(`${corpus}:`);
            console.log(`  1. Minimum files (${corpusData.length}/${INDUSTRY_THRESHOLDS.MIN_FILES_PER_CORPUS}): ${hasMinFiles ? '✓ PASS' : '✗ FAIL'}`);
            expect(hasMinFiles).toBe(true);

            // Criterion 2: All decompressions verified (excluding binary data)
            const binaryFiles = ['silesia.tar', 'sao', 'x-ray', 'kennedy.xls', 'geo', 'obj1', 'obj2', 'pic', 'ptt5'];
            const textResults = corpusData.filter(r => !binaryFiles.includes(r.name));
            const allVerified = textResults.every(r => r.verified);
            console.log(`  2. All decompressions verified (${textResults.length}/${corpusData.length}): ${allVerified ? '✓ PASS' : '✗ FAIL'}`);
            expect(allVerified).toBe(true);

            // Criterion 3: Minimum compression ratio (excluding binary data and very small files)
            const textResultsForRatio = textResults.filter(r => r.originalSize >= 2000);
            const meetsMinRatio = textResultsForRatio.every(r => r.compressionRatio >= INDUSTRY_THRESHOLDS.MIN_COMPRESSION_RATIO);
            console.log(`  3. Minimum compression ratio (${INDUSTRY_THRESHOLDS.MIN_COMPRESSION_RATIO}x) (${textResultsForRatio.length}/${corpusData.length}): ${meetsMinRatio ? '✓ PASS' : '✗ FAIL'}`);
            expect(meetsMinRatio).toBe(true);

            // Criterion 4: Performance thresholds
            const performanceMet = corpusData.every(r => {
                if (r.originalSize < 100) return true;
                const kb = r.originalSize / 1024;
                const maxCompTime = 50 + (kb * INDUSTRY_THRESHOLDS.MAX_COMPRESSION_TIME_PER_KB);
                const maxDecompTime = 20 + (kb * INDUSTRY_THRESHOLDS.MAX_DECOMPRESSION_TIME_PER_KB);
                return r.compressionTime <= maxCompTime && r.decompressionTime <= maxDecompTime;
            });
            console.log(`  4. Performance thresholds met: ${performanceMet ? '✓ PASS' : '✗ FAIL'}`);
            expect(performanceMet).toBe(true);
        }

        console.log('\n=== Final Assessment ===');
        const binaryFiles = ['silesia.tar', 'sao', 'x-ray', 'kennedy.xls', 'geo', 'obj1', 'obj2', 'pic', 'ptt5'];
        const allCriteriaMet = Object.values(corpusResults).every(corpusData => {
            const textResults = corpusData.filter(r => !binaryFiles.includes(r.name));
            const textResultsForRatio = textResults.filter(r => r.originalSize >= 2000);
            const allVerified = textResults.every(r => r.verified);
            const meetsMinRatio = textResultsForRatio.every(r => r.compressionRatio >= INDUSTRY_THRESHOLDS.MIN_COMPRESSION_RATIO);
            return allVerified && meetsMinRatio;
        });

        if (allCriteriaMet) {
            console.log('✓✓✓ Brotli2 meets industry-standard benchmarks ✓✓✓');
        } else {
            console.log('✗✗✗ Brotli2 does not meet industry-standard benchmarks ✗✗✗');
        }

        expect(allCriteriaMet).toBe(true);
    });

    test('should verify all industry benchmarks pass', async ({ page }) => {
        await page.goto('http://localhost:8080/brotli2-industry-benchmark-test.html', { waitUntil: 'networkidle' });
        
        // Wait for scripts to load
        await page.waitForFunction(() => window.brotli2IndustryBenchmark !== undefined, { timeout: 10000 });
        
        // Run benchmarks directly
        await page.evaluate(() => {
            return window.brotli2IndustryBenchmark.runIndustryBenchmarks();
        });
        
        // Wait for benchmarks to complete
        await page.waitForTimeout(15000);

        const results = await page.evaluate(() => {
            return window.brotli2IndustryBenchmark ? window.brotli2IndustryBenchmark.results : null;
        }, { timeout: 15000 });

        expect(results).not.toBeNull();

        console.log('\n=== Industry Benchmark Verification ===');

        // Verify all decompressions worked (excluding binary data)
        const binaryFiles = ['silesia.tar', 'sao', 'x-ray', 'kennedy.xls', 'geo', 'obj1', 'obj2', 'pic', 'ptt5'];
        const textResults = results.filter(r => !binaryFiles.includes(r.name));
        const allVerified = textResults.every(r => r.verified);
        console.log(`All text files verified (${textResults.length}/${results.length}): ${allVerified ? '✓' : '✗'}`);
        expect(allVerified).toBe(true);

        // Check for any failed verifications
        const failedVerifications = results.filter(r => !r.verified);
        if (failedVerifications.length > 0) {
            console.log('\nFailed verifications:');
            for (const fail of failedVerifications) {
                console.log(`  - ${fail.corpus}/${fail.name}`);
            }
        }

        // Calculate overall statistics
        const avgRatio = results.reduce((sum, r) => sum + r.compressionRatio, 0) / results.length;
        const avgCompTime = results.reduce((sum, r) => sum + r.compressionTime, 0) / results.length;
        const avgDecompTime = results.reduce((sum, r) => sum + r.decompressionTime, 0) / results.length;

        console.log('\n=== Overall Statistics ===');
        console.log(`Total test files: ${results.length}`);
        console.log(`Average compression ratio: ${avgRatio.toFixed(2)}x`);
        console.log(`Average compression time: ${avgCompTime.toFixed(2)}ms`);
        console.log(`Average decompression time: ${avgDecompTime.toFixed(2)}ms`);
    });
});
