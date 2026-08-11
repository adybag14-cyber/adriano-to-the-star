/**
 * Bookmark Manager
 * 
 * Universal bookmark system for saving and organizing favorite pages,
 * planets, and content across the site.
 * 
 * @class BookmarkManager
 * @example
 * // Auto-initializes on page load
 * // Access via: window.bookmarkManager()
 * 
 * // Add bookmark
 * const bookmarks = window.bookmarkManager();
 * bookmarks.addBookmark('Planet Kepler-22b', {
 *   url: 'database.html#kepler-22b',
 *   type: 'planet',
 *   tags: ['habitable', 'earth-like']
 * });
 */
class BookmarkManager {
    constructor() {
        this.bookmarks = [];
        this.categories = [];
        this.storageType = 'localStorage'; // Track which storage is available
        this.memoryStorage = {}; // Fallback in-memory storage
        this.init();
    }

    init() {
        // Load bookmarks and categories
        this.loadBookmarks();
        this.loadCategories();

        // Setup bookmark button if on database page
        this.setupBookmarkButtons();
    }

    /**
     * Setup bookmark buttons on page
     * 
     * @method setupBookmarkButtons
     * @returns {void}
     */
    setupBookmarkButtons() {
        // Add bookmark button to planet cards if on database page
        if (window.location.pathname.includes('database.html')) {
            this.observePlanetCards();
        }
    }

    /**
     * Observe planet cards for bookmark buttons
     * 
     * @method observePlanetCards
     * @returns {void}
     */
    observePlanetCards() {
        const observer = new MutationObserver(() => {
            this.addBookmarkButtonsToCards();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Initial check
        setTimeout(() => this.addBookmarkButtonsToCards(), 1000);
    }

    /**
     * Add bookmark buttons to planet cards
     * 
     * @method addBookmarkButtonsToCards
     * @returns {void}
     */
    addBookmarkButtonsToCards() {
        const cards = document.querySelectorAll('.planet-card, [data-planet-id]');
        cards.forEach(card => {
            if (card.querySelector('.bookmark-btn')) return; // Already has button

            const planetId = card.dataset.planetId || card.id || `planet-${Date.now()}`;
            const planetName = card.querySelector('h3, .planet-name, .card-title')?.textContent || 'Unknown Planet';

            const btn = document.createElement('button');
            btn.className = 'bookmark-btn';
            btn.innerHTML = this.isBookmarked(planetId) ? '🔖' : '🔖';
            btn.title = this.isBookmarked(planetId) ? 'Remove Bookmark' : 'Add Bookmark';
            btn.dataset.planetId = planetId;

            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleBookmark(planetId, planetName, card);
            });

            // Add to card
            const actions = card.querySelector('.card-actions, .planet-actions');
            if (actions) {
                actions.appendChild(btn);
            } else {
                // Create actions container
                const actionsContainer = document.createElement('div');
                actionsContainer.className = 'card-actions';
                actionsContainer.appendChild(btn);
                card.appendChild(actionsContainer);
            }
        });
    }

