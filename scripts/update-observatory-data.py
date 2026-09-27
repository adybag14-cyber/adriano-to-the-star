#!/usr/bin/env python3
"""Refresh public snapshots explicitly; normal site builds are offline.

python scripts/update-observatory-data.py --refresh --cache-dir <directory>
A failed request/schema check cannot advance data/observatory/current.json.
The HYG derivative is CC BY-SA 4.0; see data/sky/NOTICE.md.
"""
from __future__ import annotations
import argparse
from collections import Counter
import concurrent.futures
import csv
from datetime import datetime, timezone
import gzip
import hashlib
import io
import json
import math
import os
from pathlib import Path
import time
import urllib.parse
import urllib.request
from observatory_data import COLUMNS, counts, merge_records, number

ROOT=Path(__file__).resolve().parents[1]
PS_COLUMNS='pl_name,hostname,hip_name,ra,dec,sy_dist,sy_disterr1,sy_disterr2,disc_facility,disc_telescope,disc_instrument,disc_year,discoverymethod,pl_rade,pl_radeerr1,pl_radeerr2,pl_radelim,pl_bmasse,pl_bmasseerr1,pl_bmasseerr2,pl_bmasselim,pl_bmassprov,pl_orbper,pl_orbpererr1,pl_orbpererr2,pl_orbperlim,pl_orbsmax,pl_orbsmaxerr1,pl_orbsmaxerr2,pl_orbsmaxlim,pl_controv_flag,pl_refname,disc_refname,rowupdate'
KOI_COLUMNS='kepid,kepoi_name,kepler_name,koi_disposition,koi_score,koi_prad,koi_prad_err1,koi_prad_err2,koi_period,koi_period_err1,koi_period_err2,ra,dec'
def tap(query):
    return 'https://exoplanetarchive.ipac.caltech.edu/TAP/sync?'+urllib.parse.urlencode({'query':query,'format':'json'})
SOURCES={
    'nasa-ps':{'name':'NASA Exoplanet Archive: Planetary Systems default solutions','url':tap('select '+PS_COLUMNS+' from ps where default_flag=1 order by pl_name'),'home':'https://exoplanetarchive.ipac.caltech.edu/','file':'ps.json','format':'json','minRows':5000,'scope':'All discovery facilities, not just NASA missions. One self-contained default solution per planet.','doi':'10.26133/NEA12'},
    'nasa-koi':{'name':'NASA cumulative Kepler Objects of Interest','url':tap('select '+KOI_COLUMNS+' from cumulative order by kepoi_name'),'home':'https://exoplanetarchive.ipac.caltech.edu/','file':'koi.json','format':'json','minRows':9000,'scope':'Confirmed objects, candidates and false positives retained separately.'},
    'exoplanet-eu':{'name':'Paris Observatory: Extrasolar Planets Encyclopaedia','url':'https://exoplanet.eu/catalog/csv/','home':'https://exoplanet.eu/catalog/','file':'eu.csv','format':'csv','minRows':5000,'scope':'The official CSV export currently defaults to Confirmed entries. The archive uses a broader substellar mass inclusion criterion than NASA; this is not an interchangeable confirmed-planet census.','license':'CC BY 4.0'},
    'hyg':{'name':'HYG 4.2 by David Nash / Astronomy Nexus','url':'https://www.astronexus.com/downloads/catalogs/hygdata_v42.csv.gz','home':'https://www.astronexus.com/projects/hyg','file':'hyg42.csv.gz','format':'csv.gz','minRows':110000,'scope':'Hipparcos, Yale Bright Star and Gliese compilation; J2000 epoch/equinox.','license':'CC BY-SA 4.0'},
}
def packed(value): return (json.dumps(value,ensure_ascii=False,separators=(',',':'),allow_nan=False)+'\n').encode('utf-8')
def sha(data): return hashlib.sha256(data).hexdigest()
def write_json(path,value): path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(packed(value))
def download(source,cache,reuse):
    path=cache/source['file'];meta_path=path.with_name(path.name+'.meta.json')
    if not reuse or not path.exists():
        last=None
        for attempt in range(3):
            try:
                req=urllib.request.Request(source['url'],headers={'User-Agent':'AdrianoObservatory/1.0 (+https://adrianotothestar.com)'})
                with urllib.request.urlopen(req,timeout=100) as response:
                    payload=response.read(64*1024*1024+1)
                    if len(payload)>64*1024*1024:raise ValueError('Upstream source exceeds 64 MiB safety budget')
                tmp=path.with_name(path.name+'.partial');tmp.write_bytes(payload);os.replace(tmp,path)
                write_json(meta_path,{'url':source['url'],'retrievedAt':datetime.now(timezone.utc).isoformat(),'sha256':sha(payload)})
                break
            except Exception as exc:
                last=exc
                if attempt==2:raise RuntimeError('Source download failed: '+source['name']) from last
                time.sleep(2**attempt)
    payload=path.read_bytes()
    meta=json.loads(meta_path.read_text()) if meta_path.exists() else {'url':source['url'],'retrievedAt':datetime.fromtimestamp(path.stat().st_mtime,timezone.utc).isoformat(),'sha256':sha(payload)}
    if meta['url'] != source['url'] or meta['sha256'] != sha(payload):raise ValueError('Cache metadata mismatch: '+path.name)
    raw=gzip.decompress(payload) if source['format']=='csv.gz' else payload
    if len(raw)>100*1024*1024:raise ValueError('Decompressed source too large')
    rows=json.loads(raw) if source['format']=='json' else list(csv.DictReader(io.StringIO(raw.decode('utf-8-sig'))))
    if not isinstance(rows,list) or not source['minRows']<=len(rows)<=200000:raise ValueError('Unexpected row count for '+source['name'])
    print(source['name'],len(rows),'rows',len(payload),'bytes',flush=True)
    return rows,payload,meta

