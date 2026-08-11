/**
 * Email Notification System with Templates
 * 
 * Adds comprehensive email notification system with templates.
 * 
 * @module EmailNotificationSystem
 * @version 1.0.0
 * @author Adriano To The Star
 */

class EmailNotificationSystem {
    constructor() {
        this.templates = new Map();
        this.queue = [];
        this.isInitialized = false;
    }

    /**
     * Initialize email notification system
     * @public
     */
    init() {
        if (this.isInitialized) {
            console.warn('EmailNotificationSystem already initialized');
            return;
        }

        this.setupDefaultTemplates();
        this.loadTemplates();
        
        this.isInitialized = true;
        console.log('✅ Email Notification System initialized');
    }

    /**
     * Set up default templates
     * @private
     */
    setupDefaultTemplates() {
        // Welcome email
        this.addTemplate('welcome', {
            subject: 'Welcome to Adriano To The Star!',
            body: `
                <h1>Welcome {{name}}!</h1>
                <p>Thank you for joining our community. We're excited to have you explore the cosmos with us.</p>
                <p>Get started by browsing our exoplanet database or chatting with Stellar AI.</p>
            `,
            text: 'Welcome {{name}}! Thank you for joining our community.'
        });

        // Password reset
        this.addTemplate('password-reset', {
            subject: 'Password Reset Request',
            body: `
                <h1>Password Reset</h1>
                <p>You requested a password reset. Click the link below to reset your password:</p>
                <p><a href="{{resetLink}}">Reset Password</a></p>
                <p>This link will expire in 1 hour.</p>
            `,
            text: 'Password Reset: {{resetLink}}'
        });

        // Notification
        this.addTemplate('notification', {
            subject: '{{title}}',
            body: `
                <h1>{{title}}</h1>
                <p>{{message}}</p>
            `,
            text: '{{title}}: {{message}}'
        });
    }

    /**
     * Add template
     * @public
     * @param {string} name - Template name
     * @param {Object} template - Template configuration
     * @returns {Object} Template object
     */
    addTemplate(name, template) {
        const templateObj = {
            name,
            subject: template.subject || '',
            body: template.body || '',
            text: template.text || template.body,
            ...template
        };

        this.templates.set(name, templateObj);
        this.saveTemplates();

        return templateObj;
    }

    /**
     * Send email
     * @public
     * @param {string} to - Recipient email
     * @param {string} templateName - Template name
     * @param {Object} data - Template data
     * @returns {Promise<Object>} Send result
     */
    async sendEmail(to, templateName, data = {}) {
        const template = this.templates.get(templateName);
        if (!template) {
            throw new Error(`Template '${templateName}' not found`);
        }

        // Render template
        const subject = this.renderTemplate(template.subject, data);
        const htmlBody = this.renderTemplate(template.body, data);
        const textBody = this.renderTemplate(template.text, data);

        // Create email object
        const email = {
            id: Date.now() + Math.random(),
            to,
            subject,
            htmlBody,
            textBody,
            template: templateName,
            sentAt: null,
            status: 'pending'
        };

        // Add to queue
        this.queue.push(email);
        this.saveQueue();

        // Send email (would integrate with email service)
        try {
            await this.sendEmailToService(email);
            email.status = 'sent';
            email.sentAt = new Date().toISOString();
            this.trackEvent('email_sent', { emailId: email.id, template: templateName, to: email.to });
        } catch (error) {
            email.status = 'failed';
            email.error = error.message;
            this.trackEvent('email_failed', { emailId: email.id, template: templateName, to: email.to, error: error.message });
        }

        this.saveQueue();

        return email;
    }

    /**
     * Render template
     * @private
     * @param {string} template - Template string
     * @param {Object} data - Template data
     * @returns {string} Rendered template
     */
    renderTemplate(template, data) {
        let rendered = template;
        Object.entries(data).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            rendered = rendered.replace(regex, String(value));
        });
        return rendered;
    }

    /**
     * Send email to service
     * @private
     * @param {Object} email - Email object
     * @returns {Promise} Send result
     */
    async sendEmailToService(email) {
        // This would integrate with an email service (SendGrid, AWS SES, etc.)
        // For now, log to console
        console.log('Sending email:', {
            to: email.to,
            subject: email.subject
        });

        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(() => resolve({ success: true }), 100);
        });
    }

    /**
     * Get email queue
     * @public
     * @returns {Array} Email queue
     */
    getQueue() {
        return this.queue;
    }

    /**
     * Get template
     * @public
     * @param {string} name - Template name
     * @returns {Object|null} Template object
     */
    getTemplate(name) {
        return this.templates.get(name) || null;
    }

    /**
     * Save templates
     * @private
     */
    saveTemplates() {
        try {
            const templates = Object.fromEntries(this.templates);
            localStorage.setItem('email-templates', JSON.stringify(templates));
        } catch (e) {
            console.warn('Failed to save email templates:', e);
        }
    }

    /**
     * Load templates
     * @private
     */
    loadTemplates() {
        try {
            const saved = localStorage.getItem('email-templates');
            if (saved) {
                const templates = JSON.parse(saved);
                Object.entries(templates).forEach(([name, template]) => {
                    this.templates.set(name, template);
                });
            }
        } catch (e) {
            console.warn('Failed to load email templates:', e);
        }
    }

    /**
     * Save queue
     * @private
     */
    saveQueue() {
        try {
            localStorage.setItem('email-queue', JSON.stringify(this.queue));
        } catch (e) {
            console.warn('Failed to save email queue:', e);
        }
    }

    trackEvent(eventName, data = {}) {
        if (window.performanceMonitoring && typeof window.performanceMonitoring.recordMetric === 'function') {
            try {
                window.performanceMonitoring.recordMetric(`email:${eventName}`, 1, {
                    source: 'email-notification-system',
                    ...data
                });
            } catch (e) {
                console.warn('Failed to record email event:', e);
            }
        }
        if (window.analytics && window.analytics.track) {
            window.analytics.track('Email Event', { event: eventName, ...data });
        }
    }
}

// Create global instance
window.EmailNotificationSystem = EmailNotificationSystem;
window.emailNotifications = new EmailNotificationSystem();
window.emailNotifications.init();

