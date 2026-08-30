importScripts('brotli2-prototype.js');

const makePattern = size => {
  const phrase = new TextEncoder().encode('{"mission":"kepler","status":"research","value":42}\n');
  const bytes = new Uint8Array(size);
  for (let index = 0; index < size; index += 1) bytes[index] = phrase[index % phrase.length];
  return bytes;
};
const equal = (left, right) => left.length === right.length && left.every((value, index) => value === right[index]);

self.addEventListener('message', event => {
  if (event.data?.type !== 'run') return;
  const maximum = Math.min(16384, Math.max(1024, Number(event.data.maximum) || 16384));
  const sizes = [1024, 4096, 8192, 16384].filter(size => size <= maximum);
  const results = [];
  try {
    sizes.forEach(size => {
      const input = makePattern(size);
      const codec = new self.Brotli2();
      const started = performance.now();
      const compressed = codec.compress(input);
      const compressedAt = performance.now();
      const output = codec.decompress(compressed);
      const completed = performance.now();
      results.push({
        name: `Pattern ${size / 1024} KB`,
        inputBytes: input.byteLength,
        outputBytes: compressed.byteLength,
        ratio: input.byteLength / Math.max(1, compressed.byteLength),
        compressionMs: compressedAt - started,
        decompressionMs: completed - compressedAt,
        verified: equal(input, output),
        estimatedLiveBufferBytes: input.byteLength + compressed.byteLength + output.byteLength
      });
      self.postMessage({ type: 'progress', completed: results.length, total: sizes.length, name: results.at(-1).name });
    });
    self.postMessage({ type: 'result', results });
  } catch (error) {
    self.postMessage({ type: 'error', message: error?.message || String(error), results });
  }
});
