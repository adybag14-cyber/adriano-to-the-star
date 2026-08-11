/**
 * AI-Powered Habitability Analysis
 * Uses Gemini API to analyze planet habitability potential
 */

class AIHabitabilityAnalysis {
    constructor() {
        this.apiKey = window.GEMINI_API_KEY || (typeof GEMINI_API_KEY !== 'undefined' ? GEMINI_API_KEY : null);
        this.analysisCache = new Map();
        this.init();
    }

    init() {
        if (!this.apiKey || this.apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
            console.warn('Gemini API key not configured. AI habitability analysis disabled.');
            return;
        }
        console.log('🌍 AI Habitability Analysis initialized');
    }

    /**
     * Analyze planet habitability
     * @param {Object} planetData - Planet data object
     * @returns {Promise<Object>} Habitability analysis results
     */
    async analyzeHabitability(planetData) {
        // Check cache first
        const cacheKey = `habit-${planetData.kepid || planetData.name}`;
        if (this.analysisCache.has(cacheKey)) {
            this.trackEvent('analysis_cache_hit', { planet: planetData.kepid });
            return this.analysisCache.get(cacheKey);
        }

        this.trackEvent('analysis_requested', { planet: planetData.kepid });

        if (!this.apiKey) {
            return this.getFallbackAnalysis(planetData);
        }

        try {
            const prompt = `Analyze the habitability potential of this exoplanet:

Planet Name: ${planetData.kepler_name || planetData.kepoi_name || planetData.name || 'Unknown'}
KEPID: ${planetData.kepid || 'Unknown'}
Planet Type: ${planetData.type || 'Unknown'}
Radius: ${planetData.radius || 'Unknown'} Earth radii
Mass: ${planetData.mass || 'Unknown'} Earth masses
Distance from Star: ${planetData.distance || planetData.koi_period || 'Unknown'}
Orbital Period: ${planetData.koi_period || 'Unknown'} days
Equilibrium Temperature: ${planetData.koi_teq || planetData.temperature || 'Unknown'} K
Discovery Method: ${planetData.discovery_method || planetData.koi_disposition || 'Unknown'}

Provide a comprehensive habitability analysis including:
1. Habitability Score (0-100%)
2. Habitable Zone Status (Inside/Outside/Border)
3. Potential for Liquid Water
4. Atmospheric Potential
5. Surface Conditions Assessment
6. Life Potential (Microbial/Complex/None)
7. Key Factors (positive and negative)
8. Comparison to Earth

Return a JSON object with this structure:
{
  "habitabilityScore": 65,
  "habitableZone": "Inside",
  "liquidWaterPotential": "High",
  "atmosphericPotential": "Moderate",
  "surfaceConditions": "Rocky surface with potential for oceans",
  "lifePotential": "Microbial",
  "keyFactors": {
    "positive": ["Within habitable zone", "Similar size to Earth"],
    "negative": ["Unknown atmospheric composition", "High stellar radiation"]
  },
  "earthComparison": "Similar to early Earth conditions",
  "recommendations": "Further atmospheric studies needed"
}`;

            // Use Gemini Live (unlimited RPM/RPD) via helper
            const helper = window.geminiLiveHelper ? window.geminiLiveHelper() : null;
            let text = '';
            
            if (helper && typeof helper.callGeminiLiveWebSocket === 'function') {
                // Use WebSocket for unlimited RPM/RPD
                text = await helper.callGeminiLiveWebSocket(prompt, this.apiKey);
            } else if (helper && typeof helper.callWithFallback === 'function') {
                text = await helper.callWithFallback(prompt, {
                    temperature: 0.7,
                    maxOutputTokens: 800
                });
            } else {
                // Fallback to REST API
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: prompt }] }],
                            generationConfig: {
                                temperature: 0.7,
                                maxOutputTokens: 800
                            }
                        })
                    }
                );

                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }

                const data = await response.json();
                text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            }
            
            // Parse JSON from response
            try {
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const analysis = JSON.parse(jsonMatch[0]);
                    analysis.planetName = planetData.kepler_name || planetData.kepoi_name || planetData.name;
                    analysis.kepid = planetData.kepid;
                    analysis.timestamp = new Date().toISOString();
                    
                    // Cache the result
                    this.analysisCache.set(cacheKey, analysis);
                    this.trackEvent('analysis_completed', { planet: planetData.kepid, score: analysis.habitabilityScore });
                    return analysis;
                }
            } catch (e) {
                console.warn('Failed to parse AI response as JSON:', e);
                this.trackEvent('analysis_parse_error', { error: e.message });
            }

            return this.getFallbackAnalysis(planetData);
        } catch (error) {
            console.error('Error getting habitability analysis:', error);
            this.trackEvent('analysis_failed', { error: error.message });
            return this.getFallbackAnalysis(planetData);
        }
    }

    trackEvent(eventName, data = {}) {
        if (window.performanceMonitoring && typeof window.performanceMonitoring.recordMetric === 'function') {
            try {
                window.performanceMonitoring.recordMetric(`aiHabitability:${eventName}`, 1, {
                    source: 'ai-habitability-analysis',
                    ...data
                });
            } catch (e) {
                console.warn('Failed to record habitability event:', e);
            }
        }
        if (window.analytics && window.analytics.track) {
            window.analytics.track('Habitability Analysis', { event: eventName, ...data });
        }
    }

    /**
     * Get fallback analysis when API is unavailable
     */
    getFallbackAnalysis(planetData) {
        const radius = parseFloat(planetData.radius) || 1.0;
        const mass = parseFloat(planetData.mass) || 1.0;
        const period = parseFloat(planetData.koi_period) || 365;
        
        // Simple heuristic-based analysis
        let score = 50;
        let zone = 'Unknown';
        let waterPotential = 'Unknown';
        
        // Check if in habitable zone (rough estimate: 0.5-2 AU for Sun-like star)
        // Using orbital period as proxy (P^2 ∝ a^3)
        if (period >= 100 && period <= 500) {
            zone = 'Inside';
            score += 20;
            waterPotential = 'Moderate';
        } else if (period < 100) {
            zone = 'Too Close';
            score -= 20;
            waterPotential = 'Low';
        } else {
            zone = 'Too Far';
            score -= 15;
            waterPotential = 'Low';
        }
        
        // Size considerations
        if (radius >= 0.8 && radius <= 1.5) {
            score += 15; // Earth-like size
        } else if (radius > 1.5 && radius <= 2.5) {
            score += 10; // Super-Earth
        }
        
        score = Math.max(0, Math.min(100, score));
        
        return {
            habitabilityScore: score,
            habitableZone: zone,
            liquidWaterPotential: waterPotential,
            atmosphericPotential: 'Unknown',
            surfaceConditions: radius < 2 ? 'Likely rocky' : 'Unknown',
            lifePotential: score > 60 ? 'Microbial' : 'Unlikely',
            keyFactors: {
                positive: radius >= 0.8 && radius <= 1.5 ? ['Earth-like size'] : [],
                negative: zone !== 'Inside' ? ['Outside optimal habitable zone'] : []
            },
            earthComparison: radius >= 0.9 && radius <= 1.1 ? 'Similar size to Earth' : 'Different from Earth',
            recommendations: 'More data needed for accurate assessment',
            planetName: planetData.kepler_name || planetData.kepoi_name || planetData.name,
            kepid: planetData.kepid,
            timestamp: new Date().toISOString(),
            isFallback: true
        };
    }

    /**
     * Display habitability analysis results
     */
    displayAnalysis(analysis, container) {
        if (!container) return;

        const scoreColor = analysis.habitabilityScore >= 70 ? '#4ade80' : 
                          analysis.habitabilityScore >= 40 ? '#fbbf24' : '#ef4444';
        
        const zoneColor = analysis.habitableZone === 'Inside' ? '#4ade80' :
                         analysis.habitableZone === 'Border' ? '#fbbf24' : '#ef4444';

        container.innerHTML = `
            <div class="habitability-analysis-card" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin: 1rem 0;">
                <div class="analysis-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h3 style="color: #ba944f; margin: 0;">🌍 Habitability Analysis</h3>
                    <div class="score-badge" style="background: ${scoreColor}; color: white; padding: 0.75rem 1.5rem; border-radius: 25px; font-weight: bold; font-size: 1.2rem;">
                        ${analysis.habitabilityScore}%
                    </div>
                </div>

                <div class="analysis-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem;">
                    <div class="metric-card" style="background: rgba(186, 148, 79, 0.1); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 10px; padding: 1rem;">
                        <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem; margin-bottom: 0.5rem;">Habitable Zone</div>
                        <div style="color: ${zoneColor}; font-weight: 600; font-size: 1.1rem;">${analysis.habitableZone}</div>
                    </div>

                    <div class="metric-card" style="background: rgba(186, 148, 79, 0.1); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 10px; padding: 1rem;">
                        <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem; margin-bottom: 0.5rem;">Liquid Water</div>
                        <div style="color: #e0e0e0; font-weight: 600; font-size: 1.1rem;">${analysis.liquidWaterPotential}</div>
                    </div>

                    <div class="metric-card" style="background: rgba(186, 148, 79, 0.1); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 10px; padding: 1rem;">
                        <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem; margin-bottom: 0.5rem;">Atmosphere</div>
                        <div style="color: #e0e0e0; font-weight: 600; font-size: 1.1rem;">${analysis.atmosphericPotential}</div>
                    </div>

                    <div class="metric-card" style="background: rgba(186, 148, 79, 0.1); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 10px; padding: 1rem;">
                        <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem; margin-bottom: 0.5rem;">Life Potential</div>
                        <div style="color: #e0e0e0; font-weight: 600; font-size: 1.1rem;">${analysis.lifePotential}</div>
                    </div>
                </div>

                <div class="surface-conditions" style="margin-bottom: 1.5rem; padding: 1rem; background: rgba(186, 148, 79, 0.1); border-left: 3px solid #ba944f; border-radius: 6px;">
                    <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem; margin-bottom: 0.5rem;">Surface Conditions:</div>
                    <div style="color: #e0e0e0;">${analysis.surfaceConditions}</div>
                </div>

                <div class="key-factors" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                    <div class="positive-factors" style="padding: 1rem; background: rgba(74, 222, 128, 0.1); border: 1px solid rgba(74, 222, 128, 0.3); border-radius: 10px;">
                        <div style="color: #4ade80; font-weight: 600; margin-bottom: 0.75rem;">✅ Positive Factors</div>
                        <ul style="margin: 0; padding-left: 1.5rem; color: #e0e0e0;">
                            ${analysis.keyFactors.positive.length > 0 ? 
                                analysis.keyFactors.positive.map(factor => `<li>${factor}</li>`).join('') : 
                                '<li>None identified</li>'
                            }
                        </ul>
                    </div>

                    <div class="negative-factors" style="padding: 1rem; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 10px;">
                        <div style="color: #ef4444; font-weight: 600; margin-bottom: 0.75rem;">❌ Challenges</div>
                        <ul style="margin: 0; padding-left: 1.5rem; color: #e0e0e0;">
                            ${analysis.keyFactors.negative.length > 0 ? 
                                analysis.keyFactors.negative.map(factor => `<li>${factor}</li>`).join('') : 
                                '<li>None identified</li>'
                            }
                        </ul>
                    </div>
                </div>

                <div class="earth-comparison" style="margin-bottom: 1.5rem; padding: 1rem; background: rgba(186, 148, 79, 0.1); border-radius: 6px;">
                    <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem; margin-bottom: 0.5rem;">🌎 Comparison to Earth:</div>
                    <div style="color: #e0e0e0;">${analysis.earthComparison}</div>
                </div>

                ${analysis.recommendations ? `
                    <div class="recommendations" style="padding: 1rem; background: rgba(139, 92, 246, 0.1); border-left: 3px solid #8b5cf6; border-radius: 6px;">
                        <div style="color: #8b5cf6; font-weight: 600; margin-bottom: 0.5rem;">💡 Recommendations:</div>
                        <div style="color: #e0e0e0;">${analysis.recommendations}</div>
                    </div>
                ` : ''}

                ${analysis.isFallback ? `
                    <div style="margin-top: 1rem; padding: 0.75rem; background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.3); border-radius: 6px; color: #fbbf24; font-size: 0.85rem;">
                        ⚠️ Using heuristic-based analysis. Configure Gemini API key for AI-powered analysis.
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Get analysis history
     */
    getAnalysisHistory() {
        const stored = localStorage.getItem('habitability-analysis-history');
        return stored ? JSON.parse(stored) : [];
    }

    /**
     * Save analysis to history
     */
    saveAnalysisToHistory(analysis) {
        const history = this.getAnalysisHistory();
        history.unshift({
            ...analysis,
            savedAt: new Date().toISOString()
        });
        // Keep only last 30 analyses
        if (history.length > 30) {
            history.pop();
        }
        localStorage.setItem('habitability-analysis-history', JSON.stringify(history));
    }

    /**
     * Compare multiple planets
     */
    async comparePlanets(planetDataArray) {
        const analyses = [];
        for (const planet of planetDataArray) {
            const analysis = await this.analyzeHabitability(planet);
            analyses.push(analysis);
            // Save each to history
            this.saveAnalysisToHistory(analysis);
        }
        return analyses;
    }

    /**
     * Enhanced analysis with detailed metrics
     */
    async analyzeWithMetrics(planetData) {
        const analysis = await this.analyzeHabitability(planetData);
        
        // Add detailed metrics
        analysis.detailedMetrics = {
            temperatureSuitability: this.calculateTemperatureSuitability(planetData),
            atmosphericPressure: this.estimateAtmosphericPressure(planetData),
            gravity: this.calculateGravity(planetData),
            dayLength: this.estimateDayLength(planetData)
        };

        // Save to history
        this.saveAnalysisToHistory(analysis);

        return analysis;
    }

    /**
     * Calculate temperature suitability (0-100)
     */
    calculateTemperatureSuitability(planetData) {
        const temp = parseFloat(planetData.koi_teq || planetData.temperature);
        if (!temp) return 50; // Unknown

        // Ideal range: 0-50°C (273-323K)
        if (temp >= 273 && temp <= 323) return 100;
        if (temp >= 250 && temp <= 350) return 75;
        if (temp >= 200 && temp <= 400) return 50;
        return 25;
    }

    /**
     * Estimate atmospheric pressure
     */
    estimateAtmosphericPressure(planetData) {
        const radius = parseFloat(planetData.radius);
        if (!radius) return 'Unknown';

        // Rough estimate based on size
        if (radius < 1.5) return 'Earth-like';
        if (radius < 3) return 'Moderate';
        if (radius < 6) return 'High';
        return 'Very High';
    }

    /**
     * Calculate surface gravity
     */
    calculateGravity(planetData) {
        const mass = parseFloat(planetData.mass);
        const radius = parseFloat(planetData.radius);
        if (!mass || !radius) return 'Unknown';

        // g = GM/r² (relative to Earth)
        const gravity = (mass / (radius * radius)).toFixed(2);
        return `${gravity}g`;
    }

    /**
     * Estimate day length
     */
    estimateDayLength(planetData) {
        const period = parseFloat(planetData.koi_period);
        if (!period) return 'Unknown';

        // Assume tidally locked if very close, otherwise estimate
        if (period < 10) return 'Tidally locked';
        if (period < 50) return 'Short day (< 24h)';
        if (period < 200) return 'Earth-like';
        return 'Long day (> 24h)';
    }

    /**
     * Display habitability dashboard
     */
    displayDashboard(container) {
        if (!container) return;

        const history = this.getAnalysisHistory();
        const recentAnalyses = history.slice(0, 10);

        container.innerHTML = `
            <div class="habitability-dashboard" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem;">
                <div class="dashboard-header" style="margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 2px solid rgba(186, 148, 79, 0.3);">
                    <h3 style="color: #ba944f; margin: 0 0 0.5rem 0;">🌍 AI Habitability Analysis Dashboard</h3>
                    <p style="color: rgba(255, 255, 255, 0.7); margin: 0;">Analyze planet habitability potential using AI</p>
                </div>

                <div class="analysis-form" style="background: rgba(186, 148, 79, 0.1); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 10px; padding: 1.5rem; margin-bottom: 2rem;">
                    <h4 style="color: #ba944f; margin: 0 0 1rem 0;">Analyze Planet</h4>
                    <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                        <input type="text" id="planet-kepid-input" placeholder="Enter KEPID or planet name" style="flex: 1; min-width: 200px; padding: 0.75rem; background: rgba(0, 0, 0, 0.5); border: 1px solid rgba(186, 148, 79, 0.5); border-radius: 8px; color: white; font-size: 1rem;">
                        <button onclick="window.aiHabitabilityAnalysis.runQuickAnalysis()" style="background: rgba(186, 148, 79, 0.3); border: 2px solid rgba(186, 148, 79, 0.5); color: #ba944f; padding: 0.75rem 2rem; border-radius: 8px; cursor: pointer; font-weight: 600;">
                            🔬 Analyze
                        </button>
                    </div>
                    <div id="quick-analysis-result" style="margin-top: 1rem;"></div>
                </div>

                ${recentAnalyses.length > 0 ? `
                    <div class="analysis-history">
                        <h4 style="color: #ba944f; margin: 0 0 1rem 0;">📜 Recent Analyses</h4>
                        <div class="history-list" style="display: flex; flex-direction: column; gap: 1rem;">
                            ${recentAnalyses.map(analysis => {
                                const scoreColor = analysis.habitabilityScore >= 70 ? '#4ade80' : 
                                                  analysis.habitabilityScore >= 40 ? '#fbbf24' : '#ef4444';
                                return `
                                    <div style="background: rgba(186, 148, 79, 0.1); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 10px; padding: 1rem;">
                                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                                            <h5 style="color: #ba944f; margin: 0;">${this.escapeHtml(analysis.planetName || 'Unknown')}</h5>
                                            <span style="background: ${scoreColor}; color: white; padding: 0.5rem 1rem; border-radius: 12px; font-weight: 600;">
                                                ${analysis.habitabilityScore}%
                                            </span>
                                        </div>
                                        <div style="display: flex; gap: 1rem; font-size: 0.9rem; color: rgba(255, 255, 255, 0.7);">
                                            <span>Zone: ${analysis.habitableZone}</span>
                                            <span>Water: ${analysis.liquidWaterPotential}</span>
                                            <span>Life: ${analysis.lifePotential}</span>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                ` : `
                    <div style="text-align: center; padding: 3rem; color: rgba(255, 255, 255, 0.5);">
                        <p>No analyses yet. Enter a planet KEPID above to get started!</p>
                    </div>
                `}
            </div>
        `;
    }

    /**
     * Run quick analysis
     */
    async runQuickAnalysis() {
        const input = document.getElementById('planet-kepid-input');
        const resultDiv = document.getElementById('quick-analysis-result');
        if (!input || !resultDiv) return;

        const kepid = input.value.trim();
        if (!kepid) {
            resultDiv.innerHTML = '<p style="color: #ef4444;">Please enter a planet KEPID or name</p>';
            return;
        }

        resultDiv.innerHTML = '<p style="color: #ba944f;">🤖 Analyzing planet habitability...</p>';

        // Try to get planet data from database
        let planetData = null;
        if (window.databaseInstance || window.KEPLER_DATABASE) {
            const database = window.databaseInstance?.exoplanets || window.KEPLER_DATABASE || [];
            planetData = database.find(p => 
                p.kepid === kepid || 
                p.kepler_name === kepid || 
                p.kepoi_name === kepid
            );
        }

        if (!planetData) {
            planetData = {
                kepid: kepid,
                name: kepid,
                kepler_name: kepid
            };
        }

        try {
            const analysis = await this.analyzeWithMetrics(planetData);
            this.displayAnalysis(analysis, resultDiv);
            // Refresh dashboard
            const container = document.getElementById('habitability-analysis-container');
            if (container) {
                this.displayDashboard(container);
            }
        } catch (error) {
            resultDiv.innerHTML = `<p style="color: #ef4444;">Error: ${error.message}</p>`;
        }
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize AI habitability analysis
if (typeof window !== 'undefined') {
    window.AIHabitabilityAnalysis = AIHabitabilityAnalysis;
    window.aiHabitabilityAnalysis = new AIHabitabilityAnalysis();
}
