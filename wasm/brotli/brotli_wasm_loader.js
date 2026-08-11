(function (global) {
    'use strict';

    let instancePromise = null;

    function toUint8Array(data) {
        if (data instanceof Uint8Array) {
            return data;
        }
        if (typeof data === 'string') {
            return new TextEncoder().encode(data);
        }
        return new Uint8Array(data);
    }

    async function init(options = {}) {
        if (instancePromise) {
            return instancePromise;
        }

        if (typeof BrotliWasmModule !== 'function') {
            throw new Error('BrotliWasmModule is not loaded. Include brotli_wasm.js before brotli_wasm_loader.js.');
        }

        instancePromise = BrotliWasmModule({
            locateFile: options.locateFile || function (path) {
                if (options.wasmPath) {
                    return options.wasmPath + '/' + path;
                }
                return path;
            }
        }).then(function (Module) {
            function getHeapU8() {
                if (Module.HEAPU8) {
                    return Module.HEAPU8;
                }
                if (Module.wasmMemory && Module.wasmMemory.buffer) {
                    return new Uint8Array(Module.wasmMemory.buffer);
                }
                if (Module.HEAP8 && Module.HEAP8.buffer) {
                    return new Uint8Array(Module.HEAP8.buffer);
                }
                return null;
            }

            function getHeapU32() {
                if (Module.HEAPU32) {
                    return Module.HEAPU32;
                }
                if (Module.wasmMemory && Module.wasmMemory.buffer) {
                    return new Uint32Array(Module.wasmMemory.buffer);
                }
                if (Module.HEAP32 && Module.HEAP32.buffer) {
                    return new Uint32Array(Module.HEAP32.buffer);
                }
                return null;
            }

            function compress(input, config) {
                const data = toUint8Array(input);
                const quality = config && Number.isFinite(config.quality) ? config.quality : 11;
                const lgwin = config && Number.isFinite(config.lgwin) ? config.lgwin : 22;

                const inputPtr = Module._malloc(data.length);
                const heapU8Input = getHeapU8();
                if (!heapU8Input) {
                    Module._free(inputPtr);
                    throw new Error('Brotli WASM memory not initialized');
                }
                heapU8Input.set(data, inputPtr);

                const outSizePtr = Module._malloc(4);
                const heapU32 = getHeapU32();
                if (!heapU32) {
                    Module._free(inputPtr);
                    Module._free(outSizePtr);
                    throw new Error('Brotli WASM memory not initialized');
                }
                heapU32[outSizePtr >> 2] = 0;

                const outPtr = Module._brotli_compress(inputPtr, data.length, outSizePtr, quality, lgwin);
                const outSize = heapU32[outSizePtr >> 2];

                Module._free(inputPtr);
                Module._free(outSizePtr);

                if (!outPtr || outSize === 0) {
                    if (outPtr) {
                        Module._brotli_free(outPtr);
                    }
                    return new Uint8Array();
                }

                const heapU8Output = getHeapU8();
                if (!heapU8Output) {
                    Module._brotli_free(outPtr);
                    throw new Error('Brotli WASM memory not initialized');
                }
                const output = new Uint8Array(outSize);
                output.set(heapU8Output.subarray(outPtr, outPtr + outSize));
                Module._brotli_free(outPtr);
                return output;
            }

            function decompress(input) {
                const data = toUint8Array(input);

                const inputPtr = Module._malloc(data.length);
                const heapU8Input = getHeapU8();
                if (!heapU8Input) {
                    Module._free(inputPtr);
                    throw new Error('Brotli WASM memory not initialized');
                }
                heapU8Input.set(data, inputPtr);

                const outSizePtr = Module._malloc(4);
                const heapU32 = getHeapU32();
                if (!heapU32) {
                    Module._free(inputPtr);
                    Module._free(outSizePtr);
                    throw new Error('Brotli WASM memory not initialized');
                }
                heapU32[outSizePtr >> 2] = 0;

                const outPtr = Module._brotli_decompress(inputPtr, data.length, outSizePtr);
                const outSize = heapU32[outSizePtr >> 2];

                Module._free(inputPtr);
                Module._free(outSizePtr);

                if (!outPtr || outSize === 0) {
                    if (outPtr) {
                        Module._brotli_free(outPtr);
                    }
                    return new Uint8Array();
                }

                const heapU8Output = getHeapU8();
                if (!heapU8Output) {
                    Module._brotli_free(outPtr);
                    throw new Error('Brotli WASM memory not initialized');
                }
                const output = new Uint8Array(outSize);
                output.set(heapU8Output.subarray(outPtr, outPtr + outSize));
                Module._brotli_free(outPtr);
                return output;
            }

            return {
                compress: compress,
                decompress: decompress,
                module: Module
            };
        });

        return instancePromise;
    }

    global.BrotliWasm = {
        init: init
    };
})(typeof window !== 'undefined' ? window : self);
