/**
 * Adaptive Learning System
 * Dynamic difficulty adjustment based on student performance
 * @author Agent 3 - Adriano To The Star
 */

class AdaptiveLearning {
    constructor() {
        this.studentProfile = null;
        this.performanceHistory = [];
        this.difficultyLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
        this.currentDifficulty = 'beginner';
        this.adaptationRules = this.initializeAdaptationRules();
        this.init();
    }

    init() {
        this.loadStudentProfile();
        this.setupPerformanceTracking();
        this.createAdaptiveInterface();
        this.trackEvent('adaptive_learning_initialized');
    }

    loadStudentProfile() {
        const saved = localStorage.getItem('adaptive-profile');
        if (saved) {
            this.studentProfile = JSON.parse(saved);
        } else {
            this.studentProfile = {
                strengths: [],
                weaknesses: [],
                learningPace: 'normal',
                preferredDifficulty: 'auto',
                performanceMetrics: {
                    accuracy: 0,
                    speed: 0,
                    consistency: 0,
                    improvement: 0
                }
            };
        }
    }

    initializeAdaptationRules() {
        return {
            accuracy: {
                high: { threshold: 0.85, action: 'increase_difficulty' },
                medium: { threshold: 0.65, action: 'maintain' },
                low: { threshold: 0.45, action: 'decrease_difficulty' }
            },
            speed: {
                fast: { threshold: 0.8, action: 'increase_complexity' },
                normal: { threshold: 0.5, action: 'maintain' },
                slow: { threshold: 0.3, action: 'simplify_content' }
            },
            consistency: {
                stable: { threshold: 0.75, action: 'advance' },
                variable: { threshold: 0.5, action: 'practice_more' },
                struggling: { threshold: 0.3, action: 'review_basics' }
            }
        };
    }

    createAdaptiveInterface() {
        const interfaceElement = document.createElement('div');
        interfaceElement.id = 'adaptive-learning-interface';
        interfaceElement.innerHTML = `
            <div class="adaptive-container">
                <div class="adaptive-header">
                    <h3>🧠 Adaptive Learning</h3>
                    <div class="difficulty-indicator">
                        <span class="current-difficulty">Current: ${this.currentDifficulty}</span>
                        <button class="difficulty-settings">⚙️</button>
                    </div>
                </div>
                
                <div class="performance-dashboard">
                    <div class="performance-metrics">
                        <div class="metric">
                            <span class="metric-label">Accuracy</span>
                            <div class="metric-bar">
                                <div class="metric-fill" style="width: ${this.getPerformanceMetric('accuracy')}%"></div>
                            </div>
                            <span class="metric-value">${this.getPerformanceMetric('accuracy')}%</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Speed</span>
                            <div class="metric-bar">
                                <div class="metric-fill" style="width: ${this.getPerformanceMetric('speed')}%"></div>
                            </div>
                            <span class="metric-value">${this.getPerformanceMetric('speed')}%</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Consistency</span>
                            <div class="metric-bar">
                                <div class="metric-fill" style="width: ${this.getPerformanceMetric('consistency')}%"></div>
                            </div>
                            <span class="metric-value">${this.getPerformanceMetric('consistency')}%</span>
                        </div>
                    </div>
                </div>
                
                <div class="adaptation-log">
                    <h4>Recent Adaptations</h4>
                    <div class="adaptation-events" id="adaptation-events">
                        <div class="adaptation-event">
                            <span class="event-time">Just now</span>
                            <span class="event-description">System initialized</span>
                        </div>
                    </div>
                </div>
                
                <div class="adaptive-controls">
                    <button class="test-adaptation">Test Adaptation</button>
                    <button class="reset-adaptive">Reset Progress</button>
                    <button class="manual-adjust">Manual Adjust</button>
                </div>
            </div>
        `;

        document.body.appendChild(interfaceElement);
        this.addAdaptiveStyles();
        this.setupAdaptiveEvents();
    }

    getPerformanceMetric(metric) {
        return Math.round(this.studentProfile.performanceMetrics[metric] * 100);
    }

