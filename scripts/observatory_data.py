"""Auditable catalogue adapters. No inferred physical values, host-level deduplication,
or live browser calls to third-party archives. Standard library only.
"""
from __future__ import annotations
import hashlib
import html
import math
import re
import unicodedata
from collections import Counter
from urllib.parse import quote, urlparse

PC_TO_LY = 3.261563777167433
RJ_TO_RE = 71492.0 / 6378.1  # IAU nominal equatorial radii, km
MJ_TO_ME = 1.2668653e17 / 3.986004e14  # IAU nominal mass parameters
STATUSES = {'CONFIRMED', 'CANDIDATE', 'FALSE POSITIVE', 'CONTROVERSIAL', 'RETRACTED', 'UNKNOWN', 'DISPUTED'}
COLUMNS = ['id','name','kepid','koi','aliases','host','status','sources','facility','method','radius','mass','massKind','distancePc','year','ra','dec','score','parameterSource','statusConflict','detailBucket','engineId','highMassEntry']

def number(value, *, positive=False):
    if value is None or isinstance(value, bool) or str(value).strip() == '':
        return None
    try:
        n = float(value)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(n) or (positive and n <= 0):
        return None
    return int(n) if n.is_integer() else n

def text(value):
    return html.unescape(re.sub(r'<[^>]*>', '', str(value or ''))).strip()

def name_key(value):
    # Deliberately conservative: preserve punctuation and component/planet letters.
    # A host match, coordinates, or a similar name is NOT an identity assertion.
    s = unicodedata.normalize('NFKC', str(value or '')).replace('\u2212', '-').replace('\u2013', '-')
    tokens = s.split()
    if tokens and re.fullmatch(r'[A-Z]{1,3}[a-z]?', tokens[-1]):
        # HD 3651 B is a stellar/substellar companion; HD 3651 b is a
        # different planet. Do not case-fold the final component designator.
        return ' '.join(tokens[:-1]).casefold() + ' ' + tokens[-1]
    return ' '.join(tokens).casefold()

def slug(value):
    return re.sub(r'[^a-z0-9]+', '-', name_key(value)).strip('-')

def status(value):
    s = str(value or '').strip().upper()
    return {'CONFIRMED PLANET':'CONFIRMED','FALSE_POSITIVE':'FALSE POSITIVE'}.get(s, s if s in STATUSES else 'UNKNOWN')

def reference(value):
    s = str(value or '')
    match = re.search(r'href\s*=\s*[\"\']?([^\s\"\'>]+)', s, re.I)
    url = html.unescape(match.group(1)) if match else None
    if url and urlparse(url).scheme not in ('https', 'http'):
        url = None
    return {'label': text(s), 'url': url}

def quantity(row, field, unit, *, err1=None, err2=None, limit=None, kind='archive-reported'):
    return {'value': number(row.get(field), positive=True), 'unit': unit,
            'plus': number(row.get(err1 or field+'err1')),
            'minus': number(row.get(err2 or field+'err2')),
            'limit': number(row.get(limit or field+'lim')), 'kind': kind}

def nasa_ps(row):
    name = text(row.get('pl_name'))
    if not name:
        raise ValueError('NASA PS row is missing pl_name')
    q = { 'radius': quantity(row,'pl_rade','R_earth'),
          'mass': quantity(row,'pl_bmasse','M_earth',kind=text(row.get('pl_bmassprov')) or 'Unknown mass provenance'),
          'distance': quantity(row,'sy_dist','pc'),
          'period': quantity(row,'pl_orbper','day'),
          'semimajorAxis': quantity(row,'pl_orbsmax','au') }
    return {'source':'nasa-ps','name':name,'aliases':[],'host':text(row.get('hostname')),
            'status':'CONTROVERSIAL' if number(row.get('pl_controv_flag')) == 1 else 'CONFIRMED',
            'facility':text(row.get('disc_facility')) or None,'telescope':text(row.get('disc_telescope')) or None,
            'instrument':text(row.get('disc_instrument')) or None,'method':text(row.get('discoverymethod')) or None,
            'year':number(row.get('disc_year')),'ra':number(row.get('ra')),'dec':number(row.get('dec')),
            'hip':text(row.get('hip_name')) or None,'updated':text(row.get('rowupdate')) or None,
            'reference':reference(row.get('pl_refname')),'discoveryReference':reference(row.get('disc_refname')),
            'url':'https://exoplanetarchive.ipac.caltech.edu/overview/'+quote(name,safe=''),
            'quantities':q,'score':None,'koi':None,'kepid':None}

