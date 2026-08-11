/**
 * Planet Discovery Webhook System
 * Webhook notifications for planet discovery events
 */

class PlanetDiscoveryWebhooks {
    constructor() {
        this.webhooks = [];
        this.events = ['planet.discovered', 'planet.claimed', 'planet.traded', 'price.changed'];
        this.init();
    }

    init() {
        this.loadWebhooks();
        console.log('🔗 Webhook system initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_we_bh_oo_ks_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    loadWebhooks() {
        // Load from localStorage or Supabase
        try {
            const saved = localStorage.getItem('webhooks');
            if (saved) {
                this.webhooks = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading webhooks:', error);
        }
    }

    saveWebhooks() {
        try {
            localStorage.setItem('webhooks', JSON.stringify(this.webhooks));
        } catch (error) {
            console.error('Error saving webhooks:', error);
        }
    }

    renderWebhooks(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        let html = `
            <div class="webhooks-container" style="margin-top: 2rem;">
                <h3 style="color: #ba944f; margin-bottom: 1.5rem; text-align: center;">🔗 Webhook System</h3>
                
                <div style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin-bottom: 2rem;">
                    <p style="opacity: 0.9; line-height: 1.8; margin-bottom: 1rem;">
                        Set up webhooks to receive real-time notifications about planet discovery events. 
                        Webhooks will send HTTP POST requests to your specified URL when events occur.
                    </p>
                    <button id="create-webhook-btn" style="padding: 0.75rem 1.5rem; background: rgba(74, 222, 128, 0.2); border: 2px solid rgba(74, 222, 128, 0.5); border-radius: 10px; color: #4ade80; cursor: pointer; font-weight: 600;">
                        ➕ Create Webhook
                    </button>
                </div>
                
                <div id="webhooks-list" class="webhooks-list" style="display: flex; flex-direction: column; gap: 1rem;">
        `;

        if (this.webhooks.length === 0) {
            html += `
                <div style="text-align: center; padding: 4rem; background: rgba(0, 0, 0, 0.5); border-radius: 15px; color: rgba(255, 255, 255, 0.7);">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">🔗</div>
                    <p>No webhooks configured yet. Create your first webhook!</p>
                </div>
            `;
        } else {
            this.webhooks.forEach(webhook => {
                html += this.createWebhookCard(webhook);
            });
        }

        html += `
                </div>
            </div>
        `;

        container.innerHTML = html;

        document.getElementById('create-webhook-btn')?.addEventListener('click', () => {
            this.showCreateWebhookForm();
        });
    }

    createWebhookCard(webhook) {
        return `
            <div class="webhook-card" data-webhook-id="${webhook.id}" style="background: linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(20, 20, 30, 0.9)); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <div style="flex: 1;">
                        <h4 style="color: #ba944f; margin-bottom: 0.5rem;">${webhook.name || 'Unnamed Webhook'}</h4>
                        <p style="opacity: 0.8; font-size: 0.9rem; margin-bottom: 0.5rem; font-family: monospace; word-break: break-all;">${webhook.url}</p>
                        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem;">
                            ${webhook.events.map(event => `
                                <span style="background: rgba(186, 148, 79, 0.2); padding: 0.25rem 0.5rem; border-radius: 5px; font-size: 0.75rem; color: #ba944f;">${event}</span>
                            `).join('')}
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="test-webhook-btn" data-webhook-id="${webhook.id}" style="padding: 0.5rem; background: rgba(59, 130, 246, 0.2); border: 2px solid rgba(59, 130, 246, 0.5); border-radius: 8px; color: #3b82f6; cursor: pointer;">
                            🧪 Test
                        </button>
                        <button class="delete-webhook-btn" data-webhook-id="${webhook.id}" style="padding: 0.5rem; background: rgba(239, 68, 68, 0.2); border: 2px solid rgba(239, 68, 68, 0.5); border-radius: 8px; color: #f87171; cursor: pointer;">
                            🗑️
                        </button>
                    </div>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.85rem; opacity: 0.7;">
                    <span>Status: ${webhook.active ? '🟢 Active' : '⚪ Inactive'}</span>
                    <span>Last triggered: ${webhook.lastTriggered ? new Date(webhook.lastTriggered).toLocaleDateString() : 'Never'}</span>
                </div>
            </div>
        `;
    }

    showCreateWebhookForm() {
        const formModal = document.createElement('div');
        formModal.id = 'create-webhook-modal';
        formModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 10000;
            overflow-y: auto;
            padding: 2rem;
        `;

        formModal.innerHTML = `
            <div style="max-width: 700px; margin: 0 auto;">
                <h3 style="color: #ba944f; margin-bottom: 2rem;">Create Webhook</h3>
                
                <form id="webhook-form" style="background: rgba(0, 0, 0, 0.8); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 15px; padding: 2rem;">
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; color: rgba(255, 255, 255, 0.9); margin-bottom: 0.5rem; font-weight: 600;">Webhook Name</label>
                        <input type="text" id="webhook-name" required placeholder="My Webhook" style="width: 100%; padding: 0.75rem; background: rgba(0, 0, 0, 0.5); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 8px; color: white;">
                    </div>
                    
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; color: rgba(255, 255, 255, 0.9); margin-bottom: 0.5rem; font-weight: 600;">Webhook URL</label>
                        <input type="url" id="webhook-url" required placeholder="https://your-server.com/webhook" style="width: 100%; padding: 0.75rem; background: rgba(0, 0, 0, 0.5); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 8px; color: white;">
                    </div>
                    
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; color: rgba(255, 255, 255, 0.9); margin-bottom: 0.5rem; font-weight: 600;">Events to Subscribe</label>
                        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                            ${this.events.map(event => `
                                <label style="display: flex; align-items: center; gap: 1rem; cursor: pointer;">
                                    <input type="checkbox" value="${event}" class="webhook-event" style="width: 20px; height: 20px; cursor: pointer;">
                                    <span style="opacity: 0.9;">${event}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 1rem;">
                        <button type="submit" style="flex: 1; padding: 0.75rem; background: rgba(74, 222, 128, 0.2); border: 2px solid rgba(74, 222, 128, 0.5); border-radius: 10px; color: #4ade80; cursor: pointer; font-weight: 600;">
                            Create Webhook
                        </button>
                        <button type="button" id="cancel-webhook-btn" style="flex: 1; padding: 0.75rem; background: rgba(107, 114, 128, 0.2); border: 2px solid rgba(107, 114, 128, 0.5); border-radius: 10px; color: rgba(255, 255, 255, 0.7); cursor: pointer; font-weight: 600;">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(formModal);

        document.getElementById('webhook-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createWebhook();
            formModal.remove();
        });

        document.getElementById('cancel-webhook-btn').addEventListener('click', () => {
            formModal.remove();
        });
    }

    createWebhook() {
        const name = document.getElementById('webhook-name').value;
        const url = document.getElementById('webhook-url').value;
        const events = Array.from(document.querySelectorAll('.webhook-event:checked')).map(cb => cb.value);

        if (events.length === 0) {
            alert('Please select at least one event');
            return;
        }

        const webhook = {
            id: Date.now().toString(),
            name,
            url,
            events,
            active: true,
            createdAt: new Date().toISOString(),
            lastTriggered: null
        };

        this.webhooks.push(webhook);
        this.saveWebhooks();
        this.renderWebhooks('webhooks-container');
    }

    async triggerWebhook(webhookId, event, data) {
        const webhook = this.webhooks.find(w => w.id === webhookId);
        if (!webhook || !webhook.active) return;

        if (!webhook.events.includes(event)) return;

        try {
            const response = await fetch(webhook.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Event': event,
                    'X-Webhook-Signature': this.generateSignature(webhook, data)
                },
                body: JSON.stringify({
                    event,
                    data,
                    timestamp: new Date().toISOString()
                })
            });

            if (response.ok) {
                webhook.lastTriggered = new Date().toISOString();
                this.saveWebhooks();
            }
        } catch (error) {
            console.error('Error triggering webhook:', error);
        }
    }

    generateSignature(webhook, data) {
        // Simple signature generation (would use HMAC in production)
        return btoa(JSON.stringify(data) + webhook.id);
    }

    async testWebhook(webhookId) {
        const webhook = this.webhooks.find(w => w.id === webhookId);
        if (!webhook) return;

        await this.triggerWebhook(webhookId, 'test', { message: 'Test webhook' });
        alert('Test webhook sent!');
    }

    deleteWebhook(webhookId) {
        if (confirm('Are you sure you want to delete this webhook?')) {
            this.webhooks = this.webhooks.filter(w => w.id !== webhookId);
            this.saveWebhooks();
            this.renderWebhooks('webhooks-container');
        }
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscoveryWebhooks = new PlanetDiscoveryWebhooks();
    
    // Re-attach event listeners after rendering
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('test-webhook-btn')) {
            const webhookId = e.target.dataset.webhookId;
            window.planetDiscoveryWebhooks.testWebhook(webhookId);
        }
        if (e.target.classList.contains('delete-webhook-btn')) {
            const webhookId = e.target.dataset.webhookId;
            window.planetDiscoveryWebhooks.deleteWebhook(webhookId);
        }
    });
}

