/** @jest-environment node */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
function worker(name) {
  const messages = [], callbacks = [];
  let time = 0;
  const scope = vm.createContext({ console, Float32Array, Uint8ClampedArray, Uint32Array, Math,
    performance: { now: () => time }, postMessage: message => messages.push(message),
    requestAnimationFrame: callback => { callbacks.push(callback); return callbacks.length; },
    setTimeout: callback => { callbacks.push(callback); return callbacks.length; }, self: {} });
  vm.runInContext(source(name), scope);
  return { scope, messages, callbacks, run: expression => vm.runInContext(expression, scope),
    advance: now => { time = now; callbacks.shift()(now); },
    send: data => scope.self.onmessage({ data }) };
}
function canvas() {
  const draw = { count: 0 };
  const context = new Proxy({ createImageData: (width, height) => ({ data: new Uint8ClampedArray(width * height * 4) }),
    putImageData: () => { draw.count++; } }, { get: (target, key) => target[key] || (() => {}) });
  return { width: 0, height: 0, getContext: () => context, draw };
}

test('flight renderer preserves count, DPR, deterministic coordinates and visible trails', () => {
  const w = worker('flight-field-worker.js');
  const c = canvas();
  w.send({ type: 'init', canvas: c, width: 2560, height: 1440, dpr: 1.5, reduced: false, hidden: false });
  expect(c.width).toBe(3840); expect(c.height).toBe(2160);
  expect(w.run('stars.length')).toBe(196);
  const first = w.run('JSON.stringify(stars[0])');
  const second = worker('flight-field-worker.js');
  second.send({ type: 'init', canvas: canvas(), width: 2560, height: 1440, dpr: 1.5, reduced: true, hidden: false });
  expect(second.run('JSON.stringify(stars[0])')).toBe(first);
  const before = w.run('frames');
  w.send({ type: 'state', hidden: true });
  w.callbacks.shift()(16.7);
  expect(w.run('frames')).toBe(before);
  expect(w.callbacks).toHaveLength(0);
  w.send({ type: 'state', hidden: false });
  expect(w.callbacks).toHaveLength(1);
  w.send({ type: 'state', reduced: true });
  w.callbacks.shift()(33.4);
  expect(w.callbacks).toHaveLength(0);
});

test('galaxy fallback keeps all 500,000 selected particles and native framebuffer dimensions', () => {
  const w = worker('experimental/webgpu-galaxy/galaxy-software-worker.js');
  const c = canvas();
  w.send({ type: 'init', canvas: c, count: 500000, params: { gravity: 1, damping: 1, timeScale: 1, time: 0 }, playing: false });
  w.send({ type: 'resize', width: 1920, height: 1080 });
  expect(w.run('particles.length')).toBe(500000 * 6);
  expect(c.width).toBe(1920); expect(c.height).toBe(1080);
  expect(c.draw.count).toBe(1);
  expect(w.callbacks).toHaveLength(0);
});

test('rounded 60 Hz timestamps retain the original 30 Hz starfield cadence without 50 ms threshold skips', () => {
  const w = worker('flight-field-worker.js');
  w.send({ type: 'init', canvas: canvas(), width: 1280, height: 720, dpr: 1, reduced: false, hidden: false });
  for (let i = 0; i < 600; i++) w.advance(Math.round(i * 1000 / 60 * 10) / 10);
  expect(w.run('frames')).toBeGreaterThanOrEqual(299);
  expect(w.run('frames')).toBeLessThanOrEqual(302);
});

test('galaxy stays finite and in the camera for a sustained default orbit', () => {
  const w = worker('experimental/webgpu-galaxy/galaxy-software-worker.js');
  w.send({ type: 'init', canvas: canvas(), count: 10000, params: { gravity: 1, damping: 1, timeScale: 1, time: 0 }, playing: false });
  // 60 simulated seconds, using exactly the shader's semi-implicit integration.
  w.run('for (let step = 0; step < 3600; step++) simulate(1 / 60)');
  const stats = w.run(`(() => { let visible = 0, finite = true; for (let i=0;i<particles.length;i+=6) {
    finite &&= Number.isFinite(particles[i]) && Number.isFinite(particles[i+1]);
    if (Math.hypot(particles[i],particles[i+1]) < 5.5) visible++;
  } return { finite, visible }; })()`);
  expect(stats.finite).toBe(true);
  expect(stats.visible).toBeGreaterThan(9900);
});

test('galaxy pause, visibility, count changes and pointer-center singularity stay safe', () => {
  const w = worker('experimental/webgpu-galaxy/galaxy-software-worker.js');
  w.send({ type: 'init', canvas: canvas(), count: 10000, params: { gravity: 1, damping: 1, timeScale: 1, time: 0 }, playing: true });
  w.send({ type: 'resize', width: 80, height: 60 });
  w.send({ type: 'playing', playing: false });
  w.callbacks.shift()(16.7);
  expect(w.run('frames')).toBe(0);
  w.send({ type: 'playing', playing: true });
  w.send({ type: 'visibility', hidden: true });
  w.callbacks.shift()(33.4);
  expect(w.run('frames')).toBe(0);
  w.send({ type: 'count', count: 20000 });
  expect(w.run('count')).toBe(20000);
  w.run('particles[0]=0;particles[1]=0;mouse={x:0,y:0,active:1};simulate(1/60)');
  expect(w.run('Number.isFinite(particles[0]) && Number.isFinite(particles[1])')).toBe(true);
});

test('Earth bilinear sampling wraps longitude and clamps latitude without discarding source pixels', () => {
  const w = worker('education-software-worker.js');
  const result = w.run(`(() => {
    const texture={width:2,height:2,data:new Uint8ClampedArray([255,0,0,255,0,255,0,255,0,0,255,255,255,255,255,255])};
    const a=new Float32Array(3), b=new Float32Array(3);
    sample(texture,.25,.5,a); sample(texture,1.25,.5,b);
    return {a:Array.from(a),b:Array.from(b)};
  })()`);
  expect(result.a).toEqual([127.5,127.5,127.5]);
  expect(result.b).toEqual(result.a);
});

test('contrast repair is not gated on the home-only release attribute', () => {
  const css = source('landing.css');
  expect(css).toContain('body.ita-site-refresh a.button.button-primary');
  expect(css).not.toContain('body[data-release].ita-site-refresh a.button.button-primary');
});

test('Projects tests a real adapter rather than just navigator.gpu presence', async () => {
  const nodes = new Map();
  const node = selector => {
    if (!nodes.has(selector)) nodes.set(selector, { textContent: '', classList: { toggle() {} }, querySelector: () => node(selector + ' b') });
    return nodes.get(selector);
  };
  const scope = vm.createContext({ console, navigator: { gpu: { requestAdapter: async () => null } },
    window: {}, document: { readyState: 'loading', addEventListener() {}, querySelector: node,
      querySelectorAll: () => [], getElementById: node } });
  vm.runInContext(source('projects.js').replace('const boot = () =>', 'window.checkCapabilities = checkCapabilities; const boot = () =>'), scope);
  await scope.window.checkCapabilities();
  expect(node('[data-capability="webgpu"] b').textContent).toBe('Unavailable');
  expect(node('readiness-summary').textContent).toBe('0 / 5 available');
});
