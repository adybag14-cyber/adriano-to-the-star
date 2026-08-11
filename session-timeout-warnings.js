/**
 * Session Timeout Warnings
 * Warns users before session expires
 */

class SessionTimeoutWarnings {
    constructor() {
        this.timeoutDuration = 30 * 60 * 1000; // 30 minutes
        this.warningTime = 5 * 60 * 1000; // 5 minutes before
        this.lastActivity = Date.now();
        this.warningShown = false;
        this.init();
    }
    
    init() {
        this.resetTimer();
        this.trackActivity();
    }
    
    trackActivity() {
        ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, () => {
                this.lastActivity = Date.now();
                this.resetTimer();
            });
        });
    }
    
    resetTimer() {
        clearTimeout(this.warningTimer);
        clearTimeout(this.timeoutTimer);
        this.warningShown = false;
        
        this.warningTimer = setTimeout(() => {
            this.showWarning();
        }, this.timeoutDuration - this.warningTime);
        
        this.timeoutTimer = setTimeout(() => {
            this.handleTimeout();
        }, this.timeoutDuration);
    }
    
    showWarning() {
        if (this.warningShown) return;
        this.warningShown = true;
        
        const warning = document.createElement('div');
        warning.id = 'session-warning';
        warning.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid #f59e0b;
            border-radius: 12px;
            padding: 30px;
            z-index: 10001;
            color: white;
            text-align: center;
        `;
        
        warning.innerHTML = `
            <h2 style="color:#f59e0b;margin:0 0 15px 0;">⚠️ Session Expiring Soon</h2>
            <p style="margin:0 0 20px 0;">Your session will expire in 5 minutes due to inactivity.</p>
            <button id="extend-session" style="padding:10px 20px;background:rgba(186,148,79,0.5);border:1px solid #ba944f;color:white;border-radius:6px;cursor:pointer;">Stay Logged In</button>
        `;
        
        document.body.appendChild(warning);
        
        document.getElementById('extend-session').addEventListener('click', () => {
            this.resetTimer();
            warning.remove();
        });
    }
    
    handleTimeout() {
        if (window.supabase?.auth) {
            window.supabase.auth.signOut();
        }
        window.location.href = '/';
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.sessionTimeoutWarnings = new SessionTimeoutWarnings(); });
} else {
    window.sessionTimeoutWarnings = new SessionTimeoutWarnings();
}


