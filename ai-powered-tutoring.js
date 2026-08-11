/**
 * AI-Powered Tutoring System
 * Intelligent tutoring for space education with adaptive learning
 * @author Agent 3 - Adriano To The Star
 */

class AIPoweredTutoring {
    constructor() {
        this.studentProfile = null;
        this.currentSession = null;
        this.tutoringHistory = [];
        this.aiModel = 'gemini-2.5-flash';
        this.init();
    }

    init() {
        this.loadStudentProfile();
        this.createTutoringInterface();
        this.setupEventListeners();
        this.trackEvent('tutoring_initialized');
    }

    createTutoringInterface() {
        const interfaceElement = document.createElement('div');
        interfaceElement.id = 'ai-tutoring-interface';
        interfaceElement.innerHTML = `
            <div class="tutoring-container">
                <div class="tutoring-header">
                    <h2>🚀 Space Education Tutor</h2>
                    <div class="student-info">
                        <span class="student-level">Level: ${this.getStudentLevel()}</span>
                        <span class="student-progress">Progress: ${this.getStudentProgress()}%</span>
                    </div>
                </div>
                
                <div class="tutoring-main">
                    <div class="tutoring-chat">
                        <div class="chat-messages" id="tutoring-messages"></div>
                        <div class="chat-input-container">
                            <input type="text" id="tutoring-input" placeholder="Ask me anything about space...">
                            <button id="tutoring-send">Send</button>
                        </div>
                    </div>
                    
                    <div class="tutoring-sidebar">
                        <div class="learning-objectives">
                            <h3>Current Objectives</h3>
                            <ul id="objectives-list"></ul>
                        </div>
                        
                        <div class="progress-tracker">
                            <h3>Your Progress</h3>
                            <div class="progress-bars">
                                <div class="progress-item">
                                    <span>Physics</span>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${this.getTopicProgress('physics')}%"></div>
                                    </div>
                                </div>
                                <div class="progress-item">
                                    <span>Astronomy</span>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${this.getTopicProgress('astronomy')}%"></div>
                                    </div>
                                </div>
                                <div class="progress-item">
                                    <span>Engineering</span>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${this.getTopicProgress('engineering')}%"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="recommended-topics">
                            <h3>Recommended Topics</h3>
                            <ul id="topics-list"></ul>
                        </div>
                    </div>
                </div>
                
                <div class="tutoring-tools">
                    <button class="tool-btn" data-tool="simulation">🔬 Simulation</button>
                    <button class="tool-btn" data-tool="quiz">📝 Quiz</button>
                    <button class="tool-btn" data-tool="visualization">📊 Visualization</button>
                    <button class="tool-btn" data-tool="resources">📚 Resources</button>
                </div>
            </div>
        `;

        document.body.appendChild(interfaceElement);
        this.addTutoringStyles();
        this.updateInterface();
    }

    loadStudentProfile() {
        const saved = localStorage.getItem('student-profile');
        if (saved) {
            this.studentProfile = JSON.parse(saved);
        } else {
            this.studentProfile = {
                id: 'student_' + Date.now(),
                name: 'Student',
                level: 1,
                experience: 0,
                topics: {
                    physics: { progress: 0, difficulty: 1 },
                    astronomy: { progress: 0, difficulty: 1 },
                    engineering: { progress: 0, difficulty: 1 }
                },
                learningStyle: 'visual',
                preferences: {
                    pace: 'normal',
                    feedback: 'detailed',
                    challenges: 'moderate'
                },
                history: []
            };
            this.saveStudentProfile();
        }
    }

    saveStudentProfile() {
        localStorage.setItem('student-profile', JSON.stringify(this.studentProfile));
    }

    getStudentLevel() {
        const totalExp = this.studentProfile.experience;
        if (totalExp < 100) return 'Beginner';
        if (totalExp < 500) return 'Intermediate';
        if (totalExp < 1000) return 'Advanced';
        return 'Expert';
    }

    getStudentProgress() {
        const totalProgress = Object.values(this.studentProfile.topics)
            .reduce((sum, topic) => sum + topic.progress, 0);
        return Math.round(totalProgress / Object.keys(this.studentProfile.topics).length);
    }