def nasa_koi(row):
    koi = text(row.get('kepoi_name'))
    if not re.fullmatch(r'K\d{5}\.\d{2}', koi):
        raise ValueError('Invalid planet-level KOI identifier: '+koi)
    name=text(row.get('kepler_name')) or koi
    return {'source':'nasa-koi','name':name,'aliases':[koi] if name != koi else [],
            'host':None,'status':status(row.get('koi_disposition')),'facility':'Kepler',
            'method':'Transit','year':None,'ra':number(row.get('ra')),'dec':number(row.get('dec')),
            'updated':None,'reference':{'label':'NASA cumulative KOI table; fitted transit parameters','url':'https://exoplanetarchive.ipac.caltech.edu/docs/API_kepcandidate_columns.html'},
            'url':'https://exoplanetarchive.ipac.caltech.edu/overview/'+quote(koi,safe=''),
            'quantities':{'radius':quantity(row,'koi_prad','R_earth',err1='koi_prad_err1',err2='koi_prad_err2',kind='transit-fit'),
                          'period':quantity(row,'koi_period','day',err1='koi_period_err1',err2='koi_period_err2',kind='transit-fit'),
                          'mass':{'value':None,'unit':'M_earth','kind':'not-reported'},
                          'distance':{'value':None,'unit':'pc','kind':'not-reported'}},
            'score':number(row.get('koi_score')),'koi':koi,'kepid':number(row.get('kepid'))}

def paris(row):
    name=text(row.get('name'))
    if not name:
        raise ValueError('Paris export row is missing name')
    aliases=[text(x) for x in str(row.get('alternate_names') or '').split(',') if text(x)]
    mass_field='mass' if number(row.get('mass'),positive=True) is not None else 'mass_sini'
    return {'source':'exoplanet-eu','name':name,'aliases':aliases,'host':text(row.get('star_name')) or None,
            'status':status(row.get('planet_status')),'facility':None,'method':text(row.get('detection_type')) or None,
            'year':number(row.get('discovered')),'ra':number(row.get('ra')),'dec':number(row.get('dec')),
            'updated':text(row.get('updated')) or None,'hip':None,
            'reference':{'label':'Paris Observatory Extrasolar Planets Encyclopaedia entry','url':'https://exoplanet.eu/catalog/?f='+quote('name = "'+name+'"',safe='')},
            'url':'https://exoplanet.eu/catalog/?f='+quote('name = "'+name+'"',safe=''),
            'quantities':{
                'radius':quantity(row,'radius','R_jupiter',err1='radius_error_max',err2='radius_error_min'),
                'mass':quantity(row,mass_field,'M_jupiter',err1=mass_field+'_error_max',err2=mass_field+'_error_min',kind='Mass' if mass_field=='mass' else 'M*sin(i)'),
                'distance':quantity(row,'star_distance','pc',err1='star_distance_error_max',err2='star_distance_error_min'),
                'period':quantity(row,'orbital_period','day',err1='orbital_period_error_max',err2='orbital_period_error_min')},
            'score':None,'koi':None,'kepid':None}

def usable(q):
    # Upper/lower limits are preserved in source evidence, not passed off as exact values.
    return q.get('value') if q and q.get('limit') in (None,0) else None

