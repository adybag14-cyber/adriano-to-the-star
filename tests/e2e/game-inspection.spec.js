/**
 * 🔍 ADVANCED GAME INSPECTION TEST
 * Comprehensive inspection of all available game selectors, features, and elements
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://adrianotothestar.com';

test.describe('Game Feature Inspection', () => {
    test('should inspect all available selectors and elements', async ({ page }) => {
        console.log(`\n🔍 Inspecting game at: ${BASE_URL}/exoplanet-pioneer.html`);
        
        await page.goto(`${BASE_URL}/exoplanet-pioneer.html`, { waitUntil: 'networkidle', timeout: 60000 });
        await page.waitForTimeout(5000);

        // Get all elements with IDs
        const allIds = await page.evaluate(() => {
            const elements = document.querySelectorAll('[id]');
            return Array.from(elements).map(el => ({
                id: el.id,
                tagName: el.tagName,
                className: el.className,
                textContent: el.textContent?.substring(0, 50).trim(),
                hasChildren: el.children.length > 0
            }));
        });

        console.log(`\n📋 All Elements with IDs (${allIds.length}):`);
        allIds.forEach(item => {
            console.log(`  #${item.id} - ${item.tagName}${item.className ? '.' + item.className.split(' ')[0] : ''} - ${item.textContent ? '"' + item.textContent.substring(0, 30) + '...' : ''}`);
        });

        // Get all elements with classes starting with 'ep-'
        const epElements = await page.evaluate(() => {
            const elements = document.querySelectorAll('[class*="ep-"]');
            return Array.from(elements).map(el => ({
                tagName: el.tagName,
                id: el.id || null,
                className: el.className,
                textContent: el.textContent?.substring(0, 50).trim()
            }));
        });

        console.log(`\n🎮 All Elements with 'ep-' class (${epElements.length}):`);
        epElements.forEach(item => {
            const idPart = item.id ? `#${item.id}` : '';
            console.log(`  ${item.tagName}${idPart} - ${item.className}`);
        });

        // Get all buttons
        const buttons = await page.evaluate(() => {
            const elements = document.querySelectorAll('button');
            return Array.from(elements).map(el => ({
                id: el.id || null,
                className: el.className,
                textContent: el.textContent?.substring(0, 50).trim(),
                disabled: el.disabled
            }));
        });

        console.log(`\n🔘 All Buttons (${buttons.length}):`);
        buttons.forEach((item, i) => {
            const idPart = item.id ? `#${item.id}` : '';
            const textPart = item.textContent ? `"${item.textContent.substring(0, 30)}"` : '(no text)';
            console.log(`  ${i + 1}. ${idPart || 'button'} - ${textPart} ${item.disabled ? '[disabled]' : ''}`);
        });

        // Get all inputs
        const inputs = await page.evaluate(() => {
            const elements = document.querySelectorAll('input, select, textarea');
            return Array.from(elements).map(el => ({
                tagName: el.tagName,
                id: el.id || null,
                className: el.className,
                type: el.type || null,
                placeholder: el.placeholder || null
            }));
        });

        console.log(`\n📝 All Inputs (${inputs.length}):`);
        inputs.forEach((item, i) => {
            const idPart = item.id ? `#${item.id}` : '';
            const typePart = item.type ? `[type="${item.type}"]` : '';
            console.log(`  ${i + 1}. ${item.tagName}${idPart}${typePart}`);
        });

        // Get all links
        const links = await page.evaluate(() => {
            const elements = document.querySelectorAll('a');
            return Array.from(elements).map(el => ({
                id: el.id || null,
                className: el.className,
                href: el.href,
                textContent: el.textContent?.substring(0, 50).trim()
            }));
        });

        console.log(`\n🔗 All Links (${links.length}):`);
        links.forEach((item, i) => {
            const idPart = item.id ? `#${item.id}` : '';
            const textPart = item.textContent ? `"${item.textContent.substring(0, 30)}"` : '(no text)';
            console.log(`  ${i + 1}. ${idPart || 'a'} - ${textPart} -> ${item.href}`);
        });

        // Get all canvas elements
        const canvases = await page.evaluate(() => {
            const elements = document.querySelectorAll('canvas');
            return Array.from(elements).map(el => ({
                id: el.id || null,
                className: el.className,
                width: el.width,
                height: el.height
            }));
        });

        console.log(`\n🎨 All Canvas Elements (${canvases.length}):`);
        canvases.forEach((item, i) => {
            const idPart = item.id ? `#${item.id}` : '';
            console.log(`  ${i + 1}. ${idPart || 'canvas'} - ${item.width}x${item.height}`);
        });

        // Get all div containers
        const divs = await page.evaluate(() => {
            const elements = document.querySelectorAll('div');
            return Array.from(elements).map(el => ({
                id: el.id || null,
                className: el.className,
                childCount: el.children.length,
                textContent: el.textContent?.substring(0, 30).trim()
            }));
        });

        // Filter for container-like divs (those with multiple children)
        const containers = divs.filter(d => d.childCount > 2);
        console.log(`\n📦 Container-like Divs (${containers.length}):`);
        containers.slice(0, 20).forEach((item, i) => {
            const idPart = item.id ? `#${item.id}` : '';
            const classPart = item.className ? `.${item.className.split(' ')[0]}` : '';
            console.log(`  ${i + 1}. ${idPart}${classPart} - ${item.childCount} children`);
        });

        // Check for specific game features
        const gameFeatures = await page.evaluate(() => {
            return {
                hasLocalStorage: typeof localStorage !== 'undefined',
                hasSessionStorage: typeof sessionStorage !== 'undefined',
                hasIndexedDB: typeof indexedDB !== 'undefined',
                hasWebGL: !!window.WebGLRenderingContext,
                hasWebGL2: !!window.WebGL2RenderingContext,
                hasWebWorkers: typeof Worker !== 'undefined',
                hasServiceWorker: 'serviceWorker' in navigator,
                hasGeolocation: 'geolocation' in navigator,
                hasWebAudio: typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined',
                hasWebSocket: typeof WebSocket !== 'undefined',
                hasGamepad: 'getGamepads' in navigator,
                hasFullscreen: 'requestFullscreen' in document.documentElement
            };
        });

        console.log(`\n⚙️ Browser Capabilities:`);
        Object.entries(gameFeatures).forEach(([key, value]) => {
            console.log(`  ${value ? '✅' : '❌'} ${key}`);
        });

        // Check for game-specific global variables
        const globalVars = await page.evaluate(() => {
            const gameVars = [];
            const interestingKeys = [
                'game', 'Game', 'player', 'Player', 'world', 'World',
                'scene', 'Scene', 'camera', 'Camera', 'renderer', 'Renderer',
                'engine', 'Engine', 'state', 'State', 'save', 'Save',
                'load', 'Load', 'mission', 'Mission', 'quest', 'Quest',
                'inventory', 'Inventory', 'resource', 'Resource',
                'exoplanet', 'Exoplanet', 'planet', 'Planet',
                'star', 'Star', 'system', 'System'
            ];
            
            interestingKeys.forEach(key => {
                if (window[key] !== undefined) {
                    gameVars.push({
                        key,
                        type: typeof window[key],
                        value: typeof window[key] === 'object' ? '[Object]' : String(window[key]).substring(0, 50)
                    });
                }
            });
            
            return gameVars;
        });

        console.log(`\n🌐 Game-Related Global Variables (${globalVars.length}):`);
        globalVars.forEach(item => {
            console.log(`  ${item.key} (${item.type}): ${item.value}`);
        });

        // Check for loaded scripts
        const scripts = await page.evaluate(() => {
            const elements = document.querySelectorAll('script[src]');
            return Array.from(elements).map(el => ({
                src: el.src,
                async: el.async,
                defer: el.defer,
                type: el.type || 'text/javascript'
            }));
        });

        console.log(`\n📜 Loaded Scripts (${scripts.length}):`);
        scripts.forEach((item, i) => {
            const filename = item.src.split('/').pop();
            console.log(`  ${i + 1}. ${filename}${item.async ? ' [async]' : ''}${item.defer ? ' [defer]' : ''}`);
        });

        // Check for loaded stylesheets
        const stylesheets = await page.evaluate(() => {
            const elements = document.querySelectorAll('link[rel="stylesheet"]');
            return Array.from(elements).map(el => ({
                href: el.href,
                media: el.media || 'all'
            }));
        });

        console.log(`\n🎨 Loaded Stylesheets (${stylesheets.length}):`);
        stylesheets.forEach((item, i) => {
            const filename = item.href.split('/').pop();
            console.log(`  ${i + 1}. ${filename}`);
        });

        // Check for images
        const images = await page.evaluate(() => {
            const elements = document.querySelectorAll('img');
            return Array.from(elements).map(el => ({
                id: el.id || null,
                src: el.src,
                alt: el.alt,
                width: el.width,
                height: el.height
            }));
        });

        console.log(`\n🖼️ Images (${images.length}):`);
        images.forEach((item, i) => {
            const idPart = item.id ? `#${item.id}` : '';
            const filename = item.src.split('/').pop();
            console.log(`  ${i + 1}. ${idPart} - ${filename} (${item.width}x${item.height})`);
        });

        // Check for SVG elements
        const svgs = await page.evaluate(() => {
            const elements = document.querySelectorAll('svg');
            return Array.from(elements).map(el => ({
                id: el.id || null,
                className: el.className,
                width: el.getAttribute('width'),
                height: el.getAttribute('height')
            }));
        });

        console.log(`\n🎨 SVG Elements (${svgs.length}):`);
        svgs.forEach((item, i) => {
            const idPart = item.id ? `#${item.id}` : '';
            console.log(`  ${i + 1}. ${idPart} - ${item.width}x${item.height}`);
        });

        // Check for video/audio elements
        const media = await page.evaluate(() => {
            const videos = Array.from(document.querySelectorAll('video')).map(el => ({
                type: 'video',
                id: el.id || null,
                src: el.src,
                controls: el.controls
            }));
            const audios = Array.from(document.querySelectorAll('audio')).map(el => ({
                type: 'audio',
                id: el.id || null,
                src: el.src,
                controls: el.controls
            }));
            return [...videos, ...audios];
        });

        console.log(`\n🎬 Media Elements (${media.length}):`);
        media.forEach((item, i) => {
            const idPart = item.id ? `#${item.id}` : '';
            console.log(`  ${i + 1}. ${item.type}${idPart} - ${item.src ? item.src.split('/').pop() : 'no src'}`);
        });

        // Get page structure summary
        const structure = await page.evaluate(() => {
            const body = document.body;
            return {
                totalElements: body.querySelectorAll('*').length,
                totalNodes: body.getElementsByTagName('*').length,
                depth: getMaxDepth(body)
            };
            
            function getMaxDepth(element) {
                let maxDepth = 0;
                for (let i = 0; i < element.children.length; i++) {
                    maxDepth = Math.max(maxDepth, 1 + getMaxDepth(element.children[i]));
                }
                return maxDepth;
            }
        });

        console.log(`\n📐 Page Structure:`);
        console.log(`  Total elements: ${structure.totalElements}`);
        console.log(`  Total nodes: ${structure.totalNodes}`);
        console.log(`  Max depth: ${structure.depth}`);

        // Save detailed inspection results
        const inspectionResults = {
            timestamp: new Date().toISOString(),
            url: `${BASE_URL}/exoplanet-pioneer.html`,
            summary: {
                totalIds: allIds.length,
                totalEpElements: epElements.length,
                totalButtons: buttons.length,
                totalInputs: inputs.length,
                totalLinks: links.length,
                totalCanvases: canvases.length,
                totalContainers: containers.length,
                totalScripts: scripts.length,
                totalStylesheets: stylesheets.length,
                totalImages: images.length,
                totalSvgs: svgs.length,
                totalMedia: media.length
            },
            ids: allIds,
            epElements: epElements,
            buttons: buttons,
            inputs: inputs,
            links: links,
            canvases: canvases,
            containers: containers,
            scripts: scripts,
            stylesheets: stylesheets,
            images: images,
            svgs: svgs,
            media: media,
            browserCapabilities: gameFeatures,
            globalVariables: globalVars,
            structure: structure
        };

        // Save to file
        await page.evaluate((results) => {
            const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `game-inspection-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }, inspectionResults);

        console.log(`\n✅ Inspection complete! Results saved to game-inspection-[date].json`);
    });

    test('should test interactive elements functionality', async ({ page }) => {
        console.log(`\n🎮 Testing interactive elements`);
        
        await page.goto(`${BASE_URL}/exoplanet-pioneer.html`, { waitUntil: 'networkidle', timeout: 60000 });
        await page.waitForTimeout(3000);

        // Test all clickable elements
        const clickables = await page.evaluate(() => {
            const elements = [];
            document.querySelectorAll('button, a, [role="button"]').forEach(el => {
                const rect = el.getBoundingClientRect();
                elements.push({
                    tagName: el.tagName,
                    id: el.id || null,
                    className: el.className,
                    text: el.textContent?.substring(0, 30).trim(),
                    visible: rect.width > 0 && rect.height > 0,
                    disabled: el.disabled || el.getAttribute('aria-disabled') === 'true',
                    clickable: rect.width > 0 && rect.height > 0 && !el.disabled
                });
            });
            return elements;
        });

        console.log(`\n🔘 Clickable Elements (${clickables.length}):`);
        const visibleClickables = clickables.filter(c => c.visible);
        console.log(`  Visible: ${visibleClickables.length}`);
        console.log(`  Disabled: ${clickables.filter(c => c.disabled).length}`);
        console.log(`  Hidden: ${clickables.filter(c => !c.visible).length}`);

        visibleClickables.slice(0, 10).forEach((item, i) => {
            const idPart = item.id ? `#${item.id}` : '';
            const textPart = item.text ? `"${item.text}"` : '';
            console.log(`  ${i + 1}. ${item.tagName}${idPart} - ${textPart}`);
        });

        // Test hover states on visible buttons
        const hoverableButtons = visibleClickables.filter(c => c.tagName === 'BUTTON' && c.clickable);
        console.log(`\n🖱️ Testing Hover on ${Math.min(hoverableButtons.length, 5)} buttons:`);
        
        for (let i = 0; i < Math.min(hoverableButtons.length, 5); i++) {
            const button = hoverableButtons[i];
            try {
                const element = page.locator(button.id ? `#${button.id}` : `button`).nth(i);
                await element.hover({ timeout: 3000 });
                const classes = await element.getAttribute('class');
                console.log(`  ${i + 1}. ${button.id || 'button'} - Hovered (classes: ${classes || 'none'})`);
            } catch (error) {
                console.log(`  ${i + 1}. ${button.id || 'button'} - Could not hover: ${error.message}`);
            }
        }

        // Test input elements
        const inputElements = await page.evaluate(() => {
            const elements = [];
            document.querySelectorAll('input, select, textarea').forEach(el => {
                const rect = el.getBoundingClientRect();
                elements.push({
                    tagName: el.tagName,
                    id: el.id || null,
                    type: el.type || null,
                    placeholder: el.placeholder || null,
                    value: el.value || '',
                    visible: rect.width > 0 && rect.height > 0,
                    readOnly: el.readOnly || el.getAttribute('readonly') === 'true',
                    disabled: el.disabled
                });
            });
            return elements;
        });

        console.log(`\n📝 Input Elements (${inputElements.length}):`);
        inputElements.forEach((item, i) => {
            const idPart = item.id ? `#${item.id}` : '';
            const typePart = item.type ? `[type="${item.type}"]` : '';
            console.log(`  ${i + 1}. ${item.tagName}${idPart}${typePart} - ${item.visible ? 'visible' : 'hidden'} ${item.readOnly ? '[readonly]' : ''} ${item.disabled ? '[disabled]' : ''}`);
        });

        // Test scroll functionality
        console.log(`\n📜 Testing Scroll Functionality:`);
        const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
        const clientHeight = await page.evaluate(() => document.body.clientHeight);
        console.log(`  Scroll height: ${scrollHeight}px`);
        console.log(`  Client height: ${clientHeight}px`);
        console.log(`  Can scroll: ${scrollHeight > clientHeight ? '✅' : '❌'}`);

        if (scrollHeight > clientHeight) {
            await page.evaluate(() => window.scrollTo(0, scrollHeight / 2));
            await page.waitForTimeout(500);
            console.log(`  Scrolled to middle ✅`);
            
            await page.evaluate(() => window.scrollTo(0, scrollHeight));
            await page.waitForTimeout(500);
            console.log(`  Scrolled to bottom ✅`);
            
            await page.evaluate(() => window.scrollTo(0, 0));
            await page.waitForTimeout(500);
            console.log(`  Scrolled to top ✅`);
        }

        // Test keyboard navigation
        console.log(`\n⌨️ Testing Keyboard Navigation:`);
        let focusableCount = 0;
        const focusableElements = [];

        for (let i = 0; i < 20; i++) {
            await page.keyboard.press('Tab');
            await page.waitForTimeout(100);
            
            const focused = await page.evaluate(() => {
                const el = document.activeElement;
                if (!el || el.tagName === 'BODY') return null;
                return {
                    tagName: el.tagName,
                    id: el.id || null,
                    className: el.className,
                    text: el.textContent?.substring(0, 30).trim()
                };
            });

            if (focused) {
                focusableCount++;
                focusableElements.push(focused);
                console.log(`  ${focusableCount}. ${focused.tagName}${focused.id ? '#' + focused.id : ''}${focused.text ? ' - "' + focused.text + '"' : ''}`);
            }
        }

        console.log(`  Total focusable elements found: ${focusableCount}`);
    });

    test('should analyze game data and state', async ({ page }) => {
        console.log(`\n💾 Analyzing Game Data and State`);
        
        await page.goto(`${BASE_URL}/exoplanet-pioneer.html`, { waitUntil: 'networkidle', timeout: 60000 });
        await page.waitForTimeout(3000);

        // Check LocalStorage
        const localStorageData = await page.evaluate(() => {
            const data = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                try {
                    data[key] = JSON.parse(localStorage.getItem(key));
                } catch {
                    data[key] = localStorage.getItem(key);
                }
            }
            return {
                totalKeys: localStorage.length,
                keys: Object.keys(data),
                data
            };
        });

        console.log(`\n📦 LocalStorage (${localStorageData.totalKeys} keys):`);
        localStorageData.keys.forEach(key => {
            const value = localStorageData.data[key];
            const valueStr = typeof value === 'object' ? JSON.stringify(value).substring(0, 100) : String(value).substring(0, 100);
            console.log(`  "${key}": ${valueStr}`);
        });

        // Check SessionStorage
        const sessionStorageData = await page.evaluate(() => {
            const data = {};
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                try {
                    data[key] = JSON.parse(sessionStorage.getItem(key));
                } catch {
                    data[key] = sessionStorage.getItem(key);
                }
            }
            return {
                totalKeys: sessionStorage.length,
                keys: Object.keys(data),
                data
            };
        });

        console.log(`\n📦 SessionStorage (${sessionStorageData.totalKeys} keys):`);
        sessionStorageData.keys.forEach(key => {
            const value = sessionStorageData.data[key];
            const valueStr = typeof value === 'object' ? JSON.stringify(value).substring(0, 100) : String(value).substring(0, 100);
            console.log(`  "${key}": ${valueStr}`);
        });

        // Check IndexedDB databases
        const indexedDBData = await page.evaluate(async () => {
            try {
                const databases = await indexedDB.databases();
                const dbInfo = [];
                
                for (const db of databases) {
                    dbInfo.push({
                        name: db.name,
                        version: db.version
                    });
                }
                
                return {
                    available: true,
                    databases: dbInfo
                };
            } catch (error) {
                return {
                    available: false,
                    error: error.message,
                    databases: []
                };
            }
        });

        console.log(`\n🗄️ IndexedDB:`);
        console.log(`  Available: ${indexedDBData.available ? '✅' : '❌'}`);
        if (indexedDBData.available) {
            console.log(`  Databases: ${indexedDBData.databases.length}`);
            indexedDBData.databases.forEach(db => {
                console.log(`    - ${db.name} (v${db.version})`);
            });
        }

        // Check for cookies
        const cookies = await page.context().cookies();
        console.log(`\n🍪 Cookies (${cookies.length}):`);
        cookies.forEach((cookie, i) => {
            console.log(`  ${i + 1}. ${cookie.name} = ${cookie.value.substring(0, 50)}`);
        });

        // Check for any game state in window object
        const windowState = await page.evaluate(() => {
            const state = {};
            const stateKeys = [
                'gameState', 'game_state', 'playerState', 'player_state',
                'saveData', 'save_data', 'gameData', 'game_data',
                'missionState', 'mission_state', 'questState', 'quest_state',
                'inventoryState', 'inventory_state', 'resourceState', 'resource_state'
            ];
            
            stateKeys.forEach(key => {
                if (window[key] !== undefined) {
                    state[key] = typeof window[key] === 'object' ? JSON.stringify(window[key]).substring(0, 200) : String(window[key]);
                }
            });
            
            return state;
        });

        console.log(`\n🎮 Window Game State:`);
        if (Object.keys(windowState).length > 0) {
            Object.entries(windowState).forEach(([key, value]) => {
                console.log(`  ${key}: ${value}`);
            });
        } else {
            console.log(`  No game state found in window object`);
        }
    });

    test('should analyze network activity and API calls', async ({ page }) => {
        console.log(`\n🌐 Analyzing Network Activity`);
        
        const networkRequests = [];
        const networkResponses = [];
        const apiCalls = [];

        page.on('request', request => {
            networkRequests.push({
                url: request.url(),
                method: request.method(),
                resourceType: request.resourceType(),
                headers: request.headers()
            });
        });

        page.on('response', response => {
            const request = response.request();
            networkResponses.push({
                url: response.url(),
                method: request.method(),
                status: response.status(),
                statusText: response.statusText(),
                headers: response.headers(),
                resourceType: request.resourceType()
            });

            // Check for API calls
            if (response.url().includes('/api/') || response.url().includes('/data/')) {
                apiCalls.push({
                    url: response.url(),
                    method: request.method(),
                    status: response.status(),
                    resourceType: response.resourceType()
                });
            }
        });

        await page.goto(`${BASE_URL}/exoplanet-pioneer.html`, { waitUntil: 'networkidle', timeout: 60000 });
        await page.waitForTimeout(5000);

        console.log(`\n📊 Network Statistics:`);
        console.log(`  Total Requests: ${networkRequests.length}`);
        console.log(`  Total Responses: ${networkResponses.length}`);
        console.log(`  API Calls: ${apiCalls.length}`);

        console.log(`\n🔍 API Calls (${apiCalls.length}):`);
        apiCalls.forEach((call, i) => {
            const url = new URL(call.url);
            console.log(`  ${i + 1}. ${call.method} ${url.pathname} - ${call.status}`);
        });

        // Analyze resource types
        const resourceTypes = {};
        networkResponses.forEach(response => {
            const type = response.resourceType;
            resourceTypes[type] = (resourceTypes[type] || 0) + 1;
        });

        console.log(`\n📦 Resource Types:`);
        Object.entries(resourceTypes).forEach(([type, count]) => {
            console.log(`  ${type}: ${count}`);
        });

        // Check for failed requests
        const failedRequests = networkResponses.filter(r => r.status >= 400);
        console.log(`\n❌ Failed Requests (${failedRequests.length}):`);
        failedRequests.forEach((req, i) => {
            const url = new URL(req.url);
            console.log(`  ${i + 1}. ${req.method} ${url.pathname} - ${req.status} ${req.statusText}`);
        });

        // Check for external resources
        const externalResources = networkResponses.filter(r => {
            const url = new URL(r.url);
            return url.hostname !== new URL(BASE_URL).hostname;
        });

        console.log(`\n🌍 External Resources (${externalResources.length}):`);
        externalResources.slice(0, 10).forEach((res, i) => {
            const url = new URL(res.url);
            console.log(`  ${i + 1}. ${url.hostname}${url.pathname}`);
        });
    });
});
