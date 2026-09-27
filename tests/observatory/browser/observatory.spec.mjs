import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const pointer=JSON.parse(await fs.readFile(path.join(root,'data/observatory/current.json'),'utf8'));
const manifest=JSON.parse(await fs.readFile(path.join(root,'data/observatory',pointer.manifest.path),'utf8'));
const errors=new WeakMap();
test.beforeEach(async({page})=>{const list=[];errors.set(page,list);page.on('pageerror',error=>list.push(error.message));});
test.afterEach(async({page})=>{expect(errors.get(page),'No uncaught page exceptions').toEqual([]);});
const noOverflow=async page=>expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal document overflow').toBe(true);
async function database(page,query=''){
  await page.goto('database.html'+query,{waitUntil:'domcontentloaded'});
  await expect(page.locator('html')).toHaveAttribute('data-catalogue-release',manifest.releaseId);
  await page.waitForFunction(()=>window.databaseInstance?.allData.length>15000);
}
async function education(page){
  await page.goto('education.html?skyDate=2026-09-27',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#education-sky')).toHaveAttribute('data-ready','true');
  await expect(page.locator('#education-sky')).toHaveAttribute('data-observer','Earth');
}
async function sidebar(page){
  if(await page.locator('#education-menu-toggle').getAttribute('aria-expanded')!=='true')await page.locator('#education-menu-toggle').click();
  await expect(page.locator('#education-menu-toggle')).toHaveAttribute('aria-expanded','true');
}

test('multi-institution catalogue has exact source coverage and a usable layout',async({page})=>{
  await database(page);
  expect(await page.evaluate(()=>window.databaseInstance.allData.length)).toBe(manifest.statistics.objects);
  await expect(page.locator('#observatory-catalogue option[value="exoplanet-eu"]')).toHaveCount(1);
  await expect(page.locator('#observatory-facility option')).toHaveCount(Object.keys(manifest.statistics.facilities).length+1);
  await expect(page.locator('#observatory-catalogue-controls')).toContainText('Catalogue provider is not the discovering institution');
  await noOverflow(page);
  await expect(page.locator('.page-subtitle')).toContainText('Many observatories');
  const positions=await page.evaluate(()=>({controls:document.getElementById('observatory-catalogue-controls').getBoundingClientRect().top,results:document.getElementById('results-container').getBoundingClientRect().top}));
  expect(positions.controls).toBeLessThan(positions.results);
  expect(positions.controls).toBeLessThan(1000);
  expect(await page.locator('.planet-card').count()).toBeGreaterThan(0);
});

test('institution and discovery-facility filters survive a reload without confusing their meaning',async({page})=>{
  await database(page);
  await page.locator('#observatory-catalogue').selectOption('nasa-ps');
  await page.locator('#observatory-facility').selectOption('European Space Agency (ESA) Gaia Satellite');
  await expect.poll(()=>page.evaluate(()=>window.databaseInstance.filteredData.length)).toBe(manifest.statistics.facilities['European Space Agency (ESA) Gaia Satellite']);
  const selection=await page.evaluate(()=>window.databaseInstance.filteredData.map(r=>({name:r.kepler_name,sources:r.sources,facility:r.facility})));
  expect(selection.every(r=>r.sources.includes('nasa-ps') && r.facility.includes('Gaia'))).toBe(true);
  await expect(page).toHaveURL(/catalogue=nasa-ps/);await expect(page).toHaveURL(/facility=/);
  await page.reload({waitUntil:'domcontentloaded'});await expect(page.locator('html')).toHaveAttribute('data-catalogue-release',manifest.releaseId);
  await expect(page.locator('#observatory-facility')).toHaveValue('European Space Agency (ESA) Gaia Satellite');
  await expect.poll(()=>page.evaluate(()=>window.databaseInstance.filteredData.length)).toBe(selection.length);
  await page.locator('#reset-filters').click();
  await expect(page.locator('#observatory-catalogue')).toHaveValue('all');await expect(page.locator('#observatory-facility')).toHaveValue('all');
});

test('new records open cited evidence, not an invented 3D reconstruction',async({page})=>{
  await database(page,'?catalogue=nasa-ps&facility='+encodeURIComponent('European Space Agency (ESA) Gaia Satellite'));
  const card=page.locator('.planet-card').first();await card.scrollIntoViewIfNeeded();
  await expect(card.getByRole('button',{name:/View evidence/})).toBeVisible();
  await card.getByRole('button',{name:/View evidence/}).click();
  const dialog=page.locator('#observatory-evidence-dialog');await expect(dialog).toBeVisible();
  await expect(dialog.locator('.observatory-solution')).not.toHaveCount(0);
  await expect(dialog).toContainText('original units');await expect(dialog).toContainText('Gaia');
  await expect(dialog).toContainText('does not establish a surface map');
  await dialog.getByRole('button',{name:'Close',exact:true}).click();await expect(dialog).toHaveCount(0);
  await noOverflow(page);
});

test('Kepler host siblings and upper-case companions remain different records',async({page})=>{
  await database(page);
  const result=await page.evaluate(()=>{
    const db=window.databaseInstance;const b=db.findPlanet('K00072.01'),c=db.findPlanet('K00072.02');
    const hd=db.allData.find(r=>r.kepler_name==='HD 3651 b');const companion=db.allData.find(r=>r.kepler_name==='54 Psc c');
    return {siblings:b && c && db.recordKey(b)!==db.recordKey(c),sameHost:b?.kepid===c?.kepid,companions:!!hd && !!companion && db.recordKey(hd)!==db.recordKey(companion)};
  });
  expect(result).toEqual({siblings:true,sameHost:true,companions:true});
});

test('source disagreement and Andromeda candidate classifications are retained',async({page})=>{
  await database(page);
  await page.locator('#filter-status').selectOption('DISPUTED');
  await expect.poll(()=>page.evaluate(()=>window.databaseInstance.filteredData.length)).toBe(manifest.statistics.sourceDisagreements);
  expect(await page.evaluate(()=>window.databaseInstance.allData.find(r=>r.kepler_name==='PA-99-N2 b')?.status)).toBe('CANDIDATE');
  await page.locator('#reset-filters').click();
  await page.locator('#observatory-catalogue').selectOption('exoplanet-eu-candidate');
  await expect.poll(()=>page.evaluate(()=>window.databaseInstance.filteredData.length)).toBe(1);
  await expect(page.locator('.planet-card').first()).toContainText('CANDIDATE');
});

test('unverifiable catalogue visibly degrades to the older Kepler snapshot',async({page})=>{
  await page.route('**/data/observatory/current.json*',route=>route.fulfill({status:503,body:'Unavailable'}));
  await page.goto('database.html',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#observatory-catalogue-controls')).toContainText('Limited catalogue');
  await expect.poll(()=>page.evaluate(()=>window.databaseInstance?.allData.length || 0)).toBe(9564);
  await expect(page.locator('.planet-card').first()).toBeVisible();await noOverflow(page);
});

test('observer sky is catalogue-based, translates between Solar planets, and stays geometrically stable while Earth spins',async({page})=>{
  await education(page);await sidebar(page);
  await expect(page.locator('#ita-cosmic-field')).toHaveCount(0);
  const before=await page.locator('#education-sky').getAttribute('data-projections');
  await page.waitForTimeout(450);expect(await page.locator('#education-sky').getAttribute('data-projections')).toBe(before);
  const earth=await page.evaluate(()=>window.educationSky.result.visible.slice(0,20).map(s=>s.direction));
  for(const planet of ['Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune']){
    await page.locator(`[data-education-planet="${planet}"]`).click();
    await expect(page.locator('#education-sky')).toHaveAttribute('data-observer',planet);
    expect(Number(await page.locator('#education-sky').getAttribute('data-star-count'))).toBeGreaterThan(3000);
  }
  const neptune=await page.evaluate(()=>window.educationSky.result.visible.slice(0,20).map(s=>s.direction));expect(neptune).not.toEqual(earth);
  await noOverflow(page);
});

test('exoplanet host sky uses an explicit complete coordinate source',async({page})=>{
  await education(page);await sidebar(page);
  await page.locator('[data-education-planet="TRAPPIST-1 e"]').click();
  await expect(page.locator('#education-sky')).toHaveAttribute('data-observer','TRAPPIST-1 e');
  await expect(page.locator('#education-sky')).toHaveAttribute('data-model','host-location');
  expect(await page.evaluate(()=>window.educationSky.observer.source)).toBe('exoplanet-eu');
  expect(await page.evaluate(()=>window.educationSky.result.excludedUnknownDistance)).toBeGreaterThan(0);
});

test('M31 candidate view exposes missing local data rather than a fictional observed sky',async({page})=>{
  await education(page);await sidebar(page);await page.locator('#education-m31-candidate').click();
  await expect(page.locator('#education-sky')).toHaveAttribute('data-model','extragalactic-hypothesis');
  await expect(page.locator('#education-sky')).toHaveAttribute('data-star-count','0');
  await expect(page.locator('.education-sky-limit')).toContainText('candidate, not a confirmed');
  await expect(page.locator('.education-sky-limit')).toContainText('missing local observations');
  const panel=await page.locator('.education-sky-limit').boundingBox();
  expect(panel.y).toBeGreaterThanOrEqual(0);expect(panel.y+panel.height).toBeLessThanOrEqual(page.viewportSize().height);
  await expect(page.locator('#viewer-container')).toHaveAttribute('aria-label',/candidate PA-99-N2 b/);
  await expect(page.locator('#data-overlay')).toBeHidden();
  await page.locator('[data-education-planet="Earth"]').click();
  await expect(page.locator('.education-sky-limit')).toBeHidden();await expect(page.locator('#data-overlay')).toBeVisible();
});

test('reduced motion stops automatic GPU rendering but responds to observer and orientation controls',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await education(page);await sidebar(page);
  await page.waitForTimeout(1500);
  const before=await page.evaluate(()=>({gpu:window.viewer.renderedFrames,sky:window.educationSky.frameCount,projections:window.educationSky.projectCount}));
  await page.waitForTimeout(700);
  const after=await page.evaluate(()=>({gpu:window.viewer.renderedFrames,sky:window.educationSky.frameCount,projections:window.educationSky.projectCount}));
  expect(after).toEqual(before);await expect(page.locator('#observatory-motion')).toHaveText('Reduced motion');
  await page.locator('#education-sky-controls summary').click();
  await page.getByRole('button',{name:'Look left',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>window.educationSky.frameCount)).toBeGreaterThan(after.sky);
  await page.locator('#sky-date').fill('2025-01-01');await page.locator('#sky-date').dispatchEvent('change');
  await expect(page.locator('#education-sky-status')).toContainText('2025-01-01');
});

test('explicit pause persists across home and education without changing system settings',async({page})=>{
  await page.goto('index.html',{waitUntil:'domcontentloaded'});
  await expect(page.locator('.observatory-orbital-frame')).toHaveCount(1);
  await expect(page.locator('#minimize-player')).toHaveAttribute('aria-expanded','false');
  await page.locator('#observatory-motion').click();await expect(page.locator('html')).toHaveAttribute('data-motion-paused','true');
  await education(page);await expect(page.locator('#observatory-motion')).toHaveText('Resume motion');
  await page.locator('#observatory-motion').click();await expect(page.locator('html')).toHaveAttribute('data-motion-paused','false');
  await noOverflow(page);
});

test('missing sky assets produce a clear evidence failure, never a random-star fallback',async({page})=>{
  await page.route('**/data/sky/bright-nearby-v1.json*',route=>route.fulfill({status:503,body:'Unavailable'}));
  await page.goto('education.html',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#education-sky')).toHaveAttribute('data-ready','error');
  await expect(page.locator('#education-sky-status')).toContainText('No synthetic stars substituted');
  await expect(page.locator('#ita-cosmic-field')).toHaveCount(0);
});

test('software renderer retains the same catalogue sky when WebGL is unavailable',async({page})=>{
  await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){if(['webgl','webgl2','experimental-webgl'].includes(type))return null;return original.call(this,type,...args);};});
  await education(page);await expect(page.locator('#viewer-container')).toHaveAttribute('data-renderer','cpu-textured');
  await expect(page.locator('#viewer-container')).toHaveAttribute('data-surface-ready','true');
  expect(Number(await page.locator('#education-sky').getAttribute('data-star-count'))).toBeGreaterThan(3000);
});


