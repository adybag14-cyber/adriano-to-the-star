/**
 * User Feedback and Bug Reporting Tool
 * Collect user feedback and bug reports
 */
(function() {
    'use strict';

    class UserFeedbackBugReporting {
        constructor() {
            this.feedback = [];
            this.init();
        }

        init() {
            this.setupUI();
        }

        setupUI() {
            if (!document.getElementById('feedback-tool')) {
                const tool = document.createElement('div');
                tool.id = 'feedback-tool';
                tool.className = 'feedback-tool';
                tool.innerHTML = `
                    <button id="feedback-btn">Send Feedback</button>
                `;
                document.body.appendChild(tool);
            }

            document.getElementById('feedback-btn')?.addEventListener('click', () => {
                this.showFeedbackForm();
            });
        }

        showFeedbackForm() {
            const form = document.createElement('div');
            form.className = 'feedback-form';
            form.innerHTML = `
                <h3>Send Feedback</h3>
                <textarea id="feedback-text" placeholder="Your feedback..."></textarea>
                <button id="submit-feedback">Submit</button>
            `;
            document.body.appendChild(form);

            document.getElementById('submit-feedback')?.addEventListener('click', () => {
                const text = document.getElementById('feedback-text').value;
                this.submitFeedback(text);
                form.remove();
            });
        }

        submitFeedback(text) {
            const feedback = {
                id: this.generateId(),
                text: text,
                timestamp: new Date().toISOString(),
                user: this.getCurrentUser()
            };
            this.feedback.push(feedback);
            this.saveFeedback();
        }

        getCurrentUser() {
            return window.supabase?.auth?.user()?.id || 'anonymous';
        }

        generateId() {
            return 'feedback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        saveFeedback() {
            localStorage.setItem('userFeedback', JSON.stringify(this.feedback));
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.userFeedback = new UserFeedbackBugReporting();
        });
    } else {
        window.userFeedback = new UserFeedbackBugReporting();
    }
})();

