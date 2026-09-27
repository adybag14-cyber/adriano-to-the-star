#!/usr/bin/env node
/** PNG/GIF evidence with separately measured frame timing. No authenticated state,
 * submitted forms or non-read-only network methods. GIF playback is NOT an FPS test.
 */
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {SITE_PAGES} from './site-pages.mjs';
const args=process.argv.slice(2);
const value=(name,fallback)=>{const i=args.indexOf(name);if(i<0)return fallback;if(!args[i+1] || args[i+1].startsWith('--'))throw new Error(`Missing value for ${name}`);return args[i+1];};
const production=args.includes('--production');
const base=new URL(value('--base-url',production?'https://adrianotothestar.com/':'http://127.0.0.1:8097/'));
if(production){if(base.protocol!=='https:' || !['adrianotothestar.com','www.adrianotothestar.com'].includes(base.hostname) || base.port || base.username || base.password)throw new Error('Production capture is restricted to the public production website.');}
else if(!['127.0.0.1','localhost'].includes(base.hostname) || !['http:','https:'].includes(base.protocol))throw new Error('Candidate capture requires a loopback artifact server.');
const out=path.resolve(value('--out',production?'.artifacts/observatory/production':'.artifacts/observatory/candidate'));
const allPages=args.includes('--all-pages'),noGif=args.includes('--no-gif'),ffmpeg=process.env.FFMPEG_PATH || 'ffmpeg';
await fs.mkdir(path.join(out,'screenshots'),{recursive:true});
if(!noGif && spawnSync(ffmpeg,['-version'],{encoding:'utf8',windowsHide:true}).status!==0)throw new Error('FFmpeg is required for GIF evidence. Set FFMPEG_PATH or explicitly use --no-gif.');
const report={schemaVersion:1,kind:production?'production-read-only':'candidate-artifact',baseURL:base.href,startedAt:new Date().toISOString(),run:process.env.GITHUB_RUN_ID || null,commit:process.env.GITHUB_SHA || null,
  constraints:{freshUnauthenticatedContext:true,networkMethods:['GET','HEAD','OPTIONS'],submittedForms:0,productionWrites:0,gifPresentationFPS:5,performanceMeasuredWithoutScreenshots:true},
  interpretation:'Browser requestAnimationFrame cadence is a scheduling proxy, not GPU FPS. Education renderer frame counts are reported separately when exposed. GIF timing is sampled/encoded for viewing and is not performance evidence. Shared CI runners and network state affect results.',pages:[],animations:[],failures:[]};
