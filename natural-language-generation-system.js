/**
 * Natural Language Generation System
 * Generates human-like text from structured data and templates
 */

class NaturalLanguageGenerationSystem {
    constructor() {
        this.templates = new Map();
        this.grammars = new Map();
        this.models = new Map();
        this.init();
    }

    init() {
        this.loadDefaultTemplates();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.processElements();
        });

        // Process elements with data attributes
        document.addEventListener('input', (e) => {
            if (e.target.hasAttribute('data-nlg-generate')) {
                this.generateFromElement(e.target);
            }
        });
    }

    /**
     * Load default templates
     */
    loadDefaultTemplates() {
        this.templates.set('summary', {
            pattern: 'The {metric} {trend} by {value}% {period}.',
            variables: ['metric', 'trend', 'value', 'period']
        });

        this.templates.set('report', {
            pattern: 'In {period}, {subject} {action} {value} {unit}. This represents a {change}% change from the previous period.',
            variables: ['period', 'subject', 'action', 'value', 'unit', 'change']
        });

        this.templates.set('description', {
            pattern: '{subject} is {adjective} with {feature} of {value}.',
            variables: ['subject', 'adjective', 'feature', 'value']
        });
    }

    /**
     * Process elements that need NLG
     */
    processElements() {
        const elements = document.querySelectorAll('[data-nlg-generate]');
        elements.forEach(element => {
            this.generateFromElement(element);
        });
    }

    /**
     * Generate text from element
     */
    generateFromElement(element) {
        const templateName = element.getAttribute('data-nlg-template') || 'summary';
        const data = this.extractDataFromElement(element);
        const generated = this.generate(templateName, data);
        
        const targetId = element.getAttribute('data-nlg-target');
        const target = targetId ? document.getElementById(targetId) : element.nextElementSibling;
        
        if (target) {
            target.textContent = generated;
        }
    }

    /**
     * Extract data from element attributes
     */
    extractDataFromElement(element) {
        const data = {};
        const dataPrefix = 'data-nlg-';
        
        Array.from(element.attributes).forEach(attr => {
            if (attr.name.startsWith(dataPrefix) && attr.name !== 'data-nlg-generate' && attr.name !== 'data-nlg-template' && attr.name !== 'data-nlg-target') {
                const key = attr.name.replace(dataPrefix, '');
                data[key] = attr.value;
            }
        });

        return data;
    }

    /**
     * Generate text from template and data
     */
    generate(templateName, data = {}) {
        const template = this.templates.get(templateName);
        if (!template) {
            return `Template "${templateName}" not found`;
        }

        let text = template.pattern;
        
        // Replace variables
        template.variables.forEach(variable => {
            const value = data[variable] || this.getDefaultValue(variable);
            text = text.replace(new RegExp(`\\{${variable}\\}`, 'g'), value);
        });

        // Apply grammar rules
        text = this.applyGrammarRules(text);

        return text;
    }

    /**
     * Get default value for variable
     */
    getDefaultValue(variable) {
        const defaults = {
            metric: 'metric',
            trend: 'increased',
            value: '0',
            period: 'this period',
            subject: 'the data',
            action: 'shows',
            unit: 'units',
            change: '0',
            adjective: 'interesting',
            feature: 'a value'
        };

        return defaults[variable] || 'N/A';
    }

    /**
     * Apply grammar rules
     */
    applyGrammarRules(text) {
        // Capitalize first letter
        text = text.charAt(0).toUpperCase() + text.slice(1);

        // Fix articles
        text = text.replace(/\ba ([aeiou])/gi, 'an $1');

        // Fix punctuation
        if (!text.match(/[.!?]$/)) {
            text += '.';
        }

        return text;
    }

    /**
     * Register custom template
     */
    registerTemplate(name, pattern, variables) {
        this.templates.set(name, {
            pattern,
            variables: variables || this.extractVariables(pattern)
        });
    }

    /**
     * Extract variables from pattern
     */
    extractVariables(pattern) {
        const matches = pattern.match(/\{(\w+)\}/g);
        if (!matches) return [];
        
        return matches.map(match => match.replace(/[{}]/g, ''));
    }

    /**
     * Generate from structured data
     */
    generateFromData(data, options = {}) {
        const {
            template = 'summary',
            style = 'formal',
            length = 'medium'
        } = options;

        let generated = this.generate(template, data);

        // Apply style
        generated = this.applyStyle(generated, style);

        // Apply length constraints
        generated = this.applyLength(generated, length);

        return generated;
    }

    /**
     * Apply style to text
     */
    applyStyle(text, style) {
        switch (style) {
            case 'formal':
                // Already formal by default
                break;
            case 'casual':
                text = text.replace(/is/gi, "'s");
                text = text.replace(/are/gi, "'re");
                break;
            case 'technical':
                // Add technical terms
                break;
        }

        return text;
    }

    /**
     * Apply length constraints
     */
    applyLength(text, length) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim());
        
        switch (length) {
            case 'short':
                return sentences.slice(0, 1).join('.') + '.';
            case 'medium':
                return sentences.slice(0, 2).join('.') + '.';
            case 'long':
                return text;
            default:
                return text;
        }
    }

    /**
     * Generate multiple variations
     */
    generateVariations(templateName, data, count = 3) {
        const variations = [];
        
        for (let i = 0; i < count; i++) {
            const variation = this.generate(templateName, data);
            if (!variations.includes(variation)) {
                variations.push(variation);
            }
        }

        return variations;
    }

    /**
     * Generate from JSON data
     */
    generateFromJSON(jsonData, templateName = 'report') {
        const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
        return this.generate(templateName, data);
    }

    /**
     * Generate summary from data array
     */
    generateSummary(dataArray, options = {}) {
        const {
            metric = 'items',
            aggregation = 'sum'
        } = options;

        let value = 0;
        if (aggregation === 'sum') {
            value = dataArray.reduce((sum, item) => sum + (item.value || 0), 0);
        } else if (aggregation === 'avg') {
            value = dataArray.reduce((sum, item) => sum + (item.value || 0), 0) / dataArray.length;
        } else if (aggregation === 'max') {
            value = Math.max(...dataArray.map(item => item.value || 0));
        } else if (aggregation === 'min') {
            value = Math.min(...dataArray.map(item => item.value || 0));
        }

        const trend = this.calculateTrend(dataArray);
        const period = options.period || 'this period';

        return this.generate('summary', {
            metric,
            trend,
            value: value.toFixed(2),
            period
        });
    }

    /**
     * Calculate trend from data
     */
    calculateTrend(dataArray) {
        if (dataArray.length < 2) {
            return 'remained stable';
        }

        const first = dataArray[0].value || 0;
        const last = dataArray[dataArray.length - 1].value || 0;

        if (last > first * 1.1) {
            return 'increased significantly';
        } else if (last > first) {
            return 'increased';
        } else if (last < first * 0.9) {
            return 'decreased significantly';
        } else if (last < first) {
            return 'decreased';
        } else {
            return 'remained stable';
        }
    }

    /**
     * Generate conversational text
     */
    generateConversational(data, context = {}) {
        const templates = [
            'Hey! Did you know that {metric} {trend} by {value}%?',
            'Interesting update: {metric} is now at {value}, which is a {change}% change.',
            'Here\'s what happened: {subject} {action} to {value} {unit}.'
        ];

        const template = templates[Math.floor(Math.random() * templates.length)];
        let text = template;

        Object.keys(data).forEach(key => {
            text = text.replace(new RegExp(`\\{${key}\\}`, 'g'), data[key] || 'N/A');
        });

        return text;
    }

    /**
     * Generate bullet points
     */
    generateBulletPoints(dataArray, templateName = 'summary') {
        return dataArray.map(item => {
            const generated = this.generate(templateName, item);
            return `• ${generated}`;
        }).join('\n');
    }

    /**
     * Generate paragraph from multiple data points
     */
    generateParagraph(dataArray, templateName = 'summary') {
        const sentences = dataArray.map(item => 
            this.generate(templateName, item)
        );

        return sentences.join(' ') + '.';
    }
}

// Auto-initialize
const naturalLanguageGenerationSystem = new NaturalLanguageGenerationSystem();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NaturalLanguageGenerationSystem;
}

