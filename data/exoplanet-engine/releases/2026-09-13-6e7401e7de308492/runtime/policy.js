import {
    SCHEMA,
    POLICY,
    adopted,
    central,
    validateEvidence,
    sha256,
    stableJSON,
    freeze,
} from './contracts.js';
export const DISCLOSURES = Object.freeze({
    identity_placeholder:
        'Appearance unknown — schematic placeholder. Size, colour, lighting and detail are schematic unless individually labelled as supported.',
    partially_constrained:
        'Partially constrained reconstruction. The listed measurements are supported; environment, material and spatial detail depend on the stated assumptions.',
    observation_constrained:
        'Scientifically constrained reconstruction — not a photograph. Fine detail may be procedural.',
    speculative_sandbox: 'Speculative example — not a prediction of this object’s appearance.',
});
export function decide(e, { production = true, sandbox = false, recipe = null } = {}) {
    validateEvidence(e, { production });
    const radius = adopted(e, 'radius'),
        star = adopted(e, 'hostTemperature');
    const verified = e.object.existence.status !== 'unverified';
    const rejected = ['retracted', 'false_positive'].includes(e.object.existence.status);
    const radiusValue = central(radius),
        starValue = central(star);
    const starApplicable = starValue !== null && starValue >= 2000 && starValue <= 50000;
    const shapeSupported = radius?.state === 'known' && !rejected;
    const appearanceSupported = shapeSupported || (!rejected && starApplicable);
    let mode = appearanceSupported ? 'partially_constrained' : 'identity_placeholder';
    if (sandbox) mode = 'speculative_sandbox';
    const features = [
        {
            feature: 'size',
            treatment: shapeSupported ? 'supported' : 'schematic',
            inputQuantityIds: shapeSupported ? [radius.id] : [],
            reasonCode: shapeSupported ? 'PUBLISHED_RADIUS_CONSTRAINT' : 'NO_USABLE_RADIUS',
            userExplanation: shapeSupported
                ? `The ${radius.epistemicKind} radius constraint is retained, including limits or intervals. A physical display scale requires an adopted nominal radius.`
                : 'This display has no physical size scale.',
        },
        {
            feature: 'illumination',
            treatment: starApplicable && !rejected ? 'conditional' : 'schematic',
            inputQuantityIds: starApplicable ? [star.id] : [],
            reasonCode: starApplicable ? 'DECLARED_STELLAR_BLACKBODY' : 'UNKNOWN_ILLUMINATION',
            userExplanation: starApplicable
                ? 'A blackbody approximation uses the fitted stellar effective temperature. Viewing phase, orientation and exposure are declared scene assumptions.'
                : 'Neutral inspection lighting is schematic; the host spectrum is not supplied.',
        },
        ...['terrain', 'atmosphere', 'clouds', 'liquids'].map((feature) => ({
            feature,
            treatment: 'hidden',
            inputQuantityIds: [],
            reasonCode: 'ENVIRONMENT_UNCONSTRAINED',
            userExplanation: `The selected observations do not establish ${feature}. A conditional scenario must declare the missing environmental assumptions.`,
        })),
        {
            feature: 'colour',
            treatment: 'schematic',
            inputQuantityIds: [],
            reasonCode: 'REFLECTANCE_UNCONSTRAINED',
            userExplanation:
                'Visible reflectance and spatial colour are not measured by this catalogue. An infrared spectrum is not a visible image.',
        },
        {
            feature: 'sky',
            treatment: 'schematic',
            inputQuantityIds: [],
            reasonCode: 'NO_LOCAL_SKY_SURVEY',
            userExplanation:
                'The background is a schematic viewing aid, not the sky measured from this world.',
        },
    ].map((f) => ({
        ...f,
        evidenceClaimIds: f.inputQuantityIds.flatMap(
            (id) => e.quantities.find((q) => q.id === id)?.evidenceClaimIds || []
        ),
        modelRunIds: [],
        assumptionIds: [],
        observationalSpatialResolutionMetres: null,
    }));
    if (recipe && !rejected) {
        for (const f of features) {
            if (f.feature === 'terrain' && recipe.solidSurface) {
                f.treatment = 'procedural';
                f.userExplanation =
                    'Landforms are a deterministic procedural realisation of this conditional material family. Their locations have not been observed.';
            }
            if (f.feature === 'atmosphere' && recipe.atmosphere.pressurePa > 0) {
                f.treatment = 'conditional';
                f.userExplanation =
                    'A bounded hydrostatic and Rayleigh model uses the listed pressure, composition and temperature assumptions.';
            }
            if (f.feature === 'clouds' && recipe.clouds.enabled) {
                f.treatment = 'procedural';
                f.userExplanation =
                    'Cloud organisation and weather are procedural; species detections do not locate clouds or establish their abundance.';
            }
            if (f.feature === 'liquids' && recipe.liquid) {
                f.treatment = 'conditional';
                f.userExplanation = `${recipe.liquid} is an explicit scenario assumption; no surface liquid detection is implied.`;
            }
            if (f.feature === 'colour') {
                f.treatment = 'conditional';
                f.userExplanation =
                    'Material reflectance is a declared hypothesis under a modelled illuminator and reproducible display transform.';
            }
            if (['procedural', 'conditional'].includes(f.treatment))
                f.assumptionIds = recipe.assumptions.map((a) => a.id);
        }
        if (recipe.reflectance) {
            const colour = features.find((f) => f.feature === 'colour');
            colour.evidenceClaimIds = [recipe.reflectance.claimId];
            colour.reasonCode = 'PUBLISHED_BROADBAND_ALBEDO';
            colour.userExplanation =
                'Published visible geometric-albedo constraints influence this conditional colour model. Unmeasured wavelengths, phase assumptions and all spatial structure remain uncertain.';
        }
    }
    const reasons = [
        !verified
            ? 'IDENTITY_UNVERIFIED'
            : rejected
              ? 'NON_PLANET_OR_RETRACTED_CLAIM'
              : appearanceSupported
                ? 'FEATURE_SPECIFIC_CONSTRAINTS'
                : 'APPEARANCE_UNCONSTRAINED',
    ];
    if (starValue !== null && !starApplicable) reasons.push('STELLAR_MODEL_UNSUPPORTED');
    return {
        mode,
        policyVersion: POLICY,
        reasonCodes: reasons,
        featureDecisions: features,
        requiredDisclosures: [
            DISCLOSURES[mode],
            ...(radiusValue === null || rejected ? ['Not to scale.'] : []),
            ...(!starApplicable ? ['Schematic inspection lighting.'] : []),
            ...(!verified
                ? ['Unverified entry; a source-backed existence claim is not available.']
                : []),
            ...(rejected
                ? ['The catalogue does not classify this entry as a currently accepted planet.']
                : []),
        ],
        optInRequired: sandbox,
        coverageState: e.coverageState || 'reviewed_subset',
        engineLimitation:
            starValue !== null && !starApplicable
                ? 'Stellar temperature is outside the validated blackbody renderer domain.'
                : null,
    };
}
export function packetFor(e, options = {}) {
    const decision = decide(e, options),
        q = adopted(e, 'radius');
    const physicalRadiusMetres =
        decision.featureDecisions.find((f) => f.feature === 'size').treatment === 'supported'
            ? central(q)
            : null;
    return {
        schemaVersion: SCHEMA,
        id: `${e.releaseId}:${e.object.id}:${e.adoptedParameterSetId}`,
        objectId: e.object.id,
        evidenceReleaseId: e.releaseId,
        recipeId: null,
        decision,
        physicalRadiusMetres,
        radiusProvenanceIds: physicalRadiusMetres === null ? [] : [q.id],
        schematicScale: physicalRadiusMetres === null ? 1 : null,
        assets: [],
        assetManifestId: e.releaseId,
        provenanceManifestId: e.releaseId,
        packetHash: null,
    };
}
export async function compilePacket(e, options = {}) {
    const packet = packetFor(e, options);
    if (options.recipe) {
        packet.recipeId = options.recipe.id;
        packet.id += `:${options.recipe.id}`;
    }
    packet.packetHash = await sha256(stableJSON(packet));
    return freeze(packet);
}
