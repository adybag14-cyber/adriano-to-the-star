/**
 * AI Planet Habitability Analysis
 * AI-powered analysis of planet habitability
 * 
 * Features:
 * - Habitability scoring
 * - Habitable zone detection
 * - Life potential assessment
 * - Comparison with Earth
 * - Detailed reports
 */

class AIPlanetHabitabilityAnalysis {
    constructor() {
        this.analysisCache = new Map();
        this.init();
    }
    
    init() {
        // Create analysis UI
        this.createAnalysisUI();
        
        // Enhance planet cards with habitability info
        this.enhancePlanetCards();
        
        this.trackEvent('habitability_analysis_initialized');
    }
    
    createAnalysisUI() {
        // Create floating analysis button
        const btn = document.createElement('button');
        btn.id = 'habitability-analysis-btn';
        btn.innerHTML = '🌍 Analyze Habitability';
        btn.style.cssText = `
            position: fixed;
            bottom: 320px;
            right: 20px;
            padding: 0.75rem 1.5rem;
            background: rgba(186, 148, 79, 0.9);
            border: 2px solid rgba(186, 148, 79, 1);
            border-radius: 10px;
            color: white;
            cursor: pointer;
            z-index: 9998;
            font-weight: bold;
        `;
        
        btn.addEventListener('click', () => {
            this.showAnalysisDialog();
        });
        
        document.body.appendChild(btn);
    }
    
