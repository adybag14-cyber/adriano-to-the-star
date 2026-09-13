import { C, rayleighCrossSection } from './physics.js';
/** Portable TSL transport: one compositing pass, so extinction is counted once. */
export function opticalFunctions(T, recipe, state) {
    const { Fn, If, Loop, float, vec2, vec3, uniform, mx_noise_float } = T.TSL;
    const h = recipe.atmosphere.profile.height / recipe.referenceRadiusMetres,
        top = 1 + recipe.atmosphere.profile.top / recipe.referenceRadiusMetres;
    const cloudBase = 1 + h * recipe.clouds.baseScaleHeights,
        cloudTop = 1 + h * recipe.clouds.topScaleHeights;
    const seed = recipe.weatherSeedInt % 65536;
    const density = Fn(([p]) => {
        if (!recipe.clouds.enabled) return float(0);
        const r = p.length(),
            n = p.normalize(),
            warp = mx_noise_float(n.mul(7).add(seed * 0.01)).mul(0.22);
        const wind = vec3(state.time.mul(0.0003), 0, state.time.mul(0.00008));
        const large = mx_noise_float(
            n
                .mul(6)
                .add(wind)
                .add(seed * 0.001)
        )
            .mul(0.5)
            .add(0.5);
        const small = mx_noise_float(n.mul(65).add(wind.mul(8)).add(warp))
            .mul(0.5)
            .add(0.5);
        const bands = recipe.solidSurface
            ? float(1)
            : n.y.mul(55).add(warp.mul(12)).sin().mul(0.17).add(0.83);
        const shape = large.mul(0.72).add(small.mul(0.28)).mul(bands).smoothstep(0.49, 0.7);
        const z = r.sub(cloudBase).div(Math.max(cloudTop - cloudBase, 1e-6));
        return shape.mul(z.smoothstep(0, 0.15)).mul(float(1).sub(z.smoothstep(0.78, 1)));
    });
    const sphere = Fn(([origin, ray, radius]) => {
        const b = origin.dot(ray),
            disc = b.mul(b).sub(origin.dot(origin).sub(radius.mul(radius))),
            root = disc.max(0).sqrt();
        return vec2(b.negate().sub(root), b.negate().add(root));
    });
    const cloudExt = recipe.clouds.enabled
        ? recipe.clouds.opticalDepth / Math.max(cloudTop - cloudBase, 1e-5)
        : 0;
    const shadow = Fn(([p]) => {
        if (!recipe.clouds.enabled) return float(1);
        if (state.compatibility) {
            const q = p.normalize().mul((cloudBase + cloudTop) * 0.5);
            return density(q).mul(recipe.clouds.opticalDepth).negate().exp().clamp(0.01, 1);
        }
        const hit = sphere(p, state.sun, float(cloudTop)),
            length = hit.y.max(0),
            step = length.div(6),
            opticalDepth = float(0).toVar();
        Loop({ start: 0, end: 6, type: 'int', name: 'shadowStep' }, ({ shadowStep }) => {
            const q = p.add(state.sun.mul(float(shadowStep).add(0.5).mul(step)));
            opticalDepth.addAssign(density(q).mul(step.mul(cloudExt)));
        });
        return opticalDepth.negate().exp().clamp(0.01, 1);
    });
    const a = recipe.atmosphere,
        numberDensity = a.pressurePa === 0 ? 0 : a.pressurePa / (C.k * recipe.referenceTemperature);
    const beta = [680e-9, 550e-9, 440e-9].map(
        (w) =>
            rayleighCrossSection(w, a.refractiveIndex, a.referenceNumberDensity, a.kingFactor) *
            numberDensity *
            recipe.referenceRadiusMetres
    );
    return { density, sphere, shadow, h, top, cloudBase, cloudTop, cloudExt, beta };
}
export function createOpticalMaterial(T, opaqueTexture, depthTexture, recipe, state, functions) {
    const { Fn, If, Loop, Break, int, float, vec3, vec4, uniform, texture, uv, getViewPosition } =
        T.TSL;
    const material = new T.MeshBasicNodeMaterial({ depthTest: false, depthWrite: false });
    material.toneMapped = false;
    const opaque = texture(opaqueTexture, uv());
    if (recipe.atmosphere.pressurePa === 0 || state.compatibility) {
        material.fragmentNode = opaque;
        return material;
    }
    const f = functions,
        steps = state.steps.clamp(1, state.compatibility ? 12 : 80);
    material.fragmentNode = Fn(() => {
        const source = opaque.toVar(),
            depth = texture(depthTexture, uv()).r;
        const far = getViewPosition(uv(), float(1), state.inverseProjection),
            ray = state.cameraWorld.mul(vec4(far, 0)).xyz.normalize();
        const origin = state.cameraPlanet,
            hit = f.sphere(origin, ray, float(f.top)),
            begin = hit.x.max(0).toVar(),
            end = hit.y.toVar();
        const discriminant = origin
            .dot(ray)
            .mul(origin.dot(ray))
            .sub(origin.dot(origin).sub(f.top * f.top));
        If(depth.lessThan(0.9999999), () => {
            const surface = getViewPosition(uv(), depth, state.inverseProjection);
            end.assign(end.min(surface.length()));
        });
        const transmission = vec3(1).toVar(),
            radiance = vec3(0).toVar();
        If(discriminant.greaterThan(0).and(end.greaterThan(begin)), () => {
            const ds = end.sub(begin).div(steps),
                cosTheta = ray.dot(state.sun),
                phaseR = cosTheta
                    .mul(cosTheta)
                    .add(1)
                    .mul(3 / (16 * Math.PI));
            const g = 0.7,
                phaseM = float(1 - g * g).div(
                    float(1 + g * g)
                        .sub(cosTheta.mul(2 * g))
                        .pow(1.5)
                        .mul(4 * Math.PI)
                );
            const beta = vec3(...f.beta),
                jitter = state.jitter;
            Loop(
                {
                    start: 0,
                    end: state.compatibility ? 12 : 80,
                    type: 'int',
                    condition: '<',
                    name: 'viewStep',
                },
                ({ viewStep }) => {
                    If(int(viewStep).greaterThanEqual(steps), () => {
                        Break();
                    });
                    const p = origin
                            .add(ray.mul(begin.add(float(viewStep).add(jitter).mul(ds))))
                            .toVar(),
                        radius = p.length();
                    const air = float(1)
                        .sub(radius.reciprocal())
                        .div(f.h)
                        .negate()
                        .clamp(-50, 8)
                        .exp();
                    const clouds = f.density(p),
                        scatterR = beta.mul(air),
                        scatterC = vec3(clouds.mul(f.cloudExt)),
                        extinction = scatterR.add(scatterC);
                    const solar = f.sphere(p, state.sun, float(f.top)),
                        solarStep = solar.y.max(0).div(6),
                        solarDepth = vec3(0).toVar();
                    if (state.compatibility) {
                        const cosine = p.normalize().dot(state.sun).abs().max(0.08);
                        solarDepth.assign(
                            beta
                                .mul(air)
                                .mul(f.h)
                                .add(scatterC.mul(Math.max(f.cloudTop - f.cloudBase, 0)))
                                .div(cosine)
                        );
                    } else
                        Loop({ start: 0, end: 6, type: 'int', name: 'sunStep' }, ({ sunStep }) => {
                            const q = p.add(state.sun.mul(float(sunStep).add(0.5).mul(solarStep))),
                                airSun = float(1)
                                    .sub(q.length().reciprocal())
                                    .div(f.h)
                                    .negate()
                                    .clamp(-50, 8)
                                    .exp();
                            solarDepth.addAssign(
                                beta
                                    .mul(airSun)
                                    .add(vec3(f.density(q).mul(f.cloudExt)))
                                    .mul(solarStep)
                            );
                        });
                    const ground = 1 - recipe.reliefMetres / recipe.referenceRadiusMetres,
                        b = p.dot(state.sun),
                        blocked = b.lessThan(0).and(
                            p
                                .dot(p)
                                .sub(b.mul(b))
                                .lessThan(ground * ground)
                        );
                    const sunTrans = blocked.select(vec3(0), solarDepth.negate().exp());
                    const stepTrans = extinction.mul(ds).negate().exp(),
                        sourceTerm = scatterR.mul(phaseR).add(scatterC.mul(phaseM.mul(0.92)));
                    const integral = vec3(1)
                        .sub(stepTrans)
                        .div(extinction.max(vec3(1e-6)));
                    radiance.addAssign(
                        transmission
                            .mul(sunTrans)
                            .mul(sourceTerm)
                            .mul(integral)
                            .mul(state.sunColour)
                            .mul(3.5)
                    );
                    transmission.mulAssign(stepTrans);
                }
            );
        });
        return vec4(source.rgb.mul(transmission).add(radiance), 1);
    })();
    return material;
}
