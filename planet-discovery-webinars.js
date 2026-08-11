/**
 * Planet Discovery Webinar Platform
 * Live and recorded webinars about exoplanet science
 */

class PlanetDiscoveryWebinars {
    constructor() {
        this.webinars = [];
        this.recordings = [];
        this.init();
    }

    init() {
        this.loadWebinars();
        this.loadRecordings();
        console.log('📹 Webinar platform initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_we_bi_na_rs_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    loadWebinars() {
        this.webinars = [
            {
                id: 'webinar-1',
                title: 'Introduction to Exoplanet Discovery',
                presenter: 'Dr. Sarah Johnson',
                date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                duration: '60 minutes',
                description: 'Learn the basics of exoplanet discovery methods',
                registrationOpen: true,
                type: 'live'
            },
            {
                id: 'webinar-2',
                title: 'Kepler Mission Deep Dive',
                presenter: 'Prof. Michael Chen',
                date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                duration: '90 minutes',
                description: 'Comprehensive overview of the Kepler mission achievements',
                registrationOpen: true,
                type: 'live'
            }
        ];
    }

    loadRecordings() {
        this.recordings = [
            {
                id: 'recording-1',
                title: 'Habitable Zones Explained',
                presenter: 'Dr. Emily Rodriguez',
                date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                duration: '45 minutes',
                description: 'Understanding the Goldilocks zone and potential for life',
                views: 1250,
                type: 'recording'
            },
            {
                id: 'recording-2',
                title: 'Transit Method Masterclass',
                presenter: 'Dr. James Wilson',
                date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
                duration: '75 minutes',
                description: 'Advanced techniques in transit photometry',
                views: 890,
                type: 'recording'
            }
        ];
    }

    renderWebinars(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        let html = `
            <div class="webinars-container" style="margin-top: 2rem;">
                <h3 style="color: #ba944f; margin-bottom: 1.5rem; text-align: center;">📹 Webinar Platform</h3>
                
                <div style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin-bottom: 2rem;">
                    <div style="display: flex; gap: 1rem; justify-content: center;">
                        <button id="show-live-webinars" class="webinar-tab active" style="padding: 0.75rem 1.5rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: #ba944f; cursor: pointer; font-weight: 600;">
                            🔴 Live Webinars
                        </button>
                        <button id="show-recordings" class="webinar-tab" style="padding: 0.75rem 1.5rem; background: rgba(107, 114, 128, 0.2); border: 2px solid rgba(107, 114, 128, 0.5); border-radius: 10px; color: rgba(255, 255, 255, 0.7); cursor: pointer; font-weight: 600;">
                            📼 Recordings
                        </button>
                    </div>
                </div>
                
                <div id="webinars-content">
                    <div class="webinars-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 2rem;">
        `;

        this.webinars.forEach(webinar => {
            html += this.createWebinarCard(webinar);
        });

        html += `
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Event listeners
        this.webinars.forEach(webinar => {
            const card = document.querySelector(`[data-webinar-id="${webinar.id}"]`);
            if (card) {
                card.addEventListener('click', () => {
                    this.showWebinarDetails(webinar.id);
                });
            }
        });

        document.getElementById('show-live-webinars')?.addEventListener('click', () => {
            this.showLiveWebinars();
        });

        document.getElementById('show-recordings')?.addEventListener('click', () => {
            this.showRecordings();
        });
    }

    createWebinarCard(webinar) {
        const daysUntil = Math.ceil((new Date(webinar.date) - Date.now()) / (1000 * 60 * 60 * 24));

        return `
            <div class="webinar-card" data-webinar-id="${webinar.id}" style="background: linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(20, 20, 30, 0.9)); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; cursor: pointer; transition: all 0.3s ease;">
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                        <h4 style="color: #ba944f; margin-bottom: 0.5rem;">${webinar.title}</h4>
                        ${webinar.type === 'live' ? '<span style="background: rgba(239, 68, 68, 0.8); padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: bold; color: white;">🔴 LIVE</span>' : ''}
                    </div>
                    <p style="opacity: 0.8; font-size: 0.9rem; margin-bottom: 1rem;">${webinar.description}</p>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; font-size: 0.85rem; opacity: 0.7;">
                        <span>👤 ${webinar.presenter}</span>
                        <span>⏱️ ${webinar.duration}</span>
                        ${webinar.type === 'live' ? `<span>📅 ${daysUntil} days until</span>` : `<span>👁️ ${webinar.views} views</span>`}
                    </div>
                    <button style="width: 100%; padding: 0.75rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: #ba944f; cursor: pointer; font-weight: 600;">
                        ${webinar.type === 'live' ? 'Register' : 'Watch Recording'}
                    </button>
                </div>
            </div>
        `;
    }

    showLiveWebinars() {
        const content = document.getElementById('webinars-content');
        if (!content) return;

        content.innerHTML = `
            <div class="webinars-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 2rem;">
                ${this.webinars.map(w => this.createWebinarCard(w)).join('')}
            </div>
        `;

        // Update tab styles
        document.getElementById('show-live-webinars').style.background = 'rgba(186, 148, 79, 0.2)';
        document.getElementById('show-live-webinars').style.borderColor = 'rgba(186, 148, 79, 0.5)';
        document.getElementById('show-live-webinars').style.color = '#ba944f';
        document.getElementById('show-recordings').style.background = 'rgba(107, 114, 128, 0.2)';
        document.getElementById('show-recordings').style.borderColor = 'rgba(107, 114, 128, 0.5)';
        document.getElementById('show-recordings').style.color = 'rgba(255, 255, 255, 0.7)';

        // Re-attach event listeners
        this.webinars.forEach(webinar => {
            const card = document.querySelector(`[data-webinar-id="${webinar.id}"]`);
            if (card) {
                card.addEventListener('click', () => {
                    this.showWebinarDetails(webinar.id);
                });
            }
        });
    }

    showRecordings() {
        const content = document.getElementById('webinars-content');
        if (!content) return;

        content.innerHTML = `
            <div class="webinars-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 2rem;">
                ${this.recordings.map(r => this.createWebinarCard(r)).join('')}
            </div>
        `;

        // Update tab styles
        document.getElementById('show-live-webinars').style.background = 'rgba(107, 114, 128, 0.2)';
        document.getElementById('show-live-webinars').style.borderColor = 'rgba(107, 114, 128, 0.5)';
        document.getElementById('show-live-webinars').style.color = 'rgba(255, 255, 255, 0.7)';
        document.getElementById('show-recordings').style.background = 'rgba(186, 148, 79, 0.2)';
        document.getElementById('show-recordings').style.borderColor = 'rgba(186, 148, 79, 0.5)';
        document.getElementById('show-recordings').style.color = '#ba944f';

        // Re-attach event listeners
        this.recordings.forEach(recording => {
            const card = document.querySelector(`[data-webinar-id="${recording.id}"]`);
            if (card) {
                card.addEventListener('click', () => {
                    this.showWebinarDetails(recording.id);
                });
            }
        });
    }

    showWebinarDetails(webinarId) {
        const webinar = this.webinars.find(w => w.id === webinarId) || this.recordings.find(r => r.id === webinarId);
        if (!webinar) return;

        const modal = document.createElement('div');
        modal.id = 'webinar-details-modal';
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

        modal.innerHTML = `
            <div style="max-width: 800px; width: 100%; background: rgba(0, 0, 0, 0.8); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 15px; padding: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h2 style="color: #ba944f;">${webinar.title}</h2>
                    <button id="close-webinar-modal" style="background: transparent; border: 2px solid #ba944f; color: #ba944f; padding: 0.75rem 1.5rem; border-radius: 10px; cursor: pointer; font-weight: 600;">
                        ✕ Close
                    </button>
                </div>
                
                <div style="margin-bottom: 2rem;">
                    <p style="opacity: 0.9; line-height: 1.8; margin-bottom: 1rem;">${webinar.description}</p>
                    <div style="display: flex; gap: 1rem; font-size: 0.9rem; opacity: 0.7;">
                        <span>👤 ${webinar.presenter}</span>
                        <span>⏱️ ${webinar.duration}</span>
                        ${webinar.type === 'recording' ? `<span>👁️ ${webinar.views} views</span>` : ''}
                    </div>
                </div>
                
                ${webinar.type === 'live' ? `
                    <button id="register-webinar-btn" style="width: 100%; padding: 1rem; background: rgba(74, 222, 128, 0.2); border: 2px solid rgba(74, 222, 128, 0.5); border-radius: 10px; color: #4ade80; cursor: pointer; font-weight: 600; font-size: 1.1rem;">
                        📝 Register for Webinar
                    </button>
                ` : `
                    <button id="watch-recording-btn" style="width: 100%; padding: 1rem; background: rgba(74, 222, 128, 0.2); border: 2px solid rgba(74, 222, 128, 0.5); border-radius: 10px; color: #4ade80; cursor: pointer; font-weight: 600; font-size: 1.1rem;">
                        ▶ Watch Recording
                    </button>
                `}
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('close-webinar-modal').addEventListener('click', () => {
            modal.remove();
        });

        if (webinar.type === 'live') {
            document.getElementById('register-webinar-btn')?.addEventListener('click', () => {
                alert(`Registration for ${webinar.title} coming soon!`);
            });
        } else {
            document.getElementById('watch-recording-btn')?.addEventListener('click', () => {
                alert(`Video player for ${webinar.title} coming soon!`);
            });
        }
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscoveryWebinars = new PlanetDiscoveryWebinars();
}

