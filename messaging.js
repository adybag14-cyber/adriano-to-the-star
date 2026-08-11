/**
 * Direct Messaging System
 * Private 1-on-1 messaging between users
 */

class DirectMessaging {
    constructor() {
        this.currentUser = null;
        this.selectedUserId = null;

        this.conversations = [];
        this.supabase = null;
        this.messageSubscription = null;
        
        this.init();
    }

    async init() {
        this.trackEvent('d_ir_ec_tm_es_sa_gi_ng_initialized');
        
        // Initialize Supabase
        if (window.supabaseClient) {
            this.supabase = window.supabaseClient;
        } else if (typeof SUPABASE_CONFIG !== 'undefined' && SUPABASE_CONFIG.enabled) {
            try {
                const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
                this.supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
                console.log('✅ Supabase client initialized');
            } catch (error) {
                console.warn('⚠️ Could not load Supabase client:', error);
            }
        }

        // Wait for auth manager
        this.waitForAuth();
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("d_ir_ec_tm_es_sa_gi_ng_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    waitForAuth() {
        if (typeof window.authManager !== 'undefined' && window.authManager) {
            this.checkAuth();
        } else {
            setTimeout(() => this.waitForAuth(), 100);
        }
    }

    async checkAuth() {
        if (window.authManager && window.authManager.isAuthenticated()) {
            this.currentUser = window.authManager.getCurrentUser();
            if (this.currentUser) {
                document.getElementById('not-logged-in').style.display = 'none';
                document.getElementById('messaging-interface').style.display = 'block';
                await this.loadConversations();
                this.setupEventListeners();
            }
        } else {
            document.getElementById('not-logged-in').style.display = 'block';
            document.getElementById('messaging-interface').style.display = 'none';
        }
    }

    setupEventListeners() {
        // Send message button
        const sendBtn = document.getElementById('send-message-btn');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }

        // Message input
        const messageInput = document.getElementById('message-input');
        if (messageInput) {
            messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        // New message button
        const newMsgBtn = document.getElementById('new-message-btn');
        if (newMsgBtn) {
            newMsgBtn.addEventListener('click', () => this.showNewMessageDialog());
        }

        // Close conversation button
        const closeBtn = document.getElementById('close-conversation-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeConversation());
        }
    }

    async loadConversations() {
        if (!this.currentUser) return;

        try {
            // Try to load from Supabase first
            if (this.supabase) {
                try {
                    const { data, error } = await this.supabase
                        .from('direct_messages')
                        .select('sender_id, receiver_id, content, created_at')
                        .or(`sender_id.eq.${this.currentUser.id},receiver_id.eq.${this.currentUser.id}`)
                        .order('created_at', { ascending: false })
                        .limit(100)
                        .catch(() => ({ data: null, error: null }));

                    if (data && !error) {
                        // Process conversations from messages
                        const conversationMap = new Map();
                        data.forEach(msg => {
                            const otherUserId = msg.sender_id === this.currentUser.id ? msg.receiver_id : msg.sender_id;
                            if (!conversationMap.has(otherUserId)) {
                                conversationMap.set(otherUserId, {
                                    userId: otherUserId,
                                    userName: 'User', // Would fetch from users table
                                    lastMessage: msg.content,
                                    lastMessageTime: msg.created_at
                                });
                            }
                        });
                        this.conversations = Array.from(conversationMap.values());
                        this.setupRealtimeSubscription();
                        this.renderConversations();
                        return;
                    }
                } catch (error) {
                    console.warn('⚠️ Could not load from Supabase:', error);
                }
            }

            // Fallback to localStorage
            const stored = localStorage.getItem(`dm_conversations_${this.currentUser.id}`);
            if (stored) {
                this.conversations = JSON.parse(stored);
            }

            this.renderConversations();
        } catch (error) {
            console.error('Error loading conversations:', error);
        }
    }

    /**
     * Setup real-time subscription for new messages
     */
    setupRealtimeSubscription() {
        if (!this.supabase || !this.currentUser || this.messageSubscription) return;

        try {
            this.messageSubscription = this.supabase
                .channel('direct_messages')
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'direct_messages',
                    filter: `receiver_id=eq.${this.currentUser.id}`
                }, (payload) => {
                    console.log('📬 New message received:', payload);
                    const newMessage = payload.new;
                    if (newMessage.sender_id === this.selectedUserId) {
                        // If viewing this conversation, append message
                        this.appendMessage({
                            id: newMessage.id,
                            senderId: newMessage.sender_id,
                            receiverId: newMessage.receiver_id,
                            content: newMessage.content,
                            timestamp: newMessage.created_at
                        });
                    } else {
                        // Update conversation list
                        this.updateConversation(newMessage.sender_id, newMessage.content);
                    }

                    // Show push notification
                    if (window.pushNotificationManager) {
                        window.pushNotificationManager.showNotification({
                            notification: {
                                title: 'New Message',
                                body: newMessage.content.substring(0, 50) + '...'
                            }
                        });
                    }
                })
                .subscribe();

            console.log('✅ Real-time messaging subscription active');
        } catch (error) {
            console.warn('⚠️ Could not setup real-time subscription:', error);
        }
    }

    renderConversations() {
        const container = document.getElementById('conversations-list');
        if (!container) return;

        container.innerHTML = '';

        if (this.conversations.length === 0) {
            container.innerHTML = '<div class="no-conversations">No conversations yet. Start a new one!</div>';
            return;
        }

        this.conversations.forEach(conv => {
            const item = document.createElement('div');
            item.className = 'conversation-item';
            if (conv.userId === this.selectedUserId) {
                item.classList.add('active');
            }

            const otherUser = this.getOtherUser(conv);
            item.innerHTML = `
                <div class="conversation-avatar">${otherUser.avatar || '👤'}</div>
                <div class="conversation-info">
                    <div class="conversation-name">${this.escapeHtml(otherUser.name || 'User')}</div>
                    <div class="conversation-preview">${this.escapeHtml(conv.lastMessage || 'No messages')}</div>
                </div>
                <div class="conversation-time">${this.formatTime(conv.lastMessageTime)}</div>
            `;

            item.addEventListener('click', () => this.selectConversation(conv.userId));
            container.appendChild(item);
        });
    }

    getOtherUser(conversation) {
        // In a real implementation, fetch from Supabase
        return {
            id: conversation.userId,
            name: conversation.userName || 'User',
            avatar: '👤'
        };
    }

    selectConversation(userId) {
        this.selectedUserId = userId;
        this.renderConversations();
        this.loadMessages(userId);
        
        document.getElementById('no-conversation-selected').style.display = 'none';
        document.getElementById('active-conversation').style.display = 'block';
    }

    closeConversation() {
        this.selectedUserId = null;
        this.renderConversations();
        document.getElementById('no-conversation-selected').style.display = 'block';
        document.getElementById('active-conversation').style.display = 'none';
    }

    async loadMessages(userId) {
        const container = document.getElementById('messages-container');
        if (!container) return;

        // Load messages from localStorage (or Supabase)
        const key = `dm_messages_${this.currentUser.id}_${userId}`;
        const stored = localStorage.getItem(key);
        const messages = stored ? JSON.parse(stored) : [];

        container.innerHTML = '';
        messages.forEach(msg => {
            this.appendMessage(msg);
        });

        container.scrollTop = container.scrollHeight;
    }

    async sendMessage() {
        if (!this.selectedUserId) return;

        const input = document.getElementById('message-input');
        if (!input) return;

        const text = input.value.trim();
        if (!text) return;

        const message = {
            id: Date.now().toString(),
            senderId: this.currentUser.id,
            receiverId: this.selectedUserId,
            content: text,
            timestamp: new Date().toISOString()
        };

        // Save to localStorage (or Supabase)
        const key = `dm_messages_${this.currentUser.id}_${this.selectedUserId}`;
        const stored = localStorage.getItem(key);
        const messages = stored ? JSON.parse(stored) : [];
        messages.push(message);
        localStorage.setItem(key, JSON.stringify(messages));

        // Update conversation
        this.updateConversation(this.selectedUserId, text);

        // Append to UI
        this.appendMessage(message);
        input.value = '';

        // Scroll to bottom
        const container = document.getElementById('messages-container');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }

        // Save to Supabase and trigger real-time updates
        if (this.supabase) {
            try {
                // Try to save to Supabase messages table (if exists)
                const { error } = await this.supabase
                    .from('direct_messages')
                    .insert({
                        sender_id: this.currentUser.id,
                        receiver_id: this.selectedUserId,
                        content: text,
                        created_at: new Date().toISOString()
                    })
                    .catch(() => ({ error: null })); // Ignore if table doesn't exist

                if (!error) {
                    console.log('✅ Message saved to Supabase');
                }
            } catch (error) {
                console.warn('⚠️ Could not save to Supabase:', error);
            }
        }

        // Update reputation system (points for sending messages)
        if (window.getReputationSystem) {
            const repSystem = window.getReputationSystem();
            await repSystem.init();
            await repSystem.updateActivity('message_sent');
        }

        // Trigger push notification for receiver (if enabled)
        if (window.pushNotificationManager && window.pushNotificationManager.getToken()) {
            // In production, send push notification via backend
            console.log('📬 Push notification would be sent to receiver');
        }
    }

    appendMessage(message) {
        const container = document.getElementById('messages-container');
        if (!container) return;

        const isOwn = message.senderId === this.currentUser.id;
        const time = new Date(message.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const messageEl = document.createElement('div');
        messageEl.className = `message ${isOwn ? 'own-message' : 'other-message'}`;
        messageEl.innerHTML = `
            <div class="message-content">
                <div class="message-text">${this.escapeHtml(message.content)}</div>
                <div class="message-time">${time}</div>
            </div>
        `;

        container.appendChild(messageEl);
    }

    updateConversation(userId, lastMessage) {
        let conv = this.conversations.find(c => c.userId === userId);
        if (!conv) {
            conv = {
                userId: userId,
                userName: 'User',
                lastMessage: lastMessage,
                lastMessageTime: new Date().toISOString()
            };
            this.conversations.push(conv);
        } else {
            conv.lastMessage = lastMessage;
            conv.lastMessageTime = new Date().toISOString();
        }

        localStorage.setItem(`dm_conversations_${this.currentUser.id}`, JSON.stringify(this.conversations));
        this.renderConversations();
    }

    showNewMessageDialog() {
        // Simple implementation - in production, show user search
        const username = prompt('Enter username to message:');
        if (username) {
            // Find user and start conversation
            // For now, create a new conversation
            const newUserId = 'user_' + Date.now();
            this.selectConversation(newUserId);
        }
    }

    formatTime(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
        return date.toLocaleDateString();
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.directMessaging = new DirectMessaging();
    });
} else {
    window.directMessaging = new DirectMessaging();
}

