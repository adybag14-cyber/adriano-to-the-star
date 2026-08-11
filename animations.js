/**
 * Wix-Style Animations and Interactions
 * Includes: Scroll animations, parallax effects, entrance animations, hover effects
 */

// ===== SCROLL-DRIVEN ANIMATIONS =====
(function () {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return;
    }

    if (window.__animationsJsLoaded) {
        return;
    }

    window.__animationsJsLoaded = true;

class ScrollAnimations {
    constructor() {
        this.elements = document.querySelectorAll('[data-scroll-animate]');
        this.init();
    }

    init() {
        // Create Intersection Observer for entrance animations
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1,
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        // Observe all elements with scroll animation attribute
        this.elements.forEach((el) => this.observer.observe(el));

        // Add scroll listener for parallax
        this.scrollHandler = () => this.handleScroll();
        window.addEventListener('scroll', this.scrollHandler);
    }

    cleanup() {
        // Remove scroll listener
        if (this.scrollHandler) {
            window.removeEventListener('scroll', this.scrollHandler);
            this.scrollHandler = null;
        }

        // Disconnect observer
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }

    handleScroll() {
        const scrolled = window.pageYOffset;

        // Parallax effect for images
        document.querySelectorAll('[data-parallax]').forEach((el) => {
            const speed = el.dataset.parallaxSpeed || 0.5;
            const yPos = -(scrolled * speed);
            el.style.transform = `translate3d(0, ${yPos}px, 0)`;
        });

        // Fade in/out effects based on scroll position
        document.querySelectorAll('[data-fade-scroll]').forEach((el) => {
            const rect = el.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            const fadeStart = windowHeight * 0.8;
            const fadeEnd = windowHeight * 0.2;

            if (rect.top < fadeStart && rect.bottom > fadeEnd) {
                const opacity = Math.min(1, (fadeStart - rect.top) / (fadeStart - fadeEnd));
                el.style.opacity = opacity;
            }
        });
    }
}

// ===== ENTRANCE ANIMATIONS =====
class EntranceAnimations {
    constructor() {
        this.animationTypes = [
            'fadeIn',
            'slideUp',
            'slideDown',
            'slideLeft',
            'slideRight',
            'zoomIn',
        ];
        this.disableTransforms = Boolean(document.body && document.body.classList.contains('database-page'));
        this.init();
    }

    init() {
        document.querySelectorAll('[data-entrance]').forEach((el, index) => {
            const rawType = el.dataset.entrance || 'fadeIn';
            const animationType = this.disableTransforms ? 'fadeIn' : rawType;
            const delay = el.dataset.entranceDelay || index * 100;

            el.style.opacity = '0';
            el.style.transition = this.disableTransforms
                ? `opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms`
                : `all 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms`;

            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            this.applyAnimation(entry.target, animationType);
                            observer.unobserve(entry.target);
                        }
                    });
                },
                { threshold: 0.1 }
            );

            observer.observe(el);
        });
    }

    applyAnimation(el, type) {
        el.style.opacity = '1';

        if (this.disableTransforms) {
            return;
        }

        switch (type) {
            case 'slideUp':
                el.style.transform = 'translateY(50px)';
                setTimeout(() => {
                    el.style.transform = 'translateY(0)';
                }, 10);
                break;
            case 'slideDown':
                el.style.transform = 'translateY(-50px)';
                setTimeout(() => {
                    el.style.transform = 'translateY(0)';
                }, 10);
                break;
            case 'slideLeft':
                el.style.transform = 'translateX(50px)';
                setTimeout(() => {
                    el.style.transform = 'translateX(0)';
                }, 10);
                break;
            case 'slideRight':
                el.style.transform = 'translateX(-50px)';
                setTimeout(() => {
                    el.style.transform = 'translateX(0)';
                }, 10);
                break;
            case 'zoomIn':
                el.style.transform = 'scale(0.8)';
                setTimeout(() => {
                    el.style.transform = 'scale(1)';
                }, 10);
                break;
            default: // fadeIn
                break;
        }
    }
}

// ===== HOVER EFFECTS =====
class HoverEffects {
    constructor() {
        this.init();
    }

