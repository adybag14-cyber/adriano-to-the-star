/**
 * Tag System with Autocomplete
 * 
 * Adds comprehensive tag system with autocomplete.
 * 
 * @module TagSystemAutocomplete
 * @version 1.0.0
 * @author Adriano To The Star
 */

class TagSystemAutocomplete {
    constructor() {
        this.tags = new Map();
        this.tagUsage = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize tag system
     * @public
     */
    init() {
        if (this.isInitialized) {
            console.warn('TagSystemAutocomplete already initialized');
            return;
        }

        this.loadTags();
        
        this.isInitialized = true;
        console.log('✅ Tag System initialized');
    }

    /**
     * Add tag
     * @public
     * @param {string} tag - Tag name
     * @param {Object} metadata - Tag metadata
     * @returns {Object} Tag object
     */
    addTag(tag, metadata = {}) {
        const tagLower = tag.toLowerCase();
        
        if (!this.tags.has(tagLower)) {
            this.tags.set(tagLower, {
                name: tag,
                count: 0,
                createdAt: new Date().toISOString(),
                ...metadata
            });
        }

        const tagObj = this.tags.get(tagLower);
        tagObj.count++;
        this.saveTags();

        return tagObj;
    }

    /**
     * Remove tag
     * @public
     * @param {string} tag - Tag name
     * @returns {boolean} True if removed
     */
    removeTag(tag) {
        const tagLower = tag.toLowerCase();
        const tagObj = this.tags.get(tagLower);
        
        if (tagObj && tagObj.count > 0) {
            tagObj.count--;
            if (tagObj.count === 0) {
                this.tags.delete(tagLower);
            }
            this.saveTags();
            return true;
        }

        return false;
    }

    /**
     * Get tag
     * @public
     * @param {string} tag - Tag name
     * @returns {Object|null} Tag object
     */
    getTag(tag) {
        return this.tags.get(tag.toLowerCase()) || null;
    }

    /**
     * Get all tags
     * @public
     * @param {Object} options - Options
     * @returns {Array} Tags array
     */
    getAllTags(options = {}) {
        const { sortBy = 'count', order = 'desc', limit = null } = options;
        
        let tags = Array.from(this.tags.values());

        // Sort
        tags.sort((a, b) => {
            const aValue = a[sortBy];
            const bValue = b[sortBy];
            const comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
            return order === 'desc' ? -comparison : comparison;
        });

        // Limit
        if (limit) {
            tags = tags.slice(0, limit);
        }

        return tags;
    }

    /**
     * Autocomplete tags
     * @public
     * @param {string} query - Query string
     * @param {number} limit - Result limit
     * @returns {Array} Matching tags
     */
    autocomplete(query, limit = 10) {
        if (!query || query.length === 0) {
            return this.getAllTags({ sortBy: 'count', order: 'desc', limit });
        }

        const queryLower = query.toLowerCase();
        const matches = [];

        this.tags.forEach((tag, key) => {
            if (key.includes(queryLower) || tag.name.toLowerCase().includes(queryLower)) {
                matches.push(tag);
            }
        });

        // Sort by relevance (exact match first, then by count)
        matches.sort((a, b) => {
            const aExact = a.name.toLowerCase() === queryLower;
            const bExact = b.name.toLowerCase() === queryLower;
            
            if (aExact && !bExact) return -1;
            if (!aExact && bExact) return 1;
            
            return b.count - a.count;
        });

        return matches.slice(0, limit);
    }

    /**
     * Create tag input with autocomplete
     * @public
     * @param {HTMLElement} container - Container element
     * @param {Function} onTagsChange - Callback function
     * @returns {HTMLElement} Tag input element
     */
    createTagInput(container, onTagsChange = null) {
        const wrapper = document.createElement('div');
        wrapper.className = 'tag-input-wrapper';
        wrapper.innerHTML = `
            <div class="tag-input-container">
                <div class="tag-list"></div>
                <input type="text" class="tag-input" placeholder="Add tags...">
                <div class="tag-autocomplete" style="display: none;"></div>
            </div>
        `;

        const tagInput = wrapper.querySelector('.tag-input');
        const tagList = wrapper.querySelector('.tag-list');
        const autocomplete = wrapper.querySelector('.tag-autocomplete');
        const selectedTags = new Set();

        // Input event
        tagInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            if (query.length > 0) {
                const suggestions = this.autocomplete(query, 5);
                this.showAutocomplete(autocomplete, suggestions, (tag) => {
                    this.addTagToInput(tag.name, selectedTags, tagList, tagInput);
                    autocomplete.style.display = 'none';
                    tagInput.value = '';
                    if (onTagsChange) {
                        onTagsChange(Array.from(selectedTags));
                    }
                });
            } else {
                autocomplete.style.display = 'none';
            }
        });

