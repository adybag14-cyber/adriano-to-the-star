// Enhanced Database Graphics & Search Features
class DatabaseEnhancer {
    constructor() {
        this.init();
    }

    init() {
        this.addHolographicEffect();
        // 3D Planet Viewer removed per user request
        this.enhanceSearchBox();
        this.addFilterAnimations();
        this.createConstellationLines();
        this.addDataStreamEffect();
        this.addSearchHistory();
        this.trackEvent('db_enhanced_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`db_enhanced_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    // Holographic scan effect on cards
    addHolographicEffect() {
        const style = document.createElement('style');
        style.textContent = `
            .planet-card {
                position: relative;
                overflow: hidden;
            }

            .planet-card::before {
                content: '';
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: repeating-linear-gradient(
                    0deg,
                    transparent 0px,
                    rgba(186, 148, 79, 0.03) 1px,
                    transparent 2px,
                    transparent 4px
                );
                animation: holoScan 8s linear infinite;
                pointer-events: none;
                z-index: 1;
            }

            @keyframes holoScan {
                0% { transform: translateY(-100%); }
                100% { transform: translateY(100%); }
            }

            .planet-card .planet-icon {
                animation: rotatePlanet 10s linear infinite;
                display: inline-block;
            }

            @keyframes rotatePlanet {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            /* Enhanced search box with scan lines */
            .search-input {
                position: relative;
                background: rgba(0, 0, 0, 0.7) !important;
                border: 2px solid rgba(186, 148, 79, 0.5) !important;
                box-shadow: 
                    inset 0 0 20px rgba(186, 148, 79, 0.1),
                    0 0 30px rgba(186, 148, 79, 0.3) !important;
            }

            .search-input:focus {
                animation: searchPulse 2s ease-in-out infinite;
                box-shadow: 
                    inset 0 0 30px rgba(186, 148, 79, 0.2),
                    0 0 40px rgba(186, 148, 79, 0.6),
                    0 0 60px rgba(186, 148, 79, 0.4) !important;
            }

            @keyframes searchPulse {
                0%, 100% {
                    box-shadow: 
                        inset 0 0 20px rgba(186, 148, 79, 0.2),
                        0 0 30px rgba(186, 148, 79, 0.5);
                }
                50% {
                    box-shadow: 
                        inset 0 0 30px rgba(186, 148, 79, 0.3),
                        0 0 50px rgba(186, 148, 79, 0.7),
                        0 0 70px rgba(186, 148, 79, 0.5);
                }
            }

            /* Typing indicator */
            .search-input.typing::after {
                content: '';
                position: absolute;
                right: 15px;
                top: 50%;
                transform: translateY(-50%);
                width: 8px;
                height: 8px;
                background: #ba944f;
                border-radius: 50%;
                animation: typingBlink 1s ease-in-out infinite;
            }

            @keyframes typingBlink {
                0%, 100% { opacity: 0; }
                50% { opacity: 1; }
            }

            /* Planet card entrance animation */
            .planet-card {
                animation: cardEntrance 0.6s ease-out backwards;
            }

            .planet-card:nth-child(odd) {
                animation-delay: calc(var(--card-index, 0) * 0.1s);
            }

            .planet-card:nth-child(even) {
                animation-delay: calc(var(--card-index, 0) * 0.1s + 0.05s);
            }

            @keyframes cardEntrance {
                0% {
                    opacity: 0;
                    transform: translateY(50px) rotateX(-20deg);
                }
                100% {
                    opacity: 1;
                    transform: translateY(0) rotateX(0);
                }
            }

            /* Data stream effect */
            .data-stream {
                position: fixed;
                top: 0;
                right: 50px;
                width: 2px;
                height: 100%;
                background: linear-gradient(
                    180deg,
                    transparent 0%,
                    rgba(186, 148, 79, 0.8) 50%,
                    transparent 100%
                );
                opacity: 0.3;
                animation: dataFlow 3s linear infinite;
                pointer-events: none;
                z-index: 1;
            }

            @keyframes dataFlow {
                0% { transform: translateY(-100%); }
                100% { transform: translateY(100%); }
            }

            /* Constellation lines between cards */
            .constellation-line {
                position: absolute;
                height: 1px;
                background: linear-gradient(
                    90deg,
                    transparent,
                    rgba(186, 148, 79, 0.3),
                    transparent
                );
                pointer-events: none;
                animation: lineGlow 2s ease-in-out infinite;
            }

            @keyframes lineGlow {
                0%, 100% { opacity: 0.3; }
                50% { opacity: 0.8; }
            }

            /* 3D Planet Viewer CSS removed - feature no longer available */

            /* Search suggestions */
            .search-suggestions {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: rgba(0, 0, 0, 0.95);
                border: 2px solid rgba(186, 148, 79, 0.3);
                border-top: none;
                border-radius: 0 0 15px 15px;
                max-height: 300px;
                overflow-y: auto;
                z-index: 1000;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);
            }

            .suggestion-item {
                padding: 12px 20px;
                cursor: pointer;
                transition: all 0.3s ease;
                border-bottom: 1px solid rgba(186, 148, 79, 0.1);
            }

            .suggestion-item:hover {
                background: rgba(186, 148, 79, 0.2);
                padding-left: 30px;
            }

            .suggestion-item strong {
                color: #ba944f;
            }
        `;
        document.head.appendChild(style);
    }

    // 3D Planet Viewer has been removed per user request
    // The functionality was located here previously

    // Enhanced search box with suggestions
    enhanceSearchBox() {
        setTimeout(() => {
            const searchBox = document.getElementById('search-box');
            if (!searchBox) return;

            // Add wrapper for suggestions
            const wrapper = document.createElement('div');
            wrapper.style.position = 'relative';
            searchBox.parentNode.insertBefore(wrapper, searchBox);
            wrapper.appendChild(searchBox);

            const suggestions = document.createElement('div');
            suggestions.className = 'search-suggestions';
            suggestions.style.display = 'none';
            wrapper.appendChild(suggestions);

            // Popular searches
            const popularSearches = [
                'Kepler-452b (Earth-like)',
                'TRAPPIST-1e (Habitable zone)',
                'Proxima Centauri b (Nearest)',
                'Kepler-22b (Super-Earth)',
                'HD 209458 b (Hot Jupiter)'
            ];

            searchBox.addEventListener('focus', () => {
                if (searchBox.value === '') {
                    suggestions.innerHTML = `
                        <div style="padding: 10px 20px; color: rgba(255, 255, 255, 0.5); font-size: 0.9rem;">
                            Popular searches:
                        </div>
                        ${popularSearches.map(search => `
                            <div class="suggestion-item" data-search="${search}">
                                🔍 ${search}
                            </div>
                        `).join('')}
                    `;
                    suggestions.style.display = 'block';
                }
            });

            searchBox.addEventListener('blur', () => {
                setTimeout(() => {
                    suggestions.style.display = 'none';
                }, 200);
            });

            suggestions.addEventListener('click', (e) => {
                const item = e.target.closest('.suggestion-item');
                if (item) {
                    searchBox.value = item.dataset.search.split(' ')[0];
                    searchBox.dispatchEvent(new window.Event('input'));
                    suggestions.style.display = 'none';
                }
            });

            // Typing indicator
            let typingTimeout;
            searchBox.addEventListener('input', () => {
                searchBox.classList.add('typing');
                clearTimeout(typingTimeout);
                typingTimeout = setTimeout(() => {
                    searchBox.classList.remove('typing');
                }, 500);
            });
        }, 1000);
    }

    // Add filter animations
    addFilterAnimations() {
        setTimeout(() => {
            const cards = document.querySelectorAll('.planet-card');
            cards.forEach((card, index) => {
                card.style.setProperty('--card-index', index);
            });
        }, 1500);
    }

    // Create constellation lines between cards
    createConstellationLines() {
        setTimeout(() => {
            const grid = document.getElementById('exoplanet-grid');
            if (!grid) return;

            const cards = grid.querySelectorAll('.planet-card');
            if (cards.length < 2) return;

            cards.forEach((card, index) => {
                if (index < cards.length - 1) {
                    const line = document.createElement('div');
                    line.className = 'constellation-line';
                    
                    const rect1 = card.getBoundingClientRect();
                    const rect2 = cards[index + 1].getBoundingClientRect();
                    
                    const length = Math.sqrt(
                        Math.pow(rect2.left - rect1.right, 2) +
                        Math.pow(rect2.top - rect1.bottom, 2)
                    );
                    
                    line.style.width = length + 'px';
                    line.style.left = rect1.right + 'px';
                    line.style.top = rect1.bottom + 'px';
                    
                    grid.appendChild(line);
                }
            });
        }, 2000);
    }

    // Add data stream effect
    addDataStreamEffect() {
        for (let i = 0; i < 3; i++) {
            const stream = document.createElement('div');
            stream.className = 'data-stream';
            stream.style.right = (50 + i * 100) + 'px';
            stream.style.animationDelay = (i * 1) + 's';
            document.body.appendChild(stream);
        }
    }

    // Search history tracking
    addSearchHistory() {
        const history = [];
        setTimeout(() => {
            const searchBox = document.getElementById('search-box');
            if (!searchBox) return;

            searchBox.addEventListener('input', (e) => {
                const term = e.target.value.trim();
                if (term && !history.includes(term)) {
                    history.push(term);
                    console.log('🔍 Search history:', history);
                }
            });
        }, 1000);
    }
}

// Initialize enhanced database features
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new DatabaseEnhancer();
        console.log('💫 Database Enhanced Graphics Loaded!');
    });
} else {
    new DatabaseEnhancer();
    console.log('💫 Database Enhanced Graphics Loaded!');
}