def merge_records(koi_rows, ps_rows, eu_rows, supplements=(), engine_ids=()):
    records=[]; lookup={}; ambiguities=[]
    for adapter,rows in [(nasa_koi,koi_rows),(nasa_ps,ps_rows),(paris,eu_rows)]:
        for raw in rows:
            item=adapter(raw)
            keys={name_key(n) for n in [item['name'],*item['aliases']] if n}
            matches={i for key in keys for i in lookup.get(key,set())}
            same_source_collision = any(any(g['source']==item['source'] and name_key(g['name'])!=name_key(item['name']) for g in records[i]) for i in matches)
            if len(matches)>1 or same_source_collision:
                # Never glue two planets together through an ambiguous alias.
                ambiguities.append({'name':item['name'],'source':item['source'],'matches':sorted(matches)})
                matches=set()
            if matches:
                idx=next(iter(matches)); records[idx].append(item)
            else:
                idx=len(records);records.append([item])
            for key in keys: lookup.setdefault(key,set()).add(idx)
    for item in supplements:
        if name_key(item['name']) not in lookup:
            records.append([item])
    result=[]; detail={}; observers=[]; ids=set(); engines=set(engine_ids)
    for group in records:
        # Adopt one complete source solution, not an undocumented mixture of measurements.
        adopted=next((g for g in group if g['source']=='nasa-ps'),group[0])
        koi=next((g for g in group if g.get('koi')),None)
        name=adopted['name']; sources=sorted({g['source'] for g in group})
        key=koi['koi'] if koi else ('nea-'+slug(name) if 'nasa-ps' in sources else 'eu-'+slug(name)+'-'+hashlib.sha256(name_key(name).encode()).hexdigest()[:8])
        if key in ids: raise ValueError('Record identifier collision: '+key)
        ids.add(key)
        statuses=sorted({g['status'] for g in group})
        conflict=len(statuses)>1
        adopted_status='DISPUTED' if conflict else statuses[0]
        q=adopted['quantities']; radius=usable(q.get('radius')); mass=usable(q.get('mass'))
        if radius is not None and q['radius']['unit']=='R_jupiter':radius=round(radius*RJ_TO_RE,8)
        if mass is not None and q['mass']['unit']=='M_jupiter':mass=round(mass*MJ_TO_ME,8)
        aliases=sorted({n for g in group for n in [g['name'],*g.get('aliases',[])] if n != name})
        bucket=int(hashlib.sha256(key.encode()).hexdigest()[:2],16)%32
        ra=adopted.get('ra');dec=adopted.get('dec');distance=usable(q.get('distance'))
        if ra is not None and not 0<=ra<360:raise ValueError('RA outside degrees interval: '+name)
        if dec is not None and not -90<=dec<=90:raise ValueError('Declination outside degrees interval: '+name)
        data={'id':key,'name':name,'kepid':koi.get('kepid') if koi else None,'koi':koi.get('koi') if koi else None,
              'aliases':aliases,'host':adopted.get('host'),'status':adopted_status,'sources':sources,
              'facility':adopted.get('facility'),'method':adopted.get('method'),'radius':radius,'mass':mass,
              'massKind':q.get('mass',{}).get('kind'),'distancePc':distance,'year':adopted.get('year'),
              'ra':ra,'dec':dec,'score':koi.get('score') if koi else None,'parameterSource':adopted['source'],
              'statusConflict':conflict,'detailBucket':bucket,'engineId':key if key in engines else None,
              'highMassEntry':mass is not None and mass/MJ_TO_ME>13}
        result.append(data)
        detail[key]={'id':key,'name':name,'adoptedParameterSource':adopted['source'],
                     'statusConflict':conflict,'statuses':statuses,'sources':group,
                     'policy':'Exact planet names or explicitly listed planet aliases only. Source solutions remain separate; unknowns and limits are not invented or filled from unrelated rows.'}
        # Sky geometry has its own whole-source coordinate solution. A missing
        # distance in a PS physical-parameter solution must not erase a fully
        # specified, explicitly attributed position in another source.
        coordinate_sources = [adopted] + [g for g in group if g is not adopted]
        position_source = next((g for g in coordinate_sources if g.get('ra') is not None and g.get('dec') is not None and usable(g['quantities'].get('distance')) is not None), None)
        if position_source:
            observers.append([name,aliases,position_source.get('host'),position_source['ra'],position_source['dec'],usable(position_source['quantities']['distance']),adopted_status,position_source.get('hip'),position_source['source'],key])
    result.sort(key=lambda r:r['id'])
    return result,detail,observers,ambiguities

def counts(records):
    return {'objects':len(records),'statuses':dict(sorted(Counter(r['status'] for r in records).items())),
            'sourceMembership':dict(sorted(Counter(s for r in records for s in r['sources']).items())),
            'facilities':dict(sorted(Counter(r['facility'] or 'Not supplied' for r in records).items())),
            'sourceDisagreements':sum(r['statusConflict'] for r in records),
            'highMassEntries':sum(r['highMassEntry'] for r in records)}
