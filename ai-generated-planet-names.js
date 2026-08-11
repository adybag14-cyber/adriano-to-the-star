/**
 * AI-Generated Planet Names
 * Generates unique planet names using AI
 */

class AIGeneratedPlanetNames {
    constructor() {
        this.namePatterns = [];
        this.init();
    }
    
    init() {
        this.loadNamePatterns();
        this.trackEvent('planet_names_initialized');
    }
    
    loadNamePatterns() {
        // Name generation patterns
        this.namePatterns = {
            prefixes: ['Alpha', 'Beta', 'Gamma', 'Delta', 'Nova', 'Stella', 'Luna', 'Astra', 'Cosmo', 'Nebula'],
            suffixes: ['Prime', 'Secundus', 'Tertius', 'Major', 'Minor', 'Alpha', 'Beta', 'Prime', 'Nova', 'Stella'],
            mythological: ['Atlas', 'Zeus', 'Apollo', 'Artemis', 'Hermes', 'Ares', 'Hera', 'Poseidon'],
            descriptive: ['Crimson', 'Azure', 'Emerald', 'Golden', 'Silver', 'Crystal', 'Diamond', 'Ruby']
        };
    }
    
    generateName(style = 'scientific') {
        // Generate planet name based on style
        switch (style) {
            case 'scientific':
                return this.generateScientificName();
            case 'mythological':
                return this.generateMythologicalName();
            case 'descriptive':
                return this.generateDescriptiveName();
            case 'random':
                return this.generateRandomName();
            default:
                return this.generateScientificName();
        }
    }
    
    generateScientificName() {
        // Generate scientific-style name
        const prefix = this.randomChoice(this.namePatterns.prefixes);
        const suffix = this.randomChoice(this.namePatterns.suffixes);
        const number = Math.floor(Math.random() * 999) + 1;
        
        return `${prefix}-${suffix}-${number}`;
    }
    
    generateMythologicalName() {
        // Generate mythological name
        const base = this.randomChoice(this.namePatterns.mythological);
        const variant = Math.random() > 0.5 ? `'s ${this.randomChoice(['World', 'Realm', 'Domain'])}` : '';
        
        return base + variant;
    }
    
    generateDescriptiveName() {
        // Generate descriptive name
        const descriptor = this.randomChoice(this.namePatterns.descriptive);
        const noun = this.randomChoice(['Star', 'World', 'Planet', 'Sphere', 'Orb']);
        
        return `${descriptor} ${noun}`;
    }
    
    generateRandomName() {
        // Generate completely random name
        const styles = ['scientific', 'mythological', 'descriptive'];
        const style = this.randomChoice(styles);
        return this.generateName(style);
    }
    
    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    
    async generateUniqueName(style = 'scientific') {
        // Generate name and check for uniqueness
        let name = this.generateName(style);
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts) {
            const isUnique = await this.checkNameUniqueness(name);
            if (isUnique) {
                return name;
            }
            name = this.generateName(style);
            attempts++;
        }
        
        // Add timestamp if still not unique
        return `${name}-${Date.now().toString(36)}`;
    }
    
    async checkNameUniqueness(name) {
        // Check if name is unique
        if (window.supabase) {
            const { data } = await window.supabase
                .from('planets')
                .select('id')
                .eq('name', name)
                .limit(1);
            
            return !data || data.length === 0;
        }
        
        return true; // Assume unique if can't check
    }
    
    generateNameVariations(baseName) {
        // Generate variations of a name
        return [
            `${baseName} Prime`,
            `${baseName} Alpha`,
            `${baseName} Beta`,
            `New ${baseName}`,
            `${baseName} II`,
            `${baseName} Secundus`
        ];
    }
    
    async suggestNames(context = {}) {
        // Suggest names based on context
        const suggestions = [];
        
        if (context.type) {
            // Type-specific suggestions
            suggestions.push(...this.generateNameVariations(
                this.generateName('descriptive')
            ));
        }
        
        if (context.theme) {
            // Theme-specific suggestions
            if (context.theme === 'space') {
                suggestions.push(...this.generateNameVariations(
                    this.generateName('scientific')
                ));
            } else if (context.theme === 'mythology') {
                suggestions.push(...this.generateNameVariations(
                    this.generateName('mythological')
                ));
            }
        }
        
        // Always include some random options
        for (let i = 0; i < 3; i++) {
            suggestions.push(this.generateName('random'));
        }
        
        this.trackEvent('names_suggested', { count: suggestions.length });
        return [...new Set(suggestions)].slice(0, 10);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`planet_names_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'ai_generated_planet_names', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.aiGeneratedPlanetNames = new AIGeneratedPlanetNames(); });
} else {
    window.aiGeneratedPlanetNames = new AIGeneratedPlanetNames();
}

