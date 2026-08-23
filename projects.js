(() => {
  'use strict';
  const capabilities = {
    webgpu: () => Boolean(navigator.gpu),
    webxr: () => Boolean(navigator.xr),
    webrtc: () => Boolean(window.RTCPeerConnection && window.BroadcastChannel),
    filesystem: () => Boolean(window.showOpenFilePicker && window.showSaveFilePicker),
    webserial: () => Boolean(navigator.serial)
  };

  function checkCapabilities() {
    let supported = 0;
    for (const [name, check] of Object.entries(capabilities)) {
      const ready = check();
      supported += Number(ready);
      const item = document.querySelector(`[data-capability="${name}"]`);
      if (item) {
        item.classList.toggle('is-ready', ready);
        item.classList.toggle('is-limited', !ready);
        const label = item.querySelector('b');
        if (label) label.textContent = ready ? 'Available' : 'Unavailable';
      }
      document.querySelectorAll(`[data-requires="${name}"]`).forEach(card => {
        const label = card.querySelector('[data-requirement-label]');
        if (label) {
          label.classList.toggle('is-ready', ready);
          label.title = ready ? `${name} is exposed by this browser` : `${name} is not exposed by this browser`;
        }
      });
    }
    const summary = document.getElementById('readiness-summary');
    if (summary) summary.textContent = `${supported} / ${Object.keys(capabilities).length} available`;
  }

  function setupCatalog() {
    const search = document.getElementById('project-search');
    const chips = [...document.querySelectorAll('[data-filter]')];
    const cards = [...document.querySelectorAll('.project-card')];
    const count = document.getElementById('project-result-count');
    const empty = document.getElementById('project-empty');
    let category = 'all';
    const apply = () => {
      const query = search?.value.trim().toLocaleLowerCase() || '';
      let visible = 0;
      cards.forEach(card => {
        const matches = (category === 'all' || card.dataset.category === category) && (!query || `${card.dataset.search || ''} ${card.textContent}`.toLocaleLowerCase().includes(query));
        card.hidden = !matches;
        visible += Number(matches);
      });
      if (count) count.textContent = visible === cards.length ? `Showing all ${cards.length} projects` : `Showing ${visible} of ${cards.length} projects`;
      if (empty) empty.hidden = visible !== 0;
    };
    search?.addEventListener('input', apply);
    chips.forEach(chip => chip.addEventListener('click', () => {
      category = chip.dataset.filter;
      chips.forEach(option => { const active = option === chip; option.classList.toggle('is-active', active); option.setAttribute('aria-pressed', String(active)); });
      apply();
    }));
    apply();
  }
  const boot = () => { checkCapabilities(); setupCatalog(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})();
