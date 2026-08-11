/**
 * Planet Discovery Mentorship Program
 * Connect mentors and mentees for planet discovery education
 */

class PlanetDiscoveryMentorship {
    constructor() {
        this.mentors = [];
        this.mentees = [];
        this.connections = [];
        this.init();
    }

    init() {
        this.loadMentors();
        console.log('👥 Mentorship program initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_me_nt_or_sh_ip_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    loadMentors() {
        this.mentors = [
            {
                id: '1',
                name: 'Dr. Sarah Johnson',
                expertise: ['Exoplanet Discovery', 'Kepler Mission', 'Transit Method'],
                experience: '15 years',
                rating: 4.9,
                students: 42,
                bio: 'Astrophysicist specializing in exoplanet detection methods',
                available: true
            },
            {
                id: '2',
                name: 'Prof. Michael Chen',
                expertise: ['Radial Velocity', 'Spectroscopy', 'Data Analysis'],
                experience: '20 years',
                rating: 4.8,
                students: 38,
                bio: 'Expert in radial velocity techniques and stellar spectroscopy',
                available: true
            }
        ];
    }

    renderMentorship(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        let html = `
            <div class="mentorship-container" style="margin-top: 2rem;">
                <h3 style="color: #ba944f; margin-bottom: 1.5rem; text-align: center;">👥 Mentorship Program</h3>
                
                <div style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin-bottom: 2rem;">
                    <p style="opacity: 0.9; line-height: 1.8; margin-bottom: 1rem;">
                        Connect with experienced astronomers and researchers to learn about exoplanet discovery. 
                        Our mentorship program pairs you with experts who can guide your learning journey.
                    </p>
                    <button id="become-mentor-btn" style="padding: 0.75rem 1.5rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: #ba944f; cursor: pointer; font-weight: 600; margin-right: 1rem;">
                        👨‍🏫 Become a Mentor
                    </button>
                    <button id="find-mentor-btn" style="padding: 0.75rem 1.5rem; background: rgba(74, 222, 128, 0.2); border: 2px solid rgba(74, 222, 128, 0.5); border-radius: 10px; color: #4ade80; cursor: pointer; font-weight: 600;">
                        🔍 Find a Mentor
                    </button>
                </div>
                
                <h4 style="color: #ba944f; margin-bottom: 1rem;">Available Mentors</h4>
                <div class="mentors-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 2rem;">
        `;

        this.mentors.forEach(mentor => {
            html += this.createMentorCard(mentor);
        });

        html += `
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Event listeners
        document.getElementById('become-mentor-btn')?.addEventListener('click', () => {
            this.showMentorApplication();
        });

        document.getElementById('find-mentor-btn')?.addEventListener('click', () => {
            this.showMentorSearch();
        });

        this.mentors.forEach(mentor => {
            const card = document.querySelector(`[data-mentor-id="${mentor.id}"]`);
            if (card) {
                card.addEventListener('click', () => {
                    this.showMentorProfile(mentor.id);
                });
            }
        });
    }

    createMentorCard(mentor) {
        return `
            <div class="mentor-card" data-mentor-id="${mentor.id}" style="background: linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(20, 20, 30, 0.9)); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; cursor: pointer; transition: all 0.3s ease;">
                <div style="text-align: center;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">👨‍🏫</div>
                    <h4 style="color: #ba944f; margin-bottom: 0.5rem;">${mentor.name}</h4>
                    <p style="opacity: 0.8; font-size: 0.9rem; margin-bottom: 1rem;">${mentor.bio}</p>
                    <div style="margin-bottom: 1rem;">
                        <div style="display: flex; justify-content: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                            ${'⭐'.repeat(Math.floor(mentor.rating))}
                        </div>
                        <div style="font-size: 0.85rem; opacity: 0.7;">
                            ${mentor.rating} rating • ${mentor.students} students • ${mentor.experience} experience
                        </div>
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; margin-bottom: 1rem;">
                        ${mentor.expertise.map(exp => `<span style="background: rgba(186, 148, 79, 0.2); padding: 0.25rem 0.5rem; border-radius: 5px; font-size: 0.75rem; color: #ba944f;">${exp}</span>`).join('')}
                    </div>
                    ${mentor.available ? `
                        <button style="width: 100%; padding: 0.75rem; background: rgba(74, 222, 128, 0.2); border: 2px solid rgba(74, 222, 128, 0.5); border-radius: 10px; color: #4ade80; cursor: pointer; font-weight: 600;">
                            Connect
                        </button>
                    ` : `
                        <div style="padding: 0.75rem; background: rgba(107, 114, 128, 0.2); border: 2px solid rgba(107, 114, 128, 0.5); border-radius: 10px; color: rgba(255, 255, 255, 0.5); text-align: center;">
                            Currently Unavailable
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    showMentorProfile(mentorId) {
        const mentor = this.mentors.find(m => m.id === mentorId);
        if (!mentor) return;

        const modal = document.createElement('div');
        modal.id = 'mentor-profile-modal';
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
            <div style="max-width: 600px; width: 100%; background: rgba(0, 0, 0, 0.8); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 15px; padding: 2rem;">
                <div style="text-align: center; margin-bottom: 2rem;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">👨‍🏫</div>
                    <h2 style="color: #ba944f; margin-bottom: 0.5rem;">${mentor.name}</h2>
                    <p style="opacity: 0.8;">${mentor.bio}</p>
                </div>
                
                <div style="margin-bottom: 2rem;">
                    <h4 style="color: #ba944f; margin-bottom: 1rem;">Expertise</h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                        ${mentor.expertise.map(exp => `<span style="background: rgba(186, 148, 79, 0.2); padding: 0.5rem 1rem; border-radius: 8px; color: #ba944f;">${exp}</span>`).join('')}
                    </div>
                </div>
                
                <div style="margin-bottom: 2rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span style="opacity: 0.8;">Rating</span>
                        <span style="color: #ba944f; font-weight: 600;">${mentor.rating} ⭐</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span style="opacity: 0.8;">Students</span>
                        <span style="color: #ba944f; font-weight: 600;">${mentor.students}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="opacity: 0.8;">Experience</span>
                        <span style="color: #ba944f; font-weight: 600;">${mentor.experience}</span>
                    </div>
                </div>
                
                <div style="display: flex; gap: 1rem;">
                    <button id="request-mentorship-btn" style="flex: 1; padding: 0.75rem; background: rgba(74, 222, 128, 0.2); border: 2px solid rgba(74, 222, 128, 0.5); border-radius: 10px; color: #4ade80; cursor: pointer; font-weight: 600;">
                        Request Mentorship
                    </button>
                    <button id="close-mentor-modal" style="flex: 1; padding: 0.75rem; background: rgba(107, 114, 128, 0.2); border: 2px solid rgba(107, 114, 128, 0.5); border-radius: 10px; color: rgba(255, 255, 255, 0.7); cursor: pointer; font-weight: 600;">
                        Close
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('close-mentor-modal').addEventListener('click', () => {
            modal.remove();
        });

        document.getElementById('request-mentorship-btn').addEventListener('click', () => {
            this.requestMentorship(mentor.id);
            modal.remove();
        });
    }

    showMentorApplication() {
        alert('Mentor application form coming soon!');
    }

    showMentorSearch() {
        alert('Mentor search feature coming soon!');
    }

    async requestMentorship(mentorId) {
        if (typeof supabase === 'undefined' || !supabase) {
            alert('Mentorship request sent! (Mock)');
            return;
        }

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                alert('Please log in to request mentorship');
                return;
            }

            const { error } = await supabase
                .from('mentorship_requests')
                .insert({
                    mentor_id: mentorId,
                    mentee_id: session.user.id,
                    status: 'pending',
                    created_at: new Date().toISOString()
                });

            if (error) {
                console.error('Error requesting mentorship:', error);
                alert('Error sending request. Please try again.');
                return;
            }

            alert('Mentorship request sent!');
        } catch (error) {
            console.error('Error requesting mentorship:', error);
            alert('Error sending request. Please try again.');
        }
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscoveryMentorship = new PlanetDiscoveryMentorship();
}

