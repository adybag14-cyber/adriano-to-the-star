/**
 * Planet Wishlist System
 * Save planets for later
 */

class PlanetWishlistSystem {
    constructor() {
        this.wishlist = [];
        this.currentUser = null;
        this.isInitialized = false;
        this.init();
    }

    async init() {
        if (!window.supabase || !window.supabase.auth) {
            console.warn("Wishlist: Supabase not ready. Retrying in 1s...");
            setTimeout(() => this.init(), 1000);
            return;
        }
        if (window.supabase) {
            const { data: { user } } = await window.supabase.auth.getUser();
            if (user) this.currentUser = user;
        }
        this.loadWishlist();
        this.setupDelegatedEvents();
        this.isInitialized = true;
        console.log('⭐ Planet Wishlist System initialized');
    }

    setupDelegatedEvents() {
        document.body.addEventListener('click', (e) => {
            const btn = e.target.closest('.remove-wishlist-btn');
            if (btn) {
                e.preventDefault();
                const kepid = btn.dataset.kepid;
                if (kepid) {
                    this.removeFromWishlist(kepid);
                    this.renderWishlist('wishlist-container');
                }
            }
        });
    }

    loadWishlist() {
        try {
            const stored = localStorage.getItem('planet-wishlist');
            if (stored) this.wishlist = JSON.parse(stored);
        } catch (error) {
            console.error('Error loading wishlist:', error);
        }
    }

    saveWishlist() {
        try {
            localStorage.setItem('planet-wishlist', JSON.stringify(this.wishlist));
        } catch (error) {
            console.error('Error saving wishlist:', error);
        }
    }

    addToWishlist(planetData, notes = '') {
        if (this.wishlist.find(w => w.kepid === planetData.kepid)) {
            return false; // Already in wishlist
        }

        const item = {
            kepid: planetData.kepid,
            name: planetData.kepler_name || planetData.kepoi_name,
            notes: notes,
            addedAt: new Date().toISOString(),
            userId: this.currentUser?.id
        };

        this.wishlist.push(item);
        this.saveWishlist();
        try {
            if (typeof window !== 'undefined' && typeof window.renderMyUniverseOverview === 'function') {
                window.renderMyUniverseOverview();
            }
        } catch (e) { }
        return true;
    }

    removeFromWishlist(kepid) {
        const index = this.wishlist.findIndex(w => w.kepid === kepid);
        if (index >= 0) {
            this.wishlist.splice(index, 1);
            this.saveWishlist();
            try {
                if (typeof window !== 'undefined' && typeof window.renderMyUniverseOverview === 'function') {
                    window.renderMyUniverseOverview();
                }
            } catch (e) { }
            return true;
        }
        return false;
    }

    isInWishlist(kepid) {
        return this.wishlist.some(w => w.kepid === kepid);
    }

    escapeHTML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    renderWishlist(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="wishlist-system" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin: 1rem 0;">
                <h3 style="color: #ba944f; margin: 0 0 1.5rem 0;">⭐ Wishlist (${this.wishlist.length})</h3>
                <div class="wishlist-items">${this.renderWishlistItems()}</div>
            </div>
        `;
    }

    renderWishlistItems() {
        if (this.wishlist.length === 0) {
            return '<p style="color: rgba(255, 255, 255, 0.5);">Your wishlist is empty. Add planets to save them for later!</p>';
        }

        return this.wishlist.map(item => `
            <div style="padding: 1rem; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 10px; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="color: #ba944f; font-weight: 600; margin-bottom: 0.25rem;">${this.escapeHTML(item.name)}</div>
                    ${item.notes ? `<div style="color: rgba(255, 255, 255, 0.7); font-size: 0.85rem;">${this.escapeHTML(item.notes)}</div>` : ''}
                </div>
                <button class="remove-wishlist-btn" data-kepid="${this.escapeHTML(item.kepid)}" style="padding: 0.5rem 1rem; background: rgba(239, 68, 68, 0.2); border: 2px solid rgba(239, 68, 68, 0.5); border-radius: 10px; color: white; cursor: pointer; font-weight: 600;">
                    Remove
                </button>
            </div>
        `).join('');
    }
}

if (typeof window !== 'undefined') {
    window.PlanetWishlistSystem = PlanetWishlistSystem;
    window.planetWishlistSystem = new PlanetWishlistSystem();
}

