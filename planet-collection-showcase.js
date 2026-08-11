/**
 * Planet Collection Showcase
 * Display user planet collections
 */

class PlanetCollectionShowcase {
    constructor() {
        this.collections = [];
        this.currentUser = null;
        this.isInitialized = false;
        this.init();
    }

    async init() {
        if (window.supabase) {
            const { data: { user } } = await window.supabase.auth.getUser();
            if (user) this.currentUser = user;
        }
        this.loadCollections();
        this.isInitialized = true;
        console.log('📚 Planet Collection Showcase initialized');
    }

    loadCollections() {
        try {
            const stored = localStorage.getItem('planet-collections');
            if (stored) this.collections = JSON.parse(stored);
        } catch (error) {
            console.error('Error loading collections:', error);
        }
    }

    saveCollections() {
        try {
            localStorage.setItem('planet-collections', JSON.stringify(this.collections));
        } catch (error) {
            console.error('Error saving collections:', error);
        }
    }

    createCollection(name, description = '') {
        const collection = {
            id: `collection-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            name: name,
            description: description,
            userId: this.currentUser?.id,
            planets: [],
            createdAt: new Date().toISOString(),
            isPublic: false
        };

        this.collections.push(collection);
        this.saveCollections();
        return collection;
    }

    addPlanetToCollection(collectionId, planetData) {
        const collection = this.collections.find(c => c.id === collectionId);
        if (!collection) return false;

        if (!collection.planets.find(p => p.kepid === planetData.kepid)) {
            collection.planets.push({
                kepid: planetData.kepid,
                name: planetData.kepler_name || planetData.kepoi_name,
                addedAt: new Date().toISOString()
            });
            this.saveCollections();
            return true;
        }
        return false;
    }

    getUserCollections(userId = null) {
        const userIdToCheck = userId || this.currentUser?.id;
        if (!userIdToCheck) return [];
        return this.collections.filter(c => c.userId === userIdToCheck);
    }

    renderShowcase(containerId, userId = null) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const collections = userId ? this.collections.filter(c => c.userId === userId || c.isPublic) : this.getUserCollections();

        container.innerHTML = `
            <div class="collection-showcase" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin: 1rem 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h3 style="color: #ba944f; margin: 0;">📚 Planet Collections</h3>
                    ${this.currentUser ? `
                        <button id="create-collection-btn" style="padding: 0.75rem 1.5rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: white; cursor: pointer; font-weight: 600;">
                            ➕ Create Collection
                        </button>
                    ` : ''}
                </div>
                <div class="collections-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;">
                    ${this.renderCollections(collections)}
                </div>
            </div>
        `;

        document.getElementById('create-collection-btn')?.addEventListener('click', () => {
            const name = prompt('Collection name:');
            if (name) {
                this.createCollection(name);
                this.renderShowcase(containerId, userId);
            }
        });
    }

    renderCollections(collections) {
        if (collections.length === 0) {
            return '<p style="color: rgba(255, 255, 255, 0.5); grid-column: 1 / -1; text-align: center; padding: 2rem;">No collections yet</p>';
        }

        return collections.map(collection => `
            <div style="padding: 1.5rem; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 10px;">
                <h4 style="color: #ba944f; margin: 0 0 0.5rem 0;">${collection.name}</h4>
                ${collection.description ? `<p style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem; margin: 0.5rem 0;">${collection.description}</p>` : ''}
                <div style="color: rgba(255, 255, 255, 0.6); font-size: 0.85rem; margin-top: 1rem;">
                    ${collection.planets.length} planets
                </div>
            </div>
        `).join('');
    }
}

if (typeof window !== 'undefined') {
    window.PlanetCollectionShowcase = PlanetCollectionShowcase;
    window.planetCollectionShowcase = new PlanetCollectionShowcase();
}

