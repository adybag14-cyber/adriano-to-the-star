/**
 * Custom Field Types (Rich Text, File Attachments, Formulas)
 * Support for advanced field types
 */
(function () {
    'use strict';

    class CustomFieldTypes {
        constructor() {
            this.init();
        }

        init() {
            this.setupUI();
            this.trackEvent('custom_field_types_initialized');
        }

        setupUI() {
            // Rich text editor
            if (window.Quill) {
                this.setupRichTextEditor();
            }

            // File attachment handler
            this.setupFileAttachment();

            // Formula calculator
            this.setupFormulaField();
        }

        setupRichTextEditor() {
            document.querySelectorAll('[data-field-type="richtext"]').forEach(element => {
                new window.Quill(element, {
                    theme: 'snow'
                });
            });
        }

        setupFileAttachment() {
            document.querySelectorAll('[data-field-type="file"]').forEach(element => {
                const input = document.createElement('input');
                input.type = 'file';
                input.multiple = true;
                input.addEventListener('change', (e) => {
                    this.handleFileAttachment(element, e.target.files);
                });
                element.appendChild(input);
            });
        }

        handleFileAttachment(element, files) {
            Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const attachment = {
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        data: e.target.result
                    };
                    this.displayAttachment(element, attachment);
                };
                reader.readAsDataURL(file);
            });
        }

        displayAttachment(element, attachment) {
            const div = document.createElement('div');
            div.className = 'attachment-item';
            div.innerHTML = `
                <span>${attachment.name}</span>
                <button class="remove-attachment">×</button>
            `;
            element.appendChild(div);
        }

        setupFormulaField() {
            document.querySelectorAll('[data-field-type="formula"]').forEach(element => {
                const input = element.querySelector('input');
                if (input) {
                    input.addEventListener('change', () => {
                        const result = this.evaluateFormula(input.value);
                        element.querySelector('.formula-result').textContent = result;
                    });
                }
            });
        }

        evaluateFormula(formula) {
            try {
                // eslint-disable-next-line no-new-func
                return Function('"use strict"; return (' + formula + ')')();
            } catch (error) {
                return 'Error';
            }
        }

        trackEvent(eventName, data = {}) {
            try {
                if (window.performanceMonitoring) {
                    window.performanceMonitoring.recordMetric(`custom_field_types_${eventName}`, 1, data);
                }
            } catch (e) { /* Silent fail */ }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.customFieldTypes = new CustomFieldTypes();
        });
    } else {
        window.customFieldTypes = new CustomFieldTypes();
    }
})();


