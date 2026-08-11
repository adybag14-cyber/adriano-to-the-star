/**
 * Planet Discovery Job Board
 * Job listings for space and exoplanet research positions
 */

class PlanetDiscoveryJobBoard {
    constructor() {
        this.jobs = [];
        this.applications = [];
        this.init();
    }

    init() {
        this.loadJobs();
        console.log('💼 Job board initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_jo_bb_oa_rd_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    loadJobs() {
        this.jobs = [
            {
                id: 'job-1',
                title: 'Exoplanet Research Scientist',
                company: 'NASA Jet Propulsion Laboratory',
                location: 'Pasadena, CA',
                type: 'Full-time',
                salary: '$90,000 - $120,000',
                description: 'Lead research on exoplanet discovery and characterization',
                requirements: ['PhD in Astronomy', '5+ years research experience', 'Published papers'],
                posted: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'job-2',
                title: 'Data Scientist - Exoplanet Archive',
                company: 'Space Telescope Science Institute',
                location: 'Baltimore, MD / Remote',
                type: 'Full-time',
                salary: '$80,000 - $100,000',
                description: 'Analyze and process exoplanet data from space missions',
                requirements: ['Masters in Data Science', 'Python/R programming', 'Machine learning'],
                posted: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'job-3',
                title: 'Planet Discovery Software Engineer',
                company: 'Kepler Mission Team',
                location: 'Remote',
                type: 'Contract',
                salary: '$70/hour',
                description: 'Develop software for planet detection algorithms',
                requirements: ['Bachelors in CS', 'Python/JavaScript', 'Astronomy interest'],
                posted: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];
    }

    renderJobBoard(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        let html = `
            <div class="job-board-container" style="margin-top: 2rem;">
                <h3 style="color: #ba944f; margin-bottom: 1.5rem; text-align: center;">💼 Job Board</h3>
                
                <div style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin-bottom: 2rem;">
                    <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                        <input type="text" id="job-search" placeholder="Search jobs..." style="flex: 1; min-width: 200px; padding: 0.75rem; background: rgba(0, 0, 0, 0.5); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 8px; color: white;">
                        <select id="job-type-filter" style="padding: 0.75rem; background: rgba(0, 0, 0, 0.5); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 8px; color: white;">
                            <option value="all">All Types</option>
                            <option value="Full-time">Full-time</option>
                            <option value="Part-time">Part-time</option>
                            <option value="Contract">Contract</option>
                        </select>
                        <button id="post-job-btn" style="padding: 0.75rem 1.5rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: #ba944f; cursor: pointer; font-weight: 600;">
                            📝 Post Job
                        </button>
                    </div>
                </div>
                
                <div class="jobs-list" style="display: flex; flex-direction: column; gap: 1.5rem;">
        `;

        this.jobs.forEach(job => {
            html += this.createJobCard(job);
        });

        html += `
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Event listeners
        this.jobs.forEach(job => {
            const card = document.querySelector(`[data-job-id="${job.id}"]`);
            if (card) {
                card.addEventListener('click', () => {
                    this.showJobDetails(job.id);
                });
            }
        });

        document.getElementById('job-search')?.addEventListener('input', (e) => {
            this.filterJobs(e.target.value);
        });

        document.getElementById('job-type-filter')?.addEventListener('change', (e) => {
            this.filterJobsByType(e.target.value);
        });

        document.getElementById('post-job-btn')?.addEventListener('click', () => {
            this.showPostJobForm();
        });
    }

    createJobCard(job) {
        const daysAgo = Math.floor((Date.now() - new Date(job.posted)) / (1000 * 60 * 60 * 24));

        return `
            <div class="job-card" data-job-id="${job.id}" style="background: linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(20, 20, 30, 0.9)); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; cursor: pointer; transition: all 0.3s ease;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <div style="flex: 1;">
                        <h4 style="color: #ba944f; margin-bottom: 0.5rem;">${job.title}</h4>
                        <p style="opacity: 0.8; color: #4ade80; font-size: 1rem; margin-bottom: 0.5rem;">${job.company}</p>
                        <p style="opacity: 0.7; font-size: 0.9rem; margin-bottom: 1rem;">${job.description}</p>
                    </div>
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem; font-size: 0.85rem; opacity: 0.7;">
                    <span>📍 ${job.location}</span>
                    <span>💼 ${job.type}</span>
                    <span>💰 ${job.salary}</span>
                    <span>📅 ${daysAgo} days ago</span>
                </div>
                <button style="width: 100%; padding: 0.75rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: #ba944f; cursor: pointer; font-weight: 600;">
                    View Details
                </button>
            </div>
        `;
    }

    showJobDetails(jobId) {
        const job = this.jobs.find(j => j.id === jobId);
        if (!job) return;

        const modal = document.createElement('div');
        modal.id = 'job-details-modal';
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
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 2rem;">
                    <div>
                        <h2 style="color: #ba944f; margin-bottom: 0.5rem;">${job.title}</h2>
                        <p style="opacity: 0.8; color: #4ade80; font-size: 1.2rem; margin-bottom: 0.5rem;">${job.company}</p>
                        <div style="display: flex; gap: 1rem; font-size: 0.9rem; opacity: 0.7;">
                            <span>📍 ${job.location}</span>
                            <span>💼 ${job.type}</span>
                            <span>💰 ${job.salary}</span>
                        </div>
                    </div>
                    <button id="close-job-modal" style="background: transparent; border: 2px solid #ba944f; color: #ba944f; padding: 0.75rem 1.5rem; border-radius: 10px; cursor: pointer; font-weight: 600;">
                        ✕ Close
                    </button>
                </div>
                
                <div style="background: rgba(0, 0, 0, 0.8); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 15px; padding: 2rem;">
                    <div style="margin-bottom: 2rem;">
                        <h4 style="color: #ba944f; margin-bottom: 1rem;">Job Description</h4>
                        <p style="opacity: 0.9; line-height: 1.8;">${job.description}</p>
                    </div>
                    
                    <div style="margin-bottom: 2rem;">
                        <h4 style="color: #ba944f; margin-bottom: 1rem;">Requirements</h4>
                        <ul style="list-style: none; padding: 0;">
                            ${job.requirements.map(req => `
                                <li style="padding: 0.75rem; background: rgba(186, 148, 79, 0.1); border-left: 3px solid #ba944f; margin-bottom: 0.5rem; border-radius: 5px;">
                                    ✓ ${req}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    
                    <button id="apply-job-btn" style="width: 100%; padding: 1rem; background: rgba(74, 222, 128, 0.2); border: 2px solid rgba(74, 222, 128, 0.5); border-radius: 10px; color: #4ade80; cursor: pointer; font-weight: 600; font-size: 1.1rem;">
                        📝 Apply for Position
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('close-job-modal').addEventListener('click', () => {
            modal.remove();
        });

        document.getElementById('apply-job-btn').addEventListener('click', () => {
            this.showJobApplicationForm(job.id);
        });
    }

    filterJobs(query) {
        const filtered = this.jobs.filter(job => 
            job.title.toLowerCase().includes(query.toLowerCase()) ||
            job.company.toLowerCase().includes(query.toLowerCase()) ||
            job.description.toLowerCase().includes(query.toLowerCase())
        );
        this.renderFilteredJobs(filtered);
    }

    filterJobsByType(type) {
        if (type === 'all') {
            this.renderFilteredJobs(this.jobs);
        } else {
            const filtered = this.jobs.filter(job => job.type === type);
            this.renderFilteredJobs(filtered);
        }
    }

    renderFilteredJobs(jobs) {
        const container = document.querySelector('.jobs-list');
        if (!container) return;

        container.innerHTML = jobs.map(job => this.createJobCard(job)).join('');

        jobs.forEach(job => {
            const card = document.querySelector(`[data-job-id="${job.id}"]`);
            if (card) {
                card.addEventListener('click', () => {
                    this.showJobDetails(job.id);
                });
            }
        });
    }

    showPostJobForm() {
        alert('Job posting feature coming soon!');
    }

    showJobApplicationForm(jobId) {
        const job = this.jobs.find(j => j.id === jobId);
        if (!job) return;

        alert(`Application form for ${job.title} at ${job.company} coming soon!`);
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscoveryJobBoard = new PlanetDiscoveryJobBoard();
}