    /**
     * Add bookmark
     * 
     * @method addBookmark
     * @param {string} title - Bookmark title
     * @param {Object} options - Bookmark options
     * @param {string} options.url - Bookmark URL
     * @param {string} [options.type] - Bookmark type
     * @param {Array} [options.tags] - Bookmark tags
     * @param {string} [options.description] - Bookmark description
     * @returns {string} Bookmark ID
     */
    addBookmark(title, options = {}) {
        const bookmark = {
            id: `bookmark-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            title,
            url: options.url || window.location.href,
            type: options.type || 'page',
            tags: options.tags || [],
            description: options.description || '',
            category: options.category || 'uncategorized',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.bookmarks.push(bookmark);
        this.saveBookmarks();

        // Dispatch event
        window.dispatchEvent(new CustomEvent('bookmark-added', {
            detail: { bookmark },
            bubbles: true
        }));

        this.trackEvent('bookmark_added', { bookmarkId: bookmark.id, type: bookmark.type });
        return bookmark.id;
    }

    /**
     * Remove bookmark
     * 
     * @method removeBookmark
     * @param {string} id - Bookmark ID
     * @returns {boolean} True if removed
     */
    removeBookmark(id) {
        const index = this.bookmarks.findIndex(b => b.id === id);
        if (index > -1) {
            const bookmark = this.bookmarks[index];
            this.bookmarks.splice(index, 1);
            this.saveBookmarks();

            // Dispatch event
            window.dispatchEvent(new CustomEvent('bookmark-removed', {
                detail: { bookmark },
                bubbles: true
            }));

            this.trackEvent('bookmark_removed', { bookmarkId: bookmark.id });
            return true;
        }
        return false;
    }

    /**
     * Toggle bookmark
     * 
     * @method toggleBookmark
     * @param {string} planetId - Planet ID
     * @param {string} planetName - Planet name
     * @param {HTMLElement} card - Card element
     * @returns {void}
     */
    toggleBookmark(planetId, planetName, card) {
        const existing = this.bookmarks.find(b =>
            b.url.includes(planetId) || b.title === planetName
        );

        if (existing) {
            this.removeBookmark(existing.id);
            this.updateBookmarkButton(card, false);
        } else {
            this.addBookmark(planetName, {
                url: `${window.location.href}#${planetId}`,
                type: 'planet',
                tags: ['planet', 'exoplanet']
            });
            this.updateBookmarkButton(card, true);
        }
    }

    /**
     * Update bookmark button state
     * 
     * @method updateBookmarkButton
     * @param {HTMLElement} card - Card element
     * @param {boolean} isBookmarked - Whether item is bookmarked
     * @returns {Promise<void>}
     */
    async updateBookmarkButton(card, isBookmarked) {
        // Simulating async DOM operation as requested
        const btn = await Promise.resolve(card.querySelector('.bookmark-btn'));
        if (btn) {
            btn.title = isBookmarked ? 'Remove Bookmark' : 'Add Bookmark';
            btn.style.opacity = isBookmarked ? '1' : '0.6';
        }
    }

    /**
     * Check if item is bookmarked
     * 
     * @method isBookmarked
     * @param {string} id - Item ID
     * @returns {boolean} True if bookmarked
     */
    isBookmarked(id) {
        return this.bookmarks.some(b =>
            b.url.includes(id) || b.id === id
        );
    }

    /**
     * Get bookmarks
     * 
     * @method getBookmarks
     * @param {Object} [filters] - Filter options
     * @returns {Array} Array of bookmarks
     */
    getBookmarks(filters = {}) {
        let result = [...this.bookmarks];

        if (filters.type) {
            result = result.filter(b => b.type === filters.type);
        }

        if (filters.category) {
            result = result.filter(b => b.category === filters.category);
        }

        if (filters.tags && filters.tags.length > 0) {
            result = result.filter(b =>
                filters.tags.some(tag => b.tags.includes(tag))
            );
        }

        if (filters.search) {
            const search = filters.search.toLowerCase();
            result = result.filter(b =>
                b.title.toLowerCase().includes(search) ||
                b.description.toLowerCase().includes(search) ||
                b.tags.some(tag => tag.toLowerCase().includes(search))
            );
        }

        return result;
    }

    /**
     * Create category
     * 
     * @method createCategory
     * @param {string} name - Category name
     * @param {string} [color] - Category color
     * @returns {string} Category ID
     */
    createCategory(name, color = '#ba944f') {
        const category = {
            id: `category-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            name,
            color,
            createdAt: new Date().toISOString()
        };

        this.categories.push(category);
        this.saveCategories();

        return category.id;
    }

    /**
     * Load bookmarks from localStorage
     * 
     * @method loadBookmarks
     * @returns {void}
     */
    loadBookmarks() {
        try {
            const stored = this.getStorageItem('bookmarks');
            if (stored) {
                this.bookmarks = JSON.parse(stored);
            }
        } catch (error) {
            console.warn('Failed to load bookmarks:', error);
            this.bookmarks = []; // Reset to empty array on error
        }
    }

    /**
     * Save bookmarks to localStorage
     * 
     * @method saveBookmarks
     * @returns {void}
     */
    saveBookmarks() {
        try {
            this.setStorageItem('bookmarks', JSON.stringify(this.bookmarks));
        } catch (error) {
            console.warn('Failed to save bookmarks:', error);
            // Fallback to memory storage already handled by setStorageItem
        }
    }

    /**
     * Load categories from localStorage
     * 
     * @method loadCategories
     * @returns {void}
     */
    loadCategories() {
        try {
            const stored = localStorage.getItem('bookmark-categories');
            if (stored) {
                this.categories = JSON.parse(stored);
            } else {
                // Default categories
                this.categories = [
                    { id: 'uncategorized', name: 'Uncategorized', color: '#ba944f' },
                    { id: 'planets', name: 'Planets', color: '#4ade80' },
                    { id: 'pages', name: 'Pages', color: '#60a5fa' },
                    { id: 'favorites', name: 'Favorites', color: '#f59e0b' }
                ];
                this.saveCategories();
            }
        } catch (error) {
            console.warn('Failed to load categories:', error);
        }
    }

    /**
     * Save categories to localStorage
     * 
     * @method saveCategories
     * @returns {void}
     */
    saveCategories() {
        try {
            this.setStorageItem('bookmark-categories', JSON.stringify(this.categories));
        } catch (error) {
            console.warn('Failed to save categories:', error);
            // Fallback to memory storage already handled by setStorageItem
        }
    }

    /**
     * Get item from storage with fallback mechanism
     * Tries localStorage -> sessionStorage -> memory
     * 
     * @method getStorageItem
     * @param {string} key - Storage key
     * @returns {string|null} - Stored value or null
     */
    getStorageItem(key) {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.warn('localStorage unavailable, trying sessionStorage');
            try {
                this.storageType = 'sessionStorage';
                return sessionStorage.getItem(key);
            } catch (e2) {
                console.warn('sessionStorage unavailable, using memory storage');
                this.storageType = 'memory';
                return this.memoryStorage[key] || null;
            }
        }
    }

    /**
     * Set item in storage with fallback mechanism
     * Tries localStorage -> sessionStorage -> memory
     * 
     * @method setStorageItem
     * @param {string} key - Storage key
     * @param {string} value - Value to store
     * @returns {boolean} - Success status
     */
    setStorageItem(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (e) {
            console.warn('localStorage unavailable, trying sessionStorage');
            try {
                this.storageType = 'sessionStorage';
                sessionStorage.setItem(key, value);
                return true;
            } catch (e2) {
                console.warn('sessionStorage unavailable, using memory storage');
                this.storageType = 'memory';
                this.memoryStorage[key] = value;
                return true;
            }
        }
    }

    /**
     * Export bookmarks
     * 
     * @method exportBookmarks
     * @returns {void}
     */
    exportBookmarks() {
        const data = {
            bookmarks: this.bookmarks,
            categories: this.categories,
            exportedAt: new Date().toISOString()
        };

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bookmarks-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Import bookmarks
     * 
     * @method importBookmarks
     * @param {File} file - JSON file
     * @returns {Promise<void>}
     */
    async importBookmarks(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);

            if (data.bookmarks) {
                this.bookmarks = data.bookmarks;
                this.saveBookmarks();
            }

            if (data.categories) {
                this.categories = data.categories;
                this.saveCategories();
            }

            console.log('✅ Bookmarks imported successfully');
        } catch (error) {
            console.error('Failed to import bookmarks:', error);
            throw error;
        }
    }

    trackEvent(eventName, data = {}) {
        if (window.performanceMonitoring && typeof window.performanceMonitoring.recordMetric === 'function') {
            try {
                window.performanceMonitoring.recordMetric(`bookmark:${eventName}`, 1, {
                    source: 'bookmark-manager',
                    ...data
                });
            } catch (e) {
                console.warn('Failed to record bookmark event:', e);
            }
        }
        if (window.analytics && window.analytics.track) {
            window.analytics.track('Bookmark Event', { event: eventName, ...data });
        }
    }
}

// Initialize globally
let bookmarkManagerInstance = null;

function initBookmarkManager() {
    if (!bookmarkManagerInstance) {
        bookmarkManagerInstance = new BookmarkManager();
    }
    return bookmarkManagerInstance;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBookmarkManager);
} else {
    initBookmarkManager();
}

// Export globally
window.BookmarkManager = BookmarkManager;
window.bookmarkManager = () => bookmarkManagerInstance;

