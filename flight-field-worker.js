/* Identical deterministic stars, antialiasing, additive trails and DPR to the
   foreground renderer, but canvas raster work no longer blocks UI/scrolling. */
let canvas, context, width = 0, height = 0, stars = [], random;
let pointerX = .5, pointerY = .5, reduced = false, hidden = false, suppressed = false;
let pending = null, previous = 0, frames = 0, statsAt = 0;
let interval = 1000 / 30, nextFrameAt = 0;
let previousPaint = 0;
let reportNextFrame = false;
const intervals = [];
function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}
function resetStar(star = {}, initial = false) {
  const angle = random() * Math.PI * 2, radius = .025 + Math.pow(random(), 1.55) * .78;
  star.x = Math.cos(angle) * radius; star.y = Math.sin(angle) * radius;
  star.z = initial ? .075 + random() * 1.18 : 1.08 + random() * .22;
  star.speed = .88 + random() * .72; star.size = .38 + random() * .78; star.alpha = .52 + random() * .46;
  const tone = random();
  star.colour = tone > .92 ? '244,221,178' : tone > .76 ? '175,221,255' : tone > .62 ? '220,205,255' : '232,240,255';
  return star;
}
function resize(data) {
  if (width === data.width && height === data.height && canvas.width === Math.round(data.width * data.dpr)) return;
  width = data.width; height = data.height;
  canvas.width = Math.round(width * data.dpr); canvas.height = Math.round(height * data.dpr);
  context.setTransform(data.dpr, 0, 0, data.dpr, 0, 0);
  random = seededRandom((0x1A2B3C4D ^ Math.round(width / 64) << 13 ^ Math.round(height / 48)) >>> 0);
  stars = Array.from({ length: Math.max(72, Math.min(196, Math.floor(width * height / 7600))) }, () => resetStar({}, true));
  paint(0, false); report(0);
}
function paint(dt, advance) {
  context.clearRect(0, 0, width, height);
  context.save(); context.globalCompositeOperation = 'lighter'; context.lineCap = 'round';
  const cx = width * .5 + (pointerX - .5) * 8, cy = height * .47 + (pointerY - .5) * 6;
  const projection = Math.min(width, height) * .9;
  for (const star of stars) {
    if (advance) star.z -= dt * .00008 * star.speed;
    if (star.z <= .045) { resetStar(star); continue; }
    const x = cx + star.x / star.z * projection, y = cy + star.y / star.z * projection;
    const trailZ = star.z + .00008 * star.speed * (1000 / 30) * 3.2;
    const px = cx + star.x / trailZ * projection, py = cy + star.y / trailZ * projection;
    if (x < -90 || x > width + 90 || y < -90 || y > height + 90) { resetStar(star); continue; }
    const depth = Math.max(0, Math.min(1, 1 - star.z / 1.28)), alpha = star.alpha * (.24 + depth * .76);
    if (advance && depth > .08) {
      context.beginPath(); context.moveTo(px, py); context.lineTo(x, y);
      context.strokeStyle = `rgba(${star.colour},${alpha})`; context.lineWidth = .45 + depth * 2.1; context.stroke();
    }
    context.beginPath(); context.arc(x, y, star.size * (.45 + depth * 1.15), 0, Math.PI * 2);
    context.fillStyle = `rgba(${star.colour},${Math.min(1, alpha + .12)})`; context.fill();
  }
  context.restore(); frames++;
}
function report(time) {
  const sorted = intervals.slice().sort((a, b) => a - b);
  const jitter = intervals.slice(1).map((value, index) => Math.abs(value - intervals[index])).sort((a, b) => a - b);
  postMessage({ type: 'stats', count: stars.length, frames, renderMode: reduced ? 'static-starfield' : 'forward-flight', p50: sorted[Math.floor(sorted.length * .5)] || 0,
    p95: sorted[Math.floor(sorted.length * .95)] || 0, p99: sorted[Math.floor(sorted.length * .99)] || 0,
    jitter95: jitter[Math.floor(jitter.length * .95)] || 0,
    fps: intervals.length ? 1000 * intervals.length / intervals.reduce((a, b) => a + b, 0) : 0 });
  statsAt = time;
}
function tick(time) {
  pending = null;
  if (hidden || suppressed || reduced) return;
  if (time + .5 < nextFrameAt) { schedule(); return; }
  const dt = previous ? time - previous : 1000 / 60;
  previous = time;
  nextFrameAt += interval * (Math.floor(Math.max(0, time - nextFrameAt) / interval) + 1);
  const paintAt = performance.now();
  if (previousPaint) intervals.push(paintAt - previousPaint);
  previousPaint = paintAt;
  if (intervals.length > 240) intervals.shift();
  paint(Math.min(64, Math.max(1, dt)), true);
  if (reportNextFrame || time - statsAt > 1000) { report(time); reportNextFrame = false; }
  schedule();
}
function schedule() {
  if (pending !== null || hidden || suppressed || reduced) return;
  // The scene is intentionally 30 Hz, independent of a loaded page's rAF rate.
  // One monotonic deadline and one pending task avoid accumulating drift or
  // queuing frames behind foreground layout/compositing work.
  pending = setTimeout(() => tick(performance.now()), Math.max(1, nextFrameAt - performance.now()));
}
self.onmessage = ({ data }) => {
  if (data.type === 'init') {
    canvas = data.canvas; context = canvas.getContext('2d', { alpha: true });
    interval = data.interval || 1000 / 30;
    reduced = data.reduced; hidden = data.hidden; suppressed = data.suppressed; resize(data);
  }
  if (data.type === 'resize') resize(data);
  if (data.type === 'pointer') { pointerX = data.x; pointerY = data.y; }
  if (data.type === 'state') {
    reduced = data.reduced ?? reduced; hidden = data.hidden ?? hidden; suppressed = data.suppressed ?? suppressed;
    previous = 0; previousPaint = 0; nextFrameAt = 0;
    if (reduced && !hidden && !suppressed) { paint(0, false); report(performance.now()); }
    else reportNextFrame = true;
  }
  schedule();
};
