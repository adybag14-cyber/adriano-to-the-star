/**
 * Comprehensive Onboarding Flow System
 * 
 * Implements comprehensive onboarding flow for new users.
 * 
 * @module OnboardingFlowSystem
 * @version 1.0.0
 * @author Adriano To The Star
 */

class OnboardingFlowSystem {
    constructor() {
        this.steps = [];
        this.currentStep = 0;
        this.isInitialized = false;
    }

    /**
     * Initialize onboarding system
     * @public
     */
    init() {
        if (this.isInitialized) {
            console.warn('OnboardingFlowSystem already initialized');
            return;
        }

        this.checkIfNewUser();
        this.injectStyles();
        
        this.isInitialized = true;
        console.log('✅ Onboarding Flow System initialized');
    }

    /**
     * Check if new user
     * @private
     */
    checkIfNewUser() {
        const hasCompletedOnboarding = localStorage.getItem('onboarding-completed');
        if (!hasCompletedOnboarding) {
            // Wait a bit for page to load
            setTimeout(() => {
                this.startOnboarding();
            }, 2000);
        }
    }

    /**
     * Start onboarding
     * @public
     */
    startOnboarding() {
        this.setupDefaultSteps();
        this.showOnboarding();
    }

    /**
     * Set up default steps
     * @private
     */
    setupDefaultSteps() {
        this.steps = [
            {
                title: 'Welcome to Adriano To The Star!',
                description: 'Explore exoplanets, chat with AI, and discover the cosmos.',
                image: null,
                action: null
            },
            {
                title: 'Explore Exoplanets',
                description: 'Browse over 1 million exoplanets from NASA\'s Kepler mission.',
                image: null,
                action: () => {
                    window.location.href = 'database.html';
                }
            },
            {
                title: 'Chat with Stellar AI',
                description: 'Get answers about space, planets, and astronomy from our AI assistant.',
                image: null,
                action: () => {
                    window.location.href = 'stellar-ai.html';
                }
            },
            {
                title: 'Claim Your Planet',
                description: 'Find and claim your favorite exoplanet to call your own.',
                image: null,
                action: null
            }
        ];
    }

    /**
     * Show onboarding
     * @private
     */
    showOnboarding() {
        const overlay = document.createElement('div');
        overlay.className = 'onboarding-overlay';
        overlay.innerHTML = this.generateOnboardingHTML();

        document.body.appendChild(overlay);
        this.setupOnboardingEvents(overlay);
    }

    /**
     * Generate onboarding HTML
     * @private
     * @returns {string} HTML string
     */
    generateOnboardingHTML() {
        const step = this.steps[this.currentStep];
        return `
            <div class="onboarding-content">
                <div class="onboarding-step">
                    <h2>${step.title}</h2>
                    <p>${step.description}</p>
                    ${step.image ? `<img src="${step.image}" alt="${step.title}">` : ''}
                </div>
                <div class="onboarding-progress">
                    ${this.steps.map((_, index) => 
                        `<div class="progress-dot ${index === this.currentStep ? 'active' : ''}"></div>`
                    ).join('')}
                </div>
                <div class="onboarding-actions">
                    ${this.currentStep > 0 ? '<button class="onboarding-btn prev">Previous</button>' : ''}
                    <button class="onboarding-btn skip">Skip</button>
                    ${this.currentStep < this.steps.length - 1 
                        ? '<button class="onboarding-btn next">Next</button>' 
                        : '<button class="onboarding-btn finish">Get Started</button>'}
                </div>
            </div>
        `;
    }

    /**
     * Set up onboarding events
     * @private
     * @param {HTMLElement} overlay - Overlay element
     */
    setupOnboardingEvents(overlay) {
        const nextBtn = overlay.querySelector('.next');
        const prevBtn = overlay.querySelector('.prev');
        const skipBtn = overlay.querySelector('.skip');
        const finishBtn = overlay.querySelector('.finish');

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.currentStep++;
                this.updateOnboarding(overlay);
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.currentStep--;
                this.updateOnboarding(overlay);
            });
        }

        if (skipBtn) {
            skipBtn.addEventListener('click', () => {
                this.completeOnboarding(overlay);
            });
        }

        if (finishBtn) {
            finishBtn.addEventListener('click', () => {
                this.completeOnboarding(overlay);
            });
        }
    }

    /**
     * Update onboarding
     * @private
     * @param {HTMLElement} overlay - Overlay element
     */
    updateOnboarding(overlay) {
        overlay.innerHTML = this.generateOnboardingHTML();
        this.setupOnboardingEvents(overlay);

        // Execute step action if available
        const step = this.steps[this.currentStep];
        if (step.action && typeof step.action === 'function') {
            // Don't execute automatically, just show option
        }
    }

    /**
     * Complete onboarding
     * @private
     * @param {HTMLElement} overlay - Overlay element
     */
    completeOnboarding(overlay) {
        localStorage.setItem('onboarding-completed', 'true');
        overlay.remove();
        
        if (window.analytics) {
            window.analytics.track('onboarding_completed');
        }
    }

    /**
     * Inject required styles
     * @private
     */
    injectStyles() {
        if (document.getElementById('onboarding-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'onboarding-styles';
        style.textContent = `
            .onboarding-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.3s ease;
            }

            .onboarding-content {
                background: rgba(0, 0, 0, 0.95);
                color: white;
                padding: 3rem;
                border-radius: 12px;
                max-width: 600px;
                width: 90%;
                text-align: center;
            }

            .onboarding-step h2 {
                margin-bottom: 1rem;
                color: #ba944f;
            }

            .onboarding-progress {
                display: flex;
                justify-content: center;
                gap: 10px;
                margin: 2rem 0;
            }

            .progress-dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.3);
                transition: all 0.3s ease;
            }

            .progress-dot.active {
                background: #ba944f;
                transform: scale(1.2);
            }

            .onboarding-actions {
                display: flex;
                justify-content: center;
                gap: 1rem;
                margin-top: 2rem;
            }

            .onboarding-btn {
                padding: 0.75rem 2rem;
                border-radius: 6px;
                border: none;
                cursor: pointer;
                background: #ba944f;
                color: white;
                font-weight: 600;
                transition: all 0.3s ease;
            }

            .onboarding-btn:hover {
                background: #9a744f;
                transform: translateY(-2px);
            }

            .onboarding-btn.skip {
                background: transparent;
                border: 1px solid rgba(255, 255, 255, 0.3);
            }
        `;
        document.head.appendChild(style);
    }
}

// Create global instance
window.OnboardingFlowSystem = OnboardingFlowSystem;
window.onboarding = new OnboardingFlowSystem();
window.onboarding.init();

