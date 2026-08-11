/**
 * Planet Social Network
 * Connect users interested in same planets
 */

class PlanetSocialNetwork {
    constructor() {
        this.connections = [];
        this.groups = [];
        this.currentUser = null;
        this.isInitialized = false;
        this.init();
    }

    async init() {
        if (window.supabase) {
            const { data: { user } } = await window.supabase.auth.getUser();
            if (user) this.currentUser = user;
        }
        this.loadData();
        this.isInitialized = true;
        console.log('👥 Planet Social Network initialized');
    }

    loadData() {
        try {
            const stored = localStorage.getItem('planet-social-connections');
            if (stored) this.connections = JSON.parse(stored);
        } catch (error) {
            console.error('Error loading connections:', error);
        }
    }

    saveData() {
        try {
            localStorage.setItem('planet-social-connections', JSON.stringify(this.connections));
        } catch (error) {
            console.error('Error saving connections:', error);
        }
    }

    connectUsers(userId1, userId2, planetId) {
        const connection = {
            id: `conn-${Date.now()}`,
            userId1,
            userId2,
            planetId,
            createdAt: new Date().toISOString()
        };
        this.connections.push(connection);
        this.saveData();
        return connection;
    }

    getPlanetConnections(planetId) {
        return this.connections.filter(c => c.planetId === planetId);
    }

    renderSocialNetwork(containerId, planetId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const connections = this.getPlanetConnections(planetId);
        container.innerHTML = `
            <div class="social-network" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin: 1rem 0;">
                <h3 style="color: #ba944f; margin: 0 0 1.5rem 0;">👥 Planet Social Network</h3>
                <p style="color: rgba(255, 255, 255, 0.7);">${connections.length} users interested in this planet</p>
            </div>
        `;
    }
}

if (typeof window !== 'undefined') {
    window.PlanetSocialNetwork = PlanetSocialNetwork;
    window.planetSocialNetwork = new PlanetSocialNetwork();
}

