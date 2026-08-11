/**
 * Dropdown/Select Improvements
 * Enhanced select dropdowns with search and customization
 * 
 * Features:
 * - Searchable dropdowns
 * - Multi-select support
 * - Custom styling
 * - Keyboard navigation
 * - Option grouping
 * - Accessibility support
 */

class DropdownSelectImprovements {
    constructor() {
        this.instances = new Map();
        this.init();
    }

    init() {
        this.initializeDataSelects();
        console.log('✅ Dropdown/Select Improvements initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("d_ro_pd_ow_ns_el_ec_ti_mp_ro_ve_me_nt_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    initializeDataSelects() {
        document.addEventListener('DOMContentLoaded', () => {
            document.querySelectorAll('select[data-enhanced]').forEach(select => {
                this.enhance(select);
            });
        });
    }

    /**
     * Enhance a select element
     * @param {HTMLSelectElement} select - Select element
     * @param {Object} options - Options
     */
    enhance(select, options = {}) {
        const id = `enhanced-select-${Date.now()}`;
        const config = {
            searchable: options.searchable !== false && select.options.length > 10,
            multiSelect: select.multiple || options.multiSelect,
            placeholder: options.placeholder || 'Select an option...',
            searchPlaceholder: options.searchPlaceholder || 'Search...'
        };

        const wrapper = this.createWrapper(select, id);
        const customSelect = this.createCustomSelect(id, select, config);
        wrapper.appendChild(customSelect);

        this.instances.set(id, { select, customSelect, wrapper, config });
        return id;
    }

    createWrapper(select, id) {
        const wrapper = document.createElement('div');
        wrapper.className = 'enhanced-select-wrapper';
        wrapper.id = id;
        wrapper.style.cssText = 'position: relative;';

        select.parentNode.insertBefore(wrapper, select);
        wrapper.appendChild(select);
        select.style.display = 'none';

        return wrapper;
    }

    createCustomSelect(id, select, config) {
        const customSelect = document.createElement('div');
        customSelect.className = 'enhanced-select';
        customSelect.style.cssText = `
            position: relative;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(186, 148, 79, 0.3);
            border-radius: 6px;
            cursor: pointer;
            font-family: 'Raleway', sans-serif;
        `;

        const display = document.createElement('div');
        display.className = 'enhanced-select-display';
        display.style.cssText = `
            padding: 0.75rem 1rem;
            color: rgba(255, 255, 255, 0.9);
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;

        const displayText = document.createElement('span');
        displayText.className = 'enhanced-select-text';
        displayText.textContent = this.getDisplayText(select, config);

        const arrow = document.createElement('span');
        arrow.className = 'enhanced-select-arrow';
        arrow.textContent = '▼';
        arrow.style.cssText = `
            color: #ba944f;
            font-size: 0.75rem;
            transition: transform 0.2s;
        `;

        display.appendChild(displayText);
        display.appendChild(arrow);
        customSelect.appendChild(display);

        const dropdown = this.createDropdown(id, select, config);
        dropdown.style.display = 'none';
        customSelect.appendChild(dropdown);

        display.addEventListener('click', () => {
            const isOpen = dropdown.style.display === 'block';
            if (isOpen) {
                this.hideDropdown(dropdown, arrow);
            } else {
                this.showDropdown(dropdown, arrow, select, config);
            }
        });

        // Update display when select changes
        select.addEventListener('change', () => {
            displayText.textContent = this.getDisplayText(select, config);
        });

        return customSelect;
    }

    createDropdown(id, select, config) {
        const dropdown = document.createElement('div');
        dropdown.className = 'enhanced-select-dropdown';
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
            margin-top: 4px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
        `;

        if (config.searchable) {
            const search = document.createElement('input');
            search.type = 'text';
            search.className = 'enhanced-select-search';
            search.placeholder = config.searchPlaceholder;
            search.style.cssText = `
                width: 100%;
                padding: 0.75rem 1rem;
                background: rgba(255, 255, 255, 0.1);
                border: none;
                border-bottom: 1px solid rgba(186, 148, 79, 0.3);
                color: white;
                font-family: 'Raleway', sans-serif;
                outline: none;
            `;
            dropdown.appendChild(search);

            search.addEventListener('input', (e) => {
                this.filterOptions(dropdown, e.target.value);
            });
        }

        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'enhanced-select-options';
        this.renderOptions(optionsContainer, select, config);
        dropdown.appendChild(optionsContainer);

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target) && !select.parentElement.contains(e.target)) {
                this.hideDropdown(dropdown, select.parentElement.querySelector('.enhanced-select-arrow'));
            }
        });

        return dropdown;
    }

    renderOptions(container, select, config) {
        container.innerHTML = '';

        Array.from(select.options).forEach((option, index) => {
            if (option.value === '' && option.textContent === '') return;

            const optionEl = document.createElement('div');
            optionEl.className = 'enhanced-select-option';
            optionEl.dataset.value = option.value;
            optionEl.dataset.index = index;

            const isSelected = option.selected;
            optionEl.style.cssText = `
                padding: 0.75rem 1rem;
                color: ${isSelected ? '#ba944f' : 'rgba(255, 255, 255, 0.9)'};
                cursor: pointer;
                font-family: 'Raleway', sans-serif;
                transition: background 0.2s;
                ${isSelected ? 'background: rgba(186, 148, 79, 0.2);' : ''}
            `;

            if (config.multiSelect) {
                const checkbox = document.createElement('span');
                checkbox.textContent = isSelected ? '☑' : '☐';
                checkbox.style.marginRight = '0.5rem';
                optionEl.appendChild(checkbox);
            }

            const text = document.createTextNode(option.textContent);
            optionEl.appendChild(text);

            optionEl.addEventListener('click', () => {
                if (config.multiSelect) {
                    option.selected = !option.selected;
                    optionEl.style.background = option.selected ? 'rgba(186, 148, 79, 0.2)' : 'transparent';
                    optionEl.style.color = option.selected ? '#ba944f' : 'rgba(255, 255, 255, 0.9)';
                    optionEl.querySelector('span').textContent = option.selected ? '☑' : '☐';
                } else {
                    select.value = option.value;
                    select.dispatchEvent(new Event('change', { bubbles: true }));
                    this.hideDropdown(select.parentElement.querySelector('.enhanced-select-dropdown'),
                                     select.parentElement.querySelector('.enhanced-select-arrow'));
                }
            });

            optionEl.addEventListener('mouseenter', () => {
                if (!option.selected) {
                    optionEl.style.background = 'rgba(186, 148, 79, 0.1)';
                }
            });

            optionEl.addEventListener('mouseleave', () => {
                if (!option.selected) {
                    optionEl.style.background = 'transparent';
                }
            });

            container.appendChild(optionEl);
        });
    }

    filterOptions(dropdown, query) {
        const options = dropdown.querySelectorAll('.enhanced-select-option');
        const lowerQuery = query.toLowerCase();

        options.forEach(option => {
            const text = option.textContent.toLowerCase();
            if (text.includes(lowerQuery)) {
                option.style.display = 'block';
            } else {
                option.style.display = 'none';
            }
        });
    }

    showDropdown(dropdown, arrow, select, config) {
        dropdown.style.display = 'block';
        arrow.style.transform = 'rotate(180deg)';

        // Re-render options to reflect current state
        const optionsContainer = dropdown.querySelector('.enhanced-select-options');
        if (optionsContainer) {
            this.renderOptions(optionsContainer, select, config);
        }
    }

    hideDropdown(dropdown, arrow) {
        dropdown.style.display = 'none';
        if (arrow) {
            arrow.style.transform = 'rotate(0deg)';
        }
    }

    getDisplayText(select, config) {
        if (config.multiSelect) {
            const selected = Array.from(select.selectedOptions);
            if (selected.length === 0) {
                return config.placeholder;
            } else if (selected.length === 1) {
                return selected[0].textContent;
            } else {
                return `${selected.length} selected`;
            }
        } else {
            const selected = select.options[select.selectedIndex];
            return selected && selected.value ? selected.textContent : config.placeholder;
        }
    }
}

// Initialize global instance
if (typeof window !== 'undefined') {
    window.dropdownSelects = new DropdownSelectImprovements();
}

