/**
 * Chatbot Framework
 * Conversational AI chatbot framework
 */

class ChatbotFramework {
    constructor() {
        this.bots = new Map();
        this.conversations = new Map();
        this.messages = new Map();
        this.init();
    }

    init() {
        this.trackEvent('chatbot_fw_initialized');
    }

    createBot(botId, botData) {
        const bot = {
            id: botId,
            ...botData,
            name: botData.name || botId,
            personality: botData.personality || 'friendly',
            knowledgeBase: botData.knowledgeBase || [],
            enabled: botData.enabled !== false,
            createdAt: new Date()
        };
        
        this.bots.set(botId, bot);
        console.log(`Chatbot created: ${botId}`);
        return bot;
    }

    async sendMessage(botId, userId, message) {
        const bot = this.bots.get(botId);
        if (!bot) {
            throw new Error('Bot not found');
        }
        
        if (!bot.enabled) {
            throw new Error('Bot is disabled');
        }
        
        let conversation = Array.from(this.conversations.values())
            .find(c => c.botId === botId && c.userId === userId && c.status === 'active');
        
        if (!conversation) {
            conversation = {
                id: `conversation_${Date.now()}`,
                botId,
                userId,
                status: 'active',
                messages: [],
                startedAt: new Date(),
                createdAt: new Date()
            };
            
            this.conversations.set(conversation.id, conversation);
        }
        
        const userMessage = {
            id: `message_${Date.now()}`,
            conversationId: conversation.id,
            sender: 'user',
            text: message,
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.messages.set(userMessage.id, userMessage);
        conversation.messages.push(userMessage.id);
        
        const botResponse = await this.generateResponse(bot, message, conversation);
        
        const botMessage = {
            id: `message_${Date.now() + 1}`,
            conversationId: conversation.id,
            sender: 'bot',
            text: botResponse,
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.messages.set(botMessage.id, botMessage);
        conversation.messages.push(botMessage.id);
        
        return { userMessage, botMessage, conversation };
    }

    async generateResponse(bot, message, conversation) {
        return `Bot response to: ${message}`;
    }

    getBot(botId) {
        return this.bots.get(botId);
    }

    getConversation(conversationId) {
        return this.conversations.get(conversationId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`chatbot_fw_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.chatbotFramework = new ChatbotFramework();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatbotFramework;
}


