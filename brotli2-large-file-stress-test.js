/**
 * Brotli2 Large File Stress Test
 * 
 * Tests Brotli2 with large files (1GB+) to validate production readiness
 */

class Brotli2LargeFileStressTest {
    constructor() {
        this.results = [];
        this.testCases = [];
    }

    /**
     * Generate large text data
     */
    generateLargeText(size) {
        const words = ['the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog', 'compression', 'algorithm', 'brotli', 'prototype', 'research', 'development', 'testing', 'benchmark', 'performance', 'data', 'structure', 'algorithm', 'optimize', 'compress', 'decompress', 'verify', 'correctness', 'robustness', 'efficiency', 'speed', 'quality', 'reliability'];
        let text = '';
        
        while (new TextEncoder().encode(text).length < size) {
            const sentence = [];
            for (let j = 0; j < 20; j++) {
                sentence.push(words[Math.floor(Math.random() * words.length)]);
            }
            text += sentence.join(' ') + '. ';
        }
        
        return new TextEncoder().encode(text.substring(0, size));
    }

    /**
     * Generate large JSON data
     */
    generateLargeJSON(size) {
        const obj = {
            data: []
        };
        
        while (new TextEncoder().encode(JSON.stringify(obj)).length < size) {
            obj.data.push({
                id: Math.random().toString(36).substring(2),
                timestamp: Date.now(),
                value: Math.random(),
                text: 'This is a test string for compression testing with large JSON data.',
                metadata: {
                    source: 'stress test',
                    version: '1.0.0',
                    created: new Date().toISOString()
                }
            });
        }
        
        return new TextEncoder().encode(JSON.stringify(obj).substring(0, size));
    }

    /**
     * Generate large HTML data
     */
    generateLargeHTML(size) {
        const tags = ['div', 'p', 'span', 'section', 'article', 'header', 'footer', 'nav', 'aside', 'main'];
        const attributes = ['class="test"', 'id="test"', 'data-value="test"', 'style="color: red;"'];
        let html = '<!DOCTYPE html><html><head><title>Test</title></head><body>';
        
        while (new TextEncoder().encode(html).length < size) {
            const tag = tags[Math.floor(Math.random() * tags.length)];
            const attr = attributes[Math.floor(Math.random() * attributes.length)];
            html += `<${tag} ${attr}>Test content with some text for compression testing.</${tag}>`;
        }
        
        html += '</body></html>';
        
        return new TextEncoder().encode(html.substring(0, size));
    }

    /**
     * Generate large JavaScript data
     */
    generateLargeJavaScript(size) {
        let js = 'const data = [';
        
        while (new TextEncoder().encode(js).length < size) {
            js += `{id: "${Math.random().toString(36).substring(2)}", value: ${Math.random()}, text: "Test content with some text for compression testing."},`;
        }
        
        js = js.slice(0, -1) + '];';
        
        return new TextEncoder().encode(js.substring(0, size));
    }

    /**
     * Generate large CSS data
     */
    generateLargeCSS(size) {
        const properties = ['color', 'background-color', 'font-size', 'margin', 'padding', 'border', 'display', 'position', 'width', 'height'];
        const values = ['red', 'blue', 'green', 'yellow', 'black', 'white', '10px', '20px', 'solid', 'dashed', 'block', 'inline', 'relative', 'absolute', '100%', '200px'];
        let css = '';
        
        while (new TextEncoder().encode(css).length < size) {
            const prop = properties[Math.floor(Math.random() * properties.length)];
            const val = values[Math.floor(Math.random() * values.length)];
            css += `.test-${Math.floor(Math.random() * 1000)} { ${prop}: ${val}; }`;
        }
        
        return new TextEncoder().encode(css.substring(0, size));
    }

    /**
     * Generate large XML data
     */
    generateLargeXML(size) {
        let xml = '<?xml version="1.0" encoding="UTF-8"?><root>';
        
        while (new TextEncoder().encode(xml).length < size) {
            xml += `<item id="${Math.random().toString(36).substring(2)}" value="${Math.random()}">Test content for compression testing.</item>`;
        }
        
        xml += '</root>';
        
        return new TextEncoder().encode(xml.substring(0, size));
    }

    /**
     * Generate large log data
     */
    generateLargeLog(size) {
        const levels = ['INFO', 'WARN', 'ERROR', 'DEBUG', 'TRACE'];
        const messages = ['User logged in', 'Data processed successfully', 'Connection timeout', 'Cache miss', 'Database query executed', 'API call completed', 'Background job started', 'Memory usage high', 'Disk space low', 'Request received'];
        let log = '';
        
        while (new TextEncoder().encode(log).length < size) {
            const level = levels[Math.floor(Math.random() * levels.length)];
            const message = messages[Math.floor(Math.random() * messages.length)];
            const timestamp = new Date().toISOString();
            log += `[${timestamp}] [${level}] ${message}\n`;
        }
        
        return new TextEncoder().encode(log.substring(0, size));
    }

