/**
 * Template System for Common Data Structures
 * Create and manage templates for data entry
 */
(function() {
    'use strict';

    class TemplateSystem {
        constructor() {
            this.templates = new Map();
            this.categories = new Map();
            this.init();
        }

        init() {
            this.loadTemplates();
            this.setupUI();
            this.registerDefaultTemplates();
        }

        setupUI() {
            if (!document.getElementById('template-system')) {
                const container = document.createElement('div');
                container.id = 'template-system';
                container.className = 'template-system';
                container.innerHTML = `
                    <div class="template-panel" id="template-panel" style="display: none;">
                        <div class="panel-header">
                            <h3>Templates</h3>
                            <button class="close-btn" id="template-close">×</button>
                        </div>
                        <div class="template-categories" id="template-categories"></div>
                        <div class="template-list" id="template-list"></div>
                        <button class="create-template-btn" id="create-template-btn">Create Template</button>
                    </div>
                `;
                document.body.appendChild(container);
        }
    }

        registerDefaultTemplates() {
            // Planet template
            this.createTemplate({
                id: 'planet',
                name: 'Planet',
                category: 'astronomy',
                fields: [
                    { name: 'name', type: 'text', label: 'Planet Name', required: true },
                    { name: 'kepid', type: 'number', label: 'KEPID', required: true },
                    { name: 'type', type: 'select', label: 'Type', options: ['Terrestrial', 'Gas Giant', 'Ice Giant'], required: true },
                    { name: 'radius', type: 'number', label: 'Radius (Earth radii)', required: false },
                    { name: 'mass', type: 'number', label: 'Mass (Earth masses)', required: false },
                    { name: 'distance', type: 'number', label: 'Distance (light years)', required: false },
                    { name: 'description', type: 'textarea', label: 'Description', required: false }
                ]
            });

            // User template
            this.createTemplate({
                id: 'user',
                name: 'User',
                category: 'system',
                fields: [
                    { name: 'name', type: 'text', label: 'Name', required: true },
                    { name: 'email', type: 'email', label: 'Email', required: true },
                    { name: 'role', type: 'select', label: 'Role', options: ['user', 'admin', 'moderator'], required: true },
                    { name: 'status', type: 'select', label: 'Status', options: ['active', 'inactive', 'suspended'], required: true }
                ]
            });

            // Event template
            this.createTemplate({
                id: 'event',
                name: 'Event',
                category: 'general',
                fields: [
                    { name: 'title', type: 'text', label: 'Title', required: true },
                    { name: 'date', type: 'date', label: 'Date', required: true },
                    { name: 'time', type: 'time', label: 'Time', required: false },
                    { name: 'location', type: 'text', label: 'Location', required: false },
                    { name: 'description', type: 'textarea', label: 'Description', required: false }
                ]
            });
        }

        createTemplate(config) {
            const template = {
                id: config.id,
                name: config.name,
                category: config.category || 'general',
                fields: config.fields || [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            this.templates.set(template.id, template);

            // Add to category
            if (!this.categories.has(template.category)) {
                this.categories.set(template.category, []);
            }
            this.categories.get(template.category).push(template.id);

            this.saveTemplates();
            return template;
        }

        getTemplate(id) {
            return this.templates.get(id);
        }

        getAllTemplates() {
            return Array.from(this.templates.values());
        }

        getTemplatesByCategory(category) {
            const templateIds = this.categories.get(category) || [];
            return templateIds.map(id => this.templates.get(id)).filter(Boolean);
        }

        updateTemplate(id, updates) {
            const template = this.templates.get(id);
            if (!template) return null;

            Object.assign(template, updates);
            template.updatedAt = new Date().toISOString();
            this.saveTemplates();
            return template;
        }

        deleteTemplate(id) {
            const template = this.templates.get(id);
            if (!template) return false;

            this.templates.delete(id);
            const categoryTemplates = this.categories.get(template.category);
            if (categoryTemplates) {
                const index = categoryTemplates.indexOf(id);
                if (index > -1) {
                    categoryTemplates.splice(index, 1);
                }
            }

            this.saveTemplates();
            return true;
        }

        renderForm(templateId, container) {
            const template = this.getTemplate(templateId);
            if (!template) {
                throw new Error(`Template ${templateId} not found`);
            }

            const form = document.createElement('form');
            form.className = 'template-form';
            form.dataset.templateId = templateId;

            template.fields.forEach(field => {
                const fieldEl = this.createFieldElement(field);
                form.appendChild(fieldEl);
            });

            const submitBtn = document.createElement('button');
            submitBtn.type = 'submit';
            submitBtn.className = 'btn-primary';
            submitBtn.textContent = 'Create';
            form.appendChild(submitBtn);

            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const data = this.extractFormData(form);
                this.handleFormSubmit(templateId, data);
            });

            if (container) {
                container.innerHTML = '';
                container.appendChild(form);
            }

            return form;
        }

        createFieldElement(field) {
            const wrapper = document.createElement('div');
            wrapper.className = 'form-field';

            const label = document.createElement('label');
            label.textContent = field.label;
            if (field.required) {
                label.innerHTML += ' <span class="required">*</span>';
            }
            wrapper.appendChild(label);

            let input;

            switch (field.type) {
                case 'text':
                case 'email':
                case 'number':
                case 'date':
                case 'time':
                    input = document.createElement('input');
                    input.type = field.type;
                    break;
                case 'textarea':
                    input = document.createElement('textarea');
                    break;
                case 'select':
                    input = document.createElement('select');
                    if (field.options) {
                        field.options.forEach(option => {
                            const optionEl = document.createElement('option');
                            optionEl.value = option;
                            optionEl.textContent = option;
                            input.appendChild(optionEl);
                        });
                    }
                    break;
                case 'checkbox':
                    input = document.createElement('input');
                    input.type = 'checkbox';
                    break;
                default:
                    input = document.createElement('input');
                    input.type = 'text';
            }

            input.name = field.name;
            input.id = `field-${field.name}`;
            if (field.required) {
                input.required = true;
            }
            if (field.placeholder) {
                input.placeholder = field.placeholder;
            }
            if (field.defaultValue !== undefined) {
                input.value = field.defaultValue;
            }

            wrapper.appendChild(input);
            return wrapper;
        }

        extractFormData(form) {
            const formData = new FormData(form);
            const data = {};

            for (const [key, value] of formData.entries()) {
                data[key] = value;
            }

            // Handle checkboxes
            form.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                data[checkbox.name] = checkbox.checked;
            });

            return data;
        }

        handleFormSubmit(templateId, data) {
            const event = new CustomEvent('templateFormSubmit', {
                detail: { templateId, data }
            });
            window.dispatchEvent(event);

            // Integrate with data source
            if (window.database?.createFromTemplate) {
                window.database.createFromTemplate(templateId, data);
            }
        }

        showTemplatePanel() {
            const panel = document.getElementById('template-panel');
            if (panel) {
                panel.style.display = 'block';
                this.renderTemplateList();
            }
        }

        hideTemplatePanel() {
            const panel = document.getElementById('template-panel');
            if (panel) {
                panel.style.display = 'none';
            }
        }

        renderTemplateList() {
            const list = document.getElementById('template-list');
            const categories = document.getElementById('template-categories');
            if (!list || !categories) return;

            // Render categories
            const categoryList = Array.from(this.categories.keys());
            categories.innerHTML = categoryList.map(cat => `
                <button class="category-btn" data-category="${cat}">${cat}</button>
            `).join('');

            categories.querySelectorAll('.category-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.filterByCategory(btn.dataset.category);
                });
            });

            // Render templates
            this.renderTemplates();
        }

        renderTemplates(category = null) {
            const list = document.getElementById('template-list');
            if (!list) return;

            const templates = category 
                ? this.getTemplatesByCategory(category)
                : this.getAllTemplates();

            list.innerHTML = templates.map(template => `
                <div class="template-item" data-template-id="${template.id}">
                    <div class="template-info">
                        <h4>${template.name}</h4>
                        <span class="template-category">${template.category}</span>
                        <span class="template-fields-count">${template.fields.length} fields</span>
                    </div>
                    <div class="template-actions">
                        <button class="use-template-btn" data-template-id="${template.id}">Use</button>
                        <button class="edit-template-btn" data-template-id="${template.id}">Edit</button>
                        <button class="delete-template-btn" data-template-id="${template.id}">Delete</button>
                    </div>
                </div>
            `).join('');

            // Add event listeners
            list.querySelectorAll('.use-template-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.useTemplate(btn.dataset.templateId);
                });
            });

            list.querySelectorAll('.edit-template-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.editTemplate(btn.dataset.templateId);
                });
            });

            list.querySelectorAll('.delete-template-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    if (confirm('Delete this template?')) {
                        this.deleteTemplate(btn.dataset.templateId);
                        this.renderTemplates();
                    }
                });
            });
        }

        filterByCategory(category) {
            this.renderTemplates(category);
        }

        useTemplate(templateId) {
            const template = this.getTemplate(templateId);
            if (!template) return;

            // Create modal with form
            const modal = document.createElement('div');
            modal.className = 'template-form-modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Create ${template.name}</h3>
                        <button class="close-btn">×</button>
                    </div>
                    <div class="modal-body" id="template-form-container"></div>
                </div>
            `;
            document.body.appendChild(modal);

            this.renderForm(templateId, document.getElementById('template-form-container'));

            modal.querySelector('.close-btn').addEventListener('click', () => {
                modal.remove();
            });
        }

        editTemplate(templateId) {
            // Show template editor
            const template = this.getTemplate(templateId);
            if (!template) return;

            const editor = document.createElement('div');
            editor.className = 'template-editor';
            editor.innerHTML = `
                <div class="editor-content">
                    <h3>Edit Template: ${template.name}</h3>
                    <div id="template-editor-form"></div>
                </div>
            `;
            document.body.appendChild(editor);

            // Render editor form (simplified)
            // In a full implementation, this would allow editing fields
        }

        saveTemplates() {
            const data = {
                templates: Array.from(this.templates.values()),
                categories: Object.fromEntries(this.categories)
            };
            localStorage.setItem('templates', JSON.stringify(data));
        }

        loadTemplates() {
            const stored = localStorage.getItem('templates');
            if (stored) {
                const data = JSON.parse(stored);
                data.templates.forEach(template => {
                    this.templates.set(template.id, template);
                });
                this.categories = new Map(Object.entries(data.categories || {}));
            }
        }
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.templateSystem = new TemplateSystem();
        });
    } else {
        window.templateSystem = new TemplateSystem();
    }
})();


