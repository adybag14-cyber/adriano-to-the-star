import { SCHEMA, UNITS } from '../../exoplanet-engine/contracts.js';
export function fixture({
    status = 'confirmed',
    values = {},
    distance = 2e6 * 9.4607304725808e15,
} = {}) {
    const id = 'synthetic-f01',
        releaseId = 'test-release',
        setId = 'synthetic-compatible-set';
    const quantities = [
        'radius',
        'mass',
        'minimumMass',
        'hostTemperature',
        'equilibriumTemperature',
        'hostRadius',
        'semiMajorAxis',
        'gravity',
        'density',
    ].map((key) => ({
        id: `q:${key}`,
        objectId: id,
        key,
        unit: UNITS[key],
        definition: key === 'mass' ? 'true planet mass' : `synthetic ${key}`,
        parameterSetId: setId,
        ...(values[key] === undefined
            ? { state: 'unknown', constraint: null, reason: 'not_reported' }
            : {
                  state: 'known',
                  epistemicKind: 'observed',
                  constraint: {
                      kind: 'estimate',
                      value: values[key],
                      errorMinus: null,
                      errorPlus: null,
                      uncertainty: null,
                  },
                  evidenceClaimIds: ['source-claim'],
                  inputQuantityIds: [],
                  modelRunId: null,
                  assumptionIds: [],
                  method: 'Synthetic test input',
              }),
    }));
    return {
        schemaVersion: SCHEMA,
        releaseId,
        testOnly: true,
        object: {
            id,
            canonicalName: 'Synthetic distant object — TEST ONLY',
            aliases: [],
            hostAssociationClaimIds: ['source-claim'],
            hostLabel: 'Synthetic host association',
            existence: {
                status,
                evidenceClaimIds: ['source-claim'],
                reviewedAt: '2026-09-13T00:00:00Z',
                rationale: 'Synthetic test claim',
                previousAssessmentId: null,
            },
            quantityIds: quantities.map((q) => q.id),
            evidenceReleaseId: releaseId,
        },
        context: {
            distanceMetres: distance,
            qualification: 'Synthetic system distance; not independent planet ranging',
        },
        citations: [
            {
                id: 'test-citation',
                testOnly: true,
                title: 'Synthetic fixture citation — not a real publication',
                url: 'https://example.invalid/test-only',
                authors: [],
                publisher: 'Test harness',
                publicationDate: null,
                doi: null,
                bibliographicId: null,
                sourceType: 'dataset',
                retrievedAt: '2026-09-13T00:00:00Z',
                lastVerifiedAt: '2026-09-13T00:00:00Z',
                snapshotHash: null,
            },
        ],
        claims: [
            {
                id: 'source-claim',
                objectId: id,
                citationIds: ['test-citation'],
                statement: 'Synthetic test claim only',
                review: 'accepted',
                sourceLocator: 'fixture',
                observationEpoch: null,
                dependenceGroupId: 'test',
            },
        ],
        quantities,
        modelRuns: [],
        parameterSets: [
            {
                id: setId,
                quantityIds: quantities.map((q) => q.id),
                selectionReason: 'Synthetic compatible parameter set',
            },
        ],
        adoptedParameterSetId: setId,
    };
}
