/**
 * Voice Command Recognition
 * Voice command recognition and processing
 */

class VoiceCommandRecognition {
    constructor() {
        this.recognition = null;
        this.commands = {};
        this.isListening = false;
        this.init();
    }
    
    init() {
        this.setupSpeechRecognition();
        this.loadCommands();
    }
    
    setupSpeechRecognition() {
        // Setup Web Speech API
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.processCommand(transcript);
            };
            
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
            };
        } else {
            console.warn('Speech recognition not supported');
        }
    }
    
    loadCommands() {
        // Load voice commands
        this.commands = {
            search: ['search', 'find', 'look for', 'show me'],
            navigate: ['go to', 'open', 'navigate to', 'take me to'],
            play: ['play', 'start', 'begin'],
            stop: ['stop', 'pause', 'cancel'],
            help: ['help', 'what can you do', 'commands']
        };
    }
    
    startListening() {
        if (!this.recognition) {
            console.warn('Speech recognition not available');
            return false;
        }
        
        if (this.isListening) {
            this.stopListening();
        }
        
        try {
            this.recognition.start();
            this.isListening = true;
            return true;
        } catch (e) {
            console.error('Failed to start listening:', e);
            return false;
        }
    }
    
    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
        }
    }
    
    processCommand(transcript) {
        const lowerTranscript = transcript.toLowerCase().trim();
        
        // Match command
        if (this.matchesCommand(lowerTranscript, 'search')) {
            this.handleSearchCommand(lowerTranscript);
        } else if (this.matchesCommand(lowerTranscript, 'navigate')) {
            this.handleNavigateCommand(lowerTranscript);
        } else if (this.matchesCommand(lowerTranscript, 'play')) {
            this.handlePlayCommand(lowerTranscript);
        } else if (this.matchesCommand(lowerTranscript, 'stop')) {
            this.handleStopCommand();
        } else if (this.matchesCommand(lowerTranscript, 'help')) {
            this.handleHelpCommand();
        } else {
            this.handleUnknownCommand(lowerTranscript);
        }
    }
    
    matchesCommand(transcript, commandType) {
        return this.commands[commandType].some(cmd => 
            transcript.startsWith(cmd)
        );
    }
    
    handleSearchCommand(transcript) {
        // Extract search query
        const query = transcript.replace(/^(search|find|look for|show me)\s+/i, '');
        
        // Perform search
        if (window.naturalLanguageQueryProcessing) {
            window.naturalLanguageQueryProcessing.processQuery(query);
        } else {
            // Fallback to simple search
            const searchInput = document.querySelector('input[type="search"]');
            if (searchInput) {
                searchInput.value = query;
                searchInput.dispatchEvent(new Event('input'));
            }
        }
    }
    
    handleNavigateCommand(transcript) {
        // Extract destination
        const destination = transcript.replace(/^(go to|open|navigate to|take me to)\s+/i, '');
        
        // Navigate
        const routes = {
            'home': '/',
            'dashboard': '/dashboard',
            'planets': '/planets',
            'profile': '/profile'
        };
        
        const route = routes[destination.toLowerCase()];
        if (route) {
            window.location.href = route;
        }
    }
    
    handlePlayCommand(transcript) {
        // Handle play command
        console.log('Play command:', transcript);
    }
    
    handleStopCommand() {
        // Handle stop command
        this.stopListening();
    }
    
    handleHelpCommand() {
        // Show available commands
        if (window.toastNotificationQueue) {
            const commands = Object.values(this.commands).flat().join(', ');
            window.toastNotificationQueue.show(
                `Available commands: ${commands}`,
                'info'
            );
        }
    }
    
    handleUnknownCommand(transcript) {
        // Handle unknown command
        if (window.toastNotificationQueue) {
            window.toastNotificationQueue.show(
                `Command not recognized: "${transcript}". Say "help" for available commands.`,
                'warning'
            );
        }
    }
    
    setupVoiceButton() {
        // Create voice command button
        const button = document.createElement('button');
        button.id = 'voice-command-btn';
        button.style.cssText = 'position:fixed;bottom:80px;right:20px;width:50px;height:50px;background:#ba944f;color:white;border:none;border-radius:50%;cursor:pointer;font-size:20px;z-index:9999;';
        button.textContent = '🎤';
        button.title = 'Voice Commands';
        
        button.addEventListener('click', () => {
            if (this.isListening) {
                this.stopListening();
                button.style.background = '#ba944f';
            } else {
                if (this.startListening()) {
                    button.style.background = '#e53e3e';
                }
            }
        });
        
        document.body.appendChild(button);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { 
        window.voiceCommandRecognition = new VoiceCommandRecognition();
        window.voiceCommandRecognition.setupVoiceButton();
    });
} else {
    window.voiceCommandRecognition = new VoiceCommandRecognition();
    window.voiceCommandRecognition.setupVoiceButton();
}