def engine_ids():
    root=ROOT/'data/exoplanet-engine';pointer=json.loads((root/'current.json').read_text());manifest_path=root/pointer['manifest']['path'];manifest=json.loads(manifest_path.read_text());ids=set()
    for spec in manifest['shards'].values():
        shard=json.loads((manifest_path.parent/spec['path']).read_text());ids.update(shard['entries'])
    return ids

def build_stars(rows,source):
    stars=[];known=0;directions=0
    solar_row=next((r for r in rows if number(r.get('id'))==0 and r.get('proper')=='Sol'),None)
    if not solar_row or number(solar_row.get('absmag')) is None:raise ValueError('HYG solar reference photometry is missing')
    solar_reference={'id':0,'name':'Sun','absoluteMagnitudeV':number(solar_row['absmag']),'bv':number(solar_row.get('ci')),'source':'HYG 4.2 row 0 (Sol)','role':'Unresolved background star for extrasolar observers only; Solar System foreground solar disk is not part of this stellar layer.'}
    for r in rows:
        ident=number(r.get('id'));mag=number(r.get('mag'));dist=number(r.get('dist'),positive=True)
        if ident is None or ident==0 or mag is None:continue  # Sun is handled by the planetary scene.
        good=dist is not None and dist<100000
        if mag>7 and not (good and dist<=30):continue
        ra=number(r.get('ra'));dec=number(r.get('dec'))
        if ra is None or dec is None or not 0<=ra<24 or not -90<=dec<=90:raise ValueError('Invalid HYG angular coordinates')
        a=math.radians(ra*15);d=math.radians(dec)
        if good:
            xyz=[number(r.get(k)) for k in ('x','y','z')]
            vel=[number(r.get(k)) or 0 for k in ('vx','vy','vz')]
            if any(x is None for x in xyz):raise ValueError('Missing HYG position vector')
            if abs(math.sqrt(sum(x*x for x in xyz))-dist)>max(.02,dist*.001):raise ValueError('HYG vector/distance mismatch')
            known+=1
        else:
            # Direction-only objects may be displayed near the Sun, but NEVER translated as if 100000 pc were a measurement.
            xyz=[math.cos(d)*math.cos(a),math.cos(d)*math.sin(a),math.sin(d)];vel=[0,0,0];directions+=1
        stars.append([ident,number(r.get('hip')),r.get('proper') or r.get('bf') or ('HIP '+r['hip'] if r.get('hip') else 'HYG '+str(ident)),
                      *[round(x,9) for x in xyz],*[round(v,12) for v in vel],mag,number(r.get('ci')),good,round(ra*15,9),dec,
                      number(r.get('pmra')) or 0,number(r.get('pmdec')) or 0])
    stars.sort(key=lambda s:s[0])
    result={'schemaVersion':1,'epoch':2000,'frame':'J2000 equatorial axes; heliocentric approximation to ICRS','positionUnit':'pc','velocityUnit':'pc/year',
            'columns':['id','hip','name','x','y','z','vx','vy','vz','mag','bv','distanceKnown','raDeg','decDeg','pmRaMasYr','pmDecMasYr'],
            'selection':{'apparentVMax':7,'nearbyDistancePcMax':30,'knownDistanceRows':known,'directionOnlyRows':directions},
            'source':source,'license':'CC BY-SA 4.0','rows':stars,'solarReference':solar_reference,
            'limitations':['Magnitude-limited as seen from the Sun; incomplete from exoplanets and not a catalogue of local Andromeda stars.',
                          'HYG distances and radial velocities have heterogeneous uncertainties; the compilation is not error-free.',
                          'Linear catalogue velocities omit gravitational acceleration, light-time reconstruction, extinction changes and stellar variability.',
                          'Unknown or dubious parallax (HYG distance >=100000 pc) is retained only as an Earth-direction entry, not a measured 3D position.']}
    if len(packed(result))>4.8*1024*1024:raise ValueError('Bright-star snapshot exceeds mirror budget')
    return result

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--refresh',action='store_true');parser.add_argument('--reuse-cache',action='store_true');parser.add_argument('--cache-dir',type=Path,default=ROOT/'.cache/observatory');args=parser.parse_args()
    if not args.refresh:raise SystemExit('Refresh is opt-in. Use --refresh; regular builds only validate checked-in snapshots.')
    args.cache_dir.mkdir(parents=True,exist_ok=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        loaded=dict(zip(SOURCES,pool.map(lambda s:download(s,args.cache_dir,args.reuse_cache),SOURCES.values())))
    # Required fields and source scopes fail closed, never turn candidates into confirmed rows.
    for key,required in [('nasa-ps',{'pl_name','pl_rade','pl_controv_flag'}),('nasa-koi',{'kepoi_name','koi_disposition','koi_prad'}),('exoplanet-eu',{'name','planet_status','alternate_names'})]:
        rows=loaded[key][0]
        if not required.issubset(rows[0]):raise ValueError('Source schema changed: '+key)
    supplement=json.loads((ROOT/'data/observatory/supplements.json').read_text(encoding='utf-8'))
    rows,details,observers,ambiguities=merge_records(loaded['nasa-koi'][0],loaded['nasa-ps'][0],loaded['exoplanet-eu'][0],supplement['records'],engine_ids())
    sources={key:{k:v for k,v in spec.items() if k not in ('minRows','file','format')}|loaded[key][2]|{'rows':len(loaded[key][0])} for key,spec in SOURCES.items()}
    sources['exoplanet-eu-candidate']={'name':'Paris Observatory: individually reviewed M31 candidate','home':'https://exoplanet.eu/catalog/pa_99_n2_b--556/','url':'https://exoplanet.eu/catalog/pa_99_n2_b--556/','retrievedAt':supplement['reviewedAt'],'scope':'One explicitly identified candidate; not a census of all Paris candidates.','license':'CC BY 4.0'}
    generated=max(loaded[key][2]['retrievedAt'] for key in loaded)
    digest=sha(packed({'sources':sources,'code':sha((ROOT/'scripts/observatory_data.py').read_bytes()),'builder':sha(Path(__file__).read_bytes()),'supplements':supplement,'engine':sha((ROOT/'data/exoplanet-engine/current.json').read_bytes())}))[:16]
    release=generated[:10]+'-'+digest;target=ROOT/'data/observatory/releases'/release;target.mkdir(parents=True,exist_ok=True)
    manifest={'schemaVersion':1,'releaseId':release,'generatedAt':generated,'columns':COLUMNS,'sources':{k:v for k,v in sources.items() if k!='hyg'},'statistics':counts(rows),'parts':[],'details':{},'unresolvedAliasAmbiguities':ambiguities,
              'policy':{'identity':'Exact planet name or listed planet alias, never just host name/KEPID. Ambiguous aliases remain separate.','parameters':'One adopted source solution: NASA PS default when available; otherwise the original source. No silent cross-source filling.','status':'Conflicting source dispositions are DISPUTED, not automatically CONFIRMED.','units':{'radius':'Earth equatorial radius','mass':'Earth mass parameter','distancePc':'parsec'},'counts':'Catalogue entries, including candidates, false positives and high-mass substellar entries. Not an interchangeable census of confirmed planets.'}}
    for i in range(0,len(rows),4000):
        name=f'catalogue-{i//4000:02}.json';data=packed({'rows':[[row.get(c) for c in COLUMNS] for row in rows[i:i+4000]]});(target/name).write_bytes(data)
        manifest['parts'].append({'path':name,'sha256':sha(data),'bytes':len(data),'rows':len(rows[i:i+4000])})
    for bucket in range(32):
        name=f'evidence-{bucket:02}.json';records={r['id']:details[r['id']] for r in rows if r['detailBucket']==bucket};data=packed({'records':records});(target/name).write_bytes(data)
        manifest['details'][str(bucket)]={'path':name,'sha256':sha(data),'bytes':len(data)}
    # Retain the exact compressed upstream inputs for catalogue reproducibility.
    rawdir=target/'sources';rawdir.mkdir(exist_ok=True)
    for key in ('nasa-ps','nasa-koi','exoplanet-eu'):
        raw=loaded[key][1];compressed=gzip.compress(raw,compresslevel=9,mtime=0);name=key+('.csv.gz' if key=='exoplanet-eu' else '.json.gz');(rawdir/name).write_bytes(compressed)
        manifest['sources'][key]['snapshot']={'path':'sources/'+name,'sha256':sha(compressed),'rawSha256':sha(raw),'bytes':len(compressed)}
    manifest_data=packed(manifest);(target/'manifest.json').write_bytes(manifest_data)
    sky=ROOT/'data/sky';sky.mkdir(parents=True,exist_ok=True)
    stars=build_stars(loaded['hyg'][0],sources['hyg']);star_data=packed(stars);(sky/'bright-nearby-v1.json').write_bytes(star_data)
    observer_data={'schemaVersion':1,'columns':['name','aliases','host','raDeg','decDeg','distancePc','status','hip','source','id'],'catalogueRelease':release,'rows':observers,
                   'limitations':'Host coordinates use one complete, separately attributed source bundle (PS default when complete, otherwise a complete alternative); no per-axis mixing. They are used as a fixed catalogue location; host proper motion, unknown orbital phase and line-of-sight distance uncertainties are not reconstructed. M31 candidate distance and coarse coordinates are from its cited entry, not a precise local 3D map.'}
    (sky/'observers.json').write_bytes(packed(observer_data))
    write_json(sky/'manifest.json',{'schemaVersion':1,'stars':{'path':'bright-nearby-v1.json','sha256':sha(star_data),'bytes':len(star_data),'rows':len(stars['rows'])},'observers':{'path':'observers.json','sha256':sha(packed(observer_data)),'bytes':len(packed(observer_data))}})
    pointer={'schemaVersion':1,'releaseId':release,'manifest':{'path':'releases/'+release+'/manifest.json','sha256':sha(manifest_data)}}
    current=ROOT/'data/observatory/current.json';temporary=current.with_suffix('.tmp');temporary.write_bytes(packed(pointer));os.replace(temporary,current)
    print(json.dumps({'releaseId':release,**manifest['statistics'],'aliasAmbiguities':len(ambiguities),'starRows':len(stars['rows']),'starBytes':len(star_data),'catalogueBytes':sum(p['bytes'] for p in manifest['parts'])},indent=2))
if __name__=='__main__':main()