        // Key events
        tagInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && tagInput.value.trim()) {
                e.preventDefault();
                const tagName = tagInput.value.trim();
                this.addTagToInput(tagName, selectedTags, tagList, tagInput);
                this.addTag(tagName);
                tagInput.value = '';
                autocomplete.style.display = 'none';
                if (onTagsChange) {
                    onTagsChange(Array.from(selectedTags));
                }
            } else if (e.key === 'Backspace' && tagInput.value === '' && selectedTags.size > 0) {
                const lastTag = Array.from(selectedTags).pop();
                this.removeTagFromInput(lastTag, selectedTags, tagList);
                if (onTagsChange) {
                    onTagsChange(Array.from(selectedTags));
                }
            }
        });

        // Click outside to close autocomplete
        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) {
                autocomplete.style.display = 'none';
            }
        });

        container.appendChild(wrapper);
        return wrapper;
    }

    /**
     * Add tag to input
     * @private
     * @param {string} tagName - Tag name
     * @param {Set} selectedTags - Selected tags set
     * @param {HTMLElement} tagList - Tag list element
     * @param {HTMLElement} tagInput - Tag input element
     */
    addTagToInput(tagName, selectedTags, tagList, tagInput) {
        if (selectedTags.has(tagName)) {
            return;
        }

        selectedTags.add(tagName);
        const tagElement = document.createElement('span');
        tagElement.className = 'tag-item';
        tagElement.innerHTML = `
            ${tagName}
            <button class="tag-remove">&times;</button>
        `;

        tagElement.querySelector('.tag-remove').addEventListener('click', () => {
            this.removeTagFromInput(tagName, selectedTags, tagList);
        });

        tagList.appendChild(tagElement);
    }

    /**
     * Remove tag from input
     * @private
     * @param {string} tagName - Tag name
     * @param {Set} selectedTags - Selected tags set
     * @param {HTMLElement} tagList - Tag list element
     */
    removeTagFromInput(tagName, selectedTags, tagList) {
        selectedTags.delete(tagName);
        const tagElement = Array.from(tagList.children).find(el => 
            el.textContent.trim().startsWith(tagName)
        );
        if (tagElement) {
            tagElement.remove();
        }
    }

    /**
     * Show autocomplete
     * @private
     * @param {HTMLElement} autocomplete - Autocomplete element
     * @param {Array} suggestions - Suggestions array
     * @param {Function} onSelect - Selection callback
     */
    showAutocomplete(autocomplete, suggestions, onSelect) {
        if (suggestions.length === 0) {
            autocomplete.style.display = 'none';
            return;
        }

        autocomplete.innerHTML = suggestions.map(tag => `
            <div class="autocomplete-item" data-tag="${tag.name}">
                ${tag.name} <span class="tag-count">(${tag.count})</span>
            </div>
        `).join('');

        autocomplete.style.display = 'block';

        autocomplete.querySelectorAll('.autocomplete-item').forEach(item => {
            item.addEventListener('click', () => {
                onSelect(this.tags.get(item.dataset.tag.toLowerCase()));
            });
        });
    }

    /**
     * Save tags
     * @private
     */
    saveTags() {
        try {
            const tags = Object.fromEntries(this.tags);
            localStorage.setItem('tags', JSON.stringify(tags));
        } catch (e) {
            console.warn('Failed to save tags:', e);
        }
    }

    /**
     * Load tags
     * @private
     */
    loadTags() {
        try {
            const saved = localStorage.getItem('tags');
            if (saved) {
                const tags = JSON.parse(saved);
                Object.entries(tags).forEach(([key, value]) => {
                    this.tags.set(key, value);
                });
            }
        } catch (e) {
            console.warn('Failed to load tags:', e);
        }
    }
}

// Create global instance
window.TagSystemAutocomplete = TagSystemAutocomplete;
window.tagSystem = new TagSystemAutocomplete();
window.tagSystem.init();

