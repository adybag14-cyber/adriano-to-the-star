/**
 * Chatbot Integration Framework
 * Provides framework for integrating various chatbot services and APIs
 */

class ChatbotIntegrationFramework {
    constructor() {
        this.chatbots = new Map();
        this.conversations = new Map();
        this.providers = new Map();
        this.init();
    }

    init() {
        this.registerProviders();
        this.setupEventListeners();
        this.trackEvent('chatbot_int_fw_initialized');
    }

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeChatbots();
        });
    }

    /**
     * Register chatbot providers
     */
    registerProviders() {
        // OpenAI
        this.providers.set('openai', {
            name: 'OpenAI',
            sendMessage: async (message, config) => {
                // Integration with OpenAI API
                return await this.callOpenAI(message, config);
            }
        });

        // Google Dialogflow
        this.providers.set('dialogflow', {
            name: 'Dialogflow',
            sendMessage: async (message, config) => {
                return await this.callDialogflow(message, config);
            }
        });

        // Custom/Rule-based
        this.providers.set('custom', {
            name: 'Custom',
            sendMessage: async (message, config) => {
                return await this.handleCustomBot(message, config);
            }
        });
    }

    /**
     * Initialize chatbots from DOM
     */
    initializeChatbots() {
        const containers = document.querySelectorAll('[data-chatbot]');
        containers.forEach(container => {
            const botId = container.getAttribute('data-chatbot');
            const provider = container.getAttribute('data-chatbot-provider') || 'custom';
            const config = this.parseChatbotConfig(container);

            this.createChatbot(botId, provider, config, container);
        });
    }

    /**
     * Parse chatbot configuration
     */
    parseChatbotConfig(container) {
        return {
            apiKey: container.getAttribute('data-chatbot-api-key'),
            model: container.getAttribute('data-chatbot-model') || 'gpt-3.5-turbo',
            temperature: parseFloat(container.getAttribute('data-chatbot-temperature')) || 0.7,
            maxTokens: parseInt(container.getAttribute('data-chatbot-max-tokens')) || 500,
            systemPrompt: container.getAttribute('data-chatbot-system-prompt') || 'You are a helpful assistant.',
            rules: this.parseRules(container.getAttribute('data-chatbot-rules'))
        };
    }

    /**
     * Parse rules for custom chatbot
     */
    parseRules(rulesStr) {
        if (!rulesStr) return [];
        try {
            return JSON.parse(rulesStr);
        } catch {
            return [];
        }
    }

    /**
     * Create chatbot instance
     */
    createChatbot(botId, provider, config, container) {
        const chatbot = {
            id: botId,
            provider,
            config,
            container,
            conversation: [],
            ui: null
        };

        this.chatbots.set(botId, chatbot);
        this.setupChatbotUI(chatbot);
        return chatbot;
    }

    /**
     * Setup chatbot UI
     */
    setupChatbotUI(chatbot) {
        if (chatbot.container.querySelector('.chatbot-ui')) {
            return; // Already initialized
        }

        const ui = document.createElement('div');
        ui.className = 'chatbot-ui';
        ui.setAttribute('role', 'region');
        ui.setAttribute('aria-label', 'Chatbot interface');

        ui.innerHTML = `
            <div class="chatbot-header">
                <h3>Chat Assistant</h3>
                <button class="chatbot-close" aria-label="Close chatbot">×</button>
            </div>
            <div class="chatbot-messages" role="log" aria-live="polite"></div>
            <div class="chatbot-input-section">
                <input type="text" 
                       class="chatbot-input" 
                       placeholder="Type your message..."
                       aria-label="Message input">
                <button class="chatbot-send" aria-label="Send message">Send</button>
            </div>
        `;

        chatbot.container.appendChild(ui);
        chatbot.ui = ui;

        // Setup event listeners
        const input = ui.querySelector('.chatbot-input');
        const sendBtn = ui.querySelector('.chatbot-send');
        const messagesContainer = ui.querySelector('.chatbot-messages');

        const sendMessage = async () => {
            const message = input.value.trim();
            if (!message) return;

            this.addMessage(chatbot, 'user', message);
            input.value = '';

            // Show typing indicator
            const typingId = this.showTypingIndicator(chatbot);

            try {
                const response = await this.sendMessage(chatbot.id, message);
                this.hideTypingIndicator(chatbot, typingId);
                this.addMessage(chatbot, 'assistant', response);
            } catch (error) {
                this.hideTypingIndicator(chatbot, typingId);
                this.addMessage(chatbot, 'assistant', 'Sorry, I encountered an error. Please try again.');
                console.error('Chatbot error:', error);
            }
        };

        sendBtn.addEventListener('click', sendMessage);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });

        // Close button
        ui.querySelector('.chatbot-close').addEventListener('click', () => {
            chatbot.container.style.display = 'none';
        });
    }

    /**
     * Send message to chatbot
     */
    async sendMessage(botId, message) {
        const chatbot = this.chatbots.get(botId);
        if (!chatbot) {
            throw new Error(`Chatbot ${botId} not found`);
        }

        // Add to conversation history
        chatbot.conversation.push({ role: 'user', content: message });

        const provider = this.providers.get(chatbot.provider);
        if (!provider) {
            throw new Error(`Provider ${chatbot.provider} not found`);
        }

        const response = await provider.sendMessage(message, {
            ...chatbot.config,
            conversation: chatbot.conversation
        });

        chatbot.conversation.push({ role: 'assistant', content: response });
        return response;
    }

    /**
     * Call OpenAI API
     */
    async callOpenAI(message, config) {
        // This would make actual API call in production
        // For now, return a placeholder response
        if (!config.apiKey) {
            return 'OpenAI API key not configured. Please set data-chatbot-api-key attribute.';
        }

        // Simulated response
        return `I understand you said: "${message}". How can I help you further?`;
    }

    /**
     * Call Dialogflow API
     */
    async callDialogflow(message, config) {
        // Dialogflow integration would go here
        return `Dialogflow response to: "${message}"`;
    }

    /**
     * Handle custom/rule-based bot
     */
    async handleCustomBot(message, config) {
        const lowerMessage = message.toLowerCase();

        // Check rules
        if (config.rules && config.rules.length > 0) {
            for (const rule of config.rules) {
                if (rule.pattern && new RegExp(rule.pattern, 'i').test(message)) {
                    return rule.response || 'I understand.';
                }
            }
        }

        // Default responses based on keywords
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
            return 'Hello! How can I help you today?';
        } else if (lowerMessage.includes('help')) {
            return 'I\'m here to help! What do you need assistance with?';
        } else if (lowerMessage.includes('thank')) {
            return 'You\'re welcome! Is there anything else I can help with?';
        } else if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye')) {
            return 'Goodbye! Have a great day!';
        }

        return 'I\'m not sure how to respond to that. Can you rephrase your question?';
    }

    /**
     * Add message to chat UI
     */
    addMessage(chatbot, role, content) {
        const messagesContainer = chatbot.ui.querySelector('.chatbot-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chatbot-message chatbot-message-${role}`;
        messageDiv.setAttribute('role', role === 'user' ? 'user' : 'assistant');

        messageDiv.innerHTML = `
            <div class="chatbot-message-content">${this.escapeHtml(content)}</div>
            <div class="chatbot-message-time">${new Date().toLocaleTimeString()}</div>
        `;

        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    /**
     * Show typing indicator
     */
    showTypingIndicator(chatbot) {
        const messagesContainer = chatbot.ui.querySelector('.chatbot-messages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chatbot-message chatbot-message-assistant chatbot-typing';
        typingDiv.id = `typing-${Date.now()}`;
        typingDiv.innerHTML = '<div class="chatbot-typing-dots"><span></span><span></span><span></span></div>';
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        return typingDiv.id;
    }

    /**
     * Hide typing indicator
     */
    hideTypingIndicator(chatbot, typingId) {
        const typingDiv = document.getElementById(typingId);
        if (typingDiv) {
            typingDiv.remove();
        }
    }

    /**
     * Get conversation history
     */
    getConversation(botId) {
        const chatbot = this.chatbots.get(botId);
        return chatbot ? chatbot.conversation : [];
    }

    /**
     * Clear conversation
     */
    clearConversation(botId) {
        const chatbot = this.chatbots.get(botId);
        if (chatbot) {
            chatbot.conversation = [];
            const messagesContainer = chatbot.ui.querySelector('.chatbot-messages');
            if (messagesContainer) {
                messagesContainer.innerHTML = '';
            }
        }
    }

    /**
     * Export conversation
     */
    exportConversation(botId, format = 'json') {
        const conversation = this.getConversation(botId);
        
        if (format === 'json') {
            return JSON.stringify(conversation, null, 2);
        } else if (format === 'text') {
            return conversation.map(msg => 
                `${msg.role === 'user' ? 'You' : 'Assistant'}: ${msg.content}`
            ).join('\n\n');
        }

        return conversation;
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`chatbot_int_fw_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize
const chatbotIntegrationFramework = new ChatbotIntegrationFramework();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatbotIntegrationFramework;
}
