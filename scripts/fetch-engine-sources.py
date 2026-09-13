"""Explicit, bounded NASA/CIE source refresh. Ordinary builds never run this job.

The output is a proposed snapshot, which must be reviewed before updating the
accepted source manifest. No credentials or domain service settings are used.
"""
import concurrent.futures
import argparse
import datetime
import gzip
import hashlib
import json
import pathlib
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = None
TAP = 'https://exoplanetarchive.ipac.caltech.edu/TAP/sync'
KOI_BASE = ['kepid', 'kepoi_name', 'kepler_name', 'koi_disposition', 'koi_pdisposition',
            'koi_score', 'koi_disp_prov', 'koi_vet_date', 'koi_trans_mod', 'koi_sparprov']
KOI_NUMBERS = ['koi_prad', 'koi_period', 'koi_teq', 'koi_steff', 'koi_srad', 'koi_smass',
               'koi_sma', 'koi_depth', 'koi_ror']
KOI_COLS = KOI_BASE + [c for n in KOI_NUMBERS for c in [n, n+'_err1', n+'_err2']]
PS_BASE = ['pl_name', 'hostname', 'default_flag', 'pl_refname', 'st_refname', 'sy_refname',
           'disc_refname', 'disc_year', 'discoverymethod', 'pl_bmassprov', 'pl_controv_flag',
           'sy_snum', 'sy_pnum', 'rowupdate', 'pl_pubdate', 'releasedate', 'tran_flag', 'rv_flag']
PS_NUMBERS = ['pl_rade', 'pl_bmasse', 'pl_orbper', 'pl_orbsmax', 'pl_orbeccen', 'pl_eqt',
              'st_teff', 'st_rad', 'st_mass', 'st_lum', 'pl_trandep']
PS_COLS = PS_BASE + [c for n in PS_NUMBERS for c in [n, n+'err1', n+'err2', n+'lim']]
PS_COLS += ['sy_dist', 'sy_disterr1', 'sy_disterr2']
QUERY = {
    'koi': 'select '+','.join(KOI_COLS)+' from cumulative order by kepoi_name',
    'ps': 'select '+','.join(PS_COLS)+" from ps where pl_name like 'Kepler-%' or hostname in ('TRAPPIST-1','WASP-39','HD 189733','55 Cnc','LHS 3844','GJ 1214','TOI-700') order by pl_name,default_flag desc,pl_pubdate",
    'spectra': "select * from spectra where pl_name in ('WASP-39 b','HD 189733 b','GJ 1214 b','55 Cnc e','TRAPPIST-1 b','TRAPPIST-1 c') order by pl_name,bibcode,spec_type",
}

class SourceRedirectPolicy(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        parsed = urllib.parse.urlparse(newurl)
        if parsed.scheme != 'https' or parsed.hostname != 'exoplanetarchive.ipac.caltech.edu':
            raise ValueError('Source redirect left the approved HTTPS archive')
        return super().redirect_request(req, fp, code, msg, headers, newurl)

def fetch(item):
    name, query = item
    url = TAP+'?'+urllib.parse.urlencode({'query': query, 'format': 'json'})
    with urllib.request.build_opener(SourceRedirectPolicy()).open(url, timeout=60) as response:
        if response.url.split('/')[2] != 'exoplanetarchive.ipac.caltech.edu':
            raise ValueError('Unapproved source redirect')
        raw = response.read(64*1024*1024+1)
    if len(raw) > 64*1024*1024:
        raise ValueError('Source exceeds 64 MiB limit')
    rows = json.loads(raw)
    if not isinstance(rows, list) or not rows:
        raise ValueError('Expected a nonempty NASA table: '+name)
    required = KOI_COLS if name == 'koi' else PS_COLS if name == 'ps' else ['pl_name', 'spec_type', 'bibcode']
    if any(set(required)-set(row) for row in rows):
        raise ValueError('Unexpected source schema: '+name)
    OUT.mkdir(parents=True, exist_ok=True)
    compressed = gzip.compress(raw, compresslevel=9, mtime=0)
    (OUT/(name+'.json.gz')).write_bytes(compressed)
    return {'id': name, 'url': url, 'query': query, 'path': name+'.json.gz', 'sha256': hashlib.sha256(raw).hexdigest(),
            'compressedSha256': hashlib.sha256(compressed).hexdigest(), 'compressedBytes': len(compressed),
            'retrievedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'rows': len(rows), 'bytes': len(raw),
            'adapterVersion': 'nasa-tap-engine-1', 'review': 'needs_review'}

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', default=str(ROOT / '.artifacts' / 'source-proposals' / datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')))
    args = parser.parse_args()
    OUT = pathlib.Path(args.output).resolve()
    if OUT.exists() and any(OUT.iterdir()):
        raise SystemExit('Source proposal output must be a new or empty directory; accepted snapshots are immutable.')
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        records = list(pool.map(fetch, QUERY.items()))
    (OUT/'manifest.proposed.json').write_text(json.dumps({'schemaVersion': '1.0.0', 'sources': records}, indent=2)+'\n', encoding='utf-8')
    accepted_root = ROOT / 'data' / 'exoplanet-engine' / 'sources' / '2026-09-13'
    prior = json.loads(gzip.decompress((accepted_root / 'koi.json.gz').read_bytes()))
    current = json.loads(gzip.decompress((OUT / 'koi.json.gz').read_bytes()))
    old = {row['kepoi_name']: row for row in prior}
    changes = [{'id': row['kepoi_name'], 'before': old.get(row['kepoi_name'], {}).get('koi_disposition'), 'after': row['koi_disposition']}
               for row in current if old.get(row['kepoi_name'], {}).get('koi_disposition') != row['koi_disposition']]
    (OUT/'review-required.json').write_text(json.dumps({'status': 'needs_review', 'statusChanges': changes,
        'instruction': 'Review identities, parameter-set changes, uncertainties, provenance and model implications before updating the accepted manifest. This job does not publish.'}, indent=2)+'\n', encoding='utf-8')
    print(json.dumps([{k:v for k,v in r.items() if k not in ['url','query']} for r in records], indent=2))
