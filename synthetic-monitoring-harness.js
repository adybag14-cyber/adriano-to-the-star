class SyntheticMonitoringHarness {
    constructor() {
        this.tests = new Map();
        this.results = [];
    }
    registerTest(name, fn) {
        if (typeof fn !== 'function') return;
        this.tests.set(name, fn);
    }
    async runAll(context = {}) {
        const results = [];
        for (const [name, fn] of this.tests.entries()) {
            const start = Date.now();
            try {
                const ok = await Promise.resolve(fn(context));
                results.push({ name, success: !!ok, durationMs: Date.now() - start, timestamp: new Date() });
            } catch (e) {
                results.push({ name, success: false, error: e.message, durationMs: Date.now() - start, timestamp: new Date() });
            }
        }
        this.results = results;
        return results;
    }
    getResults() {
        return [...this.results];
    }
    clear() {
        this.tests.clear();
        this.results = [];
    }
}
const syntheticMonitoring = new SyntheticMonitoringHarness();
if (typeof window !== 'undefined') {
    window.syntheticMonitoring = syntheticMonitoring;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SyntheticMonitoringHarness;
}
