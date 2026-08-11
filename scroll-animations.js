/**
 * Scroll Animations & Parallax
 * Handles intersection observations for fade-ins and parallax effects.
 */

class ScrollAnimator {
    constructor() {
        this.observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animate(entry.target);
                    // Optional: Stop observing once animated
                    this.observer.unobserve(entry.target);
                }
            });
        }, this.observerOptions);

        this.init();
    }

    init() {
        // Select all elements with animation attributes
        const animatedElements = document.querySelectorAll('[data-scroll-animate], [data-entrance]');

        animatedElements.forEach(el => {
            el.classList.add('scroll-hidden');
            this.observer.observe(el);
        });

        // Parallax
        this.parallaxElements = document.querySelectorAll('[data-parallax]');
        if (this.parallaxElements.length > 0) {
            window.addEventListener('scroll', () => this.handleParallax());
        }
    }

    animate(el) {
        // Remove hidden class
        el.classList.remove('scroll-hidden');
        el.classList.add('scroll-visible');

        // Check for specific entrance type
        const entrance = el.dataset.entrance;
        if (entrance) {
            el.classList.add('animate-' + entrance);
        } else {
            // Default animation
            el.classList.add('animate-fadeInUp');
        }

        // Stagger children if needed
        if (el.hasAttribute('data-stagger')) {
            const delay = parseInt(el.dataset.staggerDelay) || 100;
            const children = el.children;
            Array.from(children).forEach((child, index) => {
                child.style.animationDelay = `${index * delay}ms`;
                child.classList.add('scroll-visible'); // Ensure they become visible
                child.classList.add('animate-fadeInUp');
            });
        }
    }

    handleParallax() {
        const scrolled = window.scrollY;
        this.parallaxElements.forEach(el => {
            const speed = parseFloat(el.dataset.parallaxSpeed) || 0.5;
            const offset = -(scrolled * speed);
            el.style.transform = `translateY(${offset}px)`;
        });
    }
}

// Initialize Global
window.initScrollAnimations = () => {
    window.scrollAnimator = new ScrollAnimator();
};

