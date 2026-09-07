/* Same central/tangential force model and glow kernel as the WebGPU lab.
   Never silently reduce the particle count or the display resolution. */
let canvas, context, image, particles, count = 50000, playing = true, hidden = false;
let params = { gravity: 1, damping: 1, timeScale: 1, time: 0 };
let mouse = { x: 0, y: 0, active: 0 }, timer = null, previous = 0, telemetryAt = 0, frames = 0;
const frameTimes = [];
function reset(nextCount) {
  count = Math.max(10000, Math.min(500000, Math.floor(nextCount)));
  particles = new Float32Array(count * 6);
  for (let i = 0; i < count; i++) {
    const dist = Math.random(), angle = dist * 10 + (i % 3) * Math.PI * 2 / 3 + (Math.random() - .5) * .28, radius = dist * 5;
    const speed = Math.sqrt(3 * radius * radius / Math.pow(radius * radius + .16, 1.5)), p = i * 6;
    particles[p] = Math.cos(angle) * radius;
    particles[p + 1] = Math.sin(angle) * radius;
    particles[p + 2] = -Math.sin(angle) * speed;
    particles[p + 3] = Math.cos(angle) * speed;
    particles[p + 4] = Math.random() * .5 + .5;
    particles[p + 5] = Math.random();
  }
}
function simulate(dt) {
  for (let i = 0; i < particles.length; i += 6) {
    let x = particles[i], y = particles[i + 1], vx = particles[i + 2], vy = particles[i + 3];
    const softened = x * x + y * y + .16;
    const center = 3 / (softened * Math.sqrt(softened)) * params.gravity;
    let fx = -x * center, fy = -y * center;
    if (mouse.active) {
      const mx = mouse.x - x, my = mouse.y - y, md = Math.hypot(mx, my);
      if (md < 2 && md > .000001) {
        const softenedMouse = md * md + .16;
        const force = 8 / (softenedMouse * Math.sqrt(softenedMouse));
        fx += mx * force; fy += my * force;
      }
    }
    vx = (vx + fx * dt) * params.damping; vy = (vy + fy * dt) * params.damping;
    x += vx * dt; y += vy * dt;
    particles[i] = x; particles[i + 1] = y; particles[i + 2] = vx; particles[i + 3] = vy;
  }
}
function paint() {
  if (!image) return;
  const pixels = image.data, width = canvas.width, height = canvas.height;
  // Opaque black clear, preserving full-resolution subpixel sprite coverage.
  new Uint32Array(pixels.buffer).fill(0xff000000);
  const scale = Math.min(width, height) * .5, aspect = width / height;
  for (let i = 0; i < particles.length; i += 6) {
    const x = particles[i], y = particles[i + 1];
    const cx = width * .5 + x / 5.5 * scale, cy = height * .5 - y / 5.5 * scale;
    const ry = .003 * Math.max(.5, particles[i + 4]) * scale, rx = ry / aspect;
    if (cx < -rx || cx >= width + rx || cy < -ry || cy >= height + ry) continue;
    const dist = Math.hypot(x, y) / 5.5;
    const r = dist > .6 ? .8 : dist > .3 ? .6 : 1;
    const g = dist > .6 ? .4 : .8, b = dist > .3 ? (dist > .6 ? .8 : 1) : .6;
    for (let py = Math.max(0, Math.floor(cy - ry)); py <= Math.min(height - 1, Math.ceil(cy + ry)); py++) {
      for (let px = Math.max(0, Math.floor(cx - rx)); px <= Math.min(width - 1, Math.ceil(cx + rx)); px++) {
        const d = Math.hypot((px + .5 - cx) / rx, (py + .5 - cy) / ry);
        if (d >= 1) continue;
        const alpha = (1 - d * d * (3 - 2 * d)) * Math.exp(-d * 3) * 1.5 * 255;
        const p = (py * width + px) * 4;
        pixels[p] += r * alpha; pixels[p + 1] += g * alpha; pixels[p + 2] += b * alpha;
      }
    }
  }
  context.putImageData(image, 0, 0);
}
function tick(time) {
  timer = null;
  if (!playing || hidden || !image) return;
  const workStart = performance.now(), elapsed = previous ? time - previous : 1000 / 60;
  previous = time;
  const dt = Math.min(.033, elapsed / 1000) * params.timeScale;
  params.time += dt;
  simulate(dt); paint(); frames++;
  frameTimes.push(elapsed);
  if (frameTimes.length > 64) frameTimes.shift();
  if (time - telemetryAt >= 250) {
    const mean = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
    postMessage({ type: 'telemetry', count, frames, time: params.time, fps: 1000 / mean,
      frameTimes, workMs: performance.now() - workStart });
    telemetryAt = time;
  }
  schedule();
}
function schedule() {
  if (timer !== null || !playing || hidden || !image) return;
  timer = typeof requestAnimationFrame === 'function' ? requestAnimationFrame(tick) : setTimeout(() => tick(performance.now()), 16);
}
self.onmessage = ({ data }) => {
  if (data.type === 'init') {
    canvas = data.canvas; context = canvas.getContext('2d', { alpha: false });
    params = data.params; playing = data.playing; reset(data.count);
  }
  if (data.type === 'resize') {
    canvas.width = data.width; canvas.height = data.height;
    image = context.createImageData(data.width, data.height); paint();
  }
  if (data.type === 'params') params = { ...params, gravity: data.params.gravity, damping: data.params.damping, timeScale: data.params.timeScale };
  if (data.type === 'count') { reset(data.count); paint(); }
  if (data.type === 'pointer') mouse = data;
  if (data.type === 'playing') { playing = data.playing; previous = 0; }
  if (data.type === 'visibility') { hidden = data.hidden; previous = 0; }
  schedule();
};
