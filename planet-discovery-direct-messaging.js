/**
 * Planet Discovery Direct Messaging
 * Direct messaging system between users
 */

class PlanetDiscoveryDirectMessaging {
    constructor() {
        this.conversations = [];
        this.currentConversation = null;
        this.init();
    }

    init() {
        this.loadConversations();
        console.log('💬 Direct messaging initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_di_re_ct_me_ss_ag_in_g_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    loadConversations() {
        // Load from localStorage or Supabase
        try {
            const saved = localStorage.getItem('conversations');
            if (saved) {
                this.conversations = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
        }
    }

    saveConversations() {
        try {
            localStorage.setItem('conversations', JSON.stringify(this.conversations));
        } catch (error) {
            console.error('Error saving conversations:', error);
        }
    }

    renderMessaging(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        container.innerHTML = `
            <div class="messaging-container" style="margin-top: 2rem;">
                <h3 style="color: #ba944f; margin-bottom: 1.5rem; text-align: center;">💬 Direct Messaging</h3>
                
                <div style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin-bottom: 2rem;">
                    <button id="new-message-btn" style="width: 100%; padding: 0.75rem; background: rgba(74, 222, 128, 0.2); border: 2px solid rgba(74, 222, 128, 0.5); border-radius: 10px; color: #4ade80; cursor: pointer; font-weight: 600;">
                        ✉️ New Message
                    </button>
                </div>
                
                <div id="conversations-list" class="conversations-list" style="display: flex; flex-direction: column; gap: 1rem;">
        `;

        if (this.conversations.length === 0) {
            container.innerHTML += `
                <div style="text-align: center; padding: 4rem; background: rgba(0, 0, 0, 0.5); border-radius: 15px; color: rgba(255, 255, 255, 0.7);">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">💬</div>
                    <p>No conversations yet. Start a new conversation!</p>
                </div>
            `;
        } else {
            this.conversations.forEach(conv => {
                container.innerHTML += this.createConversationCard(conv);
            });
        }

        container.innerHTML += `
                </div>
            </div>
        `;

        document.getElementById('new-message-btn')?.addEventListener('click', () => {
            this.showNewMessageForm();
        });
    }

    createConversationCard(conversation) {
        const lastMessage = conversation.messages[conversation.messages.length - 1];
        const unreadCount = conversation.messages.filter(m => !m.read).length;

        return `
            <div class="conversation-card" data-conversation-id="${conversation.id}" style="background: linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(20, 20, 30, 0.9)); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 1.5rem; cursor: pointer; transition: all 0.3s ease;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <h4 style="color: #ba944f; margin-bottom: 0.5rem;">${conversation.participant}</h4>
                        <p style="opacity: 0.8; font-size: 0.9rem; margin-bottom: 0.5rem;">${lastMessage?.content || 'No messages'}</p>
                        <p style="opacity: 0.6; font-size: 0.85rem;">${lastMessage ? new Date(lastMessage.timestamp).toLocaleDateString() : ''}</p>
                    </div>
                    ${unreadCount > 0 ? `
                        <span style="background: rgba(239, 68, 68, 0.8); color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: bold;">
                            ${unreadCount}
                        </span>
                    ` : ''}
                </div>
            </div>
        `;
    }

    showNewMessageForm() {
        alert('New message form coming soon!');
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscoveryDirectMessaging = new PlanetDiscoveryDirectMessaging();
}

