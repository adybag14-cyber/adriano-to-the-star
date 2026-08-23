(function () {
    'use strict';

    const BITGPU = 'https://esm.sh/bitgpu@0.19.1';
    const MODEL_ASSETS = 'https://cdn.jsdelivr.net/gh/stfurkan/bitgpu@v0.19.1/models';
    const CACHE_NAME = 'ita-bitgpu-models-v0.19.1';
    const prism = repository => `https://huggingface.co/prism-ml/${repository}/resolve/main`;
    const onnx = repository => `https://huggingface.co/onnx-community/${repository}/resolve/main`;
    const MODELS = {
        'bonsai-1.7b-gguf': {
            data: `${prism('Bonsai-1.7B-gguf')}/Bonsai-1.7B-Q1_0.gguf`,
            tokenizer: onnx('Bonsai-1.7B-ONNX'),
            aux: 'Bonsai-1.7B-Q1_0.aux.bin'
        },
        'bonsai-4b-gguf': {
            data: `${prism('Bonsai-4B-gguf')}/Bonsai-4B-Q1_0.gguf`,
            tokenizer: onnx('Bonsai-4B-ONNX'),
            aux: 'Bonsai-4B-Q1_0.aux.bin'
        },
        'bonsai-8b-gguf': {
            data: `${prism('Bonsai-8B-gguf')}/Bonsai-8B-Q1_0.gguf`,
            tokenizer: onnx('Bonsai-8B-ONNX'),
            aux: 'Bonsai-8B-Q1_0.aux.bin'
        },
        'bonsai-27b-gguf': {
            data: `${prism('Bonsai-27B-gguf')}/Bonsai-27B-Q1_0.gguf`,
            tokenizer: prism('Bonsai-27B-unpacked'),
            aux: 'Bonsai-27B-Q1_0.aux.bin',
            generation: { temperature: 0.5, topP: 0.85, topK: 20 }
        }
    };

    let engine = null;
    let chat = null;
    let activeModel = null;
    let loadController = null;
    let generationController = null;

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
                ? `${formatBytes(estimate?.usage || 0)} stored locally${persisted ? ' · persistent' : ''}`
                : 'No model weights cached';
            removeButton.hidden = entries.length === 0;
        } catch {
            storageOutput.textContent = 'Storage estimate unavailable';
        }
    }

    async function cachedResponse(url) {
        if (!('caches' in window)) {
            return fetch(url, { signal: loadController?.signal });
        }
        const cache = await caches.open(CACHE_NAME);
        const hit = await cache.match(url);
        if (hit) return hit;
        const response = await fetch(url, { signal: loadController?.signal });
        if (!response.ok) throw new Error(`Model asset request failed with HTTP ${response.status}.`);
        cache.put(url, response.clone()).catch(() => {});
        return response;
    }

    const fetchJson = async url => (await cachedResponse(url)).json();
    const fetchArrayBuffer = async url => (await cachedResponse(url)).arrayBuffer();
    const fetchStream = async url => (await cachedResponse(url)).body;

    function setLoadingUi(loading) {
        const loadButton = element('bonsai-load');
        const cancelButton = element('bonsai-cancel');
        const modelSelect = element('bonsai-model');
        if (loadButton) loadButton.disabled = loading;
        if (cancelButton) cancelButton.disabled = !loading && !generationController;
        if (modelSelect) modelSelect.disabled = loading;
    }

    async function loadModel() {
        const modelSelect = element('bonsai-model');
        const progress = element('bonsai-progress');
        const key = modelSelect?.value;
        const model = MODELS[key];
        if (!model) return;
        if (!navigator.gpu) {
            setStatus('WebGPU is unavailable. Use a current desktop Chrome or Edge browser with WebGPU enabled.', 'error');
            return;
        }

        loadController?.abort();
        loadController = new AbortController();
        setLoadingUi(true);
        if (progress) {
            progress.value = 0;
            progress.hidden = false;
        }

        try {
            setStatus('Loading the pinned BitGPU runtime. Model weights have not started until this action.', 'loading');
            navigator.storage?.persist?.().catch(() => {});
            const [{ createEngine, WebGPUUnavailableError }, { createChat }] = await Promise.all([
                import(BITGPU),
                import(`${BITGPU}/chat`)
            ]);
            setStatus(`Loading ${key}. The first run downloads and caches its weights in this browser.`, 'loading');
            try {
                engine = await createEngine({
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
                        if (progress && value.total) progress.value = value.loaded / value.total;
                    }
                });
            } catch (error) {
                if (WebGPUUnavailableError && error instanceof WebGPUUnavailableError) {
                    throw new Error('WebGPU is not available on this browser or graphics adapter.');
                }
                throw error;
            }
            chat = await createChat(engine, {
                tokenizerJsonUrl: `${model.tokenizer}/tokenizer.json`,
                tokenizerConfigUrl: `${model.tokenizer}/tokenizer_config.json`,
                fetchJson
            });
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
            engine = null;
            chat = null;
            activeModel = null;
            setStatus(error.name === 'AbortError' ? 'Model loading cancelled.' : `Local model load failed: ${error.message}`, 'error');
        } finally {
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
        }
    }

    async function removeDownloads() {
        loadController?.abort();
        generationController?.abort();
        engine = null;
        chat = null;
        activeModel = null;
        if ('caches' in window) await caches.delete(CACHE_NAME);
        setStatus('Downloaded Bonsai model files were removed from this browser.', 'idle');
        await refreshStorage();
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
            supported ? 'ready' : 'error'
        );
        refreshStorage();
    }

    window.stellarBonsai = {
        generate,
        isReady: () => Boolean(chat && engine && activeModel),
        activeModel: () => activeModel,
        cancel: cancelCurrentTask,
        models: Object.keys(MODELS)
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
    else initialize();
})();
