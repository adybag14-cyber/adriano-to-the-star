import test from 'node:test';
import assert from 'node:assert/strict';
import { TerrainManager } from '../../exoplanet-engine/terrain-manager.js';
import fs from 'node:fs/promises';
import { fixture } from './fixtures.mjs';
import { C, irradiance, semiMajorAxis, scaleHeight } from '../../exoplanet-engine/physics.js';
import { makeRecipe, availableScenarios } from '../../exoplanet-engine/recipes.js';
import {
    terrainField,
    direction,
    projectFace,
    generateTile,
    normalize,
    pickSurface,
    physicalPosition,
} from '../../exoplanet-engine/terrain.js';
import {
    integrateXYZ,
    displayRGB,
    stellarColour,
    OBSERVER,
    bandRadiance,
} from '../../exoplanet-engine/colour.js';
import { sha256, stableJSON } from '../../exoplanet-engine/contracts.js';
const terrestrial = fixture({
    values: {
        radius: C.earthRadius,
        mass: C.earthMass,
        hostTemperature: 5200,
        equilibriumTemperature: 280,
        gravity: 9.8,
    },
});
test('F15/F16/F17: airless, gas, and sandbox scenarios obey distinct boundaries', async () => {
    const air = await makeRecipe(terrestrial, { family: 'airless-rocky' });
    assert.equal(air.atmosphere.pressurePa, 0);
    assert.equal(air.clouds.enabled, false);
    assert.equal(air.liquid, null);
    const giant = fixture({
            values: {
                radius: 9 * C.earthRadius,
                hostTemperature: 5200,
                equilibriumTemperature: 1000,
            },
        }),
        gas = await makeRecipe(giant, { family: 'hot-gas' });
    assert.equal(gas.solidSurface, false);
    assert.equal(gas.reliefMetres, 0);
    assert.ok(gas.assumptions.some((a) => a.id === 'gravity'));
    const sparse = fixture(),
        before = stableJSON(sparse);
    assert.deepEqual(availableScenarios(sparse), []);
    await assert.rejects(makeRecipe(sparse, { family: 'airless-rocky' }), /outside/);
    const sandbox = await makeRecipe(sparse, { family: 'airless-rocky', sandbox: true });
    assert.equal(sandbox.sandbox, true);
    assert.equal(sandbox.radiusKind, 'assumed');
    assert.equal(stableJSON(sparse), before);
});
test('geography is independent of weather seed, quality and animation time', async () => {
    const a = await makeRecipe(terrestrial, {
            family: 'airless-rocky',
            seed: 'rock-7',
            weatherSeed: 'a',
        }),
        b = await makeRecipe(terrestrial, {
            family: 'airless-rocky',
            seed: 'rock-7',
            weatherSeed: 'b',
        });
    assert.equal(a.seedInt, b.seedInt);
    assert.notEqual(a.weatherSeedInt, b.weatherSeedInt);
    assert.notEqual(a.id, b.id);
    for (const point of [[1, 0, 0], [0, 1, 0], normalize([1, 2, 3])])
        assert.deepEqual(terrainField(point, a), terrainField(point, b));
    const c = await makeRecipe(terrestrial, { family: 'airless-rocky', seed: 'another' });
    assert.notDeepEqual(terrainField([1, 0, 0], a), terrainField([1, 0, 0], c));
});
test('F20: cube projection and global fields agree across all face edges', async () => {
    const r = await makeRecipe(terrestrial, { family: 'airless-rocky' });
    for (let face = 0; face < 6; face++)
        for (const edge of [-1, 1])
            for (let i = 0; i <= 16; i++) {
                for (const [u, v] of [
                    [edge, -1 + i / 8],
                    [-1 + i / 8, edge],
                ]) {
                    const n = direction(face, u, v),
                        p = projectFace(n),
                        other = direction(p.face, p.u, p.v);
                    for (let k = 0; k < 3; k++) assert.ok(Math.abs(n[k] - other[k]) < 1e-14);
                    assert.ok(
                        Math.abs(terrainField(n, r).height - terrainField(other, r).height) < 1e-7
                    );
                }
            }
});
test('F20: fine edges lie exactly on the adjacent coarse mesh grid, without skirts', async () => {
    const r = await makeRecipe(terrestrial, { family: 'airless-rocky' }),
        tile = { face: 4, level: 2, x: 1, y: 1 },
        a = generateTile(tile, r, [1, 2, 2, 2]);
    for (let x = 1; x < 16; x += 2) {
        const i = x * 3;
        for (let k = 0; k < 3; k++)
            assert.ok(
                Math.abs(
                    a.positions[i + k] - (a.positions[i - 3 + k] + a.positions[i + 3 + k]) * 0.5
                ) < 2e-8
            );
    }
    assert.equal(a.positions.length, (16 + 1) ** 2 * 3);
    assert.equal(a.indices.length, 16 * 16 * 6);
});
test('F20: surface picking and geometry consume the same reference field', async () => {
    const r = await makeRecipe(terrestrial, { family: 'airless-rocky' }),
        n = normalize([0.2, 0.1, 1]),
        origin = n.map((v) => v * 2),
        hit = pickSurface(
            origin,
            n.map((v) => -v),
            r
        ),
        expected = physicalPosition(n, r);
    assert.ok(hit);
    for (let k = 0; k < 3; k++) assert.ok(Math.abs(hit[k] - expected[k]) < 1e-9);
});
test('CIE data integrity, equal-energy tristimulus integral and zero radiance', async () => {
    const bytes = await fs.readFile(
        new URL('../../data/exoplanet-engine/CIE_xyz_1931_2deg.csv', import.meta.url)
    );
    assert.equal(await sha256(bytes), OBSERVER.sha256);
    const rows = bytes
            .toString()
            .trim()
            .split(/\r?\n/)
            .map((s) => s.split(',').map(Number)),
        xyz = integrateXYZ(rows, () => 1, { K: 1e9 });
    assert.ok(Math.abs(xyz[0] - 106.8654) < 0.001);
    assert.ok(Math.abs(xyz[1] - 106.8569) < 0.001);
    assert.ok(Math.abs(xyz[2] - 106.8919) < 0.001);
    assert.deepEqual(
        integrateXYZ(rows, () => 0),
        [0, 0, 0]
    );
    assert.deepEqual(displayRGB([0, 0, 0]), [0, 0, 0]);
    const cool = stellarColour(rows, 2800),
        hot = stellarColour(rows, 10000);
    assert.ok(cool.linearRGB[0] > cool.linearRGB[2]);
    assert.ok(hot.linearRGB[2] > hot.linearRGB[0]);
    for (const temperature of [2500, 4000, 6000, 10000]) {
        const fine = stellarColour(rows, temperature).rawXYZ;
        const { planck } = await import('../../exoplanet-engine/physics.js');
        const coarse = integrateXYZ(rows, (w) => planck(w, temperature), { stride: 5 });
        for (let i = 0; i < 3; i++) assert.ok(Math.abs(coarse[i] / fine[i] - 1) < 0.0005);
    }
});
test('thermal band is a defined integrated radiance and not an RGB temperature texture', () => {
    assert.ok(bandRadiance(300) > 0);
    assert.ok(bandRadiance(600) > bandRadiance(300));
    assert.throws(() => bandRadiance(0));
    assert.throws(() => displayRGB([1, 1, 1], { exposure: NaN }));
});
test('irradiance, two-body orbit and hydrostatic units match independent physical references', () => {
    assert.ok(Math.abs(irradiance(C.sunLuminosity, C.au) - 1361.1665) < 0.001);
    assert.ok(Math.abs(semiMajorAxis(C.sunMass, C.earthMass, 31557600) / C.au - 1) < 0.0001);
    assert.ok(Math.abs(scaleHeight(288, 28, 9.8) - 8726.0) < 2);
    assert.equal(semiMajorAxis(C.sunMass, null, 31557600), null);
    assert.equal(irradiance(null, C.au), null);
    assert.equal(scaleHeight(288, null, 9.8), null);
});
test('F20: refinement respects the tile budget and balances every coarse-neighbour edge', async () => {
    const recipe = await makeRecipe(terrestrial, { family: 'airless-rocky' });
    for (const budget of [54, 150])
        for (const camera of [
            [0, 0, 4],
            normalize([0.4, 0.2, 1]).map((v) => v * 1.00001),
            [0, 1.00001, 0],
            normalize([1, 1, 1]).map((v) => v * 1.00001),
        ]) {
            const manager = Object.create(TerrainManager.prototype);
            Object.assign(manager, {
                recipe,
                quality: { maxTiles: budget, errorPixels: 2.5 },
                roots: Array.from({ length: 6 }, (_, face) => ({ face, level: 0, x: 0, y: 0 })),
                previousSplits: new Set(),
            });
            const frontier = manager.plan(camera, 1080, 0.84);
            assert.ok(frontier.length <= budget);
            for (const tile of frontier)
                assert.ok(manager.levels(tile, frontier).every((level) => level >= tile.level - 1));
        }
});

