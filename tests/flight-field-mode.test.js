/** @jest-environment node */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function startBridge() {
  const callbacks = [];
  let worker;
  class TestWorker {
    constructor() { worker = this; }
    postMessage() {}
    terminate() {}
  }
  const scope = vm.createContext({
    console, URL, AbortController,
    Worker: TestWorker,
    innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1,
    location: { href: 'https://fixture.invalid/index.html' },
    window: { matchMedia: () => ({ matches: false, addEventListener() {} }), addEventListener() {} },
    document: { currentScript: { src: 'https://fixture.invalid/ita-universe-shell.js?v=fixture' },
      hidden: false, readyState: 'loading', addEventListener() {} },
    requestAnimationFrame: fn => { callbacks.push(fn); return callbacks.length; },
  });
  const source = fs.readFileSync(path.join(__dirname, '..', 'ita-universe-shell.js'), 'utf8');
  vm.runInContext(source.replace('  function addRevealMotion()',
    '  window.startFlightWorkerForTest = startFlightWorker;\n  function addRevealMotion()'), scope);
  const canvas = { dataset: {}, transferControlToOffscreen: () => ({}) };
  expect(scope.window.startFlightWorkerForTest(canvas)).toBe(true);
  return {
    canvas,
    report: (renderMode, frames) => worker.onmessage({ data: { type: 'stats', renderMode,
      frames, count: 121, p95: 33.4, p50: 33.3, p99: 35, fps: 30, jitter95: 1 } }),
    present: () => callbacks.splice(0).forEach(fn => fn()),
  };
}

test('periodic worker statistics cannot starve a pending presentation acknowledgement', () => {
  const bridge = startBridge();
  bridge.report('forward-flight', 1);
  bridge.present();
  // A loaded main thread can present slower than the independent worker reports.
  bridge.report('forward-flight', 31);
  expect(bridge.canvas.dataset.renderMode).toBeUndefined();
  bridge.present();
  expect(bridge.canvas.dataset.renderMode).toBe('forward-flight');
  expect(bridge.canvas.dataset.frames).toBe('31');
});

test('rapid real mode changes still reject stale presentation acknowledgements', () => {
  const bridge = startBridge();
  bridge.report('forward-flight', 1);
  bridge.present();
  bridge.report('static-starfield', 2);
  bridge.present();
  expect(bridge.canvas.dataset.renderMode).toBeUndefined();
  bridge.report('forward-flight', 3);
  bridge.present();
  expect(bridge.canvas.dataset.renderMode).toBeUndefined();
  bridge.present();
  expect(bridge.canvas.dataset.renderMode).toBe('forward-flight');
});
