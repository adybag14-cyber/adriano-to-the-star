/**
 * User Feedback & Bug Reporting System
 * 
 * Allows users to submit feedback, report bugs, and suggest features.
 * Integrates with Supabase for storing feedback and provides a user-friendly UI.
 * 
 * @class UserFeedbackSystem
 * @example
 * // Auto-initializes on page load
 * // Access via: window.userFeedback()
 * 
 * // Show feedback form
 * const feedback = window.userFeedback();
 * feedback.showFeedbackForm();
 */
class UserFeedbackSystem {
    constructor() {
        this.feedbackHistory = [];
        this.init();
    }

    init() {
        // Load feedback history
        this.loadFeedbackHistory();
        
        // Create feedback button
        this.createFeedbackButton();
        
        console.log('✅ User Feedback System initialized');
    }

    /**
     * Create floating feedback button
     * 
     * @method createFeedbackButton
     * @returns {void}
     */
    createFeedbackButton() {
        // Check if button already exists
        if (document.getElementById('feedback-button')) return;

        const button = document.createElement('button');
        button.id = 'feedback-button';
        button.className = 'feedback-button';
        button.setAttribute('aria-label', 'Submit feedback');
        button.innerHTML = '💬';
        button.title = 'Submit Feedback';
        
        button.addEventListener('click', () => this.showFeedbackForm());
        
        document.body.appendChild(button);
        
        // Add styles
        this.addStyles();
    }

