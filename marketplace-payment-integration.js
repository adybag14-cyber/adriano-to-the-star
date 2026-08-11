/**
 * Marketplace Payment Integration
 * Payment processing (Stripe/PayPal) for planet trading marketplace
 */

class MarketplacePaymentIntegration {
    constructor() {
        this.stripe = null;
        this.paypal = null;
        this.paymentMethods = ['stripe', 'paypal'];
        this.currentPaymentMethod = null;
        this.isInitialized = false;
        
        this.init();
    }

    /**
     * Initialize payment integration
     */
    async init() {
        // Initialize Stripe (if key available)
        if (window.STRIPE_PUBLIC_KEY) {
            await this.initStripe();
        }

        // Initialize PayPal (if client ID available)
        if (window.PAYPAL_CLIENT_ID) {
            await this.initPayPal();
        }

        this.isInitialized = true;
        console.log('💳 Marketplace Payment Integration initialized');
    }

    /**
     * Initialize Stripe
     */
    async initStripe() {
        try {
            // Load Stripe.js
            if (!window.Stripe) {
                const script = document.createElement('script');
                script.src = 'https://js.stripe.com/v3/';
                script.async = true;
                await new Promise((resolve, reject) => {
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }

            this.stripe = window.Stripe(window.STRIPE_PUBLIC_KEY);
            console.log('✅ Stripe initialized');
        } catch (error) {
            console.error('Failed to initialize Stripe:', error);
        }
    }

    /**
     * Initialize PayPal
     */
    async initPayPal() {
        try {
            // Load PayPal SDK
            if (!window.paypal) {
                const script = document.createElement('script');
                script.src = `https://www.paypal.com/sdk/js?client-id=${window.PAYPAL_CLIENT_ID}&currency=USD`;
                script.async = true;
                await new Promise((resolve, reject) => {
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }

            this.paypal = window.paypal;
            console.log('✅ PayPal initialized');
        } catch (error) {
            console.error('Failed to initialize PayPal:', error);
        }
    }

    /**
     * Process payment
     */
    async processPayment(amount, currency, listingId, paymentMethod = 'stripe') {
        this.currentPaymentMethod = paymentMethod;

        if (paymentMethod === 'stripe') {
            return await this.processStripePayment(amount, currency, listingId);
        } else if (paymentMethod === 'paypal') {
            return await this.processPayPalPayment(amount, currency, listingId);
        } else {
            throw new Error('Unsupported payment method');
        }
    }

    /**
     * Process Stripe payment
     */
    async processStripePayment(amount, currency, listingId) {
        if (!this.stripe) {
            throw new Error('Stripe not initialized');
        }

        try {
            // Create payment intent on backend (in production)
            // For now, simulate with client-side
            const paymentIntent = await this.createStripePaymentIntent(amount, currency, listingId);

            // Confirm payment
            const buyerName = await this.getBuyerName();
            const result = await this.stripe.confirmCardPayment(paymentIntent.client_secret, {
                payment_method: {
                    card: this.getCardElement(),
                    billing_details: {
                        name: buyerName
                    }
                }
            });

            if (result.error) {
                throw new Error(result.error.message);
            }

            return {
                success: true,
                paymentId: result.paymentIntent.id,
                method: 'stripe'
            };
        } catch (error) {
            console.error('Stripe payment error:', error);
            throw error;
        }
    }

    /**
     * Create Stripe payment intent (simulated)
     */
    async createStripePaymentIntent(amount, currency, listingId) {
        // In production, this would call your backend API
        // For now, return a mock response
        return {
            client_secret: 'mock_client_secret_' + Date.now(),
            id: 'pi_mock_' + Date.now()
        };
    }

    /**
     * Process PayPal payment
     */
    async processPayPalPayment(amount, currency, listingId) {
        if (!this.paypal) {
            throw new Error('PayPal not initialized');
        }

        return new Promise((resolve, reject) => {
            this.paypal.Buttons({
                createOrder: (data, actions) => {
                    return actions.order.create({
                        purchase_units: [{
                            amount: {
                                value: amount.toString(),
                                currency_code: currency
                            },
                            description: `Planet Listing: ${listingId}`
                        }]
                    });
                },
                onApprove: async (data, actions) => {
                    try {
                        const order = await actions.order.capture();
                        resolve({
                            success: true,
                            paymentId: order.id,
                            method: 'paypal'
                        });
                    } catch (error) {
                        reject(error);
                    }
                },
                onError: (error) => {
                    reject(error);
                }
            }).render('#paypal-button-container');
        });
    }

    /**
     * Get card element (for Stripe)
     */
    getCardElement() {
        // In production, this would get the card element from Stripe Elements
        // For now, return mock
        return null;
    }

    /**
     * Get buyer name
     */
    async getBuyerName() {
        // Get from user profile or form
        if (window.supabase && window.supabase.auth && typeof window.supabase.auth.getUser === 'function') {
            try {
                const { data: { user } } = await window.supabase.auth.getUser();
                return user?.user_metadata?.name || 'Buyer';
            } catch (error) {
                console.warn('⚠️ Could not get user for buyer name:', error);
                return 'Buyer';
            }
        }
        return 'Buyer';
    }

    /**
     * Show payment modal
     */
    showPaymentModal(listing, amount, currency = 'USD') {
        const modal = document.createElement('div');
        modal.className = 'payment-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        modal.innerHTML = `
            <div style="background: rgba(0,0,0,0.9); border: 2px solid #ba944f; border-radius: 12px; padding: 2rem; max-width: 500px; width: 90%; color: #fff;">
                <h2 style="color: #ba944f; margin: 0 0 1.5rem 0;">💳 Complete Payment</h2>
                <div style="margin-bottom: 1.5rem;">
                    <p><strong>Planet:</strong> ${listing.planetName || 'Unknown'}</p>
                    <p><strong>Price:</strong> ${currency} ${amount.toFixed(2)}</p>
                </div>
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem;">Payment Method:</label>
                    <select id="payment-method-select" style="width: 100%; padding: 0.75rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(186,148,79,0.5); border-radius: 8px; color: #fff;">
                        ${this.stripe ? '<option value="stripe">Stripe (Card)</option>' : ''}
                        ${this.paypal ? '<option value="paypal">PayPal</option>' : ''}
                    </select>
                </div>
                <div id="payment-container"></div>
                <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                    <button id="cancel-payment" style="flex: 1; background: rgba(255,100,100,0.2); border: 2px solid rgba(255,100,100,0.5); color: #ff6464; padding: 0.75rem; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        Cancel
                    </button>
                    <button id="confirm-payment" style="flex: 1; background: rgba(74,144,226,0.2); border: 2px solid rgba(74,144,226,0.5); color: #4a90e2; padding: 0.75rem; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        Pay ${currency} ${amount.toFixed(2)}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Setup payment method change
        const methodSelect = modal.querySelector('#payment-method-select');
        methodSelect.addEventListener('change', () => {
            this.updatePaymentContainer(modal.querySelector('#payment-container'), methodSelect.value, amount, currency, listing.id);
        });

        // Setup cancel
        modal.querySelector('#cancel-payment').addEventListener('click', () => {
            modal.remove();
        });

        // Setup confirm payment
        modal.querySelector('#confirm-payment').addEventListener('click', async () => {
            try {
                const result = await this.processPayment(amount, currency, listing.id, methodSelect.value);
                this.showPaymentSuccess(result);
                modal.remove();
            } catch (error) {
                this.showPaymentError(error);
            }
        });

        // Initialize payment container
        this.updatePaymentContainer(modal.querySelector('#payment-container'), methodSelect.value, amount, currency, listing.id);
    }

    /**
     * Update payment container
     */
    updatePaymentContainer(container, method, amount, currency, listingId) {
        container.innerHTML = '';

        if (method === 'stripe') {
            container.innerHTML = '<div id="stripe-card-element"></div>';
            // In production, initialize Stripe Elements here
        } else if (method === 'paypal') {
            container.innerHTML = '<div id="paypal-button-container"></div>';
            // Initialize PayPal buttons
            if (this.paypal) {
                this.processPayPalPayment(amount, currency, listingId);
            }
        }
    }

    /**
     * Show payment success
     */
    showPaymentSuccess(result) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(74, 222, 128, 0.95);
            border: 2px solid #4ade80;
            border-radius: 8px;
            padding: 1rem 1.5rem;
            color: #000;
            font-family: 'Raleway', sans-serif;
            z-index: 10001;
            box-shadow: 0 4px 20px rgba(74, 222, 128, 0.5);
        `;
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <span style="font-size: 1.5rem;">✅</span>
                <div>
                    <strong>Payment Successful!</strong>
                    <div style="font-size: 0.9rem; margin-top: 0.25rem;">Transaction ID: ${result.paymentId}</div>
                </div>
            </div>
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    /**
     * Show payment error
     */
    showPaymentError(error) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(255, 100, 100, 0.95);
            border: 2px solid #ff6464;
            border-radius: 8px;
            padding: 1rem 1.5rem;
            color: #fff;
            font-family: 'Raleway', sans-serif;
            z-index: 10001;
            box-shadow: 0 4px 20px rgba(255, 100, 100, 0.5);
        `;
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <span style="font-size: 1.5rem;">❌</span>
                <div>
                    <strong>Payment Failed</strong>
                    <div style="font-size: 0.9rem; margin-top: 0.25rem;">${error.message || 'Unknown error'}</div>
                </div>
            </div>
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
}

// Initialize globally
if (typeof window !== 'undefined') {
    window.marketplacePaymentIntegration = new MarketplacePaymentIntegration();
    
    // Make available globally
    window.getMarketplacePaymentIntegration = () => window.marketplacePaymentIntegration;
}

