/**
 * 🧪 API ENDPOINT TESTS
 * Test the debug and health API endpoints via HTTP
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://adrianotothestar.com';

test.describe('API Endpoint Tests', () => {
    test('should load debug API endpoint', async ({ request }) => {
        console.log(`\n🔍 Testing Debug API at: ${BASE_URL}/api/debug.js`);
        
        const response = await request.get(`${BASE_URL}/api/debug.js`);
        
        console.log(`Status: ${response.status()}`);
        console.log(`Content-Type: ${response.headers()['content-type']}`);
        
        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toContain('application/javascript');
        
        const content = await response.text();
        console.log(`Content length: ${content.length} bytes`);
        console.log(`First 200 chars: ${content.substring(0, 200)}`);
        
        // Verify it contains expected API code
        expect(content).toContain('DebugAPI');
        expect(content).toContain('getStatus');
    });

    test('should load health API endpoint', async ({ request }) => {
        console.log(`\n🏥 Testing Health API at: ${BASE_URL}/api/health.js`);
        
        const response = await request.get(`${BASE_URL}/api/health.js`);
        
        console.log(`Status: ${response.status()}`);
        console.log(`Content-Type: ${response.headers()['content-type']}`);
        
        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toContain('application/javascript');
        
        const content = await response.text();
        console.log(`Content length: ${content.length} bytes`);
        console.log(`First 200 chars: ${content.substring(0, 200)}`);
        
        // Verify it contains expected API code
        expect(content).toContain('HealthAPI');
        expect(content).toContain('getHealth');
    });

    test('should verify API files are not HTML', async ({ request }) => {
        console.log(`\n🔍 Verifying API files are not HTML...`);
        
        const debugResponse = await request.get(`${BASE_URL}/api/debug.js`);
        const healthResponse = await request.get(`${BASE_URL}/api/health.js`);
        
        const debugContent = await debugResponse.text();
        const healthContent = await healthResponse.text();
        
        // Verify they don't contain HTML
        expect(debugContent).not.toContain('<!DOCTYPE html>');
        expect(debugContent).not.toContain('<html>');
        expect(healthContent).not.toContain('<!DOCTYPE html>');
        expect(healthContent).not.toContain('<html>');
        
        console.log('✅ API files are JavaScript, not HTML');
    });
});
