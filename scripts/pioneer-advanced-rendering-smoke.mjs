import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const root = path.resolve(process.env.PIONEER_PUBLIC_ROOT || 'public');
const contentTypes = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png',
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
    '.woff2': 'font/woff2'
};
const assertions = [];
const errors = [];
const requestFailures = [];
const httpErrors = [];

function assert(condition, message, detail = undefined) {
    const entry = { pass: !!condition, message, ...(detail === undefined ? {} : { detail }) };
    assertions.push(entry);
    console.log(`ASSERT ${JSON.stringify(entry)}`);
    if (!condition) throw new Error(`Assertion failed: ${message}`);
}

const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const rel = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';
    const file = path.resolve(root, rel);
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404); res.end('not found'); return;
    }
    res.writeHead(200, { 'content-type': contentTypes[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    fs.createReadStream(file).pipe(res);
});

let browser;
try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
    const page = await browser.newPage({ viewport: { width: 960, height: 600 } });
    page.on('pageerror', error => errors.push({ type: 'pageerror', text: String(error) }));
    page.on('console', message => {
        if (message.type() !== 'error') return;
        const location = message.location();
        errors.push({ type: 'console', text: message.text(), url: location?.url || '', lineNumber: location?.lineNumber ?? null, columnNumber: location?.columnNumber ?? null });
    });
    page.on('response', response => {
        if (response.status() < 400) return;
        const responseUrl = response.url();
        let firstParty = false;
        try { firstParty = new URL(responseUrl).origin === origin; } catch {}
        httpErrors.push({
            status: response.status(),
            url: responseUrl,
            resourceType: response.request().resourceType(),
            firstParty
        });
    });
    page.on('requestfailed', request => {
        if (new URL(request.url()).origin === origin) requestFailures.push(`${request.url()} :: ${request.failure()?.errorText || 'failed'}`);
    });

    await page.goto(`${origin}/exoplanet-pioneer.html?advanced-ci=${Date.now()}`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.game?.tiles?.length === 1000 && window.game?.planetMesh, null, { timeout: 60000 });

    const startup = await page.evaluate(() => ({
        tiles: game.tiles.length,
        terrainVersion: game.planetMesh.userData?.terrain?.version,
        meshSegments: game.planetMesh.userData?.terrain?.meshSegments,
        generated: [...document.scripts].map(script => script.src).filter(Boolean).filter(src => src.includes('.pioneer.')).map(src => new URL(src).pathname.split('/').pop()),
        systemClass: typeof window.LocalSystemExplorer,
        rayClass: typeof window.PioneerRayTracingRenderer,
        graphicsControls: ['ep-setting-render-mode','ep-setting-mesh-detail','ep-setting-terrain-detail','ep-setting-atmosphere-quality','ep-setting-cloud-quality','ep-setting-shadow-quality','ep-setting-ray-scale','ep-setting-path-samples']
            .every(id => { game.ensurePauseUI(); return !!document.getElementById(id); })
    }));
    assert(startup.tiles === 1000, 'Pioneer initializes all 1,000 logical terrain tiles', startup);
    assert(startup.terrainVersion === 'catalog-informed-v4-geology', 'Pioneer uses the v4 geology terrain pipeline', startup);
    assert(startup.meshSegments === 160, 'High planet mesh quality defaults to 160 segments', startup);
    assert(startup.generated.length === 4, 'Pages artifact keeps the four-request Pioneer startup shape', startup.generated);
    assert(startup.systemClass === 'function' && startup.rayClass === 'function', 'advanced system and tracing renderers are loaded', startup);
    assert(startup.graphicsControls, 'graphics settings expose renderer and quality controls');

    const localSystem = await page.evaluate(() => {
        const g = window.game;
        g.resources.energy = 1000; g.resources.data = 1000; g.updateResourceUI();
        g.localSystemExplorer.open();
        g.localSystemExplorer.selectBody('kepler_186b');
        const before = { energy: g.resources.energy, data: g.resources.data };
        g.localSystemExplorer.surveySelected();
        const surveyed = { energy: g.resources.energy, data: g.resources.data, value: !!g.localSystemExplorer.state.surveyed.kepler_186b };
        g.localSystemExplorer.visitSelectedOrbit();
        const visited = { energy: g.resources.energy, active: g.localSystemExplorer.state.activeBodyId, value: !!g.localSystemExplorer.state.visited.kepler_186b };
        const serialized = g.localSystemExplorer.serialize();
        g.saveGame({ silent: true });
        g.localSystemExplorer.state.activeBodyId = 'kepler_186f';
        g.localSystemExplorer.state.surveyed = { kepler_186f: true };
        g.loadGame({ silent: true });
        g.localSystemExplorer.close();
        return {
            planetCount: window.KEPLER_186_SYSTEM?.planets?.length,
            before, surveyed, visited, serialized,
            restored: {
                active: g.localSystemExplorer.state.activeBodyId,
                surveyed: !!g.localSystemExplorer.state.surveyed.kepler_186b,
                visited: !!g.localSystemExplorer.state.visited.kepler_186b
            }
        };
    });
    assert(localSystem.planetCount === 5, 'Kepler-186 local explorer exposes all five confirmed planets', localSystem);
    assert(localSystem.surveyed.value && localSystem.before.energy - localSystem.surveyed.energy === 25 && localSystem.before.data - localSystem.surveyed.data === 10,
        'local survey consumes the documented resources and records discovery', localSystem);
    assert(localSystem.visited.value && localSystem.visited.active === 'kepler_186b', 'surveyed local planet can be visited in orbit', localSystem);
    assert(localSystem.restored.active === 'kepler_186b' && localSystem.restored.surveyed && localSystem.restored.visited,
        'local-system survey and visit state survives local save/reload', localSystem.restored);

    const rayState = await page.evaluate(() => {
        const g = window.game;
        g.graphicsSettings = { ...g.graphicsSettings, renderMode: 'raytraced', rayTraceScale: 0.5 };
        const result = g.applyGraphicsSettings({ rebuildPlanet: false, notify: false });
        const rendered = g.rayTracingRenderer.render();
        return {
            result, rendered, mode: g.rayTracingRenderer.mode,
            sample: g.rayTracingRenderer.sampleIndex,
            display: getComputedStyle(document.getElementById('ep-raytracing-canvas')).display,
            colorWrite: g.planetMesh.material.colorWrite,
            capability: g.rayTracingRenderer.getCapability()
        };
    });
    assert(rayState.result.ok && rayState.capability.supported && rayState.mode === 'raytraced' && rayState.rendered,
        'Ray Traced Lighting compiles and renders on a WebGL2-capable browser', rayState);
    assert(rayState.sample >= 1 && rayState.display === 'block' && rayState.colorWrite === false,
        'ray-traced underlay composites with the Three.js planet depth surface', rayState);

    const pathState = await page.evaluate(() => {
        const g = window.game;
        g.graphicsSettings = { ...g.graphicsSettings, renderMode: 'pathtraced', rayTraceScale: 0.5, pathTraceSamples: 16 };
        const result = g.applyGraphicsSettings({ rebuildPlanet: false, notify: false });
        g.rayTracingRenderer.render();
        g.rayTracingRenderer.render();
        return {
            result, mode: g.rayTracingRenderer.mode, timeScale: g.timeScale,
            sample: g.rayTracingRenderer.sampleIndex, maxSamples: g.rayTracingRenderer.maxSamples
        };
    });
    assert(pathState.result.ok && pathState.mode === 'pathtraced' && pathState.timeScale === 0,
        'Path Traced Photo enters a stable paused simulation state', pathState);
    assert(pathState.sample >= 2 && pathState.maxSamples === 16, 'Path Traced Photo progressively accumulates samples', pathState);

    const qualityState = await page.evaluate(() => {
        const g = window.game;
        if (!g.structures.length) {
            const tile = g.tiles.find(candidate => candidate && !candidate.building);
            tile.building = 'solar';
            g.structures.push({ tileId: tile.id, type: 'solar', isConstructing: false, buildProgress: 100, buildElapsed: 10, buildDuration: 10, condition: 100 });
            g.rebuildAllBuildings();
        }
        const preservedTileId = g.structures[0].tileId;
        const structuresBefore = g.structures.length;
        const meshBefore = !!g.buildingMeshes[preservedTileId];
        g.graphicsSettings = { ...g.graphicsSettings, renderMode: 'standard', meshDetail: 'medium', terrainDetail: 'ultra', atmosphereQuality: 'medium', cloudQuality: 'medium', shadowQuality: 'high' };
        const result = g.applyGraphicsSettings({ rebuildPlanet: true, notify: false });
        const group = g.buildingMeshes[preservedTileId];
        g.updateBuildingContactShadows(new THREE.Vector3(0.6, 0.7, 0.4).normalize());
        const contact = group?.getObjectByName?.('PioneerContactShadow');
        const shadowMeshes = [];
        group?.traverse?.((child) => {
            if (child?.isMesh && !child.userData?.isBuildingMarker && !child.userData?.isConstructionScaffold && !child.userData?.isBuildingContactShadowMesh && !child.userData?.isBuildingNightGlow) {
                shadowMeshes.push({ cast: child.castShadow, receive: child.receiveShadow });
            }
        });
        const firstStyledMesh = (() => {
            let found = null;
            group?.traverse?.((child) => {
                if (found || !child?.isMesh || child.userData?.isBuildingMarker || child.userData?.isConstructionScaffold || child.userData?.isBuildingContactShadowMesh || child.userData?.isBuildingNightGlow) return;
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                const material = materials.find((entry) => entry?.emissive);
                if (material) found = { child, material };
            });
            return found;
        })();
        const structure = g.structures.find((entry) => entry.tileId === preservedTileId);
        const baseEmissive = firstStyledMesh?.material?.userData?.pioneerBaseEmissiveIntensity ?? firstStyledMesh?.material?.emissiveIntensity ?? null;
        if (structure) structure.condition = 12;
        g.updateBuildingFlicker(0.016);
        const damagedEmissive = firstStyledMesh?.material?.emissiveIntensity ?? null;
        const remainedVisible = group?.visible !== false;
        if (structure) structure.condition = 100;
        g.updateBuildingFlicker(0.016);
        const restoredEmissive = firstStyledMesh?.material?.emissiveIntensity ?? null;

        const originalPowered = structure?.powered;
        const backgroundBefore = g.scene.background?.isColor ? g.scene.background.getHex() : null;
        const worldQuaternion = new THREE.Quaternion();
        group.getWorldQuaternion(worldQuaternion);
        const siteNormal = new THREE.Vector3(0, 1, 0).applyQuaternion(worldQuaternion).normalize();
        if (structure) {
            structure.condition = 100;
            structure.isConstructing = false;
            structure.powered = true;
        }
        g.updateLightPollution(siteNormal.clone().multiplyScalar(-1));
        const nightGlow = group?.userData?.nightGlow || group?.getObjectByName?.('PioneerNightGlow');
        const night = nightGlow ? {
            visible: nightGlow.visible,
            strength: nightGlow.userData?.lastStrength ?? 0,
            darkness: nightGlow.userData?.lastDarkness ?? 0,
            haloOpacity: nightGlow.userData?.haloMaterial?.uniforms?.opacity?.value ?? 0,
            auraOpacity: nightGlow.userData?.aura?.material?.opacity ?? 0,
            surfaceOffset: nightGlow.position.y
        } : null;
        g.updateLightPollution(siteNormal);
        const day = nightGlow ? {
            visible: nightGlow.visible,
            strength: nightGlow.userData?.lastStrength ?? 0,
            haloOpacity: nightGlow.userData?.haloMaterial?.uniforms?.opacity?.value ?? 0,
            auraOpacity: nightGlow.userData?.aura?.material?.opacity ?? 0
        } : null;
        if (structure) structure.powered = false;
        g.updateLightPollution(siteNormal.clone().multiplyScalar(-1));
        const unpoweredNight = nightGlow ? {
            visible: nightGlow.visible,
            strength: nightGlow.userData?.lastStrength ?? 0,
            haloOpacity: nightGlow.userData?.haloMaterial?.uniforms?.opacity?.value ?? 0,
            auraOpacity: nightGlow.userData?.aura?.material?.opacity ?? 0
        } : null;
        if (structure) structure.powered = originalPowered;
        g.updateLightPollution(siteNormal);
        const backgroundAfter = g.scene.background?.isColor ? g.scene.background.getHex() : null;

        return {
            result,
            meshSegments: g.planetMesh.userData?.terrain?.meshSegments,
            terrainDetailScale: g.planetMesh.userData?.terrain?.terrainDetailScale,
            structuresBefore, structuresAfter: g.structures.length, meshBefore, meshAfter: !!g.buildingMeshes[preservedTileId],
            tileBuilding: g.tiles[preservedTileId]?.building || null,
            canvasDisplay: getComputedStyle(document.getElementById('ep-raytracing-canvas')).display,
            colorWrite: g.planetMesh.material.colorWrite,
            timeScale: g.timeScale,
            shadowQuality: g.graphicsSettings.shadowQuality,
            shadowMapEnabled: g.renderer.shadowMap.enabled,
            shadowMapSize: g.sunLight?.shadow?.mapSize?.width ?? null,
            shadowCamera: g.sunLight?.shadow?.camera ? {
                left: g.sunLight.shadow.camera.left, right: g.sunLight.shadow.camera.right,
                top: g.sunLight.shadow.camera.top, bottom: g.sunLight.shadow.camera.bottom,
                near: g.sunLight.shadow.camera.near, far: g.sunLight.shadow.camera.far
            } : null,
            shadowMeshes,
            contact: contact ? { visible: contact.visible, opacity: contact.userData?.shadowMesh?.material?.uniforms?.opacity?.value ?? 0 } : null,
            damageLighting: { baseEmissive, damagedEmissive, restoredEmissive, remainedVisible },
            colonyGlow: { night, day, unpoweredNight, backgroundBefore, backgroundAfter }
        };
    });
    assert(qualityState.meshSegments === 112 && qualityState.terrainDetailScale === 1.24,
        'mesh and terrain detail settings rebuild the deterministic world at the requested quality', qualityState);
    assert(qualityState.structuresBefore === qualityState.structuresAfter && qualityState.structuresAfter >= 1 && qualityState.meshBefore && qualityState.meshAfter && qualityState.tileBuilding === 'solar',
        'graphics rebuild preserves logical colony structures and visible building meshes', qualityState);
    assert(qualityState.shadowQuality === 'high' && qualityState.shadowMapEnabled && qualityState.shadowMapSize === 2048
        && qualityState.shadowCamera?.left <= -70 && qualityState.shadowCamera?.right >= 70
        && qualityState.shadowMeshes.length > 0 && qualityState.shadowMeshes.every((entry) => entry.cast && entry.receive),
        'High colony shadows cover the world and enable native building cast/receive', qualityState);
    assert(qualityState.contact?.visible && qualityState.contact.opacity > 0,
        'structures receive a soft sun-directed surface contact shadow', qualityState.contact);
    assert(qualityState.damageLighting.remainedVisible
        && Number(qualityState.damageLighting.damagedEmissive) > Number(qualityState.damageLighting.baseEmissive)
        && Math.abs(Number(qualityState.damageLighting.restoredEmissive) - Number(qualityState.damageLighting.baseEmissive)) < 1e-9,
        'damaged buildings flicker through emissive lighting without disappearing', qualityState.damageLighting);
    assert(qualityState.colonyGlow.night?.visible && qualityState.colonyGlow.night.strength > 0.95
        && qualityState.colonyGlow.night.haloOpacity > 0.25 && qualityState.colonyGlow.night.auraOpacity > 0.45
        && qualityState.colonyGlow.night.surfaceOffset < 0,
        'powered night-side structures emit localized surface and orbital settlement glow', qualityState.colonyGlow.night);
    assert(!qualityState.colonyGlow.day?.visible && qualityState.colonyGlow.day?.strength === 0
        && !qualityState.colonyGlow.unpoweredNight?.visible && qualityState.colonyGlow.unpoweredNight?.strength === 0,
        'colony glow extinguishes in daylight and when a site is unpowered', qualityState.colonyGlow);
    assert(qualityState.colonyGlow.backgroundBefore === qualityState.colonyGlow.backgroundAfter,
        'localized light pollution leaves the empty-space background unchanged', qualityState.colonyGlow);
    assert(qualityState.canvasDisplay === 'none' && qualityState.colorWrite === true && qualityState.timeScale === 1,
        'returning to Standard restores rasterized planet rendering and prior simulation speed', qualityState);

    const firstPartyHttpErrors = httpErrors.filter(entry => entry.firstParty);
    assert(errors.length === 0, 'no application/page console errors during advanced graphics smoke', { errors, httpErrors });
    assert(firstPartyHttpErrors.length === 0, 'no first-party HTTP error responses during advanced graphics smoke', firstPartyHttpErrors);
    assert(requestFailures.length === 0, 'no failed first-party requests during advanced graphics smoke', requestFailures);
    console.log(`SUMMARY ${JSON.stringify({ pass: true, assertions: assertions.length, errors: errors.length, httpErrors, requestFailures: requestFailures.length })}`);
} catch (error) {
    console.error(`FATAL ${error?.stack || error}`);
    console.log(`SUMMARY ${JSON.stringify({ pass: false, assertions: assertions.length, errors, httpErrors, requestFailures })}`);
    process.exitCode = 1;
} finally {
    await browser?.close().catch(() => {});
    await new Promise(resolve => server.close(resolve));
}
