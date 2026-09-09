// These browser-local checks never send renderer identity to a server.
// Unknown or privacy-redacted adapters remain eligible for normal WebGL2.
export function isSoftwareWebGL(context) {
    try {
        const info = context.getExtension('WEBGL_debug_renderer_info');
        const renderer = context.getParameter(
            info ? info.UNMASKED_RENDERER_WEBGL : context.RENDERER
        );
        return /swiftshader|llvmpipe|softpipe|software rasterizer|microsoft basic render/i.test(
            String(renderer)
        );
    } catch {
        return false;
    }
}
