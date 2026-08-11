/**
 * Planet Bookmark System
 * Save favorite planets
 */

class PlanetBookmarkSystem {
    constructor() {
        this.bookmarks = [];
        this.currentUser = null;
        this.isInitialized = false;
        this.init();
    }

    async init() {
        if (!window.supabase || !window.supabase.auth) {
            console.warn("Bookmark: Supabase not ready. Retrying in 1s...");
            setTimeout(() => this.init(), 1000);
            return;
        }
        const { data: { user } } = await window.supabase.auth.getUser();
        this.loadBookmarks();
        this.setupDelegatedEvents();
        this.isInitialized = true;
        console.log('🔖 Planet Bookmark System initialized');
    }

    setupDelegatedEvents() {
        // Delegate clicks from document body to handle removes regardless of where rendered
        document.body.addEventListener('click', (e) => {
            const btn = e.target.closest('.remove-bookmark-btn');
            if (btn) {
                e.preventDefault();
                const kepid = btn.dataset.kepid;
                if (kepid) {
                    this.removeBookmark(kepid);
                    this.renderBookmarks('bookmarks-container');
                }
            }
        });
    }

    loadBookmarks() {
        try {
            const stored = localStorage.getItem('planet-bookmarks');
            if (stored) this.bookmarks = JSON.parse(stored);
        } catch (error) {
            console.error('Error loading bookmarks:', error);
        }
    }

    saveBookmarks() {
        try {
            localStorage.setItem('planet-bookmarks', JSON.stringify(this.bookmarks));
        } catch (error) {
            console.error('Error saving bookmarks:', error);
        }
    }

    addBookmark(planetData, notes = '') {
        if (this.bookmarks.find(b => b.kepid === planetData.kepid)) {
            return false;
        }

        const bookmark = {
            kepid: planetData.kepid,
            name: planetData.kepler_name || planetData.kepoi_name,
            notes: notes,
            bookmarkedAt: new Date().toISOString(),
            userId: this.currentUser?.id
        };

        this.bookmarks.push(bookmark);
        this.saveBookmarks();
        try {
            if (typeof window !== 'undefined' && typeof window.renderMyUniverseOverview === 'function') {
                window.renderMyUniverseOverview();
            }
        } catch (e) { }
        return true;
    }

    removeBookmark(kepid) {
        const index = this.bookmarks.findIndex(b => b.kepid === kepid);
        if (index >= 0) {
            this.bookmarks.splice(index, 1);
            this.saveBookmarks();
            try {
                if (typeof window !== 'undefined' && typeof window.renderMyUniverseOverview === 'function') {
                    window.renderMyUniverseOverview();
                }
            } catch (e) { }
            return true;
        }
        return false;
    }

    isBookmarked(kepid) {
        return this.bookmarks.some(b => b.kepid === kepid);
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

    renderBookmarks(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="bookmark-system" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin: 1rem 0;">
                <h3 style="color: #ba944f; margin: 0 0 1.5rem 0;">🔖 Bookmarks (${this.bookmarks.length})</h3>
                <div class="bookmarks-list">${this.renderBookmarksList()}</div>
            </div>
        `;
    }

    renderBookmarksList() {
        if (this.bookmarks.length === 0) {
            return '<p style="color: rgba(255, 255, 255, 0.5);">No bookmarks yet</p>';
        }

        return this.bookmarks.map(bookmark => `
            <div style="padding: 1rem; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 10px; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="color: #ba944f; font-weight: 600;">${this.escapeHTML(bookmark.name)}</div>
                    ${bookmark.notes ? `<div style="color: rgba(255, 255, 255, 0.7); font-size: 0.85rem; margin-top: 0.25rem;">${this.escapeHTML(bookmark.notes)}</div>` : ''}
                </div>
                <button class="remove-bookmark-btn" data-kepid="${this.escapeHTML(bookmark.kepid)}" style="padding: 0.5rem 1rem; background: rgba(239, 68, 68, 0.2); border: 2px solid rgba(239, 68, 68, 0.5); border-radius: 10px; color: white; cursor: pointer; font-weight: 600;">
                    Remove
                </button>
            </div>
        `).join('');
    }
}

if (typeof window !== 'undefined') {
    window.PlanetBookmarkSystem = PlanetBookmarkSystem;
    window.planetBookmarkSystem = new PlanetBookmarkSystem();
}

