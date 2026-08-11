/**
 * CAPTCHA for Sensitive Actions
 * CAPTCHA protection for critical actions
 */

class CAPTCHASensitiveActions {
    constructor() {
        this.protectedActions = ['delete', 'transfer', 'purchase', 'withdraw'];
        this.init();
    }
    
    init() {
        this.setupProtection();
        this.trackEvent('captcha_sens_initialized');
    }
    
    setupProtection() {
        this.protectedActions.forEach(action => {
            document.querySelectorAll(`[data-action="${action}"]`).forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showCAPTCHA(btn, action);
                });
            });
        });
    }
    
    showCAPTCHA(button, action) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        modal.innerHTML = `
            <div style="background:rgba(0,0,0,0.98);border:2px solid #ba944f;border-radius:12px;padding:30px;max-width:400px;color:white;">
                <h3 style="color:#ba944f;margin:0 0 20px 0;">Verify You're Human</h3>
                <div id="captcha-container" style="margin-bottom:20px;">
                    <p>Click the checkbox to verify</p>
                    <input type="checkbox" id="captcha-checkbox" style="width:20px;height:20px;margin-right:10px;">
                    <label for="captcha-checkbox">I'm not a robot</label>
                </div>
                <button id="captcha-submit" style="width:100%;padding:10px;background:rgba(186,148,79,0.5);border:1px solid #ba944f;color:white;border-radius:6px;cursor:pointer;">Verify</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('#captcha-submit').addEventListener('click', () => {
            const checked = modal.querySelector('#captcha-checkbox').checked;
            if (checked) {
                modal.remove();
                button.click();
            } else {
                alert('Please verify you are human');
            }
        });
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`captcha_sens_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.captchaSensitiveActions = new CAPTCHASensitiveActions(); });
} else {
    window.captchaSensitiveActions = new CAPTCHASensitiveActions();
}


