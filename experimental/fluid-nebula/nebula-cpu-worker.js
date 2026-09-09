/* Incompressible CPU compatibility solver. GPU-only depth integration is not
   falsely advertised here; the 2D pressure/advection simulation still works. */
let canvas,
    ctx,
    fieldCanvas,
    fieldContext,
    W = 128,
    H = 128,
    N = 0;
let vx, vy, vx1, vy1, dye, dye1, pressure, pressure1, divergence, curl;
let params = {},
    playing = true,
    hidden = false,
    pending = null,
    previous = 0,
    time = 0,
    frames = 0,
    lastStats = 0;
const cell = (x, y) => Math.max(0, Math.min(H - 1, y)) * W + Math.max(0, Math.min(W - 1, x));
function sample(a, x, y) {
    x = Math.max(0, Math.min(W - 1, x));
    y = Math.max(0, Math.min(H - 1, y));
    const ix = Math.floor(x),
        iy = Math.floor(y),
        fx = x - ix,
        fy = y - iy;
    return (
        (a[cell(ix, iy)] * (1 - fx) + a[cell(ix + 1, iy)] * fx) * (1 - fy) +
        (a[cell(ix, iy + 1)] * (1 - fx) + a[cell(ix + 1, iy + 1)] * fx) * fy
    );
}
function reset() {
    W = { balanced: 96, high: 128, ultra: 192 }[params.quality] || 128;
    H = Math.max(64, Math.round((W * canvas.height) / canvas.width));
    N = W * H;
    [vx, vy, vx1, vy1, dye, dye1, pressure, pressure1, divergence, curl] = Array.from(
        { length: 10 },
        () => new Float32Array(N)
    );
    fieldCanvas = new OffscreenCanvas(W, H);
    fieldContext = fieldCanvas.getContext('2d');
    for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
            const px = ((x / W - 0.5) * canvas.width) / canvas.height,
                py = y / H - 0.5,
                index = y * W + x;
            vx[index] = -py * 0.14;
            vy[index] = px * 0.14;
            const wave =
                Math.sin(px * 8 + params.seed) * Math.cos(py * 7 + params.seed * 0.3) +
                0.4 * Math.sin(px * 31 - py * 21);
            dye[index] = Math.max(0, 0.5 + wave * 0.23) * Math.exp(-(px * px + py * py * 2.3) * 4);
        }
    time = 0;
    previous = 0;
    paint();
}
function advect(source, destination, dt) {
    for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
            const i = y * W + x;
            destination[i] = sample(source, x - vx[i] * dt * W, y - vy[i] * dt * H);
        }
}
function step(dt) {
    advect(vx, vx1, dt);
    advect(vy, vy1, dt);
    [vx, vx1] = [vx1, vx];
    [vy, vy1] = [vy1, vy];
    for (let y = 1; y < H - 1; y++)
        for (let x = 1; x < W - 1; x++) {
            const i = y * W + x;
            curl[i] = (vy[i + 1] - vy[i - 1]) * W * 0.5 - (vx[i + W] - vx[i - W]) * H * 0.5;
        }
    for (let y = 1; y < H - 1; y++)
        for (let x = 1; x < W - 1; x++) {
            const i = y * W + x,
                gx = Math.abs(curl[i + 1]) - Math.abs(curl[i - 1]),
                gy = Math.abs(curl[i + W]) - Math.abs(curl[i - W]);
            const scale =
                (curl[i] * params.turbulence * dt) /
                Math.max(W, H) /
                (Math.hypot(gx, gy) + 0.00001);
            vx[i] += gy * scale;
            vy[i] -= gx * scale;
        }
    for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
            const i = y * W + x;
            divergence[i] =
                (vx[cell(x + 1, y)] - vx[cell(x - 1, y)]) * W * 0.5 +
                (vy[cell(x, y + 1)] - vy[cell(x, y - 1)]) * H * 0.5;
        }
    const hx = 1 / (W * W),
        hy = 1 / (H * H);
    for (let iteration = 0; iteration < 20; iteration++) {
        for (let y = 0; y < H; y++)
            for (let x = 0; x < W; x++) {
                const i = y * W + x;
                pressure1[i] =
                    ((pressure[cell(x - 1, y)] + pressure[cell(x + 1, y)]) * hy +
                        (pressure[cell(x, y - 1)] + pressure[cell(x, y + 1)]) * hx -
                        divergence[i] * hx * hy) /
                    (2 * (hx + hy));
            }
        [pressure, pressure1] = [pressure1, pressure];
    }
    for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
            const i = y * W + x;
            vx[i] -= (pressure[cell(x + 1, y)] - pressure[cell(x - 1, y)]) * W * 0.5;
            vy[i] -= (pressure[cell(x, y + 1)] - pressure[cell(x, y - 1)]) * H * 0.5;
            if (x === 0 || x === W - 1) vx[i] = 0;
            if (y === 0 || y === H - 1) vy[i] = 0;
        }
    advect(dye, dye1, dt);
    [dye, dye1] = [dye1, dye];
    for (let i = 0; i < N; i++) dye[i] *= Math.exp(-dt * 0.002);
}
function paint() {
    if (!dye || !ctx) return;
    const image = fieldContext.createImageData(W, H);
    for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
            const i = y * W + x,
                mass = dye[i] * params.density,
                light = Math.max(
                    0.15,
                    1 + (dye[cell(x - 2, y - 2)] - dye[cell(x + 2, y + 2)]) * 0.7
                );
            const amplitude = (1 - Math.exp(-mass * 1.8)) * params.exposure;
            const hue = 0.5 + 0.5 * Math.sin((x / W) * 5 - (y / H) * 3 + params.seed * 0.02);
            const r = params.palette ? 0.4 + hue * 0.55 : 0.85,
                g = params.palette ? 0.45 + hue * 0.25 : 0.22,
                b = params.palette ? 0.85 - hue * 0.45 : 0.65 + hue * 0.3;
            image.data[i * 4] = 255 * Math.pow(Math.min(1, amplitude * r * light), 1 / 2.2);
            image.data[i * 4 + 1] = 255 * Math.pow(Math.min(1, amplitude * g * light), 1 / 2.2);
            image.data[i * 4 + 2] = 255 * Math.pow(Math.min(1, amplitude * b * light), 1 / 2.2);
            image.data[i * 4 + 3] = 255;
        }
    fieldContext.putImageData(image, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(fieldCanvas, 0, 0, canvas.width, canvas.height);
    frames++;
}
function tick(now) {
    pending = null;
    if (hidden || !playing) return;
    const dt = Math.min(0.033, previous ? (now - previous) / 1000 : 1 / 60) * params.timeScale;
    previous = now;
    time += dt;
    step(dt);
    paint();
    if (now - lastStats > 500) {
        self.postMessage({ type: 'stats', width: W, height: H, frames, time });
        lastStats = now;
    }
    schedule();
}
function schedule() {
    if (!pending && !hidden && playing && dye)
        pending = setTimeout(() => tick(performance.now()), 16);
}
self.onmessage = ({ data }) => {
    if (data.type === 'init') {
        canvas = data.canvas;
        ctx = canvas.getContext('2d', { alpha: false });
        params = data.params;
        playing = data.playing;
    }
    if (data.type === 'resize') {
        canvas.width = data.width;
        canvas.height = data.height;
        reset();
    }
    if (data.type === 'reset') {
        params.seed = data.seed;
        reset();
    }
    if (data.type === 'params') {
        const changed = params.quality !== data.params.quality;
        params = data.params;
        playing = data.playing;
        previous = 0;
        if (changed) reset();
        else paint();
    }
    if (data.type === 'visibility') {
        hidden = data.hidden;
        previous = 0;
    }
    if (data.type === 'splat' && dye) {
        const s = data.splat;
        for (let y = 0; y < H; y++)
            for (let x = 0; x < W; x++) {
                const dx = ((x / W - s.x) * canvas.width) / canvas.height,
                    dy = y / H - (1 - s.y),
                    g = Math.exp(-(dx * dx + dy * dy) / 0.0015),
                    i = y * W + x;
                dye[i] += g * 0.1;
                vx[i] += s.dx * g * 2;
                vy[i] -= s.dy * g * 2;
            }
        paint();
    }
    schedule();
};
