/**
 * Micro-interactions and Haptic Feedback for Mobile
 * Adds subtle interactions and haptic feedback
 */

class MicroInteractionsHaptic {
    constructor() {
        this.vibrateSupported = 'vibrate' in navigator;
        this.init();
    }
    
    init() {
        this.addMicroInteractions();
        this.setupHapticFeedback();
    }
    
    addMicroInteractions() {
        document.addEventListener('click', (e) => {
            const target = e.target;
            if (target.tagName === 'BUTTON' || target.closest('button')) {
                this.addRippleEffect(e);
                this.triggerHaptic('light');
            }
        });
        
        document.addEventListener('touchstart', (e) => {
            const target = e.target;
            if (target.tagName === 'BUTTON' || target.closest('button')) {
                target.style.transform = 'scale(0.95)';
            }
        });
        
        document.addEventListener('touchend', (e) => {
            const target = e.target;
            if (target.tagName === 'BUTTON' || target.closest('button')) {
                target.style.transform = 'scale(1)';
            }
        });
    }
    
    addRippleEffect(e) {
        const button = e.target.closest('button') || e.target;
        if (!button || button.classList.contains('no-ripple')) return;
        
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            left: ${x}px;
            top: ${y}px;
            pointer-events: none;
        `;
        
        if (!document.getElementById('ripple-styles')) {
            const style = document.createElement('style');
            style.id = 'ripple-styles';
            style.textContent = '@keyframes ripple { to { transform: scale(2); opacity: 0; } }';
            document.head.appendChild(style);
        }
        
        if (getComputedStyle(button).position === 'static') {
            button.style.position = 'relative';
        }
        button.style.overflow = 'hidden';
        button.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    }
    
    setupHapticFeedback() {
        if (!this.vibrateSupported) return;
        
        document.querySelectorAll('button, a, [role="button"]').forEach(el => {
            el.addEventListener('touchstart', () => {
                this.triggerHaptic('light');
            });
        });
    }
    
    triggerHaptic(type = 'light') {
        if (!this.vibrateSupported) return;
        const patterns = { light: 10, medium: 20, heavy: 30, success: [10, 50, 10], error: [30, 50, 30] };
        navigator.vibrate(patterns[type] || patterns.light);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.microInteractionsHaptic = new MicroInteractionsHaptic(); });
} else {
    window.microInteractionsHaptic = new MicroInteractionsHaptic();
}


