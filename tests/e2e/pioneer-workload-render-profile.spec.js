import { test, expect } from '@playwright/test';
import { installWorkloadRenderProfile, verifyWorkloadRenderProfile } from '../../scripts/pioneer-workload-render-profile.mjs';

test('workload framebuffer cap survives reload, resize and graphics reapply without reducing native assets', async ({ context, page }) => {
    test.setTimeout(120000);
    await installWorkloadRenderProfile(context);
    const evidence = [];
    for (let load = 0; load < 2; load += 1) {
        if (load) await page.reload({ waitUntil: 'domcontentloaded' });
        else await page.goto('/exoplanet-pioneer.html', { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => window.game?.planetMesh && window.game?.runtime?.frameCount > 2, null, { timeout: 60000 });
        evidence.push(await verifyWorkloadRenderProfile(page, `load-${load}`));
        await page.evaluate(() => window.game.setTimeSpeed(0));
        for (const size of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
            await page.setViewportSize(size);
            await page.waitForFunction(({ width, height }) => innerWidth === width && innerHeight === height, size);
            evidence.push(await verifyWorkloadRenderProfile(page, `load-${load}-resize-${size.width}`));
            const stable = await page.evaluate(() => {
                const g = window.game;
                const geometry = g.planetMesh.geometry;
                // Render-target attachments may be reallocated by a settings
                // apply. Compare real scene assets, not transient GPU targets.
                const assets = () => {
                    const textures = new Set();
                    const geometries = new Set();
                    const record = value => { if (value?.isTexture) textures.add(value.uuid); };
                    g.scene.traverse(object => {
                        if (object.geometry) geometries.add(object.geometry.uuid);
                        const materials = Array.isArray(object.material) ? object.material : [object.material];
                        for (const material of materials.filter(Boolean)) {
                            Object.values(material).forEach(record);
                            Object.values(material.uniforms || {}).forEach(uniform => record(uniform.value));
                        }
                    });
                    return { textures: [...textures].sort(), geometries: [...geometries].sort() };
                };
                const before = assets();
                const graphics = JSON.stringify(g.graphicsSettings);
                g.applyGraphicsSettings({ rebuildPlanet: false, notify: false });
                const after = assets();
                return { sameGeometry: geometry === g.planetMesh.geometry,
                    sameTextures: JSON.stringify(before.textures) === JSON.stringify(after.textures),
                    sameGeometries: JSON.stringify(before.geometries) === JSON.stringify(after.geometries),
                    sameSettings: graphics === JSON.stringify(g.graphicsSettings) };
            });
            expect(stable).toEqual({ sameGeometry: true, sameTextures: true, sameGeometries: true, sameSettings: true });
            evidence.push(await verifyWorkloadRenderProfile(page, `load-${load}-graphics-${size.width}`));
        }
    }
    for (const snapshot of evidence) {
        expect(snapshot.pixelRatio).toBe(0.35);
        expect(snapshot.meshSegments).toBe(160);
        expect(snapshot.geometryVertices).toBe(25921);
        expect(snapshot.assetsAndSettingsUnchanged).toBe(true);
    }
    await test.info().attach('workload-framebuffer-lifecycle', { body: JSON.stringify(evidence, null, 2), contentType: 'application/json' });
});
