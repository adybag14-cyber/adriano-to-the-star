import { SCHEMA, UNITS, safeSourceURL, invariant } from './contracts.js';
import { C, derivePhysical } from './physics.js';
const text = (v) =>
    String(v ?? '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
export const slug = (v) =>
    String(v)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
export const sourceLabel = (r) => text(r.pl_refname) || 'Kepler cumulative fit';
export function catalogueURL(table, key, value) {
    const u = new URL('https://exoplanetarchive.ipac.caltech.edu/TAP/sync');
    u.searchParams.set(
        'query',
        `select * from ${table} where ${key}='${String(value).replaceAll("'", "''")}'`
    );
    u.searchParams.set('format', 'json');
    return u.href;
}
const fieldSpecs = [
    [
        'radius',
        'pl_rade',
        'koi_prad',
        C.earthRadius,
        'transit-fit planet radius, dependent on stellar parameters',
    ],
    ['mass', 'pl_bmasse', null, C.earthMass, 'true planet mass'],
    ['orbitalPeriod', 'pl_orbper', 'koi_period', C.day, 'orbital period from the published fit'],
    [
        'semiMajorAxis',
        'pl_orbsmax',
        'koi_sma',
        C.au,
        'orbital semi-major axis, not projected separation',
    ],
    ['eccentricity', 'pl_orbeccen', null, 1, 'orbital eccentricity'],
    [
        'equilibriumTemperature',
        'pl_eqt',
        'koi_teq',
        1,
        'equilibrium temperature under the publication assumptions; not surface temperature',
    ],
    [
        'hostTemperature',
        'st_teff',
        'koi_steff',
        1,
        'host stellar effective temperature from fitted stellar parameters',
    ],
    [
        'hostRadius',
        'st_rad',
        'koi_srad',
        C.sunRadius,
        'host stellar radius from fitted stellar parameters',
    ],
    [
        'hostMass',
        'st_mass',
        'koi_smass',
        C.sunMass,
        'host stellar mass from fitted stellar parameters',
    ],
    ['hostLuminosity', 'st_lum', null, C.sunLuminosity, 'host bolometric luminosity'],
    [
        'distance',
        'sy_dist',
        null,
        C.parsec,
        'distance of the system; not independent planetary ranging',
    ],
    [
        'transitDepth',
        'pl_trandep',
        'koi_depth',
        1,
        'fractional loss of stellar light in the adopted transit model',
    ],
    ['radiusRatio', null, 'koi_ror', 1, 'planet-to-star radius ratio from transit fit'],
    ['pressure', null, null, 1, 'atmospheric pressure at a specified reference level'],
    ['surfaceTemperature', null, null, 1, 'physical surface temperature'],
];
function number(v) {
    return typeof v === 'number' && Number.isFinite(v) ? v : null;
}
function makeConstraint(row, column, factor, isKoi, key) {
    const raw = number(row[column]);
    if (raw === null) return null;
    const logarithmic = key === 'hostLuminosity';
    const transform = (x) => (logarithmic ? 10 ** x * factor : x * factor);
    const value = transform(raw),
        plus = number(row[column + (isKoi ? '_err1' : 'err1')]),
        minus = number(row[column + (isKoi ? '_err2' : 'err2')]);
    const limit = isKoi ? 0 : row[column + 'lim'];
    const uncertainty = {
        interpretation: 'reported_unspecified',
        level: null,
        covarianceId: null,
        distributionAssetId: null,
    };
    if (limit === 1 || limit === -1)
        return { kind: limit === 1 ? 'upper_limit' : 'lower_limit', value, uncertainty };
    if (limit !== null && limit !== undefined && limit !== 0) return null;
    return {
        kind: 'estimate',
        value,
        errorMinus:
            minus === null || minus > 0 ? null : Math.max(0, value - transform(raw + minus)),
        errorPlus: plus === null || plus < 0 ? null : Math.max(0, transform(raw + plus) - value),
        uncertainty: plus === null && minus === null ? null : uncertainty,
    };
}
export function normaliseNASA({
    koi = null,
    ps = null,
    objectId,
    releaseId,
    sources,
    oldStatus = null,
    parameterSetId = null,
}) {
    if (koi && ps)
        invariant(
            koi.kepler_name && koi.kepler_name === ps.pl_name,
            'Ambiguous or mismatched KOI/planet identity'
        );
    const isKoi = !ps,
        row = ps || koi,
        source = sources[isKoi ? 'koi' : 'ps'];
    const name = ps?.pl_name || koi?.kepler_name || koi?.kepoi_name;
    const setId =
        parameterSetId ||
        `${objectId}:${isKoi ? 'cumulative' : slug(sourceLabel(ps)) + ':' + ps.rowupdate}`;
    const citationId = `${objectId}:${isKoi ? 'koi' : 'ps'}-record`,
        identityCitationId = koi ? `${objectId}:koi-record` : citationId;
    const citation = (id, table, key, value, s) => ({
        id,
        title:
            table === 'cumulative'
                ? 'Kepler Objects of Interest — Cumulative Table'
                : 'NASA Exoplanet Archive — Planetary Systems',
        url: catalogueURL(table, key, value),
        authors: [],
        publisher: 'NASA Exoplanet Archive / Caltech-IPAC',
        publicationDate: null,
        doi: table === 'cumulative' ? '10.26133/NEA4' : null,
        bibliographicId: null,
        sourceType: 'catalogue',
        retrievedAt: s.retrievedAt,
        lastVerifiedAt: s.reviewedAt,
        snapshotHash: s.sha256,
        redistributionNote:
            'NASA Exoplanet Archive public catalogue subset; acknowledge the archive and original publications.',
        selection: value,
    });
    const citations = [
        citation(
            citationId,
            isKoi ? 'cumulative' : 'ps',
            isKoi ? 'kepoi_name' : 'pl_name',
            isKoi ? koi.kepoi_name : ps.pl_name,
            source
        ),
    ];
    if (identityCitationId !== citationId)
        citations.push(
            citation(identityCitationId, 'cumulative', 'kepoi_name', koi.kepoi_name, sources.koi)
        );
    const disposition = koi?.koi_disposition || 'CONFIRMED';
    let status =
        {
            CONFIRMED: 'confirmed',
            CANDIDATE: 'candidate',
            'FALSE POSITIVE': 'false_positive',
            'NOT DISPOSITIONED': 'unverified',
        }[disposition] || 'unverified';
    if (ps?.pl_controv_flag === 1 && status === 'confirmed') status = 'disputed';
    const claimId = `${objectId}:identity`,
        parameterClaimId = `${setId}:parameters`;
    const claims = [
        {
            id: claimId,
            objectId,
            citationIds: [
                ...new Set([identityCitationId, ...(status === 'disputed' ? [citationId] : [])]),
            ],
            statement: `The archive classifies ${name} as ${disposition.toLowerCase()}${status === 'disputed' ? '; the Planetary Systems row flags a controversial interpretation' : ''}.`,
            sourceLocator: koi
                ? `kepoi_name=${koi.kepoi_name}; koi_disposition; koi_vet_date=${koi.koi_vet_date}`
                : `pl_name=${name}; pl_controv_flag`,
            review: 'accepted',
            observationEpoch: null,
            dependenceGroupId: `${objectId}:catalogue-disposition`,
        },
        {
            id: parameterClaimId,
            objectId,
            citationIds: [citationId],
            statement: `Adopted parameter solution: ${isKoi ? text(koi.koi_trans_mod) : sourceLabel(ps)}. Values retain their field definitions, limits and reported uncertainties.`,
            sourceLocator: isKoi
                ? `kepoi_name=${koi.kepoi_name}; stellar parameters=${koi.koi_sparprov}`
                : `pl_name=${name}; pl_refname=${sourceLabel(ps)}; st_refname=${text(ps.st_refname)}; rowupdate=${ps.rowupdate}`,
            review: 'accepted',
            observationEpoch: null,
            dependenceGroupId: `${objectId}:${isKoi ? 'Kepler transit data' : sourceLabel(ps)}`,
        },
    ];
    const quantities = fieldSpecs.map(([key, psColumn, koiColumn, baseFactor, definition]) => {
        const column = isKoi ? koiColumn : psColumn;
        const factor = key === 'transitDepth' ? (isKoi ? 1e-6 : 0.01) : baseFactor;
        const sourceUnits = {
            radius: 'Earth radii',
            mass: 'Earth masses',
            orbitalPeriod: 'day',
            semiMajorAxis: 'AU',
            hostRadius: 'solar radii',
            hostMass: 'solar masses',
            distance: 'parsec',
            hostLuminosity: 'log10 solar luminosity',
        };
        const q = {
            id: `${setId}:${key}`,
            objectId,
            key,
            unit: UNITS[key],
            definition,
            parameterSetId: setId,
            original: column
                ? {
                      column,
                      unit:
                          key === 'transitDepth'
                              ? isKoi
                                  ? 'ppm'
                                  : 'percent'
                              : sourceUnits[key] || UNITS[key],
                      value: row[column] ?? null,
                      errorPlus: row[column + (isKoi ? '_err1' : 'err1')] ?? null,
                      errorMinus: row[column + (isKoi ? '_err2' : 'err2')] ?? null,
                      limitFlag: isKoi ? null : (row[column + 'lim'] ?? null),
                  }
                : null,
        };
        let constraint = column ? makeConstraint(row, column, factor, isKoi, key) : null;
        if (
            constraint &&
            (!Number.isFinite(constraint.value) ||
                (['eccentricity', 'transitDepth', 'radiusRatio'].includes(key)
                    ? constraint.value < 0
                    : constraint.value <= 0))
        )
            constraint = null;
        if (key === 'eccentricity' && constraint?.value >= 1) constraint = null;
        if (!constraint)
            return {
                ...q,
                state: 'unknown',
                constraint: null,
                reason: column
                    ? row[column] === null || row[column] === undefined
                        ? 'not_reported'
                        : 'invalid_source_value'
                    : 'not_ingested',
            };
        let epistemicKind = 'inferred';
        if (
            !isKoi &&
            (['orbitalPeriod', 'transitDepth', 'eccentricity'].includes(key) ||
                (key === 'radius' && ps.tran_flag === 1) ||
                (key === 'mass' && ps.pl_bmassprov === 'Mass'))
        )
            epistemicKind = 'observed';
        if (isKoi && ['orbitalPeriod', 'transitDepth', 'radiusRatio'].includes(key))
            epistemicKind = 'observed';
        if (key === 'mass' && ps?.pl_bmassprov !== 'Mass') {
            q.definition =
                ps?.pl_bmassprov === 'Msini'
                    ? 'minimum planet mass M sin(i)'
                    : `planet mass inferred by ${ps?.pl_bmassprov || 'unspecified published model'}`;
            if (ps?.pl_bmassprov === 'Msini') {
                q.key = 'minimumMass';
                q.id = `${setId}:minimumMass`;
            }
        }
        if (key === 'radius' && !isKoi && ps.tran_flag !== 1)
            q.definition = 'planet radius inferred under the published model';
        const quantityClaimId = `${q.id}:claim`;
        claims.push({
            id: quantityClaimId,
            objectId,
            citationIds: [citationId],
            statement: `The selected solution reports ${q.definition} in field ${column}.`,
            sourceLocator: `${claims[1].sourceLocator}; ${column}`,
            review: 'accepted',
            observationEpoch: null,
            dependenceGroupId: claims[1].dependenceGroupId,
        });
        return {
            ...q,
            state: 'known',
            constraint,
            epistemicKind,
            evidenceClaimIds: [quantityClaimId],
            inputQuantityIds: [],
            modelRunId: null,
            assumptionIds: [],
            method: isKoi
                ? `${koi.koi_trans_mod || 'Kepler pipeline fit'}; ${koi.koi_sparprov || 'stellar model not specified'}`
                : `${ps.discoverymethod}; ${sourceLabel(ps)}`,
            publishedInference:
                epistemicKind === 'inferred'
                    ? {
                          referenceCitationIds: [citationId],
                          modelName: isKoi
                              ? `${koi.koi_trans_mod}; ${koi.koi_sparprov}`
                              : sourceLabel(ps),
                          assumptions:
                              key === 'equilibriumTemperature' && isKoi
                                  ? [
                                        'Archive equilibrium model assumes Bond albedo 0.3 and complete redistribution.',
                                    ]
                                  : [
                                        'The source publication supplies the model assumptions; no executable retrieval is imported.',
                                    ],
                      }
                    : null,
        };
    });
    const e = {
        schemaVersion: SCHEMA,
        releaseId,
        object: {
            schemaVersion: SCHEMA,
            id: objectId,
            canonicalName: name,
            aliases: [
                ...new Set(
                    [koi?.kepoi_name, koi?.kepler_name, ps?.pl_name].filter((v) => v && v !== name)
                ),
            ],
            hostAssociationClaimIds: [claimId],
            hostLabel: ps?.hostname || (koi ? `Kepler input target ${koi.kepid}` : null),
            existence: {
                status,
                evidenceClaimIds: [claimId],
                reviewedAt: source.reviewedAt,
                rationale: claims[0].statement,
                previousAssessmentId: oldStatus ? `${objectId}:previous-website-snapshot` : null,
            },
            quantityIds: quantities.map((q) => q.id),
            evidenceReleaseId: releaseId,
        },
        citations,
        claims,
        quantities,
        modelRuns: [],
        adoptedParameterSetId: setId,
        parameterSets: [
            {
                id: setId,
                quantityIds: quantities.map((q) => q.id),
                label: isKoi ? 'Kepler cumulative transit solution' : sourceLabel(ps),
                publicationDate: ps?.pl_pubdate || null,
                sourceUpdatedAt: ps?.rowupdate || koi?.koi_vet_date || null,
                selectionReason: isKoi
                    ? 'Use this internally named Kepler fit; preserve its stellar assumptions. Do not supplement missing fields from another solution.'
                    : 'Use the NASA default reference-specific solution. It is not selected for recency or smallest errors; alternatives are retained separately.',
            },
        ],
        coverageState: 'reviewed_subset',
        coverage: {
            sourceTables: [isKoi ? 'cumulative' : 'ps'],
            lastReviewedAt: source.reviewedAt,
            scope: 'Selected catalogue solutions and individually reviewed supplements. Literature coverage is incomplete.',
            notIngested: [
                'surface maps',
                'atmospheric pressure profiles',
                'visible reflectance spectra',
                'planetary rotation',
                'ring and moon constraints',
            ],
        },
        previousWebsiteStatus: oldStatus,
        sourceSnapshotIds: [source.sha256],
        relatedReferences: [],
        spectralProducts: [],
        chemicalClaims: [],
    };
    if (ps)
        for (const key of ['pl_refname', 'st_refname', 'sy_refname', 'disc_refname']) {
            const href = String(ps[key] || '').match(/href=["']?([^\s>"']+)/)?.[1];
            if (safeSourceURL(href))
                e.relatedReferences.push({
                    label: text(ps[key]),
                    url: safeSourceURL(href),
                    role: key,
                    review: 'Catalogue reference link; full citation metadata not imported.',
                });
        }
    for (const d of derivePhysical(e)) {
        const ids = {
            density: 'spherical-density',
            gravity: 'spherical-gravity',
            hostLuminosity: 'effective-temperature-luminosity',
            irradiance: 'host-irradiance-at-reference-separation',
            semiMajorAxis: 'two-body-kepler',
        };
        const runId = `${setId}:derive-${d.key}`;
        e.modelRuns.push({
            id: runId,
            modelId: ids[d.key],
            modelVersion: '1',
            evidenceReleaseId: releaseId,
            inputQuantityIds: d.inputs,
            assumptionIds: [],
            priorIds: [],
            numericalSettings: {
                constantsVersion: C.version,
                uncertainty: 'reported-bound endpoint envelope',
            },
            applicability: 'valid',
            validation: {
                passed: true,
                method: 'Positive finite SI inputs from the same published parameter solution; domain and assumptions stated in the output quantity definition.',
                uncertainty: 'Reported-bound envelope or explicitly absent uncertainty.',
            },
        });
        const q = {
            id: d.id || `${setId}:${d.key}`,
            objectId,
            key: d.key,
            unit: d.unit,
            definition: d.definition,
            parameterSetId: setId,
            state: 'known',
            constraint: d.constraint,
            epistemicKind: 'derived',
            evidenceClaimIds: [],
            inputQuantityIds: d.inputs,
            modelRunId: runId,
            assumptionIds: [],
        };
        if (d.id)
            e.parameterSets[0].quantityIds = e.parameterSets[0].quantityIds.filter(
                (id) => !e.quantities.some((old) => old.id === id && old.key === d.key)
            );
        e.quantities.push(q);
        e.parameterSets[0].quantityIds.push(q.id);
        e.object.quantityIds.push(q.id);
    }
    return e;
}
