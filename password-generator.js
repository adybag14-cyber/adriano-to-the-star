/**
 * Password Generator
 * 
 * Generate secure passwords with customizable options:
 * length, character types, and strength requirements.
 * 
 * @class PasswordGenerator
 * @example
 * // Auto-initializes on page load
 * // Access via: window.passwordGenerator()
 * 
 * // Generate password
 * const generator = window.passwordGenerator();
 * const password = generator.generate({ length: 16, includeSymbols: true });
 */
class PasswordGenerator {
    constructor() {
        this.defaultLength = 16;
        this.init();
    }

    init() {
        // Create password generator button
        this.createPasswordButton();
        
        console.log('✅ Password Generator initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_as_sw_or_dg_en_er_at_or_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Create password generator button
     * 
     * @method createPasswordButton
     * @returns {void}
     */
    createPasswordButton() {
        // Check if button already exists
        if (document.getElementById('password-generator-btn')) return;

        const button = document.createElement('button');
        button.id = 'password-generator-btn';
        button.className = 'password-generator-btn';
        button.setAttribute('aria-label', 'Password Generator');
        button.innerHTML = '🔐';
        button.title = 'Password Generator';
        
        button.addEventListener('click', () => this.showPasswordModal());
        
        document.body.appendChild(button);
    }

    /**
     * Show password generator modal
     * 
     * @method showPasswordModal
     * @returns {void}
     */
    showPasswordModal() {
        // Check if modal already exists
        let modal = document.getElementById('password-generator-modal');
        if (modal) {
            modal.classList.add('open');
            return;
        }

        // Create modal
        modal = document.createElement('div');
        modal.id = 'password-generator-modal';
        modal.className = 'password-generator-modal';
        modal.innerHTML = `
            <div class="password-generator-content">
                <div class="password-generator-header">
                    <h3>🔐 Password Generator</h3>
                    <button class="password-generator-close" aria-label="Close">×</button>
                </div>
                <div class="password-generator-body">
                    <div class="password-display">
                        <input type="text" id="generated-password" readonly class="password-input">
                        <button class="password-copy-btn" id="password-copy-btn" title="Copy">📋</button>
                        <button class="password-refresh-btn" id="password-refresh-btn" title="Regenerate">🔄</button>
                    </div>
                    <div class="password-options">
                        <div class="password-option">
                            <label for="password-length">Length: <span id="length-value">16</span></label>
                            <input type="range" id="password-length" min="8" max="64" value="16">
                        </div>
                        <div class="password-option">
                            <label>
                                <input type="checkbox" id="include-uppercase" checked>
                                Uppercase (A-Z)
                            </label>
                        </div>
                        <div class="password-option">
                            <label>
                                <input type="checkbox" id="include-lowercase" checked>
                                Lowercase (a-z)
                            </label>
                        </div>
                        <div class="password-option">
                            <label>
                                <input type="checkbox" id="include-numbers" checked>
                                Numbers (0-9)
                            </label>
                        </div>
                        <div class="password-option">
                            <label>
                                <input type="checkbox" id="include-symbols" checked>
                                Symbols (!@#$%^&*)
                            </label>
                        </div>
                        <div class="password-option">
                            <label>
                                <input type="checkbox" id="exclude-ambiguous">
                                Exclude Ambiguous (0, O, l, 1, I)
                            </label>
                        </div>
                    </div>
                    <div class="password-strength">
                        <div class="strength-label">Strength: <span id="strength-text">Medium</span></div>
                        <div class="strength-bar">
                            <div class="strength-fill" id="strength-fill"></div>
                        </div>
                    </div>
                    <div class="password-actions">
                        <button class="password-generate-btn" id="password-generate-btn">Generate</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Setup event listeners
        this.setupEventListeners();

        // Generate initial password
        this.generatePassword();

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
        const modal = document.getElementById('password-generator-modal');
        if (!modal) return;

        // Close button
        const closeBtn = modal.querySelector('.password-generator-close');
        closeBtn.addEventListener('click', () => this.hidePasswordModal());

        // Length slider
        const lengthSlider = modal.querySelector('#password-length');
        const lengthValue = modal.querySelector('#length-value');
        lengthSlider.addEventListener('input', (e) => {
            lengthValue.textContent = e.target.value;
            this.generatePassword();
        });

        // Option checkboxes
        modal.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.generatePassword());
        });

        // Copy button
        const copyBtn = modal.querySelector('#password-copy-btn');
        copyBtn.addEventListener('click', () => this.copyPassword());

        // Refresh button
        const refreshBtn = modal.querySelector('#password-refresh-btn');
        refreshBtn.addEventListener('click', () => this.generatePassword());

        // Generate button
        const generateBtn = modal.querySelector('#password-generate-btn');
        generateBtn.addEventListener('click', () => this.generatePassword());

        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hidePasswordModal();
            }
        });
    }

    /**
     * Hide password modal
     * 
     * @method hidePasswordModal
     * @returns {void}
     */
    hidePasswordModal() {
        const modal = document.getElementById('password-generator-modal');
        if (modal) {
            modal.classList.remove('open');
        }
    }

    /**
     * Generate password
     * 
     * @method generatePassword
     * @returns {void}
     */
    generatePassword() {
        const modal = document.getElementById('password-generator-modal');
        if (!modal) return;

        const length = parseInt(modal.querySelector('#password-length').value);
        const includeUppercase = modal.querySelector('#include-uppercase').checked;
        const includeLowercase = modal.querySelector('#include-lowercase').checked;
        const includeNumbers = modal.querySelector('#include-numbers').checked;
        const includeSymbols = modal.querySelector('#include-symbols').checked;
        const excludeAmbiguous = modal.querySelector('#exclude-ambiguous').checked;

        // Validate at least one option is selected
        if (!includeUppercase && !includeLowercase && !includeNumbers && !includeSymbols) {
            this.showNotification('Please select at least one character type', 'warning');
            return;
        }

        const password = this.generate({
            length,
            includeUppercase,
            includeLowercase,
            includeNumbers,
            includeSymbols,
            excludeAmbiguous
        });

        // Display password
        const passwordInput = modal.querySelector('#generated-password');
        passwordInput.value = password;

        // Update strength
        this.updateStrength(password);
    }

    /**
     * Generate password with options
     * 
     * @method generate
     * @param {Object} options - Generation options
     * @returns {string} Generated password
     */
    generate(options = {}) {
        const {
            length = this.defaultLength,
            includeUppercase = true,
            includeLowercase = true,
            includeNumbers = true,
            includeSymbols = true,
            excludeAmbiguous = false
        } = options;

        let charset = '';

        if (includeUppercase) {
            charset += excludeAmbiguous ? 'ABCDEFGHJKLMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        }
        if (includeLowercase) {
            charset += excludeAmbiguous ? 'abcdefghijkmnopqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz';
        }
        if (includeNumbers) {
            charset += excludeAmbiguous ? '23456789' : '0123456789';
        }
        if (includeSymbols) {
            charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
        }

        if (charset.length === 0) {
            return '';
        }

        let password = '';
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);

        for (let i = 0; i < length; i++) {
            password += charset[array[i] % charset.length];
        }

        return password;
    }

    /**
     * Copy password to clipboard
     * 
     * @method copyPassword
     * @returns {void}
     */
    async copyPassword() {
        const passwordInput = document.getElementById('generated-password');
        if (!passwordInput || !passwordInput.value) return;

        try {
            await navigator.clipboard.writeText(passwordInput.value);
            this.showNotification('Password copied to clipboard!', 'success');
            
            // Visual feedback
            const copyBtn = document.getElementById('password-copy-btn');
            if (copyBtn) {
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '✅';
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                }, 2000);
            }
        } catch (error) {
            console.error('Failed to copy password:', error);
            this.showNotification('Failed to copy password', 'error');
        }
    }

    /**
     * Update strength indicator
     * 
     * @method updateStrength
     * @param {string} password - Password to analyze
     * @returns {void}
     */
    updateStrength(password) {
        const strength = this.calculateStrength(password);
        const strengthText = document.getElementById('strength-text');
        const strengthFill = document.getElementById('strength-fill');

        if (!strengthText || !strengthFill) return;

        const levels = ['Very Weak', 'Weak', 'Medium', 'Strong', 'Very Strong'];
        const colors = ['#ef4444', '#f59e0b', '#eab308', '#22c55e', '#10b981'];
        const percentages = [20, 40, 60, 80, 100];

        strengthText.textContent = levels[strength];
        strengthFill.style.width = `${percentages[strength]}%`;
        strengthFill.style.background = colors[strength];
    }

    /**
     * Calculate password strength
     * 
     * @method calculateStrength
     * @param {string} password - Password to analyze
     * @returns {number} Strength level (0-4)
     */
    calculateStrength(password) {
        let strength = 0;

        // Length
        if (password.length >= 12) strength += 2;
        else if (password.length >= 8) strength += 1;

        // Character variety
        const hasLower = /[a-z]/.test(password);
        const hasUpper = /[A-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSymbol = /[^a-zA-Z0-9]/.test(password);

        const variety = [hasLower, hasUpper, hasNumber, hasSymbol].filter(Boolean).length;
        strength += variety - 1;

        // Clamp to 0-4
        return Math.min(4, Math.max(0, strength));
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
let passwordGeneratorInstance = null;

function initPasswordGenerator() {
    if (!passwordGeneratorInstance) {
        passwordGeneratorInstance = new PasswordGenerator();
    }
    return passwordGeneratorInstance;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPasswordGenerator);
} else {
    initPasswordGenerator();
}

// Export globally
window.PasswordGenerator = PasswordGenerator;
window.passwordGenerator = () => passwordGeneratorInstance;

