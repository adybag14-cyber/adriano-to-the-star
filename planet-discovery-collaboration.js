/**
 * Planet Discovery Collaboration Tools
 * Tools for researchers to collaborate on planet discovery projects
 */

class PlanetDiscoveryCollaboration {
    constructor() {
        this.projects = [];
        this.teams = [];
        this.init();
    }

    init() {
        this.loadProjects();
        this.loadTeams();
        console.log('🤝 Collaboration tools initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_co_ll_ab_or_at_io_n_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    loadProjects() {
        this.projects = [
            {
                id: 'proj-1',
                title: 'Habitable Zone Analysis Project',
                description: 'Collaborative analysis of potentially habitable exoplanets',
                members: ['Dr. Sarah Johnson', 'Prof. Michael Chen', 'Dr. Emily Rodriguez'],
                status: 'active',
                progress: 65,
                createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'proj-2',
                title: 'Kepler Data Mining Initiative',
                description: 'Mining Kepler archive for undiscovered patterns',
                members: ['Dr. James Wilson', 'Dr. Lisa Anderson'],
                status: 'active',
                progress: 40,
                createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];
    }

    loadTeams() {
        this.teams = [
            {
                id: 'team-1',
                name: 'Exoplanet Research Group',
                members: 12,
                projects: 5,
                focus: 'Exoplanet Discovery'
            }
        ];
    }

    renderCollaboration(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        let html = `
            <div class="collaboration-container" style="margin-top: 2rem;">
                <h3 style="color: #ba944f; margin-bottom: 1.5rem; text-align: center;">🤝 Collaboration Tools</h3>
                
                <div style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin-bottom: 2rem;">
                    <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                        <button id="create-project-btn" style="padding: 0.75rem 1.5rem; background: rgba(74, 222, 128, 0.2); border: 2px solid rgba(74, 222, 128, 0.5); border-radius: 10px; color: #4ade80; cursor: pointer; font-weight: 600;">
                            ➕ Create Project
                        </button>
                        <button id="join-team-btn" style="padding: 0.75rem 1.5rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: #ba944f; cursor: pointer; font-weight: 600;">
                            👥 Join Team
                        </button>
                        <button id="find-collaborators-btn" style="padding: 0.75rem 1.5rem; background: rgba(59, 130, 246, 0.2); border: 2px solid rgba(59, 130, 246, 0.5); border-radius: 10px; color: #3b82f6; cursor: pointer; font-weight: 600;">
                            🔍 Find Collaborators
                        </button>
                    </div>
                </div>
                
                <h4 style="color: #ba944f; margin-bottom: 1rem;">Active Projects</h4>
                <div class="projects-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 2rem; margin-bottom: 2rem;">
        `;

        this.projects.forEach(project => {
            html += this.createProjectCard(project);
        });

        html += `
                </div>
                
                <h4 style="color: #ba944f; margin-bottom: 1rem;">Teams</h4>
                <div class="teams-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 2rem;">
        `;

        this.teams.forEach(team => {
            html += this.createTeamCard(team);
        });

        html += `
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Event listeners
        this.projects.forEach(project => {
            const card = document.querySelector(`[data-project-id="${project.id}"]`);
            if (card) {
                card.addEventListener('click', () => {
                    this.showProjectDetails(project.id);
                });
            }
        });

        document.getElementById('create-project-btn')?.addEventListener('click', () => {
            this.showCreateProjectForm();
        });

        document.getElementById('join-team-btn')?.addEventListener('click', () => {
            this.showJoinTeamForm();
        });

        document.getElementById('find-collaborators-btn')?.addEventListener('click', () => {
            this.showFindCollaborators();
        });
    }

    createProjectCard(project) {
        return `
            <div class="project-card" data-project-id="${project.id}" style="background: linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(20, 20, 30, 0.9)); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; cursor: pointer; transition: all 0.3s ease;">
                <h4 style="color: #ba944f; margin-bottom: 0.5rem;">${project.title}</h4>
                <p style="opacity: 0.8; font-size: 0.9rem; margin-bottom: 1rem;">${project.description}</p>
                <div style="margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.85rem;">
                        <span style="opacity: 0.7;">Progress</span>
                        <span style="color: #ba944f; font-weight: 600;">${project.progress}%</span>
                    </div>
                    <div style="width: 100%; height: 8px; background: rgba(186, 148, 79, 0.2); border-radius: 5px; overflow: hidden;">
                        <div style="width: ${project.progress}%; height: 100%; background: #ba944f; transition: width 0.3s;"></div>
                    </div>
                </div>
                <div style="font-size: 0.85rem; opacity: 0.7; margin-bottom: 0.5rem;">
                    👥 ${project.members.length} members
                </div>
                <div style="font-size: 0.85rem; opacity: 0.7;">
                    ${project.status === 'active' ? '🟢 Active' : '⚪ Inactive'}
                </div>
            </div>
        `;
    }

    createTeamCard(team) {
        return `
            <div class="team-card" data-team-id="${team.id}" style="background: linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(20, 20, 30, 0.9)); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; cursor: pointer; transition: all 0.3s ease;">
                <h4 style="color: #ba944f; margin-bottom: 0.5rem;">${team.name}</h4>
                <p style="opacity: 0.8; font-size: 0.9rem; margin-bottom: 1rem;">Focus: ${team.focus}</p>
                <div style="display: flex; justify-content: space-between; font-size: 0.85rem; opacity: 0.7;">
                    <span>👥 ${team.members} members</span>
                    <span>📁 ${team.projects} projects</span>
                </div>
            </div>
        `;
    }

    showProjectDetails(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) return;

        alert(`Project details for ${project.title} coming soon!`);
    }

    showCreateProjectForm() {
        alert('Create project form coming soon!');
    }

    showJoinTeamForm() {
        alert('Join team form coming soon!');
    }


    loadProjects() {
        this.projects = [
            {
                id: 'proj-1',
                title: 'Habitable Zone Analysis Project',
                description: 'Collaborative analysis of potentially habitable exoplanets',
                members: ['Dr. Sarah Johnson', 'Prof. Michael Chen', 'Dr. Emily Rodriguez'],
                status: 'active',
                progress: 65,
                createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'proj-2',
                title: 'Kepler Data Mining Initiative',
                description: 'Mining Kepler archive for undiscovered patterns',
                members: ['Dr. James Wilson', 'Dr. Lisa Anderson'],
                status: 'active',
                progress: 40,
                createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];
    }

    loadTeams() {
        this.teams = [
            {
                id: 'team-1',
                name: 'Exoplanet Research Group',
                members: 12,
                projects: 5,
                focus: 'Exoplanet Discovery'
            }
        ];
    }

    renderCollaboration(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        let html = `
            <div class="collaboration-container" style="margin-top: 2rem;">
                <h3 style="color: #ba944f; margin-bottom: 1.5rem; text-align: center;">🤝 Collaboration Tools</h3>
                
                <div style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin-bottom: 2rem;">
                    <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                        <button id="create-project-btn" style="padding: 0.75rem 1.5rem; background: rgba(74, 222, 128, 0.2); border: 2px solid rgba(74, 222, 128, 0.5); border-radius: 10px; color: #4ade80; cursor: pointer; font-weight: 600;">
                            ➕ Create Project
                        </button>
                        <button id="join-team-btn" style="padding: 0.75rem 1.5rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: #ba944f; cursor: pointer; font-weight: 600;">
                            👥 Join Team
                        </button>
                        <button id="find-collaborators-btn" style="padding: 0.75rem 1.5rem; background: rgba(59, 130, 246, 0.2); border: 2px solid rgba(59, 130, 246, 0.5); border-radius: 10px; color: #3b82f6; cursor: pointer; font-weight: 600;">
                            🔍 Find Collaborators
                        </button>
                    </div>
                </div>
                
                <h4 style="color: #ba944f; margin-bottom: 1rem;">Active Projects</h4>
                <div class="projects-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 2rem; margin-bottom: 2rem;">
        `;

        this.projects.forEach(project => {
            html += this.createProjectCard(project);
        });

        html += `
                </div>
                
                <h4 style="color: #ba944f; margin-bottom: 1rem;">Teams</h4>
                <div class="teams-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 2rem;">
        `;

        this.teams.forEach(team => {
            html += this.createTeamCard(team);
        });

        html += `
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Event listeners
        this.projects.forEach(project => {
            const card = document.querySelector(`[data-project-id="${project.id}"]`);
            if (card) {
                card.addEventListener('click', () => {
                    this.showProjectDetails(project.id);
                });
            }
        });

        document.getElementById('create-project-btn')?.addEventListener('click', () => {
            this.showCreateProjectForm();
        });

        document.getElementById('join-team-btn')?.addEventListener('click', () => {
            this.showJoinTeamForm();
        });

        document.getElementById('find-collaborators-btn')?.addEventListener('click', () => {
            this.showFindCollaborators();
        });
    }

    createProjectCard(project) {
        return `
            <div class="project-card" data-project-id="${project.id}" style="background: linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(20, 20, 30, 0.9)); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; cursor: pointer; transition: all 0.3s ease;">
                <h4 style="color: #ba944f; margin-bottom: 0.5rem;">${project.title}</h4>
                <p style="opacity: 0.8; font-size: 0.9rem; margin-bottom: 1rem;">${project.description}</p>
                <div style="margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.85rem;">
                        <span style="opacity: 0.7;">Progress</span>
                        <span style="color: #ba944f; font-weight: 600;">${project.progress}%</span>
                    </div>
                    <div style="width: 100%; height: 8px; background: rgba(186, 148, 79, 0.2); border-radius: 5px; overflow: hidden;">
                        <div style="width: ${project.progress}%; height: 100%; background: #ba944f; transition: width 0.3s;"></div>
                    </div>
                </div>
                <div style="font-size: 0.85rem; opacity: 0.7; margin-bottom: 0.5rem;">
                    👥 ${project.members.length} members
                </div>
                <div style="font-size: 0.85rem; opacity: 0.7;">
                    ${project.status === 'active' ? '🟢 Active' : '⚪ Inactive'}
                </div>
            </div>
        `;
    }

    createTeamCard(team) {
        return `
            <div class="team-card" data-team-id="${team.id}" style="background: linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(20, 20, 30, 0.9)); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; cursor: pointer; transition: all 0.3s ease;">
                <h4 style="color: #ba944f; margin-bottom: 0.5rem;">${team.name}</h4>
                <p style="opacity: 0.8; font-size: 0.9rem; margin-bottom: 1rem;">Focus: ${team.focus}</p>
                <div style="display: flex; justify-content: space-between; font-size: 0.85rem; opacity: 0.7;">
                    <span>👥 ${team.members} members</span>
                    <span>📁 ${team.projects} projects</span>
                </div>
            </div>
        `;
    }

    showProjectDetails(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) return;

        alert(`Project details for ${project.title} coming soon!`);
    }

    showCreateProjectForm() {
        alert('Create project form coming soon!');
    }

    showJoinTeamForm() {
        alert('Join team form coming soon!');
    }

    showFindCollaborators() {
        alert('Find collaborators feature coming soon!');
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscoveryCollaboration = new PlanetDiscoveryCollaboration();
    // Add small delay to ensure container exists
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => window.planetDiscoveryCollaboration.renderCollaboration('collaboration-container'), 100);
        });
    } else {
        setTimeout(() => window.planetDiscoveryCollaboration.renderCollaboration('collaboration-container'), 100);
    }
}
