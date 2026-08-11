/**
 * 🧠 Era IV: Neural Link (BCI) - Brain-Computer Interface
 * 
 * Enables thought-based ship control, lucid dream interaction,
 * and direct neural connection to the game world.
 */

class NeuralLinkSystem {
    constructor(game) {
        this.game = game;
        this.isConnected = false;
        this.neuralSignals = [];
        this.thoughtPatterns = new Map();
        this.dreamState = null;
        this.brainWaves = {
            delta: 0,
            theta: 0,
            alpha: 0,
            beta: 0,
            gamma: 0
        };
        this.signalHistory = [];
        
        console.log("🧠 Neural Link System: Initializing brain-computer interface...");
    }
    
    /**
     * Initialize the neural link
     */
    async initialize() {
        // Check for BCI device availability
        const bciAvailable = await this.checkBCIAvailability();
        
        if (bciAvailable) {
            await this.connectBCI();
        } else {
            console.log("🧠 No BCI device detected, running in simulation mode");
            this.startSimulationMode();
        }
        
        // Start neural monitoring
        this.startNeuralMonitoring();
        
        console.log("🧠 Neural Link Initialized");
    }
    
    /**
     * Check for BCI device availability
     */
    async checkBCIAvailability() {
        // Check for Web Bluetooth or other BCI APIs
        if (navigator.bluetooth) {
            try {
                const device = await navigator.bluetooth.requestDevice({
                    acceptAllDevices: true,
                    optionalServices: ['generic_access']
                });
                return device !== null;
            } catch (error) {
                console.log('🧠 Bluetooth BCI not available');
                return false;
            }
        }
        
        // Check for Web Speech API as alternative
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            console.log('🧠 Speech BCI available as alternative');
            return true;
        }
        
