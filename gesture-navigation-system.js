/**
 * Gesture-based Navigation for Touch Devices
 * Swipe gestures for navigation
 */

class GestureNavigationSystem {
    constructor() {
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.minSwipeDistance = 50;
        this.init();
    }
    
    init() {
        this.setupSwipeGestures();
    }
    
    setupSwipeGestures() {
        let touchStartX, touchStartY, touchEndX, touchEndY;
        
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        });
        
        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;
            this.handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY);
        });
    }
    
    handleSwipe(startX, startY, endX, endY) {
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
        
        if (absX < this.minSwipeDistance && absY < this.minSwipeDistance) return;
        
        if (absX > absY) {
            if (deltaX > 0) {
                this.onSwipeRight();
            } else {
                this.onSwipeLeft();
            }
        } else {
            if (deltaY > 0) {
                this.onSwipeDown();
            } else {
                this.onSwipeUp();
            }
        }
    }
    
    onSwipeLeft() {
        const nextBtn = document.querySelector('[data-nav="next"], .next-button, #next');
        if (nextBtn) nextBtn.click();
    }
    
    onSwipeRight() {
        const prevBtn = document.querySelector('[data-nav="prev"], .prev-button, #prev');
        if (prevBtn) prevBtn.click();
        else if (window.history.length > 1) window.history.back();
    }
    
    onSwipeUp() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    onSwipeDown() {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.gestureNavigationSystem = new GestureNavigationSystem(); });
} else {
    window.gestureNavigationSystem = new GestureNavigationSystem();
}


