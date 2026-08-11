/**
 * Planet Discovery Conference Integration
 * Integration with space and exoplanet conferences
 */

class PlanetDiscoveryConferences {
    constructor() {
        this.conferences = [];
        this.registrations = [];
        this.init();
    }

    init() {
        this.loadConferences();
        console.log('🎤 Conference integration initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_co_nf_er_en_ce_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    loadConferences() {
        this.conferences = [
            {
                id: 'conf-1',
                title: 'International Exoplanet Conference 2025',
                date: new Date('2025-06-15').toISOString(),
                location: 'San Francisco, CA',
                type: 'In-person',
                description: 'Annual conference on exoplanet discovery and research',
                speakers: ['Dr. Sarah Johnson', 'Prof. Michael Chen', 'Dr. Emily Rodriguez'],
                topics: ['Exoplanet Discovery', 'Habitable Zones', 'Atmospheric Analysis'],
                registrationOpen: true
            },
            {
                id: 'conf-2',
                title: 'Virtual Planet Discovery Summit',
                date: new Date('2025-04-20').toISOString(),
                location: 'Online',
                type: 'Virtual',
                description: 'Virtual summit for planet discovery enthusiasts',
                speakers: ['Dr. James Wilson', 'Dr. Lisa Anderson'],
                topics: ['Kepler Mission', 'TESS Discoveries', 'Future Missions'],
                registrationOpen: true
            },
            {
                id: 'conf-3',
                title: 'Space Science Symposium',
                date: new Date('2025-09-10').toISOString(),
                location: 'Boston, MA',
                type: 'Hybrid',
                description: 'Comprehensive symposium on space science and exoplanets',
                speakers: ['Multiple experts'],
                topics: ['Exoplanets', 'Space Missions', 'Astrobiology'],
                registrationOpen: false
            }
        ];
    }

    renderConferences(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        let html = `
            <div class="conferences-container" style="margin-top: 2rem;">
                <h3 style="color: #ba944f; margin-bottom: 1.5rem; text-align: center;">🎤 Conferences</h3>
                
                <div class="conferences-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 2rem;">
        `;

        this.conferences.forEach(conference => {
            html += this.createConferenceCard(conference);
        });

        html += `
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Event listeners
        this.conferences.forEach(conference => {
            const card = document.querySelector(`[data-conference-id="${conference.id}"]`);
            if (card) {
                card.addEventListener('click', () => {
                    this.showConferenceDetails(conference.id);
                });
            }
        });
    }

    createConferenceCard(conference) {
        const daysUntil = Math.ceil((new Date(conference.date) - Date.now()) / (1000 * 60 * 60 * 24));

        return `
            <div class="conference-card" data-conference-id="${conference.id}" style="background: linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(20, 20, 30, 0.9)); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; cursor: pointer; transition: all 0.3s ease;">
                <div>
                    <h4 style="color: #ba944f; margin-bottom: 0.5rem;">${conference.title}</h4>
                    <p style="opacity: 0.8; font-size: 0.9rem; margin-bottom: 1rem;">${conference.description}</p>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; font-size: 0.85rem; opacity: 0.7;">
                        <span>📅 ${new Date(conference.date).toLocaleDateString()}</span>
                        <span>📍 ${conference.location}</span>
                        <span>${conference.type === 'Virtual' ? '💻' : conference.type === 'Hybrid' ? '🌐' : '🏢'} ${conference.type}</span>
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <span style="background: ${conference.registrationOpen ? 'rgba(74, 222, 128, 0.2)' : 'rgba(107, 114, 128, 0.2)'}; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; color: ${conference.registrationOpen ? '#4ade80' : 'rgba(255, 255, 255, 0.5)'}; font-weight: 600;">
                            ${conference.registrationOpen ? '✅ Registration Open' : '⏸ Registration Closed'}
                        </span>
                    </div>
                    ${daysUntil > 0 ? `
                        <div style="font-size: 0.85rem; opacity: 0.7; margin-bottom: 1rem;">
                            ${daysUntil} days until conference
                        </div>
                    ` : ''}
                    <button style="width: 100%; padding: 0.75rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: #ba944f; cursor: pointer; font-weight: 600;">
                        View Details
                    </button>
                </div>
            </div>
        `;
    }

    showConferenceDetails(conferenceId) {
        const conference = this.conferences.find(c => c.id === conferenceId);
        if (!conference) return;

        const modal = document.createElement('div');
        modal.id = 'conference-details-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 10000;
            overflow-y: auto;
            padding: 2rem;
        `;

        modal.innerHTML = `
            <div style="max-width: 800px; margin: 0 auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h2 style="color: #ba944f;">${conference.title}</h2>
                    <button id="close-conference-modal" style="background: transparent; border: 2px solid #ba944f; color: #ba944f; padding: 0.75rem 1.5rem; border-radius: 10px; cursor: pointer; font-weight: 600;">
                        ✕ Close
                    </button>
                </div>
                
                <div style="background: rgba(0, 0, 0, 0.8); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 15px; padding: 2rem;">
                    <div style="margin-bottom: 2rem;">
                        <h4 style="color: #ba944f; margin-bottom: 1rem;">Description</h4>
                        <p style="opacity: 0.9; line-height: 1.8;">${conference.description}</p>
                    </div>
                    
                    <div style="margin-bottom: 2rem;">
                        <h4 style="color: #ba944f; margin-bottom: 1rem;">Details</h4>
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                            <div>
                                <span style="opacity: 0.7;">Date:</span>
                                <div style="color: #ba944f; font-weight: 600;">${new Date(conference.date).toLocaleDateString()}</div>
                            </div>
                            <div>
                                <span style="opacity: 0.7;">Location:</span>
                                <div style="color: #ba944f; font-weight: 600;">${conference.location}</div>
                            </div>
                            <div>
                                <span style="opacity: 0.7;">Type:</span>
                                <div style="color: #ba944f; font-weight: 600;">${conference.type}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 2rem;">
                        <h4 style="color: #ba944f; margin-bottom: 1rem;">Featured Speakers</h4>
                        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                            ${conference.speakers.map(speaker => `
                                <span style="background: rgba(186, 148, 79, 0.2); padding: 0.5rem 1rem; border-radius: 8px; color: #ba944f;">${speaker}</span>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 2rem;">
                        <h4 style="color: #ba944f; margin-bottom: 1rem;">Topics</h4>
                        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                            ${conference.topics.map(topic => `
                                <span style="background: rgba(74, 222, 128, 0.2); padding: 0.5rem 1rem; border-radius: 8px; color: #4ade80;">${topic}</span>
                            `).join('')}
                        </div>
                    </div>
                    
                    ${conference.registrationOpen ? `
                        <button id="register-conference-btn" style="width: 100%; padding: 1rem; background: rgba(74, 222, 128, 0.2); border: 2px solid rgba(74, 222, 128, 0.5); border-radius: 10px; color: #4ade80; cursor: pointer; font-weight: 600; font-size: 1.1rem;">
                            📝 Register for Conference
                        </button>
                    ` : `
                        <div style="padding: 1rem; background: rgba(107, 114, 128, 0.2); border: 2px solid rgba(107, 114, 128, 0.5); border-radius: 10px; text-align: center; color: rgba(255, 255, 255, 0.5);">
                            Registration is currently closed
                        </div>
                    `}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('close-conference-modal').addEventListener('click', () => {
            modal.remove();
        });

        if (conference.registrationOpen) {
            document.getElementById('register-conference-btn')?.addEventListener('click', () => {
                this.showRegistrationForm(conference.id);
            });
        }
    }

    showRegistrationForm(conferenceId) {
        const conference = this.conferences.find(c => c.id === conferenceId);
        if (!conference) return;

        alert(`Registration form for ${conference.title} coming soon!`);
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscoveryConferences = new PlanetDiscoveryConferences();
}

