/**
 * Planet Research Collaboration
 * Users can collaborate on planet research
 */

class PlanetResearchCollaboration {
    constructor() {
        this.projects = [];
        this.currentUser = null;
        this.isInitialized = false;
        this.init();
    }

    async init() {
        if (window.supabase) {
            const { data: { user } } = await window.supabase.auth.getUser();
            if (user) this.currentUser = user;
        }
        this.loadProjects();
        this.isInitialized = true;
        console.log('🔬 Planet Research Collaboration initialized');
    }

    loadProjects() {
        try {
            const stored = localStorage.getItem('research-projects');
            if (stored) this.projects = JSON.parse(stored);
        } catch (error) {
            console.error('Error loading projects:', error);
        }
    }

    saveProjects() {
        try {
            localStorage.setItem('research-projects', JSON.stringify(this.projects));
        } catch (error) {
            console.error('Error saving projects:', error);
        }
    }

    createProject(name, planetId, description = '') {
        const project = {
            id: `project-${Date.now()}`,
            name,
            planetId,
            description,
            creatorId: this.currentUser?.id,
            members: [this.currentUser?.id],
            createdAt: new Date().toISOString(),
            status: 'active'
        };
        this.projects.push(project);
        this.saveProjects();
        return project;
    }

    renderCollaboration(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = `
            <div class="research-collaboration" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin: 1rem 0;">
                <h3 style="color: #ba944f; margin: 0 0 1.5rem 0;">🔬 Research Collaboration</h3>
                <p style="color: rgba(255, 255, 255, 0.7);">${this.projects.length} active research projects</p>
            </div>
        `;
    }
}

if (typeof window !== 'undefined') {
    window.PlanetResearchCollaboration = PlanetResearchCollaboration;
    window.planetResearchCollaboration = new PlanetResearchCollaboration();
}

