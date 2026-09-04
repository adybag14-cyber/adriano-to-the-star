import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
const index = JSON.parse(await fs.readFile('games-archive-index.json', 'utf8'));
const base = 'https://starisdons-archive-assets.adybag14.workers.dev';
if (index.assetBaseUrl !== base) throw new Error('Unexpected archive deployment target');
const urlFor = relative => `${base}/${relative.split('/').map(encodeURIComponent).join('/')}`;
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const valid = Object.entries(index.entries).filter(([, record]) => record.status === 'verified-container');
const assets = valid.flatMap(([file, record]) => record.chunks || [{ path: file, bytes: record.bytes, sha256: record.sha256 }]);
const headResults = process.env.ARCHIVE_REUSE_HEAD_REPORT ? JSON.parse(await fs.readFile('.artifacts/audit-20260904/archive/remote-verification.json', 'utf8')).headResults : [];
let cursor = 0;
if (!headResults.length) await Promise.all(Array.from({ length: 3 }, async () => {
    while (cursor < assets.length) {
        const asset = assets[cursor++];
        try {
            const response = await fetch(urlFor(asset.path), { method: 'HEAD', signal: AbortSignal.timeout(15000) });
            headResults.push({ path: asset.path, status: response.status, expectedBytes: asset.bytes,
                bytes: response.headers.has('content-length') ? Number(response.headers.get('content-length')) : null, cors: response.headers.get('access-control-allow-origin'), contentType: response.headers.get('content-type') });
        } catch (error) { headResults.push({ path: asset.path, error: error.message }); }
    }
}));
const sampleNames = new Set(['swf/___________________sugar_sugar.swf', 'swf/zombieinvaders.swf', 'swf/four_second_frenzy.swf', 'swf/___________________bloxorz_coolmath.swf']);
const samples = valid.filter(([file, record]) => sampleNames.has(file) || record.chunks || record.signature === 'ZWS');
const checksums = [];
for (const [file, record] of samples) {
    const buffers = [];
    for (const chunk of record.chunks || [{ path: file, bytes: record.bytes, sha256: record.sha256 }]) {
        const response = await fetch(urlFor(chunk.path), { signal: AbortSignal.timeout(60000) });
        if (!response.ok) throw new Error(`Asset verification HTTP ${response.status}: ${chunk.path}`);
        const bytes = Buffer.from(await response.arrayBuffer());
        if (bytes.length !== chunk.bytes || sha256(bytes) !== chunk.sha256) throw new Error(`Asset checksum mismatch: ${chunk.path}`);
        buffers.push(bytes);
    }
    const bytes = Buffer.concat(buffers);
    if (sha256(bytes) !== record.sha256 || bytes.length !== record.bytes) throw new Error(`Reassembled checksum mismatch: ${file}`);
    checksums.push({ file, bytes: bytes.length, sha256: record.sha256, matched: true, parts: buffers.length });
}
const failures = headResults.filter(result => result.status !== 200 || (result.bytes > 0 && result.bytes !== result.expectedBytes) || result.cors !== '*' || !result.contentType?.includes('application/x-shockwave-flash'));
const report = { checkedAt: new Date().toISOString(), base, verifiedContainers: valid.length, staticAssetsChecked: headResults.length,
    lengthEvidence: 'HEAD responses may omit Content-Length. Complete payload byte counts and SHA256 values were verified by GET for the listed checksum samples only.', failures, checksums, headResults };
await fs.writeFile(path.join('.artifacts/audit-20260904/archive', 'remote-verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ...report, failureCount: failures.length, failures: failures.slice(0, 5), headResults: undefined }, null, 2));
if (failures.length) process.exitCode = 1;
