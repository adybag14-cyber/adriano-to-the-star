/**
 * Reading Progress Indicator
 * 
 * Shows reading progress for long-form content with scroll tracking,
 * estimated reading time, and progress percentage.
 * 
 * @class ReadingProgress
 * @example
 * // Auto-initializes on page load
 * // Access via: window.readingProgress()
 */
class ReadingProgress {
    constructor() {
        this.progress = 0;
        this.readingTime = 0;
        this.wordCount = 0;
        this.scrollPosition = 0;
        this.progressBar = null;
        this.init();
    }

    init() {
        // Calculate reading metrics
        this.calculateReadingMetrics();
        
        // Create progress bar
        this.createProgressBar();
        
        // Setup scroll listener
        this.setupScrollListener();
        
        console.log('✅ Reading Progress initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("r_ea_di_ng_pr_og_re_ss_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Calculate reading metrics
     * 
     * @method calculateReadingMetrics
     * @returns {void}
     */
    calculateReadingMetrics() {
        // Get all text content
        const mainContent = document.querySelector('main, article, .content, .main-content') || document.body;
        const text = mainContent.innerText || mainContent.textContent || '';
        
        // Count words (average reading speed: 200-250 words per minute)
        const words = text.trim().split(/\s+/).filter(word => word.length > 0);
        this.wordCount = words.length;
        this.readingTime = Math.ceil(this.wordCount / 225); // 225 words per minute average
    }

    /**
     * Create progress bar
     * 
     * @method createProgressBar
     * @returns {void}
     */
    createProgressBar() {
        // Check if already exists
        if (document.getElementById('reading-progress')) return;

        const progressContainer = document.createElement('div');
        progressContainer.id = 'reading-progress';
        progressContainer.className = 'reading-progress';
        progressContainer.innerHTML = `
            <div class="progress-bar-fill" id="progress-bar-fill"></div>
            <div class="progress-info" id="progress-info">
                <span class="progress-percentage">0%</span>
                <span class="progress-time">${this.readingTime} min read</span>
            </div>
        `;

        document.body.appendChild(progressContainer);
        this.progressBar = document.getElementById('progress-bar-fill');
    }

    /**
     * Setup scroll listener
     * 
     * @method setupScrollListener
     * @returns {void}
     */
    setupScrollListener() {
        let ticking = false;

        const updateProgress = () => {
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollableHeight = documentHeight - windowHeight;

            if (scrollableHeight > 0) {
                this.progress = Math.round((scrollTop / scrollableHeight) * 100);
                this.scrollPosition = scrollTop;
            } else {
                this.progress = 100;
            }

            this.updateProgressBar();
            ticking = false;
        };

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(updateProgress);
                ticking = true;
            }
        }, { passive: true });

        // Initial update
        updateProgress();
    }

    /**
     * Update progress bar
     * 
     * @method updateProgressBar
     * @returns {void}
     */
    updateProgressBar() {
        if (!this.progressBar) return;

        this.progressBar.style.width = `${this.progress}%`;

        const percentageEl = document.querySelector('.progress-percentage');
        if (percentageEl) {
            percentageEl.textContent = `${this.progress}%`;
        }

        // Update progress container class
        const container = document.getElementById('reading-progress');
        if (container) {
            if (this.progress > 90) {
                container.classList.add('almost-complete');
            } else if (this.progress > 50) {
                container.classList.add('halfway');
            } else {
                container.classList.remove('almost-complete', 'halfway');
            }
        }
    }

    /**
     * Get reading progress
     * 
     * @method getProgress
     * @returns {Object} Progress data
     */
    getProgress() {
        return {
            percentage: this.progress,
            scrollPosition: this.scrollPosition,
            readingTime: this.readingTime,
            wordCount: this.wordCount
        };
    }

    /**
     * Scroll to position
     * 
     * @method scrollToPosition
     * @param {number} percentage - Percentage to scroll to (0-100)
     * @returns {void}
     */
    scrollToPosition(percentage) {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollableHeight = documentHeight - windowHeight;
        const targetPosition = (percentage / 100) * scrollableHeight;

        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
}

// Initialize globally
let readingProgressInstance = null;

function initReadingProgress() {
    if (!readingProgressInstance) {
        readingProgressInstance = new ReadingProgress();
    }
    return readingProgressInstance;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReadingProgress);
} else {
    initReadingProgress();
}

// Export globally
window.ReadingProgress = ReadingProgress;
window.readingProgress = () => readingProgressInstance;

