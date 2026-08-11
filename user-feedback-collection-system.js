/**
 * User Feedback Collection System
 * 
 * Adds comprehensive user feedback collection system.
 * 
 * @module UserFeedbackCollectionSystem
 * @version 1.0.0
 * @author Adriano To The Star
 */

class UserFeedbackCollectionSystem {
    constructor() {
        this.feedbackQueue = [];
        this.endpoint = null;
        this.isInitialized = false;
    }

    /**
     * Initialize feedback system
     * @public
     * @param {Object} options - Configuration options
     */
    init(options = {}) {
        if (this.isInitialized) {
            console.warn('UserFeedbackCollectionSystem already initialized');
            return;
        }

        this.endpoint = options.endpoint || null;
        this.createFeedbackWidget();
        this.setupContextualFeedback();
        
        this.isInitialized = true;
        console.log('✅ User Feedback Collection System initialized');
    }

    /**
     * Create feedback widget
     * @private
     */
    createFeedbackWidget() {
        const widget = document.createElement('div');
        widget.id = 'feedback-widget';
        widget.className = 'feedback-widget';
        widget.innerHTML = `
            <button class="feedback-trigger" aria-label="Provide Feedback">💬</button>
            <div class="feedback-modal" style="display: none;">
                <div class="feedback-modal-content">
                    <h3>Share Your Feedback</h3>
                    <form id="feedback-form">
                        <div class="feedback-rating">
                            <label>How would you rate your experience?</label>
                            <div class="rating-stars">
                                ${[1, 2, 3, 4, 5].map(i => `<span class="star" data-rating="${i}">⭐</span>`).join('')}
                            </div>
                        </div>
                        <textarea id="feedback-text" placeholder="Tell us what you think..." rows="5"></textarea>
                        <div class="feedback-actions">
                            <button type="submit">Submit</button>
                            <button type="button" class="feedback-cancel">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(widget);

        // Event listeners
        widget.querySelector('.feedback-trigger').addEventListener('click', () => {
            this.showFeedbackModal();
        });

        widget.querySelector('.feedback-cancel').addEventListener('click', () => {
            this.hideFeedbackModal();
        });

        widget.querySelector('#feedback-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitFeedback();
        });

        // Rating stars
        widget.querySelectorAll('.star').forEach(star => {
            star.addEventListener('click', () => {
                const rating = parseInt(star.dataset.rating);
                this.setRating(rating);
            });
        });
    }

    /**
     * Set up contextual feedback
     * @private
     */
    setupContextualFeedback() {
        // Add feedback buttons to key actions
        document.addEventListener('click', (e) => {
            const target = e.target;
            if (target.classList.contains('feedback-contextual')) {
                this.showContextualFeedback(target);
            }
        });
    }

    /**
     * Show feedback modal
     * @private
     */
    showFeedbackModal() {
        const modal = document.querySelector('.feedback-modal');
        if (modal) {
            modal.style.display = 'block';
        }
    }

    /**
     * Hide feedback modal
     * @private
     */
    hideFeedbackModal() {
        const modal = document.querySelector('.feedback-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * Set rating
     * @private
     * @param {number} rating - Rating value
     */
    setRating(rating) {
        const stars = document.querySelectorAll('.star');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    /**
     * Submit feedback
     * @private
     */
    async submitFeedback() {
        const text = document.getElementById('feedback-text').value;
        const stars = document.querySelectorAll('.star.active');
        const rating = stars.length;

        const feedback = {
            rating,
            text,
            url: window.location.href,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        };

        this.feedbackQueue.push(feedback);

        // Send to endpoint
        if (this.endpoint) {
            await this.sendFeedback(feedback);
        } else {
            // Save locally
            this.saveFeedback(feedback);
        }

        this.hideFeedbackModal();
        this.showThankYou();
    }

    /**
     * Send feedback
     * @private
     * @param {Object} feedback - Feedback object
     */
    async sendFeedback(feedback) {
        try {
            await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(feedback)
            });
        } catch (error) {
            console.warn('Failed to send feedback:', error);
            this.saveFeedback(feedback);
        }
    }

    /**
     * Save feedback locally
     * @private
     * @param {Object} feedback - Feedback object
     */
    saveFeedback(feedback) {
        try {
            const saved = JSON.parse(localStorage.getItem('user-feedback') || '[]');
            saved.push(feedback);
            localStorage.setItem('user-feedback', JSON.stringify(saved));
        } catch (e) {
            console.warn('Failed to save feedback:', e);
        }
    }

    /**
     * Show thank you message
     * @private
     */
    showThankYou() {
        if (window.notifications) {
            window.notifications.notify('Thank you!', {
                body: 'Your feedback has been received.',
                channels: ['toast'],
                priority: 'success'
            });
        }
    }

    /**
     * Inject required styles
     * @private
     */
    injectStyles() {
        if (document.getElementById('feedback-system-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'feedback-system-styles';
        style.textContent = `
            .feedback-widget {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 10000;
            }

            .feedback-trigger {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: #ba944f;
                color: white;
                border: none;
                font-size: 24px;
                cursor: pointer;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
            }

            .feedback-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10001;
            }

            .feedback-modal-content {
                background: rgba(0, 0, 0, 0.9);
                padding: 2rem;
                border-radius: 8px;
                max-width: 500px;
                width: 90%;
            }

            .rating-stars {
                display: flex;
                gap: 8px;
                margin: 1rem 0;
            }

            .star {
                font-size: 2rem;
                cursor: pointer;
                opacity: 0.5;
                transition: opacity 0.2s;
            }

            .star.active {
                opacity: 1;
            }

            #feedback-text {
                width: 100%;
                padding: 0.75rem;
                border-radius: 4px;
                border: 1px solid rgba(255, 255, 255, 0.3);
                background: rgba(255, 255, 255, 0.1);
                color: white;
                margin: 1rem 0;
            }

            .feedback-actions {
                display: flex;
                gap: 1rem;
                justify-content: flex-end;
            }

            .feedback-actions button {
                padding: 0.5rem 1.5rem;
                border-radius: 4px;
                border: none;
                cursor: pointer;
            }
        `;
        document.head.appendChild(style);
    }
}

// Create global instance
window.UserFeedbackCollectionSystem = UserFeedbackCollectionSystem;
window.userFeedback = new UserFeedbackCollectionSystem();
window.userFeedback.init();

