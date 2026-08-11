/**
 * Planet Exploration Journal
 * Users can document their planet discoveries
 */

class PlanetExplorationJournal {
    constructor() {
        this.entries = [];
        this.currentUser = null;
        this.isInitialized = false;
        this.init();
    }

    async init() {
        if (window.supabase) {
            const { data: { user } } = await window.supabase.auth.getUser();
            if (user) this.currentUser = user;
        }
        this.loadEntries();
        this.isInitialized = true;
        console.log('📔 Planet Exploration Journal initialized');
    }

    loadEntries() {
        try {
            const stored = localStorage.getItem('planet-journal-entries');
            if (stored) this.entries = JSON.parse(stored);
        } catch (error) {
            console.error('Error loading journal entries:', error);
        }
    }

    saveEntries() {
        try {
            localStorage.setItem('planet-journal-entries', JSON.stringify(this.entries));
        } catch (error) {
            console.error('Error saving entries:', error);
        }
    }

    createEntry(planetData, notes = '', tags = []) {
        const entry = {
            id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            planetId: planetData.kepid,
            planetName: planetData.kepler_name || planetData.kepoi_name,
            notes: notes,
            tags: tags,
            createdAt: new Date().toISOString(),
            userId: this.currentUser?.id
        };
        this.entries.push(entry);
        this.saveEntries();
        return entry;
    }

    renderJournal(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = `
            <div class="exploration-journal" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin: 1rem 0;">
                <h3 style="color: #ba944f; margin: 0 0 1.5rem 0;">📔 Exploration Journal</h3>
                <div class="entries-list">${this.renderEntries()}</div>
            </div>
        `;
    }

    renderEntries() {
        if (this.entries.length === 0) {
            return '<p style="color: rgba(255, 255, 255, 0.5);">No entries yet. Start documenting your discoveries!</p>';
        }
        return this.entries.slice().reverse().map(entry => `
            <div style="padding: 1.5rem; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 10px; margin-bottom: 1rem;">
                <h5 style="color: #ba944f; margin: 0 0 0.5rem 0;">${entry.planetName}</h5>
                <p style="color: rgba(255, 255, 255, 0.7); margin: 0.5rem 0;">${entry.notes}</p>
                <div style="color: rgba(255, 255, 255, 0.5); font-size: 0.85rem;">${new Date(entry.createdAt).toLocaleDateString()}</div>
            </div>
        `).join('');
    }
}

if (typeof window !== 'undefined') {
    window.PlanetExplorationJournal = PlanetExplorationJournal;
    window.planetExplorationJournal = new PlanetExplorationJournal();
}

