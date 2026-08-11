(function () {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return;
    }

    if (window.__accessibilityJsLoaded) {
        return;
    }

    window.__accessibilityJsLoaded = true;

class Accessibility {
    setRole(el, role) {
        if (!el) return false;
        el.setAttribute('role', role);
        this.trackEvent('role_set', { role });
        return true;
    }
    focusTrap(container) {
        if (!container) return () => {};
        const focusable = Array.from(container.querySelectorAll('a, button, input, textarea, select, [tabindex]'));
        let idx = 0;
        const handler = (e) => {
            if (e.key !== 'Tab') return;
            e.preventDefault();
            idx = (idx + (e.shiftKey ? -1 : 1) + focusable.length) % focusable.length;
            focusable[idx].focus();
        };
        container.addEventListener('keydown', handler);
        this.trackEvent('focus_trap_created', { focusableCount: focusable.length });
        return () => container.removeEventListener('keydown', handler);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`accessibility_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'accessibility', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}
const accessibility = new Accessibility();
if (typeof window !== 'undefined') {
    window.accessibility = accessibility;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Accessibility;
}

})();
