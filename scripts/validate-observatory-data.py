#!/usr/bin/env python3
"""Offline release verification: exact bytes, identities, source coverage and sky units.
No network request, catalogue refresh or production mutation is performed.
"""
from collections import Counter
import argparse
import gzip
import hashlib
import json
import math
from pathlib import Path
import re
from observatory_data import COLUMNS, STATUSES, counts, name_key


def fail(condition,message):
    if not condition:raise ValueError(message)

def child(root,relative):
    fail(isinstance(relative,str) and not relative.startswith(('/', '\\')) and '..' not in relative.replace('\\','/').split('/'),'Unsafe release path')
    path=(root/relative).resolve();fail(path.is_relative_to(root.resolve()),'Release escaped root');return path

def digest(path,expected=None,bytes_expected=None):
    data=path.read_bytes()
    if expected:fail(hashlib.sha256(data).hexdigest()==expected,'SHA-256 mismatch: '+str(path))
    if bytes_expected is not None:fail(len(data)==bytes_expected,'Byte count mismatch: '+str(path))
    return data

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[1]);args=parser.parse_args();root=args.root.resolve()
    base=root/'data/observatory';pointer=json.loads((base/'current.json').read_text());fail(pointer['schemaVersion']==1,'Pointer schema')
    manifest_path=child(base,pointer['manifest']['path']);manifest=json.loads(digest(manifest_path,pointer['manifest']['sha256']));release=manifest_path.parent
    fail(manifest['schemaVersion']==1 and manifest['releaseId']==pointer['releaseId'],'Manifest identity');fail(manifest['columns']==COLUMNS,'Column schema drift')
    rows=[]
    for part in manifest['parts']:
        data=json.loads(digest(child(release,part['path']),part['sha256'],part['bytes']));fail(len(data['rows'])==part['rows'],'Shard row count')
        for values in data['rows']:
            fail(len(values)==len(COLUMNS),'Invalid row width');row=dict(zip(COLUMNS,values));rows.append(row)
    fail(len({r['id'] for r in rows})==len(rows),'Duplicate object identities');fail(counts(rows)==manifest['statistics'],'Statistics do not describe the exact catalogue')
    evidence={}
    for bucket,spec in manifest['details'].items():
        data=json.loads(digest(child(release,spec['path']),spec['sha256'],spec['bytes']));fail(not(set(data['records'])&set(evidence)),'Duplicate evidence identities');evidence.update(data['records'])
        for ident in data['records']:fail(int(hashlib.sha256(ident.encode()).hexdigest()[:2],16)%32==int(bucket),'Evidence in wrong shard')
    fail(set(evidence)=={r['id'] for r in rows},'Index/evidence identity mismatch')
    for row in rows:
        fail(isinstance(row['name'],str) and 0<len(row['name'])<500,'Invalid object name');fail(row['status'] in STATUSES,'Invalid status')
        for key in ['radius','mass','distancePc','year','ra','dec','score']:
            value=row[key];fail(value is None or isinstance(value,(int,float)) and not isinstance(value,bool) and math.isfinite(value),'Invalid finite-or-null value')
        fail(row['ra'] is None or 0<=row['ra']<360,'RA outside degrees');fail(row['dec'] is None or abs(row['dec'])<=90,'Dec outside degrees')
        record=evidence[row['id']];groups=record['sources'];source_ids=[g['source'] for g in groups]
        fail(len(source_ids)==len(set(source_ids)),'Multiple distinct objects from one source collapsed: '+row['id'])
        fail(sorted(source_ids)==row['sources'],'Incorrect source memberships');fail(record['adoptedParameterSource']==row['parameterSource'],'Physical-solution provenance mismatch')
        statuses={g['status'] for g in groups};fail(row['statusConflict']==(len(statuses)>1),'Disposition conflict lost');fail(row['status']==('DISPUTED' if len(statuses)>1 else next(iter(statuses))),'Disposition was silently promoted')
        adopted=next(g for g in groups if g['source']==row['parameterSource'])
        radius=adopted['quantities'].get('radius',{});fail(radius.get('value') is not None or row['radius'] is None,'Missing radius was fabricated')
        if radius.get('limit') not in (None,0):fail(row['radius'] is None,'Limit reported as an exact radius')
        if row['koi']:fail(re.fullmatch(r'K\d{5}\.\d{2}',row['koi']) is not None and row['id']==row['koi'],'KOI identity mismatch')
    for source,spec in manifest['sources'].items():
        if 'snapshot' not in spec:continue
        raw=gzip.decompress(digest(child(release,spec['snapshot']['path']),spec['snapshot']['sha256'],spec['snapshot']['bytes']))
        fail(hashlib.sha256(raw).hexdigest()==spec['snapshot']['rawSha256'],'Raw upstream checksum mismatch')
        fail(manifest['statistics']['sourceMembership'][source]==spec['rows'],'A source object was lost/collapsed')
    sky=root/'data/sky';skymeta=json.loads((sky/'manifest.json').read_text());stars=json.loads(digest(child(sky,skymeta['stars']['path']),skymeta['stars']['sha256'],skymeta['stars']['bytes']));observers=json.loads(digest(child(sky,skymeta['observers']['path']),skymeta['observers']['sha256'],skymeta['observers']['bytes']))
    fail(stars['schemaVersion']==1 and stars['epoch']==2000 and stars['positionUnit']=='pc' and stars['velocityUnit']=='pc/year','Sky frame/units invalid')
    fail(stars['license']=='CC BY-SA 4.0','Missing derivative licence');fail(len(stars['rows'])==skymeta['stars']['rows']<=30000,'Star budget exceeded')
    fail(stars.get('solarReference',{}).get('id')==0 and math.isfinite(stars['solarReference']['absoluteMagnitudeV']),'Solar reference photometry missing')
    ids=set();known=0;directions=0
    for values in stars['rows']:
        fail(len(values)==len(stars['columns']),'Star schema mismatch');star=dict(zip(stars['columns'],values));fail(star['id'] not in ids,'Duplicate star');ids.add(star['id'])
        fail(all(math.isfinite(star[k]) for k in ['x','y','z','mag']),'Invalid star position/magnitude');distance=math.sqrt(sum(star[k]**2 for k in ['x','y','z']))
        if star['distanceKnown']:
            known+=1;fail(0<distance<100000,'Unknown parallax treated as a measured distance')
        else:directions+=1;fail(abs(distance-1)<1e-7,'Direction-only row is not a unit vector')
    fail(known==stars['selection']['knownDistanceRows'] and directions==stars['selection']['directionOnlyRows'],'Sky selection counts invalid')
    fail(observers['catalogueRelease']==manifest['releaseId'],'Observer catalogue release differs from database')
    m31=None
    for values in observers['rows']:
        observer=dict(zip(observers['columns'],values));record=evidence[observer['id']];source=next((g for g in record['sources'] if g['source']==observer['source']),None)
        fail(source is not None,'Unknown coordinate provenance');fail([observer['raDeg'],observer['decDeg'],observer['distancePc']]==[source['ra'],source['dec'],source['quantities']['distance']['value']],'Sky mixes axes or distance from different source solutions')
        if observer['name']=='PA-99-N2 b':m31=observer
    fail(m31 and m31['status']=='CANDIDATE','M31 candidate missing or silently confirmed')
    fixtures=root/'tests/observatory/fixtures/horizons.json'
    if fixtures.exists():
        fixture=json.loads(fixtures.read_text());fail(len(fixture['records'])==8,'Independent reference bodies missing')
        for body in fixture['records']:digest(child(fixtures.parent,body['path']),body['sha256'])
    print(json.dumps({'ok':True,'releaseId':manifest['releaseId'],'objects':len(rows),'sources':manifest['statistics']['sourceMembership'],'disagreements':manifest['statistics']['sourceDisagreements'],'unresolvedAliasMatches':len(manifest['unresolvedAliasAmbiguities']),'stars':len(stars['rows']),'knownDistanceStars':known,'directionOnlyStars':directions,'observerSolutions':len(observers['rows']),'policy':'offline, hash-verified, source solutions preserved'},indent=2))
if __name__=='__main__':main()
