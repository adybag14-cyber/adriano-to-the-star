/**
 * Planet Discovery Scholarship Program
 * Scholarships for students studying exoplanet science
 */

class PlanetDiscoveryScholarships {
    constructor() {
        this.scholarships = [];
        this.applications = [];
        this.init();
    }

    init() {
        this.loadScholarships();
        console.log('🎓 Scholarship program initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_sc_ho_la_rs_hi_ps_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    loadScholarships() {
        this.scholarships = [
            {
                id: 'scholar-1',
                title: 'Exoplanet Research Scholarship',
                amount: '$10,000',
                description: 'Scholarship for undergraduate students pursuing exoplanet research',
                eligibility: ['Undergraduate student', 'GPA 3.5+', 'Astronomy major'],
                deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
                type: 'Undergraduate'
            },
            {
                id: 'scholar-2',
                title: 'Kepler Mission Memorial Scholarship',
                amount: '$15,000',
                description: 'Graduate scholarship honoring the Kepler mission',
                eligibility: ['Graduate student', 'Research in exoplanets', 'Letter of recommendation'],
                deadline: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
                type: 'Graduate'
            },
            {
                id: 'scholar-3',
                title: 'Women in Astronomy Scholarship',
                amount: '$8,000',
                description: 'Supporting women pursuing careers in exoplanet science',
                eligibility: ['Female student', 'Astronomy/Physics major', 'GPA 3.0+'],
                deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
                type: 'All Levels'
            }
        ];
    }

    renderScholarships(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        let html = `
            <div class="scholarships-container" style="margin-top: 2rem;">
                <h3 style="color: #ba944f; margin-bottom: 1.5rem; text-align: center;">🎓 Scholarship Program</h3>
                
                <div class="scholarships-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 2rem;">
        `;

        this.scholarships.forEach(scholarship => {
            html += this.createScholarshipCard(scholarship);
        });

        html += `
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Event listeners
        this.scholarships.forEach(scholarship => {
            const card = document.querySelector(`[data-scholarship-id="${scholarship.id}"]`);
            if (card) {
                card.addEventListener('click', () => {
                    this.showScholarshipDetails(scholarship.id);
                });
            }
        });
    }

    createScholarshipCard(scholarship) {
        const daysLeft = Math.ceil((new Date(scholarship.deadline) - Date.now()) / (1000 * 60 * 60 * 24));

        return `
            <div class="scholarship-card" data-scholarship-id="${scholarship.id}" style="background: linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(20, 20, 30, 0.9)); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; cursor: pointer; transition: all 0.3s ease;">
                <div style="text-align: center;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">🎓</div>
                    <h4 style="color: #ba944f; margin-bottom: 0.5rem;">${scholarship.title}</h4>
                    <p style="opacity: 0.8; font-size: 0.9rem; margin-bottom: 1rem;">${scholarship.description}</p>
                    <div style="font-size: 1.5rem; color: #4ade80; font-weight: bold; margin-bottom: 1rem;">
                        ${scholarship.amount}
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; opacity: 0.7; margin-bottom: 1rem;">
                        <span>📚 ${scholarship.type}</span>
                        <span>📅 ${daysLeft} days left</span>
                    </div>
                    <button style="width: 100%; padding: 0.75rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: #ba944f; cursor: pointer; font-weight: 600;">
                        Apply Now
                    </button>
                </div>
            </div>
        `;
    }

    showScholarshipDetails(scholarshipId) {
        const scholarship = this.scholarships.find(s => s.id === scholarshipId);
        if (!scholarship) return;

        const modal = document.createElement('div');
        modal.id = 'scholarship-details-modal';
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
                    <h2 style="color: #ba944f;">${scholarship.title}</h2>
                    <button id="close-scholarship-modal" style="background: transparent; border: 2px solid #ba944f; color: #ba944f; padding: 0.75rem 1.5rem; border-radius: 10px; cursor: pointer; font-weight: 600;">
                        ✕ Close
                    </button>
                </div>
                
                <div style="background: rgba(0, 0, 0, 0.8); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 15px; padding: 2rem;">
                    <div style="text-align: center; margin-bottom: 2rem;">
                        <div style="font-size: 4rem; margin-bottom: 1rem;">🎓</div>
                        <div style="font-size: 2rem; color: #4ade80; font-weight: bold; margin-bottom: 0.5rem;">
                            ${scholarship.amount}
                        </div>
                        <p style="opacity: 0.8;">${scholarship.description}</p>
                    </div>
                    
                    <div style="margin-bottom: 2rem;">
                        <h4 style="color: #ba944f; margin-bottom: 1rem;">Eligibility Requirements</h4>
                        <ul style="list-style: none; padding: 0;">
                            ${scholarship.eligibility.map(req => `
                                <li style="padding: 0.75rem; background: rgba(186, 148, 79, 0.1); border-left: 3px solid #ba944f; margin-bottom: 0.5rem; border-radius: 5px;">
                                    ✓ ${req}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    
                    <div style="margin-bottom: 2rem;">
                        <h4 style="color: #ba944f; margin-bottom: 1rem;">Application Deadline</h4>
                        <p style="opacity: 0.8;">${new Date(scholarship.deadline).toLocaleDateString()}</p>
                    </div>
                    
                    <button id="apply-scholarship-btn" style="width: 100%; padding: 1rem; background: rgba(74, 222, 128, 0.2); border: 2px solid rgba(74, 222, 128, 0.5); border-radius: 10px; color: #4ade80; cursor: pointer; font-weight: 600; font-size: 1.1rem;">
                        📝 Apply for Scholarship
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('close-scholarship-modal').addEventListener('click', () => {
            modal.remove();
        });

        document.getElementById('apply-scholarship-btn').addEventListener('click', () => {
            this.showApplicationForm(scholarship.id);
        });
    }

    showApplicationForm(scholarshipId) {
        const scholarship = this.scholarships.find(s => s.id === scholarshipId);
        if (!scholarship) return;

        alert(`Scholarship application form for ${scholarship.title} coming soon!`);
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscoveryScholarships = new PlanetDiscoveryScholarships();
}

