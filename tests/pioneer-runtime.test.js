beforeAll(() => { require('../pioneer-runtime.js'); });

function fixture() {
    const events = new Map();
    const callbacks = new Map();
    let next = 1;
    const doc = { hidden: false, addEventListener: (name, callback) => events.set(name, callback), removeEventListener: name => events.delete(name) };
    const game = { isPaused: false, timeScale: 1, stepSimulation: jest.fn(), renderFrame: jest.fn(), colonyTick: jest.fn(), notify: jest.fn() };
    const runtime = new window.PioneerRuntime(game, {
        document: doc,
        requestFrame: callback => { const id = next++; callbacks.set(id, callback); return id; },
        cancelFrame: id => callbacks.delete(id)
    });
    return { game, runtime, doc, events, callbacks, frame: time => {
        const [id, callback] = callbacks.entries().next().value;
        callbacks.delete(id);
        callback(time);
    } };
}

test.each([30, 60, 144])('colony advances by equal elapsed time at %i Hz', hz => {
    const { runtime, game } = fixture();
    for (let i = 0; i < hz * 5; i++) runtime.advance(1 / hz);
    expect(game.stepSimulation).toHaveBeenCalledTimes(300);
    expect(game.colonyTick).toHaveBeenCalledTimes(5);
    expect(game.renderFrame).toHaveBeenCalledTimes(hz * 5);
    runtime.dispose();
});

test('pause freezes all simulation while the camera continues rendering', () => {
    const { runtime, game } = fixture();
    game.isPaused = true;
    for (let i = 0; i < 180; i++) runtime.advance(1 / 60);
    expect(game.stepSimulation).not.toHaveBeenCalled();
    expect(game.colonyTick).not.toHaveBeenCalled();
    expect(game.renderFrame).toHaveBeenCalledTimes(180);
    game.isPaused = false;
    game.timeScale = 0;
    runtime.advance(0.1);
    expect(game.stepSimulation).not.toHaveBeenCalled();
    game.timeScale = 1;
    runtime.advance(1 / 60);
    expect(game.stepSimulation).toHaveBeenCalledTimes(1);
    runtime.dispose();
});

test('duplicate starts, hide/show and context recovery never fork frame ownership or catch up hidden time', () => {
    const { runtime, game, callbacks, frame, doc, events } = fixture();
    runtime.start(); runtime.start();
    expect(callbacks.size).toBe(1);
    frame(0); frame(20);
    const steps = game.stepSimulation.mock.calls.length;
    doc.hidden = true; events.get('visibilitychange')();
    expect(callbacks.size).toBe(0);
    doc.hidden = false; events.get('visibilitychange')();
    frame(900000);
    expect(game.stepSimulation).toHaveBeenCalledTimes(steps);
    const preventDefault = jest.fn();
    runtime.onContextLost({ preventDefault });
    expect(preventDefault).toHaveBeenCalled();
    expect(callbacks.size).toBe(0);
    runtime.onContextRestored();
    expect(callbacks.size).toBe(1);
    frame(990000);
    expect(game.stepSimulation).toHaveBeenCalledTimes(steps);
    runtime.dispose();
    expect(callbacks.size).toBe(0);
    expect(events.size).toBe(0);
    runtime.start();
    expect(callbacks.size).toBe(0);
});

test('a long stall has bounded simulation work and telemetry never grows beyond its ring', () => {
    const { runtime, game } = fixture();
    runtime.advance(120);
    expect(game.stepSimulation).toHaveBeenCalledTimes(6);
    expect(game.colonyTick).not.toHaveBeenCalled();
    for (let i = 0; i < 1000; i++) runtime.advance(1 / 60);
    const metrics = runtime.getMetrics();
    expect(metrics.samples).toBe(240);
    expect(metrics.p99Ms).toBeCloseTo(1000 / 60);
    runtime.dispose();
});
