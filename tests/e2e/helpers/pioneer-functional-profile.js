/* global game */
import { test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
export const softwareFunctionalProfile = process.env.PIONEER_FUNCTIONAL_RENDER_PROFILE === 'software';
export const forceSwiftShader = process.env.PIONEER_FORCE_SWIFTSHADER === '1';
export const swiftShaderLaunchOptions = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };

/**
 * Functional UI tests have a separate, explicit software-renderer budget. All geometry,
 * textures, shaders, input handlers and simulation systems remain real. Only framebuffer
 * sampling, MSAA, shadow passes and postprocessing differ from the production profile.
 * The dedicated advanced-graphics suite does not import or install this helper.
 */
export async function installPioneerFunctionalProfile(page) {
    if (!softwareFunctionalProfile) return;
    const cpuRate = Math.max(1, Number(process.env.PIONEER_TEST_CPU_RATE) || 1);
    if (cpuRate > 1) {
        const session = await page.context().newCDPSession(page);
        await session.send('Emulation.setCPUThrottlingRate', { rate: cpuRate });
    }
    await page.addInitScript(() => {
        const pixelRatio = 0.35;
        const state = { profile: 'software-functional-v1', pixelRatio, renderers: [] };
        window.__pioneerFunctionalProfile = state;
        const wrap = OriginalRenderer => {
            if (typeof OriginalRenderer !== 'function' || OriginalRenderer.__functionalProfile) return OriginalRenderer;
            function FunctionalRenderer(parameters = {}) {
                const renderer = new OriginalRenderer({ ...parameters, antialias: false });
                const setPixelRatio = renderer.setPixelRatio.bind(renderer);
                renderer.setPixelRatio = requested => setPixelRatio(Math.min(pixelRatio, Math.max(0.1, Number(requested) || 1)));
                renderer.setPixelRatio(pixelRatio);
                if (renderer.shadowMap) Object.defineProperty(renderer.shadowMap, 'enabled', { configurable: true, get: () => false, set: () => {} });
                renderer.domElement.dataset.functionalRenderProfile = state.profile;
                state.renderers.push(renderer);
                return renderer;
            }
            FunctionalRenderer.prototype = OriginalRenderer.prototype;
            Object.setPrototypeOf(FunctionalRenderer, OriginalRenderer);
            FunctionalRenderer.__functionalProfile = true;
            return FunctionalRenderer;
        };
        const instrument = namespace => {
            if (!namespace || namespace.__functionalProfileInstalled) return namespace;
            Object.defineProperty(namespace, '__functionalProfileInstalled', { value: true });
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
    });
}

export async function applyPioneerFunctionalProfile(page) {
    if (!softwareFunctionalProfile) return null;
    await page.waitForFunction(() => window.game?.renderer && window.game?.planetMesh, null, { timeout: 60000 });
    const evidence = await page.evaluate(() => {
        const state = window.__pioneerFunctionalProfile;
        if (!state || game.renderer.domElement.dataset.functionalRenderProfile !== state.profile) throw new Error('Software functional renderer was not installed before Pioneer startup.');
        game.composer?.passes?.forEach((pass, index) => { if (index > 0) pass.enabled = false; });
        game.composer?.setPixelRatio?.(state.pixelRatio);
        game.composer?.setSize?.(game.container.clientWidth, game.container.clientHeight);
        const gl = game.renderer.getContext();
        const extension = gl.getExtension('WEBGL_debug_renderer_info');
        const textures=new Map();
        const recordTexture=texture=>{
            if(texture?.isTexture)textures.set(texture.uuid,{uuid:texture.uuid,width:texture.image?.width||0,height:texture.image?.height||0});
        };
        game.scene.traverse(object=>{
            const materials=Array.isArray(object.material)?object.material:[object.material];
            for(const material of materials.filter(Boolean)){
                Object.values(material).forEach(recordTexture);
                Object.values(material.uniforms||{}).forEach(uniform=>recordTexture(uniform.value));
            }
        });
        return {
            profile: state.profile,
            renderer: extension ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
            pixelRatio: game.renderer.getPixelRatio(),
            shadowMapEnabled: game.renderer.shadowMap.enabled,
            enabledPostPasses: game.composer?.passes?.filter((pass, index) => index > 0 && pass.enabled).length || 0,
            geometryVertices: game.planetMesh.geometry.attributes.position.count,
            meshSegments: game.planetMesh.userData.terrain.meshSegments,
            meshDetail: game.planetMesh.userData.terrain.meshDetail,
            physicalProfile: game.planetMesh.userData.terrain.physicalProfile,
            observedTextures:Array.from(textures.values()),
            framebuffer:{width:game.renderer.domElement.width,height:game.renderer.domElement.height}
        };
    });
    if (evidence.pixelRatio > 0.35 || evidence.shadowMapEnabled || evidence.enabledPostPasses) throw new Error(`Functional rendering profile failed: ${JSON.stringify(evidence)}`);
    const evidencePath=test.info().outputPath('pioneer-functional-renderer-profile.json');
    await writeFile(evidencePath,JSON.stringify(evidence,null,2));
    await test.info().attach('pioneer-functional-renderer-profile', { path:evidencePath,contentType:'application/json' });
    return evidence;
}

/** Wait for the actual 60 Hz runtime budget; slow wall-clock rendering cannot skip a task. */
export async function waitForQuantumSimulationCompletion(page) {
    const budget = await page.evaluate(() => ({
        initialSteps: game.runtime.simulationSteps,
        remaining: Math.max(0, ...game.quantum.activeTasks.map(task => task.duration - task.progress)),
        timeScale: game.timeScale,
        types: game.quantum.activeTasks.map(task => task.type)
    }));
    if (budget.timeScale !== 1) throw new Error(`Quantum functional test requires the real 1x simulation, received ${budget.timeScale}.`);
    const requiredSteps = Math.ceil((budget.remaining + 0.15) * 60);
    await page.waitForFunction(({ initialSteps, requiredSteps }) => {
        return game.quantum.activeTasks.length === 0 || game.runtime.simulationSteps - initialSteps >= requiredSteps;
    }, { initialSteps: budget.initialSteps, requiredSteps }, { timeout: softwareFunctionalProfile ? 90000 : 15000, polling: 100 });
    const result = await page.evaluate(initialSteps => ({
        advancedSteps: game.runtime.simulationSteps - initialSteps,
        pending: game.quantum.activeTasks.map(task => ({ type: task.type, progress: task.progress, duration: task.duration })),
        speed: game.timeScale,
        paused: game.isPaused
    }), budget.initialSteps);
    if (result.pending.length) throw new Error(`Quantum tasks did not complete after their real simulation budget: ${JSON.stringify({ budget, requiredSteps, result })}`);
    return { budget, result };
}