        return false;
    }
    
    /**
     * Connect to BCI device
     */
    async connectBCI() {
        try {
            // Connect to Bluetooth BCI device
            if (navigator.bluetooth) {
                const device = await navigator.bluetooth.requestDevice({
                    filters: [{ services: ['generic_access'] }]
                });
                
                const server = await device.gatt.connect();
                
                this.isConnected = true;
                console.log('🧠 BCI Connected');
                
                // Start receiving neural signals
                this.startNeuralSignalReception(server);
                
                // Dispatch connection event
                window.dispatchEvent(new CustomEvent('NEURAL_LINK_CONNECTED', {
                    detail: { device }
                }));
            }
        } catch (error) {
            console.error('🧠 BCI Connection Failed:', error);
            this.isConnected = false;
        }
    }
    
    /**
     * Start simulation mode (no physical BCI)
     */
    startSimulationMode() {
        this.isConnected = false;
        console.log('🧠 Neural Link running in simulation mode');
        
        // Simulate neural signals based on game state
        setInterval(() => {
            this.simulateNeuralSignals();
        }, 1000);
    }
    
    /**
     * Start receiving neural signals
     */
    startNeuralSignalReception(server) {
        // Subscribe to neural signal characteristic
        const service = server.getPrimaryService();
        const characteristic = service.getCharacteristic('neural_signal');
        
        characteristic.startNotifications().then(() => {
            characteristic.addEventListener('characteristicvaluechanged', (event) => {
                const signal = this.decodeNeuralSignal(event.target.value);
                this.processNeuralSignal(signal);
            });
        });
    }
    
    /**
     * Decode neural signal from BCI device
     */
    decodeNeuralSignal(data) {
        // Parse neural signal data
        const signal = {
            timestamp: Date.now(),
            waves: this.extractBrainWaves(data),
            patterns: this.extractThoughtPatterns(data),
            intent: this.extractIntent(data),
            confidence: this.calculateConfidence(data)
        };
        
        return signal;
    }
    
    /**
     * Extract brain wave frequencies from signal
     */
    extractBrainWaves(data) {
        // Simulated brain wave extraction
        return {
            delta: Math.random() * 100,      // 0.5-4 Hz (deep sleep)
            theta: Math.random() * 100,      // 4-8 Hz (meditation)
            alpha: Math.random() * 100,      // 8-13 Hz (relaxed)
            beta: Math.random() * 100,       // 13-30 Hz (active)
            gamma: Math.random() * 100       // 30-100 Hz (peak performance)
        };
    }
    
    /**
     * Extract thought patterns from signal
     */
    extractThoughtPatterns(data) {
        // Simulated pattern recognition
        const patterns = [];
        
        // Detect common thought patterns
        if (this.detectPattern('navigation', data)) {
            patterns.push('navigation');
        }
        if (this.detectPattern('combat', data)) {
            patterns.push('combat');
        }
        if (this.detectPattern('exploration', data)) {
            patterns.push('exploration');
        }
        if (this.detectPattern('communication', data)) {
            patterns.push('communication');
        }
        
        return patterns;
    }
    
    /**
     * Detect specific thought pattern
     */
    detectPattern(patternType, data) {
        // Simulated pattern detection
        const threshold = 0.7;
        const randomValue = Math.random();
        
        return randomValue > threshold;
    }
    
    /**
     * Extract intent from neural signal
     */
    extractIntent(data) {
        // Map neural patterns to game intents
        const intents = {
            'move_forward': 'ship.throttle',
            'move_backward': 'ship.brake',
            'turn_left': 'ship.yawLeft',
            'turn_right': 'ship.yawRight',
            'fire_weapon': 'ship.fire',
            'activate_shield': 'ship.activateShield',
            'scan_area': 'ship.scan',
            'open_menu': 'ui.openMenu',
            'zoom_in': 'camera.zoomIn',
            'zoom_out': 'camera.zoomOut'
        };
        
        // Detect intent based on signal patterns
        const detectedIntent = this.detectIntentFromSignal(data);
        
        return detectedIntent || null;
    }
    
    /**
     * Detect intent from neural signal
     */
    detectIntentFromSignal(data) {
        // Simulated intent detection
        const intents = Object.keys(this.thoughtPatterns);
        
        if (intents.length > 0) {
            return intents[Math.floor(Math.random() * intents.length)];
        }
        
        return null;
    }
    
    /**
     * Calculate confidence in signal interpretation
     */
    calculateConfidence(data) {
        // Simulated confidence calculation
        return 0.7 + Math.random() * 0.3;
    }
    
    /**
     * Process neural signal and execute intent
     */
    processNeuralSignal(signal) {
        // Store signal
        this.neuralSignals.push(signal);
        
        // Update brain waves
        this.brainWaves = signal.waves;
        
        // Update thought patterns
        signal.patterns.forEach(pattern => {
            this.thoughtPatterns.set(pattern, Date.now());
        });
        
        // Execute intent if detected
        if (signal.intent && signal.confidence > 0.8) {
            this.executeIntent(signal.intent);
        }
        
        // Update signal history
        this.signalHistory.push(signal);
        if (this.signalHistory.length > 100) {
            this.signalHistory.shift();
        }
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('NEURAL_SIGNAL_RECEIVED', {
            detail: { signal }
        }));
    }
    
    /**
     * Execute intent from neural signal
     */
    executeIntent(intent) {
        if (!this.game || !intent) return;
        
        // Parse intent
        const [action, method] = intent.split('.');
        
        if (action === 'ship' && this.game.ship) {
            switch (method) {
                case 'throttle':
                    this.game.ship.throttle(0.5);
                    break;
                case 'brake':
                    this.game.ship.brake(0.5);
                    break;
                case 'yawLeft':
                    this.game.ship.yaw(-0.5);
                    break;
                case 'yawRight':
                    this.game.ship.yaw(0.5);
                    break;
                case 'fire':
                    this.game.ship.fire();
                    break;
                case 'activateShield':
                    this.game.ship.activateShield();
                    break;
                case 'scan':
                    this.game.ship.scan();
                    break;
            }
        } else if (action === 'ui' && this.game.ui) {
            switch (method) {
                case 'openMenu':
                    this.game.ui.openMenu();
                    break;
            }
        } else if (action === 'camera' && this.game.camera) {
            switch (method) {
                case 'zoomIn':
                    this.game.camera.zoomIn();
                    break;
                case 'zoomOut':
                    this.game.camera.zoomOut();
                    break;
            }
        }
    }
    
    /**
     * Simulate neural signals (for simulation mode)
     */
    simulateNeuralSignals() {
        // Generate simulated neural signals
        const signal = {
            timestamp: Date.now(),
            waves: {
                delta: Math.random() * 100,
                theta: Math.random() * 100,
                alpha: Math.random() * 100,
                beta: Math.random() * 100,
                gamma: 30 + Math.random() * 70
            },
            patterns: ['navigation', 'exploration'],
            intent: null,
            confidence: 0.5
        };
        
        this.processNeuralSignal(signal);
    }
    
    /**
     * Start neural monitoring
     */
    startNeuralMonitoring() {
        // Monitor brain wave patterns every second
        setInterval(() => {
            this.analyzeBrainWaves();
        }, 1000);
    }
    
    /**
     * Analyze brain wave patterns
     */
    analyzeBrainWaves() {
        // Detect mental state from brain waves
        const state = this.detectMentalState();
        
        // Update game based on mental state
        if (this.game && this.game.player) {
            this.game.player.setMentalState(state);
        }
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('MENTAL_STATE_DETECTED', {
            detail: { state }
        }));
    }
    
    /**
     * Detect mental state from brain waves
     */
    detectMentalState() {
        const waves = this.brainWaves;
        
        // Determine mental state based on dominant wave
        const dominantWave = Object.entries(waves)
            .sort((a, b) => b[1] - a[1])[0][0];
        
        const states = {
            delta: 'deep_sleep',
            theta: 'meditation',
            alpha: 'relaxed',
            beta: 'active',
            gamma: 'peak_performance'
        };
        
        return states[dominantWave] || 'unknown';
    }
    
    /**
     * Enter lucid dream mode
     */
    async enterLucidDreamMode() {
        console.log('🧠 Entering Lucid Dream Mode...');
        
        this.dreamState = {
            active: true,
            lucidity: 0.5,
            dreamLevel: 1,
            startTime: Date.now()
        };
        
        // Start dream monitoring
        this.startDreamMonitoring();
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('LUCID_DREAM_ENTERED', {
            detail: { dreamState: this.dreamState }
        }));
    }
    
    /**
     * Exit lucid dream mode
     */
    exitLucidDreamMode() {
        console.log('🧠 Exiting Lucid Dream Mode...');
        
        this.dreamState = {
            active: false,
            lucidity: 0,
            dreamLevel: 0,
            endTime: Date.now(),
            duration: Date.now() - this.dreamState.startTime
        };
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('LUCID_DREAM_EXITED', {
            detail: { dreamState: this.dreamState }
        }));
    }
    
    /**
     * Start dream monitoring
     */
    startDreamMonitoring() {
        // Monitor dream lucidity every 5 seconds
        setInterval(() => {
            if (this.dreamState && this.dreamState.active) {
                this.monitorDreamLucidity();
            }
        }, 5000);
    }
    
    /**
     * Monitor dream lucidity
     */
    monitorDreamLucidity() {
        // Simulate lucidity changes
        const lucidityChange = (Math.random() - 0.5) * 0.1;
        this.dreamState.lucidity = Math.max(0, Math.min(1, this.dreamState.lucidity + lucidityChange));
        
        // Update dream level based on lucidity
        if (this.dreamState.lucidity > 0.8) {
            this.dreamState.dreamLevel = 3;
        } else if (this.dreamState.lucidity > 0.5) {
            this.dreamState.dreamLevel = 2;
        } else if (this.dreamState.lucidity > 0.2) {
            this.dreamState.dreamLevel = 1;
        } else {
            this.dreamState.dreamLevel = 0;
        }
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('DREAM_LUCIDITY_CHANGED', {
            detail: { lucidity: this.dreamState.lucidity, level: this.dreamState.dreamLevel }
        }));
    }
    
    /**
     * Send neural command to game
     */
    sendNeuralCommand(command, parameters = {}) {
        if (!this.isConnected) {
            console.log('🧠 Neural Link not connected');
            return false;
        }
        
        const neuralCommand = {
            id: this.generateCommandId(),
            command: command,
            parameters: parameters,
            timestamp: Date.now(),
            executed: false
        };
        
        try {
            // Execute command
            const success = this.executeNeuralCommand(neuralCommand);
            neuralCommand.executed = success;
            
            // Save command record
            this.saveNeuralCommand(neuralCommand);
            
            console.log(`🧠 Neural Command: ${command} - ${success ? 'Executed' : 'Failed'}`);
            
            return success;
        } catch (error) {
            console.error('🧠 Neural Command Failed:', error);
            return false;
        }
    }
    
    /**
     * Execute neural command
     */
    executeNeuralCommand(neuralCommand) {
        // Execute command in game
        if (!this.game) return false;
        
        switch (neuralCommand.command) {
            case 'navigate_to':
                return this.game.navigate(neuralCommand.parameters);
            case 'engage_target':
                return this.game.engageTarget(neuralCommand.parameters);
            case 'activate_system':
                return this.game.activateSystem(neuralCommand.parameters);
            case 'scan_area':
                return this.game.scanArea(neuralCommand.parameters);
            case 'emergency_stop':
                return this.game.emergencyStop();
            default:
                return false;
        }
    }
    
    /**
     * Get neural link status
     */
    getNeuralLinkStatus() {
        return {
            connected: this.isConnected,
            device: this.device,
            brainWaves: this.brainWaves,
            thoughtPatterns: Array.from(this.thoughtPatterns.keys()),
            dreamState: this.dreamState,
            signalCount: this.neuralSignals.length
        };
    }
    
    /**
     * Get signal history
     */
    getSignalHistory(limit = 100) {
        return this.signalHistory.slice(-limit);
    }
    
    /**
     * Save neural command to server
     */
    async saveNeuralCommand(command) {
        try {
            const response = await fetch('/api/neurallink/commands', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json'
                },
                body: JSON.stringify(command)
            });
            
            return await response.json();
        } catch (error) {
            console.error('Failed to save neural command:', error);
            return null;
        }
    }
    
    /**
     * Generate unique command ID
     */
    generateCommandId() {
        return `command_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Disconnect from BCI
     */
    disconnect() {
        this.isConnected = false;
        this.neuralSignals = [];
        this.thoughtPatterns.clear();
        this.brainWaves = {
            delta: 0,
            theta: 0,
            alpha: 0,
            beta: 0,
            gamma: 0
        };
        
        console.log('🧠 Neural Link Disconnected');
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('NEURAL_LINK_DISCONNECTED'));
    }
}

// Expose for use
if (typeof window !== 'undefined') {
    window.NeuralLinkSystem = NeuralLinkSystem;
}
