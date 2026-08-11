/**
 * Messaging System Enhancements
 * Adds: Reactions, read receipts, typing indicators, file sharing
 */

class MessagingEnhancements {
    constructor(messagingSystem) {
        this.messagingSystem = messagingSystem;
        this.supabase = messagingSystem.supabase;
        this.currentUser = messagingSystem.currentUser;
        this.typingUsers = new Map(); // userId -> timeout
        this.typingTimeout = 3000; // 3 seconds
    }

    /**
     * Add reaction to message
     */
    async addReaction(messageId, emoji) {
        if (!this.currentUser) return;

        try {
            const { data, error } = await this.supabase
                .from('message_reactions')
                .upsert({
                    message_id: messageId,
                    user_id: this.currentUser.id,
                    emoji: emoji,
                    created_at: new Date().toISOString()
                }, {
                    onConflict: 'message_id,user_id'
                })
                .select()
                .single();

            if (error) throw error;

            // Update UI
            this.updateMessageReactions(messageId);

            return data;
        } catch (error) {
            console.error('Error adding reaction:', error);
        }
    }

    /**
     * Remove reaction from message
     */
    async removeReaction(messageId) {
        if (!this.currentUser) return;

        try {
            const { error } = await this.supabase
                .from('message_reactions')
                .delete()
                .eq('message_id', messageId)
                .eq('user_id', this.currentUser.id);

            if (error) throw error;

            // Update UI
            this.updateMessageReactions(messageId);
        } catch (error) {
            console.error('Error removing reaction:', error);
        }
    }

    /**
     * Get reactions for message
     */
    async getMessageReactions(messageId) {
        try {
            const { data, error } = await this.supabase
                .from('message_reactions')
                .select(`
                    *,
                    user:user_reputation(username)
                `)
                .eq('message_id', messageId);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting reactions:', error);
            return [];
        }
    }

