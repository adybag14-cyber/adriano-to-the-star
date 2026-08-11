/**
 * Planet Discovery Live Streaming
 * Live streaming for planet discoveries, events, and educational content
 */

class PlanetDiscoveryLiveStreaming {
    constructor() {
        this.streams = [];
        this.currentStream = null;
        this.isStreaming = false;
        this.init();
    }

    init() {
        this.loadStreams();
        console.log('📺 Live streaming initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_li_ve_st_re_am_in_g_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    loadStreams() {
        this.streams = [
            {
                id: 'nasa-live',
                title: 'NASA Live',
                description: 'Live feed from NASA missions and discoveries',
                streamUrl: 'https://www.youtube.com/embed/21X5lGlDOfg?autoplay=1',
                type: 'youtube',
                status: 'live',
                viewers: 0
            },
            {
                id: 'kepler-updates',
                title: 'Kepler Mission Updates',
                description: 'Real-time updates from the Kepler mission',
                streamUrl: null,
                type: 'custom',
                status: 'scheduled',
                scheduledTime: new Date(Date.now() + 86400000).toISOString() // Tomorrow
            },
            {
                id: 'exoplanet-news',
                title: 'Exoplanet Discovery News',
                description: 'Breaking news about new exoplanet discoveries',
                streamUrl: null,
                type: 'custom',
                status: 'offline'
            }
        ];
    }

    renderStreams(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        let html = `
            <div class="live-streaming-container" style="margin-top: 2rem;">
                <h3 style="color: #ba944f; margin-bottom: 1.5rem; text-align: center;">📺 Live Streaming</h3>
                
                <div class="streams-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 2rem;">
        `;

        this.streams.forEach(stream => {
            html += this.createStreamCard(stream);
        });

        html += `
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Setup event listeners
        this.streams.forEach(stream => {
            const card = document.querySelector(`[data-stream-id="${stream.id}"]`);
            if (card) {
                card.addEventListener('click', () => {
                    this.watchStream(stream.id);
                });
            }
        });
    }

    createStreamCard(stream) {
        const statusBadge = stream.status === 'live' 
            ? '<span style="background: rgba(239, 68, 68, 0.8); padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: bold; color: white;">🔴 LIVE</span>'
            : stream.status === 'scheduled'
            ? '<span style="background: rgba(251, 191, 36, 0.8); padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: bold; color: white;">⏰ Scheduled</span>'
            : '<span style="background: rgba(107, 114, 128, 0.8); padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: bold; color: white;">⚫ Offline</span>';

        return `
            <div class="stream-card" data-stream-id="${stream.id}" style="background: linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(20, 20, 30, 0.9)); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; overflow: hidden; cursor: pointer; transition: all 0.3s ease;">
                <div class="stream-thumbnail" style="position: relative; width: 100%; padding-top: 56.25%; background: rgba(0, 0, 0, 0.5);">
                    <div style="position: absolute; top: 10px; left: 10px;">
                        ${statusBadge}
                    </div>
                    ${stream.status === 'live' ? `
                        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 60px; height: 60px; background: rgba(239, 68, 68, 0.9); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                            ▶
                        </div>
                    ` : ''}
                </div>
                <div style="padding: 1.5rem;">
                    <h4 style="color: #ba944f; margin-bottom: 0.5rem;">${stream.title}</h4>
                    <p style="opacity: 0.8; font-size: 0.9rem; margin-bottom: 1rem;">${stream.description}</p>
                    ${stream.status === 'live' && stream.viewers > 0 ? `
                        <div style="font-size: 0.85rem; opacity: 0.7;">
                            👁️ ${stream.viewers.toLocaleString()} viewers
                        </div>
                    ` : stream.status === 'scheduled' ? `
                        <div style="font-size: 0.85rem; opacity: 0.7;">
                            ⏰ ${new Date(stream.scheduledTime).toLocaleString()}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    watchStream(streamId) {
        const stream = this.streams.find(s => s.id === streamId);
        if (!stream) {
            console.error(`Stream ${streamId} not found`);
            return;
        }

        this.currentStream = stream;
        this.showStreamPlayer(stream);
    }

    showStreamPlayer(stream) {
        const modal = document.createElement('div');
        modal.id = 'stream-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        `;

        let playerHTML = '';
        if (stream.type === 'youtube' && stream.streamUrl) {
            playerHTML = `
                <iframe 
                    width="100%" 
                    height="600" 
                    src="${stream.streamUrl}" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen
                    style="border-radius: 10px;">
                </iframe>
            `;
        } else {
            playerHTML = `
                <div style="text-align: center; padding: 4rem; background: rgba(0, 0, 0, 0.5); border-radius: 10px; color: rgba(255, 255, 255, 0.7);">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">📺</div>
                    <p>Stream ${stream.status === 'scheduled' ? 'scheduled for ' + new Date(stream.scheduledTime).toLocaleString() : 'currently offline'}</p>
                </div>
            `;
        }

        modal.innerHTML = `
            <div style="max-width: 1200px; width: 100%; position: relative;">
                <button id="close-stream-modal" style="position: absolute; top: -3rem; right: 0; background: transparent; border: 2px solid #ba944f; color: #ba944f; padding: 0.75rem 1.5rem; border-radius: 10px; cursor: pointer; font-weight: 600; z-index: 10001;">
                    ✕ Close
                </button>
                
                <div style="background: rgba(0, 0, 0, 0.8); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 15px; padding: 2rem;">
                    <h2 style="color: #ba944f; margin-bottom: 1rem;">${stream.title}</h2>
                    <p style="opacity: 0.8; margin-bottom: 1.5rem;">${stream.description}</p>
                    
                    <div class="stream-player-container">
                        ${playerHTML}
                    </div>
                    
                    ${stream.status === 'live' ? `
                        <div style="display: flex; gap: 1rem; margin-top: 1rem; align-items: center;">
                            <span style="background: rgba(239, 68, 68, 0.8); padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.85rem; font-weight: bold; color: white;">
                                🔴 LIVE
                            </span>
                            <span style="opacity: 0.7; font-size: 0.9rem;">
                                👁️ ${stream.viewers.toLocaleString()} viewers
                            </span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('close-stream-modal').addEventListener('click', () => {
            modal.remove();
            this.currentStream = null;
        });

        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.getElementById('stream-modal')) {
                modal.remove();
                this.currentStream = null;
            }
        });
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscoveryLiveStreaming = new PlanetDiscoveryLiveStreaming();
}

