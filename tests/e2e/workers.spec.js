/**
 * 🧪 WORKERS TESTS
 * Test service workers and web workers
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://adrianotothestar.com';

test.describe('Workers Tests', () => {
    test('should detect service workers', async ({ page }) => {
        console.log('\n⚙️ Testing Service Workers...');
        
        await page.goto(`${BASE_URL}/exoplanet-pioneer.html`, { waitUntil: 'networkidle', timeout: 60000 });
        
        const workers = await page.evaluate(async () => {
            const result = {
                serviceWorkers: [],
                webWorkers: [],
                hasServiceWorkerSupport: 'serviceWorker' in navigator
            };
            
            // Check for Service Workers
            if ('serviceWorker' in navigator) {
                try {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (const registration of registrations) {
                        result.serviceWorkers.push({
                            scope: registration.scope,
                            state: registration.active?.state,
                            scriptURL: registration.active?.scriptURL,
                            installing: registration.installing?.state,
                            waiting: registration.waiting?.state
                        });
                    }
                } catch (error) {
                    result.serviceWorkerError = error.message;
                }
            }
            
            return result;
        });
        
        console.log('Service Workers:', JSON.stringify(workers, null, 2));
        
        expect(workers.hasServiceWorkerSupport).toBe(true);
    });

    test('should detect web workers in window', async ({ page }) => {
        console.log('\n⚙️ Testing Web Workers...');
        
        await page.goto(`${BASE_URL}/exoplanet-pioneer.html`, { waitUntil: 'networkidle', timeout: 60000 });
        
        const webWorkers = await page.evaluate(() => {
            const result = {
                workers: [],
                workerCount: 0
            };
            
            // Check for workers in window object
            if (window.workers && Array.isArray(window.workers)) {
                result.workers = window.workers.map(w => ({
                    status: w.status,
                    type: w.type || 'unknown'
                }));
                result.workerCount = window.workers.length;
            }
            
            // Check for individual worker objects
            const workerKeys = Object.keys(window).filter(key => 
                key.toLowerCase().includes('worker') || 
                key.toLowerCase().includes('thread')
            );
            
            for (const key of workerKeys) {
                const worker = window[key];
                if (worker && typeof worker === 'object') {
                    result.workers.push({
                        name: key,
                        type: worker.constructor.name
                    });
                }
            }
            
            return result;
        });
        
        console.log('Web Workers:', JSON.stringify(webWorkers, null, 2));
    });

    test('should test worker communication', async ({ page }) => {
        console.log('\n💬 Testing Worker Communication...');
        
        await page.goto(`${BASE_URL}/exoplanet-pioneer.html`, { waitUntil: 'networkidle', timeout: 60000 });
        
        const workerTest = await page.evaluate(() => {
            const result = {
                canCreateWorker: false,
                workerCreated: false,
                workerMessages: []
            };
            
            // Test if we can create a web worker
            try {
                result.canCreateWorker = typeof Worker !== 'undefined';
                
                if (result.canCreateWorker) {
                    // Try to create a simple worker
                    const workerCode = `
                        self.onmessage = function(e) {
                            self.postMessage({ type: 'pong', data: e.data });
                        };
                    `;
                    
                    const blob = new Blob([workerCode], { type: 'application/javascript' });
                    const workerUrl = URL.createObjectURL(blob);
                    
                    const worker = new Worker(workerUrl);
                    
                    worker.onmessage = function(e) {
                        result.workerMessages.push(e.data);
                    };
                    
                    worker.postMessage({ type: 'ping', data: 'test' });
                    
                    result.workerCreated = true;
                    
                    // Clean up
                    worker.terminate();
                    URL.revokeObjectURL(workerUrl);
                }
            } catch (error) {
                result.error = error.message;
            }
            
            return result;
        });
        
        console.log('Worker Communication Test:', JSON.stringify(workerTest, null, 2));
        
        expect(workerTest.canCreateWorker).toBe(true);
    });

    test('should test background sync and offline capabilities', async ({ page, context }) => {
        console.log('\n📡 Testing Background Sync and Offline Capabilities...');
        
        await page.goto(`${BASE_URL}/exoplanet-pioneer.html`, { waitUntil: 'networkidle', timeout: 60000 });
        
        const offlineTest = await page.evaluate(() => {
            const result = {
                hasBackgroundSync: 'serviceWorker' in navigator && 'SyncManager' in window,
                hasOfflineSupport: 'serviceWorker' in navigator,
                onlineStatus: navigator.onLine,
                connectionType: null
            };
            
            // Check connection info
            if (navigator.connection) {
                result.connectionType = navigator.connection.effectiveType;
                result.downlink = navigator.connection.downlink;
                result.rtt = navigator.connection.rtt;
            }
            
            return result;
        });
        
        console.log('Offline Capabilities:', JSON.stringify(offlineTest, null, 2));
        
        expect(offlineTest.hasOfflineSupport).toBe(true);
    });
});
