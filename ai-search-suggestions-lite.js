/**
 * AI Search Suggestions (lightweight, client-only)
 * Surfaces quick planet queries based on available planetDatabase (if loaded) or static fallbacks.
 */
(function () {
    function pickRandom(arr, count) {
        const copy = Array.isArray(arr) ? [...arr] : [];
        const out = [];
        while (copy.length && out.length < count) {
            const idx = Math.floor(Math.random() * copy.length);
            out.push(copy.splice(idx, 1)[0]);
        }
        return out;
    }

    function renderAiSearchSuggestions() {
        const container = document.getElementById('data-search-container') || document.getElementById('ai-search-suggestions');
        if (!container) return;

        let mount = document.getElementById('ai-search-suggestions');
        if (!mount) {
            mount = document.createElement('div');
            mount.id = 'ai-search-suggestions';
            mount.className = 'ep-card';
            mount.style.marginTop = '0.5rem';
            container.parentElement?.insertBefore(mount, container.nextSibling);
        }

        const planets = (window.planetDatabase && Array.isArray(window.planetDatabase)) ? window.planetDatabase : null;
        const picks = planets ? pickRandom(planets.map(p => p.kepler_name || p.kepoi_name || p.pl_name || p.kepid || 'Unknown'), 3) : [];

        const suggestions = picks.length ? picks.map(name => `Find Earth-like around ${name}`) : [
            'Show habitable-zone terrestrials',
            'Find gas giants within 200 ly',
            'List high-temperature ultra-short-period planets'
        ];

        mount.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem;">
                <h4 style="color:#ba944f; margin:0;">AI Search Suggestions</h4>
                <button id="ai-suggest-refresh" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:4px 8px;border-radius:6px;cursor:pointer;">Refresh</button>
            </div>
            <ul style="list-style:none; padding:0; margin:0; color:#e5e7eb; font-size:0.95rem;">
                ${suggestions.map(s => `<li style="padding:4px 0;">• ${s}</li>`).join('')}
            </ul>
        `;

        const btn = document.getElementById('ai-suggest-refresh');
        if (btn) {
            btn.onclick = () => {
                mount.remove();
                renderAiSearchSuggestions();
            };
        }
    }

    window.renderAiSearchSuggestions = renderAiSearchSuggestions;
})();
