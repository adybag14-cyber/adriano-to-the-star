/**
 * Autocomplete Components System
 * Advanced autocomplete/typeahead functionality
 * 
 * Features:
 * - Multiple data sources (array, API, function)
 * - Customizable templates
 * - Keyboard navigation
 * - Debounced input
 * - Highlighting matches
 * - Accessibility support
 */

class AutocompleteComponents {
    constructor() {
        this.instances = new Map();
        this.init();
    }

    init() {
        this.initializeDataAutocomplete();
        this.trackEvent('autocomplete_initialized');
    }

    initializeDataAutocomplete() {
        document.addEventListener('DOMContentLoaded', () => {
            document.querySelectorAll('[data-autocomplete]').forEach(element => {
                const source = element.getAttribute('data-autocomplete');
                const sourceType = element.getAttribute('data-autocomplete-type') || 'array';
                this.attach(element, { source, sourceType });
            });
        });
    }

    /**
     * Attach autocomplete to an input
     * @param {HTMLInputElement} input - Input element
     * @param {Object} options - Options
     */
    attach(input, options = {}) {
        const id = `autocomplete-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const config = {
            minLength: options.minLength || 2,
            debounce: options.debounce || 300,
            maxResults: options.maxResults || 10,
            highlight: options.highlight !== false,
            template: options.template,
            onSelect: options.onSelect,
            source: options.source,
            sourceType: options.sourceType || 'array'
        };

        const container = this.createContainer(id, input);
        const dropdown = this.createDropdown(id);
        container.appendChild(dropdown);

        let debounceTimer;
        let selectedIndex = -1;
        let results = [];

        input.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            const value = e.target.value.trim();

            if (value.length < config.minLength) {
                this.hideDropdown(dropdown);
                return;
            }

            debounceTimer = setTimeout(async () => {
                results = await this.fetchResults(value, config);
                this.displayResults(dropdown, results, value, config);
                selectedIndex = -1;
            }, config.debounce);
        });

        input.addEventListener('keydown', (e) => {
            if (!dropdown.classList.contains('autocomplete-visible')) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
                this.highlightItem(dropdown, selectedIndex);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, -1);
                this.highlightItem(dropdown, selectedIndex);
            } else if (e.key === 'Enter' && selectedIndex >= 0) {
                e.preventDefault();
                this.selectItem(input, results[selectedIndex], config);
                this.hideDropdown(dropdown);
            } else if (e.key === 'Escape') {
                this.hideDropdown(dropdown);
            }
        });

        input.addEventListener('blur', () => {
            setTimeout(() => this.hideDropdown(dropdown), 200);
        });

        this.instances.set(id, { input, dropdown, config });
        return id;
    }

    createContainer(id, input) {
        let container = input.parentElement;
        if (!container.classList.contains('autocomplete-container')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'autocomplete-container';
            wrapper.style.cssText = 'position: relative;';
            input.parentNode.insertBefore(wrapper, input);
            wrapper.appendChild(input);
            container = wrapper;
        }
        return container;
    }

    createDropdown(id) {
        const dropdown = document.createElement('div');
        dropdown.id = id;
        dropdown.className = 'autocomplete-dropdown';
        dropdown.setAttribute('role', 'listbox');
        dropdown.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: rgba(10, 10, 15, 0.98);
            border: 1px solid rgba(186, 148, 79, 0.3);
            border-radius: 6px;
            max-height: 300px;
            overflow-y: auto;
            z-index: 1000;
            display: none;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
            margin-top: 4px;
        `;
        return dropdown;
    }

    async fetchResults(query, config) {
        const { source, sourceType } = config;

        if (sourceType === 'array') {
            const data = typeof source === 'string' ? JSON.parse(source) : source;
            return this.filterArray(data, query, config);
        } else if (sourceType === 'api') {
            return await this.fetchFromAPI(source, query, config);
        } else if (sourceType === 'function') {
            const fn = typeof source === 'string' ? window[source] : source;
            return await fn(query, config);
        }

        return [];
    }

    filterArray(data, query, config) {
        const lowerQuery = query.toLowerCase();
        return data
            .filter(item => {
                const text = typeof item === 'string' ? item : (item.label || item.text || item.name || '');
                return text.toLowerCase().includes(lowerQuery);
            })
            .slice(0, config.maxResults);
    }

    async fetchFromAPI(url, query, config) {
        try {
            const response = await fetch(`${url}?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            return Array.isArray(data) ? data.slice(0, config.maxResults) : [];
        } catch (error) {
            console.error('Autocomplete API error:', error);
            return [];
        }
    }

    displayResults(dropdown, results, query, config) {
        if (results.length === 0) {
            dropdown.innerHTML = `
                <div class="autocomplete-no-results" style="
                    padding: 1rem;
                    text-align: center;
                    color: rgba(255, 255, 255, 0.5);
                    font-family: 'Raleway', sans-serif;
                ">No results found</div>
            `;
        } else {
            dropdown.innerHTML = results.map((item, index) => {
                const text = typeof item === 'string' ? item : (item.label || item.text || item.name || '');
                const highlighted = config.highlight ? this.highlightText(text, query) : text;
                return `
                    <div class="autocomplete-item" 
                         data-index="${index}"
                         role="option"
                         style="
                            padding: 0.75rem 1rem;
                            cursor: pointer;
                            color: rgba(255, 255, 255, 0.9);
                            font-family: 'Raleway', sans-serif;
                            transition: background 0.2s;
                         "
                         onmouseenter="this.style.background='rgba(186, 148, 79, 0.2)'"
                         onmouseleave="this.style.background='transparent'"
                         onclick="window.autocompleteComponents.selectItemByIndex('${dropdown.id}', ${index})">
                        ${highlighted}
                    </div>
                `;
            }).join('');
        }

        this.showDropdown(dropdown);
    }

    highlightText(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark style="background: rgba(186, 148, 79, 0.3); color: #ba944f;">$1</mark>');
    }

    highlightItem(dropdown, index) {
        const items = dropdown.querySelectorAll('.autocomplete-item');
        items.forEach((item, i) => {
            if (i === index) {
                item.style.background = 'rgba(186, 148, 79, 0.3)';
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.style.background = 'transparent';
            }
        });
    }

    selectItem(input, item, config) {
        const value = typeof item === 'string' ? item : (item.value || item.label || item.text || item.name || '');
        input.value = value;
        input.dispatchEvent(new Event('change', { bubbles: true }));
        
        if (config.onSelect) {
            config.onSelect(item, input);
        }
    }

    selectItemByIndex(dropdownId, index) {
        const instance = Array.from(this.instances.values()).find(inst => inst.dropdown.id === dropdownId);
        if (instance && instance.config) {
            const results = Array.from(instance.dropdown.querySelectorAll('.autocomplete-item'))
                .map(el => el.textContent);
            if (results[index]) {
                this.selectItem(instance.input, results[index], instance.config);
                this.hideDropdown(instance.dropdown);
            }
        }
    }

    showDropdown(dropdown) {
        dropdown.style.display = 'block';
        dropdown.classList.add('autocomplete-visible');
    }

    hideDropdown(dropdown) {
        dropdown.style.display = 'none';
        dropdown.classList.remove('autocomplete-visible');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`autocomplete_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Initialize global instance
if (typeof window !== 'undefined') {
    window.autocompleteComponents = new AutocompleteComponents();
}