    getTopicProgress(topic) {
        return this.studentProfile.topics[topic]?.progress || 0;
    }

    async generateTutoringResponse(question) {
        const context = this.buildTutoringContext(question);

        // Simulate AI response (in real implementation would call AI API)
        const responses = [
            "Great question! Let me explain that concept in a way that matches your learning style.",
            "Based on your current level, I think you're ready to understand this more deeply.",
            "That's an excellent observation! Have you considered how this relates to real space missions?",
            "Let me break this down step by step for you.",
            "I can see you're making progress! Here's how this connects to what you've learned before."
        ];

        const response = responses[Math.floor(Math.random() * responses.length)];
        const adaptedResponse = this.adaptResponseToStudent(response, question);

        return {
            text: adaptedResponse,
            suggestions: this.generateLearningSuggestions(question),
            resources: this.findRelevantResources(question),
            nextSteps: this.generateNextSteps(question)
        };
    }

    buildTutoringContext(question) {
        return {
            studentLevel: this.getStudentLevel(),
            currentTopics: Object.keys(this.studentProfile.topics),
            learningStyle: this.studentProfile.learningStyle,
            recentHistory: this.studentProfile.history.slice(-5),
            question: question
        };
    }

    adaptResponseToStudent(response, question) {
        const level = this.getStudentLevel();
        const style = this.studentProfile.learningStyle;

        let adapted = response;

        // Adapt to level
        if (level === 'Beginner') {
            adapted += " Let's start with the basics and build up from there.";
        } else if (level === 'Expert') {
            adapted += " Since you're at an advanced level, let's explore the nuances.";
        }

        // Adapt to learning style
        if (style === 'visual') {
            adapted += " I recommend visualizing this concept with a diagram.";
        } else if (style === 'kinesthetic') {
            adapted += " Try to imagine how this would work in a hands-on experiment.";
        }

        return adapted;
    }

    generateLearningSuggestions(question) {
        const suggestions = [
            "Practice with orbital mechanics calculations",
            "Study real NASA mission examples",
            "Watch a video about this concept",
            "Try the interactive simulation"
        ];

        return suggestions.slice(0, 2);
    }

    findRelevantResources(question) {
        return [
            { type: 'video', title: 'Introduction to Rocket Propulsion', duration: '10 min' },
            { type: 'article', title: 'Understanding Orbital Mechanics', readTime: '5 min' },
            { type: 'simulation', title: 'Launch Trajectory Simulator' }
        ];
    }

    generateNextSteps(question) {
        return [
            "Complete the practice problems",
            "Take a short quiz on this topic",
            "Explore advanced applications"
        ];
    }

    async handleStudentMessage(message) {
        this.addMessageToChat('student', message);

        // Show typing indicator
        this.showTypingIndicator();

        // Generate AI response
        const response = await this.generateTutoringResponse(message);

        // Hide typing indicator
        this.hideTypingIndicator();

        // Add AI response to chat
        this.addMessageToChat('tutor', response.text);

        // Add learning suggestions
        if (response.suggestions.length > 0) {
            this.addSuggestionsToChat(response.suggestions);
        }

        // Update student profile
        this.updateStudentProgress(message);

        // Save session
        this.saveSession(message, response);
    }

