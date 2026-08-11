/**
 * Planet Discovery AI Chat Assistant
 * AI-powered chat assistant for planet discovery questions
 */

class PlanetDiscoveryAIChat {
    constructor() {
        this.messages = [];
        this.isOpen = false;
        this.init();
    }

    init() {
        this.loadHistory();
        console.log('🤖 AI chat assistant initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_ai_ch_at_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    loadHistory() {
        try {
            const saved = localStorage.getItem('chat-history');
            if (saved) {
                this.messages = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    }

    saveHistory() {
        try {
            localStorage.setItem('chat-history', JSON.stringify(this.messages));
        } catch (error) {
            console.error('Error saving chat history:', error);
        }
    }

    renderChatWidget(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        container.innerHTML = `
            <div class="ai-chat-container" style="margin-top: 2rem;">
                <h3 style="color: #ba944f; margin-bottom: 1.5rem; text-align: center;">🤖 AI Chat Assistant</h3>
                
                <div style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin-bottom: 2rem;">
                    <p style="opacity: 0.9; line-height: 1.8; margin-bottom: 1rem;">
                        Ask questions about exoplanets, discovery methods, or get help navigating the platform. 
                        Our AI assistant is powered by advanced language models.
                    </p>
                    <button id="open-chat-btn" style="padding: 0.75rem 1.5rem; background: rgba(74, 222, 128, 0.2); border: 2px solid rgba(74, 222, 128, 0.5); border-radius: 10px; color: #4ade80; cursor: pointer; font-weight: 600;">
                        💬 Open Chat
                    </button>
                </div>
            </div>
        `;

        document.getElementById('open-chat-btn')?.addEventListener('click', () => {
            this.openChat();
        });
    }

    openChat() {
        if (this.isOpen) return;

        const chatWindow = document.createElement('div');
        chatWindow.id = 'ai-chat-window';
        chatWindow.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 400px;
            height: 600px;
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid rgba(186, 148, 79, 0.5);
            border-radius: 15px;
            display: flex;
            flex-direction: column;
            z-index: 10000;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        `;

        chatWindow.innerHTML = `
            <div style="background: rgba(186, 148, 79, 0.2); padding: 1rem; border-radius: 15px 15px 0 0; display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div style="font-size: 1.5rem;">🤖</div>
                    <div>
                        <div style="color: #ba944f; font-weight: 600;">AI Assistant</div>
                        <div style="font-size: 0.75rem; opacity: 0.7;">Online</div>
                    </div>
                </div>
                <button id="close-chat-btn" style="background: transparent; border: none; color: #ba944f; font-size: 1.5rem; cursor: pointer; padding: 0.25rem 0.5rem;">
                    ✕
                </button>
            </div>
            
            <div id="chat-messages" style="flex: 1; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: 1rem;">
                ${this.messages.length === 0 ? `
                    <div style="text-align: center; padding: 2rem; opacity: 0.7;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">🤖</div>
                        <p>Hello! I'm your AI assistant. Ask me anything about exoplanets!</p>
                    </div>
                ` : this.messages.map(msg => this.createMessageBubble(msg)).join('')}
            </div>
            
            <div style="padding: 1rem; border-top: 2px solid rgba(186, 148, 79, 0.3);">
                <form id="chat-form" style="display: flex; gap: 0.5rem;">
                    <input type="text" id="chat-input" placeholder="Ask a question..." style="flex: 1; padding: 0.75rem; background: rgba(0, 0, 0, 0.5); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 8px; color: white;">
                    <button type="submit" style="padding: 0.75rem 1.5rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 8px; color: #ba944f; cursor: pointer; font-weight: 600;">
                        Send
                    </button>
                </form>
            </div>
        `;

        document.body.appendChild(chatWindow);
        this.isOpen = true;

        // Scroll to bottom
        const messagesDiv = document.getElementById('chat-messages');
        messagesDiv.scrollTop = messagesDiv.scrollHeight;

        document.getElementById('close-chat-btn').addEventListener('click', () => {
            this.closeChat();
        });

        document.getElementById('chat-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.sendMessage();
        });
    }

    closeChat() {
        const chatWindow = document.getElementById('ai-chat-window');
        if (chatWindow) {
            chatWindow.remove();
            this.isOpen = false;
        }
    }

    createMessageBubble(message) {
        const isUser = message.role === 'user';
        return `
            <div style="display: flex; ${isUser ? 'justify-content: flex-end' : 'justify-content: flex-start'};">
                <div style="max-width: 80%; padding: 0.75rem 1rem; background: ${isUser ? 'rgba(186, 148, 79, 0.3)' : 'rgba(0, 0, 0, 0.5)'}; border-radius: 10px; ${isUser ? 'border-bottom-right-radius: 0' : 'border-bottom-left-radius: 0'};">
                    <div style="opacity: 0.9; line-height: 1.6;">${message.content}</div>
                    <div style="font-size: 0.7rem; opacity: 0.5; margin-top: 0.25rem;">${new Date(message.timestamp).toLocaleTimeString()}</div>
                </div>
            </div>
        `;
    }

    async sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        if (!message) return;

        // Add user message
        const userMessage = {
            role: 'user',
            content: message,
            timestamp: new Date().toISOString()
        };
        this.messages.push(userMessage);
        this.saveHistory();
        this.updateChatUI();

        input.value = '';

        // Show typing indicator
        this.showTypingIndicator();

        // Get AI response
        try {
            const response = await this.getAIResponse(message);
            
            const aiMessage = {
                role: 'assistant',
                content: response,
                timestamp: new Date().toISOString()
            };
            this.messages.push(aiMessage);
            this.saveHistory();
            this.updateChatUI();
        } catch (error) {
            console.error('Error getting AI response:', error);
            const errorMessage = {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date().toISOString()
            };
            this.messages.push(errorMessage);
            this.saveHistory();
            this.updateChatUI();
        }
    }

    async fetchJSON(url, options = {}) {
        try {
            const res = await fetch(url, options);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            console.warn(`[planet-discovery-ai-chat] Direct fetch failed for ${url}, attempting proxy...`, e.message);
            try {
                // Use AllOrigins proxy for CORS bypass
                const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl);
                if (!proxyRes.ok) throw new Error(`Proxy HTTP ${proxyRes.status}`);
                const data = await proxyRes.json();
                if (data && data.contents) {
                    return JSON.parse(data.contents);
                }
                throw new Error('Proxy returned empty or invalid data');
            } catch (proxyError) {
                console.error('[planet-discovery-ai-chat] Proxy fetch also failed:', proxyError.message);
                throw e; // Re-throw original error
            }
        }
    }

    async getAIResponse(message) {
        // Use Gemini API if available, otherwise use fallback
        if (window.GEMINI_API_KEY) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${window.GEMINI_API_KEY}`;
                const data = await this.fetchJSON(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: `You are an AI assistant helping users learn about exoplanets. Answer this question: ${message}`
                            }]
                        }]
                    })
                });

                if (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
                    return data.candidates[0].content.parts[0].text;
                }
            } catch (error) {
                console.error('Gemini API error:', error);
            }
        }

        // Fallback responses
        const lowerMessage = message.toLowerCase();
        if (lowerMessage.includes('what is') || lowerMessage.includes('what are')) {
            return 'An exoplanet is a planet that orbits a star outside our solar system. Thousands have been discovered using various detection methods.';
        } else if (lowerMessage.includes('how to') || lowerMessage.includes('how do')) {
            return 'Planets are discovered using methods like transit photometry (detecting star dimming) and radial velocity (measuring star wobble).';
        } else if (lowerMessage.includes('habitable')) {
            return 'The habitable zone, also called the Goldilocks zone, is the distance from a star where conditions might allow liquid water to exist on a planet\'s surface.';
        } else {
            return 'That\'s an interesting question about exoplanets! I can help you learn about planet discovery methods, habitable zones, or specific exoplanets. What would you like to know more about?';
        }
    }

    showTypingIndicator() {
        const messagesDiv = document.getElementById('chat-messages');
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = `
            <div style="display: flex; justify-content: flex-start;">
                <div style="padding: 0.75rem 1rem; background: rgba(0, 0, 0, 0.5); border-radius: 10px; border-bottom-left-radius: 0;">
                    <div style="display: flex; gap: 0.25rem;">
                        <div style="width: 8px; height: 8px; background: rgba(186, 148, 79, 0.7); border-radius: 50%; animation: typing 1.4s infinite;"></div>
                        <div style="width: 8px; height: 8px; background: rgba(186, 148, 79, 0.7); border-radius: 50%; animation: typing 1.4s infinite 0.2s;"></div>
                        <div style="width: 8px; height: 8px; background: rgba(186, 148, 79, 0.7); border-radius: 50%; animation: typing 1.4s infinite 0.4s;"></div>
                    </div>
                </div>
            </div>
        `;
        messagesDiv.appendChild(typingDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    updateChatUI() {
        const messagesDiv = document.getElementById('chat-messages');
        if (!messagesDiv) return;

        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }

        messagesDiv.innerHTML = this.messages.map(msg => this.createMessageBubble(msg)).join('');
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscoveryAIChat = new PlanetDiscoveryAIChat();
}

