/**
 * Chatbot with Context Awareness
 * Context-aware chatbot for user assistance
 */

class ChatbotContextAwareness {
    constructor() {
        this.context = {
            conversationHistory: [],
            userProfile: null,
            currentPage: null,
            sessionData: {}
        };
        this.init();
    }
    
    init() {
        this.loadContext();
        this.setupChatbot();
        this.trackEvent('chatbot_context_initialized');
    }
    
    loadContext() {
        // Load user context
        this.context.currentPage = window.location.pathname;
        
        if (window.supabase) {
            window.supabase.auth.getUser().then(({ data: { user } }) => {
                if (user) {
                    this.context.userProfile = { id: user.id, email: user.email };
                }
            });
        }
    }
    
    setupChatbot() {
        // Create chatbot UI
        if (!document.getElementById('chatbot-container')) {
            const container = document.createElement('div');
            container.id = 'chatbot-container';
            container.style.cssText = 'position:fixed;bottom:20px;right:20px;width:350px;height:500px;background:white;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:10000;display:none;flex-direction:column;';
            
            container.innerHTML = `
                <div style="background:#ba944f;color:white;padding:15px;border-radius:8px 8px 0 0;display:flex;justify-content:space-between;align-items:center;">
                    <h3 style="margin:0;">Assistant</h3>
                    <button id="chatbot-close" style="background:none;border:none;color:white;cursor:pointer;font-size:20px;">×</button>
                </div>
                <div id="chatbot-messages" style="flex:1;overflow-y:auto;padding:15px;"></div>
                <div style="padding:15px;border-top:1px solid #e2e8f0;">
                    <input type="text" id="chatbot-input" placeholder="Type your message..." style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:4px;">
                </div>
            `;
            
            document.body.appendChild(container);
            
            // Toggle button
            const toggleBtn = document.createElement('button');
            toggleBtn.id = 'chatbot-toggle';
            toggleBtn.style.cssText = 'position:fixed;bottom:20px;right:20px;width:60px;height:60px;background:#ba944f;color:white;border:none;border-radius:50%;cursor:pointer;font-size:24px;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:9999;';
            toggleBtn.textContent = '💬';
            toggleBtn.addEventListener('click', () => {
                container.style.display = container.style.display === 'none' ? 'flex' : 'none';
            });
            
            document.getElementById('chatbot-close').addEventListener('click', () => {
                container.style.display = 'none';
            });
            
            document.getElementById('chatbot-input').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleMessage(e.target.value);
                    e.target.value = '';
                }
            });
            
            document.body.appendChild(toggleBtn);
        }
    }
    
    async handleMessage(message) {
        this.addMessage(message, 'user');
        this.context.conversationHistory.push({ role: 'user', content: message });
        
        const response = await this.generateResponse(message);
        this.addMessage(response, 'assistant');
        this.context.conversationHistory.push({ role: 'assistant', content: response });
    }
    
    addMessage(message, role) {
        const messagesContainer = document.getElementById('chatbot-messages');
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `margin-bottom:10px;padding:10px;border-radius:8px;background:${role === 'user' ? '#e2e8f0' : '#ba944f'};color:${role === 'user' ? '#000' : 'white'};max-width:80%;margin-left:${role === 'user' ? 'auto' : '0'};`;
        messageDiv.textContent = message;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    async generateResponse(message) {
        // Use context to generate response
        const lowerMessage = message.toLowerCase();
        
        // Context-aware responses
        if (lowerMessage.includes('help') || lowerMessage.includes('how')) {
            return this.getContextualHelp();
        }
        
        if (lowerMessage.includes('planet') || lowerMessage.includes('star')) {
            return this.getPlanetInfo(message);
        }
        
        if (lowerMessage.includes('account') || lowerMessage.includes('profile')) {
            return this.getAccountInfo();
        }
        
        // Default response
        return "I'm here to help! You can ask me about planets, your account, or how to use features. What would you like to know?";
    }
    
    getContextualHelp() {
        const page = this.context.currentPage;
        
        if (page.includes('planet')) {
            return "You're on a planet page! You can view details, add to favorites, or share this planet.";
        }
        
        if (page.includes('dashboard')) {
            return "This is your dashboard. You can see your planets, discoveries, and activity here.";
        }
        
        return "I can help you navigate the site, find planets, manage your account, and more. What do you need help with?";
    }
    
    getPlanetInfo(message) {
        // Extract planet name from message
        const planetMatch = message.match(/(?:planet|star)\s+(\w+)/i);
        if (planetMatch) {
            return `I can help you find information about ${planetMatch[1]}. Would you like me to search for it?`;
        }
        
        return "I can help you find planets and stars. What specific planet or star are you interested in?";
    }
    
    getAccountInfo() {
        if (this.context.userProfile) {
            return `You're logged in as ${this.context.userProfile.email}. I can help you manage your account settings, view your planets, or update your profile.`;
        }
        
        return "You're not logged in. Would you like help creating an account or logging in?";
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`chatbot_context_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.chatbotContextAwareness = new ChatbotContextAwareness(); });
} else {
    window.chatbotContextAwareness = new ChatbotContextAwareness();
}

