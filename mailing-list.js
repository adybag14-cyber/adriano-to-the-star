/* global gtag */

// Mailing List Subscription Functionality
class MailingListManager {
    constructor() {
        this.modal = null;
        this.localStorageKey = 'mailing_list_subscribers';
        this.init();
    }

    init() {
        this.createModal();

        document.addEventListener('DOMContentLoaded', () => {
            this.attachButtonListeners();
        });

        if (document.readyState !== 'loading') {
            this.attachButtonListeners();
        }
    }

    attachButtonListeners() {
        const buttons = document.querySelectorAll(
            'a[href*="#follow"], .mailing-list-btn, a[href*="index.html#follow"]'
        );

        buttons.forEach((button) => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.showModal();
            });
        });
    }

    createModal() {
        const modalHTML = `
            <div id="mailing-list-modal" class="mailing-modal" style="display: none;">
                <div class="mailing-modal-overlay" onclick="mailingListManager.hideModal()"></div>
                <div class="mailing-modal-content">
                    <button class="mailing-modal-close" onclick="mailingListManager.hideModal()">&times;</button>
                    
                    <div class="mailing-modal-header">
                        <h2>🚀 Join Our Cosmic Journey</h2>
                        <p>Subscribe to get updates on new exoplanet discoveries, special offers, and celestial news!</p>
                    </div>
                    
                    <form id="mailing-list-form" class="mailing-form">
                        <div class="form-group">
                            <label for="subscriber-name">Name (Optional)</label>
                            <input 
                                type="text" 
                                id="subscriber-name" 
                                name="name" 
                                placeholder="Your name"
                                autocomplete="name"
                            >
                        </div>
                        
                        <div class="form-group">
                            <label for="subscriber-email">Email Address *</label>
                            <input 
                                type="email" 
                                id="subscriber-email" 
                                name="email" 
                                placeholder="your.email@example.com"
                                required
                                autocomplete="email"
                            >
                        </div>
                        
                        <div class="form-group checkbox-group">
                            <label>
                                <input type="checkbox" name="interests" value="discoveries"> 
                                Exoplanet Discoveries
                            </label>
                            <label>
                                <input type="checkbox" name="interests" value="offers"> 
                                Special Offers & Discounts
                            </label>
                            <label>
                                <input type="checkbox" name="interests" value="news"> 
                                Space News & Updates
                            </label>
                        </div>
                        
                        <button type="submit" class="mailing-submit-btn">
                            <span class="btn-text">Subscribe Now</span>
                            <span class="btn-loading" style="display: none;">⏳ Subscribing...</span>
                        </button>
                        
                        <p class="mailing-privacy">
                            We respect your privacy. Unsubscribe anytime. 
                            <a href="#privacy">Privacy Policy</a>
                        </p>
                    </form>
                    
                    <div id="mailing-success" class="mailing-success" style="display: none;">
                        <div class="success-icon">✨</div>
                        <h3>Welcome to the Cosmos!</h3>
                        <p>Thank you for subscribing! Check your email to confirm your subscription.</p>
                        <button onclick="mailingListManager.hideModal()" class="success-btn">Close</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('mailing-list-modal');

        const form = document.getElementById('mailing-list-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
    }

    showModal() {
        if (!this.modal) return;
        this.modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        setTimeout(() => {
            const emailInput = document.getElementById('subscriber-email');
            if (emailInput) {
                emailInput.focus();
            }
        }, 100);
    }

    hideModal() {
        if (!this.modal) return;
        this.modal.style.display = 'none';
        document.body.style.overflow = '';

        const form = document.getElementById('mailing-list-form');
        if (form) {
            form.reset();
            form.style.display = 'block';
        }

        const success = document.getElementById('mailing-success');
        if (success) {
            success.style.display = 'none';
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        const form = e.target;
        const submitBtn = form.querySelector('.mailing-submit-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');

        const formData = new FormData(form);
        const email = formData.get('email');
        const name = formData.get('name');
        const interests = formData.getAll('interests');

        if (!this.isValidEmail(email)) {
            alert('Please enter a valid email address');
            return;
        }

        btnText.style.display = 'none';
        btnLoading.style.display = 'inline';
        submitBtn.disabled = true;

        try {
            const subscriber = {
                email: email.trim().toLowerCase(),
                name: name?.trim() || '',
                interests,
                source: window.location.href,
                timestamp: new Date().toISOString()
            };

            const result = await this.submitToMailingList(subscriber);

            if (result.success) {
                form.style.display = 'none';
                document.getElementById('mailing-success').style.display = 'block';

                if (typeof gtag !== 'undefined') {
                    gtag('event', 'subscribe', {
                        event_category: 'mailing_list',
                        event_label: 'subscription'
                    });
                }
            } else {
                const message = this.getFailureMessage(result);
                console.warn('Mailing list submission failed:', result);
                alert(message);
            }
        } catch (error) {
            console.error('Subscription error:', error);
            alert('Oops! Something went wrong. Please try again later.');
        } finally {
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
            submitBtn.disabled = false;
        }
    }

    isValidEmail(email) {
        if (!email || typeof email !== 'string') return false;
        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
        return emailPattern.test(email.trim());
    }

    async submitToMailingList(subscriber) {
        const supabaseResult = await this.trySupabase(subscriber);
        this.persistLocally(subscriber);
        return supabaseResult;
    }

    async trySupabase(subscriber) {
        const supabaseClient = typeof window !== 'undefined' ? window.supabase : undefined;

        if (!supabaseClient?.from) {
            return {
                success: false,
                reason: 'missing-supabase'
            };
        }

        try {
            const { error } = await supabaseClient.rpc('subscribe_to_mailing_list', {
                p_email: subscriber.email,
                p_name: subscriber.name,
                p_interests: subscriber.interests,
                p_source: subscriber.source,
                p_subscribed_at: subscriber.timestamp
            });

            if (error) {
                console.warn('Supabase mailing list error:', error.message);
                return {
                    success: false,
                    reason: 'insert-error',
                    details: error.message
                };
            }

            return { success: true };
        } catch (error) {
            console.warn('Supabase unavailable, falling back to local storage.', error);
            return {
                success: false,
                reason: 'network-error',
                details: error.message
            };
        }
    }

    persistLocally(subscriber) {
        try {
            const existing = JSON.parse(localStorage.getItem(this.localStorageKey) || '[]');
            const alreadySubscribed = existing.some((entry) => entry.email === subscriber.email);
            const updated = alreadySubscribed
                ? existing.map((entry) =>
                      entry.email === subscriber.email ? { ...entry, ...subscriber } : entry
                  )
                : [...existing, subscriber];

            localStorage.setItem(this.localStorageKey, JSON.stringify(updated));
        } catch (error) {
            console.warn('Unable to persist mailing list locally', error);
        }
    }

    getFailureMessage(result) {
        if (!result) {
            return 'We could not save your subscription at this time. Please try again later.';
        }

        switch (result.reason) {
            case 'missing-supabase':
                return 'Online mailing list signups are temporarily offline. Please try again later.';
            case 'insert-error':
                return `We could not save your subscription (Supabase error: ${result.details || 'unknown'}). Please try again later.`;
            case 'network-error':
                return 'We could not reach the subscription service. Please check your connection and try again.';
            default:
                return 'We could not save your subscription at this time. Please try again later.';
        }
    }
}

const mailingListManager = new MailingListManager();

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        mailingListManager.hideModal();
    }
});
