/**
 * Newsletter Subscription System
 * Email updates about new features and space news
 */

class NewsletterManager {
    constructor() {
        this.supabase = window.supabaseClient;
        this.currentUser = null;
        this.subscriptions = [];
        this.init();
    }

    async init() {
        const container = document.getElementById('newsletter-container');
        if (!container) {
            console.error('Newsletter container not found');
            return;
        }

        // Check authentication
        const { data: { user } } = await this.supabase.auth.getUser();
        this.currentUser = user;

        this.render();
        await this.loadSubscriptions();
    }

    /**
     * Render newsletter UI
     */
    render() {
        const container = document.getElementById('newsletter-container');
        if (!container) return;

        container.innerHTML = `
            <div class="newsletter-manager">
                <div class="newsletter-header">
                    <h2>📧 Newsletter Subscriptions</h2>
                    <p>Get notified about new features, space discoveries, and platform updates</p>
                </div>

                <div class="subscription-form">
                    <h3>Subscribe to Newsletter</h3>
                    <form id="newsletter-form">
                        <div class="form-group">
                            <label for="email">Email Address</label>
                            <input type="email" id="email" 
                                   value="${this.currentUser?.email || ''}" 
                                   ${this.currentUser ? 'readonly' : ''} 
                                   required>
                            ${this.currentUser ? '<small>Using your account email</small>' : ''}
                        </div>
                        <div class="form-group">
                            <label>Newsletter Categories</label>
                            <div class="checkbox-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" name="categories" value="features" checked>
                                    <span>New Features & Updates</span>
                                </label>
                                <label class="checkbox-label">
                                    <input type="checkbox" name="categories" value="discoveries" checked>
                                    <span>Space Discoveries</span>
                                </label>
                                <label class="checkbox-label">
                                    <input type="checkbox" name="categories" value="launches">
                                    <span>Rocket Launches</span>
                                </label>
                                <label class="checkbox-label">
                                    <input type="checkbox" name="categories" value="marketplace">
                                    <span>Marketplace Updates</span>
                                </label>
                                <label class="checkbox-label">
                                    <input type="checkbox" name="categories" value="community">
                                    <span>Community News</span>
                                </label>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="frequency">Email Frequency</label>
                            <select id="frequency" required>
                                <option value="daily">Daily</option>
                                <option value="weekly" selected>Weekly</option>
                                <option value="monthly">Monthly</option>
                                <option value="important">Important Updates Only</option>
                            </select>
                        </div>
                        <button type="submit" class="subscribe-btn">Subscribe</button>
                    </form>
                </div>

                <div class="subscriptions-list" id="subscriptions-list">
                    <h3>Your Subscriptions</h3>
                    <div class="loading-state">Loading subscriptions...</div>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const form = document.getElementById('newsletter-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.subscribe();
            });
        }
    }

    /**
     * Subscribe to newsletter
     */
    async subscribe() {
        const email = document.getElementById('email').value;
        const frequency = document.getElementById('frequency').value;
        const checkboxes = document.querySelectorAll('input[name="categories"]:checked');
        const categories = Array.from(checkboxes).map(cb => cb.value);

        if (!email) {
            alert('Please enter an email address');
            return;
        }

        if (categories.length === 0) {
            alert('Please select at least one newsletter category');
            return;
        }

        try {
            // Check if subscription table exists, if not use localStorage
            const { data: existing, error: checkError } = await this.supabase
                .from('newsletter_subscriptions')
                .select('id')
                .eq('email', email)
                .maybeSingle();
            
            // If table doesn't exist, fallback to localStorage
            if (checkError && checkError.code === '42P01') {
                console.warn('newsletter_subscriptions table not found, using localStorage');
                this.saveToLocalStorage(email, categories, frequency);
                alert('Subscription saved locally. Please run the SQL script in Supabase to enable database storage.');
                await this.loadSubscriptions();
                return;
            }

            if (existing) {
                // Update existing subscription
                const { error } = await this.supabase
                    .from('newsletter_subscriptions')
                    .update({
                        categories: categories,
                        frequency: frequency,
                        status: 'active',
                        updated_at: new Date().toISOString()
                    })
                    .eq('email', email);

                if (error) {
                    if (error.code === '42P01') {
                        // Table doesn't exist, use localStorage
                        this.saveToLocalStorage(email, categories, frequency);
                        alert('Subscription saved locally. Please run the SQL script in Supabase to enable database storage.');
                        await this.loadSubscriptions();
                        return;
                    }
                    throw error;
                }
                alert('Subscription updated successfully!');
            } else {
                // Create new subscription (try Supabase first, fallback to localStorage)
                const { error } = await this.supabase
                    .from('newsletter_subscriptions')
                    .insert({
                        email: email,
                        user_id: this.currentUser?.id || null,
                        categories: categories,
                        frequency: frequency,
                        status: 'active'
                    });

                if (error) {
                    if (error.code === '42P01') {
                        // Table doesn't exist, use localStorage
                        this.saveToLocalStorage(email, categories, frequency);
                        alert('Subscription saved locally. Please run the SQL script in Supabase to enable database storage.');
                        await this.loadSubscriptions();
                        return;
                    }
                    throw error;
                }

                alert('Successfully subscribed to newsletter!');
            }

            await this.loadSubscriptions();
        } catch (error) {
            console.error('Error subscribing:', error);
            // Fallback to localStorage
            this.saveToLocalStorage(email, categories, frequency);
            alert('Subscription saved locally. Please run the SQL script in Supabase to enable database storage.');
            await this.loadSubscriptions();
        }
    }

    /**
     * Save subscription to localStorage (fallback)
     */
    saveToLocalStorage(email, categories, frequency) {
        const subscriptions = JSON.parse(localStorage.getItem('newsletter_subscriptions') || '[]');
        const existing = subscriptions.findIndex(s => s.email === email);
        
        const subscription = {
            email,
            categories,
            frequency,
            status: 'active',
            subscribed_at: new Date().toISOString()
        };

        if (existing >= 0) {
            subscriptions[existing] = subscription;
        } else {
            subscriptions.push(subscription);
        }

        localStorage.setItem('newsletter_subscriptions', JSON.stringify(subscriptions));
    }

    /**
     * Load subscriptions
     */
    async loadSubscriptions() {
        const container = document.getElementById('subscriptions-list');
        if (!container) return;

        try {
            let subscriptions = [];

            // Try Supabase first
            if (this.currentUser) {
                const { data, error } = await this.supabase
                    .from('newsletter_subscriptions')
                    .select('*')
                    .eq('user_id', this.currentUser.id)
                    .eq('status', 'active')
                    .catch(() => ({ data: null, error: null }));

                if (data) {
                    subscriptions = data;
                }
            }

            // Fallback to localStorage
            if (subscriptions.length === 0) {
                const localSubs = JSON.parse(localStorage.getItem('newsletter_subscriptions') || '[]');
                const email = this.currentUser?.email || document.getElementById('email')?.value;
                if (email) {
                    subscriptions = localSubs.filter(s => s.email === email);
                } else {
                    subscriptions = localSubs;
                }
            }

            if (subscriptions.length === 0) {
                container.innerHTML = `
                    <h3>Your Subscriptions</h3>
                    <p class="no-subscriptions">You don't have any active subscriptions yet.</p>
                `;
                return;
            }

            container.innerHTML = `
                <h3>Your Subscriptions</h3>
                <div class="subscriptions-grid">
                    ${subscriptions.map(sub => `
                        <div class="subscription-card">
                            <div class="subscription-header">
                                <h4>${sub.email}</h4>
                                <span class="subscription-status ${sub.status}">${sub.status}</span>
                            </div>
                            <div class="subscription-details">
                                <div class="detail-item">
                                    <span class="detail-label">Frequency:</span>
                                    <span class="detail-value">${sub.frequency || 'weekly'}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Categories:</span>
                                    <div class="categories-list">
                                        ${(sub.categories || []).map(cat => `
                                            <span class="category-badge">${cat}</span>
                                        `).join('')}
                                    </div>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Subscribed:</span>
                                    <span class="detail-value">${new Date(sub.subscribed_at || sub.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div class="subscription-actions">
                                <button class="unsubscribe-btn" onclick="newsletterManager.unsubscribe('${sub.email}')">
                                    Unsubscribe
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } catch (error) {
            console.error('Error loading subscriptions:', error);
            container.innerHTML = '<p class="error">Error loading subscriptions</p>';
        }
    }

    /**
     * Unsubscribe
     */
    async unsubscribe(email) {
        if (!confirm(`Are you sure you want to unsubscribe ${email}?`)) return;

        try {
            // Try Supabase first
            const { error } = await this.supabase
                .from('newsletter_subscriptions')
                .update({ status: 'unsubscribed' })
                .eq('email', email)
                .catch(() => ({ error: null }));

            // Also update localStorage
            const subscriptions = JSON.parse(localStorage.getItem('newsletter_subscriptions') || '[]');
            const index = subscriptions.findIndex(s => s.email === email);
            if (index >= 0) {
                subscriptions[index].status = 'unsubscribed';
                localStorage.setItem('newsletter_subscriptions', JSON.stringify(subscriptions));
            }

            alert('Successfully unsubscribed');
            await this.loadSubscriptions();
        } catch (error) {
            console.error('Error unsubscribing:', error);
            alert('Error unsubscribing. Please try again.');
        }
    }
}

// Initialize newsletter manager
let newsletterManagerInstance = null;

function initNewsletter() {
    if (!newsletterManagerInstance) {
        newsletterManagerInstance = new NewsletterManager();
    }
    window.newsletterManager = newsletterManagerInstance;
    return newsletterManagerInstance;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNewsletter);
} else {
    initNewsletter();
}

// Make available globally
window.NewsletterManager = NewsletterManager;
window.newsletterManager = newsletterManagerInstance;

