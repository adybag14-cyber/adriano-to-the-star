/**
 * Note-Taking Tools
 * @class NoteTakingTools
 * @description Provides note-taking functionality for courses.
 */
class NoteTakingTools {
    constructor() {
        this.notes = new Map();
        this.init();
    }

    init() {
        this.trackEvent('n_ot_et_ak_in_gt_oo_ls_initialized');
        this.loadNotes();
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("n_ot_et_ak_in_gt_oo_ls_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Create note.
     * @param {string} noteId - Note identifier.
     * @param {object} noteData - Note data.
     */
    createNote(noteId, noteData) {
        this.notes.set(noteId, {
            ...noteData,
            id: noteId,
            userId: noteData.userId,
            courseId: noteData.courseId,
            title: noteData.title,
            content: noteData.content,
            tags: noteData.tags || [],
            createdAt: new Date(),
            updatedAt: new Date()
        });
        this.saveNotes();
        console.log(`Note created: ${noteId}`);
    }

    /**
     * Update note.
     * @param {string} noteId - Note identifier.
     * @param {object} updates - Updates to apply.
     */
    updateNote(noteId, updates) {
        const note = this.notes.get(noteId);
        if (note) {
            Object.assign(note, updates);
            note.updatedAt = new Date();
            this.saveNotes();
            console.log(`Note updated: ${noteId}`);
        }
    }

    /**
     * Get user notes.
     * @param {string} userId - User identifier.
     * @param {string} courseId - Course identifier (optional).
     * @returns {Array<object>} User notes.
     */
    getUserNotes(userId, courseId = null) {
        let notes = Array.from(this.notes.values())
            .filter(note => note.userId === userId);

        if (courseId) {
            notes = notes.filter(note => note.courseId === courseId);
        }

        return notes.sort((a, b) => b.updatedAt - a.updatedAt);
    }

    saveNotes() {
        try {
            localStorage.setItem('notes', JSON.stringify(
                Object.fromEntries(this.notes)
            ));
        } catch (error) {
            console.error('Failed to save notes:', error);
        }
    }

    loadNotes() {
        try {
            const stored = localStorage.getItem('notes');
            if (stored) {
                this.notes = new Map(Object.entries(JSON.parse(stored)));
            }
        } catch (error) {
            console.error('Failed to load notes:', error);
        }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.noteTakingTools = new NoteTakingTools();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NoteTakingTools;
}

