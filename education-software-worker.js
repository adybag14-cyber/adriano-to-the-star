/* Orthographic sphere projection at the display's native framebuffer size.
   Bilinear texture sampling preserves the complete 2K/5.4K source maps. */
let canvas, context, frame, surface, clouds, points;
let yaw = -.72, pitch = .05, speed = .06, atmosphere = true;
let cloudOpacity = .78, cloudAlpha = false, atmosphereOpacity = .28, atmosphereColour = [41, 122, 235], day = false;
let generation = 0, hidden = false, timer = null, previous = 0, dirty = true;
let reportedGeneration = -1;
const TAU = Math.PI * 2;
function unpack(bitmap) {
  if (!bitmap) return null;
  const scratch = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = scratch.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0);
  const result = { width: bitmap.width, height: bitmap.height, data: ctx.getImageData(0, 0, bitmap.width, bitmap.height).data };
  bitmap.close();
  return result;
}
function resize(size) {
  canvas.width = canvas.height = size;
  frame = context.createImageData(size, size);
  const entries = [];
  const radius = size * .47;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const nx = (x + .5 - size / 2) / radius, ny = -(y + .5 - size / 2) / radius;
    const d = nx * nx + ny * ny;
    if (d <= 1) {
      const nz = Math.sqrt(1 - d);
      const light = Math.max(0, -.55 * nx + .35 * ny + .76 * nz);
      entries.push((y * size + x) * 4, nx, ny, nz, .1 + .9 * light, Math.min(1, (1 - Math.sqrt(d)) * radius), 0, 0, Math.pow(1 - nz, 3) * .28);
    }
  }
  points = new Float32Array(entries);
  project();
  dirty = true;
}
function project() {
  if (!points) return;
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  for (let i = 0; i < points.length; i += 9) {
    const nx = points[i + 1], ny = points[i + 2], nz = points[i + 3];
    const ry = ny * cp - nz * sp, rz = ny * sp + nz * cp;
    points[i + 6] = .5 + Math.atan2(nx, rz) / TAU;
    points[i + 7] = .5 - Math.asin(Math.max(-1, Math.min(1, ry))) / Math.PI;
  }
}
const sampled = new Float32Array(4);
function sample(texture, u, v, out) {
  const tx = ((u % 1 + 1) % 1) * texture.width;
  const ty = Math.max(0, Math.min(texture.height - 1, v * (texture.height - 1)));
  const x = Math.floor(tx), y = Math.floor(ty), fx = tx - x, fy = ty - y;
  const a = (y * texture.width + x) * 4;
  const b = (y * texture.width + (x + 1) % texture.width) * 4;
  const c = (Math.min(y + 1, texture.height - 1) * texture.width + x) * 4;
  const d = (Math.min(y + 1, texture.height - 1) * texture.width + (x + 1) % texture.width) * 4;
  for (let channel = 0; channel < 4; channel++) {
    out[channel] = (texture.data[a + channel] * (1 - fx) + texture.data[b + channel] * fx) * (1 - fy)
      + (texture.data[c + channel] * (1 - fx) + texture.data[d + channel] * fx) * fy;
  }
}
function paint() {
  if (!surface || !frame || !points) return;
  const pixels = frame.data;
  const cloudSample = new Float32Array(4);
  for (let i = 0; i < points.length; i += 9) {
    const offset = points[i];
    const u = points[i + 6] + yaw / TAU, v = points[i + 7];
    sample(surface, u, v, sampled);
    let cloud = 0;
    if (clouds) {
      sample(clouds, u + yaw * .04 / TAU, v, cloudSample);
      cloud = (cloudAlpha ? cloudSample[3] : Math.max(cloudSample[0], cloudSample[1], cloudSample[2])) / 255 * cloudOpacity;
    }
    const rim = atmosphere ? Math.min(.9, points[i + 8] * atmosphereOpacity / .28) : 0;
    const light = day ? .1 + .9 * points[i + 3] : points[i + 4];
    for (let channel = 0; channel < 3; channel++) {
      const sky = atmosphereColour[channel];
      pixels[offset + channel] = Math.min(255, (sampled[channel] * (1 - cloud) + 245 * cloud) * light * (1 - rim) + sky * rim);
    }
    pixels[offset + 3] = Math.round(points[i + 5] * 255);
  }
  context.putImageData(frame, 0, 0);
  if (reportedGeneration !== generation) {
    postMessage({ type: 'painted', generation, surfaceWidth: surface.width, clouds: !!clouds });
    reportedGeneration = generation;
  }
}
function tick(time) {
  timer = null;
  if (hidden) return;
  const dt = Math.min(.05, previous ? (time - previous) / 1000 : 0);
  previous = time;
  if (speed || dirty) { yaw += speed * dt; paint(); dirty = false; }
  if (speed) schedule();
}
function schedule() {
  if (hidden || timer !== null) return;
  timer = typeof requestAnimationFrame === 'function' ? requestAnimationFrame(tick) : setTimeout(() => tick(performance.now()), 16);
}
self.onmessage = ({ data }) => {
  if (data.type === 'init') { canvas = data.canvas; context = canvas.getContext('2d'); }
  if (data.type === 'resize') resize(data.size);
  if (data.type === 'planet') {
    surface = unpack(data.surface); clouds = unpack(data.clouds); generation = data.generation;
    speed = data.speed; atmosphere = data.atmosphere; yaw = data.yaw; pitch = data.pitch; project(); dirty = true;
    cloudOpacity = data.cloudOpacity ?? .78; cloudAlpha = Boolean(data.cloudAlpha);
    atmosphereOpacity = data.atmosphereOpacity ?? .28; atmosphereColour = data.atmosphereColour ?? [41, 122, 235]; day = Boolean(data.day);
  }
  if (data.type === 'view') { yaw = data.yaw; pitch = data.pitch; project(); dirty = true; }
  if (data.type === 'visibility') { hidden = data.hidden; previous = 0; }
  schedule();
};
