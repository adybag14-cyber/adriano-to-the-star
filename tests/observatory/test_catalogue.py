"""Offline adapter and identity regressions. No network access or fabricated sources."""
import math
from pathlib import Path
import sys
import unittest
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'scripts'))
from observatory_data import (number,name_key,nasa_ps,nasa_koi,paris,merge_records,RJ_TO_RE,MJ_TO_ME,reference)

def ps(name='Example b',**kwargs):
    return {'pl_name':name,'hostname':'Example','pl_rade':None,'pl_bmasse':None,'pl_controv_flag':0,'ra':0,'dec':0}|kwargs

def eu(name='Example b',**kwargs):
    return {'name':name,'planet_status':'Confirmed','alternate_names':'','radius':'','mass':'','star_distance':''}|kwargs

def koi(name='Kepler-10 b',ident='K00072.01',**kwargs):
    return {'kepid':11904151,'kepoi_name':ident,'kepler_name':name,'koi_disposition':'CONFIRMED','koi_prad':1.4,'koi_score':.99}|kwargs

class CatalogueTests(unittest.TestCase):
    def test_unknown_is_not_zero_or_nonfinite(self):
        for value in [None,'',True,'NaN',math.inf,'bad']:self.assertIsNone(number(value))
        self.assertEqual(number(0),0);self.assertIsNone(number(0,positive=True));self.assertEqual(number('2.5'),2.5)
    def test_planet_b_and_companion_B_are_different(self):
        self.assertNotEqual(name_key('HD 3651 b'),name_key('HD 3651 B'))
        rows,_,_,_=merge_records([], [ps('HD 3651 b')], [eu('54 Psc b',alternate_names='HD 3651 b'),eu('54 Psc c',alternate_names='HD 3651 B, HD 3651 c')])
        self.assertEqual(len(rows),2)
        self.assertEqual(len(next(r for r in rows if r['name']=='HD 3651 b')['sources']),2)
    def test_kepid_is_a_host_not_a_planet_identity(self):
        rows,_,_,_=merge_records([koi('Kepler-10 b'),koi('Kepler-10 c','K00072.02')],[],[])
        self.assertEqual(len(rows),2);self.assertEqual(len({r['id'] for r in rows}),2)
    def test_explicit_planet_alias_merges_but_host_name_does_not(self):
        rows,_,_,_=merge_records([],[ps('HD 10697 b'),ps('HD 10697 c')],[eu('109 Psc b',alternate_names='HD 10697 b')])
        self.assertEqual(len(rows),2);self.assertEqual(len(next(r for r in rows if r['name']=='HD 10697 b')['sources']),2)
    def test_ambiguous_aliases_never_glue_two_planets(self):
        rows,_,_,issues=merge_records([],[ps('A b'),ps('A c')],[eu('Uncertain b',alternate_names='A b, A c')])
        self.assertEqual(len(rows),3);self.assertEqual(len(issues),1)
    def test_distinct_same_source_rows_are_not_collapsed(self):
        rows,_,_,issues=merge_records([],[],[eu('A b',alternate_names='Alias b'),eu('B b',alternate_names='Alias b')])
        self.assertEqual(len(rows),2);self.assertEqual(len(issues),1)
    def test_dispositions_conflict_explicitly(self):
        rows,detail,_,_=merge_records([koi('Kepler-10 b',koi_disposition='FALSE POSITIVE')],[ps('Kepler-10 b')],[])
        self.assertEqual(rows[0]['status'],'DISPUTED');self.assertTrue(rows[0]['statusConflict']);self.assertEqual(set(detail[rows[0]['id']]['statuses']),{'CONFIRMED','FALSE POSITIVE'})
    def test_missing_adopted_radius_not_silently_filled(self):
        rows,detail,_,_=merge_records([],[ps(pl_rade=None)],[eu(radius='1')])
        self.assertIsNone(rows[0]['radius']);self.assertEqual(rows[0]['parameterSource'],'nasa-ps')
        self.assertEqual(detail[rows[0]['id']]['sources'][1]['quantities']['radius']['value'],1)
    def test_jupiter_units_convert_only_in_main_index(self):
        rows,detail,_,_=merge_records([],[],[eu(radius='1',mass='2')])
        self.assertAlmostEqual(rows[0]['radius'],RJ_TO_RE,7);self.assertAlmostEqual(rows[0]['mass'],2*MJ_TO_ME,7)
        self.assertEqual(detail[rows[0]['id']]['sources'][0]['quantities']['radius']['unit'],'R_jupiter')
    def test_upper_limits_preserved_not_reported_as_point_estimates(self):
        rows,detail,_,_=merge_records([],[ps(pl_rade=2,pl_radelim=1)],[])
        self.assertIsNone(rows[0]['radius']);self.assertEqual(detail[rows[0]['id']]['sources'][0]['quantities']['radius']['limit'],1)
    def test_mass_sini_and_koi_errors_keep_source_meaning(self):
        item=paris(eu(mass_sini='3'));self.assertEqual(item['quantities']['mass']['kind'],'M*sin(i)')
        item=nasa_koi(koi(koi_prad_err1=.2,koi_prad_err2=-.1));self.assertEqual(item['quantities']['radius']['plus'],.2);self.assertEqual(item['quantities']['radius']['minus'],-.1)
    def test_ra_zero_is_valid_and_unbounded_angles_rejected(self):
        rows,_,observers,_=merge_records([],[ps(sy_dist=12)],[]);self.assertEqual(rows[0]['ra'],0);self.assertEqual(observers[0][3],0)
        with self.assertRaises(ValueError):merge_records([],[ps(ra=361)],[])
        with self.assertRaises(ValueError):merge_records([],[ps(dec=-91)],[])
    def test_invalid_object_identity_is_rejected(self):
        with self.assertRaises(ValueError):nasa_ps({'pl_name':''})
        with self.assertRaises(ValueError):nasa_koi(koi(ident='11904151'))
    def test_source_html_does_not_become_executable_link(self):
        bad=reference('<a href="javascript:alert(1)">source</a>');self.assertIsNone(bad['url']);self.assertEqual(bad['label'],'source')
        good=reference('<a href=https://example.org/paper target=ref>Evidence</a>');self.assertEqual(good['url'],'https://example.org/paper')
    def test_unreviewed_records_have_no_3d_packet(self):
        rows,_,_,_=merge_records([],[ps()],[]);self.assertIsNone(rows[0]['engineId'])
        rows,_,_,_=merge_records([],[ps()],[],engine_ids=['nea-example-b']);self.assertEqual(rows[0]['engineId'],'nea-example-b')

if __name__=='__main__':unittest.main()
