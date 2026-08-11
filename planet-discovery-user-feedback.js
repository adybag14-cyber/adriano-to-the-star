/**
 * Planet Discovery User Feedback System
 * Collect and manage user feedback and suggestions
 */

class PlanetDiscoveryUserFeedback {
    constructor() {
        this.feedback = [];
        this.init();
    }

    init() {
        this.loadFeedback();
        console.log('💬 User feedback system initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_us_er_fe_ed_ba_ck_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    async submitFeedback(type, message, rating = null, metadata = {}) {
        const feedback = {
            id: `feedback_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
            type: type, // 'bug', 'feature', 'improvement', 'general'
            message: message,
            rating: rating,
            metadata: {
                ...metadata,
                url: window.location.href,
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString()
            }
        };

        this.feedback.push(feedback);

        // Send to Supabase
        if (typeof supabase !== 'undefined' && supabase) {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                
                await supabase
                    .from('user_feedback')
                    .insert({
                        type: feedback.type,
                        message: feedback.message,
                        rating: feedback.rating,
                        metadata: feedback.metadata,
                        user_id: user?.id || null,
                        status: 'pending',
                        created_at: feedback.metadata.timestamp
                    });
            } catch (error) {
                console.error('Error submitting feedback:', error);
            }
        }

        // Store locally
        this.storeFeedback(feedback);

        return feedback;
    }

    storeFeedback(feedback) {
        try {
            const stored = JSON.parse(localStorage.getItem('user-feedback') || '[]');
            stored.push(feedback);
            
            // Keep only last 100 feedback items
            if (stored.length > 100) {
                stored.shift();
            }
            
            localStorage.setItem('user-feedback', JSON.stringify(stored));
        } catch (error) {
            console.error('Error storing feedback:', error);
        }
    }

    loadFeedback() {
        try {
            const stored = localStorage.getItem('user-feedback');
            if (stored) {
                this.feedback = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading feedback:', error);
        }
    }

    getFeedback(type = null) {
        if (type) {
            return this.feedback.filter(f => f.type === type);
        }
        return this.feedback;
    }

    renderFeedbackWidget(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="feedback-widget" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin-top: 2rem;">
                <h3 style="color: #ba944f; margin-bottom: 1.5rem;">💬 Share Your Feedback</h3>
                <form id="feedback-form">
                    <div style="margin-bottom: 1rem;">
                        <label style="color: rgba(255, 255, 255, 0.9); display: block; margin-bottom: 0.5rem;">Feedback Type</label>
                        <select id="feedback-type" required
                            style="width: 100%; padding: 0.75rem; background: rgba(0, 0, 0, 0.5); color: white; border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 5px;">
                            <option value="general">General Feedback</option>
                            <option value="bug">Bug Report</option>
                            <option value="feature">Feature Request</option>
                            <option value="improvement">Improvement Suggestion</option>
                        </select>
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <label style="color: rgba(255, 255, 255, 0.9); display: block; margin-bottom: 0.5rem;">Your Feedback</label>
                        <textarea id="feedback-message" rows="5" required
                            style="width: 100%; padding: 0.75rem; background: rgba(0, 0, 0, 0.5); color: white; border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 5px; resize: vertical;"></textarea>
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <label style="color: rgba(255, 255, 255, 0.9); display: block; margin-bottom: 0.5rem;">Rating (optional)</label>
                        <div id="rating-stars" style="display: flex; gap: 0.5rem;">
                            ${[1, 2, 3, 4, 5].map(i => `
                                <button type="button" class="star-btn" data-rating="${i}" 
                                    style="background: transparent; border: none; font-size: 2rem; color: rgba(255, 255, 255, 0.3); cursor: pointer;">⭐</button>
                            `).join('')}
                        </div>
                    </div>
                    <button type="submit" style="width: 100%; padding: 0.75rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: #ba944f; cursor: pointer; font-weight: 600;">
                        Submit Feedback
                    </button>
                </form>
            </div>
        `;

        let selectedRating = null;
        document.querySelectorAll('.star-btn').forEach((btn, index) => {
            btn.addEventListener('click', () => {
                selectedRating = index + 1;
                document.querySelectorAll('.star-btn').forEach((b, i) => {
                    b.style.color = i <= index ? '#fbbf24' : 'rgba(255, 255, 255, 0.3)';
                });
            });
        });

        document.getElementById('feedback-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const type = document.getElementById('feedback-type').value;
            const message = document.getElementById('feedback-message').value;

            await this.submitFeedback(type, message, selectedRating);

            alert('Thank you for your feedback!');
            document.getElementById('feedback-form').reset();
            selectedRating = null;
            document.querySelectorAll('.star-btn').forEach(b => {
                b.style.color = 'rgba(255, 255, 255, 0.3)';
            });
        });
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscoveryUserFeedback = new PlanetDiscoveryUserFeedback();
}

