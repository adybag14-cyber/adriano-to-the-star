/**
 * Quick Notes System
 * 
 * Allows users to take quick notes while browsing, with auto-save,
 * categories, and search functionality.
 * 
 * @class QuickNotes
 * @example
 * // Auto-initializes on page load
 * // Access via: window.quickNotes()
 * 
 * // Add note
 * const notes = window.quickNotes();
 * notes.addNote('Interesting planet discovery', {
 *   content: 'Kepler-22b might be habitable',
 *   category: 'research'
 * });
 */
class QuickNotes {
    constructor() {
        this.notes = [];
        this.categories = [];
        this.currentNote = null;
        this.init();
    }

    init() {
        // Load notes and categories
        this.loadNotes();
        this.loadCategories();
        
        // Create quick note button
        this.createQuickNoteButton();
        
        console.log('✅ Quick Notes initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("q_ui_ck_no_te_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Create quick note button
     * 
     * @method createQuickNoteButton
     * @returns {void}
     */
    createQuickNoteButton() {
        // Check if button already exists
        if (document.getElementById('quick-note-btn')) return;

        const button = document.createElement('button');
        button.id = 'quick-note-btn';
        button.className = 'quick-note-btn';
        button.setAttribute('aria-label', 'Quick Note');
        button.innerHTML = '📝';
        button.title = 'Quick Note';
        
        button.addEventListener('click', () => this.showNotePanel());
        
        document.body.appendChild(button);
    }

    /**
     * Show note panel
     * 
     * @method showNotePanel
     * @returns {void}
     */
    showNotePanel() {
        // Check if panel already exists
        let panel = document.getElementById('quick-note-panel');
        if (panel) {
            panel.classList.add('open');
            return;
        }

        // Create panel
        panel = document.createElement('div');
        panel.id = 'quick-note-panel';
        panel.className = 'quick-note-panel';
        panel.innerHTML = `
            <div class="quick-note-header">
                <h3>📝 Quick Notes</h3>
                <button class="quick-note-close" aria-label="Close">×</button>
            </div>
            <div class="quick-note-content">
                <div class="quick-note-form">
                    <input type="text" id="note-title" class="note-input" placeholder="Note title...">
                    <textarea id="note-content" class="note-textarea" placeholder="Write your note here..."></textarea>
                    <select id="note-category" class="note-select">
                        <option value="">Select category...</option>
                    </select>
                    <div class="note-actions">
                        <button class="note-btn note-save">💾 Save</button>
                        <button class="note-btn note-new">➕ New</button>
                        <button class="note-btn note-delete">🗑️ Delete</button>
                    </div>
                </div>
                <div class="quick-note-list">
                    <h4>Your Notes</h4>
                    <div id="notes-list"></div>
                </div>
            </div>
        `;

        document.body.appendChild(panel);

        // Setup event listeners
        const closeBtn = panel.querySelector('.quick-note-close');
        const saveBtn = panel.querySelector('.note-save');
        const newBtn = panel.querySelector('.note-new');
        const deleteBtn = panel.querySelector('.note-delete');
        const titleInput = panel.querySelector('#note-title');
        const contentInput = panel.querySelector('#note-content');
        const categorySelect = panel.querySelector('#note-category');

        closeBtn.addEventListener('click', () => this.hideNotePanel());
        saveBtn.addEventListener('click', () => this.saveCurrentNote());
        newBtn.addEventListener('click', () => this.createNewNote());
        deleteBtn.addEventListener('click', () => this.deleteCurrentNote());

        // Auto-save on input
        titleInput.addEventListener('input', () => this.autoSave());
        contentInput.addEventListener('input', () => this.autoSave());

        // Populate categories
        this.populateCategories(categorySelect);

        // Load notes list
        this.renderNotesList();

        // Show panel
        setTimeout(() => panel.classList.add('open'), 10);
    }

    /**
     * Hide note panel
     * 
     * @method hideNotePanel
     * @returns {void}
     */
    hideNotePanel() {
        const panel = document.getElementById('quick-note-panel');
        if (panel) {
            panel.classList.remove('open');
            // Save before closing
            this.saveCurrentNote();
        }
    }

    /**
     * Create new note
     * 
     * @method createNewNote
     * @returns {void}
     */
    createNewNote() {
        this.currentNote = null;
        const titleInput = document.getElementById('note-title');
        const contentInput = document.getElementById('note-content');
        const categorySelect = document.getElementById('note-category');

        if (titleInput) titleInput.value = '';
        if (contentInput) contentInput.value = '';
        if (categorySelect) categorySelect.value = '';
    }

    /**
     * Save current note
     * 
     * @method saveCurrentNote
     * @returns {void}
     */
    saveCurrentNote() {
        const titleInput = document.getElementById('note-title');
        const contentInput = document.getElementById('note-content');
        const categorySelect = document.getElementById('note-category');

        if (!titleInput || !contentInput) return;

        const title = titleInput.value.trim();
        const content = contentInput.value.trim();
        const category = categorySelect ? categorySelect.value : '';

        if (!title && !content) return; // Don't save empty notes

        if (this.currentNote) {
            // Update existing note
            this.currentNote.title = title || 'Untitled';
            this.currentNote.content = content;
            this.currentNote.category = category;
            this.currentNote.updatedAt = new Date().toISOString();
        } else {
            // Create new note
            const note = {
                id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
                title: title || 'Untitled',
                content,
                category,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.notes.push(note);
            this.currentNote = note;
        }

        this.saveNotes();
        this.renderNotesList();
    }

    /**
     * Delete current note
     * 
     * @method deleteCurrentNote
     * @returns {void}
     */
    deleteCurrentNote() {
        if (!this.currentNote) return;

        if (confirm('Are you sure you want to delete this note?')) {
            const index = this.notes.findIndex(n => n.id === this.currentNote.id);
            if (index > -1) {
                this.notes.splice(index, 1);
                this.currentNote = null;
                this.saveNotes();
                this.createNewNote();
                this.renderNotesList();
            }
        }
    }

    /**
     * Auto-save note
     * 
     * @method autoSave
     * @returns {void}
     */
    autoSave() {
        // Debounce auto-save
        clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = setTimeout(() => {
            this.saveCurrentNote();
        }, 2000); // Save after 2 seconds of inactivity
    }

    /**
     * Add note
     * 
     * @method addNote
     * @param {string} title - Note title
     * @param {Object} options - Note options
     * @returns {string} Note ID
     */
    addNote(title, options = {}) {
        const note = {
            id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            title,
            content: options.content || '',
            category: options.category || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.notes.push(note);
        this.saveNotes();

        return note.id;
    }

    /**
     * Load note for editing
     * 
     * @method loadNote
     * @param {string} id - Note ID
     * @returns {void}
     */
    loadNote(id) {
        const note = this.notes.find(n => n.id === id);
        if (!note) return;

        this.currentNote = note;
        const titleInput = document.getElementById('note-title');
        const contentInput = document.getElementById('note-content');
        const categorySelect = document.getElementById('note-category');

        if (titleInput) titleInput.value = note.title;
        if (contentInput) contentInput.value = note.content;
        if (categorySelect) categorySelect.value = note.category || '';
    }

    /**
     * Render notes list
     * 
     * @method renderNotesList
     * @returns {void}
     */
    renderNotesList() {
        const listContainer = document.getElementById('notes-list');
        if (!listContainer) return;

        if (this.notes.length === 0) {
            listContainer.innerHTML = '<p style="color: rgba(255,255,255,0.5); text-align: center; padding: 2rem;">No notes yet. Create your first note!</p>';
            return;
        }

        listContainer.innerHTML = this.notes
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            .map(note => `
                <div class="note-item" data-note-id="${note.id}">
                    <div class="note-item-header">
                        <h5 class="note-item-title">${note.title}</h5>
                        <span class="note-item-date">${new Date(note.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <p class="note-item-preview">${note.content.substring(0, 100)}${note.content.length > 100 ? '...' : ''}</p>
                    ${note.category ? `<span class="note-item-category">${note.category}</span>` : ''}
                </div>
            `).join('');

        // Add click handlers
        listContainer.querySelectorAll('.note-item').forEach(item => {
            item.addEventListener('click', () => {
                this.loadNote(item.dataset.noteId);
            });
        });
    }

    /**
     * Populate categories dropdown
     * 
     * @method populateCategories
     * @param {HTMLElement} select - Select element
     * @returns {void}
     */
    populateCategories(select) {
        if (!select) return;

        // Default categories
        const defaultCategories = ['research', 'ideas', 'todo', 'important', 'reference'];
        const allCategories = [...new Set([...defaultCategories, ...this.categories])];

        select.innerHTML = '<option value="">Select category...</option>' +
            allCategories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    }

    /**
     * Load notes from localStorage
     * 
     * @method loadNotes
     * @returns {void}
     */
    loadNotes() {
        try {
            const stored = localStorage.getItem('quick-notes');
            if (stored) {
                this.notes = JSON.parse(stored);
            }
        } catch (error) {
            console.warn('Failed to load notes:', error);
        }
    }

    /**
     * Save notes to localStorage
     * 
     * @method saveNotes
     * @returns {void}
     */
    saveNotes() {
        try {
            localStorage.setItem('quick-notes', JSON.stringify(this.notes));
        } catch (error) {
            console.warn('Failed to save notes:', error);
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
            const stored = localStorage.getItem('note-categories');
            if (stored) {
                this.categories = JSON.parse(stored);
            }
        } catch (error) {
            console.warn('Failed to load categories:', error);
        }
    }

    /**
     * Get notes
     * 
     * @method getNotes
     * @param {Object} [filters] - Filter options
     * @returns {Array} Array of notes
     */
    getNotes(filters = {}) {
        let result = [...this.notes];

        if (filters.category) {
            result = result.filter(n => n.category === filters.category);
        }

        if (filters.search) {
            const search = filters.search.toLowerCase();
            result = result.filter(n =>
                n.title.toLowerCase().includes(search) ||
                n.content.toLowerCase().includes(search)
            );
        }

        return result;
    }
}

// Initialize globally
let quickNotesInstance = null;

function initQuickNotes() {
    if (!quickNotesInstance) {
        quickNotesInstance = new QuickNotes();
    }
    return quickNotesInstance;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initQuickNotes);
} else {
    initQuickNotes();
}

// Export globally
window.QuickNotes = QuickNotes;
window.quickNotes = () => quickNotesInstance;

