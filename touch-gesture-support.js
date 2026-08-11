/**
 * Touch Gesture Support
 * Support touch gestures
 */
(function() {
    'use strict';

    class TouchGestureSupport {
        constructor() {
            this.touchStart = null;
            this.init();
        }

        init() {
            this.setupUI();
            this.setupTouchGestures();
        }

        setupUI() {
            if (!document.getElementById('touch-gestures')) {
                const gestures = document.createElement('div');
                gestures.id = 'touch-gestures';
                gestures.className = 'touch-gestures';
                gestures.innerHTML = `<h2>Touch Gestures</h2>`;
                document.body.appendChild(gestures);
            }
        }

        setupTouchGestures() {
            document.addEventListener('touchstart', (e) => {
                if (e.touches.length === 1) {
                    this.touchStart = {
                        x: e.touches[0].clientX,
                        y: e.touches[0].clientY,
                        time: Date.now()
                    };
                }
            });

            document.addEventListener('touchend', (e) => {
                if (this.touchStart && e.changedTouches.length === 1) {
                    const touchEnd = {
                        x: e.changedTouches[0].clientX,
                        y: e.changedTouches[0].clientY,
                        time: Date.now()
                    };

                    const deltaX = touchEnd.x - this.touchStart.x;
                    const deltaY = touchEnd.y - this.touchStart.y;
                    const deltaTime = touchEnd.time - this.touchStart.time;

                    if (deltaTime < 300) {
                        if (Math.abs(deltaX) > Math.abs(deltaY)) {
                            if (deltaX > 50) {
                                this.handleSwipe('right');
                            } else if (deltaX < -50) {
                                this.handleSwipe('left');
                            }
                        } else {
                            if (deltaY > 50) {
                                this.handleSwipe('down');
                            } else if (deltaY < -50) {
                                this.handleSwipe('up');
                            }
                        }
                    }

                    this.touchStart = null;
                }
            });
        }

        handleSwipe(direction) {
            window.dispatchEvent(new CustomEvent('swipe', {
                detail: { direction }
            }));
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.touchGestures = new TouchGestureSupport();
        });
    } else {
        window.touchGestures = new TouchGestureSupport();
    }
})();

