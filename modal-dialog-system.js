/**
 * Modal/Dialog System
 * Unified modal and dialog component system for the application
 * 
 * Features:
 * - Multiple modal types (alert, confirm, prompt, custom)
 * - Stack management for multiple modals
 * - Accessibility support (ARIA, keyboard navigation, focus trap)
 * - Animation support
 * - Backdrop/overlay management
 */

class ModalDialogSystem {
    constructor() {
        this.modals = [];
        this.backdrop = null;
        this.init();
    }

    init() {
        this.createBackdrop();
        console.log('✅ Modal/Dialog System initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("m_od_al_di_al_og_sy_st_em_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createBackdrop() {
        this.backdrop = document.createElement('div');
        this.backdrop.id = 'modal-backdrop';
        this.backdrop.className = 'modal-backdrop';
        this.backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.75);
            z-index: 9998;
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
        `;
        this.backdrop.addEventListener('click', (e) => {
            if (e.target === this.backdrop && this.modals.length > 0) {
                const topModal = this.modals[this.modals.length - 1];
                if (topModal.options.closeOnBackdrop !== false) {
                    this.close(topModal.id);
                }
            }
        });
        document.body.appendChild(this.backdrop);
    }

    /**
     * Show a modal
     * @param {Object} options - Modal configuration
     */
    show(options = {}) {
        const modalId = options.id || `modal-${Date.now()}`;
        const modal = this.createModal(modalId, options);
        
        document.body.appendChild(modal);
        this.modals.push({ id: modalId, element: modal, options });

        // Show backdrop
        this.backdrop.style.pointerEvents = 'auto';
        this.backdrop.style.opacity = '1';

        // Trigger animation
        requestAnimationFrame(() => {
            modal.classList.add('modal-visible');
        });

        // Focus trap
        this.trapFocus(modal);

        // Handle ESC key
        const escHandler = (e) => {
            if (e.key === 'Escape' && this.modals.length > 0) {
                const topModal = this.modals[this.modals.length - 1];
                if (topModal.id === modalId && topModal.options.closeOnEscape !== false) {
                    this.close(modalId);
                }
            }
        };
        document.addEventListener('keydown', escHandler);
        modal._escHandler = escHandler;

        return modalId;
    }

    createModal(id, options) {
        const modal = document.createElement('div');
        modal.id = id;
        modal.className = 'modal-dialog';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', `${id}-title`);
        
        const size = options.size || 'medium';
        const sizes = {
            small: 'max-width: 400px;',
            medium: 'max-width: 600px;',
            large: 'max-width: 900px;',
            fullscreen: 'max-width: 95vw; max-height: 95vh;'
        };

        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.9);
            ${sizes[size] || sizes.medium}
            width: 90%;
            max-height: 90vh;
            background: rgba(10, 10, 15, 0.98);
            border: 2px solid rgba(186, 148, 79, 0.5);
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            z-index: 9999;
            display: flex;
            flex-direction: column;
            opacity: 0;
            transition: transform 0.3s ease, opacity 0.3s ease;
            font-family: 'Raleway', sans-serif;
            overflow: hidden;
        `;

        const header = options.title ? `
            <div class="modal-header" style="
                padding: 1.5rem;
                border-bottom: 1px solid rgba(186, 148, 79, 0.3);
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <h2 id="${id}-title" class="modal-title" style="
                    color: #ba944f;
                    margin: 0;
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 1.5rem;
                ">${this.escapeHtml(options.title)}</h2>
                ${options.closable !== false ? `
                    <button class="modal-close" aria-label="Close dialog" style="
                        background: transparent;
                        border: none;
                        color: rgba(255, 255, 255, 0.7);
                        font-size: 1.5rem;
                        cursor: pointer;
                        padding: 0.5rem;
                        width: 32px;
                        height: 32px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 4px;
                        transition: background 0.2s;
                    ">×</button>
                ` : ''}
            </div>
        ` : '';

        const body = `
            <div class="modal-body" style="
                padding: 1.5rem;
                flex: 1;
                overflow-y: auto;
                color: rgba(255, 255, 255, 0.9);
            ">
                ${options.html || this.escapeHtml(options.message || '')}
            </div>
        `;

        const footer = options.buttons && options.buttons.length > 0 ? `
            <div class="modal-footer" style="
                padding: 1rem 1.5rem;
                border-top: 1px solid rgba(186, 148, 79, 0.3);
                display: flex;
                justify-content: flex-end;
                gap: 1rem;
            ">
                ${options.buttons.map(btn => `
                    <button class="modal-button modal-button-${btn.type || 'primary'}" style="
                        padding: 0.75rem 1.5rem;
                        border: 2px solid ${btn.type === 'danger' ? '#ef4444' : btn.type === 'secondary' ? 'rgba(186, 148, 79, 0.5)' : '#ba944f'};
                        background: ${btn.type === 'danger' ? 'rgba(239, 68, 68, 0.2)' : btn.type === 'secondary' ? 'transparent' : 'rgba(186, 148, 79, 0.2)'};
                        color: ${btn.type === 'danger' ? '#ef4444' : btn.type === 'secondary' ? '#ba944f' : '#ba944f'};
                        border-radius: 6px;
                        cursor: pointer;
                        font-family: 'Raleway', sans-serif;
                        font-weight: 600;
                        transition: all 0.2s;
                    ">${this.escapeHtml(btn.label)}</button>
                `).join('')}
            </div>
        ` : '';

        modal.innerHTML = header + body + footer;

        // Add CSS for visible state
        if (!document.getElementById('modal-styles')) {
            const style = document.createElement('style');
            style.id = 'modal-styles';
            style.textContent = `
                .modal-visible {
                    transform: translate(-50%, -50%) scale(1) !important;
                    opacity: 1 !important;
                }
                .modal-close:hover {
                    background: rgba(255, 255, 255, 0.1) !important;
                }
                .modal-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(186, 148, 79, 0.3);
                }
            `;
            document.head.appendChild(style);
        }

        // Close button
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close(id));
        }

        // Button handlers
        if (options.buttons) {
            options.buttons.forEach((btn, index) => {
                const button = modal.querySelectorAll('.modal-button')[index];
                if (button && btn.onClick) {
                    button.addEventListener('click', () => {
                        btn.onClick();
                        if (btn.close !== false) {
                            this.close(id);
                        }
                    });
                }
            });
        }

        return modal;
    }

    close(modalId) {
        const modalIndex = this.modals.findIndex(m => m.id === modalId);
        if (modalIndex === -1) return;

        const modal = this.modals[modalIndex].element;
        modal.classList.remove('modal-visible');
        modal.style.transform = 'translate(-50%, -50%) scale(0.9)';
        modal.style.opacity = '0';

        // Remove ESC handler
        if (modal._escHandler) {
            document.removeEventListener('keydown', modal._escHandler);
        }

        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
            this.modals.splice(modalIndex, 1);

            // Hide backdrop if no modals
            if (this.modals.length === 0) {
                this.backdrop.style.pointerEvents = 'none';
                this.backdrop.style.opacity = '0';
            }
        }, 300);
    }

    // Convenience methods
    alert(message, title = 'Alert') {
        return this.show({
            title,
            message,
            buttons: [{
                label: 'OK',
                type: 'primary',
                onClick: () => {}
            }]
        });
    }

    confirm(message, title = 'Confirm', onConfirm, onCancel) {
        return this.show({
            title,
            message,
            buttons: [
                {
                    label: 'Cancel',
                    type: 'secondary',
                    onClick: onCancel || (() => {})
                },
                {
                    label: 'Confirm',
                    type: 'primary',
                    onClick: onConfirm || (() => {})
                }
            ]
        });
    }

    prompt(message, title = 'Prompt', defaultValue = '', onConfirm, onCancel) {
        const inputId = `prompt-input-${Date.now()}`;
        return this.show({
            title,
            html: `
                <p style="margin-bottom: 1rem;">${this.escapeHtml(message)}</p>
                <input type="text" id="${inputId}" value="${this.escapeHtml(defaultValue)}" style="
                    width: 100%;
                    padding: 0.75rem;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(186, 148, 79, 0.3);
                    border-radius: 6px;
                    color: white;
                    font-family: 'Raleway', sans-serif;
                " autofocus>
            `,
            buttons: [
                {
                    label: 'Cancel',
                    type: 'secondary',
                    onClick: onCancel || (() => {})
                },
                {
                    label: 'OK',
                    type: 'primary',
                    onClick: () => {
                        const input = document.getElementById(inputId);
                        if (onConfirm && input) {
                            onConfirm(input.value);
                        }
                    }
                }
            ]
        });
    }

    trapFocus(modal) {
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (firstElement) {
            firstElement.focus();
        }

        modal.addEventListener('keydown', (e) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize global instance
if (typeof window !== 'undefined') {
    window.modalDialog = new ModalDialogSystem();
    
    // Global convenience functions
    window.showModal = (options) => window.modalDialog.show(options);
    window.showAlert = (message, title) => window.modalDialog.alert(message, title);
    window.showConfirm = (message, title, onConfirm, onCancel) => 
        window.modalDialog.confirm(message, title, onConfirm, onCancel);
    window.showPrompt = (message, title, defaultValue, onConfirm, onCancel) => 
        window.modalDialog.prompt(message, title, defaultValue, onConfirm, onCancel);
}

