/**
 * Real-time Streaming Data Processing
 * Process streaming data in real-time
 */
(function() {
    'use strict';

    class RealtimeStreamingDataProcessing {
        constructor() {
            this.streams = new Map();
            this.processors = [];
            this.init();
        }

        init() {
            this.setupUI();
        }

        setupUI() {
            if (!document.getElementById('streaming-processing')) {
                const processing = document.createElement('div');
                processing.id = 'streaming-processing';
                processing.className = 'streaming-processing';
                processing.innerHTML = `<h2>Streaming Processing</h2>`;
                document.body.appendChild(processing);
            }
        }

        createStream(streamId, config) {
            const stream = {
                id: streamId,
                source: config.source,
                processors: config.processors || [],
                status: 'active'
            };
            this.streams.set(streamId, stream);
            this.startStream(stream);
            return stream;
        }

        startStream(stream) {
            // Connect to stream source
            if (stream.source.type === 'websocket') {
                this.connectWebSocketStream(stream);
            } else if (stream.source.type === 'sse') {
                this.connectSSEStream(stream);
            }
        }

        connectWebSocketStream(stream) {
            const ws = new WebSocket(stream.source.url);
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.processStreamData(stream, data);
            };
        }

        connectSSEStream(stream) {
            const eventSource = new EventSource(stream.source.url);
            eventSource.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.processStreamData(stream, data);
            };
        }

        processStreamData(stream, data) {
            let processed = data;
            stream.processors.forEach(processor => {
                processed = processor(processed);
            });
            this.emitProcessed(stream.id, processed);
        }

        emitProcessed(streamId, data) {
            window.dispatchEvent(new CustomEvent(`stream:${streamId}`, {
                detail: data
            }));
        }

        addProcessor(streamId, processor) {
            const stream = this.streams.get(streamId);
            if (stream) {
                stream.processors.push(processor);
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.streamingProcessing = new RealtimeStreamingDataProcessing();
        });
    } else {
        window.streamingProcessing = new RealtimeStreamingDataProcessing();
    }
})();

