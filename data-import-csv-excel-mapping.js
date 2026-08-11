/**
 * Data Import from CSV/Excel with Mapping Wizard
 * Import data from CSV/Excel files with field mapping
 */
(function () {
    'use strict';

    class DataImportMappingWizard {
        constructor() {
            this.fileData = null;
            this.headers = [];
            this.rows = [];
            this.mapping = {};
            this.init();
        }

        init() {
            this.setupUI();
            this.trackEvent('data_import_mapping_initialized');
        }

        setupUI() {
            if (!document.getElementById('import-wizard')) {
                const wizard = document.createElement('div');
                wizard.id = 'import-wizard';
                wizard.className = 'import-wizard';
                wizard.innerHTML = `
                    <div class="wizard-header">
                        <h2>Data Import Wizard</h2>
                        <button class="close-btn" id="wizard-close">×</button>
                    </div>
                    <div class="wizard-steps">
                        <div class="step active" data-step="1">
                            <span class="step-number">1</span>
                            <span class="step-label">Upload File</span>
                        </div>
                        <div class="step" data-step="2">
                            <span class="step-number">2</span>
                            <span class="step-label">Preview</span>
                        </div>
                        <div class="step" data-step="3">
                            <span class="step-number">3</span>
                            <span class="step-label">Map Fields</span>
                        </div>
                        <div class="step" data-step="4">
                            <span class="step-number">4</span>
                            <span class="step-label">Import</span>
                        </div>
                    </div>
                    <div class="wizard-content" id="wizard-content"></div>
                    <div class="wizard-actions">
                        <button class="btn-secondary" id="wizard-prev" disabled>Previous</button>
                        <button class="btn-primary" id="wizard-next">Next</button>
                    </div>
                `;
                document.body.appendChild(wizard);
            }

            this.setupEventListeners();
        }

        setupEventListeners() {
            document.getElementById('wizard-next')?.addEventListener('click', () => {
                this.nextStep();
            });

            document.getElementById('wizard-prev')?.addEventListener('click', () => {
                this.prevStep();
            });

            document.getElementById('wizard-close')?.addEventListener('click', () => {
                this.closeWizard();
            });
        }

        currentStep = 1;

        nextStep() {
            if (this.currentStep < 4) {
                this.currentStep++;
                this.renderStep();
            }
        }

        prevStep() {
            if (this.currentStep > 1) {
                this.currentStep--;
                this.renderStep();
            }
        }

        renderStep() {
            const content = document.getElementById('wizard-content');
            if (!content) return;

            // Update step indicators
            document.querySelectorAll('.step').forEach((step, i) => {
                step.classList.toggle('active', i + 1 === this.currentStep);
                step.classList.toggle('completed', i + 1 < this.currentStep);
            });

            // Update buttons
            document.getElementById('wizard-prev').disabled = this.currentStep === 1;
            document.getElementById('wizard-next').textContent =
                this.currentStep === 4 ? 'Import' : 'Next';

            // Render step content
            switch (this.currentStep) {
                case 1:
                    this.renderUploadStep(content);
                    break;
                case 2:
                    this.renderPreviewStep(content);
                    break;
                case 3:
                    this.renderMappingStep(content);
                    break;
                case 4:
                    this.renderImportStep(content);
                    break;
            }
        }

        renderUploadStep(container) {
            container.innerHTML = `
                <div class="upload-step">
                    <div class="file-dropzone" id="file-dropzone">
                        <div class="dropzone-content">
                            <div class="dropzone-icon">📁</div>
                            <div class="dropzone-text">Drop CSV or Excel file here</div>
                            <div class="dropzone-subtext">or click to browse</div>
                            <input type="file" id="file-input" accept=".csv,.xlsx,.xls" style="display: none;" />
                        </div>
                    </div>
                    <div class="file-info" id="file-info" style="display: none;"></div>
                </div>
            `;

            const dropzone = document.getElementById('file-dropzone');
            const fileInput = document.getElementById('file-input');

            dropzone.addEventListener('click', () => fileInput.click());
            dropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropzone.classList.add('dragover');
            });
            dropzone.addEventListener('dragleave', () => {
                dropzone.classList.remove('dragover');
            });
            dropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropzone.classList.remove('dragover');
                this.handleFile(e.dataTransfer.files[0]);
            });

            fileInput.addEventListener('change', (e) => {
                this.handleFile(e.target.files[0]);
            });
        }

        async handleFile(file) {
            if (!file) return;

            const fileInfo = document.getElementById('file-info');
            fileInfo.style.display = 'block';
            fileInfo.innerHTML = `<p>Processing ${file.name}...</p>`;

            try {
                if (file.name.endsWith('.csv')) {
                    await this.parseCSV(file);
                } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                    await this.parseExcel(file);
                } else {
                    throw new Error('Unsupported file type');
                }

                fileInfo.innerHTML = `
                    <p>✅ File loaded: ${file.name}</p>
                    <p>Rows: ${this.rows.length}</p>
                    <p>Columns: ${this.headers.length}</p>
                `;

                // Auto-advance to preview
                setTimeout(() => this.nextStep(), 1000);
            } catch (error) {
                fileInfo.innerHTML = `<p class="error">Error: ${error.message}</p>`;
            }
        }

        async parseCSV(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const text = e.target.result;
                    const lines = text.split('\n').filter(line => line.trim());

                    if (lines.length === 0) {
                        reject(new Error('File is empty'));
                        return;
                    }

                    // Parse headers
                    this.headers = this.parseCSVLine(lines[0]);

                    // Parse rows
                    this.rows = lines.slice(1).map(line => {
                        return this.parseCSVLine(line);
                    }).filter(row => row.length > 0);

                    resolve();
                };
                reader.onerror = reject;
                reader.readAsText(file);
            });
        }

        parseCSVLine(line) {
            const result = [];
            let current = '';
            let inQuotes = false;

            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    result.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            result.push(current.trim());
            return result;
        }

        async parseExcel(file) {
            // For Excel, we'd need a library like SheetJS
            // This is a simplified version
            if (window.XLSX) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const data = new Uint8Array(e.target.result);
                    const workbook = window.XLSX.read(data, { type: 'array' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const json = window.XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

                    if (json.length === 0) {
                        throw new Error('File is empty');
                    }

                    this.headers = json[0];
                    this.rows = json.slice(1);
                };
                reader.readAsArrayBuffer(file);
            } else {
                throw new Error('Excel support requires XLSX library. Please install sheetjs.');
            }
        }

        renderPreviewStep(container) {
            container.innerHTML = `
                <div class="preview-step">
                    <h3>Data Preview</h3>
                    <div class="preview-table-container">
                        <table class="preview-table">
                            <thead>
                                <tr>
                                    ${this.headers.map(h => `<th>${h}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${this.rows.slice(0, 10).map(row => `
                                    <tr>
                                        ${row.map(cell => `<td>${this.escapeHtml(cell)}</td>`).join('')}
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        ${this.rows.length > 10 ?
                    `<p class="preview-note">Showing first 10 of ${this.rows.length} rows</p>` :
                    ''}
                    </div>
                </div>
            `;
        }

        renderMappingStep(container) {
            // Get target fields (from database schema or user input)
            const targetFields = this.getTargetFields();

            container.innerHTML = `
                <div class="mapping-step">
                    <h3>Map Fields</h3>
                    <p>Match source columns to target fields</p>
                    <div class="mapping-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Source Column</th>
                                    <th>Sample Data</th>
                                    <th>Target Field</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.headers.map((header, i) => {
                const sample = this.rows[0] ? this.rows[0][i] : '';
                const suggestions = this.suggestMapping(header, targetFields);
                return `
                                        <tr>
                                            <td>${this.escapeHtml(header)}</td>
                                            <td class="sample-data">${this.escapeHtml(sample)}</td>
                                            <td>
                                                <select class="field-mapping" data-source="${this.escapeHtml(header)}">
                                                    <option value="">-- Skip --</option>
                                                    ${targetFields.map(field => `
                                                        <option value="${field}" 
                                                                ${suggestions.includes(field) ? 'selected' : ''}>
                                                            ${field}
                                                        </option>
                                                    `).join('')}
                                                </select>
                                            </td>
                                        </tr>
                                    `;
            }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

            // Store mappings
            container.querySelectorAll('.field-mapping').forEach(select => {
                select.addEventListener('change', () => {
                    this.mapping[select.dataset.source] = select.value;
                });
            });
        }

        getTargetFields() {
            // Try to get from database schema
            if (window.database?.getSchema) {
                return window.database.getSchema();
            }

            // Default fields
            return ['name', 'email', 'date', 'value', 'category', 'description'];
        }

        suggestMapping(sourceHeader, targetFields) {
            const lower = sourceHeader.toLowerCase();
            return targetFields.filter(field => {
                const fieldLower = field.toLowerCase();
                return lower.includes(fieldLower) || fieldLower.includes(lower);
            });
        }

        renderImportStep(container) {
            container.innerHTML = `
                <div class="import-step">
                    <h3>Ready to Import</h3>
                    <div class="import-summary">
                        <p><strong>Rows to import:</strong> ${this.rows.length}</p>
                        <p><strong>Fields mapped:</strong> ${Object.keys(this.mapping).filter(k => this.mapping[k]).length}</p>
                    </div>
                    <div class="import-options">
                        <label>
                            <input type="checkbox" id="skip-duplicates" />
                            Skip duplicate records
                        </label>
                        <label>
                            <input type="checkbox" id="validate-data" checked />
                            Validate data before import
                        </label>
                    </div>
                </div>
            `;
        }

        async performImport() {
            const skipDuplicates = document.getElementById('skip-duplicates')?.checked;
            const validateData = document.getElementById('validate-data')?.checked;

            const mappedData = this.rows.map(row => {
                const record = {};
                this.headers.forEach((header, i) => {
                    const targetField = this.mapping[header];
                    if (targetField) {
                        record[targetField] = row[i];
                    }
                });
                return record;
            });

            if (validateData) {
                const errors = this.validateData(mappedData);
                if (errors.length > 0) {
                    alert(`Validation errors found:\n${errors.join('\n')}`);
                    return;
                }
            }

            // Import to database
            if (window.database?.import) {
                await window.database.import(mappedData, { skipDuplicates });
            } else {
                console.log('Import data:', mappedData);
            }

            alert(`Successfully imported ${mappedData.length} records!`);
            this.closeWizard();
        }

        validateData(data) {
            const errors = [];
            data.forEach((record, index) => {
                Object.keys(record).forEach(field => {
                    if (!record[field] && field.required) {
                        errors.push(`Row ${index + 1}: ${field} is required`);
                    }
                });
            });
            return errors;
        }

        closeWizard() {
            document.getElementById('import-wizard').style.display = 'none';
            this.currentStep = 1;
            this.fileData = null;
            this.headers = [];
            this.rows = [];
            this.mapping = {};
        }

        show() {
            document.getElementById('import-wizard').style.display = 'block';
            this.currentStep = 1;
            this.renderStep();
        }

        trackEvent(eventName, data = {}) {
            try {
                if (window.performanceMonitoring) {
                    window.performanceMonitoring.recordMetric(`data_import_mapping_${eventName}`, 1, data);
                }
            } catch (e) { /* Silent fail */ }
        }

        escapeHtml(text) {
            if (text === null || text === undefined) return '';
            return String(text)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.dataImportWizard = new DataImportMappingWizard();
        });
    } else {
        window.dataImportWizard = new DataImportMappingWizard();
    }
})();


