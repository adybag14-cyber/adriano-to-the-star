/**
 * Honeypot Fields for Bot Protection
 * Invisible fields to catch bots
 */

class HoneypotBotProtection {
    constructor() {
        this.init();
    }
    
    init() {
        this.addHoneypots();
    }
    
    addHoneypots() {
        document.querySelectorAll('form').forEach(form => {
            if (!form.querySelector('.hp-field')) {
                const honeypot = document.createElement('input');
                honeypot.type = 'text';
                honeypot.name = 'website';
                honeypot.className = 'hp-field';
                honeypot.style.cssText = 'position:absolute;left:-9999px;opacity:0;pointer-events:none;';
                honeypot.setAttribute('tabindex', '-1');
                honeypot.setAttribute('autocomplete', 'off');
                
                form.appendChild(honeypot);
                
                form.addEventListener('submit', (e) => {
                    if (honeypot.value) {
                        e.preventDefault();
                        console.warn('Bot detected via honeypot');
                        return false;
                    }
                });
            }
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.honeypotBotProtection = new HoneypotBotProtection(); });
} else {
    window.honeypotBotProtection = new HoneypotBotProtection();
}