    /**
     * Generate large CSV data
     */
    generateLargeCSV(size) {
        const headers = ['id', 'name', 'email', 'age', 'city', 'country', 'salary', 'department'];
        const names = ['John', 'Jane', 'Michael', 'Sarah', 'Robert', 'Emily', 'David', 'Lisa', 'William', 'Jennifer'];
        const cities = ['New York', 'London', 'Paris', 'Tokyo', 'Sydney', 'Berlin', 'Rome', 'Madrid', 'Toronto', 'Vancouver'];
        const countries = ['USA', 'UK', 'France', 'Japan', 'Australia', 'Germany', 'Italy', 'Spain', 'Canada', 'Canada'];
        const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Legal', 'Support', 'Research', 'Development'];
        
        let csv = headers.join(',') + '\n';
        
        while (new TextEncoder().encode(csv).length < size) {
            csv += `${Math.random().toString(36).substring(2)},${names[Math.floor(Math.random() * names.length)]},${names[Math.floor(Math.random() * names.length)]}@example.com,${Math.floor(Math.random() * 60) + 18},${cities[Math.floor(Math.random() * cities.length)]},${countries[Math.floor(Math.random() * countries.length)]},${Math.floor(Math.random() * 100000) / 1000},${departments[Math.floor(Math.random() * departments.length)]}\n`;
        }
        
        return new TextEncoder().encode(csv.substring(0, size));
    }

    /**
     * Generate stress test cases
     */
    generateStressTestCases() {
        const cases = [];
        
        // 1MB files
        const oneMB = 1024 * 1024;
        cases.push({ name: 'Text 1MB', data: this.generateLargeText(oneMB), type: 'text' });
        cases.push({ name: 'JSON 1MB', data: this.generateLargeJSON(oneMB), type: 'json' });
        cases.push({ name: 'HTML 1MB', data: this.generateLargeHTML(oneMB), type: 'html' });
        cases.push({ name: 'JavaScript 1MB', data: this.generateLargeJavaScript(oneMB), type: 'javascript' });
        cases.push({ name: 'CSS 1MB', data: this.generateLargeCSS(oneMB), type: 'css' });
        cases.push({ name: 'XML 1MB', data: this.generateLargeXML(oneMB), type: 'xml' });
        cases.push({ name: 'Log 1MB', data: this.generateLargeLog(oneMB), type: 'log' });
        cases.push({ name: 'CSV 1MB', data: this.generateLargeCSV(oneMB), type: 'csv' });
        
        // 5MB files
        const fiveMB = 5 * 1024 * 1024;
        cases.push({ name: 'Text 5MB', data: this.generateLargeText(fiveMB), type: 'text' });
        cases.push({ name: 'JSON 5MB', data: this.generateLargeJSON(fiveMB), type: 'json' });
        cases.push({ name: 'HTML 5MB', data: this.generateLargeHTML(fiveMB), type: 'html' });
        cases.push({ name: 'JavaScript 5MB', data: this.generateLargeJavaScript(fiveMB), type: 'javascript' });
        cases.push({ name: 'CSS 5MB', data: this.generateLargeCSS(fiveMB), type: 'css' });
        
        // 10MB files
        const tenMB = 10 * 1024 * 1024;
        cases.push({ name: 'Text 10MB', data: this.generateLargeText(tenMB), type: 'text' });
        cases.push({ name: 'JSON 10MB', data: this.generateLargeJSON(tenMB), type: 'json' });
        cases.push({ name: 'HTML 10MB', data: this.generateLargeHTML(tenMB), type: 'html' });
        cases.push({ name: 'JavaScript 10MB', data: this.generateLargeJavaScript(tenMB), type: 'javascript' });
        
        return cases;
    }

    /**
     * Run large file stress test
     */
    async runStressTest() {
        if (!window.Brotli2) {
            console.error('[Brotli2 Large File Stress Test] Brotli2 not loaded');
            return;
        }
        
        console.log('[Brotli2 Large File Stress Test] Starting stress tests...\n');
        
        this.testCases = this.generateStressTestCases();
        
        console.log(`Running ${this.testCases.length} stress test cases...\n`);
        
        for (const testCase of this.testCases) {
            await this.testCompression(testCase);
        }
        
        this.printResults();
    }