    trackPerformance(activity, result) {
        const performance = {
            activity,
            result,
            timestamp: new Date().toISOString(),
            difficulty: this.currentDifficulty,
            timeSpent: result.timeSpent || 0,
            accuracy: result.accuracy || 0,
            attempts: result.attempts || 1
        };

        this.performanceHistory.push(performance);
        this.trackEvent('performance_tracked', { activity, accuracy: result.accuracy, difficulty: this.currentDifficulty });
        this.analyzePerformance();
        this.adaptDifficulty();
        this.updateInterface();
    }

    analyzePerformance() {
        const recent = this.performanceHistory.slice(-10);

        if (recent.length === 0) return;

        // Calculate metrics
        const avgAccuracy = recent.reduce((sum, p) => sum + p.accuracy, 0) / recent.length;
        const avgSpeed = recent.reduce((sum, p) => sum + (1 / (p.timeSpent || 1)), 0) / recent.length;
        const consistency = this.calculateConsistency(recent);

        // Update student profile
        this.studentProfile.performanceMetrics = {
            accuracy: avgAccuracy,
            speed: Math.min(avgSpeed, 1),
            consistency: consistency,
            improvement: this.calculateImprovement()
        };

        this.saveStudentProfile();
    }

    calculateConsistency(recent) {
        if (recent.length < 3) return 0.5;

        const accuracies = recent.map(p => p.accuracy);
        const mean = accuracies.reduce((sum, a) => sum + a, 0) / accuracies.length;
        const variance = accuracies.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) / accuracies.length;