    /**
     * Update message reactions in UI
     */
    async updateMessageReactions(messageId) {
        const reactions = await this.getMessageReactions(messageId);
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        
        if (!messageElement) return;

        // Find or create reactions container
        let reactionsContainer = messageElement.querySelector('.message-reactions');
        if (!reactionsContainer) {
            reactionsContainer = document.createElement('div');
            reactionsContainer.className = 'message-reactions';
            messageElement.appendChild(reactionsContainer);
        }

        // Group reactions by emoji
        const grouped = {};
        reactions.forEach(r => {
            if (!grouped[r.emoji]) {
                grouped[r.emoji] = [];
            }
            grouped[r.emoji].push(r);
        });

        // Render reactions
        reactionsContainer.innerHTML = Object.entries(grouped).map(([emoji, users]) => {
            const isUserReacted = users.some(r => r.user_id === this.currentUser.id);
            return `
                <button class="reaction-btn ${isUserReacted ? 'reacted' : ''}" 
                        data-emoji="${emoji}" 
                        data-message-id="${messageId}"
                        title="${users.map(u => u.user?.username || 'User').join(', ')}">
                    ${emoji} ${users.length}
                </button>
            `;
        }).join('');

        // Add click handlers
        reactionsContainer.querySelectorAll('.reaction-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const emoji = btn.dataset.emoji;
                const msgId = btn.dataset.messageId;
                if (btn.classList.contains('reacted')) {
                    this.removeReaction(msgId);
                } else {
                    this.addReaction(msgId, emoji);
                }
            });
        });
    }

    /**
     * Mark message as read
     */
    async markAsRead(messageId) {
        if (!this.currentUser) return;

        try {
            const { error } = await this.supabase
                .from('message_reads')
                .upsert({
                    message_id: messageId,
                    user_id: this.currentUser.id,
                    read_at: new Date().toISOString()
                }, {
                    onConflict: 'message_id,user_id'
                });

            if (error) throw error;

            // Update UI
            this.updateReadReceipts(messageId);
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    }

    /**
     * Get read receipts for message
     */
    async getReadReceipts(messageId) {
        try {
            const { data, error } = await this.supabase
                .from('message_reads')
                .select(`
                    *,
                    user:user_reputation(username)
                `)
                .eq('message_id', messageId);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting read receipts:', error);
            return [];
        }
    }

    /**
     * Update read receipts in UI
     */
    async updateReadReceipts(messageId) {
        const receipts = await this.getReadReceipts(messageId);
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        
        if (!messageElement) return;

        let receiptElement = messageElement.querySelector('.read-receipts');
        if (!receiptElement) {
            receiptElement = document.createElement('div');
            receiptElement.className = 'read-receipts';
            messageElement.appendChild(receiptElement);
        }

        if (receipts.length > 0) {
            receiptElement.innerHTML = `
                <span class="read-indicator" title="Read by ${receipts.map(r => r.user?.username || 'User').join(', ')}">
                    ✓✓ Read
                </span>
            `;
        } else {
            receiptElement.innerHTML = '<span class="read-indicator unread">✓ Sent</span>';
        }
    }

    /**
     * Send typing indicator
     */
    sendTypingIndicator(userId) {
        if (!this.currentUser || !userId) return;

        // Clear existing timeout
        if (this.typingUsers.has(userId)) {
            clearTimeout(this.typingUsers.get(userId));
        }

        // Broadcast typing
        if (this.supabase) {
            this.supabase
                .channel(`typing:${userId}`)
                .send({
                    type: 'broadcast',
                    event: 'typing',
                    payload: {
                        user_id: this.currentUser.id,
                        username: this.currentUser.user_metadata?.username || this.currentUser.email,
                        typing: true
                    }
                });
        }

        // Set timeout to stop typing
        const timeout = setTimeout(() => {
            this.stopTypingIndicator(userId);
        }, this.typingTimeout);

        this.typingUsers.set(userId, timeout);
    }

    /**
     * Stop typing indicator
     */
    stopTypingIndicator(userId) {
        if (!this.currentUser || !userId) return;

        if (this.typingUsers.has(userId)) {
            clearTimeout(this.typingUsers.get(userId));
            this.typingUsers.delete(userId);
        }

        if (this.supabase) {
            this.supabase
                .channel(`typing:${userId}`)
                .send({
                    type: 'broadcast',
                    event: 'typing',
                    payload: {
                        user_id: this.currentUser.id,
                        typing: false
                    }
                });
        }
    }

    /**
     * Setup typing indicator listener
     */
    setupTypingListener(userId) {
        if (!this.supabase || !userId) return;

        const channel = this.supabase.channel(`typing:${this.currentUser.id}`);
        
        channel.on('broadcast', { event: 'typing' }, (payload) => {
            const typingElement = document.getElementById('typing-indicator');
            if (typingElement) {
                if (payload.payload.typing) {
                    typingElement.textContent = `${payload.payload.username} is typing...`;
                    typingElement.style.display = 'block';
                } else {
                    typingElement.style.display = 'none';
                }
            }
        });

        channel.subscribe();
    }

    /**
     * Share file in message
     */
    async shareFile(file, messageText = '') {
        if (!this.currentUser || !file) return;

        try {
            // Upload file to Supabase storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${this.currentUser.id}/${Date.now()}.${fileExt}`;
            
            const { data: uploadData, error: uploadError } = await this.supabase.storage
                .from('message-attachments')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: urlData } = this.supabase.storage
                .from('message-attachments')
                .getPublicUrl(fileName);

            // Send message with file attachment
            const message = {
                sender_id: this.currentUser.id,
                receiver_id: this.messagingSystem.selectedUserId,
                content: messageText,
                attachment_url: urlData.publicUrl,
                attachment_type: file.type,
                attachment_name: file.name,
                created_at: new Date().toISOString()
            };

            return await this.messagingSystem.sendMessage(messageText, message);
        } catch (error) {
            console.error('Error sharing file:', error);
            throw error;
        }
    }
}

// Export
if (typeof window !== 'undefined') {
    window.MessagingEnhancements = MessagingEnhancements;
}

