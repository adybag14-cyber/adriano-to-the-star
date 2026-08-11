/**
 * AI Habitability / Discovery Predictions (lightweight, client-only)
 * Computes a simple habitability score and surfaces a "discovery likelihood" hint
 * based on basic planet attributes present in planetDatabase/current planet.
 */
(function () {
    function scoreHabitability(planet) {
        if (!planet) return { score: 0, reasons: ['No data'] };
        const radius = Number(planet.radius || planet.koi_prad || planet.prad);
        const mass = Number(planet.mass || planet.koi_smass);
        const teq = Number(planet.koi_teq || planet.temperature || planet.teq);
        const distance = Number(planet.koi_dist || planet.distance);
        const insolation = Number(planet.insolation || planet.koi_insol);
        const starType = (planet.host_star || planet.stellar_type || planet.koi_sptype || '').toLowerCase();
        const gravity = (mass && radius) ? (mass / (radius * radius)) : null;
        const metal = Number(planet.metallicity || planet.stellar_metallicity || planet.koi_smet);

        let score = 0;
        const reasons = [];

        if (radius && radius > 0) {
            if (radius >= 0.8 && radius <= 1.6) { score += 30; reasons.push('Radius near Earth'); }
            else if (radius <= 2.5) { score += 15; reasons.push('Radius small/rocky'); }
            else reasons.push('Large radius (likely non-terrestrial)');
        } else reasons.push('Missing radius');

        if (mass && mass > 0) {
            if (mass >= 0.5 && mass <= 5) { score += 25; reasons.push('Mass near Earth/Super-Earth'); }
            else if (mass <= 10) { score += 10; reasons.push('Mass moderate'); }
            else reasons.push('High mass');
        } else reasons.push('Missing mass');

        if (gravity && gravity > 0) {
            if (gravity >= 0.6 && gravity <= 1.4) { score += 10; reasons.push('Surface gravity in comfortable band'); }
            else reasons.push('Challenging gravity');
        }

        if (teq && teq > 0) {
            if (teq >= 240 && teq <= 320) { score += 25; reasons.push('Teq in temperate range'); }
            else if (teq >= 150 && teq <= 400) { score += 15; reasons.push('Teq moderately temperate'); }
            else reasons.push('Teq outside comfort range');
        } else reasons.push('Missing temperature');

        if (insolation && insolation > 0) {
            if (insolation >= 0.25 && insolation <= 1.6) { score += 15; reasons.push('Insolation in habitable zone band'); }
            else reasons.push('Insolation outside HZ band');
        } else {
            reasons.push('Missing insolation');
        }

        if (distance && distance > 0) {
            if (distance <= 200) { score += 10; reasons.push('Within 200 ly (reachable)'); }
            else if (distance <= 1000) { score += 5; reasons.push('Within 1000 ly'); }
            else reasons.push('Very distant');
        }

        if (starType) {
            if (starType.startsWith('g') || starType.startsWith('k')) {
                score += 5; reasons.push('Host star type G/K (stable main sequence)');
            } else if (starType.startsWith('m')) {
                reasons.push('M-dwarf host (flare risk)');
            }
        }

        if (!Number.isNaN(metal)) {
            if (metal >= -0.2 && metal <= 0.4) {
                score += 5; reasons.push('Metallicity in favorable band');
            } else {
                reasons.push('Metallicity outside optimal band');
            }
        }

        score = Math.max(0, Math.min(100, score));
        return { score, reasons };
    }

    function predictDiscovery(planet) {
        // Simple heuristic: smaller radius + nearer distance => higher likelihood
        if (!planet) return { likelihood: 'Unknown', detail: 'No data' };
        const radius = Number(planet.radius || planet.koi_prad || planet.prad);
        const distance = Number(planet.koi_dist || planet.distance);
        const insolation = Number(planet.insolation || planet.koi_insol);
        let pts = 0;
        if (radius && radius < 3) pts += 20;
        if (radius && radius < 1.6) pts += 20;
        if (distance && distance < 200) pts += 30;
        else if (distance && distance < 1000) pts += 15;
        if (insolation && insolation >= 0.25 && insolation <= 1.6) pts += 10;
        const likelihood = pts >= 50 ? 'High' : pts >= 25 ? 'Medium' : 'Low';
        return { likelihood, detail: `Heuristic ${pts} pts` };
    }

    function getCurrentPlanet() {
        const game = window.game;
        if (!game) return null;

        const direct = game.currentPlanet || game.latestPlanetData || game.planet || game.planetData || null;
        if (!direct) return null;

        const directName = String(direct.kepler_name || direct.kepoi_name || direct.pl_name || direct.name || direct.kepid || '').toLowerCase();
        const database = Array.isArray(window.planetDatabase) ? window.planetDatabase : [];
        const databaseMatch = directName ? database.find((candidate) => {
            const candidateName = String(candidate?.kepler_name || candidate?.kepoi_name || candidate?.pl_name || candidate?.name || candidate?.kepid || '').toLowerCase();
            return candidateName === directName;
        }) : null;

        return databaseMatch ? { ...databaseMatch, ...direct } : direct;
    }

    function renderHabitabilityCard() {
        const container = document.getElementById('data-search-container') || document.getElementById('ep-data-body');
        if (!container) return;
        let card = document.getElementById('ai-habitability-card');
        if (!card) {
            card = document.createElement('div');
            card.id = 'ai-habitability-card';
            card.className = 'ep-card';
            card.style.marginTop = '0.5rem';
            container.parentElement?.insertBefore(card, container);
        }

        const planet = getCurrentPlanet();
        const score = scoreHabitability(planet);
        const pred = predictDiscovery(planet);
        const name = planet ? (planet.kepler_name || planet.kepoi_name || planet.pl_name || planet.name || planet.kepid || 'Unknown') : 'Unknown';
        const reasonTags = score.reasons.map(r => `<span style="display:inline-block;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);padding:2px 6px;border-radius:6px;margin:2px;font-size:0.8rem;color:#e2e8f0;">${r}</span>`).join('');

        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">
                <h4 style="color:#ba944f; margin:0;">AI Habitability</h4>
                <button id="ai-hab-refresh" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:4px 8px;border-radius:6px;cursor:pointer;">Refresh</button>
            </div>
            <div style="color:#e5e7eb; font-size:0.95rem;">
                <div style="margin-bottom:6px;"><strong>Planet:</strong> ${name}</div>
                <div style="margin-bottom:6px;"><strong>Habitability Score:</strong> ${score.score}/100</div>
                <div style="margin-bottom:6px;"><strong>Discovery Likelihood:</strong> ${pred.likelihood} <span style="font-size:0.85em; color:#94a3b8;">${pred.detail}</span></div>
                <div style="margin:6px 0; display:flex; flex-wrap:wrap; gap:4px;">
                    ${reasonTags}
                </div>
            </div>
        `;

        const btn = document.getElementById('ai-hab-refresh');
        if (btn) btn.onclick = renderHabitabilityCard;
    }

    window.renderHabitabilityCard = renderHabitabilityCard;
})();
