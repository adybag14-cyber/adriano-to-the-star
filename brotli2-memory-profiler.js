/** UI controller for the bounded Brotli2 worker experiment. */
(function () {
  'use strict';
  class Brotli2MemoryProfiler {
    constructor() {
      this.worker = null;
      this.timeout = 0;
      this.results = [];
      this.runButton = document.getElementById('run-memory-profile');
      this.cancelButton = document.getElementById('cancel-memory-profile');
      this.exportButton = document.getElementById('export-memory-profile');
    }
    init() {
      this.runButton.addEventListener('click', () => this.run());
      this.cancelButton.addEventListener('click', () => this.cancel('Run cancelled.'));
      this.exportButton.addEventListener('click', () => this.export());
    }
    async memorySnapshot() {
      if (typeof performance.measureUserAgentSpecificMemory === 'function' && crossOriginIsolated) {
        try {
          const result = await performance.measureUserAgentSpecificMemory();
          return { source: 'measureUserAgentSpecificMemory', bytes: result.bytes };
        } catch {}
      }
      if (performance.memory?.usedJSHeapSize) return { source: 'performance.memory', bytes: performance.memory.usedJSHeapSize };
      return { source: 'unavailable', bytes: null, deviceMemoryGiB: navigator.deviceMemory || null };
    }
    async run() {
      this.cancel();
      this.results = [];
      this.setRunning(true);
      this.setStatus('Starting disposable worker…', 'running');
      const before = await this.memorySnapshot();
      const workerUrl = new URL('brotli2-memory-worker.js', document.currentScript?.src || location.href);
      this.worker = new Worker(workerUrl);
      this.worker.addEventListener('message', async event => {
        const message = event.data || {};
        if (message.type === 'progress') {
          this.setStatus(`Completed ${message.completed} of ${message.total}: ${message.name}`, 'running');
          return;
        }
        if (message.type === 'result') {
          clearTimeout(this.timeout);
          this.results = message.results || [];
          const after = await this.memorySnapshot();
          this.render(before, after);
          this.worker.terminate();
          this.worker = null;
          this.setRunning(false);
          this.setStatus(`Complete: ${this.results.length} bounded cases.`, 'complete');
          return;
        }
        if (message.type === 'error') this.fail(message.message, message.results);
      });
      this.worker.addEventListener('error', event => this.fail(event.message || 'Worker failed.'));
      this.worker.postMessage({ type: 'run', maximum: Number(document.getElementById('profile-size').value) });
      this.timeout = setTimeout(() => this.cancel('Circuit breaker stopped the worker after eight seconds.'), 8000);
    }
    fail(message, partial = []) {
      this.results = partial;
      this.render({ source: 'unavailable', bytes: null }, { source: 'unavailable', bytes: null });
      this.cancel(`Experiment stopped: ${message}`, true);
    }
    cancel(message = '', error = false) {
      clearTimeout(this.timeout);
      if (this.worker) this.worker.terminate();
      this.worker = null;
      this.setRunning(false);
      if (message) this.setStatus(message, error ? 'error' : 'warning');
    }
    setRunning(running) {
      this.runButton.disabled = running;
      this.cancelButton.disabled = !running;
      this.exportButton.disabled = running || !this.results.length;
    }
    setStatus(message, state = '') {
      const target = document.getElementById('status');
      target.textContent = message;
      target.className = `status ${state}`.trim();
    }
    render(before, after) {
      const target = document.getElementById('profile-results');
      target.replaceChildren();
      if (!this.results.length) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 7;
        cell.textContent = 'No completed cases.';
        row.append(cell);
        target.append(row);
      }
      this.results.forEach(result => {
        const row = document.createElement('tr');
        [result.name, this.bytes(result.inputBytes), this.bytes(result.outputBytes), `${result.ratio.toFixed(2)}×`, `${result.compressionMs.toFixed(1)} ms`, `${result.decompressionMs.toFixed(1)} ms`, result.verified ? 'Verified' : 'Failed'].forEach(value => {
          const cell = document.createElement('td');
          cell.textContent = value;
          row.append(cell);
        });
        target.append(row);
      });
      const measuredDelta = before.bytes != null && after.bytes != null ? after.bytes - before.bytes : null;
      const estimatedPeak = Math.max(0, ...this.results.map(result => result.estimatedLiveBufferBytes || 0));
      document.getElementById('profile-diagnostics').textContent = [
        `Heap API: ${after.source}`,
        measuredDelta == null ? 'Measured heap delta: unavailable in this context' : `Measured heap delta: ${this.bytes(measuredDelta)}`,
        `Largest explicit live-buffer estimate: ${this.bytes(estimatedPeak)}`,
        `Device memory hint: ${after.deviceMemoryGiB ? `${after.deviceMemoryGiB} GiB` : 'unavailable'}`,
        'Interpretation: garbage collection and engine allocation strategies make heap deltas noisy. Buffer estimates are not total process memory.'
      ].join('\n');
    }
    bytes(value) {
      const sign = value < 0 ? '-' : '';
      let bytes = Math.abs(Number(value) || 0);
      const units = ['B', 'KB', 'MB', 'GB'];
      let index = 0;
      while (bytes >= 1024 && index < units.length - 1) { bytes /= 1024; index += 1; }
      return `${sign}${bytes.toFixed(index ? 1 : 0)} ${units[index]}`;
    }
    export() {
      const payload = { schema: 'ita-brotli2-bounded-profile', generatedAt: new Date().toISOString(), results: this.results };
      const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = Object.assign(document.createElement('a'), { href: url, download: 'brotli2-bounded-profile.json' });
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      this.setStatus('Profile JSON exported.', 'complete');
    }
  }
  const init = () => {
    const profiler = new Brotli2MemoryProfiler();
    profiler.init();
    window.brotli2MemoryProfiler = profiler;
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
