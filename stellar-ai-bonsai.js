(function () {
    'use strict';

    const RUNTIME_BASE = new URL('vendor/bitgpu/', document.currentScript?.src || location.href);
    const MODEL_ASSETS = 'https://cdn.jsdelivr.net/gh/stfurkan/bitgpu@v0.19.1/models';
    const CACHE_NAME = 'ita-bitgpu-models-v0.19.1';
    const prism = repository => `https://huggingface.co/prism-ml/${repository}/resolve/main`;
    const onnx = repository => `https://huggingface.co/onnx-community/${repository}/resolve/main`;
    const MODELS = {
        'bonsai-1.7b-gguf': {
            data: `${prism('Bonsai-1.7B-gguf')}/Bonsai-1.7B-Q1_0.gguf`,
            tokenizer: onnx('Bonsai-1.7B-ONNX'),
            aux: 'Bonsai-1.7B-Q1_0.aux.bin',
            downloadBytes: 240 * 1024 * 1024
        },
        'bonsai-4b-gguf': {
            data: `${prism('Bonsai-4B-gguf')}/Bonsai-4B-Q1_0.gguf`,
            tokenizer: onnx('Bonsai-4B-ONNX'),
            aux: 'Bonsai-4B-Q1_0.aux.bin',
            downloadBytes: 570 * 1024 * 1024
        },
        'bonsai-8b-gguf': {
            data: `${prism('Bonsai-8B-gguf')}/Bonsai-8B-Q1_0.gguf`,
            tokenizer: onnx('Bonsai-8B-ONNX'),
            aux: 'Bonsai-8B-Q1_0.aux.bin',
            downloadBytes: 1.2 * 1024 * 1024 * 1024
        },
        'bonsai-27b-gguf': {
            data: `${prism('Bonsai-27B-gguf')}/Bonsai-27B-Q1_0.gguf`,
            tokenizer: prism('Bonsai-27B-unpacked'),
            aux: 'Bonsai-27B-Q1_0.aux.bin',
            downloadBytes: 3.8 * 1024 * 1024 * 1024,
            generation: { temperature: 0.5, topP: 0.85, topK: 20 }
        }
    };

    let engine = null;
    let chat = null;
    let activeModel = null;
    let loadController = null;
    let generationController = null;
    let loadTask = null;
    let lastFailure = null;

    const element = id => document.getElementById(id);
    const setStatus = (message, state = 'idle') => {
        const output = element('bonsai-status');
        if (!output) return;
        output.textContent = message;
        output.dataset.state = state;
    };

    function formatBytes(bytes) {
        if (!Number.isFinite(bytes) || bytes <= 0) return '0 MB';
        const mib = bytes / 1048576;
        return mib >= 1024 ? `${(mib / 1024).toFixed(1)} GB` : `${mib.toFixed(0)} MB`;
    }

    async function refreshStorage() {
        const storageOutput = element('bonsai-storage');
        const removeButton = element('bonsai-remove');
        if (!storageOutput || !removeButton || !('caches' in window)) return;
        try {
            const cache = await caches.open(CACHE_NAME);
            const entries = await cache.keys();
            const estimate = await navigator.storage?.estimate?.();
            const persisted = await navigator.storage?.persisted?.();
            storageOutput.textContent = entries.length
                ? `${entries.length} cached model assets · ${formatBytes(estimate?.usage || 0)} total site storage${persisted ? ' · persistent' : ''}`
                : 'No model weights cached';
            removeButton.hidden = entries.length === 0;
        } catch {
            storageOutput.textContent = 'Storage estimate unavailable';
        }
    }

    const cancelled = () => new window.DOMException('Model loading cancelled.', 'AbortError');
    const assertActive = task => {
        if (task !== loadTask || task.controller.signal.aborted) throw cancelled();
    };
    const assetLabel = url => {
        const parsed = new URL(url);
        return `${parsed.pathname.split('/').pop()} from ${parsed.hostname}`;
    };
    const downloadError = (error, url, attempts, task) => {
        if (task.controller.signal.aborted) return cancelled();
        const failure = new Error(`${assetLabel(url)}: ${error.message || 'network connection failed'}${attempts ? ` after ${attempts} attempt(s)` : ''}. Retry when the source is reachable.`);
        failure.assetUrl = url;
        failure.attempts = attempts;
        return failure;
    };
    const waitForRetry = (ms, signal) => new Promise((resolve, reject) => {
        if (signal.aborted) { reject(cancelled()); return; }
        const abort = () => { clearTimeout(timer); reject(cancelled()); };
        const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, ms);
        signal.addEventListener('abort', abort, { once: true });
    });

    async function cachedResponse(url, task) {
        assertActive(task);
        const cache = 'caches' in window ? await caches.open(CACHE_NAME) : null;
        const hit = cache ? await cache.match(url) : null;
        assertActive(task);
        if (hit) return hit;
        let response;
        for (let attempt = 1; attempt <= 3; attempt += 1) {
            assertActive(task);
            const requestController = new AbortController();
            const abortRequest = () => requestController.abort();
            task.controller.signal.addEventListener('abort', abortRequest, { once: true });
            // Bound waiting for headers without timing out a slow multi-GB body.
            const timer = setTimeout(() => requestController.abort(new Error('Connection timed out')), 20_000);
            try {
                setStatus(`Downloading ${assetLabel(url)} · attempt ${attempt}/3. Cancel stops this request.`, 'loading');
                response = await fetch(url, { signal: requestController.signal, cache: 'no-store', credentials: 'omit', mode: 'cors' });
                clearTimeout(timer);
                if (!response.ok) {
                    const error = new Error(`HTTP ${response.status}`);
                    error.retryable = response.status === 408 || response.status === 429 || response.status >= 500;
                    await response.body?.cancel();
                    throw error;
                }
                // Keep abortRequest bound until the complete body/cache write is
                // consumed so Cancel also stops weights already being streamed.
                task.requestCleanups.push(() => task.controller.signal.removeEventListener('abort', abortRequest));
                break;
            } catch (error) {
                clearTimeout(timer);
                task.controller.signal.removeEventListener('abort', abortRequest);
                if (task.controller.signal.aborted) throw cancelled();
                if (attempt === 3 || error.retryable === false) throw downloadError(error, url, attempt, task);
                await waitForRetry(attempt * 600, task.controller.signal);
            }
        }
        assertActive(task);
        if (cache) {
            const write = cache.put(url, response.clone()).catch(() => {});
            task.cacheWrites.push(write);
        }
        return response;
    }

    function fetchersFor(task) {
        const consume = async (url, method) => {
            try {
                const response = await cachedResponse(url, task);
                const value = await response[method]();
                assertActive(task);
                return value;
            } catch (error) { throw error.assetUrl || error.name === 'AbortError' ? error : downloadError(error, url, 0, task); }
        };
        return {
            fetchJson: url => consume(url, 'json'),
            fetchArrayBuffer: url => consume(url, 'arrayBuffer'),
            fetchStream: async url => {
                const response = await cachedResponse(url, task);
                if (!response.body) throw downloadError(new Error('Empty response body'), url, 0, task);
                const reader = response.body.getReader();
                return new window.ReadableStream({
                    async pull(controller) {
                        try {
                            assertActive(task);
                            const { done, value } = await reader.read();
                            if (done) controller.close(); else controller.enqueue(value);
                        } catch (error) { controller.error(downloadError(error, url, 0, task)); }
                    },
                    cancel: reason => reader.cancel(reason)
                });
            }
        };
    }

    function setLoadingUi(loading) {
        const loadButton = element('bonsai-load');
        const cancelButton = element('bonsai-cancel');
        const modelSelect = element('bonsai-model');
        if (loadButton) loadButton.disabled = loading || Boolean(generationController);
        if (cancelButton) cancelButton.disabled = !loading && !generationController;
        if (modelSelect) modelSelect.disabled = loading || Boolean(generationController);
    }

    async function loadModel() {
        if (loadTask || generationController) return;
        const modelSelect = element('bonsai-model');
        const progress = element('bonsai-progress');
        const key = modelSelect?.value;
        const model = MODELS[key];
        if (!model) return;
        if (!navigator.gpu) {
            setStatus('WebGPU is unavailable. Use a current desktop Chrome or Edge browser with WebGPU enabled.', 'error');
            return;
        }
        if (key === 'bonsai-27b-gguf' && !confirm('Bonsai 27B downloads about 3.8 GB and is intended for systems with at least 16 GB of available memory. Continue this explicit download?')) return;
        try {
            const estimate = await navigator.storage?.estimate?.();
            if (estimate?.quota && estimate?.usage != null && estimate.quota - estimate.usage < model.downloadBytes * 1.15) {
                setStatus(`This browser reports less than the recommended free storage for ${key}. Free space or choose a smaller model.`, 'error');
                return;
            }
        } catch {}

        loadController?.abort();
        engine?.dispose?.();
        engine = null;
        chat = null;
        activeModel = null;
        loadController = new AbortController();
        const task = { controller: loadController, cacheWrites: [], requestCleanups: [], candidate: null };
        loadTask = task;
        lastFailure = null;
        const { fetchJson, fetchArrayBuffer, fetchStream } = fetchersFor(task);
        setLoadingUi(true);
        if (progress) {
            progress.value = 0;
            progress.hidden = false;
        }

        try {
            setStatus('Loading the pinned BitGPU runtime. Model weights have not started until this action.', 'loading');
            navigator.storage?.persist?.().catch(() => {});
            const [{ createEngine, WebGPUUnavailableError }, { createChat }] = await Promise.all([
                import(new URL('index.js', RUNTIME_BASE).href),
                import(new URL('chat.js', RUNTIME_BASE).href)
            ]);
            assertActive(task);
            setStatus(`Loading ${key}. The first run downloads and caches its weights in this browser.`, 'loading');
            try {
                task.candidate = await createEngine({
                    manifestUrl: `${MODEL_ASSETS}/${key}/manifest.json`,
                    auxUrl: `${MODEL_ASSETS}/${key}/${model.aux}`,
                    dataUrl: model.data,
                    kvCache: 'q8',
                    activation: 'f16',
                    maxSeqLen: 4096,
                    fetchJson,
                    fetchArrayBuffer,
                    fetchStream,
                    onProgress: value => {
                        if (loadTask === task && progress && value.total) progress.value = value.loaded / value.total;
                    }
                });
            } catch (error) {
                if (WebGPUUnavailableError && error instanceof WebGPUUnavailableError) {
                    throw new Error('WebGPU is not available on this browser or graphics adapter.');
                }
                throw error;
            }
            assertActive(task);
            const candidateChat = await createChat(task.candidate, {
                tokenizerJsonUrl: `${model.tokenizer}/tokenizer.json`,
                tokenizerConfigUrl: `${model.tokenizer}/tokenizer_config.json`,
                fetchJson
            });
            assertActive(task);
            engine = task.candidate;
            chat = candidateChat;
            activeModel = key;
            const capability = engine.capabilities || {};
            const adapter = capability.adapter?.vendor || 'WebGPU adapter';
            setStatus(`${key} is ready on ${adapter}. Prompts and generated tokens remain local.`, 'ready');
            const primaryModel = element('model-selector');
            if (primaryModel) {
                primaryModel.value = 'bonsai-local';
                primaryModel.dispatchEvent(new Event('change', { bubbles: true }));
            }
        } catch (error) {
            task.controller.abort();
            task.candidate?.dispose?.();
            if (loadTask !== task) return;
            engine = null;
            chat = null;
            activeModel = null;
            if (error.name !== 'AbortError') lastFailure = { assetUrl: error.assetUrl || null, attempts: error.attempts || 0, message: error.message, at: new Date().toISOString() };
            setStatus(error.name === 'AbortError' ? 'Model loading cancelled.' : `Local model load failed: ${error.message}`, error.name === 'AbortError' ? 'idle' : 'error');
        } finally {
            await Promise.allSettled(task.cacheWrites);
            task.requestCleanups.forEach(cleanup => cleanup());
            if (loadTask !== task) return;
            loadTask = null;
            loadController = null;
            if (progress) progress.hidden = true;
            setLoadingUi(false);
            refreshStorage();
        }
    }

    async function generate(messages) {
        if (!chat || !engine || !activeModel) throw new Error('Load a Bonsai model before sending a local prompt.');
        generationController?.abort();
        generationController = new AbortController();
        setLoadingUi(false);
        const cancelButton = element('bonsai-cancel');
        if (cancelButton) cancelButton.disabled = false;
        setStatus(`Generating locally with ${activeModel}…`, 'loading');
        try {
            const generation = MODELS[activeModel].generation || {
                temperature: 0.5,
                topK: 20,
                minP: 0.05,
                repetitionPenalty: 1.1
            };
            const result = await chat.send(messages, {
                ...generation,
                maxTokens: 1024,
                signal: generationController.signal
            });
            if (result.finishReason === 'abort') throw new Error('Local generation was cancelled.');
            const rate = Number.isFinite(result.tokensPerSecond) ? ` · ${result.tokensPerSecond.toFixed(1)} tokens/s` : '';
            setStatus(`${activeModel} ready${rate}. Nothing was sent to an inference server.`, 'ready');
            return result.text;
        } finally {
            generationController = null;
            if (cancelButton) cancelButton.disabled = true;
            setLoadingUi(false);
        }
    }

    async function removeDownloads() {
        const task = loadTask;
        loadController?.abort();
        generationController?.abort();
        engine?.dispose?.();
        engine = null;
        chat = null;
        activeModel = null;
        if (task) {
            await Promise.allSettled(task.cacheWrites);
            task.requestCleanups.forEach(cleanup => cleanup());
        }
        loadTask = null;
        loadController = null;
        if ('caches' in window) await caches.delete(CACHE_NAME);
        setStatus('Bonsai Cache Storage entries were removed from this browser. Browser-managed HTTP cache is not used by this loader.', 'idle');
        await refreshStorage();
        setLoadingUi(false);
    }

    function cancelCurrentTask() {
        loadController?.abort();
        generationController?.abort();
    }

    function initialize() {
        element('bonsai-load')?.addEventListener('click', loadModel);
        element('bonsai-cancel')?.addEventListener('click', cancelCurrentTask);
        element('bonsai-remove')?.addEventListener('click', removeDownloads);
        const supported = Boolean(navigator.gpu);
        setStatus(
            supported
                ? 'WebGPU is available. No model has been downloaded; choose a size and press Load model.'
                : 'WebGPU is unavailable. Local Bonsai needs a current WebGPU-capable browser and GPU.',
            supported ? 'idle' : 'error'
        );
        refreshStorage();
    }

    window.stellarBonsai = {
        generate,
        isReady: () => Boolean(chat && engine && activeModel),
        activeModel: () => activeModel,
        cancel: cancelCurrentTask,
        models: Object.keys(MODELS),
        lastFailure: () => lastFailure
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
    else initialize();
})();
