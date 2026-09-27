import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const root=new URL('../../',import.meta.url);
const source=await fs.readFile(new URL('database-optimized.js',root),'utf8');
// Evaluate the actual shipped class, but do not dispatch DOM ready or construct
// the UI. These tests execute its real indexing/search methods, not a copy.
const sandbox={window:{},document:{readyState:'loading',addEventListener(){},getElementById(){return null;},querySelector(){return {}; }},setTimeout(){return 0;},setInterval(){return 0;},console};
vm.runInNewContext(source+'\n;globalThis.DatabaseUnderTest=OptimizedDatabase;',sandbox,{timeout:1000});
const db=Object.create(sandbox.DatabaseUnderTest.prototype);
const pointer=JSON.parse(await fs.readFile(new URL('data/observatory/current.json',root),'utf8'));
const manifestURL=new URL('data/observatory/'+pointer.manifest.path,root);
const manifest=JSON.parse(await fs.readFile(manifestURL,'utf8'));
db.allData=[];
for(const part of manifest.parts){
  const shard=JSON.parse(await fs.readFile(new URL(part.path,manifestURL),'utf8'));
  for(const values of shard.rows){const r=Object.fromEntries(manifest.columns.map((c,i)=>[c,values[i]]));db.allData.push({record_id:r.id,kepler_name:r.name,kepoi_name:r.koi || r.id,kepid:r.kepid,host:r.host,aliases:r.aliases,sources:r.sources,facility:r.facility,discovery_method:r.method});}
}
sandbox.window.ObservatoryCatalogue={labels:{'nasa-ps':'NASA · all facilities','nasa-koi':'NASA · Kepler KOI','exoplanet-eu':'Paris Observatory'}};
db.buildSearchIndex();
const ids=query=>Array.from(db.searchUsingIndex(query),row=>row.record_id).sort();
test('actual catalogue search keeps numeric designators exact across all published aliases',()=>{
  assert.deepEqual(ids('Kepler-227'),['K00752.01','K00752.02']);
  assert.deepEqual(ids('10797460'),['K00752.01','K00752.02']);
  assert.deepEqual(ids('K00752.02'),['K00752.02']);
});
test('actual catalogue search prioritizes a planet/host name prefix over its archive label',()=>{
  const found=Array.from(db.searchUsingIndex('Kepl'));
  assert.ok(found.length>1000);
  assert.ok(found.slice(0,50).every(row=>row.kepler_name.startsWith('Kepler')));
});
test('actual catalogue search retains known aliases and institution/facility fallback',()=>{
  assert.ok(ids('KOI-752.02').includes('K00752.02'));
  assert.ok(db.searchUsingIndex('Paris').length>1000);
  const gaia=Array.from(db.searchUsingIndex('Gaia'));
  assert.ok(gaia.length>0);assert.ok(gaia.some(r=>(r.facility || '').includes('Gaia') || r.kepler_name.includes('Gaia')));
});
test('actual catalogue search handles absent, empty and unmatched input without mixing siblings',()=>{
  assert.equal(db.searchUsingIndex('').length,manifest.statistics.objects);
  assert.equal(db.searchUsingIndex(null).length,manifest.statistics.objects);
  assert.equal(db.searchUsingIndex('this-object-does-not-exist-zzzz').length,0);
  assert.notEqual(db.findPlanet('K00072.01'),db.findPlanet('K00072.02'));
});
