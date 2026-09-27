import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import '../../sky-math.js';
const M=globalThis.ObservatoryAstrometry;
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');
const close=(actual,expected,tolerance=1e-12)=>assert.ok(Math.abs(actual-expected)<=tolerance,`${actual} != ${expected} ± ${tolerance}`);
const star=(extra={})=>({id:1,hip:1,name:'Test star',x:1,y:0,z:0,vx:0,vy:0,vz:0,mag:5,bv:.4,distanceKnown:true,...extra});
const decode=data=>data.rows.map(row=>Object.fromEntries(data.columns.map((c,i)=>[c,row[i]])));

test('J2000 epoch and Julian-year conversion are exact for the defined UTC approximation',()=>{
  close(M.julianDate('2000-01-01T12:00:00Z'),2451545);close(M.julianYear(2451545+365.25),2001);assert.throws(()=>M.julianDate('invalid'),RangeError);
});
test('RA degrees, declination poles and parsec lengths use a right-handed frame',()=>{
  const x=M.equatorial(0,0,3),y=M.equatorial(90,0,3),z=M.equatorial(30,90,3);
  close(x[0],3);close(y[1],3);close(z[2],3);close(M.norm(M.equatorial(218,-42,7)),7);
  assert.throws(()=>M.equatorial(360,0));assert.throws(()=>M.equatorial(0,91));assert.throws(()=>M.equatorial(0,0,0));
});
test('Kepler solve residual remains bounded for circular and eccentric elliptic cases',()=>{
  for(const e of [0,.01,.2,.7,.95,.999])for(const m of [-Math.PI,-2,-.01,0,.01,2,Math.PI]){
    const E=M.solveKepler(m,e);close(E-e*Math.sin(E),m,3e-12);
  }
  assert.throws(()=>M.solveKepler(1,1));assert.throws(()=>M.solveKepler(NaN,.1));
});
test('one AU baseline at one parsec gives one arcsecond, without acos cancellation',()=>{
  const observed=M.observeStar(star(),[0,1/M.AU_PER_PC,0],2000);
  close(observed.shiftRadians/M.DEG*3600,1,2e-11);assert.ok(observed.direction[1]<0);
  close(M.angularSeparation([1,0,0],[1,1e-12,0]),1e-12,1e-24);
});
test('stellar positions move linearly at catalogue velocities in pc/year',()=>{
  const moved=M.observeStar(star({vx:1,vy:2,vz:-1}),[0,0,0],2001);
  close(moved.distancePc,3);assert.deepEqual(moved.direction,[2/3,2/3,-1/3]);
});
test('distance modulus dims a star by five magnitudes at ten times distance',()=>{
  const result=M.observeStar(star(),[-9,0,0],2000);close(result.magnitude,10);close(result.distancePc,10);
});
test('unknown distance is not a fabricated 100,000 pc coordinate',()=>{
  const source=star({distanceKnown:false,raDeg:0,decDeg:0,pmRaMasYr:100,pmDecMasYr:0});
  assert.equal(M.observeStar(source,[1,0,0],2000),null);
  const earth=M.observeStar(source,[0,1/M.AU_PER_PC,0],2010);
  assert.equal(earth.directionOnly,true);assert.equal(earth.distancePc,null);close(earth.magnitude,5);assert.ok(earth.direction[1]>0);
});
test('coincident source/observer positions are safely excluded',()=>{
  assert.equal(M.observeStar(star(),[1,0,0],2000),null);
  assert.throws(()=>M.observeStar(star(),[NaN,0,0],2000));
});
test('solar approximation rejects unknown planets and out-of-range dates',()=>{
  assert.throws(()=>M.solarPosition('Pluto',M.J2000));assert.throws(()=>M.solarPosition('Earth',M.julianDate('2100-01-01')));
  for(const name of Object.keys(M.elements))assert.ok(M.solarPosition(name,M.J2000).every(Number.isFinite));
});
test('all eight observer positions match independent JPL Horizons fixtures within declared educational tolerances',async t=>{
  const fixture=JSON.parse(await fs.readFile(path.join(here,'fixtures/horizons.json'),'utf8'));
  assert.equal(fixture.records.length,8);assert.equal(fixture.timeScale,'TDB');assert.equal(fixture.origin,'Sun centre 500@10');
  // Conservative vector tolerances from JPL's published Table-1 longitude,
  // latitude and radial-error scales. These are NOT ephemeris precision claims.
  const toleranceKm={Mercury:10000,Venus:16000,Earth:22000,Mars:100000,Jupiter:3000000,Saturn:8000000,Uranus:2500000,Neptune:1500000};
  for(const body of fixture.records){let max=0;assert.equal(body.rows.length,3);
    for(const reference of body.rows){const vector=M.solarPosition(body.name,reference.jdTdb).map(v=>v*M.AU_PER_PC);const error=M.norm(vector.map((v,i)=>v-reference.positionAU[i]))*149597870.7;max=Math.max(max,error);assert.ok(error<toleranceKm[body.name],`${body.name}: ${error} km >= ${toleranceKm[body.name]} km`);}
    t.diagnostic(`${body.name}: maximum vector difference ${max.toFixed(1)} km across 3 epochs; limit ${toleranceKm[body.name]} km`);
  }
});
test('real catalogue projection changes between Earth and Neptune without arbitrary sky rotation',async()=>{
  const stars=decode(JSON.parse(await fs.readFile(path.join(root,'data/sky/bright-nearby-v1.json'),'utf8')));
  const observers=decode(JSON.parse(await fs.readFile(path.join(root,'data/sky/observers.json'),'utf8')));
  const jd=M.julianDate('2026-09-27T12:00:00Z'),year=M.julianYear(jd);
  const earth=M.projectCatalogue(stars,M.resolveObserver('Earth',jd,observers),year);
  const neptune=M.projectCatalogue(stars,M.resolveObserver('Neptune',jd,observers),year);
  assert.ok(earth.visible.length>3000);assert.ok(neptune.visible.length>3000);
  const n=new Map(neptune.visible.map(s=>[s.id,s]));let max=0;
  for(const s of earth.visible){const other=n.get(s.id);if(other)max=Math.max(max,M.angularSeparation(s.direction,other.direction));}
  assert.ok(max/M.DEG*3600>1);assert.ok(max/M.DEG*3600<100);assert.notDeepEqual(earth.visible[0].direction,neptune.visible[0].direction);
});
test('exoplanet host view changes sightlines and excludes unknown-distance catalogue entries',async()=>{
  const stars=decode(JSON.parse(await fs.readFile(path.join(root,'data/sky/bright-nearby-v1.json'),'utf8')));
  const observers=decode(JSON.parse(await fs.readFile(path.join(root,'data/sky/observers.json'),'utf8')));
  const jd=M.J2000;const location=M.resolveObserver('TRAPPIST-1 e',jd,observers);assert.ok(location);assert.equal(location.kind,'host-location');
  const result=M.projectCatalogue(stars,location,2000);assert.ok(result.excludedUnknownDistance>0);assert.ok(result.visible.every(s=>s.direction.every(Number.isFinite)));
});
test('M31 candidate mode does not invent a local star field or promote the candidate',async()=>{
  const stars=decode(JSON.parse(await fs.readFile(path.join(root,'data/sky/bright-nearby-v1.json'),'utf8')));
  const observers=decode(JSON.parse(await fs.readFile(path.join(root,'data/sky/observers.json'),'utf8')));
  const observer=M.resolveObserver('PA-99-N2 b',M.J2000,observers);assert.equal(observer.kind,'extragalactic-hypothesis');assert.equal(observer.status,'CANDIDATE');close(M.norm(observer.position),670000,1e-8);
  const result=M.projectCatalogue(stars,observer,2000);assert.equal(result.visible.length,0);assert.ok(result.nearestMagnitude>6.5);assert.ok(result.excludedUnknownDistance>0);
});

test('the Sun is included from another star system using source absolute magnitude, not Earth apparent magnitude',async()=>{
  const catalogue=JSON.parse(await fs.readFile(path.join(root,'data/sky/bright-nearby-v1.json'),'utf8'));
  const source=catalogue.solarReference;assert.equal(source.id,0);assert.equal(source.source,'HYG 4.2 row 0 (Sol)');
  const observer={position:[10,0,0],kind:'host-location'};
  const result=M.projectCatalogue([],observer,2000,6.5,source);assert.equal(result.visible.length,1);assert.equal(result.visible[0].name,'Sun');close(result.visible[0].magnitude,source.absoluteMagnitudeV);assert.deepEqual(result.visible[0].direction,[-1,-0,-0]);
  assert.equal(M.projectCatalogue([],{position:[670000,0,0],kind:'extragalactic-hypothesis'},2000,6.5,source).visible.length,0);
  assert.equal(M.projectCatalogue([],{position:[1/M.AU_PER_PC,0,0],kind:'solar'},2000,6.5,source).visible.length,0);
});