const escape=text=>String(text??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const idFor=route=>route.replace(/[^a-z0-9]+/gi,'-').replace(/-+$/,'');
const browser=await chromium.launch({headless:!args.includes('--headed')});
async function newContext(viewport,reducedMotion='no-preference'){
  const context=await browser.newContext({viewport,deviceScaleFactor:1,reducedMotion,serviceWorkers:'block'});
  await context.route('**/*',route=>['GET','HEAD','OPTIONS'].includes(route.request().method())?route.continue():route.abort('blockedbyclient'));
  await context.addInitScript(()=>{
    globalThis.__observatoryAudit={longTasks:[],lcp:null};
    try{new PerformanceObserver(list=>{for(const e of list.getEntries())globalThis.__observatoryAudit.longTasks.push({start:e.startTime,duration:e.duration});}).observe({type:'longtask',buffered:true});}catch{}
    try{new PerformanceObserver(list=>{globalThis.__observatoryAudit.lcp=list.getEntries().at(-1)?.startTime;}).observe({type:'largest-contentful-paint',buffered:true});}catch{}
  });return context;
}
async function settle(page,route){
  if(!production && route==='database.html')await page.waitForFunction(()=>window.databaseInstance?.allData.length>15000,{},{timeout:25000});
  if(!production && route==='education.html')await page.waitForFunction(()=>document.getElementById('education-sky')?.dataset.ready==='true',{},{timeout:25000});
  await page.waitForTimeout(['index.html','education.html','database.html'].includes(route)?1600:650);
}
async function frameSample(page,duration=2500){return page.evaluate(ms=>new Promise(resolve=>{
  const intervals=[];let previous=null;const start=performance.now(),renderedStart=window.viewer?.renderedFrames ?? null,skyStart=window.educationSky?.frameCount ?? null;
  function frame(now){if(previous!==null)intervals.push(now-previous);previous=now;if(now-start<ms){requestAnimationFrame(frame);return;}
    const sorted=[...intervals].sort((a,b)=>a-b),percentile=p=>sorted[Math.max(0,Math.ceil(sorted.length*p)-1)] ?? null,elapsed=now-start;
    resolve({durationMs:elapsed,intervalsMs:intervals,rafSamples:intervals.length,rafCadenceHz:intervals.length*1000/elapsed,p50Ms:percentile(.5),p95Ms:percentile(.95),p99Ms:percentile(.99),intervalsOver50Ms:intervals.filter(x=>x>50).length,
      educationRenderedFrames:renderedStart==null?null:window.viewer.renderedFrames-renderedStart,skyDraws:skyStart==null?null:window.educationSky.frameCount-skyStart,visibility:document.visibilityState});}
  requestAnimationFrame(frame);
}),duration);}
async function pageFacts(page){return page.evaluate(()=>{
  const nav=performance.getEntriesByType('navigation')[0],resources=performance.getEntriesByType('resource'),own=resources.filter(r=>new URL(r.name,location.href).origin===location.origin);
  let renderer=null;try{const gl=window.viewer?.renderer?.getContext(),extension=gl?.getExtension('WEBGL_debug_renderer_info');renderer=gl?{version:gl.getParameter(gl.VERSION),renderer:extension?gl.getParameter(extension.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)}:null;}catch{}
  return {url:location.href,title:document.title,viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},horizontalOverflow:document.documentElement.scrollWidth>innerWidth+1,
    firstPartyRequests:own.length,firstPartyEncodedBytes:own.reduce((s,r)=>s+r.encodedBodySize,0),firstPartyDecodedBytes:own.reduce((s,r)=>s+r.decodedBodySize,0),
    domContentLoadedMs:nav?.domContentLoadedEventEnd,lcpMs:globalThis.__observatoryAudit?.lcp,longTasks:globalThis.__observatoryAudit?.longTasks || [],
    catalogueRelease:document.documentElement.dataset.catalogueRelease || null,catalogueObjects:window.databaseInstance?.allData.length || null,
    sky:document.getElementById('education-sky')?{...document.getElementById('education-sky').dataset}:null,planetRenderer:document.getElementById('viewer-container')?.dataset.renderer || null,webgl:renderer,
    sharedTheme:!!document.querySelector('link[href*="observatory-experience.css"]'),
    assetVersions:[...new Set([...document.querySelectorAll('script[src],link[rel="stylesheet"][href]')].map(el=>new URL(el.src || el.href,location.href).searchParams.get('v')).filter(Boolean))],
    brokenImages:[...document.images].filter(image=>image.complete && image.naturalWidth===0 && image.currentSrc).map(image=>image.currentSrc),readyState:document.readyState};
});}
async function screenshot(page,name){const relative=`screenshots/${name}.png`,target=path.join(out,relative);await page.screenshot({path:target,animations:'disabled'});const bytes=await fs.readFile(target);return {path:relative,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};}
async function gif(page,name){
  const frameDir=path.join(out,'frames',name);await fs.mkdir(frameDir,{recursive:true});const start=performance.now(),times=[];
  for(let i=0;i<24;i++){const wait=start+i*200-performance.now();if(wait>0)await page.waitForTimeout(wait);times.push(performance.now()-start);await page.screenshot({path:path.join(frameDir,`${String(i).padStart(3,'0')}.png`)});}
  await fs.mkdir(path.join(out,'animations'),{recursive:true});const relative=`animations/${name}.gif`;
  const filter='[0:v]scale=960:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=sierra2_4a';
  const result=spawnSync(ffmpeg,['-hide_banner','-loglevel','error','-y','-framerate','5','-i',path.join(frameDir,'%03d.png'),'-filter_complex',filter,'-loop','0',path.join(out,relative)],{encoding:'utf8',windowsHide:true,timeout:90000});
  if(result.status!==0)throw new Error(`GIF conversion failed: ${result.stderr || result.error?.message}`);
  const bytes=await fs.readFile(path.join(out,relative)),entry={name,path:relative,frames:times.length,presentationFPS:5,sampleTimesMs:times,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};report.animations.push(entry);return entry;
}
async function captureRoute(route,viewport,label,{performanceSample=false,animation=false,reduced=false,atlas=false}={}){
  const context=await newContext(viewport,reduced?'reduce':'no-preference'),page=await context.newPage(),errors=[],httpFailures=[],requestFailures=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.status()>=400 && new URL(response.url()).origin===base.origin)httpFailures.push({url:response.url(),status:response.status()});});
  page.on('requestfailed',request=>{if(['GET','HEAD'].includes(request.method()) && new URL(request.url()).origin===base.origin && request.failure()?.errorText!=='net::ERR_ABORTED')requestFailures.push({url:request.url(),error:request.failure()?.errorText});});
  const entry={route,label,status:'running',errors,httpFailures,requestFailures};report.pages.push(entry);
  try{
    const url=new URL(route,base);if(!production && route==='education.html')url.searchParams.set('skyDate','2026-09-27');
    const response=await page.goto(url.href,{waitUntil:'domcontentloaded',timeout:45000});entry.httpStatus=response?.status();if(!response?.ok())throw new Error(`Page HTTP ${entry.httpStatus}`);
    await settle(page,route);
    if(atlas){await page.locator('[data-atlas-trigger]:visible,#menu-toggle:visible').first().click();await page.waitForTimeout(500);}
    if(performanceSample){entry.frameSamples=[];for(let i=0;i<3;i++)entry.frameSamples.push(await frameSample(page));}
    entry.facts=await pageFacts(page);entry.screenshot=await screenshot(page,label);
    if(animation && !noGif)entry.animation=await gif(page,label);
    if(!production && route==='education.html' && !reduced && viewport.width>800){await page.locator('#education-m31-candidate').click();await page.waitForTimeout(500);entry.m31Screenshot=await screenshot(page,'education-m31-evidence-limit');}
    const issues=[...errors,...httpFailures.map(f=>`HTTP ${f.status}: ${f.url}`),...requestFailures.map(f=>f.error+': '+f.url)];
    if(entry.facts.horizontalOverflow)issues.push('Horizontal document overflow');
    const destination=new URL(entry.facts.url);
    const expectedStarsectorHandoff=route==='starsector.html' && destination.origin==='https://adybag14-cyber.github.io' && destination.pathname==='/starsectorquick/launch.html' && destination.searchParams.get('autostart')==='1';
    if(destination.origin!==base.origin && !expectedStarsectorHandoff)issues.push('Unexpected cross-origin navigation');
    if(expectedStarsectorHandoff)entry.externalHandoff={expected:true,url:destination.href,scope:'Separately hosted StarsectorQuick application; its theme is not owned by this site build.'};
    if(!production && !entry.facts.sharedTheme && !expectedStarsectorHandoff)issues.push('Shared theme missing from public page');
    entry.status=issues.length?'failed':'passed';entry.issues=issues;if(issues.length)report.failures.push({label,issues});
  }catch(error){entry.status='failed';entry.issues=[error.message];report.failures.push({label,issues:[error.message]});try{entry.screenshot=await screenshot(page,label+'-failure');}catch{}}
  finally{await context.close();await writeReport();console.log(JSON.stringify({label,status:entry.status,issues:entry.issues}));}
}
async function writeReport(){
  report.finishedAt=new Date().toISOString();await fs.writeFile(path.join(out,'metrics.json'),JSON.stringify(report,null,2)+'\n');
  const cards=report.pages.map(p=>`<article><h2>${escape(p.label)} <small>${escape(p.status)}</small></h2><p>${escape(p.route)} · ${p.facts?.viewport.width || '?'} px${p.facts?.catalogueRelease?' · '+escape(p.facts.catalogueRelease):''}</p>${p.screenshot?`<a href="${escape(p.screenshot.path)}"><img src="${escape(p.screenshot.path)}" loading="lazy" alt="${escape(p.label)} screenshot"></a>`:''}${p.animation?`<details><summary>Play sampled animation (5 fps GIF, not benchmark)</summary><img src="${escape(p.animation.path)}" loading="lazy" alt="${escape(p.label)} sampled animation"></details>`:''}${p.m31Screenshot?`<details><summary>Andromeda evidence-limit view</summary><img src="${escape(p.m31Screenshot.path)}" loading="lazy" alt="Andromeda candidate evidence limitation"></details>`:''}${p.issues?.length?`<pre>${escape(p.issues.join('\n'))}</pre>`:''}${p.frameSamples?`<p>Independent RAF p95: ${p.frameSamples.map(s=>s.p95Ms?.toFixed(1)+' ms').join(' / ')}. GPU frame counters, raw intervals and hardware labels are in metrics.json.</p>`:''}</article>`).join('');
  const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Observatory visual evidence</title><style>body{margin:0;background:#080f1c;color:#dfeaf5;font:14px/1.6 system-ui,sans-serif}header,main{max-width:1560px;margin:auto;padding:28px}h1{font-size:30px}a{color:#9fe4ef}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(440px,100%),1fr));gap:24px}article{border:1px solid #345063;border-radius:14px;padding:18px;background:#101d2d;min-width:0}h2{font-size:18px;margin:0}small{font-size:12px;color:#d5c18c}img{display:block;width:100%;height:auto;border-radius:8px;margin:12px 0}pre{white-space:pre-wrap;overflow-wrap:anywhere;color:#f0bda4;font-size:12px}summary{cursor:pointer;padding:10px 0}p{overflow-wrap:anywhere;color:#adc6d8}</style><header><h1>Observatory visual evidence</h1><p>${escape(report.kind)} · ${escape(report.startedAt)} · ${report.pages.length} views · ${report.failures.length} failing checks</p><p><a href="metrics.json">Raw metrics, source version, frame intervals and errors</a></p><p>${escape(report.interpretation)}</p><p>Fresh unauthenticated browser. GET/HEAD/OPTIONS only; no submitted forms or production writes. PNGs freeze decorative animations; GIFs retain motion. Images are review evidence, not proof of scientific correctness.</p></header><main>${cards}</main></html>`;
  await fs.writeFile(path.join(out,'index.html'),html);
}
try{
  const desktop={width:1440,height:950},mobile={width:390,height:844};
  await captureRoute('index.html',desktop,'home-desktop',{performanceSample:true,animation:true});
  await captureRoute('database.html',desktop,'database-desktop');
  await captureRoute('education.html',desktop,'education-desktop',{performanceSample:true,animation:true});
  await captureRoute('index.html',desktop,'systems-atlas',{atlas:true});
  for(const route of ['index.html','database.html','education.html'])await captureRoute(route,mobile,idFor(route)+'-mobile');
  await captureRoute('education.html',desktop,'education-reduced-motion',{performanceSample:true,reduced:true});
  if(allPages)for(const item of SITE_PAGES){if(!['index.html','database.html','education.html'].includes(item.path))await captureRoute(item.path,desktop,'page-'+idFor(item.path));}
}finally{await browser.close();await writeReport();}
console.log(JSON.stringify({out,pages:report.pages.length,gifs:report.animations.length,failures:report.failures.length}));
if(report.failures.length)process.exitCode=1;
