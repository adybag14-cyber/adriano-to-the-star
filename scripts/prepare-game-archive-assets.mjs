import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { inflateSync } from 'node:zlib';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = process.env.ARCHIVE_ASSET_DIR;
if (!source || !path.isAbsolute(source)) throw new Error('Set ARCHIVE_ASSET_DIR to the exact original SWF directory');
const output = path.join(root, '.artifacts/audit-20260904/archive/static-assets');
const outputIndex = path.join(root, 'games-archive-index.json');
const manifest = JSON.parse(await fs.readFile(path.join(root, 'games-manifest.json'), 'utf8'));
const replacements = { 'four_second_frenzy.swf': '______four_second_frenzy.swf' };
const MAX_ASSET_BYTES = 24 * 1024 * 1024;
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
await fs.mkdir(path.join(output, 'swf'), { recursive: true });
const records = {};
const counts = {};
let validBytes = 0;
let assetFiles = 0;
for (const entry of manifest) {
    if (!/^swf\/[^/]+\.swf$/i.test(entry.file)) throw new Error(`Unsafe game path: ${entry.file}`);
    const originalFilename = path.basename(entry.file);
    const filename = replacements[originalFilename] || originalFilename;
    const record = { status: 'unavailable' };
    let bytes;
    try {
        bytes = await fs.readFile(path.join(source, filename));
        const signature = bytes.toString('ascii', 0, 3);
        if (bytes.length < 8) throw new Error('The preserved file is empty or has an incomplete SWF header.');
        if (!['FWS', 'CWS', 'ZWS'].includes(signature)) throw new Error('The preserved download is not a Flash game file (HTML or another format).');
        const declared = bytes.readUInt32LE(4);
        let decodedBytes;
        if (signature === 'ZWS') {
            const validation = spawnSync(process.env.ARCHIVE_PYTHON || 'C:/Python314/python.exe', [path.join(root, 'scripts/validate-archive-lzma.py')], { input: bytes, maxBuffer: 1024 * 1024, timeout: 30000, windowsHide: true });
            if (validation.error || validation.status !== 0) throw new Error('LZMA validation could not complete.');
            const result = JSON.parse(validation.stdout.toString());
            if (!result.valid) throw new Error('The preserved LZMA stream is incomplete or invalid.');
            decodedBytes = result.decodedBytes;
        } else decodedBytes = signature === 'CWS' ? inflateSync(bytes.subarray(8), { maxOutputLength: 128 * 1024 * 1024 }).length + 8 : bytes.length;
        if (declared !== decodedBytes) throw new Error('The preserved file is truncated or disagrees with its SWF length header.');
        record.status = 'verified-container';
        record.bytes = bytes.length;
        record.sha256 = sha256(bytes);
        record.signature = signature;
        record.decodedBytes = decodedBytes;
        if (entry.file === 'swf/___________________bloxorz_coolmath.swf') {
            record.runtimeStatus = 'publisher-restricted';
            record.runtimeReason = 'This preserved Coolmath edition permits play only on its publisher website.';
            record.publisherUrl = 'https://www.coolmathgames.com/0-bloxorz';
        }
        if (entry.file === 'swf/___________________sugar_sugar.swf') {
            record.runtimeStatus = 'startup-blocked';
            record.runtimeReason = 'Startup stayed at its loader during an 88-second Chrome audit. This edition contains publisher site-lock logic, but the exact executed guard was not proven. Use the publisher version.';
            record.publisherUrl = 'https://www.coolmathgames.com/0-sugar-sugar';
        }
        if (replacements[originalFilename]) record.repairedPath = true;
        if (bytes.length > MAX_ASSET_BYTES) {
            record.chunks = [];
            for (let offset = 0; offset < bytes.length; offset += MAX_ASSET_BYTES) {
                const chunk = bytes.subarray(offset, offset + MAX_ASSET_BYTES);
                const chunkPath = `${entry.file}.part-${record.chunks.length}`;
                if (!process.env.ARCHIVE_INDEX_ONLY) await fs.writeFile(path.join(output, chunkPath), chunk);
                record.chunks.push({ path: chunkPath, bytes: chunk.length, sha256: sha256(chunk) });
                assetFiles++;
            }
        } else {
            if (!process.env.ARCHIVE_INDEX_ONLY) await fs.writeFile(path.join(output, entry.file), bytes);
            assetFiles++;
        }
        validBytes += bytes.length;
    } catch (error) {
        record.reason = error.code === 'ENOENT' ? 'No original SWF exists at the recorded archive path.' :
            /data check|end of file|decompress|invalid distance|invalid block/i.test(error.message) ? 'The preserved compressed SWF is damaged or truncated.' : error.message;
    }
    records[entry.file] = record;
    counts[record.status] = (counts[record.status] || 0) + 1;
}
const index = {
    schemaVersion: 1,
    assetBaseUrl: 'https://starisdons-archive-assets.adybag14.workers.dev',
    validatedAt: '2026-09-04',
    validation: 'Original container signatures, decompression and declared lengths checked. Container validity does not certify every legacy game feature in Ruffle.',
    entries: records
};
await fs.writeFile(outputIndex, `${JSON.stringify(index, null, 2)}\n`);
await fs.writeFile(path.join(output, 'archive-index.json'), `${JSON.stringify(index)}\n`);
await fs.writeFile(path.join(output, '_headers'), '/*\n  Access-Control-Allow-Origin: *\n  Access-Control-Expose-Headers: Content-Length, Content-Range, ETag\n  X-Content-Type-Options: nosniff\n  Cache-Control: public, max-age=3600\n\n/swf/*\n  Content-Type: application/x-shockwave-flash\n');
await fs.writeFile(path.join(output, 'index.html'), '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="robots" content="noindex"><title>Legacy archive assets</title><h1>Legacy archive asset storage</h1><p>Original preserved SWF assets for <a href="https://adrianotothestar.com/games.html">the games vault</a>. Container validation does not guarantee every legacy runtime feature.</p></html>');
console.log(JSON.stringify({ sourceFiles: manifest.length, counts, validBytes, assetFiles: assetFiles + 3, maximumChunkBytes: MAX_ASSET_BYTES, output, outputIndex }, null, 2));
