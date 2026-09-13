import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from './fixtures.mjs';
import {
    validateEvidence,
    validatePacket,
    adopted,
    stableJSON,
    sha256,
} from '../../exoplanet-engine/contracts.js';
import { packetFor } from '../../exoplanet-engine/policy.js';
import {
    C,
    deriveBulk,
    density,
    gravity,
    equilibriumTemperature,
    propagateEnvelope,
    hydrostaticProfile,
} from '../../exoplanet-engine/physics.js';
const opts = { production: false };
test('F01: two-million-light-year existence-only record is a successful source-backed schematic', () => {
    const e = fixture(),
        before = stableJSON(e),
        p = packetFor(e, opts);
    validatePacket(p, e, opts);
    assert.equal(p.decision.mode, 'identity_placeholder');
    assert.equal(p.physicalRadiusMetres, null);
    assert.equal(p.recipeId, null);
    assert.deepEqual(p.assets, []);
    assert.match(p.decision.requiredDisclosures.join(' '), /Not to scale/);
    assert.match(p.decision.requiredDisclosures.join(' '), /Schematic inspection lighting/);
    assert.equal(stableJSON(e), before);
    for (const q of e.quantities) assert.equal(q.constraint, null);
});
test('F02: candidate state survives packet generation and JSON export', () => {
    const e = fixture({ status: 'candidate' }),
        p = packetFor(e, opts);
    assert.equal(e.object.existence.status, 'candidate');
    assert.equal(JSON.parse(JSON.stringify({ e, p })).e.object.existence.status, 'candidate');
    assert.equal(p.decision.mode, 'identity_placeholder');
});
test('F03: measured radius is retained without invented mass, gravity or light', () => {
    const e = fixture({ values: { radius: 2 * C.earthRadius } }),
        p = packetFor(e, opts);
    assert.equal(p.decision.mode, 'partially_constrained');
    assert.equal(p.physicalRadiusMetres, 2 * C.earthRadius);
    assert.equal(adopted(e, 'mass').state, 'unknown');
    assert.deepEqual(deriveBulk(e), []);
    assert.equal(
        p.decision.featureDecisions.find((f) => f.feature === 'illumination').treatment,
        'schematic'
    );
});
test('F04: minimum mass never supplies a unique true mass, density or gravity', () => {
    const e = fixture({ values: { radius: C.earthRadius, minimumMass: 3 * C.earthMass } });
    assert.deepEqual(deriveBulk(e), []);
    const projected = fixture({ values: { radius: C.earthRadius, mass: C.earthMass } });
    adopted(projected, 'mass').definition = 'minimum planet mass M sin(i)';
    assert.deepEqual(deriveBulk(projected), []);
});
test('distance alone never controls appearance eligibility', () => {
    assert.equal(
        packetFor(fixture({ distance: 1 }), opts).decision.mode,
        packetFor(fixture({ distance: 1e30 }), opts).decision.mode
    );
});
test('synthetic citations are rejected by production validation', () => {
    assert.throws(() => validateEvidence(fixture()), /Synthetic/);
});
test('F13: unverified status cannot be promoted through a missing or unreviewed citation', () => {
    const e = fixture();
    e.citations = [];
    assert.throws(() => validateEvidence(e, opts), /Unresolved citation/);
    const pending = fixture();
    pending.claims[0].review = 'needs_review';
    assert.throws(() => validateEvidence(pending, opts), /accepted evidence/);
});
test('F08/F09: preserve limits and reject incompatible input sets for bulk derivation', () => {
    const e = fixture({ values: { mass: C.earthMass, radius: C.earthRadius } });
    adopted(e, 'mass').parameterSetId = 'different';
    assert.deepEqual(deriveBulk(e), []);
    adopted(e, 'mass').parameterSetId = e.adoptedParameterSetId;
    adopted(e, 'mass').constraint = { kind: 'upper_limit', value: C.earthMass, uncertainty: null };
    validateEvidence(e, opts);
    assert.deepEqual(deriveBulk(e), []);
});
test('F10/F14: model limitations and retracted status remain separate from data absence', () => {
    const unsupported = packetFor(fixture({ values: { hostTemperature: 90000 } }), opts);
    assert.match(unsupported.decision.engineLimitation, /outside/);
    const e = fixture({ status: 'retracted', values: { radius: C.earthRadius } });
    assert.equal(packetFor(e, opts).decision.mode, 'identity_placeholder');
    assert.equal(e.object.existence.status, 'retracted');
});
test('F22: incompatible schemas and invented unknown values fail closed', () => {
    const e = fixture();
    e.schemaVersion = '999';
    assert.throws(() => validateEvidence(e, opts), /Incompatible/);
    const unknown = fixture();
    unknown.quantities[0].constraint = { kind: 'estimate', value: 1 };
    assert.throws(() => validateEvidence(unknown, opts), /Unknown/);
    const good = fixture(),
        p = packetFor(good, opts);
    p.evidenceReleaseId = 'different';
    assert.throws(() => validatePacket(p, good, opts), /Mixed/);
});
test('negative values, invalid uncertainties and cyclic derivations fail', () => {
    for (const value of [0, -1, NaN, Infinity]) {
        const e = fixture({ values: { radius: value } });
        assert.throws(() => validateEvidence(e, opts));
    }
    const e = fixture({ values: { radius: C.earthRadius } });
    adopted(e, 'radius').constraint.errorMinus = -1;
    assert.throws(() => validateEvidence(e, opts), /uncertainty/);
    const cycle = fixture({ values: { radius: C.earthRadius } });
    adopted(cycle, 'radius').inputQuantityIds = ['q:radius'];
    assert.throws(() => validateEvidence(cycle, opts), /Cyclic/);
});
test('initial SI calculations match independent reference values and retain uncertainty absence', () => {
    // Independently evaluated with Python Decimal at 40-digit precision.
    assert.ok(Math.abs(gravity(C.earthMass, C.earthRadius) - 9.798398133669466) < 1e-10);
    assert.ok(Math.abs(density(C.earthMass, C.earthRadius) - 5495.021865555211) < 1e-7);
    assert.ok(Math.abs(equilibriumTemperature(C.sunLuminosity, C.au, 0.3) - 254.5859) < 0.1);
    const e = fixture({ values: { mass: C.earthMass, radius: C.earthRadius } }),
        result = deriveBulk(e);
    assert.equal(result.length, 2);
    assert.equal(result[0].constraint.errorMinus, null);
    assert.equal(gravity(null, C.earthRadius), null);
    assert.equal(equilibriumTemperature(C.sunLuminosity, C.au, null), null);
});
test('asymmetric reported bounds propagate without a fictitious posterior probability', () => {
    const e = fixture({ values: { mass: C.earthMass, radius: C.earthRadius } });
    for (const q of e.quantities.filter((q) => q.state === 'known')) {
        q.constraint.errorMinus = q.constraint.value * 0.1;
        q.constraint.errorPlus = q.constraint.value * 0.2;
    }
    const c = propagateEnvelope(gravity, [adopted(e, 'mass'), adopted(e, 'radius')]);
    assert.ok(c.errorMinus > 0 && c.errorPlus > 0);
    assert.equal(c.uncertainty.level, null);
    assert.equal(c.uncertainty.interpretation, 'propagated_reported_bounds');
});
test('airless and unsupported atmospheric limiting cases are explicit', () => {
    assert.equal(
        hydrostaticProfile({
            temperature: 280,
            mu: 28,
            gravity: 10,
            pressure: 0,
            radius: C.earthRadius,
        }).height,
        0
    );
    assert.throws(
        () =>
            hydrostaticProfile({
                temperature: 9000,
                mu: 2,
                gravity: 10,
                pressure: 1e5,
                radius: C.earthRadius,
            }),
        /unsupported/
    );
});
test('dependency-aware stable hashes are order-independent and detect tampering', async () => {
    assert.equal(
        await sha256(stableJSON({ a: 1, b: 2 })),
        await sha256(stableJSON({ b: 2, a: 1 }))
    );
    assert.notEqual(
        await sha256(stableJSON({ a: 1, dependencies: ['v1'] })),
        await sha256(stableJSON({ a: 1, dependencies: ['v2'] }))
    );
});
