/**
 * Workflow Automation System (If-Then Rules)
 * Create automation rules with conditions and actions
 * 
 * SECURITY WARNING:
 * This system allows arbitrary code execution via 'runScript'.
 * It MUST be restricted to ADMIN USERS only.
 * Do not expose this UI to untrusted users.
 */
(function () {
    'use strict';

    class WorkflowAutomationSystem {
        constructor() {
            this.rules = [];
            this.ruleEngine = null;
            this.init();
        }

        init() {
            this.loadRules();
            this.setupUI();
            this.startRuleEngine();
        }

        setupUI() {
            if (!document.getElementById('workflow-automation-panel')) {
                const panel = document.createElement('div');
                panel.id = 'workflow-automation-panel';
                panel.className = 'workflow-automation-panel';
                panel.innerHTML = `
                    <div class="panel-header">
                        <h3>Workflow Automation</h3>
                        <button class="create-rule-btn" id="create-rule-btn">Create Rule</button>
                    </div>
                    <div class="rules-list" id="rules-list"></div>
                `;
                document.body.appendChild(panel);
            }
        }

        startRuleEngine() {
            const TRIGGER_TIME_BASED = 'timeBased';
            // Listen for events that might trigger rules
            window.addEventListener('dataChanged', (e) => {
                this.evaluateRules('dataChanged', e.detail);
            });

            window.addEventListener('userAction', (e) => {
                this.evaluateRules('userAction', e.detail);
            });

            window.addEventListener(TRIGGER_TIME_BASED, () => {
                this.evaluateRules(TRIGGER_TIME_BASED, {});
            });

            // Time-based rules (check every minute)
            setInterval(() => {
                this.evaluateRules(TRIGGER_TIME_BASED, {});
            }, 60000);
        }

        createRule(config) {
            const rule = {
                id: this.generateRuleId(),
                name: config.name || 'Untitled Rule',
                enabled: config.enabled !== false,
                conditions: config.conditions || [],
                actions: config.actions || [],
                trigger: config.trigger || 'manual',
                createdAt: new Date().toISOString(),
                lastExecuted: null,
                executionCount: 0
            };

            this.rules.push(rule);
            this.saveRules();
            this.renderRules();
            return rule;
        }

        generateRuleId() {
            return 'rule_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        evaluateRules(trigger, context) {
            const applicableRules = this.rules.filter(rule =>
                rule.enabled &&
                (rule.trigger === trigger || rule.trigger === 'always')
            );

            applicableRules.forEach(rule => {
                if (this.evaluateConditions(rule.conditions, context)) {
                    this.executeActions(rule.actions, context);
                    rule.lastExecuted = new Date().toISOString();
                    rule.executionCount++;
                    this.saveRules();
                }
            });
        }

        evaluateConditions(conditions, context) {
            if (conditions.length === 0) return true;

            // Support AND logic (all conditions must be true)
            return conditions.every(condition => {
                return this.evaluateCondition(condition, context);
            });
        }

        evaluateCondition(condition, context) {
            const { field, operator, value } = condition;
            const fieldValue = this.getFieldValue(field, context);

            switch (operator) {
                case 'equals':
                    // eslint-disable-next-line eqeqeq
                    return fieldValue == value;
                case 'notEquals':
                    // eslint-disable-next-line eqeqeq
                    return fieldValue != value;
                case 'contains':
                    return String(fieldValue).includes(String(value));
                case 'notContains':
                    return !String(fieldValue).includes(String(value));
                case 'greaterThan':
                    return Number(fieldValue) > Number(value);
                case 'lessThan':
                    return Number(fieldValue) < Number(value);
                case 'greaterThanOrEqual':
                    return Number(fieldValue) >= Number(value);
                case 'lessThanOrEqual':
                    return Number(fieldValue) <= Number(value);
                case 'startsWith':
                    return String(fieldValue).startsWith(String(value));
                case 'endsWith':
                    return String(fieldValue).endsWith(String(value));
                case 'isEmpty':
                    return !fieldValue || fieldValue === '';
                case 'isNotEmpty':
                    return fieldValue && fieldValue !== '';
                case 'in':
                    return Array.isArray(value) && value.includes(fieldValue);
                case 'notIn':
                    return Array.isArray(value) && !value.includes(fieldValue);
                default:
                    return false;
            }
        }

        getFieldValue(field, context) {
            // Support dot notation for nested fields
            const parts = field.split('.');
            let value = context;

            for (const part of parts) {
                if (value && typeof value === 'object') {
                    value = value[part];
                } else {
                    return null;
                }
            }

            return value;
        }

        async executeActions(actions, context) {
            for (const action of actions) {
                try {
                    await this.executeAction(action, context);
                } catch (error) {
                    console.error('Action execution failed:', error);
                }
            }
        }

        async executeAction(action, context) {
            switch (action.type) {
                case 'sendNotification':
                    await this.sendNotification(action.config, context);
                    break;
                case 'updateData':
                    await this.updateData(action.config, context);
                    break;
                case 'createRecord':
                    await this.createRecord(action.config, context);
                    break;
                case 'deleteRecord':
                    await this.deleteRecord(action.config, context);
                    break;
                case 'sendEmail':
                    await this.sendEmail(action.config, context);
                    break;
                case 'webhook':
                    await this.callWebhook(action.config, context);
                    break;
                case 'runScript':
                    await this.runScript(action.config, context);
                    break;
                default:
                    console.warn('Unknown action type:', action.type);
            }
        }

        async sendNotification(config, context) {
            const message = this.interpolateString(config.message, context);
            const title = this.interpolateString(config.title || 'Notification', context);

            if (window.notificationSystem) {
                window.notificationSystem.show(title, message, config.type || 'info');
            } else {
                alert(`${title}: ${message}`);
            }
        }

        async updateData(config, context) {
            const updates = this.interpolateObject(config.updates, context);

            if (window.database?.update) {
                await window.database.update(config.recordId, updates);
            }
        }

        async createRecord(config, context) {
            const data = this.interpolateObject(config.data, context);

            if (window.database?.create) {
                await window.database.create(data);
            }
        }

        async deleteRecord(config, context) {
            const recordId = this.interpolateString(config.recordId, context);

            if (window.database?.delete) {
                await window.database.delete(recordId);
            }
        }

        async sendEmail(config, context) {
            const email = {
                to: this.interpolateString(config.to, context),
                subject: this.interpolateString(config.subject, context),
                body: this.interpolateString(config.body, context)
            };

            // Integrate with email service
            if (window.emailService) {
                await window.emailService.send(email);
            } else {
                console.log('Email would be sent:', email);
            }
        }

        async fetchJSON(url, options = {}) {
            try {
                const res = await fetch(url, options);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return await res.json();
            } catch (e) {
                console.warn(`[workflow-automation] Direct fetch failed for ${url}, attempting proxy...`, e.message);

                // Try AllOrigins first
                try {
                    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
                    const proxyRes = await fetch(proxyUrl);
                    if (!proxyRes.ok) throw new Error(`Proxy HTTP ${proxyRes.status}`);
                    const data = await proxyRes.json();
                    if (data && data.contents) {
                        return JSON.parse(data.contents);
                    }
                } catch (proxyError) {
                    console.warn('[workflow-automation] AllOrigins proxy failed, trying corsproxy.io...', proxyError.message);
                }

                // Fallback to corsproxy.io
                try {
                    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
                    const proxyRes = await fetch(proxyUrl, options);
                    if (!proxyRes.ok) throw new Error(`Proxy HTTP ${proxyRes.status}`);
                    return await proxyRes.json();
                } catch (proxyError) {
                    console.error('[workflow-automation] All proxies failed:', proxyError.message);
                    throw e; // Re-throw original error
                }
            }
        }

        async callWebhook(config, context) {
            const url = this.interpolateString(config.url, context);
            const payload = this.interpolateObject(config.payload || {}, context);

            try {
                await this.fetchJSON(url, {
                    method: config.method || 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...config.headers
                    },
                    body: JSON.stringify(payload)
                });
            } catch (error) {
                console.error('Webhook call failed:', error);
                throw error;
            }
        }

        async runScript(config, context) {
            const script = config.script;
            if (typeof script === 'function') {
                await script(context);
            } else if (typeof script === 'string') {
                // Execute as code (be careful with eval)
                // SECURITY CRITICAL: This is arbitrary code execution. 
                // Only allow this for trusted ADMIN workflows.
                if (!window.authManager?.isAdmin()) {
                    console.warn('Security Block: Non-admin attempted to execute workflow script.');
                    return;
                }

                console.warn('Executing workflow script. Ensure this is safe.');
                // eslint-disable-next-line no-new-func
                const func = new Function('context', script);
                await func(context);
            }
        }

        interpolateString(template, context) {
            return template.replace(/\{\{([^{}]+)\}\}/g, (match, path) => {
                const value = this.getFieldValue(path, context);
                return value !== null && value !== undefined ? String(value) : match;
            });
        }

        interpolateObject(obj, context) {
            if (typeof obj === 'string') {
                return this.interpolateString(obj, context);
            } else if (Array.isArray(obj)) {
                return obj.map(item => this.interpolateObject(item, context));
            } else if (obj && typeof obj === 'object') {
                const result = {};
                for (const [key, value] of Object.entries(obj)) {
                    result[key] = this.interpolateObject(value, context);
                }
                return result;
            }
            return obj;
        }

        renderRules() {
            const list = document.getElementById('rules-list');
            if (!list) return;

            list.innerHTML = this.rules.map(rule => `
                <div class="rule-item" data-rule-id="${rule.id}">
                    <div class="rule-header">
                        <input type="checkbox" class="rule-enabled" ${rule.enabled ? 'checked' : ''} 
                               data-rule-id="${rule.id}" />
                        <h4>${rule.name}</h4>
                        <span class="rule-trigger">${rule.trigger}</span>
                    </div>
                    <div class="rule-details">
                        <div class="rule-conditions">
                            <strong>If:</strong> ${rule.conditions.length} condition(s)
                        </div>
                        <div class="rule-actions">
                            <strong>Then:</strong> ${rule.actions.length} action(s)
                        </div>
                        <div class="rule-stats">
                            Executed ${rule.executionCount} time(s)
                            ${rule.lastExecuted ? `Last: ${new Date(rule.lastExecuted).toLocaleString()}` : ''}
                        </div>
                    </div>
                    <div class="rule-actions-btns">
                        <button class="edit-rule-btn" data-rule-id="${rule.id}">Edit</button>
                        <button class="delete-rule-btn" data-rule-id="${rule.id}">Delete</button>
                        <button class="test-rule-btn" data-rule-id="${rule.id}">Test</button>
                    </div>
                </div>
            `).join('');

            // Add event listeners
            list.querySelectorAll('.rule-enabled').forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                    this.toggleRule(e.target.dataset.ruleId, e.target.checked);
                });
            });

            list.querySelectorAll('.edit-rule-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.editRule(btn.dataset.ruleId);
                });
            });

            list.querySelectorAll('.delete-rule-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    if (confirm('Delete this rule?')) {
                        this.deleteRule(btn.dataset.ruleId);
                    }
                });
            });

            list.querySelectorAll('.test-rule-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.testRule(btn.dataset.ruleId);
                });
            });
        }

        toggleRule(ruleId, enabled) {
            const rule = this.rules.find(r => r.id === ruleId);
            if (rule) {
                rule.enabled = enabled;
                this.saveRules();
            }
        }

        deleteRule(ruleId) {
            this.rules = this.rules.filter(r => r.id !== ruleId);
            this.saveRules();
            this.renderRules();
        }

        editRule(ruleId) {
            const rule = this.rules.find(r => r.id === ruleId);
            if (!rule) return;

            this.showRuleEditor(rule);
        }

        testRule(ruleId) {
            const rule = this.rules.find(r => r.id === ruleId);
            if (!rule) return;

            const testContext = this.promptTestContext();
            if (testContext) {
                if (this.evaluateConditions(rule.conditions, testContext)) {
                    alert('Conditions matched! Actions would be executed.');
                    this.executeActions(rule.actions, testContext);
                } else {
                    alert('Conditions did not match.');
                }
            }
        }

        promptTestContext() {
            const contextStr = prompt('Enter test context (JSON):');
            if (!contextStr) return null;

            try {
                return JSON.parse(contextStr);
            } catch {
                alert('Invalid JSON');
                return null;
            }
        }

        showRuleEditor(rule) {
            // Show rule editor modal (simplified)
            alert('Rule editor would open here. Rule: ' + rule.name);
        }

        saveRules() {
            localStorage.setItem('workflowRules', JSON.stringify(this.rules));
        }

        loadRules() {
            const stored = localStorage.getItem('workflowRules');
            if (stored) {
                try {
                    this.rules = JSON.parse(stored);
                } catch (error) {
                    console.error('Failed to load rules:', error);
                    this.rules = [];
                }
            }
        }
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.workflowAutomation = new WorkflowAutomationSystem();
        });
    } else {
        window.workflowAutomation = new WorkflowAutomationSystem();
    }
})();


