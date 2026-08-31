const measurement = (value, kind = 'default-parameter-set') => ({
    value,
    errorPlus: null,
    errorMinus: null,
    limit: null,
    display: value == null ? null : String(value),
    provenance: { table: kind === 'archive-calculated' ? 'pscomppars' : 'ps', kind, reference: null }
});

describe('PlanetaryAppearanceModel', () => {
    let PlanetaryAppearanceModel;
    let catalog;

    beforeAll(() => {
        require('../planetary-appearance-model.js');
        PlanetaryAppearanceModel = window.PlanetaryAppearanceModel;
        catalog = {
            generatedAt: '2026-08-31T00:00:00.000Z',
            systems: [{
                id: 'barnard-s-star',
                hostname: "Barnard's star",
                distancePc: 1.82655,
                host: { spectralType: 'M3.5-4 V' },
                planets: [{
                    id: 'barnard-b',
                    name: 'Barnard b',
                    letter: 'b',
                    discovery: { reference: null },
                    psDefault: {
                        massProvenance: 'Msini',
                        references: {},
                        measurements: {
                            radiusEarth: measurement(null),
                            massEarth: measurement(0.299),
                            equilibriumTemperatureK: measurement(438),
                            insolationEarth: measurement(null),
                            orbitalPeriodDays: measurement(3.1542),
                            semiMajorAxisAu: measurement(0.0229),
                            densityGcm3: measurement(null)
                        }
                    },
                    psComposite: {
                        massProvenance: 'Msini',
                        measurements: {
                            radiusEarth: measurement(0.72, 'archive-calculated'),
                            massEarth: measurement(0.299, 'literature'),
                            equilibriumTemperatureK: measurement(438, 'literature'),
                            insolationEarth: measurement(6.76, 'literature'),
                            orbitalPeriodDays: measurement(3.1542, 'literature'),
                            semiMajorAxisAu: measurement(0.0229, 'literature'),
                            densityGcm3: measurement(4.4, 'archive-calculated')
                        }
                    },
                    spectroscopy: {
                        counts: { transmission: 0, eclipse: 0, directImaging: 0 },
                        spectra: [],
                        species: { status: 'not-provided-by-nasa-tap-metadata', values: [] }
                    }
                }]
            }]
        };
    });

    test('resolves host and planet aliases without turning unknown stars into planets', () => {
        const model = new PlanetaryAppearanceModel(catalog);
        expect(model.resolvePlanet('Barnard b').planet.id).toBe('barnard-b');
        expect(model.resolveTarget("Barnard's Star").planet.id).toBe('barnard-b');
        expect(model.resolveTarget('Sirius')).toBeNull();
    });

    test('keeps archive-calculated radius and minimum mass provenance separate from atmosphere evidence', () => {
        const model = new PlanetaryAppearanceModel(catalog);
        const profile = model.derive('Barnard b');
        expect(profile.physical.radiusEarth).toBe(0.72);
        expect(profile.physical.radiusKind).toBe('archive-calculated');
        expect(profile.physical.massEarth).toBe(0.299);
        expect(profile.physical.massQualifier).toMatch(/minimum mass/i);
        expect(profile.evidence.class).toBe('bulk-constrained');
        expect(profile.evidence.spectraCount).toBe(0);
        expect(profile.evidence.species).toEqual([]);
        expect(profile.evidence.spectrumStatus).toMatch(/No planetary atmospheric spectrum/i);
        expect(profile.evidence.assumptions.join(' ')).toMatch(/not resolved observations/i);
        expect(model.toViewerConfig('Barnard b').planetaryModel.seed).toBe(profile.seed);
    });
});
