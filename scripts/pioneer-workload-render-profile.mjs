/**
 * Test-only framebuffer budget for the software-rendered gameplay workload.
 * This does not modify geometry, textures, shaders, antialiasing, simulation or
 * production settings. The cap survives reloads and later settings/resize calls.
 */
export async function installWorkloadRenderProfile(context, pixelRatio = 0.35) {
    await context.addInitScript(({ pixelRatio }) => {
        const state = { version: 'workload-framebuffer-v1', pixelRatio, renderers: [] };
        window.__pioneerWorkloadRenderProfile = state;
        const wrap = OriginalRenderer => {
            if (typeof OriginalRenderer !== 'function' || OriginalRenderer.__workloadFramebuffer) return OriginalRenderer;
            function WorkloadRenderer(...parameters) {
                const renderer = new OriginalRenderer(...parameters);
                const setPixelRatio = renderer.setPixelRatio.bind(renderer);
                renderer.setPixelRatio = requested => setPixelRatio(Math.min(pixelRatio, Math.max(0.1, Number(requested) || 1)));
                renderer.setPixelRatio(pixelRatio);
                renderer.domElement.dataset.workloadRenderProfile = state.version;
                state.renderers.push(renderer);
                return renderer;
            }
            WorkloadRenderer.prototype = OriginalRenderer.prototype;
            Object.setPrototypeOf(WorkloadRenderer, OriginalRenderer);
            WorkloadRenderer.__workloadFramebuffer = true;
            return WorkloadRenderer;
        };
        const instrument = namespace => {
            if (!namespace || namespace.__workloadFramebufferInstalled) return namespace;
            Object.defineProperty(namespace, '__workloadFramebufferInstalled', { value: true });
            let renderer = wrap(namespace.WebGLRenderer);
            Object.defineProperty(namespace, 'WebGLRenderer', {
                configurable: true, enumerable: true,
                get: () => renderer,
                set: value => { renderer = wrap(value); }
            });
            return namespace;
        };
        let three = instrument(window.THREE);
        Object.defineProperty(window, 'THREE', {
            configurable: true, enumerable: true,
            get: () => three,
            set: value => { three = instrument(value); }
        });
    }, { pixelRatio });
}

/** Inspect each lifecycle boundary without rebuilding a world or changing its save. */
export async function verifyWorkloadRenderProfile(page, label) {
    const evidence = await page.evaluate(() => {
        const g = window.game;
        const state = window.__pioneerWorkloadRenderProfile;
        if (!state || g.renderer.domElement.dataset.workloadRenderProfile !== state.version) throw new Error('Workload framebuffer cap was not installed before startup.');
        const assets = () => {
            const geometries = new Set();
            const textures = new Set();
            const recordTexture = value => { if (value?.isTexture) textures.add(value.uuid); };
            g.scene.traverse(object => {
                if (object.geometry) geometries.add(object.geometry.uuid);
                const materials = Array.isArray(object.material) ? object.material : [object.material];
                for (const material of materials.filter(Boolean)) {
                    Object.values(material).forEach(recordTexture);
                    Object.values(material.uniforms || {}).forEach(uniform => recordTexture(uniform.value));
                }
            });
            return { geometries: [...geometries].sort(), textures: [...textures].sort(), graphics: { ...g.graphicsSettings } };
        };
        const before = assets();
        const size = g.renderer.getSize(new window.THREE.Vector2());
        // EffectComposer owns a separate ratio. Keep it bounded after each new
        // document, without the old whole-world rebuild that would taint saves.
        if (g.composer && g.composer._pixelRatio !== state.pixelRatio) {
            g.composer.setPixelRatio(state.pixelRatio);
            g.composer.setSize(size.x, size.y);
        }
        const after = assets();
        const buffer = g.renderer.getDrawingBufferSize(new window.THREE.Vector2());
        const gl = g.renderer.getContext();
        const extension = gl.getExtension('WEBGL_debug_renderer_info');
        return {
            version: state.version,
            pixelRatio: g.renderer.getPixelRatio(),
            css: { width: size.x, height: size.y },
            framebuffer: { width: buffer.x, height: buffer.y },
            drawingBuffer: { width: gl.drawingBufferWidth, height: gl.drawingBufferHeight },
            expected: { width: Math.floor(size.x * state.pixelRatio), height: Math.floor(size.y * state.pixelRatio) },
            composer: g.composer ? { pixelRatio: g.composer._pixelRatio, width: g.composer.renderTarget1.width, height: g.composer.renderTarget1.height } : null,
            renderer: extension ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
            geometryVertices: g.planetMesh.geometry.attributes.position.count,
            meshSegments: g.planetMesh.userData.terrain.meshSegments,
            geometryCount: after.geometries.length,
            textureCount: after.textures.length,
            assetsAndSettingsUnchanged: JSON.stringify(before) === JSON.stringify(after)
        };
    });
    if (evidence.pixelRatio !== 0.35 || !evidence.assetsAndSettingsUnchanged
        || evidence.framebuffer.width !== evidence.expected.width || evidence.framebuffer.height !== evidence.expected.height
        || evidence.drawingBuffer.width !== evidence.expected.width || evidence.drawingBuffer.height !== evidence.expected.height
        || (evidence.composer && (evidence.composer.pixelRatio !== 0.35
            || Math.abs(evidence.composer.width - evidence.expected.width) >= 1 || Math.abs(evidence.composer.height - evidence.expected.height) >= 1))) {
        throw new Error(`Workload framebuffer lifecycle failure (${label}): ${JSON.stringify(evidence)}`);
    }
    return { label, ...evidence };
}
