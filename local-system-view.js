(() => {
'use strict';

const KEPLER_186_SYSTEM = Object.freeze({
    id: 'kepler_186', name: 'Kepler-186', type: 'M dwarf', radiusSolar: 0.52,
    temperatureK: 3881, distanceLy: 580,
    provenance: 'NASA Exoplanet Archive / NASA Kepler mission',
    note: 'Five confirmed transiting planets are shown. No moons are currently confirmed in the catalog.',
    planets: [
        { id:'kepler_186b', name:'Kepler-186b', periodDays:3.89, semiMajorAxisAU:0.0371, radiusEarth:1.07, discoveryYear:2014, color:'#f59e0b', heat:'Hot inner world' },
        { id:'kepler_186c', name:'Kepler-186c', periodDays:7.27, semiMajorAxisAU:0.0564, radiusEarth:1.25, discoveryYear:2014, color:'#fb923c', heat:'Warm inner world' },
        { id:'kepler_186d', name:'Kepler-186d', periodDays:13.34, semiMajorAxisAU:0.0845, radiusEarth:1.40, discoveryYear:2014, color:'#f97316', heat:'Warm rocky world' },
        { id:'kepler_186e', name:'Kepler-186e', periodDays:22.41, semiMajorAxisAU:0.1194, radiusEarth:1.27, discoveryYear:2014, color:'#eab308', heat:'Temperate-side inner world' },
        { id:'kepler_186f', name:'Kepler-186f', periodDays:129.94, semiMajorAxisAU:0.3855, radiusEarth:1.17, discoveryYear:2014, color:'#38bdf8', heat:'Habitable-zone colony world', colony:true }
    ]
});

const escapeLocalText = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

class LocalSystemExplorer {
    constructor(game) {
        this.game=game; this.system=KEPLER_186_SYSTEM; this.records={}; this.reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches===true;
        this.state={ selectedBodyId:'kepler_186f', activeBodyId:'kepler_186f', surveyed:{kepler_186f:true}, visited:{kepler_186f:true}, surveyLog:[] };
        this.modal=null; this.canvas=null; this.ctx=null; this.zoom=1; this.pan={x:0,y:0}; this.drag=null; this.hitRegions=[]; this.animationFrame=0;
    }


    generateSystem(star) {
        if (!star || star.home || star.id === 'star_0,0_0' || /^kepler_186/.test(star.id)) return KEPLER_186_SYSTEM;
        const types = ['lava', 'desert', 'planet', 'ocean', 'ice'];
        const colors = ['#f99680', '#d4b590', '#79c4b6', '#65a4ed', '#b9def2'];
        const count = Math.max(2, Math.min(11, Number(star.planetCount) || 5));
        const planets = Array.from({ length: count }, (_, index) => {
            let seed = index ? Math.imul((star.seed >>> 0) ^ (index + 1), 0x45d9f3b) >>> 0 : star.seed;
            if (index) seed = Math.imul(seed ^ (seed >>> 16), 0x45d9f3b) >>> 0;
            const semiMajorAxisAU = 0.09 * 1.72 ** index;
            const worldType = index === 0 ? (star.worldType || 'planet') : types[seed % types.length];
            return {
                id: index === 0 ? star.id : star.id + '_planet_' + index,
                name: star.name + ' ' + String.fromCharCode(98 + index),
                semiMajorAxisAU,
                periodDays: Math.sqrt(semiMajorAxisAU ** 3 / 0.85) * 365.25,
                radiusEarth: 0.55 + (seed % 180) / 100, discoveryYear: 'Procedural',
                color: colors[Math.max(0, types.indexOf(worldType))], heat: worldType + ' world',
                worldType, seed, colony: index === 0, parentStarId: star.id
            };
        });
        return {
            id: star.id, name: star.name, type: star.type, radiusSolar: 0.85,
            temperatureK: star.type === 'M-Dwarf' ? 3400 : 5600,
            distanceLy: Math.hypot(star.position.x, star.position.y, star.position.z),
            provenance: 'Pioneer deterministic fictional universe',
            note: 'Generated worlds for exploration. Orbital values and landscapes are game scenarios, not NASA observations.',
            planets, star
        };
    }

    syncSystem(star = this.game.universe?.getCurrentStar?.()) {
        const next = this.generateSystem(star);
        if (next.id !== this.system.id) {
            this.records[this.system.id] = this.state;
            this.system = next;
            const primary = next.planets.find(body => body.colony) || next.planets[0];
            this.state = this.records[next.id] || { selectedBodyId: primary.id, activeBodyId: primary.id, surveyed: { [primary.id]: true }, visited: { [primary.id]: true }, surveyLog: [] };
            this.zoom = 1; this.pan = { x: 0, y: 0 };
            this.stopAnimation();
            this.modal?.remove();
            this.modal = null; this.canvas = null; this.ctx = null;
        }
        const current = String(this.game.currentSystemId);
        const active = this.system.planets.find(body => body.id === current)
            || (star?.home && current === star.id ? this.system.planets.find(body => body.colony) : null);
        if (active) {
            this.state.activeBodyId = active.id;
            this.state.visited[active.id] = true;
            this.state.surveyed[active.id] = true;
        }
        return this.system;
    }

    transferCost(body = this.selectedBody()) {
        const active = this.system.planets.find(entry => entry.id === this.state.activeBodyId) || this.system.planets[0];
        return Math.max(20, Math.round(25 + Math.abs(body.semiMajorAxisAU - active.semiMajorAxisAU) * 55));
    }

    transferSelectedWorld() {
        const body = this.selectedBody();
        if (!body || body.id === this.state.activeBodyId) return false;
        if (!this.state.surveyed[body.id]) { this.game.notify('Survey the destination before transferring.', 'info'); return false; }
        if (this.game.isOnMoon) { this.game.notify('Return from the moon before an interplanetary transfer.', 'info'); return false; }
        const host = this.game.universe?.getCurrentStar?.();
        const homeIndex = this.system.planets.indexOf(body);
        const worldType = body.worldType || ['lava', 'desert', 'desert', 'planet', 'planet'][homeIndex] || 'planet';
        const seed = body.seed ?? (body.colony ? (this.game.systemStates?.kepler_186f?.seed || 12345) : 18600 + homeIndex);
        const destination = { ...body, seed, worldType, discovered: true, parentStarId: host?.id, localTransfer: true, position: host?.position || { x: 0, y: 0, z: 0 }, starConfig: host?.starConfig || null };
        const arrived = this.game.executeWarp?.(destination, false, { energy: this.transferCost(body), credits: 0, distance: 0, reachable: true });
        if (!arrived) return false;
        this.state.activeBodyId = body.id;
        this.state.visited[body.id] = true;
        this.state.surveyed[body.id] = true;
        this.game.saveGame?.({ silent: true });
        this.game.notify('Transfer complete: ' + body.name + '. Its surface and colony state are now active.', 'success');
        this.close();
        return true;
    }

    installKeyboardControls(modal) {
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-label', this.system.name + ' local system');
        this.canvas.tabIndex = 0;
        this.canvas.setAttribute('aria-label', 'Orbital map. Arrow keys select planets, plus and minus zoom.');
        const selection = document.createElement('select');
        selection.id = 'ep-local-system-body';
        selection.setAttribute('aria-label', 'Choose a world');
        selection.style.cssText = 'width:calc(100% - 24px);margin:8px 12px;padding:9px;background:#040d19;color:#e5f6ff;border:1px solid #3a647b;border-radius:6px;';
        this.system.planets.forEach(body => {
            const option = document.createElement('option'); option.value = body.id; option.textContent = body.name;
            selection.appendChild(option);
        });
        selection.value = this.state.selectedBodyId;
        selection.addEventListener('change', event => this.selectBody(event.target.value));
        modal.querySelector('.ep-local-system-layout').after(selection);
        this.canvas.addEventListener('keydown', event => {
            const index = this.system.planets.findIndex(body => body.id === this.state.selectedBodyId);
            if (event.key.startsWith('Arrow')) {
                const step = ['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 1;
                this.selectBody(this.system.planets[(index + step + this.system.planets.length) % this.system.planets.length].id);
            } else if (event.key === '+' || event.key === '=') { this.zoom = Math.min(2.6, this.zoom * 1.2); this.draw(); }
            else if (event.key === '-') { this.zoom = Math.max(.58, this.zoom / 1.2); this.draw(); }
            else return;
            event.preventDefault();
        });
        modal.addEventListener('keydown', event => {
            if (event.key === 'Escape') { this.close(); event.preventDefault(); }
            if (event.key === 'Tab') {
                const controls = Array.from(modal.querySelectorAll('button:not([disabled]),select,[tabindex="0"]')).filter(element => element.offsetParent !== null);
                const first = controls[0], last = controls[controls.length - 1];
                if (event.shiftKey && document.activeElement === first) { last?.focus(); event.preventDefault(); }
                else if (!event.shiftKey && document.activeElement === last) { first?.focus(); event.preventDefault(); }
            }
            event.stopPropagation();
        });
        if (typeof ResizeObserver !== 'undefined') {
            this.resizeObserver?.disconnect();
            this.resizeObserver = new ResizeObserver(() => { if (this.modal?.style.display !== 'none') this.resize(); });
            this.resizeObserver.observe(this.canvas.parentElement);
        }
        if (!document.getElementById('ep-local-responsive-style')) {
            const style = document.createElement('style');
            style.id = 'ep-local-responsive-style';
            style.textContent = '#ep-local-system-modal .ep-local-system-window{overflow:auto;}#ep-local-system-modal button:focus-visible,#ep-local-system-modal canvas:focus-visible,#ep-local-system-modal select:focus-visible{outline:2px solid #67e8f9;outline-offset:2px;}@media(max-width:760px){#ep-local-system-modal .ep-local-system-layout{display:flex!important;flex-direction:column;flex:none!important;}#ep-local-system-modal .ep-local-system-map-wrap{height:320px;min-height:320px!important;}#ep-local-system-modal .ep-modal-header{flex-wrap:wrap;gap:8px;}#ep-local-system-modal #ep-local-system-panel{overflow:visible!important;}}';
            document.head.appendChild(style);
        }
    }

    serialize(){this.records[this.system.id]=this.state;return {version:2,currentSystemId:this.system.id,systems:this.records,...this.state};}
    restore(raw) {
        if (!raw || typeof raw !== 'object') return;
        const records = raw.version === 2 && raw.systems && typeof raw.systems === 'object' ? raw.systems : { kepler_186: raw };
        this.syncSystem();
        this.records = records;
        const saved = records[this.system.id] || {};
        const primary = this.system.planets.find(body => body.colony) || this.system.planets[0];
        this.state = { selectedBodyId: primary.id, activeBodyId: primary.id, surveyed: {}, visited: {}, surveyLog: [] };
        const valid = new Set(this.system.planets.map(body => body.id));
        for (const key of ['selectedBodyId', 'activeBodyId']) if (valid.has(saved[key])) this.state[key] = saved[key];
        for (const key of ['surveyed', 'visited']) Object.entries(saved[key] || {}).forEach(([id, value]) => { if (valid.has(id) && value) this.state[key][id] = true; });
        if (Array.isArray(saved.surveyLog)) this.state.surveyLog = saved.surveyLog.slice(-50);
        this.syncSystem();
        this.refreshPanel();
    }

    ensureUI(){
        if(this.modal?.isConnected)return;
        const modal=document.createElement('div'); modal.id='ep-local-system-modal'; modal.className='ep-modal-overlay'; modal.style.display='none';
        modal.innerHTML=`<div class="ep-modal ep-local-system-window" style="width:min(1120px,94vw);height:min(800px,92vh);display:flex;flex-direction:column;">
            <div class="ep-modal-header"><div><div style="font-size:.68rem;letter-spacing:.14em;color:#67e8f9;">LOCAL STELLAR NAVIGATION</div><h2 style="margin:2px 0 0;color:#e0f2fe;">${escapeLocalText(this.system.name)} System</h2></div><div style="display:flex;gap:8px;align-items:center;"><button class="ep-sys-btn" data-local-system-action="zoom-out" title="Zoom out">-</button><button class="ep-sys-btn" data-local-system-action="zoom-in" title="Zoom in">+</button><button class="ep-sys-btn" data-local-system-action="reset-view">Reset</button><button class="ep-sys-btn" data-local-system-action="close">CLOSE</button></div></div>
            <div class="ep-local-system-layout" style="display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:12px;min-height:0;flex:1;padding:12px;">
                <div class="ep-local-system-map-wrap" style="position:relative;min-height:390px;border:1px solid rgba(56,189,248,.28);border-radius:12px;overflow:hidden;background:radial-gradient(circle at 50% 50%,rgba(30,64,175,.12),rgba(2,6,23,.98) 62%);"><canvas id="ep-local-system-canvas" style="width:100%;height:100%;display:block;touch-action:none;cursor:grab;"></canvas><div style="position:absolute;left:12px;bottom:10px;padding:6px 8px;border-radius:8px;background:rgba(2,6,23,.72);border:1px solid rgba(148,163,184,.2);font-size:.66rem;color:#94a3b8;pointer-events:none;">Drag to pan - wheel to zoom - click a planet to inspect</div></div>
                <aside id="ep-local-system-panel" style="min-width:0;overflow:auto;border:1px solid rgba(148,163,184,.22);border-radius:12px;padding:12px;background:rgba(2,6,23,.66);"></aside>
            </div><div style="padding:8px 14px 12px;color:#9bb6c9;font-size:.68rem;border-top:1px solid rgba(148,163,184,.14);">${this.system.id === 'kepler_186' ? 'Orbital distances and periods use published catalog values.' : 'Orbital distances and periods are procedural game values.'} Marker sizes and orbital animation are visualized out of scale for readability. ${escapeLocalText(this.system.note)}</div></div>`;
        document.body.appendChild(modal); this.modal=modal; this.canvas=modal.querySelector('#ep-local-system-canvas'); this.ctx=this.canvas.getContext('2d');this.installKeyboardControls(modal);
        modal.addEventListener('click',event=>{const b=event.target.closest('[data-local-system-action]');if(!b)return;const a=b.dataset.localSystemAction;if(a==='close')this.close();if(a==='zoom-in'){this.zoom=Math.min(2.6,this.zoom*1.2);this.draw();}if(a==='zoom-out'){this.zoom=Math.max(.58,this.zoom/1.2);this.draw();}if(a==='reset-view'){this.zoom=1;this.pan={x:0,y:0};this.draw();}if(a==='survey')this.surveySelected();if(a==='visit')this.visitSelectedOrbit();if(a==='return-colony')this.selectBody(this.system.planets.find(body=>body.colony).id);});
        this.canvas.addEventListener('wheel',event=>{event.preventDefault();this.zoom=Math.max(.58,Math.min(2.6,this.zoom*(event.deltaY<0?1.12:1/1.12)));this.draw();},{passive:false});
        this.canvas.addEventListener('pointerdown',event=>{this.canvas.setPointerCapture?.(event.pointerId);this.drag={x:event.clientX,y:event.clientY,startPanX:this.pan.x,startPanY:this.pan.y,moved:false};this.canvas.style.cursor='grabbing';});
        this.canvas.addEventListener('pointermove',event=>{if(!this.drag)return;const dx=event.clientX-this.drag.x,dy=event.clientY-this.drag.y;if(Math.abs(dx)+Math.abs(dy)>4)this.drag.moved=true;this.pan.x=this.drag.startPanX+dx;this.pan.y=this.drag.startPanY+dy;this.draw();});
        const end=event=>{if(!this.drag)return;const moved=this.drag.moved;this.drag=null;this.canvas.style.cursor='grab';if(!moved)this.handleCanvasClick(event);}; this.canvas.addEventListener('pointerup',end);this.canvas.addEventListener('pointercancel',()=>{this.drag=null;this.canvas.style.cursor='grab';});
        if(typeof this.game?.makeWindowInteractive==='function')requestAnimationFrame(()=>this.game.makeWindowInteractive(modal.querySelector('.ep-modal'))); this.refreshPanel();
    }

    open(){this.syncSystem();this.ensureUI();this.previousFocus=document.activeElement;this.modal.style.display='flex';if(typeof this.game?.makeWindowInteractive==='function')requestAnimationFrame(()=>this.game.makeWindowInteractive(this.modal.querySelector('.ep-modal')));this.resize();this.refreshPanel();this.startAnimation();}
    close(){if(this.modal)this.modal.style.display='none';this.stopAnimation();this.previousFocus?.focus?.();}
    startAnimation(){if(this.animationFrame)return;if(this.reducedMotion){this.draw();return;}const loop=()=>{if(!this.modal||this.modal.style.display==='none'){this.animationFrame=0;return;}if(!document.hidden)this.draw();this.animationFrame=requestAnimationFrame(loop);};this.animationFrame=requestAnimationFrame(loop);}
    stopAnimation(){if(this.animationFrame)cancelAnimationFrame(this.animationFrame);this.animationFrame=0;}
    resize(){if(!this.canvas)return;const rect=this.canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.5),w=Math.max(320,Math.round(rect.width*dpr)),h=Math.max(260,Math.round(rect.height*dpr));if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}this.draw();}
    orbitRadius(au,minDim){const maxAU=Math.max(...this.system.planets.map(body=>body.semiMajorAxisAU)),n=Math.log1p(au*35)/Math.log1p(maxAU*35);return(44+n*minDim*.38)*this.zoom;}
    bodyPhase(body, seconds) {
        let seed = 2166136261;
        for (const character of body.id) seed = Math.imul(seed ^ character.charCodeAt(0), 16777619);
        seed = Math.imul(seed ^ (seed >>> 16), 0x45d9f3b) >>> 0;
        return seconds * 0.18 / Math.sqrt(Math.max(1, body.periodDays)) + seed / 4294967296 * Math.PI * 2;
    }

    draw(){
        if(!this.ctx||!this.canvas)return;const ctx=this.ctx,w=this.canvas.width,h=this.canvas.height;if(!w||!h)return;ctx.clearRect(0,0,w,h);const dpr=Math.min(devicePixelRatio||1,1.5),cx=w/2+this.pan.x*dpr,cy=h/2+this.pan.y*dpr,minDim=Math.min(w,h);
        const bg=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.max(w,h)*.75);bg.addColorStop(0,'rgba(11,28,58,.92)');bg.addColorStop(.55,'rgba(3,10,27,.97)');bg.addColorStop(1,'#020617');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
        for(let i=0;i<180;i++){const x=((Math.sin(i*91.17+186)*43758.5453)%1+1)%1*w,y=((Math.sin(i*37.71+372)*24634.6345)%1+1)%1*h,bright=i%17===0;ctx.fillStyle=bright?'rgba(186,230,253,.75)':'rgba(148,163,184,.35)';ctx.fillRect(x,y,bright?2:1,bright?2:1);}
        ctx.lineWidth=Math.max(1,dpr);this.system.planets.forEach(body=>{const r=this.orbitRadius(body.semiMajorAxisAU,minDim);ctx.beginPath();ctx.ellipse(cx,cy,r,r*.72,0,0,Math.PI*2);ctx.strokeStyle=body.id==='kepler_186f'?'rgba(56,189,248,.28)':'rgba(100,116,139,.22)';ctx.stroke();});
        const glow=ctx.createRadialGradient(cx,cy,0,cx,cy,28*dpr);glow.addColorStop(0,'#fff7cc');glow.addColorStop(.22,'#fbbf24');glow.addColorStop(.55,'rgba(249,115,22,.78)');glow.addColorStop(1,'rgba(249,115,22,0)');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(cx,cy,28*dpr,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fde68a';ctx.beginPath();ctx.arc(cx,cy,8*dpr,0,Math.PI*2);ctx.fill();ctx.fillStyle='#f8fafc';ctx.font=`${11*dpr}px Inter, sans-serif`;ctx.textAlign='center';ctx.fillText(this.system.name,cx,cy+38*dpr);
        this.hitRegions=[];const now=this.reducedMotion?0:performance.now()/1000;this.system.planets.forEach(body=>{const orbit=this.orbitRadius(body.semiMajorAxisAU,minDim),phase=this.bodyPhase(body,now),x=cx+Math.cos(phase)*orbit,y=cy+Math.sin(phase)*orbit*.72,selected=this.state.selectedBodyId===body.id,active=this.state.activeBodyId===body.id,size=Math.max(4.5,Math.min(9,body.radiusEarth*4.5))*dpr;if(selected||active){ctx.strokeStyle=active?'#22d3ee':'#a78bfa';ctx.lineWidth=1.5*dpr;ctx.beginPath();ctx.arc(x,y,size+6*dpr,0,Math.PI*2);ctx.stroke();}ctx.fillStyle=body.color;ctx.beginPath();ctx.arc(x,y,size,0,Math.PI*2);ctx.fill();if(this.state.surveyed[body.id]){ctx.strokeStyle='#4ade80';ctx.lineWidth=dpr;ctx.beginPath();ctx.arc(x,y,size+2.5*dpr,0,Math.PI*2);ctx.stroke();}ctx.fillStyle=selected?'#e0f2fe':'#94a3b8';ctx.font=`${(selected?10:9)*dpr}px Inter, sans-serif`;ctx.textAlign='center';ctx.fillText((this.system.id==='kepler_186'?body.name.replace('Kepler-186',''):body.name.slice(-1)),x,y-size-7*dpr);this.hitRegions.push({bodyId:body.id,x,y,r:Math.max(13*dpr,size+7*dpr)});});
    }

    handleCanvasClick(event){const rect=this.canvas.getBoundingClientRect(),sx=this.canvas.width/Math.max(1,rect.width),sy=this.canvas.height/Math.max(1,rect.height),x=(event.clientX-rect.left)*sx,y=(event.clientY-rect.top)*sy;let best=null;for(const reg of this.hitRegions){const d=Math.hypot(x-reg.x,y-reg.y);if(d<=reg.r&&(!best||d<best.d))best={...reg,d};}if(best)this.selectBody(best.bodyId);}
    selectBody(id){if(!this.system.planets.some(p=>p.id===id))return;this.state.selectedBodyId=id;const select=this.modal?.querySelector('#ep-local-system-body');if(select)select.value=id;this.refreshPanel();this.draw();}
    selectedBody(){return this.system.planets.find(p=>p.id===this.state.selectedBodyId)||this.system.planets[this.system.planets.length-1];}

    surveySelected(){const body=this.selectedBody();if(!body||this.state.surveyed[body.id])return;const g=this.game,cost={energy:25,data:10};if((g.resources?.energy||0)<cost.energy||(g.resources?.data||0)<cost.data){g.notify?.(`Survey requires ${cost.energy} Energy and ${cost.data} Data.`,'warning');return;}g.resources.energy-=cost.energy;g.resources.data-=cost.data;this.state.surveyed[body.id]=true;this.state.surveyLog.push({bodyId:body.id,day:g.day,at:Date.now()});g.updateResourceUI?.();g.notify?.(`Survey complete: landing corridor available on ${body.name}.`,'success');g.saveGame?.({silent:true});this.refreshPanel();}
    visitSelectedOrbit(){return this.transferSelectedWorld();}

    refreshPanel(){
        if(!this.modal)return;const panel=this.modal.querySelector('#ep-local-system-panel');if(!panel)return;const body=this.selectedBody(),surveyed=!!this.state.surveyed[body.id],visited=!!this.state.visited[body.id],active=this.state.activeBodyId===body.id,cost=this.transferCost(body);
        panel.innerHTML=`<div style="font-size:.65rem;letter-spacing:.12em;color:#64748b;">SELECTED BODY</div><h3 style="margin:.35rem 0;color:${body.color};">${escapeLocalText(body.name)}</h3><div style="color:#cbd5e1;font-size:.78rem;line-height:1.55;"><div><span style="color:#64748b;">Radius</span> - ${body.radiusEarth.toFixed(2)} Earth radii</div><div><span style="color:#64748b;">Orbit</span> - ${body.semiMajorAxisAU.toFixed(4)} AU</div><div><span style="color:#64748b;">Period</span> - ${body.periodDays.toFixed(2)} days</div><div><span style="color:#64748b;">Discovery</span> - ${body.discoveryYear}</div><div><span style="color:#64748b;">Scenario</span> - ${escapeLocalText(body.heat)}</div></div><div style="display:flex;gap:6px;flex-wrap:wrap;margin:12px 0;"><span class="ep-security-badge" style="border-color:${surveyed?'#4ade80':'#64748b'};color:${surveyed?'#86efac':'#94a3b8'};">${surveyed?'SURVEYED':'UNSURVEYED'}</span><span class="ep-security-badge" style="border-color:${visited?'#22d3ee':'#64748b'};color:${visited?'#67e8f9':'#94a3b8'};">${visited?'VISITED':'UNVISITED'}</span>${body.colony?'<span class="ep-security-badge" style="border-color:#fbbf24;color:#fde68a;">COLONY WORLD</span>':''}</div><div style="display:grid;gap:8px;"><button class="ep-sys-btn" data-local-system-action="survey" ${surveyed?'disabled':''}>${surveyed?'Survey complete':'Survey - 25 Energy / 10 Data'}</button><button class="ep-sys-btn" data-local-system-action="visit" ${(active||!surveyed||this.game.isOnMoon||(this.game.resources.energy||0)<cost)?'disabled':''}>${active?'Current world':`Transfer to world - ${cost} Energy`}</button>${!body.colony?'<button class="ep-sys-btn" data-local-system-action="return-colony">Select primary colony</button>':''}</div><div style="margin-top:16px;padding-top:12px;border-top:1px solid rgba(148,163,184,.18);font-size:.72rem;color:#94a3b8;line-height:1.45;"><strong style="color:#e2e8f0;">Host star</strong><br>${escapeLocalText(this.system.name)} - ${escapeLocalText(this.system.type)}<br>${this.system.radiusSolar.toFixed(2)} solar radii - ${this.system.temperatureK.toLocaleString()} K<br>${this.system.distanceLy.toFixed(1)} light-years ${this.system.id==='kepler_186'?'from Earth':'from the chart origin'}</div><div style="margin-top:10px;font-size:.66rem;color:#64748b;line-height:1.4;">Source: ${escapeLocalText(this.system.provenance)}</div>`;
    }
}

window.KEPLER_186_SYSTEM=KEPLER_186_SYSTEM;
window.LocalSystemExplorer=LocalSystemExplorer;
})();
