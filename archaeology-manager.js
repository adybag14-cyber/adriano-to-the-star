class ArchaeologyManager {
    constructor(game) {
        this.game = game;
        this.artifacts = [];
        this.excavationSites = [];
        this.worldStates = {};
        this.activeWorldKey = null;
        this.ruinMeshes = new Map();
        this.syncTimer = null;
    }

    init() {
        clearTimeout(this.syncTimer);
        this.syncTimer = setTimeout(() => this.syncWorld(), 650);
    }

    getWorldKey() {
        const systemId = String(this.game?.currentSystemId ?? 'kepler_186f');
        const body = this.game?.isOnMoon ? 'moon' : 'planet';
        const seed = Number.isFinite(Number(this.game?.currentWorldSeed)) ? Number(this.game.currentWorldSeed) : 12345;
        return `${systemId}:${body}:${seed}`;
    }

    hashNumber(value) {
        const text = String(value ?? '');
        let hash = 2166136261;
        for (let i = 0; i < text.length; i += 1) {
            hash ^= text.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }
        return hash >>> 0;
    }

    deterministicScore(worldKey, tileId) {
        return this.hashNumber(`${worldKey}:${tileId}`) / 0xffffffff;
    }

    createWorldState(worldKey) {
        const tiles = Array.isArray(this.game?.tiles) ? this.game.tiles : [];
        const eligible = tiles
            .filter((tile) => !tile?.building && (tile.type === 'mountain' || tile.type === 'plains'))
            .map((tile) => ({ tile, score: this.deterministicScore(worldKey, tile.id) }))
            .sort((a, b) => b.score - a.score);
        const mountainFirst = [
            ...eligible.filter((entry) => entry.tile.type === 'mountain'),
            ...eligible.filter((entry) => entry.tile.type !== 'mountain')
        ];
        const targetCount = Math.min(3, mountainFirst.length);
        const sites = mountainFirst.slice(0, targetCount).map(({ tile }, index) => ({
            id: `arch_${this.hashNumber(worldKey).toString(36)}_${tile.id}`,
            tileId: tile.id,
            status: 'unexplored',
            progress: 0,
            fragments: 0,
            revealed: [],
            discoveredAt: Number(this.game?.day || 1),
            sequence: index
        }));
        return {
            worldKey,
            systemId: String(this.game?.currentSystemId ?? 'kepler_186f'),
            isMoon: !!this.game?.isOnMoon,
            seed: Number(this.game?.currentWorldSeed || 12345),
            sites
        };
    }

    cleanupRuinMeshes() {
        this.ruinMeshes.forEach((mesh) => {
            if (mesh?.parent) mesh.parent.remove(mesh);
            mesh?.geometry?.dispose?.();
            if (Array.isArray(mesh?.material)) mesh.material.forEach((material) => material?.dispose?.());
            else mesh?.material?.dispose?.();
        });
        this.ruinMeshes.clear();
        this.game?.tiles?.forEach?.((tile) => { if (tile) tile.hasRuin = false; });
    }

    syncWorld() {
        if (!this.game?.planetMesh || !Array.isArray(this.game?.tiles) || this.game.tiles.length === 0) return false;
        const worldKey = this.getWorldKey();
        this.cleanupRuinMeshes();
        this.activeWorldKey = worldKey;
        if (!this.worldStates[worldKey]) this.worldStates[worldKey] = this.createWorldState(worldKey);
        const state = this.worldStates[worldKey];
        state.systemId = String(this.game.currentSystemId ?? state.systemId ?? 'kepler_186f');
        state.isMoon = !!this.game.isOnMoon;
        state.seed = Number(this.game.currentWorldSeed || state.seed || 12345);
        this.excavationSites = Array.isArray(state.sites) ? state.sites : [];
        this.excavationSites.forEach((site) => {
            const tile = this.game.tiles.find((entry) => Number(entry.id) === Number(site.tileId));
            if (!tile || tile.building || site.status === 'claimed') return;
            tile.hasRuin = true;
            this.createRuinMarker(tile, site);
        });
        this.updateOpenUI();
        return true;
    }

    createRuinMarker(tile, site) {
        if (!this.game?.planetMesh || !tile || !site) return null;
        const key = `${this.activeWorldKey}:${site.id}`;
        if (this.ruinMeshes.has(key)) return this.ruinMeshes.get(key);
        const surface = tile.position?.clone?.() || this.game.getTilePos(tile.id);
        if (!surface) return null;
        const geometry = new THREE.ConeGeometry(0.7, 3.2, 5);
        const material = new THREE.MeshStandardMaterial({
            color: 0x7c3aed,
            emissive: 0x4c1d95,
            emissiveIntensity: 0.85,
            roughness: 0.28,
            metalness: 0.35
        });
        const mesh = new THREE.Mesh(geometry, material);
        const normal = surface.clone().normalize();
        mesh.position.copy(normal.multiplyScalar(surface.length() + 2.15));
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), mesh.position.clone().normalize());
        mesh.userData = { isRuin: true, archaeologySiteId: site.id, archaeologyWorldKey: this.activeWorldKey, tileId: tile.id };
        mesh.renderOrder = 101;
        this.game.planetMesh.add(mesh);
        this.ruinMeshes.set(key, mesh);
        return mesh;
    }

    removeRuinMarker(site) {
        if (!site) return;
        const key = `${this.activeWorldKey}:${site.id}`;
        const mesh = this.ruinMeshes.get(key);
        if (mesh?.parent) mesh.parent.remove(mesh);
        mesh?.geometry?.dispose?.();
        if (Array.isArray(mesh?.material)) mesh.material.forEach((material) => material?.dispose?.());
        else mesh?.material?.dispose?.();
        this.ruinMeshes.delete(key);
        const tile = this.game?.tiles?.find?.((entry) => Number(entry.id) === Number(site.tileId));
        if (tile) tile.hasRuin = false;
    }

    handleTileClick(tile) {
        if (!tile?.hasRuin) return false;
        const site = this.excavationSites.find((entry) => Number(entry.tileId) === Number(tile.id) && entry.status !== 'claimed');
        if (!site) return false;
        this.openSite(site.id);
        return true;
    }

    ensureStyles() {
        if (document.getElementById('ep-archaeology-styles')) return;
        const style = document.createElement('style');
        style.id = 'ep-archaeology-styles';
        style.textContent = `
            .ep-archaeology-window { width:min(860px,92vw); height:min(700px,86vh); min-width:min(420px,92vw); overflow:hidden; }
            .ep-archaeology-body { padding:14px; overflow:auto; color:#e2e8f0; }
            .ep-arch-summary { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; margin-bottom:12px; }
            .ep-arch-stat { padding:9px; border:1px solid rgba(167,139,250,.22); border-radius:8px; background:rgba(30,27,75,.26); }
            .ep-arch-stat span { display:block; color:#8b8ca7; font-size:.61rem; text-transform:uppercase; letter-spacing:.08em; }
            .ep-arch-stat strong { display:block; margin-top:4px; color:#ddd6fe; font:700 .82rem Orbitron,sans-serif; }
            .ep-arch-grid { display:grid; grid-template-columns:minmax(0,1.25fr) minmax(220px,.75fr); gap:12px; min-height:0; }
            .ep-arch-card { padding:10px; border:1px solid rgba(139,92,246,.25); border-radius:8px; background:rgba(15,23,42,.72); }
            .ep-arch-card + .ep-arch-card { margin-top:8px; }
            .ep-arch-card-head { display:flex; justify-content:space-between; gap:8px; align-items:center; }
            .ep-arch-card h4 { margin:0; color:#e9d5ff; font-size:.78rem; }
            .ep-arch-card p { margin:5px 0 8px; color:#94a3b8; font-size:.68rem; }
            .ep-arch-progress { height:6px; overflow:hidden; border-radius:99px; background:#1e293b; }
            .ep-arch-progress i { display:block; height:100%; background:linear-gradient(90deg,#7c3aed,#c084fc); }
            .ep-arch-artifact { padding:9px; border:1px solid rgba(250,204,21,.2); border-radius:7px; background:rgba(66,32,6,.18); margin-bottom:7px; }
            .ep-arch-artifact strong { display:block; color:#fde68a; }
            .ep-arch-artifact span { color:#a8a29e; font-size:.64rem; }
            .ep-dig-layout { display:grid; grid-template-columns:minmax(280px,1fr) 220px; gap:14px; }
            .ep-dig-grid { display:grid; grid-template-columns:repeat(5,minmax(42px,1fr)); gap:6px; }
            .ep-dig-cell { aspect-ratio:1; min-height:44px; border:1px solid #57534e; border-radius:7px; background:linear-gradient(145deg,#78716c,#57534e); color:#f5f5f4; cursor:pointer; font-size:1.05rem; }
            .ep-dig-cell:hover:not(:disabled) { border-color:#c084fc; box-shadow:0 0 12px rgba(192,132,252,.18); }
            .ep-dig-cell.dug { cursor:default; }
            .ep-dig-cell.artifact { background:#6d28d9; border-color:#c4b5fd; }
            .ep-dig-cell.rock { background:#292524; color:#a8a29e; }
            .ep-dig-cell.dirt { background:#1c1917; color:#57534e; }
            .ep-dig-sidebar { padding:12px; border:1px solid rgba(139,92,246,.24); border-radius:9px; background:rgba(30,27,75,.22); }
            .ep-dig-sidebar h3 { margin:0 0 8px; color:#e9d5ff; }
            .ep-dig-sidebar p { color:#94a3b8; font-size:.69rem; line-height:1.5; }
            @media (max-width:680px) { .ep-arch-grid,.ep-dig-layout { grid-template-columns:1fr; } .ep-arch-summary { grid-template-columns:1fr 1fr; } .ep-dig-grid { grid-template-columns:repeat(5,minmax(38px,1fr)); } }
        `;
        document.head.appendChild(style);
    }

    ensureModal() {
        this.ensureStyles();
        let overlay = document.getElementById('ep-archaeology-modal');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'ep-archaeology-modal';
            overlay.className = 'ep-modal-overlay';
            overlay.style.display = 'none';
            overlay.innerHTML = `
                <div class="ep-modal ep-archaeology-window">
                    <div class="ep-modal-header">
                        <div><span class="ep-galaxy-kicker">SCIENCE DIVISION</span><h2 style="margin:2px 0 0;color:#e9d5ff;">Xeno-Archaeology</h2></div>
                        <button class="ep-sys-btn" data-arch-action="close">CLOSE</button>
                    </div>
                    <div class="ep-modal-body ep-archaeology-body" id="ep-archaeology-content"></div>
                </div>
            `;
            document.body.appendChild(overlay);
            overlay.addEventListener('click', (event) => {
                const button = event.target.closest('[data-arch-action]');
                if (!button) return;
                const action = button.dataset.archAction;
                if (action === 'close') overlay.style.display = 'none';
                if (action === 'catalog') this.renderUI();
                if (action === 'site') this.openSite(button.dataset.siteId);
                if (action === 'claim') this.claimRelic(button.dataset.siteId);
            });
        }
        return overlay;
    }

    openUI() {
        this.syncWorld();
        const overlay = this.ensureModal();
        overlay.style.display = 'flex';
        this.renderUI();
    }

    updateOpenUI() {
        const overlay = document.getElementById('ep-archaeology-modal');
        if (!overlay || getComputedStyle(overlay).display === 'none') return;
        this.renderUI();
    }

    renderUI() {
        const overlay = this.ensureModal();
        const content = overlay.querySelector('#ep-archaeology-content');
        if (!content) return;
        const sites = this.excavationSites || [];
        const active = sites.filter((site) => site.status !== 'claimed');
        const completed = sites.filter((site) => site.status === 'claimed');
        content.innerHTML = `
            <div class="ep-arch-summary">
                <div class="ep-arch-stat"><span>Detected Sites</span><strong>${sites.length}</strong></div>
                <div class="ep-arch-stat"><span>Active Digs</span><strong>${active.length}</strong></div>
                <div class="ep-arch-stat"><span>Recovered Relics</span><strong>${this.artifacts.length}</strong></div>
            </div>
            <div class="ep-arch-grid">
                <section>
                    ${sites.length ? sites.map((site) => `
                        <article class="ep-arch-card">
                            <div class="ep-arch-card-head"><h4>Site ${site.tileId}</h4><span>${site.status === 'claimed' ? 'RECOVERED' : `${Math.round(site.progress || 0)}%`}</span></div>
                            <p>${site.status === 'claimed' ? 'Excavation complete; marker archived.' : `${site.fragments || 0}/5 artifact fragments exposed · ${site.revealed?.length || 0}/25 cells surveyed`}</p>
                            <div class="ep-arch-progress"><i style="width:${Math.max(0, Math.min(100, Number(site.progress || 0)))}%"></i></div>
                            ${site.status !== 'claimed' ? `<button class="ep-sys-btn" style="margin-top:8px" data-arch-action="site" data-site-id="${site.id}">${site.progress >= 100 ? 'Review Relic' : 'Open Excavation'}</button>` : ''}
                        </article>
                    `).join('') : '<div class="ep-arch-card"><h4>No ruins detected</h4><p>This world has no viable excavation signatures.</p></div>'}
                </section>
                <aside>
                    <div class="ep-arch-card"><h4>Artifact Collection</h4><p>Recovered precursor material is catalogued permanently across worlds.</p></div>
                    ${this.artifacts.length ? this.artifacts.map((artifact) => `<div class="ep-arch-artifact"><strong>${artifact.name}</strong><span>${artifact.rarity} · ${artifact.originLabel}</span></div>`).join('') : '<div class="ep-arch-artifact"><strong>No recovered relics</strong><span>Complete an excavation to add to the collection.</span></div>'}
                </aside>
            </div>
            ${completed.length ? `<p style="color:#64748b;font-size:.62rem;margin-top:10px">${completed.length} archived site${completed.length === 1 ? '' : 's'} on this world.</p>` : ''}
        `;
    }

    openExcavationUI(tile) {
        const site = this.excavationSites.find((entry) => Number(entry.tileId) === Number(tile?.id));
        if (site) this.openSite(site.id);
    }

    openSite(siteId) {
        const site = this.excavationSites.find((entry) => entry.id === siteId);
        if (!site || site.status === 'claimed') return;
        const overlay = this.ensureModal();
        overlay.style.display = 'flex';
        this.renderDigSite(site);
    }

    getArtifactCellIndices(site) {
        const start = this.hashNumber(site.id) % 25;
        const indices = new Set();
        for (let i = 0; i < 5; i += 1) indices.add((start + i * 7) % 25);
        return indices;
    }

    getCellOutcome(site, index) {
        if (this.getArtifactCellIndices(site).has(Number(index))) return 'artifact';
        const score = this.hashNumber(`${site.id}:cell:${index}`) % 100;
        return score < 22 ? 'rock' : 'dirt';
    }

    renderDigSite(site) {
        const content = document.getElementById('ep-archaeology-content');
        if (!content) return;
        const revealed = new Map((site.revealed || []).map((entry) => [Number(entry.index), entry.outcome]));
        content.innerHTML = `
            <div class="ep-dig-layout">
                <section>
                    <div class="ep-dig-grid" id="ep-dig-grid">
                        ${Array.from({ length: 25 }, (_, index) => {
                            const outcome = revealed.get(index);
                            const icon = outcome === 'artifact' ? '✦' : (outcome === 'rock' ? '◆' : (outcome === 'dirt' ? '·' : ''));
                            return `<button class="ep-dig-cell ${outcome ? `dug ${outcome}` : ''}" data-dig-index="${index}" ${outcome || site.progress >= 100 ? 'disabled' : ''}>${icon}</button>`;
                        }).join('')}
                    </div>
                </section>
                <aside class="ep-dig-sidebar">
                    <span class="ep-galaxy-kicker">SITE ${site.tileId}</span>
                    <h3>${site.progress >= 100 ? 'Relic Exposed' : 'Layered Excavation'}</h3>
                    <p>Survey individual cells. Each cut costs 5 Energy. Five precursor fragments expose the sealed relic.</p>
                    <div class="ep-arch-progress"><i style="width:${Math.max(0, Math.min(100, Number(site.progress || 0)))}%"></i></div>
                    <p><strong style="color:#e9d5ff">${site.fragments || 0}/5 fragments</strong><br>${site.revealed?.length || 0}/25 cells surveyed</p>
                    ${site.progress >= 100 ? `<button class="ep-sys-btn" data-arch-action="claim" data-site-id="${site.id}" style="border-color:#fbbf24;color:#fde68a">CLAIM RELIC</button>` : ''}
                    <button class="ep-sys-btn" data-arch-action="catalog" style="margin-top:8px">BACK TO CATALOG</button>
                </aside>
            </div>
        `;
        content.querySelectorAll('[data-dig-index]').forEach((button) => {
            button.addEventListener('click', () => this.digCell(site, Number(button.dataset.digIndex)));
        });
    }

    digCell(site, index) {
        if (!site || site.status === 'claimed' || site.progress >= 100) return false;
        if (!Array.isArray(site.revealed)) site.revealed = [];
        if (site.revealed.some((entry) => Number(entry.index) === Number(index))) return false;
        if (Number(this.game?.resources?.energy || 0) < 5) {
            this.game.notify('Not enough Energy to excavate. 5 Energy required.', 'danger');
            return false;
        }
        this.game.resources.energy -= 5;
        const outcome = this.getCellOutcome(site, index);
        site.revealed.push({ index: Number(index), outcome });
        if (outcome === 'artifact') {
            site.fragments = Math.min(5, Number(site.fragments || 0) + 1);
            site.progress = Math.min(100, site.fragments * 20);
            this.game.notify(`Precursor fragment recovered (${site.fragments}/5).`, 'success');
        }
        site.status = site.progress >= 100 ? 'exposed' : 'digging';
        this.game.updateResourceUI?.();
        if (site.progress >= 100) {
            this.game.notify('Excavation complete. A sealed relic is exposed.', 'success');
            this.game.recordColonyEvent?.(`Xeno-archaeology site ${site.tileId} exposed a precursor relic.`, 0.75, 'success');
        }
        this.renderDigSite(site);
        return true;
    }

    createArtifact(site) {
        const catalog = [
            ['Precursor Memory Prism', 'Legendary'],
            ['Gravitic Survey Lens', 'Epic'],
            ['Xenolithic Star Map', 'Epic'],
            ['Ancient Bio-Key', 'Rare'],
            ['Phase-Locked Archive', 'Legendary']
        ];
        const pick = catalog[this.hashNumber(site.id) % catalog.length];
        return {
            id: `relic_${this.hashNumber(`${this.activeWorldKey}:${site.id}`).toString(36)}`,
            name: pick[0],
            rarity: pick[1],
            worldKey: this.activeWorldKey,
            tileId: site.tileId,
            originLabel: `${this.game?.getCurrentWorldLabel?.() || this.game?.currentSystemId || 'Unknown World'} · Site ${site.tileId}`,
            recoveredDay: Number(this.game?.day || 1)
        };
    }

    claimRelic(siteId) {
        const site = this.excavationSites.find((entry) => entry.id === siteId || Number(entry.tileId) === Number(siteId));
        if (!site || site.status === 'claimed' || Number(site.progress || 0) < 100) return false;
        const artifact = this.createArtifact(site);
        if (!this.artifacts.some((entry) => entry.id === artifact.id)) this.artifacts.unshift(artifact);
        site.status = 'claimed';
        site.claimedArtifactId = artifact.id;
        site.claimedDay = Number(this.game?.day || 1);
        this.removeRuinMarker(site);
        this.game.resources.data = Number(this.game.resources.data || 0) + 500;
        this.game.resources.minerals = Number(this.game.resources.minerals || 0) + 200;
        this.game.updateResourceUI?.();
        this.game.notify(`Relic catalogued: ${artifact.name}. +500 Data, +200 Minerals.`, 'success');
        this.game.recordColonyEvent?.(`Recovered ${artifact.name} from archaeological site ${site.tileId}.`, 0.9, 'success');
        this.renderUI();
        return artifact;
    }

    serialize() {
        return {
            version: 2,
            activeWorldKey: this.activeWorldKey,
            artifacts: this.artifacts.map((artifact) => ({ ...artifact })),
            worldStates: Object.fromEntries(Object.entries(this.worldStates).map(([key, state]) => [key, {
                ...state,
                sites: (state.sites || []).map((site) => ({
                    ...site,
                    revealed: Array.isArray(site.revealed) ? site.revealed.map((entry) => ({ index: Number(entry.index), outcome: entry.outcome })) : []
                }))
            }]))
        };
    }

    restore(raw) {
        if (!raw || typeof raw !== 'object') return false;
        this.artifacts = Array.isArray(raw.artifacts) ? raw.artifacts.map((artifact) => ({ ...artifact })) : [];
        this.worldStates = {};
        if (raw.worldStates && typeof raw.worldStates === 'object') {
            Object.entries(raw.worldStates).forEach(([key, state]) => {
                if (!state || typeof state !== 'object') return;
                this.worldStates[key] = {
                    ...state,
                    worldKey: state.worldKey || key,
                    sites: Array.isArray(state.sites) ? state.sites.map((site) => ({
                        ...site,
                        progress: Math.max(0, Math.min(100, Number(site.progress || 0))),
                        fragments: Math.max(0, Math.min(5, Number(site.fragments || 0))),
                        revealed: Array.isArray(site.revealed) ? site.revealed.map((entry) => ({ index: Number(entry.index), outcome: entry.outcome })) : []
                    })) : []
                };
            });
        }
        this.activeWorldKey = raw.activeWorldKey || null;
        return true;
    }
}

window.ArchaeologyManager = ArchaeologyManager;
