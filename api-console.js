/** Same-origin catalogue query console; no network API backend. */
(function () {
  'use strict';
  let worker;
  const queryInput = document.getElementById('api-console-query');
  const sendButton = document.getElementById('api-console-send');
  const output = document.getElementById('api-console-output');
  const start = () => {
    if (worker) return worker;
    const base = document.currentScript?.src || location.href;
    worker = new Worker(new URL('api-catalog-worker.js', base));
    worker.addEventListener('message', event => {
      sendButton.disabled = false;
      const message = event.data || {};
      if (message.type === 'result') {
        output.style.color = '#86efac';
        output.textContent = JSON.stringify({
          interface: 'same-origin-static-snapshot',
          query: message.query,
          catalogueRows: message.totalRows,
          returned: message.returned,
          truncated: message.truncated,
          data: message.data
        }, null, 2);
      } else {
        output.style.color = '#fca5a5';
        output.textContent = `Query failed: ${message.message}`;
      }
    });
    worker.addEventListener('error', event => {
      sendButton.disabled = false;
      output.style.color = '#fca5a5';
      output.textContent = `Worker failed: ${event.message}`;
      worker.terminate();
      worker = null;
    });
    return worker;
  };
  const search = () => {
    const query = queryInput.value.trim();
    if (query.length < 2) {
      output.style.color = '#fca5a5';
      output.textContent = 'Enter at least two characters.';
      queryInput.focus();
      return;
    }
    sendButton.disabled = true;
    output.style.color = '#c4f1ff';
    output.textContent = 'Loading and searching the same-origin Kepler snapshot…';
    start().postMessage({ type: 'search', query, url: new URL('data/exoplanets.jsonl', document.currentScript?.src || location.href).href });
  };
  sendButton?.addEventListener('click', search);
  queryInput?.addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); search(); }
  });
  addEventListener('pagehide', () => worker?.terminate());
})();
