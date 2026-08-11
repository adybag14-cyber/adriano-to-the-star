/**
 * Planet Discovery Certification Program
 * Issue certificates for completed courses and achievements
 */

class PlanetDiscoveryCertification {
    constructor() {
        this.certificates = [];
        this.requirements = [];
        this.init();
    }

    init() {
        this.loadCertificates();
        this.loadRequirements();
        console.log('🏅 Certification program initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_ce_rt_if_ic_at_io_n_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    loadCertificates() {
        this.certificates = [
            {
                id: 'exoplanet-expert',
                title: 'Exoplanet Discovery Expert',
                description: 'Certified expert in exoplanet discovery methods',
                requirements: ['Complete Exoplanets 101', 'Complete Advanced Discovery Techniques', 'Pass final exam'],
                icon: '🪐'
            },
            {
                id: 'habitable-zone-specialist',
                title: 'Habitable Zone Specialist',
                description: 'Specialist in identifying and analyzing habitable zones',
                requirements: ['Complete Habitable Worlds course', 'Complete 5 case studies'],
                icon: '🌍'
            }
        ];
    }

    loadRequirements() {
        this.requirements = {
            'exoplanet-expert': {
                courses: ['exoplanets-101', 'advanced-discovery'],
                exam: true,
                caseStudies: 0
            },
            'habitable-zone-specialist': {
                courses: ['habitable-worlds'],
                exam: false,
                caseStudies: 5
            }
        };
    }

    renderCertifications(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        let html = `
            <div class="certifications-container" style="margin-top: 2rem;">
                <h3 style="color: #ba944f; margin-bottom: 1.5rem; text-align: center;">🏅 Certification Program</h3>
                
                <div style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin-bottom: 2rem;">
                    <p style="opacity: 0.9; line-height: 1.8;">
                        Earn professional certifications by completing courses and demonstrating your expertise. 
                        Certificates are issued as verifiable digital credentials.
                    </p>
                </div>
                
                <div class="certificates-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 2rem;">
        `;

        this.certificates.forEach(cert => {
            html += this.createCertificateCard(cert);
        });

        html += `
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Event listeners
        this.certificates.forEach(cert => {
            const card = document.querySelector(`[data-cert-id="${cert.id}"]`);
            if (card) {
                card.addEventListener('click', () => {
                    this.showCertificateDetails(cert.id);
                });
            }
        });
    }

    createCertificateCard(cert) {
        return `
            <div class="certificate-card" data-cert-id="${cert.id}" style="background: linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(20, 20, 30, 0.9)); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; cursor: pointer; transition: all 0.3s ease;">
                <div style="text-align: center;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">${cert.icon}</div>
                    <h4 style="color: #ba944f; margin-bottom: 0.5rem;">${cert.title}</h4>
                    <p style="opacity: 0.8; font-size: 0.9rem; margin-bottom: 1.5rem;">${cert.description}</p>
                    <div style="margin-bottom: 1rem;">
                        <p style="font-size: 0.85rem; opacity: 0.7; margin-bottom: 0.5rem;">Requirements:</p>
                        <ul style="list-style: none; padding: 0; text-align: left;">
                            ${cert.requirements.map(req => `
                                <li style="padding: 0.5rem; background: rgba(186, 148, 79, 0.1); margin-bottom: 0.25rem; border-radius: 5px; font-size: 0.85rem;">
                                    ✓ ${req}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    <button style="width: 100%; padding: 0.75rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: #ba944f; cursor: pointer; font-weight: 600;">
                        View Details
                    </button>
                </div>
            </div>
        `;
    }

    showCertificateDetails(certId) {
        const cert = this.certificates.find(c => c.id === certId);
        if (!cert) return;

        const modal = document.createElement('div');
        modal.id = 'certificate-details-modal';
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
            <div style="max-width: 700px; width: 100%; background: rgba(0, 0, 0, 0.8); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 15px; padding: 2rem;">
                <div style="text-align: center; margin-bottom: 2rem;">
                    <div style="font-size: 5rem; margin-bottom: 1rem;">${cert.icon}</div>
                    <h2 style="color: #ba944f; margin-bottom: 0.5rem;">${cert.title}</h2>
                    <p style="opacity: 0.8;">${cert.description}</p>
                </div>
                
                <div style="margin-bottom: 2rem;">
                    <h4 style="color: #ba944f; margin-bottom: 1rem;">Requirements to Earn Certificate</h4>
                    <ul style="list-style: none; padding: 0;">
                        ${cert.requirements.map(req => `
                            <li style="padding: 1rem; background: rgba(186, 148, 79, 0.1); border-left: 3px solid #ba944f; margin-bottom: 0.5rem; border-radius: 5px;">
                                ✓ ${req}
                            </li>
                        `).join('')}
                    </ul>
                </div>
                
                <div style="display: flex; gap: 1rem;">
                    <button id="check-progress-btn" style="flex: 1; padding: 0.75rem; background: rgba(74, 222, 128, 0.2); border: 2px solid rgba(74, 222, 128, 0.5); border-radius: 10px; color: #4ade80; cursor: pointer; font-weight: 600;">
                        Check Progress
                    </button>
                    <button id="close-cert-modal" style="flex: 1; padding: 0.75rem; background: rgba(107, 114, 128, 0.2); border: 2px solid rgba(107, 114, 128, 0.5); border-radius: 10px; color: rgba(255, 255, 255, 0.7); cursor: pointer; font-weight: 600;">
                        Close
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('close-cert-modal').addEventListener('click', () => {
            modal.remove();
        });

        document.getElementById('check-progress-btn').addEventListener('click', () => {
            this.checkProgress(certId);
        });
    }

    async checkProgress(certId) {
        const cert = this.certificates.find(c => c.id === certId);
        if (!cert) return;

        // Check user progress
        const progress = await this.getUserProgress(certId);
        
        const progressModal = document.createElement('div');
        progressModal.id = 'progress-modal';
        progressModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 10001;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        `;

        const progressPercent = (progress.completed / cert.requirements.length * 100).toFixed(0);

        progressModal.innerHTML = `
            <div style="max-width: 600px; width: 100%; background: rgba(0, 0, 0, 0.8); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 15px; padding: 2rem;">
                <h3 style="color: #ba944f; margin-bottom: 1.5rem; text-align: center;">Your Progress</h3>
                
                <div style="text-align: center; margin-bottom: 2rem;">
                    <div style="font-size: 3rem; color: #4ade80; font-weight: bold; margin-bottom: 0.5rem;">
                        ${progressPercent}%
                    </div>
                    <div style="width: 100%; height: 20px; background: rgba(186, 148, 79, 0.2); border-radius: 10px; overflow: hidden;">
                        <div style="width: ${progressPercent}%; height: 100%; background: #ba944f; transition: width 0.3s;"></div>
                    </div>
                </div>
                
                <div style="margin-bottom: 2rem;">
                    <p style="opacity: 0.8; margin-bottom: 1rem;">Completed: ${progress.completed} / ${cert.requirements.length}</p>
                    <ul style="list-style: none; padding: 0;">
                        ${cert.requirements.map((req, index) => `
                            <li style="padding: 0.75rem; background: ${progress.completedItems.includes(index) ? 'rgba(74, 222, 128, 0.2)' : 'rgba(107, 114, 128, 0.2)'}; border-left: 3px solid ${progress.completedItems.includes(index) ? '#4ade80' : '#6b7280'}; margin-bottom: 0.5rem; border-radius: 5px;">
                                ${progress.completedItems.includes(index) ? '✅' : '⏳'} ${req}
                            </li>
                        `).join('')}
                    </ul>
                </div>
                
                <button id="close-progress-modal" style="width: 100%; padding: 0.75rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: #ba944f; cursor: pointer; font-weight: 600;">
                    Close
                </button>
            </div>
        `;

        document.body.appendChild(progressModal);

        document.getElementById('close-progress-modal').addEventListener('click', () => {
            progressModal.remove();
        });
    }

    async getUserProgress(certId) {
        // Mock progress - would check actual user data
        return {
            completed: 1,
            completedItems: [0],
            total: this.certificates.find(c => c.id === certId)?.requirements.length || 0
        };
    }

    async generateCertificate(certId, userId) {
        // Generate digital certificate
        console.log(`Generating certificate ${certId} for user ${userId}`);
        // Would create a verifiable digital certificate
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscoveryCertification = new PlanetDiscoveryCertification();
}

