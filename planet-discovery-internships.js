/**
 * Planet Discovery Internship Opportunities
 * System for posting and applying to internships
 */

class PlanetDiscoveryInternships {
    constructor() {
        this.internships = [];
        this.applications = [];
        this.init();
    }

    init() {
        this.loadInternships();
        console.log('🎓 Internship opportunities initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_in_te_rn_sh_ip_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    loadInternships() {
        this.internships = [
            {
                id: 'intern-1',
                title: 'Exoplanet Data Analysis Intern',
                organization: 'NASA Exoplanet Archive',
                location: 'Remote / Pasadena, CA',
                duration: '3 months',
                type: 'Full-time',
                stipend: '$3,000/month',
                description: 'Analyze exoplanet data from Kepler and TESS missions',
                requirements: ['Python programming', 'Data analysis experience', 'Astronomy background'],
                deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'intern-2',
                title: 'Planet Discovery Research Intern',
                organization: 'Space Research Institute',
                location: 'Remote',
                duration: '6 months',
                type: 'Part-time',
                stipend: '$1,500/month',
                description: 'Assist with research on new planet discovery methods',
                requirements: ['Masters in Astrophysics', 'Research experience'],
                deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];
    }

    renderInternships(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        let html = `
            <div class="internships-container" style="margin-top: 2rem;">
                <h3 style="color: #ba944f; margin-bottom: 1.5rem; text-align: center;">🎓 Internship Opportunities</h3>
                
                <div class="internships-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 2rem;">
        `;

        this.internships.forEach(internship => {
            html += this.createInternshipCard(internship);
        });

        html += `
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Event listeners
        this.internships.forEach(internship => {
            const card = document.querySelector(`[data-internship-id="${internship.id}"]`);
            if (card) {
                card.addEventListener('click', () => {
                    this.showInternshipDetails(internship.id);
                });
            }
        });
    }

    createInternshipCard(internship) {
        const daysLeft = Math.ceil((new Date(internship.deadline) - Date.now()) / (1000 * 60 * 60 * 24));

        return `
            <div class="internship-card" data-internship-id="${internship.id}" style="background: linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(20, 20, 30, 0.9)); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; cursor: pointer; transition: all 0.3s ease;">
                <div>
                    <h4 style="color: #ba944f; margin-bottom: 0.5rem;">${internship.title}</h4>
                    <p style="opacity: 0.8; font-size: 0.9rem; margin-bottom: 1rem; color: #4ade80;">${internship.organization}</p>
                    <p style="opacity: 0.7; font-size: 0.85rem; margin-bottom: 1rem;">${internship.description}</p>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; font-size: 0.85rem; opacity: 0.7;">
                        <span>📍 ${internship.location}</span>
                        <span>⏱️ ${internship.duration}</span>
                        <span>💼 ${internship.type}</span>
                    </div>
                    <div style="font-size: 1.1rem; color: #4ade80; font-weight: bold; margin-bottom: 1rem;">
                        ${internship.stipend}
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; font-size: 0.85rem; opacity: 0.7;">
                        <span>📅 ${daysLeft} days left</span>
                    </div>
                    <button style="width: 100%; padding: 0.75rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: #ba944f; cursor: pointer; font-weight: 600;">
                        Apply Now
                    </button>
                </div>
            </div>
        `;
    }

    showInternshipDetails(internshipId) {
        const internship = this.internships.find(i => i.id === internshipId);
        if (!internship) return;

        const modal = document.createElement('div');
        modal.id = 'internship-details-modal';
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
                    <div>
                        <h2 style="color: #ba944f; margin-bottom: 0.5rem;">${internship.title}</h2>
                        <p style="opacity: 0.8; color: #4ade80; font-size: 1.1rem;">${internship.organization}</p>
                    </div>
                    <button id="close-internship-modal" style="background: transparent; border: 2px solid #ba944f; color: #ba944f; padding: 0.75rem 1.5rem; border-radius: 10px; cursor: pointer; font-weight: 600;">
                        ✕ Close
                    </button>
                </div>
                
                <div style="background: rgba(0, 0, 0, 0.8); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 15px; padding: 2rem;">
                    <div style="margin-bottom: 2rem;">
                        <h4 style="color: #ba944f; margin-bottom: 1rem;">Description</h4>
                        <p style="opacity: 0.9; line-height: 1.8;">${internship.description}</p>
                    </div>
                    
                    <div style="margin-bottom: 2rem;">
                        <h4 style="color: #ba944f; margin-bottom: 1rem;">Details</h4>
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                            <div>
                                <span style="opacity: 0.7;">Location:</span>
                                <div style="color: #ba944f; font-weight: 600;">${internship.location}</div>
                            </div>
                            <div>
                                <span style="opacity: 0.7;">Duration:</span>
                                <div style="color: #ba944f; font-weight: 600;">${internship.duration}</div>
                            </div>
                            <div>
                                <span style="opacity: 0.7;">Type:</span>
                                <div style="color: #ba944f; font-weight: 600;">${internship.type}</div>
                            </div>
                            <div>
                                <span style="opacity: 0.7;">Stipend:</span>
                                <div style="color: #4ade80; font-weight: 600;">${internship.stipend}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 2rem;">
                        <h4 style="color: #ba944f; margin-bottom: 1rem;">Requirements</h4>
                        <ul style="list-style: none; padding: 0;">
                            ${internship.requirements.map(req => `
                                <li style="padding: 0.75rem; background: rgba(186, 148, 79, 0.1); border-left: 3px solid #ba944f; margin-bottom: 0.5rem; border-radius: 5px;">
                                    ✓ ${req}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    
                    <div style="margin-bottom: 2rem;">
                        <h4 style="color: #ba944f; margin-bottom: 1rem;">Application Deadline</h4>
                        <p style="opacity: 0.8;">${new Date(internship.deadline).toLocaleDateString()}</p>
                    </div>
                    
                    <button id="apply-internship-btn" style="width: 100%; padding: 1rem; background: rgba(74, 222, 128, 0.2); border: 2px solid rgba(74, 222, 128, 0.5); border-radius: 10px; color: #4ade80; cursor: pointer; font-weight: 600; font-size: 1.1rem;">
                        📝 Apply for Internship
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('close-internship-modal').addEventListener('click', () => {
            modal.remove();
        });

        document.getElementById('apply-internship-btn').addEventListener('click', () => {
            this.showApplicationForm(internship.id);
        });
    }

    showApplicationForm(internshipId) {
        const internship = this.internships.find(i => i.id === internshipId);
        if (!internship) return;

        const formModal = document.createElement('div');
        formModal.id = 'internship-application-modal';
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
                <h3 style="color: #ba944f; margin-bottom: 2rem;">Apply for ${internship.title}</h3>
                
                <form id="internship-application-form" style="background: rgba(0, 0, 0, 0.8); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 15px; padding: 2rem;">
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; color: rgba(255, 255, 255, 0.9); margin-bottom: 0.5rem; font-weight: 600;">Full Name</label>
                        <input type="text" id="intern-name" required style="width: 100%; padding: 0.75rem; background: rgba(0, 0, 0, 0.5); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 8px; color: white;">
                    </div>
                    
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; color: rgba(255, 255, 255, 0.9); margin-bottom: 0.5rem; font-weight: 600;">Email</label>
                        <input type="email" id="intern-email" required style="width: 100%; padding: 0.75rem; background: rgba(0, 0, 0, 0.5); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 8px; color: white;">
                    </div>
                    
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; color: rgba(255, 255, 255, 0.9); margin-bottom: 0.5rem; font-weight: 600;">Cover Letter</label>
                        <textarea id="intern-cover-letter" required rows="8" style="width: 100%; padding: 0.75rem; background: rgba(0, 0, 0, 0.5); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 8px; color: white; resize: vertical;"></textarea>
                    </div>
                    
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; color: rgba(255, 255, 255, 0.9); margin-bottom: 0.5rem; font-weight: 600;">Resume/CV (URL or paste text)</label>
                        <textarea id="intern-resume" required rows="5" style="width: 100%; padding: 0.75rem; background: rgba(0, 0, 0, 0.5); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 8px; color: white; resize: vertical;"></textarea>
                    </div>
                    
                    <div style="display: flex; gap: 1rem;">
                        <button type="submit" style="flex: 1; padding: 0.75rem; background: rgba(74, 222, 128, 0.2); border: 2px solid rgba(74, 222, 128, 0.5); border-radius: 10px; color: #4ade80; cursor: pointer; font-weight: 600;">
                            Submit Application
                        </button>
                        <button type="button" id="cancel-internship-application-btn" style="flex: 1; padding: 0.75rem; background: rgba(107, 114, 128, 0.2); border: 2px solid rgba(107, 114, 128, 0.5); border-radius: 10px; color: rgba(255, 255, 255, 0.7); cursor: pointer; font-weight: 600;">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(formModal);

        document.getElementById('internship-application-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.submitApplication(internshipId);
            formModal.remove();
        });

        document.getElementById('cancel-internship-application-btn').addEventListener('click', () => {
            formModal.remove();
        });
    }

    async submitApplication(internshipId) {
        const name = document.getElementById('intern-name').value;
        const email = document.getElementById('intern-email').value;
        const coverLetter = document.getElementById('intern-cover-letter').value;
        const resume = document.getElementById('intern-resume').value;

        if (typeof supabase === 'undefined' || !supabase) {
            alert('Application submitted! (Mock)');
            return;
        }

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id || null;

            const { error } = await supabase
                .from('internship_applications')
                .insert({
                    internship_id: internshipId,
                    user_id: userId,
                    applicant_name: name,
                    applicant_email: email,
                    cover_letter: coverLetter,
                    resume: resume,
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
    window.planetDiscoveryInternships = new PlanetDiscoveryInternships();
}

