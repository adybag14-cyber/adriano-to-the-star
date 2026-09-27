/* A catalogue sky in an on-demand 2D layer behind the existing Three.js planet.
 * No random stars, repeating CSS map, second WebGL context or per-frame astrometry.
 */
(() => {
  'use strict';
  const scriptURL = new URL(document.currentScript?.src || 'education-sky.js',location.href);
  const math = globalThis.ObservatoryAstrometry;
  const node = (tag,text,className) => {const el=document.createElement(tag);if(text!=null)el.textContent=text;if(className)el.className=className;return el;};
  const decode = data => data.rows.map(row => Object.fromEntries(data.columns.map((column,i)=>[column,row[i]])));
  async function read(name,hash,maxBytes=4*1024*1024) {
    if(!/^[a-z0-9-]+\.json(?:\?v=[a-zA-Z0-9_-]+)?$/.test(name))throw new Error('Invalid sky asset path');
    const url=new URL(`data/sky/${name}`,scriptURL);url.search=scriptURL.search;
    const response=await fetch(url,{credentials:'same-origin',cache:scriptURL.search?'force-cache':'no-cache',signal:AbortSignal.timeout(20000)});
    if(!response.ok)throw new Error(`Sky catalogue HTTP ${response.status}`);
    const bytes=await response.arrayBuffer();if(bytes.byteLength>maxBytes)throw new Error('Sky catalogue exceeds its budget');
    if(hash) {
      if(!crypto.subtle)throw new Error('Sky integrity verification unavailable');
      const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');
      if(digest!==hash)throw new Error('Sky catalogue integrity check failed');
    }
    return JSON.parse(new TextDecoder().decode(bytes));
  }
  class EducationSky {
    constructor(viewer) {
      this.viewer=viewer;this.stars=[];this.observers=[];this.result=null;this.target=viewer.currentPlanet || 'Earth';this.raf=null;this.grid=false;this.labels=true;this.frameCount=0;this.projectCount=0;
      this.date=new URLSearchParams(location.search).get('skyDate') || new Date().toISOString().slice(0,10);
      this.magnitudeLimit=6.5;
      this.canvas=node('canvas');this.canvas.id='education-sky';this.canvas.setAttribute('aria-hidden','true');
      viewer.container.prepend(this.canvas);this.context=this.canvas.getContext('2d',{alpha:true});
      this.status=node('aside',null,'education-sky-status');this.status.id='education-sky-status';this.status.setAttribute('aria-label','Sky observer and evidence');
      this.statusHeading=node('strong','CATALOGUE SKY');this.statusText=node('span','Loading measured star positions…');this.statusText.setAttribute('role','status');
      this.status.append(this.statusHeading,this.statusText);document.body.append(this.status);
      this.makeControls();
      this.makePlanetEvidencePanel();
      this.limitPanel=node('section',null,'education-sky-limit');this.limitPanel.hidden=true;this.limitPanel.setAttribute('aria-labelledby','education-sky-limit-title');
      const title=node('h2','ANDROMEDA · EVIDENCE LIMIT');title.id='education-sky-limit-title';
      this.limitPanel.append(node('p','PA-99-N2 b / CANDIDATE HOST LOCATION','observatory-kicker'),title,
        node('p','This is a candidate, not a confirmed extragalactic planet. The catalogue does not supply its local M31 star field, a resolved depth map, or a planet surface.'),
        node('p','The geometry below relocates only the measured Solar-neighbourhood catalogue. Most or all of those stars become too faint to see from M31. A blank local sky here means missing local observations—not that Andromeda has no stars.'));
      const reference=node('a','Read the candidate record');reference.href='https://exoplanet.eu/catalog/pa_99_n2_b--556/';reference.target='_blank';reference.rel='noopener noreferrer';this.limitPanel.append(reference);document.body.append(this.limitPanel);
      document.addEventListener('education-planet-change',event=>this.setTarget(event.detail.name));
      viewer.controls?.addEventListener('change',()=>this.requestDraw());
      window.addEventListener('resize',()=>this.resize(),{passive:true});
      document.addEventListener('visibilitychange',()=>{if(document.hidden){if(this.raf!=null)cancelAnimationFrame(this.raf);this.raf=null;}else this.requestDraw();});
      window.addEventListener('pagehide',()=>{if(this.raf!=null)cancelAnimationFrame(this.raf);this.raf=null;});
      window.addEventListener('pageshow',()=>this.requestDraw());
      this.resize();this.ready=this.load();
    }
    makePlanetEvidencePanel() {
      const panel=document.getElementById('data-overlay');
      if(!panel || document.getElementById('education-planet-details'))return;
      const content=node('div');content.id='education-planet-details';
      for(const child of [...panel.children])if(!['planet-name','planet-context-label'].includes(child.id))content.append(child);
      const button=node('button','Show planet evidence','education-details-toggle');button.id='education-details-toggle';button.type='button';button.setAttribute('aria-controls',content.id);
      panel.append(button,content);
      const narrow=matchMedia('(max-width:760px)');let expanded=false;
      const sync=()=>{
        const open=!narrow.matches || expanded;
        button.hidden=!narrow.matches;content.hidden=!open;
        button.textContent=expanded?'Hide planet evidence':'Show planet evidence';
        button.setAttribute('aria-expanded',String(open));
        panel.dataset.detailsExpanded=String(open);
      };
      button.addEventListener('click',()=>{expanded=!expanded;sync();});
      narrow.addEventListener('change',sync);sync();
    }
    makeControls() {
      const sidebar=document.getElementById('ui-sidebar');if(!sidebar)return;
      const details=node('details',null,'education-sky-controls');details.id='education-sky-controls';
      details.append(node('summary','Observer sky · date & orientation'));
      const label=node('label','Observation date (UTC approximation)');label.htmlFor='sky-date';
      const date=node('input');date.id='sky-date';date.type='date';date.min='1800-01-01';date.max='2049-12-31';date.value=this.date;
      if(!date.value || !date.checkValidity()){this.date='2026-09-27';date.value=this.date;}
      date.addEventListener('change',()=>{if(!date.checkValidity() || !date.value)return;this.date=date.value;this.compute();const url=new URL(location.href);url.searchParams.set('skyDate',this.date);history.replaceState(null,'',url);});label.append(date);details.append(label);
      const selectLabel=node('label','Limiting visual magnitude');selectLabel.htmlFor='sky-magnitude';const select=node('select');select.id='sky-magnitude';
      for(const value of [4,5,6,6.5,7]){const o=node('option',String(value));o.value=String(value);select.append(o);}select.value='6.5';
      select.addEventListener('change',()=>{this.magnitudeLimit=Number(select.value);this.compute();});selectLabel.append(select);details.append(selectLabel);
      for(const [key,title] of [['grid','Equatorial coordinate grid'],['labels','Label bright stars']]) {
        const label=node('label',title,'education-sky-check');const input=node('input');input.type='checkbox';input.id=`sky-${key}`;input.checked=this[key];input.addEventListener('change',()=>{this[key]=input.checked;this.requestDraw();});label.prepend(input);details.append(label);
      }
      const arrows=node('div',null,'education-sky-direction');arrows.setAttribute('role','group');arrows.setAttribute('aria-label','Sky orientation');
      for(const [text,yaw,pitch] of [['Look left',-.25,0],['Look right',.25,0],['Look up',0,-.2],['Look down',0,.2]]){const button=node('button',text);button.type='button';button.addEventListener('click',()=>this.pan(yaw,pitch));arrows.append(button);}
      const reset=node('button','Reset sky orientation');reset.type='button';reset.addEventListener('click',()=>{this.viewer.camera.position.set(0,0,5);this.viewer.camera.lookAt(0,0,0);this.viewer.controls?.target.set(0,0,0);this.viewer.controls?.update();this.viewer.requestRender?.();this.requestDraw();});arrows.append(reset);details.append(arrows);
      details.append(node('p','HYG 4.2 · J2000 axes. Orbital translation and linear stellar motion; no horizon, refraction, aberration or precision apparent-place corrections. Solar shifts are usually tiny, not exaggerated.','education-sky-method'));
      const source=node('a','Source, licence and scientific limitations');source.href=new URL('data/sky/NOTICE.md',scriptURL).href;source.target='_blank';source.rel='noopener noreferrer';details.append(source);
      this.limitNote=node('p','', 'education-sky-method');details.append(this.limitNote);
      const candidate=node('button','M31 · PA-99-N2 b candidate','planet-btn education-m31-button');candidate.type='button';candidate.id='education-m31-candidate';candidate.setAttribute('aria-pressed','false');candidate.addEventListener('click',()=>this.setTarget('PA-99-N2 b'));
      const after=sidebar.querySelector('[data-education-planet="TRAPPIST-1 e"]');if(after)after.after(candidate,details);else sidebar.append(candidate,details);
    }
    async load() {
      try {
        const manifest=await read('manifest.json');
        if(manifest.schemaVersion!==1)throw new Error('Unsupported sky manifest');
        const [stars,observers]=await Promise.all([read(manifest.stars.path,manifest.stars.sha256),read(manifest.observers.path,manifest.observers.sha256)]);
        if(stars.schemaVersion!==1 || observers.schemaVersion!==1 || stars.epoch!==2000 || stars.rows.length!==manifest.stars.rows || stars.rows.length>30000 || !stars.columns.includes('distanceKnown'))throw new Error('Unsupported sky catalogue schema');
        this.stars=decode(stars);this.observers=decode(observers);this.catalogue=stars;
        this.setTarget(new URLSearchParams(location.search).get('target') || this.viewer.currentPlanet || this.target);
        this.canvas.dataset.ready='true';return true;
      } catch(error) {
        this.canvas.dataset.ready='error';this.statusText.textContent=`Catalogue sky unavailable: ${error.message}. No synthetic stars substituted.`;this.status.classList.add('observatory-warning');
        return false;
      }
    }
    setTarget(name) {
      this.target=name;const m31=math.key(name)===math.key('PA-99-N2 b');this.viewer.skyOnly=m31;
      document.body.classList.toggle('education-sky-only',m31);this.limitPanel.hidden=!m31;
      document.getElementById('education-m31-candidate')?.setAttribute('aria-pressed',String(m31));
      if(m31) {
        document.querySelectorAll('[data-education-planet]').forEach(button=>button.setAttribute('aria-pressed','false'));
        this.viewer.container.setAttribute('aria-label','Evidence-limited sky at the candidate PA-99-N2 b host location. Local Andromeda stars and a planet surface are not established by this dataset.');
      }
      this.viewer.softwareRenderer?.worker?.postMessage({type:'visibility',hidden:document.hidden || m31});
      this.viewer.requestRender?.();this.compute();
    }
    compute() {
      if(!this.stars.length)return;
      try {
        const jd=math.julianDate(`${this.date}T12:00:00Z`);const observer=math.resolveObserver(this.target,jd,this.observers);
        if(!observer){this.result=null;this.statusText.textContent=`No measured host location in this snapshot for ${this.target}. No random sky substituted.`;this.requestDraw();return;}
        const start=performance.now();this.result=math.projectCatalogue(this.stars,observer,math.julianYear(jd),this.magnitudeLimit,this.catalogue.solarReference);this.projectCount++;
        this.observer=observer;this.computeMs=performance.now()-start;
        this.statusHeading.textContent=`${observer.name.toUpperCase()} / ${observer.status} / CATALOGUE SKY`;
        this.statusText.textContent=`${this.result.visible.length.toLocaleString()} catalogue stars across the full sky · V ≤ ${this.magnitudeLimit} · ${this.date}`;
        this.limitNote.textContent=`Coordinate source: ${observer.source}. ${observer.limitation} Largest visible catalogue displacement from a Sun-centred observer: ${this.result.maxShiftArcsec.toPrecision(3)} arcsec. ${this.result.excludedUnknownDistance} direction-only stars excluded here.`;
        this.canvas.dataset.observer=observer.name;this.canvas.dataset.starCount=String(this.result.visible.length);this.canvas.dataset.computeMs=this.computeMs.toFixed(2);this.canvas.dataset.projections=String(this.projectCount);
        this.canvas.dataset.maxShiftArcsec=String(this.result.maxShiftArcsec);this.canvas.dataset.model=observer.kind;
        this.status.setAttribute('title',observer.limitation);this.requestDraw();
        document.dispatchEvent(new CustomEvent('education-sky-ready',{detail:{observer:observer.name,kind:observer.kind,stars:this.result.visible.length}}));
      } catch(error){this.result=null;this.statusText.textContent=`Sky calculation unavailable: ${error.message}`;this.requestDraw();}
    }
    pan(yaw,pitch) {
      const camera=this.viewer.camera;if(!camera)return;
      const target=this.viewer.controls?.target || new THREE.Vector3();
      const offset=camera.position.clone().sub(target);const spherical=new THREE.Spherical().setFromVector3(offset);spherical.theta+=yaw;spherical.phi=Math.max(.02,Math.min(Math.PI-.02,spherical.phi+pitch));
      camera.position.copy(target).add(new THREE.Vector3().setFromSpherical(spherical));camera.lookAt(target);this.viewer.controls?.update();this.viewer.requestRender?.();this.requestDraw();
    }
    resize() {
      const dpr=Math.min(devicePixelRatio || 1,1.5);this.width=innerWidth;this.height=innerHeight;
      this.canvas.width=Math.round(this.width*dpr);this.canvas.height=Math.round(this.height*dpr);this.context?.setTransform(dpr,0,0,dpr,0,0);this.requestDraw();
    }
    requestDraw() {
      if(this.raf!=null || document.hidden)return;
      this.raf=requestAnimationFrame(()=>{this.raf=null;this.draw();});
    }
    project(direction,matrix,focal) {
      // Right-handed J2000 -> Three: (x,y,z) -> (x,z,-y).
      const x=direction[0],y=direction[2],z=-direction[1];
      const cx=matrix[0]*x+matrix[4]*y+matrix[8]*z,cy=matrix[1]*x+matrix[5]*y+matrix[9]*z,cz=matrix[2]*x+matrix[6]*y+matrix[10]*z;
      if(cz>=-.001)return null;
      return [this.width/2+cx/-cz*focal,this.height/2-cy/-cz*focal];
    }
    draw() {
      const context=this.context;if(!context)return;context.clearRect(0,0,this.width,this.height);
      if(!this.result || !this.viewer.camera)return;
      const camera=this.viewer.camera;camera.updateMatrixWorld();camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
      const matrix=camera.matrixWorldInverse.elements;const focal=this.height/(2*Math.tan(camera.fov*math.DEG/2));
      if(this.grid){
        context.strokeStyle='rgba(98,205,226,.14)';context.lineWidth=.65;
        const line=points=>{context.beginPath();let previous=null;for(const vector of points){const p=this.project(vector,matrix,focal);if(p && p[0]>-100 && p[0]<this.width+100 && p[1]>-100 && p[1]<this.height+100){if(previous && Math.hypot(p[0]-previous[0],p[1]-previous[1])<this.width/3)context.lineTo(...p);else context.moveTo(...p);previous=p;}else previous=null;}context.stroke();};
        for(let dec=-60;dec<=60;dec+=30)line(Array.from({length:181},(_,i)=>math.equatorial(i*2%360,dec)));
        for(let ra=0;ra<360;ra+=30)line(Array.from({length:91},(_,i)=>math.equatorial(ra,i*2-90)));
      }
      let drawn=0;const labelCells=new Set();
      for(const star of this.result.visible){
        const p=this.project(star.direction,matrix,focal);if(!p || p[0]<-8 || p[0]>this.width+8 || p[1]<-8 || p[1]>this.height+8)continue;
        const size=Math.max(.45,Math.min(3.4,2.8-(star.magnitude+1)*.35));
        context.globalAlpha=Math.max(.22,Math.min(1,1-(star.magnitude+1)*.095));
        context.fillStyle=star.bv==null?'#dbe8f5':star.bv<.1?'#c1dbff':star.bv>.9?'#ffd9b2':'#edf1e5';
        context.beginPath();context.arc(p[0],p[1],size,0,Math.PI*2);context.fill();
        if(star.magnitude<1.5){context.globalAlpha=.14;context.beginPath();context.arc(p[0],p[1],size*2.8,0,Math.PI*2);context.fill();}
        drawn++;
        if(this.labels && star.magnitude<2.4 && !/^(HIP|HYG) /.test(star.name)) {
          const cell=`${Math.floor(p[0]/140)}:${Math.floor(p[1]/42)}`;
          if(!labelCells.has(cell)){labelCells.add(cell);context.globalAlpha=.75;context.fillStyle='#b2d4e6';context.font='11px system-ui,sans-serif';context.fillText(star.name,p[0]+size+6,p[1]-4);}
        }
      }
      context.globalAlpha=1;this.frameCount++;this.canvas.dataset.drawnStars=String(drawn);this.canvas.dataset.frames=String(this.frameCount);
    }
  }
  window.EducationSky=EducationSky;
})();
