/**
 * AI Content Generation for Descriptions
 * Generates AI-powered content descriptions
 */

class AIContentGenerationDescriptions {
    constructor() {
        this.templates = {};
        this.init();
    }
    
    init() {
        this.loadTemplates();
        this.trackEvent('content_generation_initialized');
    }
    
    loadTemplates() {
        this.templates = {
            planet: {
                intro: ['Discover', 'Explore', 'Journey to', 'Visit'],
                adjectives: ['mysterious', 'beautiful', 'distant', 'exotic', 'unique', 'fascinating'],
                features: ['unique atmosphere', 'stunning landscapes', 'rich history', 'diverse ecosystems']
            },
            star: {
                intro: ['Gaze upon', 'Observe', 'Study', 'Admire'],
                adjectives: ['brilliant', 'distant', 'ancient', 'powerful', 'magnificent'],
                features: ['intense radiation', 'stellar winds', 'magnetic fields']
            }
        };
    }
    
    generateDescription(type, data) {
        const template = this.templates[type] || this.templates.planet;
        const intro = this.randomChoice(template.intro);
        const adjective = this.randomChoice(template.adjectives);
        const feature = this.randomChoice(template.features);
        
        let description = `${intro} this ${adjective} ${type}`;
        
        if (data.name) {
            description = `${intro} ${data.name}, a ${adjective} ${type}`;
        }
        
        if (data.size) {
            description += ` with a diameter of ${this.formatSize(data.size)}`;
        }
        
        if (data.temperature) {
            description += ` and a surface temperature of ${this.formatTemperature(data.temperature)}`;
        }
        
        description += `. This celestial body features ${feature} and offers a unique perspective on the cosmos.`;
        
        // Add more details if available
        if (data.description) {
            description += ` ${data.description}`;
        }
        
        this.trackEvent('description_generated', { type, hasName: !!data.name });
        return description;
    }
    
    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    
    formatSize(size) {
        if (size > 1000000) {
            return `${(size / 1000000).toFixed(2)} million km`;
        } else if (size > 1000) {
            return `${(size / 1000).toFixed(2)} thousand km`;
        }
        return `${size.toFixed(2)} km`;
    }
    
    formatTemperature(temp) {
        return `${Math.round(temp)}°C`;
    }
    
    async generatePlanetDescription(planetData) {
        return this.generateDescription('planet', planetData);
    }
    
    async generateStarDescription(starData) {
        return this.generateDescription('star', starData);
    }
    
    async enhanceDescription(existingDescription, type) {
        // Enhance existing description with AI
        const enhanced = existingDescription;
        
        // Add engaging opening
        const openings = [
            'In the vast expanse of space,',
            'Among the countless celestial bodies,',
            'Hidden in the depths of the cosmos,'
        ];
        
        const opening = this.randomChoice(openings);
        
        return `${opening} ${enhanced}`;
    }
    
    async generateTags(content) {
        // Generate tags from content
        const words = content.toLowerCase().split(/\s+/);
        const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
        const keywords = words.filter(word => 
            word.length > 3 && !commonWords.includes(word)
        );
        
        return [...new Set(keywords)].slice(0, 5);
    }
    
    async generateTitle(type, data) {
        // Generate title
        if (data.name) {
            return data.name;
        }
        
        const adjectives = ['Mysterious', 'Distant', 'Exotic', 'Unique'];
        const adjective = this.randomChoice(adjectives);
        
        return `${adjective} ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    }
    
    async generateMetaDescription(content, maxLength = 160) {
        // Generate meta description
        let meta = content.substring(0, maxLength);
        if (content.length > maxLength) {
            meta = meta.substring(0, meta.lastIndexOf(' ')) + '...';
        }
        return meta;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`content_gen_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'ai_content_generation_descriptions', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.aiContentGenerationDescriptions = new AIContentGenerationDescriptions(); });
} else {
    window.aiContentGenerationDescriptions = new AIContentGenerationDescriptions();
}

