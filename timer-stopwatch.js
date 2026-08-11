/**
 * Timer & Stopwatch
 * 
 * Timer and stopwatch functionality with multiple timers,
 * alarms, and lap time tracking.
 * 
 * @class TimerStopwatch
 * @example
 * // Auto-initializes on page load
 * // Access via: window.timerStopwatch()
 * 
 * // Start timer
 * const timer = window.timerStopwatch();
 * timer.startTimer(60); // 60 seconds
 */
class TimerStopwatch {
    constructor() {
        this.timers = [];
        this.stopwatch = {
            running: false,
            startTime: null,
            elapsed: 0,
            laps: []
        };
        this.init();
    }

    init() {
        // Create timer/stopwatch button
        this.createTimerButton();
        
        console.log('✅ Timer & Stopwatch initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("t_im_er_st_op_wa_tc_h_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Create timer button
     * 
     * @method createTimerButton
     * @returns {void}
     */
    createTimerButton() {
        // Check if button already exists
        if (document.getElementById('timer-stopwatch-btn')) return;

        const button = document.createElement('button');
        button.id = 'timer-stopwatch-btn';
        button.className = 'timer-stopwatch-btn';
        button.setAttribute('aria-label', 'Timer & Stopwatch');
        button.innerHTML = '⏱️';
        button.title = 'Timer & Stopwatch';
        
        button.addEventListener('click', () => this.showTimerModal());
        
        document.body.appendChild(button);
    }

    /**
     * Show timer modal
     * 
     * @method showTimerModal
     * @returns {void}
     */
    showTimerModal() {
        // Check if modal already exists
        let modal = document.getElementById('timer-stopwatch-modal');
        if (modal) {
            modal.classList.add('open');
            this.updateDisplay();
            return;
        }

        // Create modal
        modal = document.createElement('div');
        modal.id = 'timer-stopwatch-modal';
        modal.className = 'timer-stopwatch-modal';
        modal.innerHTML = `
            <div class="timer-stopwatch-content">
                <div class="timer-stopwatch-header">
                    <h3>⏱️ Timer & Stopwatch</h3>
                    <button class="timer-stopwatch-close" aria-label="Close">×</button>
                </div>
                <div class="timer-stopwatch-body">
                    <div class="timer-tabs">
                        <button class="timer-tab active" data-tab="stopwatch">Stopwatch</button>
                        <button class="timer-tab" data-tab="timer">Timer</button>
                    </div>
                    <div class="timer-content">
                        <!-- Stopwatch -->
                        <div class="timer-panel active" id="stopwatch-panel">
                            <div class="stopwatch-display" id="stopwatch-display">00:00:00.00</div>
                            <div class="stopwatch-controls">
                                <button class="timer-btn start" id="stopwatch-start">Start</button>
                                <button class="timer-btn pause" id="stopwatch-pause" style="display: none;">Pause</button>
                                <button class="timer-btn reset" id="stopwatch-reset">Reset</button>
                                <button class="timer-btn lap" id="stopwatch-lap">Lap</button>
                            </div>
                            <div class="stopwatch-laps" id="stopwatch-laps"></div>
                        </div>
                        <!-- Timer -->
                        <div class="timer-panel" id="timer-panel">
                            <div class="timer-inputs">
                                <input type="number" id="timer-hours" min="0" max="23" value="0" placeholder="H">
                                <span>:</span>
                                <input type="number" id="timer-minutes" min="0" max="59" value="0" placeholder="M">
                                <span>:</span>
                                <input type="number" id="timer-seconds" min="0" max="59" value="0" placeholder="S">
                            </div>
                            <div class="timer-display" id="timer-display">00:00:00</div>
                            <div class="timer-controls">
                                <button class="timer-btn start" id="timer-start">Start</button>
                                <button class="timer-btn pause" id="timer-pause" style="display: none;">Pause</button>
                                <button class="timer-btn reset" id="timer-reset">Reset</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Setup event listeners
        this.setupEventListeners();

        // Start update loop
        this.startUpdateLoop();

        // Show modal
        setTimeout(() => modal.classList.add('open'), 10);
    }

    /**
     * Setup event listeners
     * 
     * @method setupEventListeners
     * @returns {void}
     */
    setupEventListeners() {
        const modal = document.getElementById('timer-stopwatch-modal');
        if (!modal) return;

        // Close button
        const closeBtn = modal.querySelector('.timer-stopwatch-close');
        closeBtn.addEventListener('click', () => this.hideTimerModal());

        // Tabs
        modal.querySelectorAll('.timer-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Stopwatch controls
        const stopwatchStart = modal.querySelector('#stopwatch-start');
        const stopwatchPause = modal.querySelector('#stopwatch-pause');
        const stopwatchReset = modal.querySelector('#stopwatch-reset');
        const stopwatchLap = modal.querySelector('#stopwatch-lap');

        stopwatchStart.addEventListener('click', () => this.startStopwatch());
        stopwatchPause.addEventListener('click', () => this.pauseStopwatch());
        stopwatchReset.addEventListener('click', () => this.resetStopwatch());
        stopwatchLap.addEventListener('click', () => this.addLap());

        // Timer controls
        const timerStart = modal.querySelector('#timer-start');
        const timerPause = modal.querySelector('#timer-pause');
        const timerReset = modal.querySelector('#timer-reset');

        timerStart.addEventListener('click', () => this.startTimer());
        timerPause.addEventListener('click', () => this.pauseTimer());
        timerReset.addEventListener('click', () => this.resetTimer());

        // Timer inputs
        modal.querySelectorAll('#timer-hours, #timer-minutes, #timer-seconds').forEach(input => {
            input.addEventListener('input', () => this.updateTimerDisplay());
        });

        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideTimerModal();
            }
        });
    }

    /**
     * Switch tab
     * 
     * @method switchTab
     * @param {string} tabName - Tab name
     * @returns {void}
     */
    switchTab(tabName) {
        const modal = document.getElementById('timer-stopwatch-modal');
        if (!modal) return;

        // Update tabs
        modal.querySelectorAll('.timer-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update panels
        modal.querySelectorAll('.timer-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${tabName}-panel`);
        });
    }

    /**
     * Start stopwatch
     * 
     * @method startStopwatch
     * @returns {void}
     */
    startStopwatch() {
        if (!this.stopwatch.running) {
            this.stopwatch.running = true;
            this.stopwatch.startTime = Date.now() - this.stopwatch.elapsed;
        }

        this.updateStopwatchControls();
    }

    /**
     * Pause stopwatch
     * 
     * @method pauseStopwatch
     * @returns {void}
     */
    pauseStopwatch() {
        this.stopwatch.running = false;
        this.updateStopwatchControls();
    }

    /**
     * Reset stopwatch
     * 
     * @method resetStopwatch
     * @returns {void}
     */
    resetStopwatch() {
        this.stopwatch.running = false;
        this.stopwatch.elapsed = 0;
        this.stopwatch.laps = [];
        this.updateStopwatchControls();
        this.updateDisplay();
    }

    /**
     * Add lap
     * 
     * @method addLap
     * @returns {void}
     */
    addLap() {
        if (!this.stopwatch.running) return;

        const lapTime = this.stopwatch.elapsed;
        this.stopwatch.laps.push(lapTime);
        this.renderLaps();
    }

    /**
     * Start timer
     * 
     * @method startTimer
     * @returns {void}
     */
    startTimer() {
        const modal = document.getElementById('timer-stopwatch-modal');
        if (!modal) return;

        const hours = parseInt(modal.querySelector('#timer-hours').value) || 0;
        const minutes = parseInt(modal.querySelector('#timer-minutes').value) || 0;
        const seconds = parseInt(modal.querySelector('#timer-seconds').value) || 0;

        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
        if (totalSeconds <= 0) {
            this.showNotification('Please set a timer duration', 'warning');
            return;
        }

        if (!this.timer) {
            this.timer = {
                running: true,
                totalSeconds: totalSeconds,
                remaining: totalSeconds,
                startTime: Date.now()
            };
        } else {
            this.timer.running = true;
            this.timer.startTime = Date.now() - (this.timer.totalSeconds - this.timer.remaining) * 1000;
        }

        this.updateTimerControls();
    }

    /**
     * Pause timer
     * 
     * @method pauseTimer
     * @returns {void}
     */
    pauseTimer() {
        if (this.timer) {
            this.timer.running = false;
        }
        this.updateTimerControls();
    }

    /**
     * Reset timer
     * 
     * @method resetTimer
     * @returns {void}
     */
    resetTimer() {
        this.timer = null;
        const modal = document.getElementById('timer-stopwatch-modal');
        if (modal) {
            modal.querySelector('#timer-hours').value = 0;
            modal.querySelector('#timer-minutes').value = 0;
            modal.querySelector('#timer-seconds').value = 0;
        }
        this.updateTimerDisplay();
        this.updateTimerControls();
    }

    /**
     * Update display
     * 
     * @method updateDisplay
     * @returns {void}
     */
    updateDisplay() {
        this.updateStopwatchDisplay();
        this.updateTimerDisplay();
    }

    /**
     * Update stopwatch display
     * 
     * @method updateStopwatchDisplay
     * @returns {void}
     */
    updateStopwatchDisplay() {
        if (this.stopwatch.running) {
            this.stopwatch.elapsed = Date.now() - this.stopwatch.startTime;
        }

        const display = document.getElementById('stopwatch-display');
        if (display) {
            display.textContent = this.formatTime(this.stopwatch.elapsed, true);
        }
    }

    /**
     * Update timer display
     * 
     * @method updateTimerDisplay
     * @returns {void}
     */
    updateTimerDisplay() {
        const modal = document.getElementById('timer-stopwatch-modal');
        if (!modal) return;

        const display = modal.querySelector('#timer-display');

        if (this.timer && this.timer.running) {
            const elapsed = Math.floor((Date.now() - this.timer.startTime) / 1000);
            this.timer.remaining = Math.max(0, this.timer.totalSeconds - elapsed);

            if (this.timer.remaining <= 0) {
                this.timer.running = false;
                this.timer.remaining = 0;
                this.onTimerComplete();
            }
        }

        if (this.timer) {
            display.textContent = this.formatTime(this.timer.remaining * 1000);
        } else {
            const hours = parseInt(modal.querySelector('#timer-hours').value) || 0;
            const minutes = parseInt(modal.querySelector('#timer-minutes').value) || 0;
            const seconds = parseInt(modal.querySelector('#timer-seconds').value) || 0;
            const total = hours * 3600 + minutes * 60 + seconds;
            display.textContent = this.formatTime(total * 1000);
        }
    }

    /**
     * Format time
     * 
     * @method formatTime
     * @param {number} ms - Milliseconds
     * @param {boolean} showMs - Show milliseconds
     * @returns {string} Formatted time
     */
    formatTime(ms, showMs = false) {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const milliseconds = Math.floor((ms % 1000) / 10);

        if (showMs) {
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(2, '0')}`;
        }
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    /**
     * Update stopwatch controls
     * 
     * @method updateStopwatchControls
     * @returns {void}
     */
    updateStopwatchControls() {
        const modal = document.getElementById('timer-stopwatch-modal');
        if (!modal) return;

        const start = modal.querySelector('#stopwatch-start');
        const pause = modal.querySelector('#stopwatch-pause');

        if (this.stopwatch.running) {
            start.style.display = 'none';
            pause.style.display = 'inline-block';
        } else {
            start.style.display = 'inline-block';
            pause.style.display = 'none';
        }
    }

    /**
     * Update timer controls
     * 
     * @method updateTimerControls
     * @returns {void}
     */
    updateTimerControls() {
        const modal = document.getElementById('timer-stopwatch-modal');
        if (!modal) return;

        const start = modal.querySelector('#timer-start');
        const pause = modal.querySelector('#timer-pause');

        if (this.timer && this.timer.running) {
            start.style.display = 'none';
            pause.style.display = 'inline-block';
        } else {
            start.style.display = 'inline-block';
            pause.style.display = 'none';
        }
    }

    /**
     * Render laps
     * 
     * @method renderLaps
     * @returns {void}
     */
    renderLaps() {
        const container = document.getElementById('stopwatch-laps');
        if (!container) return;

        if (this.stopwatch.laps.length === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = `
            <div class="laps-header">Lap Times</div>
            ${this.stopwatch.laps.map((lap, index) => `
                <div class="lap-item">
                    <span>Lap ${index + 1}</span>
                    <span>${this.formatTime(lap, true)}</span>
                </div>
            `).join('')}
        `;
    }

    /**
     * On timer complete
     * 
     * @method onTimerComplete
     * @returns {void}
     */
    onTimerComplete() {
        this.showNotification('Timer completed!', 'success');
        this.updateTimerControls();
        
        // Play sound if available
        if (window.AudioContext || window.webkitAudioContext) {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        }
    }

    /**
     * Start update loop
     * 
     * @method startUpdateLoop
     * @returns {void}
     */
    startUpdateLoop() {
        setInterval(() => {
            if (document.getElementById('timer-stopwatch-modal')?.classList.contains('open')) {
                this.updateDisplay();
            }
        }, 10);
    }

    /**
     * Hide timer modal
     * 
     * @method hideTimerModal
     * @returns {void}
     */
    hideTimerModal() {
        const modal = document.getElementById('timer-stopwatch-modal');
        if (modal) {
            modal.classList.remove('open');
        }
    }

    /**
     * Show notification
     * 
     * @method showNotification
     * @param {string} message - Notification message
     * @param {string} type - Notification type
     * @returns {void}
     */
    showNotification(message, type = 'info') {
        if (window.notificationCenter) {
            const center = window.notificationCenter();
            center.show(message, {
                type,
                duration: 3000
            });
        }
    }
}

// Initialize globally
let timerStopwatchInstance = null;

function initTimerStopwatch() {
    if (!timerStopwatchInstance) {
        timerStopwatchInstance = new TimerStopwatch();
    }
    return timerStopwatchInstance;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTimerStopwatch);
} else {
    initTimerStopwatch();
}

// Export globally
window.TimerStopwatch = TimerStopwatch;
window.timerStopwatch = () => timerStopwatchInstance;