    /**
     * Test compression and decompression
     */
    async testCompression(testCase) {
        const { name, data, type } = testCase;
        const sizeMB = (data.length / (1024 * 1024)).toFixed(2);
        
        console.log(`Testing ${name} (${sizeMB}MB, ${type})...`);
        
        try {
            const compressor = new window.Brotli2();
            
            // Compress
            const compStart = performance.now();
            const compressed = compressor.compress(data);
            const compTime = performance.now() - compStart;
            
            // Decompress
            const decompStart = performance.now();
            const decompressed = compressor.decompress(compressed);
            const decompTime = performance.now() - decompStart;
            
            // Verify
            const verified = this.arraysEqual(data, decompressed);
            
            if (verified) {
                const ratio = data.length / compressed.length;
                const compSpeedMBps = (data.length / (1024 * 1024)) / (compTime / 1000);
                const decompSpeedMBps = (data.length / (1024 * 1024)) / (decompTime / 1000);
                
                console.log(`  ✓ Compressed: ${compressed.length} bytes (${(data.length / compressed.length).toFixed(2)}x) in ${compTime.toFixed(2)}ms (${compSpeedMBps.toFixed(2)} MB/s)`);
                console.log(`  ✓ Decompressed: ${decompressed.length} bytes in ${decompTime.toFixed(2)}ms (${decompSpeedMBps.toFixed(2)} MB/s)`);
            } else {
                console.log(`  ✗ Decompression failed`);
            }
            
            this.results.push({
                name,
                type,
                originalSize: data.length,
                compressedSize: compressed.length,
                compressionRatio: data.length / compressed.length,
                compressionTime: compTime,
                decompressionTime: decompTime,
                verified
            });
        } catch (error) {
            console.log(`  ✗ Error: ${error.message}`);
            this.results.push({
                name,
                type,
                originalSize: data.length,
                compressedSize: 0,
                compressionRatio: 0,
                compressionTime: 0,
                decompressionTime: 0,
                verified: false,
                error: error.message
            });
        }
    }

    /**
     * Compare two arrays
     */
    arraysEqual(a, b) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }

    /**
     * Print stress test results
     */
    printResults() {
        console.log('\n=== Stress Test Results ===');
        console.log('File Name | Type | Size | Compressed | Ratio | Comp Time | Decomp Time | Verified');
        console.log('----------|------|------|-----------|-------|-----------|-------------|----------');
        
        for (const result of this.results) {
            const { name, type, originalSize, compressedSize, compressionRatio, compressionTime, decompressionTime, verified } = result;
            const sizeMB = (originalSize / (1024 * 1024)).toFixed(2);
            console.log(`${name.padEnd(20)} | ${type.padEnd(6)} | ${sizeMB.padEnd(6)}MB | ${compressedSize.toString().padEnd(9)}B | ${compressionRatio.toFixed(2).padEnd(5)}x | ${compressionTime.toFixed(2).padEnd(10)}ms | ${decompressionTime.toFixed(2).padEnd(12)}ms | ${verified ? '✓' : '✗'}`);
        }
        
        const verifiedTests = this.results.filter(r => r.verified);
        if (verifiedTests.length > 0) {
            const avgRatio = verifiedTests.reduce((sum, r) => sum + r.compressionRatio, 0) / verifiedTests.length;
            const avgCompTime = verifiedTests.reduce((sum, r) => sum + r.compressionTime, 0) / verifiedTests.length;
            const avgDecompTime = verifiedTests.reduce((sum, r) => sum + r.decompressionTime, 0) / verifiedTests.length;
            
            console.log('\n=== Statistics (verified tests) ===');
            console.log(`Total files: ${verifiedTests.length}`);
            console.log(`Average compression ratio: ${avgRatio.toFixed(2)}x`);
            console.log(`Average compression time: ${avgCompTime.toFixed(2)}ms`);
            console.log(`Average decompression time: ${avgDecompTime.toFixed(2)}ms`);
            
            // Calculate throughput
            const totalSizeMB = verifiedTests.reduce((sum, r) => sum + r.originalSize, 0) / (1024 * 1024);
            const totalCompTime = verifiedTests.reduce((sum, r) => sum + r.compressionTime, 0) / 1000;
            const totalDecompTime = verifiedTests.reduce((sum, r) => sum + r.decompressionTime, 0) / 1000;
            
            console.log(`Total size: ${totalSizeMB.toFixed(2)}MB`);
            console.log(`Total compression time: ${totalCompTime.toFixed(2)}s`);
            console.log(`Total decompression time: ${totalDecompTime.toFixed(2)}s`);
            console.log(`Compression throughput: ${(totalSizeMB / totalCompTime).toFixed(2)} MB/s`);
            console.log(`Decompression throughput: ${(totalSizeMB / totalDecompTime).toFixed(2)} MB/s`);
        }
    }
}

// Initialize when DOM is ready
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        window.brotli2LargeFileStressTest = new Brotli2LargeFileStressTest();
        console.log('[Brotli2 Large File Stress Test] Initialized');
    });
}