test('numeric planet designators do not match unrelated longer KOI aliases',async({page})=>{
  await database(page);
  await page.locator('#planet-search').fill('Kepler-227');
  await expect(page.locator('.planet-card')).toHaveCount(2);
  expect(await page.locator('.planet-card').evaluateAll(nodes=>nodes.map(n=>n.dataset.recordId).sort())).toEqual(['K00752.01','K00752.02']);
  await page.locator('#planet-search').fill('Kepl');
  await expect.poll(()=>page.locator('.planet-card').count()).toBeGreaterThan(2);
  expect(await page.locator('.planet-card .planet-name').evaluateAll(nodes=>nodes.every(n=>n.textContent.startsWith('Kepler')))).toBe(true);
  await page.locator('#planet-search').fill('K00752.02');
  await expect(page.locator('.planet-card')).toHaveCount(1);
  await page.locator('.planet-card').getByRole('button',{name:'Details',exact:true}).click();
  await expect(page.locator('#observatory-evidence-dialog')).toBeVisible();
  await expect(page).toHaveURL(/planet=K00752.02/);
  await page.keyboard.press('Escape');
  await expect(page.locator('#observatory-evidence-dialog')).toHaveCount(0);
  await expect(page).not.toHaveURL(/planet=/);
});


test('planet evidence and floating preferences do not obscure the mobile world or desktop sidebar',async({page})=>{
  await education(page);
  const narrow=page.viewportSize().width<=760;
  const button=page.locator('#education-details-toggle');
  if(narrow){
    await expect(button).toBeVisible();await expect(button).toHaveAttribute('aria-expanded','false');
    await expect(page.locator('#education-planet-details')).toBeHidden();
    const collapsed=await page.locator('#data-overlay').boundingBox();expect(collapsed.height).toBeLessThan(180);
    await button.click();await expect(page.locator('#planet-desc')).toBeVisible();
    await expect(button).toHaveAttribute('aria-expanded','true');await button.click();
    await sidebar(page);await expect(page.locator('#observatory-motion')).toBeHidden();
    await page.locator('#education-menu-toggle').click();await expect(page.locator('#observatory-motion')).toBeVisible();
  }else{
    await expect(button).toBeHidden();await expect(page.locator('#planet-desc')).toBeVisible();
    const controls=await page.locator('#ui-sidebar').boundingBox(),motion=await page.locator('#observatory-motion').boundingBox(),language=await page.locator('.ita-language-switcher').boundingBox();
    expect(motion.x).toBeGreaterThanOrEqual(controls.x+controls.width+8);
    expect(language.x).toBeGreaterThanOrEqual(motion.x+motion.width+8);
  }
  const motion=await page.locator('#observatory-motion').boundingBox(),language=await page.locator('.ita-language-switcher').boundingBox();
  expect(motion.y).toBeGreaterThanOrEqual(0);expect(motion.y+motion.height).toBeLessThanOrEqual(page.viewportSize().height);
  expect(motion.x+motion.width<=language.x || language.x+language.width<=motion.x).toBe(true);
  await noOverflow(page);
});
