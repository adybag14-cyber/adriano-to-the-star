/**
 * Conversational AI Interface for Data Queries
 * Query data using natural language
 */
(function() {
    'use strict';

    class ConversationalAIDataQueries {
        constructor() {
            this.conversation = [];
            this.init();
        }

        init() {
            this.setupUI();
            this.trackEvent('conversational_ai_initialized');
        }

        setupUI() {
            if (!document.getElementById('conversational-ai')) {
                const ai = document.createElement('div');
                ai.id = 'conversational-ai';
                ai.className = 'conversational-ai';
                ai.innerHTML = `
                    <div class="chat-container" id="chat-container">
                        <div class="messages" id="messages"></div>
                        <div class="input-area">
                            <input type="text" id="query-input" placeholder="Ask a question about your data..." />
                            <button id="send-query">Send</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(ai);
            }

            document.getElementById('send-query')?.addEventListener('click', () => {
                this.sendQuery();
            });

            document.getElementById('query-input')?.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendQuery();
                }
            });
        }

        async sendQuery() {
            const input = document.getElementById('query-input');
            const query = input.value.trim();
            if (!query) return;

            this.addMessage('user', query);
            input.value = '';

            const response = await this.processQuery(query);
            this.addMessage('assistant', response);
        }

        addMessage(role, content) {
            const messages = document.getElementById('messages');
            if (!messages) return;

            const message = document.createElement('div');
            message.className = `message ${role}`;
            message.textContent = content;
            messages.appendChild(message);
            messages.scrollTop = messages.scrollHeight;
        }

        async processQuery(query) {
            // Process query with AI (would use AI service in production)
            const intent = this.parseIntent(query);
            const results = await this.executeQuery(intent);
            return this.formatResponse(intent, results);
        }

        parseIntent(query) {
            // Simple intent parsing
            if (query.toLowerCase().includes('show') || query.toLowerCase().includes('display')) {
                return { type: 'show', entity: 'data' };
            } else if (query.toLowerCase().includes('count')) {
                return { type: 'count', entity: 'records' };
            } else if (query.toLowerCase().includes('average') || query.toLowerCase().includes('avg')) {
                return { type: 'average', entity: 'value' };
            }
            return { type: 'general', query: query };
        }

        async executeQuery(intent) {
            if (window.database) {
                if (intent.type === 'count') {
                    const data = window.database.getAll();
                    return { count: data.length };
                } else if (intent.type === 'show') {
                    return window.database.getAll().slice(0, 10);
                }
            }
            return { message: 'Query executed' };
        }

        formatResponse(intent, results) {
            if (intent.type === 'count') {
                return `There are ${results.count} records in the database.`;
            } else if (intent.type === 'show') {
                return `Here are ${results.length} records: ${JSON.stringify(results)}`;
            }
            return 'I processed your query.';
        }

        trackEvent(eventName, data = {}) {
            try {
                if (window.performanceMonitoring) {
                    window.performanceMonitoring.recordMetric(`conversational_ai_${eventName}`, 1, data);
                }
            } catch (e) { /* Silent fail */ }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.conversationalAI = new ConversationalAIDataQueries();
        });
    } else {
        window.conversationalAI = new ConversationalAIDataQueries();
    }
})();

