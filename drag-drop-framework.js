/**
 * Drag-and-Drop Framework
 * Advanced drag-drop functionality with zones, constraints, and animations
 * @author Agent 3 - Adriano To The Star
 */

class DragDropFramework {
    constructor(options = {}) {
        this.options = { ...this.defaultOptions, ...options };
        this.draggables = new Map();
        this.dropZones = new Map();
        this.activeDrag = null;
        this.dragData = null;
        this.init();
    }

    get defaultOptions() {
        return {
            dragClass: 'draggable',
            dropZoneClass: 'drop-zone',
            draggingClass: 'dragging',
            dropZoneActiveClass: 'drop-zone-active',
            cloneOnDrag: false,
            revertOnInvalid: true,
            animationDuration: 200,
            constrainToParent: false,
            snapToGrid: false,
            gridSize: 10
        };
    }

    init() {
        this.setupGlobalListeners();
        this.addStyles();
        this.trackEvent('drag_drop_framework_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`drag_drop_framework_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    setupGlobalListeners() {
        document.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this));
    }

    makeDraggable(element, options = {}) {
        const config = { ...this.options, ...options };
        const id = this.generateId();
        
        this.draggables.set(id, {
            element,
            config,
            originalPosition: null,
            isDragging: false
        });

        element.classList.add(config.dragClass);
        element.draggable = false; // Use custom implementation
        element.setAttribute('data-draggable-id', id);

        // Add drag handle if specified
        if (config.handle) {
            const handle = element.querySelector(config.handle);
            if (handle) {
                handle.style.cursor = 'grab';
                handle.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    this.startDrag(id, e);
                });
            }
        }

        return id;
    }

    makeDropZone(element, options = {}) {
        const config = { ...this.options, ...options };
        const id = this.generateId();
        
        this.dropZones.set(id, {
            element,
            config,
            isActive: false
        });

        element.classList.add(config.dropZoneClass);
        element.setAttribute('data-drop-zone-id', id);

        return id;
    }

    handleMouseDown(e) {
        const draggableElement = e.target.closest(`.${this.options.dragClass}`);
        if (draggableElement && !this.activeDrag) {
            const id = draggableElement.getAttribute('data-draggable-id');
            if (id && (!this.options.handle || e.target.closest(this.options.handle))) {
                e.preventDefault();
                this.startDrag(id, e);
            }
        }
    }

    handleMouseMove(e) {
        if (this.activeDrag) {
            e.preventDefault();
            this.updateDrag(e.clientX, e.clientY);
        }
    }

    handleMouseUp(e) {
        if (this.activeDrag) {
            this.endDrag(e.clientX, e.clientY);
        }
    }

    handleTouchStart(e) {
        const touch = e.touches[0];
        const draggableElement = document.elementFromPoint(touch.clientX, touch.clientY)?.closest(`.${this.options.dragClass}`);
        
        if (draggableElement && !this.activeDrag) {
            const id = draggableElement.getAttribute('data-draggable-id');
            if (id) {
                e.preventDefault();
                this.startDrag(id, touch);
            }
        }
    }

    handleTouchMove(e) {
        if (this.activeDrag) {
            e.preventDefault();
            const touch = e.touches[0];
            this.updateDrag(touch.clientX, touch.clientY);
        }
    }

    handleTouchEnd(e) {
        if (this.activeDrag) {
            const touch = e.changedTouches[0];
            this.endDrag(touch.clientX, touch.clientY);
        }
    }

    startDrag(id, event) {
        const draggable = this.draggables.get(id);
        if (!draggable) return;

        const element = draggable.element;
        const config = draggable.config;
        
        // Store original position
        const rect = element.getBoundingClientRect();
        draggable.originalPosition = {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height
        };

        // Create drag element
        const dragElement = config.cloneOnDrag ? element.cloneNode(true) : element;
        
        if (config.cloneOnDrag) {
            dragElement.style.position = 'fixed';
            dragElement.style.zIndex = '9999';
            dragElement.style.pointerEvents = 'none';
            dragElement.style.opacity = '0.8';
            document.body.appendChild(dragElement);
        } else {
            dragElement.style.position = 'fixed';
            dragElement.style.zIndex = '9999';
            dragElement.style.pointerEvents = 'none';
        }

        dragElement.classList.add(config.draggingClass);

        this.activeDrag = {
            id,
            element: dragElement,
            originalElement: element,
            config,
            startX: event.clientX || event.pageX,
            startY: event.clientY || event.pageY,
            offsetX: (event.clientX || event.pageX) - rect.left,
            offsetY: (event.clientY || event.pageY) - rect.top
        };

        this.dragData = config.data || {};

        // Trigger drag start event
        this.triggerEvent('dragStart', {
            draggable: id,
            element: dragElement,
            originalElement: element,
            data: this.dragData
        });
    }

    updateDrag(clientX, clientY) {
        if (!this.activeDrag) return;

        const { element, config, offsetX, offsetY } = this.activeDrag;
        
        let x = clientX - offsetX;
        let y = clientY - offsetY;

        // Apply constraints
        if (config.constrainToParent && this.activeDrag.originalElement.parentElement) {
            const parent = this.activeDrag.originalElement.parentElement.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();
            
            x = Math.max(parent.left, Math.min(x, parent.right - elementRect.width));
            y = Math.max(parent.top, Math.min(y, parent.bottom - elementRect.height));
        }

        // Snap to grid
        if (config.snapToGrid) {
            x = Math.round(x / config.gridSize) * config.gridSize;
            y = Math.round(y / config.gridSize) * config.gridSize;
        }

        element.style.left = `${x}px`;
        element.style.top = `${y}px`;

        // Check drop zones
        this.checkDropZones(clientX, clientY);

        // Trigger drag event
        this.triggerEvent('drag', {
            draggable: this.activeDrag.id,
            element,
            x,
            y,
            data: this.dragData
        });
    }

    checkDropZones(x, y) {
        this.dropZones.forEach((zone, id) => {
            const element = zone.element;
            const rect = element.getBoundingClientRect();
            
            const isOver = x >= rect.left && x <= rect.right && 
                          y >= rect.top && y <= rect.bottom;

            if (isOver && !zone.isActive) {
                zone.isActive = true;
                element.classList.add(zone.config.dropZoneActiveClass || this.options.dropZoneActiveClass);
                this.triggerEvent('dropZoneEnter', { dropZone: id, element });
            } else if (!isOver && zone.isActive) {
                zone.isActive = false;
                element.classList.remove(zone.config.dropZoneActiveClass || this.options.dropZoneActiveClass);
                this.triggerEvent('dropZoneLeave', { dropZone: id, element });
            }
        });
    }

    endDrag(clientX, clientY) {
        if (!this.activeDrag) return;

        const { id, element, originalElement, config } = this.activeDrag;
        
        // Find active drop zone
        let droppedZone = null;
        this.dropZones.forEach((zone, zoneId) => {
            if (zone.isActive) {
                droppedZone = { id: zoneId, element: zone.element, config: zone.config };
                zone.isActive = false;
                zone.element.classList.remove(zone.config.dropZoneActiveClass || this.options.dropZoneActiveClass);
            }
        });

        if (droppedZone) {
            // Handle successful drop
            this.handleDrop(droppedZone, this.activeDrag);
        } else {
            // Handle invalid drop
            if (config.revertOnInvalid) {
                this.revertDrag(this.activeDrag);
            } else {
                this.cleanupDrag(this.activeDrag);
            }
        }

        // Trigger drag end event
        this.triggerEvent('dragEnd', {
            draggable: id,
            element,
            originalElement,
            droppedZone,
            data: this.dragData
        });

        this.activeDrag = null;
        this.dragData = null;
    }

    handleDrop(dropZone, dragData) {
        const { element, originalElement, config } = dragData;
        
        // Position element in drop zone
        const dropRect = dropZone.element.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        
        const x = dropRect.left + (dropRect.width - elementRect.width) / 2;
        const y = dropRect.top + (dropRect.height - elementRect.height) / 2;

        if (config.cloneOnDrag) {
            // Move clone to drop zone
            element.style.position = 'absolute';
            element.style.left = `${x - dropRect.left}px`;
            element.style.top = `${y - dropRect.top}px`;
            element.style.zIndex = '';
            element.style.pointerEvents = '';
            element.classList.remove(config.draggingClass);
            dropZone.element.appendChild(element);
        } else {
            // Move original element
            originalElement.style.position = 'absolute';
            originalElement.style.left = `${x - dropRect.left}px`;
            originalElement.style.top = `${y - dropRect.top}px`;
            originalElement.classList.remove(config.draggingClass);
            dropZone.element.appendChild(originalElement);
            
            // Remove drag element
            element.remove();
        }

        // Trigger drop event
        this.triggerEvent('drop', {
            dropZone: dropZone.id,
            dropElement: dropZone.element,
            draggable: dragData.id,
            draggedElement: config.cloneOnDrag ? element : originalElement,
            data: this.dragData
        });
    }

    revertDrag(dragData) {
        const { element, originalElement, config, originalPosition } = dragData;
        
        // Animate back to original position
        element.style.transition = `all ${config.animationDuration}ms ease`;
        element.style.left = `${originalPosition.x}px`;
        element.style.top = `${originalPosition.y}px`;

        setTimeout(() => {
            if (config.cloneOnDrag) {
                element.remove();
            } else {
                element.style.position = '';
                element.style.left = '';
                element.style.top = '';
                element.style.zIndex = '';
                element.style.pointerEvents = '';
                element.style.transition = '';
                element.classList.remove(config.draggingClass);
            }
        }, config.animationDuration);
    }

    cleanupDrag(dragData) {
        const { element, config } = dragData;
        
        if (config.cloneOnDrag) {
            element.remove();
        } else {
            element.style.position = '';
            element.style.left = '';
            element.style.top = '';
            element.style.zIndex = '';
            element.style.pointerEvents = '';
            element.style.transition = '';
            element.classList.remove(config.draggingClass);
        }
    }

    triggerEvent(eventName, data) {
        const event = new CustomEvent(`dragDrop:${eventName}`, { detail: data });
        document.dispatchEvent(event);
    }

    generateId() {
        return `drag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    addStyles() {
        if (document.querySelector('#drag-drop-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'drag-drop-styles';
        style.textContent = `
            .draggable {
                cursor: grab;
                user-select: none;
                transition: transform 0.2s ease;
            }

            .draggable:hover {
                transform: scale(1.02);
            }

            .draggable.dragging {
                cursor: grabbing;
                opacity: 0.8;
                transform: scale(1.05);
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            }

            .drop-zone {
                border: 2px dashed transparent;
                border-radius: 8px;
                transition: all 0.3s ease;
                position: relative;
            }

            .drop-zone-active {
                border-color: var(--color-primary);
                background: var(--color-primary);
                opacity: 0.1;
            }

            .drop-zone-active::after {
                content: 'Drop here';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: var(--color-primary);
                font-weight: 600;
                pointer-events: none;
            }
        `;
        document.head.appendChild(style);
    }

    // Public API methods
    destroy() {
        this.draggables.clear();
        this.dropZones.clear();
        this.activeDrag = null;
        this.dragData = null;
    }

    getDraggable(id) {
        return this.draggables.get(id);
    }

    getDropZone(id) {
        return this.dropZones.get(id);
    }

    removeDraggable(id) {
        const draggable = this.draggables.get(id);
        if (draggable) {
            draggable.element.classList.remove(this.options.dragClass);
            draggable.element.removeAttribute('data-draggable-id');
            this.draggables.delete(id);
        }
    }

    removeDropZone(id) {
        const zone = this.dropZones.get(id);
        if (zone) {
            zone.element.classList.remove(this.options.dropZoneClass);
            zone.element.removeAttribute('data-drop-zone-id');
            this.dropZones.delete(id);
        }
    }
}

// Initialize global instance
window.DragDropFramework = DragDropFramework;
window.dragDrop = new DragDropFramework();