test('F20: indexed transition sampling preserves the previous triangle surface at interior and face edges', () => {
    const manager = Object.create(TerrainManager.prototype);
    const index = Array.from({ length: 6 }, () => new Map());
    const positions = new Float32Array(17 * 17 * 3);
    for (let y = 0; y <= 16; y++)
        for (let x = 0; x <= 16; x++) {
            const i = (y * 17 + x) * 3;
            positions.set([x / 8 - 1, y / 8 - 1, x / 16 + y / 8], i);
        }
    index[4].set(
        0,
        new Map([
            [
                '0/0',
                {
                    tile: { face: 4, level: 0, x: 0, y: 0 },
                    anchor: [0, 0, 1],
                    mesh: { geometry: { getAttribute: () => ({ array: positions }) } },
                },
            ],
        ])
    );
    for (const [u, v] of [
        [-1, -1],
        [1, 1],
        [1, -0.4],
        [-0.22, 0.73],
    ]) {
        const p = manager.oldPosition(4, u, v, index);
        const expected = [u, v, 1 + (u + 1) / 2 + v + 1];
        for (let k = 0; k < 3; k++) assert.ok(Math.abs(p[k] - expected[k]) < 1e-7);
    }
    assert.equal(manager.oldPosition(0, 0, 0, index), null);
});