    addMessageToChat(sender, message) {
        const messagesContainer = document.getElementById('tutoring-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}`;
        messageDiv.innerHTML = `
            <div class="message-content">${message}</div>
            <div class="message-time">${new Date().toLocaleTimeString()}</div>
        `;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    addSuggestionsToChat(suggestions) {
        const messagesContainer = document.getElementById('tutoring-messages');
        const suggestionsDiv = document.createElement('div');
        suggestionsDiv.className = 'learning-suggestions';
        suggestionsDiv.innerHTML = `
            <div class="suggestions-header">💡 Learning Suggestions:</div>
            <ul>
                ${suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
            </ul>
        `;
        messagesContainer.appendChild(suggestionsDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    showTypingIndicator() {
        const messagesContainer = document.getElementById('tutoring-messages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-message tutor typing';
        typingDiv.innerHTML = `
            <div class="typing-indicator">
                <span></span><span></span><span></span>
            </div>
        `;
        typingDiv.id = 'typing-indicator';
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    updateStudentProgress(message) {
        // Simulate progress based on message content
        const topics = ['physics', 'astronomy', 'engineering'];
        const randomTopic = topics[Math.floor(Math.random() * topics.length)];

        this.studentProfile.topics[randomTopic].progress = Math.min(100,
            this.studentProfile.topics[randomTopic].progress + 2);
        this.studentProfile.experience += 5;

        this.saveStudentProfile();
        this.updateInterface();
    }

    saveSession(message, response) {
        const session = {
            timestamp: new Date().toISOString(),
            question: message,
            response: response,
            progress: this.getStudentProgress()
        };

        this.tutoringHistory.push(session);
        this.studentProfile.history.push(session);

        // Keep only last 50 sessions
        if (this.tutoringHistory.length > 50) {
            this.tutoringHistory.shift();
        }

        localStorage.setItem('tutoring-history', JSON.stringify(this.tutoringHistory));
    }

    updateInterface() {
        // Update student info
        document.querySelector('.student-level').textContent = `Level: ${this.getStudentLevel()}`;
        document.querySelector('.student-progress').textContent = `Progress: ${this.getStudentProgress()}%`;

        // Update progress bars
        document.querySelector('.progress-fill').style.width = `${this.getTopicProgress('physics')}%`;

        // Update objectives
        this.updateLearningObjectives();

        // Update recommended topics
        this.updateRecommendedTopics();
    }

    updateLearningObjectives() {
        const objectives = [
            "Understand basic orbital mechanics",
            "Learn about rocket propulsion systems",
            "Explore space mission planning"
        ];

        const objectivesList = document.getElementById('objectives-list');
        objectivesList.innerHTML = objectives.map(obj => `<li>${obj}</li>`).join('');
    }

    updateRecommendedTopics() {
        const topics = [
            "Introduction to Astrophysics",
            "Spacecraft Design Principles",
            "Planetary Science Basics"
        ];

        const topicsList = document.getElementById('topics-list');
        topicsList.innerHTML = topics.map(topic => `<li>${topic}</li>`).join('');
    }

    setupEventListeners() {
        const input = document.getElementById('tutoring-input');
        const sendBtn = document.getElementById('tutoring-send');

        const sendMessage = async () => {
            const message = input.value.trim();
            if (message) {
                await this.handleStudentMessage(message);
                input.value = '';
            }
        };

        sendBtn.addEventListener('click', sendMessage);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });

        // Tool buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleToolSelection(btn.dataset.tool);
            });
        });
    }

    handleToolSelection(tool) {
        switch (tool) {
            case 'simulation':
                this.openSimulation();
                break;
            case 'quiz':
                this.startQuiz();
                break;
            case 'visualization':
                this.showVisualization();
                break;
            case 'resources':
                this.showResources();
                break;
        }
    }

    openSimulation() {
        this.addMessageToChat('tutor', "I've opened an interactive simulation for you. Try adjusting the parameters to see how they affect the rocket's trajectory!");
    }

    startQuiz() {
        this.addMessageToChat('tutor', "Let's test your knowledge with a quick quiz on the current topic!");
    }

    showVisualization() {
        this.addMessageToChat('tutor', "Here's a visual representation that will help you understand this concept better.");
    }

    showResources() {
        this.addMessageToChat('tutor', "I've gathered some additional resources that complement what we're discussing.");
    }

