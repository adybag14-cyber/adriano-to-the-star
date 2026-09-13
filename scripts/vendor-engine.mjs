import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.resolve(
    root,
    process.argv.find((a) => a.startsWith('--output='))?.slice(9) || 'vendor/exoplanet/0.186.0'
);
const source = path.join(root, 'node_modules/three-engine');
const pkg = JSON.parse(await fs.readFile(path.join(source, 'package.json'), 'utf8'));
if (pkg.version !== '0.186.0') throw new Error('Unexpected Three.js engine version');
await fs.mkdir(output, { recursive: true });
const manifest = { package: 'three', version: pkg.version, license: 'MIT', files: {} };
for (const name of ['three.webgpu.js', 'three.core.js']) {
    const bytes = await fs.readFile(path.join(source, 'build', name));
    await fs.writeFile(path.join(output, name), bytes);
    manifest.files[name] = createHash('sha256').update(bytes).digest('hex');
}
let controls = await fs.readFile(
    path.join(source, 'examples/jsm/controls/OrbitControls.js'),
    'utf8'
);
controls = controls.replace("from 'three'", "from './three.webgpu.js'");
await fs.writeFile(path.join(output, 'OrbitControls.js'), controls);
manifest.files['OrbitControls.js'] = createHash('sha256').update(controls).digest('hex');
await fs.copyFile(path.join(source, 'LICENSE'), path.join(output, 'LICENSE'));
await fs.writeFile(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(
    `Vendored Three.js ${pkg.version}: ${Object.keys(manifest.files).length} files with local-only imports`
);