        return Math.max(0, Math.min(1, 1 - variance));
    }

    calculateImprovement() {
        if (this.performanceHistory.length < 5) return 0.5;

        const old = this.performanceHistory.slice(-10, -5);
        const recent = this.performanceHistory.slice(-5);

        const oldAvg = old.reduce((sum, p) => sum + p.accuracy, 0) / old.length;
        const recentAvg = recent.reduce((sum, p) => sum + p.accuracy, 0) / recent.length;

        return Math.max(0, Math.min(1, (recentAvg - oldAvg) / 0.5 + 0.5));
    }

    adaptDifficulty() {
        const metrics = this.studentProfile.performanceMetrics;
        let adaptations = [];

        // Check accuracy
        const accuracyAction = this.getAdaptationAction('accuracy', metrics.accuracy);
        if (accuracyAction) adaptations.push(accuracyAction);

        // Check speed
        const speedAction = this.getAdaptationAction('speed', metrics.speed);
        if (speedAction) adaptations.push(speedAction);

        // Check consistency
        const consistencyAction = this.getAdaptationAction('consistency', metrics.consistency);
        if (consistencyAction) adaptations.push(consistencyAction);

        // Apply adaptations
        adaptations.forEach(action => {
            this.applyAdaptation(action);
        });
    }

    getAdaptationAction(metric, value) {
        const rules = this.adaptationRules[metric];

        for (const [level, rule] of Object.entries(rules)) {
            if (value >= rule.threshold) {
                return { type: metric, level, action: rule.action, value };
            }
        }

        return null;
    }

    applyAdaptation(adaptation) {
        const oldDifficulty = this.currentDifficulty;

        switch (adaptation.action) {
            case 'increase_difficulty':
                this.increaseDifficulty();
                break;
            case 'decrease_difficulty':
                this.decreaseDifficulty();
                break;
            case 'increase_complexity':
                this.adjustComplexity('increase');
                break;
            case 'simplify_content':
                this.adjustComplexity('decrease');
                break;
            case 'advance':
                this.advanceToNextLevel();
                break;
            case 'practice_more':
                this.suggestMorePractice();
                break;
            case 'review_basics':
                this.suggestReview();
                break;
        }

        if (oldDifficulty !== this.currentDifficulty) {
            this.trackEvent('difficulty_changed', { from: oldDifficulty, to: this.currentDifficulty, reason: adaptation.action });
            this.logAdaptation(adaptation, oldDifficulty);
        }
    }

    increaseDifficulty() {
        const currentIndex = this.difficultyLevels.indexOf(this.currentDifficulty);
        if (currentIndex < this.difficultyLevels.length - 1) {
            this.currentDifficulty = this.difficultyLevels[currentIndex + 1];
        }
    }

    decreaseDifficulty() {
        const currentIndex = this.difficultyLevels.indexOf(this.currentDifficulty);
        if (currentIndex > 0) {
            this.currentDifficulty = this.difficultyLevels[currentIndex - 1];
        }
    }

    adjustComplexity(direction) {
        // Adjust content complexity within current difficulty
        console.log(`Adjusting complexity ${direction}`);
    }

    advanceToNextLevel() {
        this.increaseDifficulty();
        this.showAdvancementNotification();
    }

    suggestMorePractice() {
        this.showPracticeRecommendation();
    }

    suggestReview() {
        this.showReviewRecommendation();
    }

    logAdaptation(adaptation, oldDifficulty) {
        const event = {
            timestamp: new Date().toISOString(),
            type: adaptation.type,
            action: adaptation.action,
            oldDifficulty,
            newDifficulty: this.currentDifficulty,
            metricValue: adaptation.value
        };

        this.addAdaptationEvent(event);
    }

    addAdaptationEvent(event) {
        const eventsContainer = document.getElementById('adaptation-events');
        const eventElement = document.createElement('div');
        eventElement.className = 'adaptation-event';
        eventElement.innerHTML = `
            <span class="event-time">${this.formatTime(event.timestamp)}</span>
            <span class="event-description">${this.formatAdaptationEvent(event)}</span>
        `;

        eventsContainer.insertBefore(eventElement, eventsContainer.firstChild);

        // Keep only last 10 events
        while (eventsContainer.children.length > 10) {
            eventsContainer.removeChild(eventsContainer.lastChild);
        }
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
        return date.toLocaleTimeString();
    }

    formatAdaptationEvent(event) {
        switch (event.action) {
            case 'increase_difficulty':
                return `Difficulty increased to ${event.newDifficulty}`;
            case 'decrease_difficulty':
                return `Difficulty decreased to ${event.newDifficulty}`;
            case 'increase_complexity':
                return 'Content complexity increased';
            case 'simplify_content':
                return 'Content simplified';
            case 'advance':
                return 'Advanced to next level';
            case 'practice_more':
                return 'Recommended more practice';
            case 'review_basics':
                return 'Recommended basic review';
            default:
                return 'Adaptation applied';
        }
    }

    showAdvancementNotification() {
        this.showNotification('🎉 Level Up!', `You've advanced to ${this.currentDifficulty} difficulty!`);
    }

    showPracticeRecommendation() {
        this.showNotification('💪 Practice Time', 'Additional practice recommended to strengthen your understanding.');
    }

    showReviewRecommendation() {
        this.showNotification('📚 Review Needed', 'Let\'s review some basic concepts to build a stronger foundation.');
    }

    showNotification(title, message) {
        const notification = document.createElement('div');
        notification.className = 'adaptive-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <h4>${title}</h4>
                <p>${message}</p>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('visible');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('visible');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    updateInterface() {
        // Update difficulty indicator
        document.querySelector('.current-difficulty').textContent = `Current: ${this.currentDifficulty}`;

        // Update performance metrics
        const metrics = ['accuracy', 'speed', 'consistency'];
        metrics.forEach(metric => {
            const value = this.getPerformanceMetric(metric);
            const fill = document.querySelector(`.metric:nth-child(${metrics.indexOf(metric) + 1}) .metric-fill`);
            const valueSpan = document.querySelector(`.metric:nth-child(${metrics.indexOf(metric) + 1}) .metric-value`);

            if (fill) fill.style.width = `${value}%`;
            if (valueSpan) valueSpan.textContent = `${value}%`;
        });
    }

    setupAdaptiveEvents() {
        // Test adaptation button
        document.querySelector('.test-adaptation').addEventListener('click', () => {
            this.testAdaptation();
        });

        // Reset button
        document.querySelector('.reset-adaptive').addEventListener('click', () => {
            this.resetProgress();
        });

        // Manual adjust button
        document.querySelector('.manual-adjust').addEventListener('click', () => {
            this.openManualAdjustment();
        });
    }

    testAdaptation() {
        // Simulate performance data
        const testData = [
            { accuracy: 0.9, timeSpent: 30, attempts: 1 },
            { accuracy: 0.85, timeSpent: 45, attempts: 1 },
            { accuracy: 0.75, timeSpent: 60, attempts: 2 }
        ];

        testData.forEach((data, index) => {
            setTimeout(() => {
                this.trackPerformance('test-activity', data);
            }, index * 500);
        });

        this.showNotification('🧪 Test Mode', 'Simulating performance data to test adaptation system.');
    }

    resetProgress() {
        if (confirm('Are you sure you want to reset all adaptive learning progress?')) {
            this.performanceHistory = [];
            this.currentDifficulty = 'beginner';
            this.studentProfile = {
                strengths: [],
                weaknesses: [],
                learningPace: 'normal',
                preferredDifficulty: 'auto',
                performanceMetrics: {
                    accuracy: 0,
                    speed: 0,
                    consistency: 0,
                    improvement: 0
                }
            };

            this.saveStudentProfile();
            this.updateInterface();

            // Clear adaptation log
            document.getElementById('adaptation-events').innerHTML = `
                <div class="adaptation-event">
                    <span class="event-time">Just now</span>
                    <span class="event-description">Progress reset</span>
                </div>
            `;

            this.showNotification('🔄 Reset Complete', 'All adaptive learning progress has been reset.');
        }
    }

    openManualAdjustment() {
        const modal = document.createElement('div');
        modal.className = 'adaptive-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Manual Difficulty Adjustment</h3>
                    <button class="close-modal">×</button>
                </div>
                <div class="modal-body">
                    <div class="difficulty-selector">
                        <label>Select Difficulty Level:</label>
                        <select id="manual-difficulty">
                            ${this.difficultyLevels.map(level =>
            `<option value="${level}" ${level === this.currentDifficulty ? 'selected' : ''}>${level}</option>`
        ).join('')}
                        </select>
                    </div>
                    <div class="pace-selector">
                        <label>Learning Pace:</label>
                        <select id="learning-pace">
                            <option value="slow">Slow</option>
                            <option value="normal" selected>Normal</option>
                            <option value="fast">Fast</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="apply-adjustment">Apply Changes</button>
                    <button class="cancel-adjustment">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Setup modal events
        modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
        modal.querySelector('.cancel-adjustment').addEventListener('click', () => modal.remove());

        modal.querySelector('.apply-adjustment').addEventListener('click', () => {
            const newDifficulty = modal.querySelector('#manual-difficulty').value;
            const newPace = modal.querySelector('#learning-pace').value;

            this.currentDifficulty = newDifficulty;
            this.studentProfile.learningPace = newPace;
            this.saveStudentProfile();
            this.updateInterface();

            modal.remove();
            this.showNotification('✅ Settings Updated', 'Difficulty and pace settings have been updated.');
        });
    }

    saveStudentProfile() {
        localStorage.setItem('adaptive-profile', JSON.stringify(this.studentProfile));
    }

    setupPerformanceTracking() {
        // Set up automatic performance tracking for learning activities
        this.trackLearningActivities();
    }

    trackLearningActivities() {
        // Monitor quiz completions, simulation performance, etc.
        document.addEventListener('quiz-completed', (e) => {
            this.trackPerformance('quiz', e.detail);
        });

        document.addEventListener('simulation-completed', (e) => {
            this.trackPerformance('simulation', e.detail);
        });

        document.addEventListener('module-completed', (e) => {
            this.trackPerformance('module', e.detail);
        });
    }

    addAdaptiveStyles() {
        if (document.querySelector('#adaptive-learning-styles')) return;

        const style = document.createElement('style');
        style.id = 'adaptive-learning-styles';
        style.textContent = `
            #adaptive-learning-interface {
                position: fixed;
                top: 20px;
                left: 20px;
                width: 350px;
                background: var(--color-surface);
                border-radius: 12px;
                box-shadow: var(--effect-shadow);
                z-index: 10000;
            }
            
            .adaptive-container {
                padding: 20px;
            }
            
            .adaptive-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }
            
            .adaptive-header h3 {
                margin: 0;
                color: var(--color-text);
            }
            
            .difficulty-indicator {
                display: flex;
                align-items: center;
                gap: 10px;
                color: var(--color-text-secondary);
                font-size: 14px;
            }
            
            .difficulty-settings {
                background: none;
                border: none;
                cursor: pointer;
                font-size: 16px;
            }
            
            .performance-dashboard {
                margin-bottom: 20px;
            }
            
            .performance-metrics {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            
            .metric {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .metric-label {
                width: 80px;
                font-size: 12px;
                color: var(--color-text);
            }
            
            .metric-bar {
                flex: 1;
                height: 8px;
                background: var(--color-background);
                border-radius: 4px;
                overflow: hidden;
            }
            
            .metric-fill {
                height: 100%;
                background: var(--color-primary);
                transition: width 0.3s ease;
            }
            
            .metric-value {
                width: 40px;
                text-align: right;
                font-size: 12px;
                color: var(--color-text-secondary);
            }
            
            .adaptation-log {
                margin-bottom: 20px;
            }
            
            .adaptation-log h4 {
                margin: 0 0 10px 0;
                color: var(--color-text);
                font-size: 14px;
            }
            
            .adaptation-events {
                max-height: 120px;
                overflow-y: auto;
            }
            
            .adaptation-event {
                display: flex;
                justify-content: space-between;
                padding: 6px 0;
                font-size: 12px;
                border-bottom: 1px solid var(--color-background);
            }
            
            .event-time {
                color: var(--color-text-secondary);
            }
            
            .event-description {
                color: var(--color-text);
                flex: 1;
                margin-left: 10px;
            }
            
            .adaptive-controls {
                display: flex;
                gap: 8px;
            }
            
            .adaptive-controls button {
                flex: 1;
                padding: 8px;
                background: var(--color-background);
                color: var(--color-text);
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s ease;
            }
            
            .adaptive-controls button:hover {
                background: var(--color-primary);
                color: white;
            }
            
            .adaptive-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--color-primary);
                color: white;
                padding: 16px 20px;
                border-radius: 8px;
                box-shadow: var(--effect-shadow);
                z-index: 10001;
                transform: translateX(100%);
                opacity: 0;
                transition: all 0.3s ease;
            }
            
            .adaptive-notification.visible {
                transform: translateX(0);
                opacity: 1;
            }
            
            .adaptive-notification h4 {
                margin: 0 0 8px 0;
            }
            
            .adaptive-notification p {
                margin: 0;
                font-size: 14px;
            }
            
            .adaptive-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10002;
            }
            
            .modal-content {
                background: var(--color-surface);
                border-radius: 12px;
                width: 400px;
                max-width: 90%;
            }
            
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                border-bottom: 1px solid var(--color-background);
            }
            
            .modal-header h3 {
                margin: 0;
                color: var(--color-text);
            }
            
            .close-modal {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: var(--color-text);
            }
            
            .modal-body {
                padding: 20px;
            }
            
            .difficulty-selector, .pace-selector {
                margin-bottom: 20px;
            }
            
            .difficulty-selector label, .pace-selector label {
                display: block;
                margin-bottom: 8px;
                color: var(--color-text);
            }
            
            .difficulty-selector select, .pace-selector select {
                width: 100%;
                padding: 8px;
                background: var(--color-background);
                color: var(--color-text);
                border: 1px solid var(--color-background);
                border-radius: 4px;
            }
            
            .modal-footer {
                display: flex;
                gap: 10px;
                padding: 20px;
                border-top: 1px solid var(--color-background);
            }
            
            .modal-footer button {
                flex: 1;
                padding: 10px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            
            .apply-adjustment {
                background: var(--color-primary);
                color: white;
            }
            
            .cancel-adjustment {
                background: var(--color-background);
                color: var(--color-text);
            }
        `;
        document.head.appendChild(style);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`adaptive_learning_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'adaptive_learning', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Initialize
window.AdaptiveLearning = AdaptiveLearning;
window.adaptiveLearning = new AdaptiveLearning();