    addTutoringStyles() {
        if (document.querySelector('#tutoring-styles')) return;

        const style = document.createElement('style');
        style.id = 'tutoring-styles';
        style.textContent = `
            #ai-tutoring-interface {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 90%;
                max-width: 1200px;
                height: 80vh;
                background: var(--color-surface);
                border-radius: 12px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                z-index: 10000;
                display: flex;
                flex-direction: column;
            }
            
            .tutoring-container {
                height: 100%;
                display: flex;
                flex-direction: column;
            }
            
            .tutoring-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                border-bottom: 1px solid var(--color-background);
            }
            
            .tutoring-header h2 {
                margin: 0;
                color: var(--color-text);
            }
            
            .student-info {
                display: flex;
                gap: 20px;
                color: var(--color-text-secondary);
            }
            
            .tutoring-main {
                flex: 1;
                display: flex;
                overflow: hidden;
            }
            
            .tutoring-chat {
                flex: 2;
                display: flex;
                flex-direction: column;
                border-right: 1px solid var(--color-background);
            }
            
            .chat-messages {
                flex: 1;
                padding: 20px;
                overflow-y: auto;
            }
            
            .chat-message {
                margin-bottom: 15px;
                max-width: 80%;
            }
            
            .chat-message.student {
                margin-left: auto;
            }
            
            .chat-message.tutor {
                margin-right: auto;
            }
            
            .message-content {
                background: var(--color-background);
                padding: 12px 16px;
                border-radius: 12px;
                color: var(--color-text);
            }
            
            .chat-message.student .message-content {
                background: var(--color-primary);
                color: white;
            }
            
            .message-time {
                font-size: 11px;
                color: var(--color-text-secondary);
                margin-top: 4px;
                text-align: right;
            }
            
            .typing-indicator {
                display: flex;
                gap: 4px;
                padding: 12px 16px;
            }
            
            .typing-indicator span {
                width: 8px;
                height: 8px;
                background: var(--color-text-secondary);
                border-radius: 50%;
                animation: typing 1.4s infinite;
            }
            
            .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
            .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
            
            @keyframes typing {
                0%, 60%, 100% { transform: translateY(0); }
                30% { transform: translateY(-10px); }
            }
            
            .learning-suggestions {
                background: var(--color-background);
                padding: 15px;
                border-radius: 8px;
                margin-top: 10px;
            }
            
            .suggestions-header {
                font-weight: 600;
                color: var(--color-primary);
                margin-bottom: 8px;
            }
            
            .learning-suggestions ul {
                margin: 0;
                padding-left: 20px;
                color: var(--color-text);
            }
            
            .chat-input-container {
                padding: 20px;
                border-top: 1px solid var(--color-background);
                display: flex;
                gap: 10px;
            }
            
            #tutoring-input {
                flex: 1;
                padding: 12px;
                border: 1px solid var(--color-background);
                border-radius: 6px;
                background: var(--color-surface);
                color: var(--color-text);
            }
            
            #tutoring-send {
                padding: 12px 20px;
                background: var(--color-primary);
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
            }
            
            .tutoring-sidebar {
                flex: 1;
                padding: 20px;
                overflow-y: auto;
            }
            
            .tutoring-sidebar h3 {
                color: var(--color-text);
                margin-bottom: 15px;
            }
            
            .progress-bars {
                margin-bottom: 20px;
            }
            
            .progress-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }
            
            .progress-bar {
                flex: 1;
                height: 8px;
                background: var(--color-background);
                border-radius: 4px;
                margin-left: 10px;
                overflow: hidden;
            }
            
            .progress-fill {
                height: 100%;
                background: var(--color-primary);
                transition: width 0.3s ease;
            }
            
            .tutoring-tools {
                padding: 20px;
                border-top: 1px solid var(--color-background);
                display: flex;
                gap: 10px;
            }
            
            .tool-btn {
                flex: 1;
                padding: 10px;
                background: var(--color-background);
                color: var(--color-text);
                border: none;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .tool-btn:hover {
                background: var(--color-primary);
                color: white;
            }
        `;
        document.head.appendChild(style);
    }
}

AIPoweredTutoring.prototype.trackEvent = function (eventName, data = {}) {
    try {
        if (window.performanceMonitoring) {
            window.performanceMonitoring.recordMetric(`tutoring_${eventName}`, 1, data);
        }
        if (window.analytics) {
            window.analytics.track(eventName, { module: 'ai_powered_tutoring', ...data });
        }
    } catch (e) { /* Silent fail */ }
};

// Initialize
window.AIPoweredTutoring = AIPoweredTutoring;
window.aiTutor = new AIPoweredTutoring();
