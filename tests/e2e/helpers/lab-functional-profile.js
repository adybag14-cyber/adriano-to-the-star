// Software rasterizers exercise the same shaders at a small physical
// framebuffer. CSS layout and all effects are retained. Native 720p/WQHD
// performance evidence is collected independently on a hardware GPU.
export const labFunctionalDpr = Number(process.env.LAB_FUNCTIONAL_DPR || 1);
if (!Number.isFinite(labFunctionalDpr) || labFunctionalDpr < 0.25 || labFunctionalDpr > 2) {
    throw new Error('LAB_FUNCTIONAL_DPR must describe a nonzero framebuffer (0.25 through 2).');
}

// Force the GPU branch on CI's software driver. This changes only the adapter
// name capability probe, never WebGL draws, shader sources or rendering effects.
export function exerciseWebGLPipeline(page) {
    return page.addInitScript(() => {
        const getParameter = window.WebGL2RenderingContext.prototype.getParameter;
        window.WebGL2RenderingContext.prototype.getParameter = function (parameter) {
            if (parameter === this.RENDERER || parameter === 0x9246) return 'WebGL2 pipeline test';
            return getParameter.call(this, parameter);
        };
    });
}