    enhancePlanetCards() {
        // Add habitability indicators to planet cards
        const observer = new MutationObserver(() => {
            document.querySelectorAll('.planet-card').forEach(card => {
                if (!card.dataset.habitabilityAnalyzed) {
                    this.addHabitabilityIndicator(card);
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // Initial enhancement
        setTimeout(() => {
            document.querySelectorAll('.planet-card').forEach(card => {
                this.addHabitabilityIndicator(card);
            });
        }, 1000);
    }
    
    addHabitabilityIndicator(card) {
        if (!(card instanceof HTMLElement) || !card.classList.contains('planet-card')) return;
        if (card.dataset.habitabilityAnalyzed === 'true') return;

        const planet = this.getPlanetData(card);
        const analysis = this.analyzeHabitability(planet);
        card.dataset.habitabilityAnalyzed = 'true';
        card.dataset.habitabilityScore = String(analysis.score);

        // Keep habitability as an explicit card action instead of spraying circular
        // badges across every nested control. The score remains available to UI code.
        const action = card.querySelector('.habitability-btn');
        if (action) {
            action.title = `Habitability analysis — score ${analysis.score}/100`;
            action.setAttribute('aria-label', `Habitability analysis, score ${analysis.score} out of 100`);
        }
    }

    analyzeHabitability(planet) {
        // Check cache
        const cacheKey = planet.kepid || planet.name;
        if (this.analysisCache.has(cacheKey)) {
            return this.analysisCache.get(cacheKey);
        }
        
        let score = 0;
        const factors = {};
        
        // Distance from star (habitable zone)
        if (planet.distance && planet.orbitalPeriod) {
            const habitableZone = this.calculateHabitableZone(planet);
            factors.habitableZone = habitableZone.inZone;
            factors.distanceFromStar = habitableZone.distance;
            if (habitableZone.inZone) score += 30;
        }
        
        // Planet size (Earth-like)
        if (planet.radius) {
            const earthSimilarity = this.calculateEarthSimilarity(planet.radius);
            factors.earthSimilarity = earthSimilarity;
            score += earthSimilarity * 20;
        }
        
        // Mass (gravity)
        if (planet.mass) {
            const gravityScore = this.calculateGravityScore(planet.mass);
            factors.gravityScore = gravityScore;
            score += gravityScore * 15;
        }
        
        // Temperature (if available)
        if (planet.temperature) {
            const tempScore = this.calculateTemperatureScore(planet.temperature);
            factors.temperatureScore = tempScore;
            score += tempScore * 20;
        }
        
        // Stellar type (if available)
        if (planet.stellarType) {
            const stellarScore = this.calculateStellarScore(planet.stellarType);
            factors.stellarScore = stellarScore;
            score += stellarScore * 15;
        }
        
        // Discovery method (reliability)
        if (planet.detectionMethod) {
            const methodScore = this.calculateMethodScore(planet.detectionMethod);
            factors.methodScore = methodScore;
            score += methodScore * 10;
        }
        
        const analysis = {
            score: Math.min(100, Math.max(0, Math.round(score))),
            factors: factors,
            recommendation: this.getRecommendation(score),
            lifePotential: this.assessLifePotential(score, factors)
        };
        
        // Cache result
        this.analysisCache.set(cacheKey, analysis);
        this.trackEvent('habitability_analyzed', { score: analysis.score, lifePotential: analysis.lifePotential });
        
        return analysis;
    }
    
    calculateHabitableZone(planet) {
        // Simplified habitable zone calculation
        // Based on orbital period and star type
        const period = planet.orbitalPeriod || 365;
        const distance = planet.distance || 1;
        
        // Rough habitable zone: 0.7-1.5 AU equivalent
        // Using orbital period as proxy
        const auEquivalent = Math.pow(period / 365, 2/3);
        const inZone = auEquivalent >= 0.7 && auEquivalent <= 1.5;
        
        return {
            inZone: inZone,
            distance: auEquivalent,
            zoneType: inZone ? 'habitable' : (auEquivalent < 0.7 ? 'too-close' : 'too-far')
        };
    }
    
    calculateEarthSimilarity(radius) {
        // Earth radius = 1.0
        const earthRadius = 1.0;
        const difference = Math.abs(radius - earthRadius);
        
        // Score: 1.0 if exactly Earth-sized, decreases with difference
        return Math.max(0, 1 - (difference / 2));
    }
    
    calculateGravityScore(mass) {
        // Earth mass = 1.0
        const earthMass = 1.0;
        const difference = Math.abs(mass - earthMass);
        
        // Prefer Earth-like mass (0.5-2.0 Earth masses)
        if (mass >= 0.5 && mass <= 2.0) {
            return 1.0;
        } else if (mass >= 0.3 && mass <= 5.0) {
            return 0.7;
        } else {
            return 0.3;
        }
    }
    
    calculateTemperatureScore(temperature) {
        // Optimal: 0-50°C (273-323K)
        if (temperature >= 273 && temperature <= 323) {
            return 1.0;
        } else if (temperature >= 250 && temperature <= 350) {
            return 0.7;
        } else if (temperature >= 200 && temperature <= 400) {
            return 0.4;
        } else {
            return 0.1;
        }
    }
    
    calculateStellarScore(stellarType) {
        // G-type stars (like our Sun) are best
        const type = stellarType.toLowerCase();
        if (type.includes('g')) return 1.0;
        if (type.includes('k') || type.includes('f')) return 0.8;
        if (type.includes('m')) return 0.5;
        return 0.3;
    }
    
    calculateMethodScore(method) {
        // More reliable methods score higher
        const m = method.toLowerCase();
        if (m.includes('transit') || m.includes('radial')) return 1.0;
        if (m.includes('microlensing')) return 0.8;
        if (m.includes('imaging')) return 0.6;
        return 0.5;
    }
    
    getRecommendation(score) {
        if (score >= 80) return 'Highly Habitable - Excellent candidate for life';
        if (score >= 60) return 'Potentially Habitable - Good candidate for further study';
        if (score >= 40) return 'Marginally Habitable - Possible but challenging';
        if (score >= 20) return 'Unlikely Habitable - Extreme conditions';
        return 'Not Habitable - Conditions too extreme for life as we know it';
    }
    
    assessLifePotential(score, factors) {
        if (score >= 80) return 'High';
        if (score >= 60) return 'Moderate';
        if (score >= 40) return 'Low';
        return 'Very Low';
    }
    
    getHabitabilityColor(score) {
        if (score >= 80) return 'rgba(74, 222, 128, 0.9)'; // Green
        if (score >= 60) return 'rgba(251, 191, 36, 0.9)'; // Yellow
        if (score >= 40) return 'rgba(251, 146, 60, 0.9)'; // Orange
        return 'rgba(239, 68, 68, 0.9)'; // Red
    }
    
    getHabitabilityIcon(score) {
        if (score >= 80) return '🌍';
        if (score >= 60) return '🌎';
        if (score >= 40) return '🌏';
        return '🌑';
    }
    
    showAnalysisDialog() {
        // Get selected planet or show general analysis
        const selectedPlanet = this.getSelectedPlanet();
        
        if (selectedPlanet) {
            const analysis = this.analyzeHabitability(selectedPlanet);
            this.showPlanetAnalysis(selectedPlanet, analysis);
        } else {
            this.showGeneralAnalysis();
        }
    }
    
    showPlanetAnalysis(planet, analysis) {
        const modal = document.createElement('div');
        modal.id = 'habitability-analysis-modal';
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.98);
            border: 2px solid rgba(186, 148, 79, 0.5);
            border-radius: 10px;
            padding: 2rem;
            z-index: 10002;
            max-width: 600px;
            max-height: 90vh;
            overflow-y: auto;
            color: white;
        `;
        
        modal.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h2 style="color: #ba944f; margin: 0;">🌍 Habitability Analysis</h2>
                <button id="close-habitability-modal" style="background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer;">×</button>
            </div>
            
            <div style="text-align: center; margin-bottom: 2rem;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">${this.getHabitabilityIcon(analysis.score)}</div>
                <div style="font-size: 3rem; color: ${this.getHabitabilityColor(analysis.score)}; font-weight: bold; margin-bottom: 0.5rem;">
                    ${analysis.score}/100
                </div>
                <div style="color: rgba(255,255,255,0.9); font-size: 1.1rem;">${analysis.recommendation}</div>
            </div>
            
            <div style="margin-bottom: 1.5rem;">
                <h3 style="color: #ba944f; margin-bottom: 1rem;">Life Potential: ${analysis.lifePotential}</h3>
                <div style="background: rgba(0, 0, 0, 0.3); border-radius: 10px; padding: 1rem;">
                    ${Object.entries(analysis.factors).map(([key, value]) => `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span>${this.formatFactorName(key)}:</span>
                            <span style="color: #ba944f; font-weight: bold;">${this.formatFactorValue(value)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid rgba(186,148,79,0.3);">
                <h3 style="color: #ba944f; margin-bottom: 1rem;">Analysis Details</h3>
                <p style="color: rgba(255,255,255,0.8); line-height: 1.6;">
                    ${this.generateDetailedReport(planet, analysis)}
                </p>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('close-habitability-modal').addEventListener('click', () => {
            modal.remove();
        });
    }
    
    formatFactorName(key) {
        const names = {
            'habitableZone': 'In Habitable Zone',
            'earthSimilarity': 'Earth Similarity',
            'gravityScore': 'Gravity Score',
            'temperatureScore': 'Temperature Score',
            'stellarScore': 'Stellar Type Score',
            'methodScore': 'Detection Method Score'
        };
        return names[key] || key;
    }
    
    formatFactorValue(value) {
        if (typeof value === 'boolean') {
            return value ? 'Yes' : 'No';
        }
        if (typeof value === 'number') {
            return (value * 100).toFixed(0) + '%';
        }
        return value;
    }
    
    generateDetailedReport(planet, analysis) {
        let report = `Planet ${planet.name || planet.kepid || 'Unknown'} has been analyzed for habitability potential. `;
        
        if (analysis.factors.habitableZone) {
            report += 'The planet is located within the habitable zone of its star, where liquid water could potentially exist. ';
        } else {
            report += 'The planet is located outside the optimal habitable zone. ';
        }
        
        if (analysis.factors.earthSimilarity > 0.7) {
            report += 'The planet\'s size is very similar to Earth, which is favorable for habitability. ';
        }
        
        report += `Overall, this planet has a ${analysis.lifePotential.toLowerCase()} potential for supporting life. `;
        report += analysis.recommendation;
        
        return report;
    }
    
    getPlanetData(card) {
        return {
            kepid: card.dataset.kepid,
            name: card.dataset.name || card.querySelector('.planet-name')?.textContent,
            radius: parseFloat(card.dataset.radius),
            mass: parseFloat(card.dataset.mass),
            distance: parseFloat(card.dataset.distance),
            orbitalPeriod: parseFloat(card.dataset.orbitalPeriod || card.dataset.period),
            temperature: parseFloat(card.dataset.temperature),
            stellarType: card.dataset.stellarType,
            detectionMethod: card.dataset.detectionMethod || card.dataset.method
        };
    }
    
    getSelectedPlanet() {
        // Try to get currently selected/viewed planet
        const activeCard = document.querySelector('.planet-card.active, [data-kepid].active');
        if (activeCard) {
            return this.getPlanetData(activeCard);
        }
        return null;
    }
    
    showGeneralAnalysis() {
        alert('Please select a planet to analyze its habitability');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`habitability_analysis_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'ai_planet_habitability_analysis', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.aiPlanetHabitabilityAnalysis = new AIPlanetHabitabilityAnalysis();
    });
} else {
    window.aiPlanetHabitabilityAnalysis = new AIPlanetHabitabilityAnalysis();
}

