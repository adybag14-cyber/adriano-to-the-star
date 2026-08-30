/** Kepler snapshot analytics plus honest browser-local activity. */
(function () {
  'use strict';
  const readClaims = () => {
    try {
      const value = JSON.parse(localStorage.getItem('planet-claims') || '[]');
      return Array.isArray(value) ? value : [];
    } catch { return []; }
  };

  class PlanetStatisticsDashboard {
    constructor() {
      this.container = document.getElementById('planet-statistics-dashboard');
      this.stats = null;
      this.worker = null;
    }

    init() {
      this.renderLoading();
      this.load();
    }

    load() {
      this.worker?.terminate();
      if (!('Worker' in window)) {
        this.renderError('This browser cannot run the off-main-thread catalogue analyser. Use the searchable database page instead.');
        return;
      }
      const workerUrl = new URL('data-analytics-worker.js', document.currentScript?.src || location.href);
      const dataUrl = new URL('data/exoplanets.jsonl', document.currentScript?.src || location.href);
      this.worker = new Worker(workerUrl);
      this.worker.addEventListener('message', event => {
        if (event.data?.type === 'result') {
          this.stats = event.data.stats;
          this.render();
          this.worker.terminate();
        } else if (event.data?.type === 'error') {
          this.renderError(event.data.message);
          this.worker.terminate();
        }
      });
      this.worker.addEventListener('error', event => this.renderError(event.message || 'Catalogue worker failed.'));
      this.worker.postMessage({ type: 'analyse', url: dataUrl.href });
    }

    renderLoading() {
      this.container.innerHTML = '<section class="database-analytics-panel" aria-busy="true"><p class="analytics-kicker">SAME-ORIGIN DATA PIPELINE</p><h2>Analysing the Kepler snapshot…</h2><p>The 9,500+ JSONL records are parsed in a dedicated worker so scrolling and controls stay responsive.</p></section>';
    }

    renderError(message) {
      this.container.replaceChildren();
      const panel = document.createElement('section');
      panel.className = 'database-analytics-panel analytics-error';
      const title = document.createElement('h2');
      title.textContent = 'Catalogue analytics unavailable';
      const details = document.createElement('p');
      details.textContent = message;
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.textContent = 'Retry analysis';
      retry.addEventListener('click', () => { this.renderLoading(); this.load(); });
      panel.append(title, details, retry);
      this.container.append(panel);
    }

    render() {
      const stats = this.stats;
      const claims = readClaims();
      const activeClaims = claims.filter(item => item.status === 'active' || item.confirmed).length;
      this.container.innerHTML = `<section class="database-analytics-panel"><header class="database-analytics-heading"><div><p class="analytics-kicker">KEPLER CATALOGUE SNAPSHOT</p><h2>Catalogue signal overview</h2><p>Counts come from the same-origin <code>data/exoplanets.jsonl</code> release asset. Local claim cards are calculated separately and never presented as site-wide activity.</p></div><div class="database-analytics-actions"><button id="analytics-reload" type="button">Reanalyse</button><button id="analytics-export" type="button">Export summary</button></div></header><div class="database-stat-grid"><article><span>Catalogue rows</span><strong>${stats.rows.toLocaleString()}</strong><small>${stats.uniqueSystems.toLocaleString()} unique KEPIDs</small></article><article><span>Confirmed planets</span><strong>${stats.confirmed.toLocaleString()}</strong><small>${(stats.confirmed / stats.rows * 100).toFixed(1)}% of rows</small></article><article><span>Candidate rows</span><strong>${stats.candidates.toLocaleString()}</strong><small>Catalogue classification</small></article><article><span>Named Kepler worlds</span><strong>${stats.named.toLocaleString()}</strong><small>Rows with Kepler names</small></article><article><span>Local claims</span><strong>${claims.length.toLocaleString()}</strong><small>${activeClaims} active in this browser</small></article></div><div class="database-chart-grid"><section tabindex="0" role="region" aria-label="Scrollable catalogue classification chart"><h3>Catalogue classification</h3><canvas id="classification-chart" width="720" height="340" role="img" aria-label="Bar chart of confirmed, candidate, false-positive, and other catalogue rows"></canvas></section><section tabindex="0" role="region" aria-label="Scrollable disposition score chart"><h3>Disposition score distribution</h3><canvas id="score-chart" width="720" height="340" role="img" aria-label="Bar chart of catalogue score bins from zero to one"></canvas></section></div><footer class="database-analytics-source"><p><strong>Source boundary:</strong> this page makes no runtime request to a database backend and reports no global users, revenue, or transactions.</p><a href="database.html">Search the full local catalogue</a></footer><p id="database-analytics-status" role="status" aria-live="polite">Analysis complete.</p></section>`;
      this.drawChart('classification-chart', ['Confirmed', 'Candidate', 'False positive', 'Other'], [stats.confirmed, stats.candidates, stats.falsePositives, stats.other]);
      this.drawChart('score-chart', ['0–.2', '.2–.4', '.4–.6', '.6–.8', '.8–1'], stats.scoreBins);
      document.getElementById('analytics-reload').addEventListener('click', () => { this.renderLoading(); this.load(); });
      document.getElementById('analytics-export').addEventListener('click', () => this.export({ catalogue: stats, browserLocal: { claims: claims.length, activeClaims }, generatedAt: new Date().toISOString() }));
    }

    drawChart(id, labels, values) {
      const canvas = document.getElementById(id);
      const context = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      const margin = { top: 32, right: 24, bottom: 70, left: 76 };
      const max = Math.max(1, ...values);
      context.clearRect(0, 0, width, height);
      context.strokeStyle = 'rgba(148, 163, 184, .45)';
      context.fillStyle = '#cbd5e1';
      context.font = '16px system-ui';
      context.textAlign = 'right';
      for (let step = 0; step <= 4; step += 1) {
        const y = margin.top + (height - margin.top - margin.bottom) * (1 - step / 4);
        context.beginPath();
        context.moveTo(margin.left, y);
        context.lineTo(width - margin.right, y);
        context.stroke();
        context.fillText(Math.round(max * step / 4).toLocaleString(), margin.left - 10, y + 5);
      }
      const plotWidth = width - margin.left - margin.right;
      const slot = plotWidth / values.length;
      values.forEach((value, index) => {
        const barHeight = (height - margin.top - margin.bottom) * value / max;
        const x = margin.left + index * slot + slot * .16;
        const y = height - margin.bottom - barHeight;
        const gradient = context.createLinearGradient(0, y, 0, height - margin.bottom);
        gradient.addColorStop(0, '#67e8f9');
        gradient.addColorStop(1, '#8b5cf6');
        context.fillStyle = gradient;
        context.fillRect(x, y, slot * .68, barHeight);
        context.fillStyle = '#f8fafc';
        context.textAlign = 'center';
        context.fillText(value.toLocaleString(), x + slot * .34, Math.max(20, y - 9));
        context.fillStyle = '#cbd5e1';
        context.fillText(labels[index], x + slot * .34, height - margin.bottom + 28, slot * .9);
      });
    }

    export(payload) {
      const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = Object.assign(document.createElement('a'), { href: url, download: 'kepler-analytics-summary.json' });
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      document.getElementById('database-analytics-status').textContent = 'Summary exported.';
    }
  }

  const init = () => {
    const dashboard = new PlanetStatisticsDashboard();
    dashboard.init();
    window.planetStatisticsDashboard = dashboard;
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
