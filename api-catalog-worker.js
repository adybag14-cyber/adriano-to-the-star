/** Lazy same-origin JSONL search worker for api.html. */
let rows = null;
async function load(url) {
  if (rows) return rows;
  const response = await fetch(url, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`Catalogue returned HTTP ${response.status}`);
  const text = await response.text();
  rows = text.split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line));
  return rows;
}
self.addEventListener('message', async event => {
  if (event.data?.type !== 'search') return;
  try {
    const catalogue = await load(event.data.url);
    const query = String(event.data.query || '').trim().toLocaleLowerCase();
    const matches = catalogue.filter(row => [row.kepler_name, row.kepoi_name, row.kepid, row.status]
      .some(value => String(value ?? '').toLocaleLowerCase().includes(query))).slice(0, 50);
    self.postMessage({ type: 'result', query, totalRows: catalogue.length, returned: matches.length, truncated: matches.length === 50, data: matches });
  } catch (error) {
    self.postMessage({ type: 'error', message: error?.message || String(error) });
  }
});
