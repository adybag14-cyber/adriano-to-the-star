import fs from 'node:fs';
import path from 'node:path';
import { minify } from 'terser';

const publicRoot = path.resolve(process.argv[2] || 'public');
const htmlPath = path.join(publicRoot, 'exoplanet-pioneer.html');

if (!fs.existsSync(htmlPath)) {
    throw new Error(`Pioneer page not found: ${htmlPath}`);
}

const html = fs.readFileSync(htmlPath, 'utf8');
const scriptTagPattern = /<script\b([^>]*)\bsrc\s*=\s*(["'])([^"']+\.js(?:\?[^"']*)?)\2([^>]*)><\/script>/gi;
const targets = new Map();
let match;

function parseLocalSource(source) {
    if (/^(?:https?:)?\/\//i.test(source) || /^(?:data:|blob:)/i.test(source)) return null;
    const suffixIndex = source.search(/[?#]/);
    const rawPath = suffixIndex >= 0 ? source.slice(0, suffixIndex) : source;
    const suffix = suffixIndex >= 0 ? source.slice(suffixIndex) : '';
    const cleanSource = rawPath.replace(/^\/+/, '');
    return cleanSource ? { rawPath, cleanSource, suffix } : null;
}

while ((match = scriptTagPattern.exec(html)) !== null) {
    const attributes = `${match[1]} ${match[4]}`;
    const parsed = parseLocalSource(match[3]);
    if (!parsed) continue;
    if (/\.pioneer\.min\.js$/i.test(parsed.cleanSource)) continue;

    const absolutePath = path.resolve(publicRoot, parsed.cleanSource);
    const relativeCheck = path.relative(publicRoot, absolutePath);
    if (relativeCheck.startsWith('..') || path.isAbsolute(relativeCheck)) {
        throw new Error(`Pioneer script resolves outside Pages artifact: ${match[3]}`);
    }
    if (!fs.existsSync(absolutePath)) {
        throw new Error(`Pioneer script missing from Pages artifact: ${match[3]}`);
    }

    const isModule = /\btype\s*=\s*(["'])module\1/i.test(attributes);
    const previous = targets.get(absolutePath);
    if (previous && previous.isModule !== isModule) {
        throw new Error(`Pioneer script is referenced as both module and classic: ${parsed.cleanSource}`);
    }
    targets.set(absolutePath, { source: parsed.cleanSource, isModule });
}

if (targets.size === 0) {
    if (/\.pioneer\.min\.js(?:[?#][^"']*)?["']/i.test(html)) {
        console.log('Pioneer startup scripts are already minified in this Pages artifact.');
        process.exit(0);
    }
    throw new Error('No local Pioneer scripts were discovered for minification.');
}

let originalBytes = 0;
let minifiedBytes = 0;
const results = [];
const rewrites = new Map();

for (const [absolutePath, target] of targets) {
    const original = fs.readFileSync(absolutePath, 'utf8');
    const output = await minify(original, {
        module: target.isModule,
        compress: true,
        mangle: true,
        toplevel: false,
        format: {
            comments: /@license|@preserve|^!/
        }
    });

    if (!output.code || typeof output.code !== 'string') {
        throw new Error(`Terser produced no JavaScript for ${target.source}`);
    }

    const minifiedSource = target.source.replace(/\.js$/i, '.pioneer.min.js');
    const minifiedPath = path.resolve(publicRoot, minifiedSource);
    const relativeCheck = path.relative(publicRoot, minifiedPath);
    if (relativeCheck.startsWith('..') || path.isAbsolute(relativeCheck)) {
        throw new Error(`Minified Pioneer script resolves outside Pages artifact: ${minifiedSource}`);
    }

    fs.mkdirSync(path.dirname(minifiedPath), { recursive: true });
    fs.writeFileSync(minifiedPath, output.code, 'utf8');

    const originalSize = Buffer.byteLength(original);
    const minifiedSize = Buffer.byteLength(output.code);
    originalBytes += originalSize;
    minifiedBytes += minifiedSize;
    rewrites.set(target.source, minifiedSource);
    results.push({ source: target.source, minifiedSource, originalSize, minifiedSize });
}

let rewrittenHtml = html.replace(scriptTagPattern, (fullTag, before, quote, source) => {
    const parsed = parseLocalSource(source);
    if (!parsed) return fullTag;
    const replacement = rewrites.get(parsed.cleanSource);
    if (!replacement) return fullTag;
    const prefix = parsed.rawPath.startsWith('/') ? '/' : '';
    return fullTag.replace(source, `${prefix}${replacement}${parsed.suffix}`);
});

if (rewrittenHtml === html) {
    throw new Error('Pioneer script minification succeeded but no HTML script references were rewritten.');
}

function collectScriptReferences(markup) {
    const refs = [];
    const pattern = /<script\b([^>]*)\bsrc\s*=\s*(["'])([^"']+\.js(?:\?[^"']*)?)\2([^>]*)><\/script>/gi;
    let scriptMatch;
    while ((scriptMatch = pattern.exec(markup)) !== null) {
        const parsed = parseLocalSource(scriptMatch[3]);
        refs.push({
            fullTag: scriptMatch[0],
            source: scriptMatch[3],
            parsed,
            attributes: `${scriptMatch[1]} ${scriptMatch[4]}`,
            start: scriptMatch.index,
            end: pattern.lastIndex
        });
    }
    return refs;
}

function assertBundleGroup(markup, members, label) {
    if (members.length < 2) throw new Error(`${label} does not contain enough scripts to bundle.`);
    for (const member of members) {
        if (!member.parsed || !/\.pioneer\.min\.js$/i.test(member.parsed.cleanSource)) {
            throw new Error(`${label} contains a non-Pioneer-minified script: ${member.source}`);
        }
        if (/\btype\s*=\s*(["'])module\1/i.test(member.attributes)) {
            throw new Error(`${label} unexpectedly contains a module script: ${member.source}`);
        }
        if (!/\bdefer\b/i.test(member.attributes)) {
            throw new Error(`${label} unexpectedly contains a non-deferred script: ${member.source}`);
        }
    }

    const span = markup.slice(members[0].start, members[members.length - 1].end);
    const scriptTagCount = (span.match(/<script\b/gi) || []).length;
    if (scriptTagCount !== members.length) {
        throw new Error(`${label} crosses an inline or external script boundary.`);
    }
}

function createOrderedBundle(bundleSource, members) {
    const chunks = [];
    for (const member of members) {
        const absolutePath = path.resolve(publicRoot, member.parsed.cleanSource);
        const relativeCheck = path.relative(publicRoot, absolutePath);
        if (relativeCheck.startsWith('..') || path.isAbsolute(relativeCheck)) {
            throw new Error(`Bundle member resolves outside Pages artifact: ${member.source}`);
        }
        const code = fs.readFileSync(absolutePath, 'utf8');
        chunks.push(`/* ${member.parsed.cleanSource} */\n${code}`);
    }

    const bundleCode = chunks.join(';\n');
    // Parse the concatenated classic script before writing. This catches duplicate
    // top-level lexical declarations that are legal across separate script tags but
    // would be invalid after request consolidation.
    new Function(bundleCode);

    const bundlePath = path.resolve(publicRoot, bundleSource);
    const relativeCheck = path.relative(publicRoot, bundlePath);
    if (relativeCheck.startsWith('..') || path.isAbsolute(relativeCheck)) {
        throw new Error(`Pioneer bundle resolves outside Pages artifact: ${bundleSource}`);
    }
    fs.writeFileSync(bundlePath, bundleCode, 'utf8');

    const first = members[0];
    const prefix = first.parsed.rawPath.startsWith('/') ? '/' : '';
    const bundleTag = first.fullTag.replace(first.source, `${prefix}${bundleSource}${first.parsed.suffix}`);
    return {
        source: bundleSource,
        tag: bundleTag,
        start: members[0].start,
        end: members[members.length - 1].end,
        memberCount: members.length,
        bytes: Buffer.byteLength(bundleCode),
        members
    };
}

const scriptRefs = collectScriptReferences(rewrittenHtml);
const aiCoreSource = rewrites.get('ai-core.js');
const pioneerCoreSource = rewrites.get('exoplanet-pioneer.js');
if (!aiCoreSource || !pioneerCoreSource) {
    throw new Error('Pioneer request consolidation could not locate the AI-core/core execution barriers.');
}

const aiCoreIndex = scriptRefs.findIndex((ref) => ref.parsed?.cleanSource === aiCoreSource);
const pioneerCoreIndex = scriptRefs.findIndex((ref) => ref.parsed?.cleanSource === pioneerCoreSource);
if (aiCoreIndex <= 0 || pioneerCoreIndex <= aiCoreIndex + 1) {
    throw new Error('Pioneer request consolidation found an unexpected script ordering.');
}

const foundationGroup = scriptRefs.slice(0, aiCoreIndex);
const systemsGroup = scriptRefs.slice(aiCoreIndex + 1, pioneerCoreIndex);
assertBundleGroup(rewrittenHtml, foundationGroup, 'Pioneer foundation group');
assertBundleGroup(rewrittenHtml, systemsGroup, 'Pioneer systems group');

const bundles = [
    createOrderedBundle('pioneer-foundation.pioneer.bundle.min.js', foundationGroup),
    createOrderedBundle('pioneer-systems.pioneer.bundle.min.js', systemsGroup)
];

const tagEdits = [];
for (const bundle of bundles) {
    const [first, ...rest] = bundle.members;
    tagEdits.push({ start: first.start, end: first.end, replacement: bundle.tag });
    for (const member of rest) {
        tagEdits.push({ start: member.start, end: member.end, replacement: '' });
    }
}
for (const edit of tagEdits.sort((a, b) => b.start - a.start)) {
    rewrittenHtml = `${rewrittenHtml.slice(0, edit.start)}${edit.replacement}${rewrittenHtml.slice(edit.end)}`;
}

for (const bundle of bundles) {
    for (const member of bundle.members) {
        fs.unlinkSync(path.resolve(publicRoot, member.parsed.cleanSource));
    }
}

const finalRefs = collectScriptReferences(rewrittenHtml);
const startupRefs = finalRefs.filter((ref) => ref.parsed && (
    /\.pioneer\.(?:bundle\.)?min\.js$/i.test(ref.parsed.cleanSource)
));
if (startupRefs.length !== 4) {
    throw new Error(`Pioneer request consolidation expected 4 generated startup scripts, found ${startupRefs.length}.`);
}

fs.writeFileSync(htmlPath, rewrittenHtml, 'utf8');

results.sort((a, b) => (b.originalSize - b.minifiedSize) - (a.originalSize - a.minifiedSize));
const savedBytes = originalBytes - minifiedBytes;
const savedPercent = originalBytes ? ((savedBytes / originalBytes) * 100).toFixed(1) : '0.0';
const bundledMembers = bundles.reduce((sum, bundle) => sum + bundle.memberCount, 0);

console.log(`Created ${results.length} Pioneer-only minified scripts: ${originalBytes} -> ${minifiedBytes} bytes (${savedBytes} bytes / ${savedPercent}% saved).`);
console.log(`Consolidated ${bundledMembers} ordered classic scripts into ${bundles.length} bundles; Pioneer now uses ${startupRefs.length} generated startup script requests.`);
for (const bundle of bundles) {
    console.log(`  ${bundle.source}: ${bundle.memberCount} scripts, ${bundle.bytes} bytes`);
}
for (const result of results.slice(0, 8)) {
    console.log(`  ${result.source} -> ${result.minifiedSource}: ${result.originalSize} -> ${result.minifiedSize}`);
}
