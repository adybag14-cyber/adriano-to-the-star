/* Same-origin, versioned multi-archive catalogue. External strings are never executable HTML. */
(() => {
  'use strict';
  const source = new URL(document.currentScript?.src || 'observatory-catalog.js', location.href);
  const root = new URL('data/observatory/', source);
  const PC_TO_LY = 3.261563777167433;
  const labels = Object.freeze({'nasa-ps':'NASA · all facilities','nasa-koi':'NASA · Kepler KOI','exoplanet-eu':'Paris Observatory','exoplanet-eu-candidate':'Paris · reviewed candidate'});
  const allowedStatuses = new Set(['CONFIRMED','CANDIDATE','FALSE POSITIVE','CONTROVERSIAL','RETRACTED','UNKNOWN','DISPUTED']);
  let pending;
  const evidenceCache = new Map();
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const node = (tag, text, className) => { const el = document.createElement(tag); if (text != null) el.textContent = text; if (className) el.className = className; return el; };
  const finite = value => value === null || (typeof value === 'number' && Number.isFinite(value));
  const validPath = value => typeof value === 'string' && /^[a-zA-Z0-9_./-]+\.json$/.test(value) && !value.split('/').includes('..') && !value.startsWith('/');
  async function read(url, expectedHash, maxBytes = 8 * 1024 * 1024, priority = 'auto') {
    const resolved = new URL(url, root);
    if (resolved.origin !== location.origin || !resolved.pathname.startsWith(root.pathname)) throw new Error('Catalogue path escaped its same-origin root');
    const response = await fetch(resolved, {credentials:'same-origin', priority, cache:expectedHash ? 'force-cache' : 'no-cache', signal:AbortSignal.timeout(15000)});
    if (!response.ok) throw new Error(`Catalogue request returned HTTP ${response.status}`);
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > maxBytes) throw new Error('Catalogue response exceeds its byte budget');
    if (expectedHash) {
      if (!/^[a-f0-9]{64}$/.test(expectedHash) || !crypto.subtle) throw new Error('Catalogue integrity verification is unavailable');
      const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b => b.toString(16).padStart(2,'0')).join('');
      if (digest !== expectedHash) throw new Error('Catalogue integrity verification failed');
    }
    return JSON.parse(new TextDecoder().decode(bytes));
  }
  function classify(radius) {
    if (!(radius > 0)) return 'Unknown';
    if (radius < .8) return 'Sub-Earth';
    if (radius <= 1.25) return 'Earth-like'; // Legacy filter key; the interface labels this Earth-sized, not habitable.
    if (radius <= 2) return 'Super-Earth';
    if (radius <= 4) return 'Mini-Neptune';
    if (radius <= 10) return 'Neptune-like';
    return 'Gas Giant';
  }
  async function prioritizeOpenEvidence() {
    // A deep-linked evidence reader is the immediate user task. Do not compete
    // for its cold-network bandwidth with the larger, background search index.
    if (!new URLSearchParams(location.search).get('engine')) return;
    const ready = () => Boolean(document.querySelector('#engine-panel-evidence a[href]'));
    if (ready()) return;
    await new Promise(resolve => {
      let timer;
      const finish = () => { observer.disconnect(); clearTimeout(timer); resolve(); };
      const observer = new MutationObserver(() => { if (ready()) finish(); });
      observer.observe(document.documentElement, {childList:true,subtree:true});
      // A failed or unknown engine link must never leave the catalogue blocked.
      timer = setTimeout(finish,5000);
      if (ready()) finish();
    });
  }
  async function load() {
    if (pending) return pending;
    pending = (async () => {
      await prioritizeOpenEvidence();
      // Mutable pointers need the same cache key as the deployed script.
      // Browser no-cache does not override a CDN-cached predeployment 404.
      const pointerUrl = new URL('current.json',root);
      pointerUrl.search = source.search;
      const pointer = await read(pointerUrl);
      if (pointer.schemaVersion !== 1 || !validPath(pointer.manifest?.path)) throw new Error('Unrecognized catalogue pointer');
      const manifestUrl = new URL(pointer.manifest.path,root);
      const manifest = await read(manifestUrl,pointer.manifest.sha256);
      if (manifest.schemaVersion !== 1 || manifest.releaseId !== pointer.releaseId || !Array.isArray(manifest.columns) || !Array.isArray(manifest.parts) || manifest.parts.length > 32 || !manifest.columns.includes('id')) throw new Error('Unrecognized catalogue manifest');
      const arrays = await Promise.all(manifest.parts.map(async part => {
        if (!validPath(part.path) || part.bytes > 2*1024*1024) throw new Error('Invalid catalogue shard');
        const data = await read(new URL(part.path,manifestUrl),part.sha256,2*1024*1024,'low');
        if (!Array.isArray(data.rows) || data.rows.length !== part.rows) throw new Error('Catalogue shard row count mismatch');
        return data.rows;
      }));
      const identities = new Set();
      const records = arrays.flat().map(values => {
        if (!Array.isArray(values) || values.length !== manifest.columns.length) throw new Error('Invalid catalogue row shape');
        const r = Object.fromEntries(manifest.columns.map((column,i) => [column,values[i]]));
        if (typeof r.id !== 'string' || r.id.length > 180 || identities.has(r.id) || typeof r.name !== 'string' || !allowedStatuses.has(r.status) || !Array.isArray(r.sources) || !r.sources.every(s => Object.hasOwn(manifest.sources,s)) || !Array.isArray(r.aliases)) throw new Error('Invalid or duplicate catalogue object');
        for (const key of ['radius','mass','distancePc','year','score','ra','dec']) if (!finite(r[key])) throw new Error('Invalid numeric catalogue value');
        identities.add(r.id);
        return {record_id:r.id, kepid:r.kepid, kepoi_name:r.koi || r.id, kepler_name:r.name, aliases:r.aliases,
          host:r.host, status:r.status, score:r.score, radius:r.radius, mass:r.mass, mass_kind:r.massKind,
          distance:r.distancePc == null ? null : r.distancePc*PC_TO_LY, distance_pc:r.distancePc, disc_year:r.year,
          type:classify(r.radius), availability:'available', source:r.parameterSource, sources:r.sources,
          facility:r.facility, discovery_method:r.method, ra:r.ra, dec:r.dec, status_conflict:r.statusConflict,
          high_mass_entry:r.highMassEntry, engine_id:r.engineId, observatory:true, detail_bucket:r.detailBucket};
      });
      if (records.length !== manifest.statistics.objects) throw new Error('Catalogue manifest total does not match its objects');
      return {records,manifest,manifestUrl};
    })().catch(error => { pending = null; throw error; });
    return pending;
  }
  function restore(db) {
    const params = new URLSearchParams(location.search);
    const sourceFilter = params.get('catalogue') || 'all';
    const facility = params.get('facility') || 'all';
    db.observatoryFilters = {
      catalogue:sourceFilter === 'all' || db.observatoryMeta?.manifest.sources[sourceFilter] ? sourceFilter : 'all',
      facility:facility === 'all' || db.observatoryMeta?.manifest.statistics.facilities[facility] ? facility : 'all'
    };
    for (const [key,value] of Object.entries(db.observatoryFilters)) {
      const control = document.getElementById(`observatory-${key}`); if (control) control.value = value;
    }
  }
  function matches(db,planet) {
    const f = db.observatoryFilters;
    return !f || ((f.catalogue === 'all' || planet.sources?.includes(f.catalogue)) && (f.facility === 'all' || (planet.facility || 'Not supplied') === f.facility));
  }
  function sync(db,params) {
    for (const key of ['catalogue','facility']) {
      const value = db.observatoryFilters?.[key];
      if (value && value !== 'all') params.set(key,value); else params.delete(key);
    }
  }
  function reset(db) {
    db.observatoryFilters = {catalogue:'all',facility:'all'};
    for (const key of ['catalogue','facility']) { const el=document.getElementById(`observatory-${key}`); if (el) el.value='all'; }
  }
  function mount(db,meta) {
    db.observatoryMeta = meta;
    document.documentElement.dataset.catalogueRelease = meta.manifest.releaseId;
    const panel = document.getElementById('observatory-catalogue-controls');
    if (!panel) return;
    panel.replaceChildren();
    const {statistics,sources,generatedAt} = meta.manifest;
    const strip = node('div',null,'observatory-summary-grid');
    for (const [value,label] of [[statistics.objects.toLocaleString(),'indexed objects'],[String(Object.keys(statistics.facilities).filter(x => x !== 'Not supplied').length),'reported discovery facilities'],[statistics.sourceDisagreements.toLocaleString(),'source disagreements retained']]) {
      const cell=node('div');cell.append(node('strong',value),node('span',label));strip.append(cell);
    }
    panel.append(strip);
    const controls=node('div',null,'observatory-filters');
    const makeSelect=(key,title,options) => {
      const label=node('label',title);label.htmlFor=`observatory-${key}`;
      const select=node('select');select.id=label.htmlFor;
      for (const [value,text] of options) { const option=node('option',text);option.value=value;select.append(option); }
      select.addEventListener('change',()=>{db.observatoryFilters[key]=select.value;db.currentPage=1;db.applyFilters();});
      label.append(select);controls.append(label);
    };
    makeSelect('catalogue','Catalogue / institution',[['all','All source catalogues'],...Object.keys(sources).map(id=>[id,`${labels[id] || sources[id].name} · ${statistics.sourceMembership[id] || 0}`])]);
    makeSelect('facility','Reported discovery facility',[['all','All discovery facilities'],...Object.entries(statistics.facilities).map(([name,count])=>[name,`${name} · ${count}`])]);
    panel.append(controls);
    const note=node('p',`Snapshot ${generatedAt.slice(0,10)}. Catalogue provider is not the discovering institution. The Paris bulk export includes confirmed entries under its broader substellar inclusion policy; ${statistics.highMassEntries.toLocaleString()} entries exceed 13 Jupiter masses. Candidates, false positives and source disagreements remain distinct.`, 'observatory-scope');
    panel.append(note);
    const links=node('nav',null,'observatory-source-links');links.setAttribute('aria-label','Authoritative catalogue sources');
    for (const [title,url] of [['NASA archive','https://exoplanetarchive.ipac.caltech.edu/'],['Paris Observatory','https://exoplanet.eu/catalog/'],['Snapshot manifest',meta.manifestUrl.href]]) {
      const a=node('a',title);a.href=url;a.target='_blank';a.rel='noopener noreferrer';links.append(a);
    }
    panel.append(links);
    const noteAlias = node('p',`${meta.manifest.unresolvedAliasAmbiguities.length} ambiguous alias matches were deliberately not joined. Counts describe source records after conservative matching, not a perfectly deduplicated census of confirmed planets.`, 'observatory-scope');
    const details=node('details',null,'observatory-method-note');details.append(node('summary','Identity, status and measurement policy'),noteAlias,node('p',meta.manifest.policy.parameters));panel.append(details);
    const subtitle=document.querySelector('.page-hero .page-subtitle'); if(subtitle) subtitle.dataset.i18n='database.subtitle';
    document.getElementById('reset-filters')?.addEventListener('click',()=>{reset(db);db.applyFilters();});
    const statusControl=document.getElementById('filter-status');
    if(statusControl) for (const value of ['FALSE POSITIVE','CONTROVERSIAL','DISPUTED','RETRACTED','UNKNOWN']) if (![...statusControl.options].some(o=>o.value===value)) {const option=node('option',value);option.value=value;statusControl.append(option);}
    restore(db);
  }
  async function showDetails(reference) {
    const db=window.databaseInstance;
    const planet=typeof reference==='object' ? reference : db?.findPlanet(reference);
    if(!planet?.observatory) return false;
    db.selectedPlanetKepid = db.recordKey(planet);
    db.updateURLFromState?.();
    const existing=document.getElementById('observatory-evidence-dialog');existing?.close();
    const opener=document.activeElement;
    const dialog=node('dialog',null,'observatory-evidence-dialog');dialog.id='observatory-evidence-dialog';dialog.setAttribute('aria-labelledby','observatory-evidence-title');
    const header=node('header');const heading=node('h2',planet.kepler_name);heading.id='observatory-evidence-title';
    const close=node('button','Close');close.type='button';close.className='observatory-close';close.addEventListener('click',()=>dialog.close());header.append(heading,close);dialog.append(header);
    dialog.append(node('p',`${planet.status} · ${planet.record_id}`,'observatory-evidence-status'));
    if(planet.status_conflict) dialog.append(node('p','The source catalogues disagree about this object’s status. Their original dispositions are shown separately; this site does not silently promote the object to confirmed.','observatory-warning'));
    if(planet.high_mass_entry) dialog.append(node('p','High-mass substellar catalogue entry. Catalogue inclusion is not proof that this object meets every definition of a planet.','observatory-warning'));
    const message=node('p','Loading the cited source solutions…');message.setAttribute('role','status');dialog.append(message);
    dialog.addEventListener('close',()=>{
      dialog.remove();
      if (db.selectedPlanetKepid === db.recordKey(planet)) {db.selectedPlanetKepid=null;db.updateURLFromState?.();}
      opener?.focus?.({preventScroll:true});
    });
    document.body.append(dialog);dialog.showModal();
    try {
      const meta=db.observatoryMeta || await load();const spec=meta.manifest.details[String(planet.detail_bucket)];
      if(!spec || !validPath(spec.path)) throw new Error('Missing source-evidence shard');
      const cacheKey=`${meta.manifest.releaseId}:${planet.detail_bucket}`;
      let request=evidenceCache.get(cacheKey);
      if(!request) {request=read(new URL(spec.path,meta.manifestUrl),spec.sha256);evidenceCache.set(cacheKey,request);request.catch(()=>evidenceCache.delete(cacheKey));}
      const shard=await request;const record=shard.records?.[planet.record_id];
      if(!record || record.id!==planet.record_id) throw new Error('Object evidence is missing');
      if(!dialog.isConnected) return true;
      message.textContent='Each solution remains in its original units and with its own errors, limits and provenance. “Not reported” is not zero.';
      for (const solution of record.sources) {
        const section=node('section',null,'observatory-solution');
        section.append(node('h3',`${labels[solution.source] || solution.source} — ${solution.status}`));
        section.append(node('p',`${solution.name}${solution.source===record.adoptedParameterSource ? ' · adopted parameter solution' : ' · alternative source solution'}`));
        const dl=node('dl');
        for(const [label,value] of [['Discovering facility',solution.facility || 'Not supplied by this source'],['Telescope',solution.telescope || 'Not supplied'],['Instrument',solution.instrument || 'Not supplied'],['Detection method',solution.method || 'Not supplied'],['Discovery year',solution.year ?? 'Not reported'],['Source record updated',solution.updated || 'Not supplied']]) dl.append(node('dt',label),node('dd',String(value)));
        for(const [name,q] of Object.entries(solution.quantities || {})) {
          let value='Not reported';
          if(q.value != null) {
            value=`${q.limit===1 ? '< ' : q.limit===-1 ? '> ' : ''}${q.value} ${q.unit}`;
            if(q.plus != null || q.minus != null) value+=` (+${q.plus == null ? '?' : Math.abs(q.plus)}, −${q.minus == null ? '?' : Math.abs(q.minus)})`;
          }
          dl.append(node('dt',name),node('dd',`${value} · ${q.kind || 'archive-reported'}`));
        }
        section.append(dl);
        if(solution.score != null) section.append(node('p',`Kepler Robovetter disposition score: ${solution.score}. This is not a planet-existence or habitability probability.`));
        for(const ref of [solution.reference,solution.discoveryReference,{label:'Open the archive entry',url:solution.url}]) {
          if(!ref?.label)continue;
          const p=node('p');
          try {const url=new URL(ref.url);if(url.protocol!=='https:')throw new Error('Unsupported protocol');const a=node('a',ref.label);a.href=url.href;a.target='_blank';a.rel='noopener noreferrer';p.append(a);} catch {p.textContent=ref.label;}
          section.append(p);
        }
        for(const text of solution.limitations || [])section.append(node('p',text,'observatory-scope'));
        dialog.append(section);
      }
      const footer=node('p','A catalogue entry does not establish a surface map, atmosphere or habitability. 3D reconstruction is available only for objects with a separately reviewed evidence packet.','observatory-scope');dialog.append(footer);
    } catch(error) {message.textContent=`Source evidence could not be loaded: ${error.message}. No substitute values were generated.`;message.className='observatory-warning';}
    return true;
  }
  globalThis.ObservatoryCatalogue = Object.freeze({load,mount,restore,matches,sync,reset,showDetails,escape,labels,classify});
})();
