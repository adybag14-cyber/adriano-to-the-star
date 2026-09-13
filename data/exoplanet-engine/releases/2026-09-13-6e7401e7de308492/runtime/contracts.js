/** Runtime scientific contract. All GPU paths consume this contract unchanged. */
export const SCHEMA = '1.0.0';
export const POLICY = 'appearance-capabilities-1';
export const GENERATOR = 'continuous-world-1';
export const STATUS = [
    'confirmed',
    'candidate',
    'disputed',
    'retracted',
    'unverified',
    'false_positive',
];
export const MODES = [
    'identity_placeholder',
    'partially_constrained',
    'observation_constrained',
    'speculative_sandbox',
];
export const MISSING = [
    'not_reported',
    'not_ingested',
    'not_applicable',
    'conflicting_unresolved',
    'invalid_source_value',
];
export const KINDS = ['observed', 'derived', 'inferred'];
export const MAX_PACKET_BYTES = 2 * 1024 * 1024;
export const UNITS = Object.freeze({
    radius: 'm',
    mass: 'kg',
    minimumMass: 'kg',
    gravity: 'm s-2',
    density: 'kg m-3',
    orbitalPeriod: 's',
    semiMajorAxis: 'm',
    eccentricity: '1',
    equilibriumTemperature: 'K',
    hostTemperature: 'K',
    hostRadius: 'm',
    hostMass: 'kg',
    hostLuminosity: 'W',
    distance: 'm',
    transitDepth: '1',
    radiusRatio: '1',
    pressure: 'Pa',
    surfaceTemperature: 'K',
    albedoBlue: '1',
    albedoRed: '1',
    irradiance: 'W m-2',
    scaleHeight: 'm',
});
export function evidenceBase(importURL) {
    return new URL(
        new URL(importURL).pathname.includes('/data/exoplanet-engine/releases/')
            ? '../../../'
            : '../data/exoplanet-engine/',
        importURL
    );
}
export function invariant(condition, message) {
    if (!condition) throw new Error(message);
}
export function stableJSON(value) {
    if (Array.isArray(value)) return `[${value.map(stableJSON).join(',')}]`;
    if (value && typeof value === 'object')
        return `{${Object.keys(value)
            .sort()
            .map((k) => `${JSON.stringify(k)}:${stableJSON(value[k])}`)
            .join(',')}}`;
    invariant(
        value !== undefined && (typeof value !== 'number' || Number.isFinite(value)),
        'Non-JSON scientific value'
    );
    return JSON.stringify(value);
}
export async function sha256(value) {
    const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value;
    return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))]
        .map((n) => n.toString(16).padStart(2, '0'))
        .join('');
}
export function freeze(value) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
        Object.values(value).forEach(freeze);
        Object.freeze(value);
    }
    return value;
}
export function safeSourceURL(input) {
    try {
        const u = new URL(input);
        return u.protocol === 'https:' &&
            !u.username &&
            !u.password &&
            !/^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|\[)/.test(u.hostname)
            ? u.href
            : null;
    } catch {
        return null;
    }
}
function uniqueMap(values, label, max) {
    invariant(Array.isArray(values) && values.length <= max, `${label} array exceeds contract`);
    const map = new Map();
    for (const item of values) {
        invariant(
            item && typeof item.id === 'string' && item.id.length < 256 && !map.has(item.id),
            `Duplicate/invalid ${label} ID`
        );
        map.set(item.id, item);
    }
    return map;
}
export function validateConstraint(c) {
    invariant(
        c &&
            ['estimate', 'interval', 'upper_limit', 'lower_limit', 'distribution'].includes(c.kind),
        'Invalid constraint kind'
    );
    if (c.kind === 'distribution') {
        invariant(
            typeof c.assetId === 'string' &&
                c.uncertainty?.distributionMetadata?.unit &&
                c.uncertainty.distributionMetadata.normalization,
            'Distribution lacks axes, units or normalization'
        );
    } else if (c.kind === 'interval') {
        invariant(
            Number.isFinite(c.lower) && Number.isFinite(c.upper) && c.lower <= c.upper,
            'Unordered/nonfinite interval'
        );
    } else {
        invariant(Number.isFinite(c.value), 'Nonfinite constraint');
        if (c.kind === 'estimate')
            for (const k of ['errorMinus', 'errorPlus'])
                invariant(
                    c[k] === null || (Number.isFinite(c[k]) && c[k] >= 0),
                    'Invalid uncertainty magnitude'
                );
    }
    if (c.uncertainty) {
        invariant(
            [
                'confidence',
                'credible',
                'reported_unspecified',
                'propagated_reported_bounds',
            ].includes(c.uncertainty.interpretation),
            'Invalid uncertainty semantics'
        );
        invariant(
            c.uncertainty.level === null || (c.uncertainty.level > 0 && c.uncertainty.level < 1),
            'Invalid uncertainty level'
        );
    }
    return c;
}
export function validateEvidence(e, { production = true } = {}) {
    invariant(
        e?.schemaVersion === SCHEMA && e.object?.evidenceReleaseId === e.releaseId,
        'Incompatible evidence schema/release'
    );
    invariant(
        typeof e.object.id === 'string' &&
            typeof e.object.canonicalName === 'string' &&
            e.object.canonicalName.length < 256,
        'Invalid object identity'
    );
    invariant(!production || !e.testOnly, 'Synthetic evidence is forbidden in production');
    const citations = uniqueMap(e.citations, 'citation', 256),
        claims = uniqueMap(e.claims, 'claim', 256),
        quantities = uniqueMap(e.quantities, 'quantity', 256),
        runs = uniqueMap(e.modelRuns || [], 'model run', 128);
    const check = (ids, map, label) => {
        invariant(Array.isArray(ids), `Missing ${label} references`);
        for (const id of ids) invariant(map.has(id), `Unresolved ${label}: ${id}`);
    };
    for (const c of citations.values()) {
        invariant(
            c.title?.trim() && c.title.length < 2000 && safeSourceURL(c.url),
            'Invalid citation title or URL'
        );
        invariant(!production || !c.testOnly, 'Synthetic production citation');
        invariant(
            !production ||
                !/^https:\/\/(?:example\.(?:com|org|invalid)|localhost)(?:\/|$)/i.test(c.url),
            'Test citation URL in production'
        );
        invariant(
            ['paper', 'catalogue', 'official_page', 'dataset'].includes(c.sourceType) &&
                Array.isArray(c.authors),
            'Invalid citation metadata'
        );
        invariant(
            Number.isFinite(Date.parse(c.retrievedAt)) &&
                Number.isFinite(Date.parse(c.lastVerifiedAt)),
            'Missing citation review time'
        );
        invariant(
            c.snapshotHash === null || /^[a-f0-9]{64}$/.test(c.snapshotHash),
            'Invalid source hash'
        );
    }
    for (const c of claims.values()) {
        invariant(
            c.objectId === e.object.id &&
                c.statement?.trim() &&
                ['accepted', 'needs_review', 'superseded', 'rejected'].includes(c.review),
            'Invalid scientific claim'
        );
        check(c.citationIds, citations, 'citation');
        invariant(c.citationIds.length > 0, 'Claim without source');
    }
    const existence = e.object.existence;
    invariant(existence && STATUS.includes(existence.status), 'Invalid existence status');
    check(existence.evidenceClaimIds, claims, 'existence claim');
    if (existence.status !== 'unverified') {
        invariant(
            existence.evidenceClaimIds.length > 0 &&
                existence.evidenceClaimIds.every((id) => claims.get(id).review === 'accepted'),
            'Source-backed status lacks accepted evidence'
        );
        invariant(
            Number.isFinite(Date.parse(existence.reviewedAt)),
            'Source-backed status lacks review date'
        );
    }
    for (const q of quantities.values()) {
        invariant(
            q.objectId === e.object.id && q.definition?.trim() && UNITS[q.key] === q.unit,
            'Invalid quantity identity, definition or dimension'
        );
        if (q.state === 'unknown') {
            invariant(
                q.constraint === null && MISSING.includes(q.reason) && !('value' in q),
                'Unknown quantity contains science values'
            );
            continue;
        }
        invariant(
            q.state === 'known' && KINDS.includes(q.epistemicKind),
            'Invalid epistemic category'
        );
        validateConstraint(q.constraint);
        check(q.evidenceClaimIds, claims, 'quantity claim');
        check(q.inputQuantityIds, quantities, 'input quantity');
        invariant(
            q.evidenceClaimIds.every((id) => claims.get(id).review === 'accepted'),
            'Quantity references unreviewed evidence'
        );
        if (q.epistemicKind === 'observed')
            invariant(
                q.evidenceClaimIds.length > 0 && q.method,
                'Observed quantity lacks claim-specific evidence/method'
            );
        if (q.epistemicKind === 'derived')
            invariant(
                q.inputQuantityIds.length > 0 && runs.has(q.modelRunId),
                'Derived quantity lacks calculation/dependencies'
            );
        if (q.epistemicKind === 'inferred')
            invariant(
                runs.has(q.modelRunId) || (q.publishedInference && q.evidenceClaimIds.length > 0),
                'Inference lacks model provenance'
            );
        const bounds =
            q.constraint.kind === 'interval'
                ? [q.constraint.lower, q.constraint.upper]
                : q.constraint.kind === 'distribution'
                  ? []
                  : [q.constraint.value];
        if (
            !['eccentricity', 'transitDepth', 'radiusRatio', 'albedoBlue', 'albedoRed'].includes(
                q.key
            )
        )
            invariant(
                bounds.every((v) => v > 0),
                'Nonpositive physical quantity'
            );
        else
            invariant(
                bounds.every((v) => v >= 0 && (q.key !== 'eccentricity' || v < 1)),
                'Invalid dimensionless physical domain'
            );
    }
    const visiting = new Set(),
        done = new Set();
    function visit(id) {
        if (done.has(id)) return;
        invariant(!visiting.has(id), 'Cyclic quantity dependencies');
        visiting.add(id);
        for (const dep of quantities.get(id).inputQuantityIds || []) visit(dep);
        visiting.delete(id);
        done.add(id);
    }
    quantities.forEach((q) => visit(q.id));
    for (const r of runs.values()) {
        check(r.inputQuantityIds, quantities, 'model input');
        invariant(
            r.modelId &&
                r.modelVersion &&
                r.validation?.passed === true &&
                ['valid', 'conditional', 'unsupported'].includes(r.applicability),
            'Invalid/unvalidated model run'
        );
    }
    invariant(
        !e.chemicalClaims || (Array.isArray(e.chemicalClaims) && e.chemicalClaims.length <= 128),
        'Oversized chemical claims'
    );
    for (const c of e.chemicalClaims || []) {
        invariant(
            claims.has(c.claimId) && claims.get(c.claimId).review === 'accepted',
            'Chemical claim lacks reviewed evidence'
        );
        invariant(
            [
                'reported_detection',
                'tentative',
                'disputed',
                'non_detection',
                'upper_limit',
            ].includes(c.status),
            'Invalid chemical detection status'
        );
        invariant(
            c.abundance === null || (typeof c.abundance === 'object' && c.abundance.constraint),
            'Unqualified abundance'
        );
    }
    for (const o of e.observations || []) {
        invariant(
            claims.has(o.claimId) &&
                o.observable &&
                o.quantityUnit &&
                o.wavelengthUnit &&
                o.geometry &&
                o.calibration,
            'Incomplete observation product'
        );
        invariant(Array.isArray(o.bands) && o.bands.length <= 4096, 'Invalid observation bands');
        for (const b of o.bands) {
            invariant(
                Number.isFinite(b.lower) &&
                    Number.isFinite(b.upper) &&
                    b.lower > 0 &&
                    b.upper > b.lower,
                'Invalid observation wavelength domain'
            );
            validateConstraint(b.constraint);
        }
    }
    invariant(
        Array.isArray(e.parameterSets) &&
            e.parameterSets.some((s) => s.id === e.adoptedParameterSetId),
        'Missing adopted parameter set'
    );
    for (const s of e.parameterSets) {
        check(s.quantityIds, quantities, 'parameter set');
        invariant(s.selectionReason, 'Unexplained parameter selection');
    }
    return e;
}
export function adopted(e, key) {
    const ids = new Set(
        e.parameterSets.find((s) => s.id === e.adoptedParameterSetId)?.quantityIds || []
    );
    return e.quantities.find((q) => ids.has(q.id) && q.key === key) || null;
}
export function central(q) {
    return q?.state === 'known' && q.constraint?.kind === 'estimate' ? q.constraint.value : null;
}
export function validatePacket(packet, evidence, { production = true } = {}) {
    validateEvidence(evidence, { production });
    invariant(
        packet.schemaVersion === SCHEMA &&
            packet.objectId === evidence.object.id &&
            packet.evidenceReleaseId === evidence.releaseId,
        'Mixed packet/evidence release'
    );
    invariant(
        MODES.includes(packet.decision?.mode) && packet.decision.policyVersion === POLICY,
        'Unsupported appearance policy'
    );
    invariant(packet.decision.requiredDisclosures?.length > 0, 'Missing persistent disclosure');
    if (packet.physicalRadiusMetres !== null) {
        invariant(
            Number.isFinite(packet.physicalRadiusMetres) &&
                packet.physicalRadiusMetres > 0 &&
                packet.radiusProvenanceIds?.length > 0,
            'Unproven physical radius'
        );
        invariant(
            packet.radiusProvenanceIds.every((id) =>
                evidence.quantities.some((q) => q.id === id && q.state === 'known')
            ),
            'Unresolved radius provenance'
        );
    }
    if (packet.decision.mode === 'identity_placeholder')
        invariant(
            packet.recipeId === null &&
                !packet.assets?.some((a) =>
                    ['terrain', 'atmosphere', 'inference'].includes(a.kind)
                ),
            'Placeholder requests physical generation'
        );
    return packet;
}
