/* eslint-disable no-script-url -- These deliberately invalid inputs verify URL rejection. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { fixture } from './fixtures.mjs';
import {
    validateEvidence,
    adopted,
    stableJSON,
    safeSourceURL,
    evidenceBase,
} from '../../exoplanet-engine/contracts.js';
import { normaliseNASA } from '../../exoplanet-engine/nasa-adapter.js';
import { packetFor } from '../../exoplanet-engine/policy.js';
test('F06/F07: infrared and tentative molecules do not produce measured visible colour or abundance', () => {
    const e = fixture();
    e.chemicalClaims = [
        { species: 'H2O', status: 'tentative', claimId: 'source-claim', abundance: null },
    ];
    validateEvidence(e, { production: false });
    const p = packetFor(e, { production: false });
    assert.equal(
        p.decision.featureDecisions.find((f) => f.feature === 'colour').treatment,
        'schematic'
    );
    assert.equal(e.chemicalClaims[0].status, 'tentative');
    assert.equal(e.chemicalClaims[0].abundance, null);
});
test('F09: a radius bound is retained as a partial constraint without inventing a nominal radius', () => {
    const e = fixture({ values: { radius: 1e7 } });
    adopted(e, 'radius').constraint = { kind: 'upper_limit', value: 1e7, uncertainty: null };
    const p = packetFor(e, { production: false });
    assert.equal(p.decision.mode, 'partially_constrained');
    assert.equal(p.physicalRadiusMetres, null);
    assert.ok(p.decision.requiredDisclosures.includes('Not to scale.'));
});
test('F13: source-link injection and private literal destinations fail closed', () => {
    for (const url of [
        'javascript:alert(1)',
        'data:text/html,test',
        'http://example.org',
        'https://user:secret@example.org',
        'https://127.0.0.1/key',
        'https://169.254.169.254/latest',
    ])
        assert.equal(safeSourceURL(url), null);
    const e = fixture();
    e.citations[0].url = 'javascript:alert(1)';
    assert.throws(() => validateEvidence(e, { production: false }), /citation/);
});
test('real sparse source and competing Kepler-227 solutions are preserved independently', async () => {
    const dir = new URL('../../data/exoplanet-engine/sources/2026-09-13/', import.meta.url),
        manifest = JSON.parse(await fs.readFile(new URL('manifest.accepted.json', dir), 'utf8'));
    const sources = Object.fromEntries(manifest.sources.map((s) => [s.id, s])),
        koi = JSON.parse(gunzipSync(await fs.readFile(new URL(sources.koi.path, dir)))),
        ps = JSON.parse(gunzipSync(await fs.readFile(new URL(sources.ps.path, dir))));
    const sparse = normaliseNASA({
        koi: koi.find((r) => r.kepoi_name === 'K00129.02'),
        objectId: 'K00129.02',
        releaseId: 'test-real',
        sources,
    });
    validateEvidence(sparse);
    assert.equal(packetFor(sparse).decision.mode, 'identity_placeholder');
    assert.equal(sparse.object.existence.status, 'candidate');
    const record = koi.find((r) => r.kepoi_name === 'K00752.01'),
        solution = ps.find((r) => r.pl_name === 'Kepler-227 b' && r.default_flag === 1);
    const main = normaliseNASA({
        koi: record,
        ps: solution,
        objectId: record.kepoi_name,
        releaseId: 'test-real',
        sources,
    });
    assert.equal(adopted(main, 'radius').original.value, 3.11);
    assert.equal(adopted(main, 'mass').state, 'unknown');
    assert.equal(adopted(main, 'equilibriumTemperature').state, 'unknown');
    const alternative = normaliseNASA({
        koi: record,
        objectId: record.kepoi_name,
        releaseId: 'test-real',
        sources,
    });
    assert.equal(adopted(alternative, 'radius').original.value, 2.26);
    assert.equal(adopted(alternative, 'equilibriumTemperature').constraint.value, 793);
    assert.throws(
        () =>
            normaliseNASA({
                koi: record,
                ps: { ...solution, pl_name: 'Different world' },
                objectId: record.kepoi_name,
                releaseId: 'test-real',
                sources,
            }),
        /identity/
    );
});
test('versioned runtime resolves the same data root at root and project base paths', () => {
    assert.equal(
        evidenceBase('https://example.org/exoplanet-engine/loader.js').href,
        'https://example.org/data/exoplanet-engine/'
    );
    assert.equal(
        evidenceBase(
            'https://example.org/project/data/exoplanet-engine/releases/2026-09-13-0123456789abcdef/runtime/loader.js'
        ).href,
        'https://example.org/project/data/exoplanet-engine/'
    );
});
