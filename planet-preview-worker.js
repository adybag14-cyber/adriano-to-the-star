/* Uses exactly the Education appearance model, without loading Three on the
   database page. A single worker renders visible, measured-world previews. */
const modelUrl = new URL('planetary-appearance-model.js', self.location.href);
modelUrl.search = new URL(self.location.href).search;
self.importScripts(modelUrl.href);
const appearance = new self.PlanetaryAppearanceModel();
function pixels(canvas) {
    return {
        width: canvas.width,
        height: canvas.height,
        data: canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data,
    };
}
function sample(map, u, v, result) {
    const x = (((u % 1) + 1) % 1) * map.width,
        y = Math.max(0, Math.min(map.height - 1, v * (map.height - 1)));
    const ix = Math.floor(x),
        iy = Math.floor(y),
        fx = x - ix,
        fy = y - iy;
    const a = (iy * map.width + ix) * 4,
        b = (iy * map.width + ((ix + 1) % map.width)) * 4;
    const c = (Math.min(iy + 1, map.height - 1) * map.width + ix) * 4;
    const d = (Math.min(iy + 1, map.height - 1) * map.width + ((ix + 1) % map.width)) * 4;
    for (let k = 0; k < 4; k++)
        result[k] =
            (map.data[a + k] * (1 - fx) + map.data[b + k] * fx) * (1 - fy) +
            (map.data[c + k] * (1 - fx) + map.data[d + k] * fx) * fy;
}
self.onmessage = async ({ data: { id, model, size } }) => {
    try {
        if (!(model.evidence.spectraCount > 0))
            throw new Error('No planetary spectrum in the snapshot');
        const surface = pixels(appearance.createSurfaceCanvas(model, { width: 768, height: 384 }));
        const cloudCanvas = appearance.createCloudCanvas(model, { width: 768, height: 384 });
        const clouds = cloudCanvas ? pixels(cloudCanvas) : null;
        const canvas = new OffscreenCanvas(size, size),
            ctx = canvas.getContext('2d');
        const image = ctx.createImageData(size, size),
            colour = new Float32Array(4),
            cloud = new Float32Array(4);
        const radius = size * 0.47;
        for (let y = 0; y < size; y++)
            for (let x = 0; x < size; x++) {
                const nx = (x + 0.5 - size / 2) / radius,
                    ny = -(y + 0.5 - size / 2) / radius,
                    squared = nx * nx + ny * ny;
                if (squared > 1) continue;
                const nz = Math.sqrt(1 - squared),
                    u = 0.5 + Math.atan2(nx, nz) / (Math.PI * 2),
                    v = 0.5 - Math.asin(ny) / Math.PI;
                sample(surface, u, v, colour);
                let density = 0;
                if (clouds) {
                    sample(clouds, u, v, cloud);
                    density = (cloud[3] / 255) * model.appearance.cloudOpacity;
                }
                const light = 0.12 + 0.88 * Math.max(0, -0.55 * nx + 0.35 * ny + 0.76 * nz);
                const rim = Math.pow(1 - nz, 3) * model.appearance.atmosphereOpacity,
                    offset = (y * size + x) * 4;
                for (let k = 0; k < 3; k++)
                    image.data[offset + k] =
                        (colour[k] * (1 - density) + 235 * density) * light * (1 - rim) +
                        model.appearance.atmosphereColour[k] * rim;
                image.data[offset + 3] = 255 * Math.min(1, (1 - Math.sqrt(squared)) * radius);
            }
        ctx.putImageData(image, 0, 0);
        const blob = await canvas.convertToBlob({ type: 'image/png' });
        self.postMessage({ id, blob, modelVersion: model.modelVersion, planetId: model.planetId });
    } catch (error) {
        self.postMessage({ id, error: error.message });
    }
};
