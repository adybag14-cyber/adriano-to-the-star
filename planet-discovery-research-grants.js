/**
 * Planet Discovery Research Grants
 * System for applying and managing research grants
 */

class PlanetDiscoveryResearchGrants {
    constructor() {
        this.grants = [];
        this.applications = [];
        this.init();
    }

    init() {
        this.loadGrants();
        console.log('💰 Research grants initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_re_se_ar_ch_gr_an_ts_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    loadGrants() {
        this.grants = [
            {
                id: 'grant-1',
                title: 'Exoplanet Discovery Research Grant',
                description: 'Funding for research on new exoplanet discovery methods',
                amount: '$50,000',
                deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                requirements: ['PhD in Astronomy', 'Research proposal', 'Letter of recommendation'],
                status: 'open'
            },
            {
                id: 'grant-2',
                title: 'Habitable Zone Study Grant',
                description: 'Research funding for habitable zone analysis',
                amount: '$30,000',
                deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
                requirements: ['Masters in Astrophysics', 'Research proposal'],
                status: 'open'
            }
        ];
    }

    renderGrants(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        let html = `
            <div class="grants-container" style="margin-top: 2rem;">
                <h3 style="color: #ba944f; margin-bottom: 1.5rem; text-align: center;">💰 Research Grants</h3>
                
                <div class="grants-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 2rem;">
        `;

        this.grants.forEach(grant => {
            html += this.createGrantCard(grant);
        });

        html += `
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Event listeners
        this.grants.forEach(grant => {
            const card = document.querySelector(`[data-grant-id="${grant.id}"]`);
            if (card) {
                card.addEventListener('click', () => {
                    this.showGrantDetails(grant.id);
                });
            }
        });
    }

    createGrantCard(grant) {
        const daysLeft = Math.ceil((new Date(grant.deadline) - Date.now()) / (1000 * 60 * 60 * 24));

        return `
            <div class="grant-card" data-grant-id="${grant.id}" style="background: linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(20, 20, 30, 0.9)); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; cursor: pointer; transition: all 0.3s ease;">
                <div style="text-align: center;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">💰</div>
                    <h4 style="color: #ba944f; margin-bottom: 0.5rem;">${grant.title}</h4>
                    <p style="opacity: 0.8; font-size: 0.9rem; margin-bottom: 1rem;">${grant.description}</p>
                    <div style="font-size: 1.5rem; color: #4ade80; font-weight: bold; margin-bottom: 1rem;">
                        ${grant.amount}
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; opacity: 0.7; margin-bottom: 1rem;">
                        <span>📅 ${daysLeft} days left</span>
                        <span style="background: rgba(74, 222, 128, 0.2); padding: 0.25rem 0.75rem; border-radius: 20px; color: #4ade80; font-weight: 600;">
                            ${grant.status.toUpperCase()}
                        </span>
                    </div>
                    <button style="width: 100%; padding: 0.75rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: #ba944f; cursor: pointer; font-weight: 600;">
                        Apply Now
                    </button>
                </div>
            </div>
        `;
    }

    showGrantDetails(grantId) {
        const grant = this.grants.find(g => g.id === grantId);
        if (!grant) return;

        const modal = document.createElement('div');
        modal.id = 'grant-details-modal';
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
                    <h2 style="color: #ba944f;">${grant.title}</h2>
                    <button id="close-grant-modal" style="background: transparent; border: 2px solid #ba944f; color: #ba944f; padding: 0.75rem 1.5rem; border-radius: 10px; cursor: pointer; font-weight: 600;">
                        ✕ Close
                    </button>
                </div>
                
                <div style="background: rgba(0, 0, 0, 0.8); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 15px; padding: 2rem;">
                    <div style="text-align: center; margin-bottom: 2rem;">
                        <div style="font-size: 4rem; margin-bottom: 1rem;">💰</div>
                        <div style="font-size: 2rem; color: #4ade80; font-weight: bold; margin-bottom: 0.5rem;">
                            ${grant.amount}
                        </div>
                        <p style="opacity: 0.8;">${grant.description}</p>
                    </div>
                    
                    <div style="margin-bottom: 2rem;">
                        <h4 style="color: #ba944f; margin-bottom: 1rem;">Requirements</h4>
                        <ul style="list-style: none; padding: 0;">
                            ${grant.requirements.map(req => `
                                <li style="padding: 0.75rem; background: rgba(186, 148, 79, 0.1); border-left: 3px solid #ba944f; margin-bottom: 0.5rem; border-radius: 5px;">
                                    ✓ ${req}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    
                    <div style="margin-bottom: 2rem;">
                        <h4 style="color: #ba944f; margin-bottom: 1rem;">Deadline</h4>
                        <p style="opacity: 0.8;">${new Date(grant.deadline).toLocaleDateString()}</p>
                    </div>
                    
                    <button id="apply-grant-btn" style="width: 100%; padding: 1rem; background: rgba(74, 222, 128, 0.2); border: 2px solid rgba(74, 222, 128, 0.5); border-radius: 10px; color: #4ade80; cursor: pointer; font-weight: 600; font-size: 1.1rem;">
                        📝 Apply for Grant
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('close-grant-modal').addEventListener('click', () => {
            modal.remove();
        });

        document.getElementById('apply-grant-btn').addEventListener('click', () => {
            this.showApplicationForm(grant.id);
        });
    }

    showApplicationForm(grantId) {
        const grant = this.grants.find(g => g.id === grantId);
        if (!grant) return;

        const formModal = document.createElement('div');
        formModal.id = 'grant-application-modal';
        formModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 10001;
            overflow-y: auto;
            padding: 2rem;
        `;

        formModal.innerHTML = `
            <div style="max-width: 800px; margin: 0 auto;">
                <h3 style="color: #ba944f; margin-bottom: 2rem;">Apply for ${grant.title}</h3>
                
                <form id="grant-application-form" style="background: rgba(0, 0, 0, 0.8); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 15px; padding: 2rem;">
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; color: rgba(255, 255, 255, 0.9); margin-bottom: 0.5rem; font-weight: 600;">Full Name</label>
                        <input type="text" id="applicant-name" required style="width: 100%; padding: 0.75rem; background: rgba(0, 0, 0, 0.5); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 8px; color: white;">
                    </div>
                    
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; color: rgba(255, 255, 255, 0.9); margin-bottom: 0.5rem; font-weight: 600;">Email</label>
                        <input type="email" id="applicant-email" required style="width: 100%; padding: 0.75rem; background: rgba(0, 0, 0, 0.5); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 8px; color: white;">
                    </div>
                    
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; color: rgba(255, 255, 255, 0.9); margin-bottom: 0.5rem; font-weight: 600;">Research Proposal</label>
                        <textarea id="research-proposal" required rows="10" style="width: 100%; padding: 0.75rem; background: rgba(0, 0, 0, 0.5); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 8px; color: white; resize: vertical;"></textarea>
                    </div>
                    
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; color: rgba(255, 255, 255, 0.9); margin-bottom: 0.5rem; font-weight: 600;">Qualifications</label>
                        <textarea id="qualifications" required rows="5" style="width: 100%; padding: 0.75rem; background: rgba(0, 0, 0, 0.5); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 8px; color: white; resize: vertical;"></textarea>
                    </div>
                    
                    <div style="display: flex; gap: 1rem;">
                        <button type="submit" style="flex: 1; padding: 0.75rem; background: rgba(74, 222, 128, 0.2); border: 2px solid rgba(74, 222, 128, 0.5); border-radius: 10px; color: #4ade80; cursor: pointer; font-weight: 600;">
                            Submit Application
                        </button>
                        <button type="button" id="cancel-application-btn" style="flex: 1; padding: 0.75rem; background: rgba(107, 114, 128, 0.2); border: 2px solid rgba(107, 114, 128, 0.5); border-radius: 10px; color: rgba(255, 255, 255, 0.7); cursor: pointer; font-weight: 600;">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(formModal);

        document.getElementById('grant-application-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.submitApplication(grantId);
            formModal.remove();
        });

        document.getElementById('cancel-application-btn').addEventListener('click', () => {
            formModal.remove();
        });
    }

    async submitApplication(grantId) {
        const name = document.getElementById('applicant-name').value;
        const email = document.getElementById('applicant-email').value;
        const proposal = document.getElementById('research-proposal').value;
        const qualifications = document.getElementById('qualifications').value;

        if (typeof supabase === 'undefined' || !supabase) {
            alert('Application submitted! (Mock)');
            return;
        }

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id || null;

            const { error } = await supabase
                .from('grant_applications')
                .insert({
                    grant_id: grantId,
                    user_id: userId,
                    applicant_name: name,
                    applicant_email: email,
                    research_proposal: proposal,
                    qualifications: qualifications,
                    status: 'pending',
                    created_at: new Date().toISOString()
                });

            if (error) {
                console.error('Error submitting application:', error);
                alert('Error submitting application. Please try again.');
                return;
            }

            alert('Application submitted successfully!');
        } catch (error) {
            console.error('Error submitting application:', error);
            alert('Error submitting application. Please try again.');
        }
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscoveryResearchGrants = new PlanetDiscoveryResearchGrants();
}

