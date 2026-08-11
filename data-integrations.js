/**
 * Pioneer science-data integration.
 *
 * Runtime policy:
 * - The browser only reads same-origin build-cached data.
 * - External science APIs are refreshed by scripts/update-space-feeds.ps1 during Pages builds.
 * - No public CORS proxies and no browser-side API credentials are used.
 */
(function () {
    'use strict';

    const SNAPSHOT_URL = 'data/space-feeds.json';
    const FEEDS_CACHE_KEY = 'ep_space_feeds_snapshot_v2';
    const CACHE_TTL_MS = 1000 * 60 * 30;

    function isSameOriginUrl(url) {
        try {
            return new URL(url, document.baseURI).origin === window.location.origin;
        } catch (_) {
            return false;
        }
    }

    /**
     * Shared JSON helper retained for compatibility with older Pioneer modules.
     * Cross-origin runtime calls are rejected before a request is created, preventing
     * browser CORS errors and accidental reintroduction of public proxy chains.
     */
    async function fetchJSON(url, options = {}) {
        const target = new URL(url, document.baseURI);
        if (!isSameOriginUrl(target.href)) {
            throw new Error('Cross-origin runtime fetch disabled; use build-cached data instead.');
        }

        const response = await fetch(target.href, {
            ...options,
            credentials: 'same-origin'
        });
        if (!response.ok) {
            throw new Error(`Same-origin data request failed: HTTP ${response.status}`);
        }
        return response.json();
    }

    function loadCache() {
        try {
            const raw = localStorage.getItem(FEEDS_CACHE_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (!parsed || !parsed.expires || Date.now() > parsed.expires) return null;
            if (!parsed.payload || parsed.payload.schemaVersion !== 1 || !Array.isArray(parsed.payload.feeds)) return null;
            return parsed.payload;
        } catch (_) {
            return null;
        }
    }

    function saveCache(snapshot) {
        try {
            localStorage.setItem(FEEDS_CACHE_KEY, JSON.stringify({
                expires: Date.now() + CACHE_TTL_MS,
                payload: snapshot
            }));
        } catch (_) {
            // Storage is optional; the same-origin snapshot remains authoritative.
        }
    }

    function clearCache() {
        try {
            localStorage.removeItem(FEEDS_CACHE_KEY);
        } catch (_) {
            // Ignore storage restrictions.
        }
    }

    function validateSnapshot(snapshot) {
        if (!snapshot || snapshot.schemaVersion !== 1 || !Array.isArray(snapshot.feeds)) {
            throw new Error('Invalid space-feed snapshot schema.');
        }
        return snapshot;
    }

    async function loadSnapshot(forceRefresh = false) {
        if (!forceRefresh) {
            const cached = loadCache();
            if (cached) return cached;
        }

        const target = new URL(SNAPSHOT_URL, document.baseURI);
        if (forceRefresh) target.searchParams.set('reload', String(Date.now()));
        const snapshot = validateSnapshot(await fetchJSON(target.href, {
            cache: forceRefresh ? 'no-store' : 'default'
        }));
        saveCache(snapshot);
        return snapshot;
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function safeExternalUrl(value) {
        try {
            const url = new URL(String(value || ''));
            return (url.protocol === 'https:' || url.protocol === 'http:') ? url.href : '';
        } catch (_) {
            return '';
        }
    }

    function formatUpdatedAt(value) {
        const date = new Date(value);
        if (!Number.isFinite(date.getTime())) return 'build snapshot';
        try {
            return new Intl.DateTimeFormat(undefined, {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short'
            }).format(date);
        } catch (_) {
            return date.toISOString();
        }
    }

    function sourceSummary(snapshot) {
        const status = snapshot?.sourceStatus || {};
        const refreshed = Object.values(status).filter((value) => value === 'refreshed').length;
        const cached = Object.values(status).filter((value) => String(value).startsWith('cached') || value === 'fallback').length;
        if (refreshed && cached) return `${refreshed} refreshed · ${cached} cached`;
        if (refreshed) return `${refreshed} sources refreshed`;
        return 'cached science snapshot';
    }

    function getOrCreateFeedCard() {
        const container = document.getElementById('ep-data-body') || document.body;
        if (!container) return null;

        let card = document.getElementById('ep-live-feeds');
        if (!card) {
            card = document.createElement('div');
            card.id = 'ep-live-feeds';
            card.className = 'ep-card';
            card.style.marginTop = '0.5rem';
            container.appendChild(card);
        }
        return card;
    }

    function renderSnapshot(card, snapshot) {
        const feeds = snapshot.feeds.slice(0, 10);
        const updated = formatUpdatedAt(snapshot.generatedAt);
        const summary = sourceSummary(snapshot);

        if (!feeds.length) {
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                    <div>
                        <h4 style="margin:0; color:#ba944f;">Space Intelligence</h4>
                        <div style="color:#64748b; font-size:0.78rem; margin-top:3px;">Build-cached · ${escapeHtml(updated)}</div>
                    </div>
                    <button id="ep-live-refresh" type="button" class="ep-toggle">Reload</button>
                </div>
                <div style="color:#cbd5e1; font-size:0.9rem; margin-top:8px;">No cached feed entries are available.</div>
            `;
            return;
        }

        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px; margin-bottom:8px;">
                <div>
                    <h4 style="margin:0; color:#ba944f;">Space Intelligence</h4>
                    <div style="color:#64748b; font-size:0.76rem; margin-top:3px;">Build-cached · ${escapeHtml(updated)} · ${escapeHtml(summary)}</div>
                </div>
                <button id="ep-live-refresh" type="button" class="ep-toggle" title="Reload the latest snapshot deployed with this site">Reload</button>
            </div>
            <ul style="list-style:none; padding:0; margin:0; color:#e5e7eb; font-size:0.9rem; display:grid; gap:6px;">
                ${feeds.map((feed) => {
                    const link = safeExternalUrl(feed.link);
                    const source = feed.source ? `<span style="color:#64748b; font-size:0.72rem;">${escapeHtml(feed.source)}</span>` : '';
                    return `<li style="padding:7px; background:rgba(255,255,255,0.035); border:1px solid rgba(255,255,255,0.065); border-radius:7px;">
                        <div style="display:flex; justify-content:space-between; gap:8px; align-items:baseline;">
                            <div style="font-weight:600; color:#f5f5f5;">${escapeHtml(feed.title || 'Space update')}</div>
                            ${source}
                        </div>
                        <div style="font-size:0.82rem; line-height:1.35; color:#aebfd0; margin-top:2px;">${escapeHtml(feed.desc || '')}</div>
                        ${link ? `<a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer" style="color:#38bdf8; font-size:0.77rem;">Source ↗</a>` : ''}
                    </li>`;
                }).join('')}
            </ul>
        `;
    }

    async function renderLiveFeeds(options = {}) {
        const card = getOrCreateFeedCard();
        if (!card) return null;

        const forceRefresh = options.forceRefresh === true;
        card.setAttribute('aria-busy', 'true');
        card.innerHTML = `
            <h4 style="margin:0 0 6px 0; color:#ba944f;">Space Intelligence</h4>
            <div style="color:#94a3b8; font-size:0.88rem;">Loading build-cached science data…</div>
        `;

        try {
            const snapshot = await loadSnapshot(forceRefresh);
            renderSnapshot(card, snapshot);
            const reload = card.querySelector('#ep-live-refresh');
            if (reload) {
                reload.onclick = () => renderLiveFeeds({ forceRefresh: true });
            }
            return snapshot;
        } catch (_) {
            // A missing same-origin snapshot is a deployment/build issue, not a reason to
            // cascade into unreliable third-party browser requests.
            card.innerHTML = `
                <h4 style="margin:0 0 6px 0; color:#ba944f;">Space Intelligence</h4>
                <div style="color:#cbd5e1; font-size:0.88rem;">The deployed science snapshot is temporarily unavailable.</div>
            `;
            return null;
        } finally {
            card.setAttribute('aria-busy', 'false');
        }
    }

    window.renderLiveFeeds = renderLiveFeeds;
    window.epFetchJSON = fetchJSON;
    window.epClearSpaceFeedCache = clearCache;
})();
