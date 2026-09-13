import { craterCatalogue } from './terrain.js';
/** Render-only grain uses a periodic metre frame; physical relief stays in terrain.js. */
export function surfaceDetail(T, recipe) {
    const {
        Fn,
        If,
        float,
        vec3,
        vec4,
        positionLocal,
        positionWorld,
        normalWorld,
        cameraViewMatrix,
        attribute,
    } = T.TSL;
    const periodicNoise = Fn(([coordinate, scale]) => {
        const p = coordinate.div(scale),
            i = p.floor(),
            f = p.fract(),
            u = f.mul(f).mul(float(3).sub(f.mul(2))),
            period = float(8192).div(scale);
        const hash = Fn(([cell]) => {
            const c = cell.sub(cell.div(period).floor().mul(period));
            const q = c
                .mul(vec3(0.1031, 0.11369, 0.13787))
                .add(recipe.seedInt % 1024)
                .fract()
                .toVar();
            q.addAssign(q.dot(q.yzx.add(19.19)));
            return q.x.add(q.y).mul(q.z).fract();
        });
        const a = hash(i).toVar(),
            b = hash(i.add(vec3(1, 0, 0))).toVar(),
            c = hash(i.add(vec3(0, 1, 0))).toVar(),
            d = hash(i.add(vec3(1, 1, 0))).toVar(),
            e = hash(i.add(vec3(0, 0, 1))).toVar(),
            f1 = hash(i.add(vec3(1, 0, 1))).toVar(),
            g = hash(i.add(vec3(0, 1, 1))).toVar(),
            h = hash(i.add(vec3(1, 1, 1))).toVar();
        const du = f.mul(float(1).sub(f)).mul(6).div(scale);
        const gx = b
            .sub(a)
            .mix(d.sub(c), u.y)
            .mix(f1.sub(e).mix(h.sub(g), u.y), u.z)
            .mul(du.x);
        const gy = c
            .sub(a)
            .mix(d.sub(b), u.x)
            .mix(g.sub(e).mix(h.sub(f1), u.x), u.z)
            .mul(du.y);
        const gz = e
            .sub(a)
            .mix(f1.sub(b), u.x)
            .mix(g.sub(c).mix(h.sub(d), u.x), u.y)
            .mul(du.z);
        const value = a
            .mix(b, u.x)
            .mix(c.mix(d, u.x), u.y)
            .mix(e.mix(f1, u.x).mix(g.mix(h, u.x), u.y), u.z);
        return vec4(gx, gy, gz, value);
    });
    const metric = positionLocal
        .mul(recipe.referenceRadiusMetres)
        .add(attribute('detailOrigin', 'vec3'));
    const footprint = positionWorld
        .dFdx()
        .length()
        .max(positionWorld.dFdy().length())
        .mul(recipe.referenceRadiusMetres);
    const normal = Fn(() => {
        const gradient = vec3(0).toVar();
        for (const [scale, amplitude] of [
            [128, 1.2],
            [16, 0.18],
            [2, 0.03],
            [0.25, 0.002],
        ]) {
            If(footprint.lessThan(scale * 1.5), () => {
                const fade = float(1).sub(footprint.smoothstep(scale * 0.25, scale * 1.5));
                gradient.addAssign(
                    periodicNoise(metric, float(scale)).xyz.mul(amplitude).mul(fade)
                );
            });
        }
        const n = normalWorld,
            perturbed = n.sub(gradient.sub(n.mul(gradient.dot(n)))).normalize();
        return cameraViewMatrix.mul(vec4(perturbed, 0)).xyz.normalize();
    })();
    const albedo = Fn(() => {
        const result = float(1).toVar();
        If(footprint.lessThan(256), () => {
            const warp = vec3(
                periodicNoise(metric, float(512)).w,
                periodicNoise(metric.add(vec3(317, 109, 47)), float(512)).w,
                periodicNoise(metric.add(vec3(79, 227, 503)), float(512)).w
            )
                .sub(0.5)
                .mul(80);
            const p = metric.add(warp),
                variation = float(0).toVar();
            for (const [scale, weight] of [
                [128, 0.22],
                [16, 0.12],
                [2, 0.07],
                [0.25, 0.03],
            ]) {
                If(footprint.lessThan(scale * 1.5), () => {
                    const fade = float(1).sub(footprint.smoothstep(scale * 0.2, scale * 1.5));
                    variation.addAssign(
                        periodicNoise(p, float(scale)).w.sub(0.5).mul(weight).mul(fade)
                    );
                });
            }
            result.mulAssign(variation.add(0.95));
        });
        if (['airless-rocky', 'scorched-rocky'].includes(recipe.family)) {
            const n = attribute('planetDirection', 'vec3').normalize();
            for (const crater of craterCatalogue(recipe.seedInt)) {
                const d = float(2)
                    .mul(float(1).sub(n.dot(vec3(...crater.center))))
                    .max(0)
                    .sqrt()
                    .div(crater.radius);
                result.mulAssign(
                    float(1)
                        .sub(float(1).sub(d.smoothstep(0.35, 0.95)).mul(0.3))
                        .add(d.sub(1.12).mul(d.sub(1.12)).div(0.025).negate().exp().mul(0.16))
                );
            }
        }
        return result;
    })();
    return { normal, albedo, smallestNormalDetailMetres: 0.25, normalReliefMetres: 0.002 };
}