    init() {
        // Image hover effects
        document.querySelectorAll('[data-hover="zoom"]').forEach((el) => {
            el.style.transition = 'transform 0.5s ease, filter 0.5s ease';
            el.addEventListener('mouseenter', () => {
                el.style.transform = 'scale(1.05)';
                el.style.filter = 'brightness(1.1)';
            });
            el.addEventListener('mouseleave', () => {
                el.style.transform = 'scale(1)';
                el.style.filter = 'brightness(1)';
            });
        });

        // Button hover effects
        document.querySelectorAll('[data-hover="lift"]').forEach((el) => {
            el.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
            el.addEventListener('mouseenter', () => {
                el.style.transform = 'translateY(-5px)';
                el.style.boxShadow = '0 10px 20px rgba(255,255,255,0.2)';
            });
            el.addEventListener('mouseleave', () => {
                el.style.transform = 'translateY(0)';
                el.style.boxShadow = 'none';
            });
        });

        // Glow effect
        document.querySelectorAll('[data-hover="glow"]').forEach((el) => {
            el.style.transition = 'box-shadow 0.3s ease, border-color 0.3s ease';
            el.addEventListener('mouseenter', () => {
                el.style.boxShadow = '0 0 20px rgba(255,255,255,0.5)';
                el.style.borderColor = 'rgba(255,255,255,0.8)';
            });
            el.addEventListener('mouseleave', () => {
                el.style.boxShadow = 'none';
                el.style.borderColor = 'rgba(255,255,255,0.5)';
            });
        });
    }
}

// ===== STAGGER ANIMATIONS =====
class StaggerAnimations {
    constructor() {
        this.init();
    }

    init() {
        document.querySelectorAll('[data-stagger]').forEach((container) => {
            const children = container.children;
            const delay = parseInt(container.dataset.staggerDelay, 10) || 100;

            Array.from(children).forEach((child, index) => {
                child.style.opacity = '0';
                child.style.transform = 'translateY(20px)';
                child.style.transition = `all 0.6s ease ${index * delay}ms`;

                const observer = new IntersectionObserver(
                    (entries) => {
                        entries.forEach((entry) => {
                            if (entry.isIntersecting) {
                                Array.from(children).forEach((c, i) => {
                                    setTimeout(() => {
                                        c.style.opacity = '1';
                                        c.style.transform = 'translateY(0)';
                                    }, i * delay);
                                });
                                observer.unobserve(entry.target);
                            }
                        });
                    },
                    { threshold: 0.1 }
                );

                observer.observe(container);
            });
        });
    }
}

// ===== LOOP ANIMATIONS =====
class LoopAnimations {
    constructor() {
        this.init();
    }

    init() {
        // Floating animation
        document.querySelectorAll('[data-loop="float"]').forEach((el) => {
            el.style.animation = 'float 6s ease-in-out infinite';
        });

        // Pulse animation
        document.querySelectorAll('[data-loop="pulse"]').forEach((el) => {
            el.style.animation = 'pulse 2s ease-in-out infinite';
        });

        // Rotate animation
        document.querySelectorAll('[data-loop="rotate"]').forEach((el) => {
            const speed = el.dataset.loopSpeed || '10s';
            el.style.animation = `rotate ${speed} linear infinite`;
        });
    }
}

// ===== PARALLAX SCROLL EFFECT =====
class ParallaxEffect {
    constructor() {
        this.ticking = false;
        this.init();
    }

    init() {
        this.scrollHandler = () => {
            if (!this.ticking) {
                window.requestAnimationFrame(() => {
                    this.updateParallax();
                    this.ticking = false;
                });
                this.ticking = true;
            }
        };
        window.addEventListener('scroll', this.scrollHandler);
    }

    cleanup() {
        if (this.scrollHandler) {
            window.removeEventListener('scroll', this.scrollHandler);
            this.scrollHandler = null;
        }
    }

    updateParallax() {
        const scrolled = window.pageYOffset;

        document.querySelectorAll('[data-parallax-depth]').forEach((el) => {
            const depth = parseFloat(el.dataset.parallaxDepth) || 0.5;
            const movement = scrolled * depth;
            el.style.transform = `translate3d(0, ${movement}px, 0)`;
        });
    }
}

// ===== SMOOTH SCROLL =====
class SmoothScroll {
    constructor() {
        this.init();
    }

    init() {
        document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
            anchor.addEventListener('click', (e) => {
                const href = anchor.getAttribute('href');
                if (href === '#') return;

                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                    });
                }
            });
        });
    }
}

// ===== INITIALIZE ALL ANIMATIONS =====
document.addEventListener('DOMContentLoaded', () => {
    new ScrollAnimations();
    new EntranceAnimations();
    new HoverEffects();
    new StaggerAnimations();
    new LoopAnimations();
    new ParallaxEffect();
    new SmoothScroll();

    // Add CSS animations dynamically
    const style = document.createElement('style');
    style.textContent = `
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
        }

        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.8; }
        }

        @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        [data-scroll-animate].animate-in {
            animation: fadeInUp 0.8s ease forwards;
        }

        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        /* Smooth transitions for all animated elements */
        [data-entrance],
        [data-scroll-animate],
        [data-parallax],
        [data-hover] {
            will-change: transform, opacity;
        }
    `;
    document.head.appendChild(style);

    // Track initialization
    try {
        if (window.performanceMonitoring) {
            window.performanceMonitoring.recordMetric('animations_initialized', 1, {});
        }
        if (window.analytics) {
            window.analytics.track('animations_initialized', { module: 'animations' });
        }
    } catch (e) { /* Silent fail */ }
});
})();
