/** Parses the same-origin Kepler JSONL snapshot away from the UI thread. */
self.addEventListener('message', async event => {
  if (event.data?.type !== 'analyse') return;
  try {
    const response = await fetch(event.data.url, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`Catalogue returned HTTP ${response.status}`);
    const decoder = new TextDecoder();
    const reader = response.body?.getReader();
    let remainder = '';
    const stats = {
      rows: 0,
      confirmed: 0,
      candidates: 0,
      falsePositives: 0,
      other: 0,
      named: 0,
      uniqueSystems: new Set(),
      scoreBins: [0, 0, 0, 0, 0]
    };
    const consume = line => {
      if (!line.trim()) return;
      const row = JSON.parse(line);
      stats.rows += 1;
      if (row.kepid != null) stats.uniqueSystems.add(String(row.kepid));
      if (row.kepler_name) stats.named += 1;
      const status = String(row.status || '').toLowerCase();
      if (status.includes('confirmed')) stats.confirmed += 1;
      else if (status.includes('candidate')) stats.candidates += 1;
      else if (status.includes('false')) stats.falsePositives += 1;
      else stats.other += 1;
      const score = Number(row.score);
      if (Number.isFinite(score)) stats.scoreBins[Math.min(4, Math.max(0, Math.floor(score * 5)))] += 1;
    };
    if (reader) {
      while (true) {
        const { value, done } = await reader.read();
        remainder += decoder.decode(value || new Uint8Array(), { stream: !done });
        const lines = remainder.split(/\r?\n/);
        remainder = lines.pop() || '';
        lines.forEach(consume);
        if (done) break;
      }
      consume(remainder);
    } else {
      (await response.text()).split(/\r?\n/).forEach(consume);
    }
    self.postMessage({ type: 'result', stats: { ...stats, uniqueSystems: stats.uniqueSystems.size } });
  } catch (error) {
    self.postMessage({ type: 'error', message: error?.message || String(error) });
  }
});
