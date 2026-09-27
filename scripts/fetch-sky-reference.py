"""Explicit independent JPL Horizons fixture refresh. Not run by ordinary CI.
Snapshots geometric heliocentric ICRF vectors in AU at three TDB epochs.
"""
import csv
from datetime import datetime,timezone
import hashlib
import io
import json
from pathlib import Path
import urllib.parse
import urllib.request

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'tests/observatory/fixtures/horizons'
OUT.mkdir(parents=True,exist_ok=True)
BODIES={'Mercury':'199','Venus':'299','Earth':'3','Mars':'499','Jupiter':'599','Saturn':'699','Uranus':'799','Neptune':'899'}
PARAMS={'format':'json','OBJ_DATA':"'NO'",'MAKE_EPHEM':"'YES'",'EPHEM_TYPE':"'VECTORS'",'CENTER':"'500@10'",'REF_PLANE':"'FRAME'",'REF_SYSTEM':"'ICRF'",'OUT_UNITS':"'AU-D'",'VEC_TABLE':"'2'",'VEC_CORR':"'NONE'",'CSV_FORMAT':"'YES'",'TIME_TYPE':"'TDB'",'TLIST_TYPE':"'JD'",'TLIST':"'2415020.5' '2451545.0' '2461311.0'"}
records=[]
for name,ident in BODIES.items():
    url='https://ssd.jpl.nasa.gov/api/horizons.api?'+urllib.parse.urlencode(PARAMS|{'COMMAND':"'"+ident+"'"})
    response=urllib.request.urlopen(url,timeout=80).read(150000)
    data=json.loads(response)
    if data.get('error'):raise ValueError(data['error'])
    result=data['result']
    if '$$SOE' not in result or '$$EOE' not in result:raise ValueError('Missing Horizons ephemeris')
    rows=[]
    for row in csv.reader(io.StringIO(result.split('$$SOE')[1].split('$$EOE')[0].strip())):
        if not row:continue
        rows.append({'jdTdb':float(row[0]),'dateTdb':row[1].strip(),'positionAU':[float(v) for v in row[2:5]],'velocityAUPerDay':[float(v) for v in row[5:8]]})
    if len(rows)!=3:raise ValueError('Expected three independent epochs')
    filename=name.lower()+'.json';(OUT/filename).write_bytes(response)
    records.append({'name':name,'targetId':ident,'url':url,'path':'horizons/'+filename,'sha256':hashlib.sha256(response).hexdigest(),'rows':rows})
    print(name,len(rows),'reference states',flush=True)
manifest={'schemaVersion':1,'source':'NASA/JPL Horizons API','retrievedAt':datetime.now(timezone.utc).isoformat(),'coordinateFrame':'ICRF equatorial','origin':'Sun centre 500@10','units':'AU and AU/day','timeScale':'TDB','corrections':'NONE; geometric','earthDefinition':'Earth–Moon barycentre (3), matching JPL approximate elements, not Earth centre (399)','records':records}
(OUT.parent/'horizons.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8',newline='\n')