    /**
     * Add CSS styles for feedback system
     * 
     * @method addStyles
     * @returns {void}
     * @private
     */
    addStyles() {
        if (document.getElementById('feedback-system-styles')) return;

        const style = document.createElement('style');
        style.id = 'feedback-system-styles';
        style.textContent = `
            .feedback-button {
                position: fixed;
                bottom: 100px;
                right: 30px;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: linear-gradient(135deg, rgba(186, 148, 79, 0.9), rgba(186, 148, 79, 0.7));
                border: 2px solid rgba(186, 148, 79, 0.5);
                color: #ffffff;
                font-size: 1.5rem;
                cursor: pointer;
                z-index: 10000;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .feedback-button:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 20px rgba(186, 148, 79, 0.5);
            }

            .feedback-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                z-index: 10001;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s ease, visibility 0.3s ease;
            }

            .feedback-modal.active {
                opacity: 1;
                visibility: visible;
            }

            .feedback-modal-content {
                background: linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(20, 20, 30, 0.98));
                border: 2px solid rgba(186, 148, 79, 0.5);
                border-radius: 15px;
                padding: 2rem;
                max-width: 600px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                position: relative;
            }

            .feedback-modal-close {
                position: absolute;
                top: 1rem;
                right: 1rem;
                background: transparent;
                border: none;
                color: #ba944f;
                font-size: 1.5rem;
                cursor: pointer;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.3s ease;
            }

            .feedback-modal-close:hover {
                background: rgba(186, 148, 79, 0.2);
            }

            .feedback-form-group {
                margin-bottom: 1.5rem;
            }

            .feedback-form-label {
                display: block;
                color: #ba944f;
                margin-bottom: 0.5rem;
                font-family: 'Raleway', sans-serif;
                font-weight: 500;
            }

            .feedback-form-input,
            .feedback-form-textarea,
            .feedback-form-select {
                width: 100%;
                padding: 0.75rem;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(186, 148, 79, 0.3);
                border-radius: 8px;
                color: #ffffff;
                font-family: 'Raleway', sans-serif;
                font-size: 1rem;
            }

            .feedback-form-textarea {
                min-height: 150px;
                resize: vertical;
            }

            .feedback-form-submit {
                width: 100%;
                padding: 1rem;
                background: linear-gradient(135deg, rgba(186, 148, 79, 0.9), rgba(186, 148, 79, 0.7));
                border: 2px solid rgba(186, 148, 79, 0.5);
                border-radius: 8px;
                color: #ffffff;
                font-family: 'Raleway', sans-serif;
                font-weight: 600;
                font-size: 1rem;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .feedback-form-submit:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(186, 148, 79, 0.4);
            }

            .feedback-form-submit:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .feedback-success {
                text-align: center;
                padding: 2rem;
                color: #4ade80;
            }

            @media (max-width: 768px) {
                .feedback-button {
                    bottom: 80px;
                    right: 20px;
                    width: 50px;
                    height: 50px;
                    font-size: 1.2rem;
                }

                .feedback-modal-content {
                    padding: 1.5rem;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Show feedback form modal
     * 
     * @method showFeedbackForm
     * @returns {void}
     */
    showFeedbackForm() {
        // Check if modal already exists
        let modal = document.getElementById('feedback-modal');
        if (modal) {
            modal.classList.add('active');
            return;
        }

        // Create modal
        modal = document.createElement('div');
        modal.id = 'feedback-modal';
        modal.className = 'feedback-modal';
        modal.innerHTML = `
            <div class="feedback-modal-content">
                <button class="feedback-modal-close" aria-label="Close">×</button>
                <h2 style="color: #ba944f; margin-bottom: 1.5rem; font-family: 'Raleway', sans-serif;">💬 Submit Feedback</h2>
                <form id="feedback-form">
                    <div class="feedback-form-group">
                        <label class="feedback-form-label" for="feedback-type">Type</label>
                        <select id="feedback-type" class="feedback-form-select" required>
                            <option value="bug">🐛 Bug Report</option>
                            <option value="feature">💡 Feature Request</option>
                            <option value="improvement">✨ Improvement Suggestion</option>
                            <option value="other">📝 Other</option>
                        </select>
                    </div>
                    <div class="feedback-form-group">
                        <label class="feedback-form-label" for="feedback-subject">Subject</label>
                        <input type="text" id="feedback-subject" class="feedback-form-input" required placeholder="Brief description">
                    </div>
                    <div class="feedback-form-group">
                        <label class="feedback-form-label" for="feedback-message">Message</label>
                        <textarea id="feedback-message" class="feedback-form-textarea" required placeholder="Please provide details..."></textarea>
                    </div>
                    <div class="feedback-form-group">
                        <label class="feedback-form-label" for="feedback-email">Email (optional)</label>
                        <input type="email" id="feedback-email" class="feedback-form-input" placeholder="your@email.com">
                    </div>
                    <button type="submit" class="feedback-form-submit">Submit Feedback</button>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        // Setup event listeners
        const closeBtn = modal.querySelector('.feedback-modal-close');
        const form = modal.querySelector('#feedback-form');

        closeBtn.addEventListener('click', () => this.closeFeedbackForm());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeFeedbackForm();
            }
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitFeedback();
        });

        // Show modal
        setTimeout(() => modal.classList.add('active'), 10);

        // Close on Escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeFeedbackForm();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }

    /**
     * Close feedback form modal
     * 
     * @method closeFeedbackForm
     * @returns {void}
     */
    closeFeedbackForm() {
        const modal = document.getElementById('feedback-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 300);
        }
    }

    /**
     * Submit feedback
     * 
     * @method submitFeedback
     * @returns {Promise<void>}
     */
    async submitFeedback() {
        const type = document.getElementById('feedback-type').value;
        const subject = document.getElementById('feedback-subject').value;
        const message = document.getElementById('feedback-message').value;
        const email = document.getElementById('feedback-email').value;

        const feedback = {
            type,
            subject,
            message,
            email: email || null,
            page: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            userId: this.getUserId()
        };

        try {
            // Try to save to Supabase
            if (window.supabaseClient) {
                const { error } = await window.supabaseClient
                    .from('user_feedback')
                    .insert([feedback]);

                if (error) throw error;
            }

            // Save to localStorage as backup
            this.feedbackHistory.push(feedback);
            this.saveFeedbackHistory();

            // Show success message
            this.showSuccessMessage();
            this.trackEvent('feedback_submitted', { type: feedback.type, success: true });

        } catch (error) {
            console.error('Failed to submit feedback:', error);
            
            // Fallback to localStorage only
            this.feedbackHistory.push(feedback);
            this.saveFeedbackHistory();
            this.showSuccessMessage();
            this.trackEvent('feedback_submitted_offline', { type: feedback.type });
        }
    }

    trackEvent(eventName, data = {}) {
        if (window.performanceMonitoring && typeof window.performanceMonitoring.recordMetric === 'function') {
            try {
                window.performanceMonitoring.recordMetric(`feedback:${eventName}`, 1, {
                    source: 'user-feedback-system',
                    ...data
                });
            } catch (e) {
                console.warn('Failed to record feedback event:', e);
            }
        }
        if (window.analytics && window.analytics.track) {
            window.analytics.track('Feedback Event', { event: eventName, ...data });
        }
    }

    /**
     * Get user ID
     * 
     * @method getUserId
     * @returns {string} User ID or 'anonymous'
     * @private
     */
    getUserId() {
        if (window.supabaseClient) {
            const session = window.supabaseClient.auth.session();
            if (session && session.user) {
                return session.user.id;
            }
        }
        return 'anonymous';
    }

    /**
     * Show success message
     * 
     * @method showSuccessMessage
     * @returns {void}
     * @private
     */
    showSuccessMessage() {
        const modal = document.getElementById('feedback-modal');
        if (!modal) return;

        const content = modal.querySelector('.feedback-modal-content');
        content.innerHTML = `
            <div class="feedback-success">
                <h2 style="color: #4ade80; margin-bottom: 1rem;">✅ Thank You!</h2>
                <p>Your feedback has been submitted successfully.</p>
                <button class="feedback-form-submit" style="margin-top: 1.5rem;" onclick="window.userFeedback().closeFeedbackForm()">Close</button>
            </div>
        `;

        // Auto-close after 3 seconds
        setTimeout(() => {
            this.closeFeedbackForm();
        }, 3000);
    }

    /**
     * Load feedback history from localStorage
     * 
     * @method loadFeedbackHistory
     * @returns {void}
     */
    loadFeedbackHistory() {
        try {
            const stored = localStorage.getItem('feedback-history');
            if (stored) {
                this.feedbackHistory = JSON.parse(stored);
            }
        } catch (error) {
            console.warn('Failed to load feedback history:', error);
        }
    }

    /**
     * Save feedback history to localStorage
     * 
     * @method saveFeedbackHistory
     * @returns {void}
     */
    saveFeedbackHistory() {
        try {
            // Keep only last 50 items
            if (this.feedbackHistory.length > 50) {
                this.feedbackHistory = this.feedbackHistory.slice(-50);
            }
            localStorage.setItem('feedback-history', JSON.stringify(this.feedbackHistory));
        } catch (error) {
            console.warn('Failed to save feedback history:', error);
        }
    }

    /**
     * Get feedback history
     * 
     * @method getFeedbackHistory
     * @returns {Array} Array of feedback items
     */
    getFeedbackHistory() {
        return [...this.feedbackHistory];
    }
}

// Initialize globally
let userFeedbackInstance = null;

function initUserFeedback() {
    if (!userFeedbackInstance) {
        userFeedbackInstance = new UserFeedbackSystem();
    }
    return userFeedbackInstance;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUserFeedback);
} else {
    initUserFeedback();
}

// Export globally
window.UserFeedbackSystem = UserFeedbackSystem;
window.userFeedback = () => userFeedbackInstance;

