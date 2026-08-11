/**
 * Bookmarking System with Folders
 * 
 * Implements comprehensive bookmarking system with folders.
 * 
 * @module BookmarkingSystemFolders
 * @version 1.0.0
 * @author Adriano To The Star
 */

class BookmarkingSystemFolders {
    constructor() {
        this.bookmarks = new Map();
        this.folders = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize bookmarking system
     * @public
     */
    init() {
        if (this.isInitialized) {
            console.warn('BookmarkingSystemFolders already initialized');
            return;
        }

        this.loadBookmarks();
        this.loadFolders();
        
        this.isInitialized = true;
        this.trackEvent('bookmarking_initialized');
    }

    /**
     * Add bookmark
     * @public
     * @param {string} url - Bookmark URL
     * @param {string} title - Bookmark title
     * @param {string} folderId - Folder ID (optional)
     * @returns {Object} Bookmark object
     */
    addBookmark(url, title, folderId = null) {
        const bookmark = {
            id: Date.now() + Math.random(),
            url,
            title: title || url,
            folderId,
            createdAt: new Date().toISOString(),
            tags: []
        };

        this.bookmarks.set(bookmark.id, bookmark);
        this.saveBookmarks();

        // Dispatch event
        window.dispatchEvent(new CustomEvent('bookmark-added', {
            detail: { bookmark }
        }));

        return bookmark;
    }

    /**
     * Remove bookmark
     * @public
     * @param {string} bookmarkId - Bookmark ID
     * @returns {boolean} True if removed
     */
    removeBookmark(bookmarkId) {
        const removed = this.bookmarks.delete(bookmarkId);
        if (removed) {
            this.saveBookmarks();
            window.dispatchEvent(new CustomEvent('bookmark-removed', {
                detail: { bookmarkId }
            }));
        }
        return removed;
    }

    /**
     * Get bookmark
     * @public
     * @param {string} bookmarkId - Bookmark ID
     * @returns {Object|null} Bookmark object
     */
    getBookmark(bookmarkId) {
        return this.bookmarks.get(bookmarkId) || null;
    }

    /**
     * Get all bookmarks
     * @public
     * @param {string} folderId - Folder ID (optional)
     * @returns {Array} Bookmarks array
     */
    getAllBookmarks(folderId = null) {
        const bookmarks = Array.from(this.bookmarks.values());
        if (folderId) {
            return bookmarks.filter(b => b.folderId === folderId);
        }
        return bookmarks;
    }

    /**
     * Create folder
     * @public
     * @param {string} name - Folder name
     * @param {string} parentId - Parent folder ID (optional)
     * @returns {Object} Folder object
     */
    createFolder(name, parentId = null) {
        const folder = {
            id: Date.now() + Math.random(),
            name,
            parentId,
            createdAt: new Date().toISOString()
        };

        this.folders.set(folder.id, folder);
        this.saveFolders();

        return folder;
    }

    /**
     * Remove folder
     * @public
     * @param {string} folderId - Folder ID
     * @param {boolean} moveBookmarks - Move bookmarks to parent (default: true)
     * @returns {boolean} True if removed
     */
    removeFolder(folderId, moveBookmarks = true) {
        const folder = this.folders.get(folderId);
        if (!folder) {
            return false;
        }

        // Move bookmarks to parent or root
        if (moveBookmarks) {
            const bookmarks = this.getAllBookmarks(folderId);
            bookmarks.forEach(bookmark => {
                bookmark.folderId = folder.parentId;
            });
        } else {
            // Remove bookmarks in folder
            const bookmarks = this.getAllBookmarks(folderId);
            bookmarks.forEach(bookmark => {
                this.removeBookmark(bookmark.id);
            });
        }

        this.folders.delete(folderId);
        this.saveFolders();

        return true;
    }

    /**
     * Get folder
     * @public
     * @param {string} folderId - Folder ID
     * @returns {Object|null} Folder object
     */
    getFolder(folderId) {
        return this.folders.get(folderId) || null;
    }

    /**
     * Get all folders
     * @public
     * @param {string} parentId - Parent folder ID (optional)
     * @returns {Array} Folders array
     */
    getAllFolders(parentId = null) {
        const folders = Array.from(this.folders.values());
        if (parentId) {
            return folders.filter(f => f.parentId === parentId);
        }
        return folders;
    }

    /**
     * Move bookmark to folder
     * @public
     * @param {string} bookmarkId - Bookmark ID
     * @param {string} folderId - Folder ID
     * @returns {boolean} True if moved
     */
    moveBookmark(bookmarkId, folderId) {
        const bookmark = this.bookmarks.get(bookmarkId);
        if (!bookmark) {
            return false;
        }

        bookmark.folderId = folderId;
        this.saveBookmarks();

        return true;
    }

    /**
     * Search bookmarks
     * @public
     * @param {string} query - Search query
     * @returns {Array} Matching bookmarks
     */
    searchBookmarks(query) {
        const queryLower = query.toLowerCase();
        return Array.from(this.bookmarks.values()).filter(bookmark => {
            return bookmark.title.toLowerCase().includes(queryLower) ||
                   bookmark.url.toLowerCase().includes(queryLower) ||
                   bookmark.tags.some(tag => tag.toLowerCase().includes(queryLower));
        });
    }

    /**
     * Save bookmarks
     * @private
     */
    saveBookmarks() {
        try {
            const bookmarks = Object.fromEntries(this.bookmarks);
            localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
        } catch (e) {
            console.warn('Failed to save bookmarks:', e);
        }
    }

    /**
     * Load bookmarks
     * @private
     */
    loadBookmarks() {
        try {
            const saved = localStorage.getItem('bookmarks');
            if (saved) {
                const bookmarks = JSON.parse(saved);
                Object.entries(bookmarks).forEach(([key, value]) => {
                    this.bookmarks.set(key, value);
                });
            }
        } catch (e) {
            console.warn('Failed to load bookmarks:', e);
        }
    }

    /**
     * Save folders
     * @private
     */
    saveFolders() {
        try {
            const folders = Object.fromEntries(this.folders);
            localStorage.setItem('bookmark-folders', JSON.stringify(folders));
        } catch (e) {
            console.warn('Failed to save folders:', e);
        }
    }

    /**
     * Load folders
     * @private
     */
    loadFolders() {
        try {
            const saved = localStorage.getItem('bookmark-folders');
            if (saved) {
                const folders = JSON.parse(saved);
                Object.entries(folders).forEach(([key, value]) => {
                    this.folders.set(key, value);
                });
            }
        } catch (e) {
            console.warn('Failed to load folders:', e);
        }
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`bookmarking_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Create global instance
window.BookmarkingSystemFolders = BookmarkingSystemFolders;
window.bookmarking = new BookmarkingSystemFolders();
window.bookmarking.init();

