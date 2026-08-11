/**
 * Planet Trivia Quiz System
 * Educational quizzes about exoplanets
 */

class PlanetTriviaQuiz {
    constructor() {
        this.questions = this.generateQuestions();
        this.currentQuiz = null;
        this.score = 0;
        this.isInitialized = false;
        this.init();
    }

    init() {
        this.isInitialized = true;
        console.log('🧠 Planet Trivia Quiz initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_tt_ri_vi_aq_ui_z_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    generateQuestions() {
        return [
            {
                question: "What is the most common type of exoplanet discovered?",
                options: ["Gas Giants", "Terrestrial", "Super-Earths", "Ice Giants"],
                correct: 0,
                explanation: "Gas giants are the most commonly discovered type of exoplanet because they are easier to detect due to their large size."
            },
            {
                question: "Which method is most commonly used to discover exoplanets?",
                options: ["Direct Imaging", "Transit Method", "Radial Velocity", "Gravitational Microlensing"],
                correct: 1,
                explanation: "The transit method is the most common because it can detect planets by observing the dimming of a star's light when a planet passes in front of it."
            },
            {
                question: "What does 'habitable zone' refer to?",
                options: ["Area where life exists", "Distance from star where liquid water possible", "Region with oxygen", "Zone with Earth-like gravity"],
                correct: 1,
                explanation: "The habitable zone, also called the Goldilocks zone, is the distance from a star where conditions might be right for liquid water to exist on a planet's surface."
            },
            {
                question: "How many exoplanets has the Kepler mission discovered?",
                options: ["Over 2,000", "Over 5,000", "Over 9,000", "Over 12,000"],
                correct: 0,
                explanation: "The Kepler Space Telescope has discovered over 2,000 confirmed exoplanets and thousands more candidates."
            },
            {
                question: "What is a 'Hot Jupiter'?",
                options: ["A gas giant close to its star", "A very large terrestrial planet", "A planet with extreme temperatures", "A planet orbiting a hot star"],
                correct: 0,
                explanation: "Hot Jupiters are gas giant planets that orbit very close to their host stars, resulting in extremely high surface temperatures."
            },
            {
                question: "What year was the first exoplanet discovered?",
                options: ["1989", "1992", "1995", "2000"],
                correct: 1,
                explanation: "The first confirmed exoplanet was discovered in 1992, orbiting a pulsar."
            },
            {
                question: "What is the transit method?",
                options: ["Measuring star wobble", "Observing star dimming", "Direct photography", "Gravity lensing"],
                correct: 1,
                explanation: "The transit method detects exoplanets by observing the periodic dimming of a star's light when a planet passes in front of it."
            },
            {
                question: "What is a 'Super-Earth'?",
                options: ["A planet larger than Earth", "A planet with super powers", "A planet with life", "A planet in another galaxy"],
                correct: 0,
                explanation: "A Super-Earth is an exoplanet that is larger than Earth but smaller than Neptune, typically 1.5 to 10 times Earth's mass."
            },
            {
                question: "Which telescope is primarily used for exoplanet discovery?",
                options: ["Hubble", "Kepler", "James Webb", "Spitzer"],
                correct: 1,
                explanation: "The Kepler Space Telescope was specifically designed to discover exoplanets using the transit method."
            },
            {
                question: "What makes an exoplanet potentially habitable?",
                options: ["Size similar to Earth", "Distance from star allowing liquid water", "Presence of atmosphere", "All of the above"],
                correct: 3,
                explanation: "A potentially habitable exoplanet needs to be in the habitable zone, have a suitable size, and potentially have an atmosphere."
            }
        ];
    }

    startQuiz() {
        this.currentQuiz = {
            questions: [...this.questions],
            currentIndex: 0,
            answers: [],
            startTime: Date.now()
        };
        this.score = 0;
    }

    renderQuiz(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        if (!this.currentQuiz) this.startQuiz();
        const q = this.currentQuiz.questions[this.currentQuiz.currentIndex];
        container.innerHTML = `
            <div class="trivia-quiz" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin: 1rem 0;">
                <h3 style="color: #ba944f; margin: 0 0 1.5rem 0;">🧠 Planet Trivia Quiz</h3>
                <div style="margin-bottom: 1rem;">Question ${this.currentQuiz.currentIndex + 1} of ${this.currentQuiz.questions.length}</div>
                <h4 style="color: #e0e0e0; margin-bottom: 1.5rem;">${q.question}</h4>
                <div class="options">${q.options.map((opt, i) => `
                    <button class="quiz-option" data-index="${i}" style="display: block; width: 100%; padding: 1rem; margin-bottom: 0.5rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: white; cursor: pointer; font-weight: 600;">
                        ${opt}
                    </button>
                `).join('')}</div>
            </div>
        `;
        this.setupQuizListeners();
    }

    setupQuizListeners() {
        document.querySelectorAll('.quiz-option').forEach(btn => {
            btn.addEventListener('click', () => {
                const selected = parseInt(btn.dataset.index);
                const q = this.currentQuiz.questions[this.currentQuiz.currentIndex];
                if (selected === q.correct) this.score++;
                this.currentQuiz.currentIndex++;
                if (this.currentQuiz.currentIndex >= this.currentQuiz.questions.length) {
                    this.showResults();
                } else {
                    this.renderQuiz('quiz-container');
                }
            });
        });
    }

    showResults() {
        const container = document.getElementById('quiz-container');
        if (!container) return;
        const percentage = (this.score / this.currentQuiz.questions.length * 100).toFixed(0);
        const timeElapsed = ((Date.now() - this.currentQuiz.startTime) / 1000).toFixed(0);
        
        // Determine badge/rating
        let rating = '';
        let ratingColor = '#ba944f';
        if (percentage >= 90) {
            rating = '🌟 Expert Astronomer';
            ratingColor = '#4ade80';
        } else if (percentage >= 70) {
            rating = '⭐ Skilled Explorer';
            ratingColor = '#60a5fa';
        } else if (percentage >= 50) {
            rating = '🔭 Learning Explorer';
            ratingColor = '#fbbf24';
        } else {
            rating = '🌌 Beginner Stargazer';
            ratingColor = '#f87171';
        }
        
        container.innerHTML = `
            <div style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; text-align: center;">
                <h3 style="color: #ba944f; margin-bottom: 1rem;">Quiz Complete! 🎉</h3>
                <div style="font-size: 3rem; color: #4ade80; margin: 1rem 0; font-weight: bold;">${this.score}/${this.currentQuiz.questions.length}</div>
                <div style="color: rgba(255, 255, 255, 0.7); font-size: 1.2rem; margin-bottom: 0.5rem;">${percentage}% Correct</div>
                <div style="color: ${ratingColor}; font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem;">${rating}</div>
                <div style="color: rgba(255, 255, 255, 0.6); font-size: 0.9rem; margin-bottom: 1.5rem;">Time: ${timeElapsed} seconds</div>
                
                <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin-top: 1.5rem;">
                    <button id="restart-quiz-btn" style="padding: 0.75rem 1.5rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: white; cursor: pointer; font-weight: 600;">
                        🔄 Try Again
                    </button>
                    <button id="share-results-btn" style="padding: 0.75rem 1.5rem; background: rgba(74, 144, 226, 0.2); border: 2px solid rgba(74, 144, 226, 0.5); border-radius: 10px; color: #4a90e2; cursor: pointer; font-weight: 600;">
                        📱 Share Results
                    </button>
                </div>
            </div>
        `;
        
        document.getElementById('restart-quiz-btn')?.addEventListener('click', () => {
            this.startQuiz();
            this.renderQuiz('quiz-container');
        });
    }
}

if (typeof window !== 'undefined') {
    window.PlanetTriviaQuiz = PlanetTriviaQuiz;
    window.planetTriviaQuiz = new PlanetTriviaQuiz();
}

