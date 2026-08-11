/**
 * Password Strength Meter
 * Visual password strength indicator
 */

class PasswordStrengthMeter {
    constructor() {
        this.init();
    }
    
    init() {
        this.enhancePasswordInputs();
    }
    
    enhancePasswordInputs() {
        document.querySelectorAll('input[type="password"]').forEach(input => {
            if (!input.hasAttribute('data-strength-meter')) {
                input.setAttribute('data-strength-meter', 'true');
                this.addMeter(input);
            }
        });
    }
    
    addMeter(input) {
        const meter = document.createElement('div');
        meter.className = 'password-strength-meter';
        meter.style.cssText = `
            height: 4px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 2px;
            margin-top: 5px;
            overflow: hidden;
        `;
        
        const fill = document.createElement('div');
        fill.className = 'password-strength-fill';
        fill.style.cssText = `
            height: 100%;
            width: 0%;
            transition: width 0.3s ease, background 0.3s ease;
        `;
        meter.appendChild(fill);
        
        input.parentElement.appendChild(meter);
        
        input.addEventListener('input', () => {
            const strength = this.calculateStrength(input.value);
            fill.style.width = `${strength.score * 25}%`;
            fill.style.background = strength.color;
        });
    }
    
    calculateStrength(password) {
        let score = 0;
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[^a-zA-Z\d]/.test(password)) score++;
        
        const colors = ['#ef4444', '#f59e0b', '#eab308', '#84cc16', '#22c55e'];
        return { score, color: colors[Math.min(score, 4)] };
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.passwordStrengthMeter = new PasswordStrengthMeter(); });
} else {
    window.passwordStrengthMeter = new PasswordStrengthMeter();
}
