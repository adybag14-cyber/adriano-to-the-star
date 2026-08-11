// Cosmic Effects - Advanced Graphics for Landing Page
class CosmicEffects {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.stars = [];
        this.init();
    }

    init() {
        this.animationFrameId = null;
        this.resizeHandler = () => this.handleResize();
        this.mouseMoveHandler = (e) => this.handleMouseMove(e);
        
        this.createCanvas();
        this.createParticles();
        this.createStarfield();
        this.animate();
        this.addMouseEffects();
        window.addEventListener('resize', this.resizeHandler);
        this.trackEvent('initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`cosmic_fx_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
    
    handleMouseMove(e) {
        const mouseX = e.clientX;
        const mouseY = e.clientY;

        // Create temporary burst particles
        if (Math.random() > 0.95) {
            this.particles.push({
                x: mouseX,
                y: mouseY,
                radius: Math.random() * 3 + 1,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                opacity: 0.8,
                lifetime: 60
            });
        }

        // Remove old particles
        this.particles = this.particles.filter(p => {
            if (p.lifetime !== undefined) {
                p.lifetime--;
                p.opacity *= 0.97;
                return p.lifetime > 0;
            }
            return true;
        });
    }
    
    cleanup() {
        // Cancel animation frame
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // Remove event listeners
        window.removeEventListener('resize', this.resizeHandler);
        document.removeEventListener('mousemove', this.mouseMoveHandler);
        
        // Clean up canvas
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }

    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'cosmic-canvas';
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            pointer-events: none;
        `;
        document.body.insertBefore(this.canvas, document.body.firstChild);
        this.ctx = this.canvas.getContext('2d');
        this.handleResize();
    }

    handleResize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createParticles() {
        const particleCount = 150;
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                radius: Math.random() * 2 + 0.5,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                opacity: Math.random() * 0.5 + 0.2
            });
        }
    }

    createStarfield() {
        const starCount = 200;
        for (let i = 0; i < starCount; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                radius: Math.random() * 1.5,
                twinkleSpeed: Math.random() * 0.05 + 0.01,
                opacity: Math.random()
            });
        }
    }

    drawParticles() {
        this.particles.forEach(particle => {
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;

            // Wrap around screen
            if (particle.x < 0) particle.x = this.canvas.width;
            if (particle.x > this.canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.canvas.height;
            if (particle.y > this.canvas.height) particle.y = 0;

            // Draw particle with glow
            const gradient = this.ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.radius * 4
            );
            gradient.addColorStop(0, `rgba(186, 148, 79, ${particle.opacity})`);
            gradient.addColorStop(0.5, `rgba(186, 148, 79, ${particle.opacity * 0.3})`);
            gradient.addColorStop(1, 'rgba(186, 148, 79, 0)');

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.radius * 4, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    drawStars() {
        this.stars.forEach(star => {
            // Twinkling effect
            star.opacity += star.twinkleSpeed;
            if (star.opacity > 1 || star.opacity < 0.2) {
                star.twinkleSpeed *= -1;
            }

            this.ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw small cross effect for brighter stars
            if (star.radius > 1) {
                this.ctx.strokeStyle = `rgba(255, 255, 255, ${star.opacity * 0.5})`;
                this.ctx.lineWidth = 0.5;
                this.ctx.beginPath();
                this.ctx.moveTo(star.x - 3, star.y);
                this.ctx.lineTo(star.x + 3, star.y);
                this.ctx.moveTo(star.x, star.y - 3);
                this.ctx.lineTo(star.x, star.y + 3);
                this.ctx.stroke();
            }
        });
    }

    drawConnections() {
        this.particles.forEach((p1, i) => {
            this.particles.slice(i + 1).forEach(p2 => {
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 120) {
                    this.ctx.strokeStyle = `rgba(186, 148, 79, ${(1 - distance / 120) * 0.2})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.stroke();
                }
            });
        });
    }

    animate() {
        if (!this.canvas || !this.ctx) {
            return; // Canvas was removed, stop animation
        }
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawStars();
        this.drawParticles();
        this.drawConnections();

        this.animationFrameId = requestAnimationFrame(() => this.animate());
    }

    addMouseEffects() {
        document.addEventListener('mousemove', this.mouseMoveHandler);
    }
}

// Animated Background Gradients
class AnimatedBackground {
    constructor() {
        this.createGradientOverlay();
    }

    createGradientOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'animated-gradient';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -2;
            background: linear-gradient(
                45deg,
                #000000 0%,
                #0a0a0f 25%,
                #1a0f1f 50%,
                #0f0a1a 75%,
                #000000 100%
            );
            background-size: 400% 400%;
            animation: gradientShift 20s ease infinite;
        `;
        document.body.insertBefore(overlay, document.body.firstChild);

        // Add keyframe animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes gradientShift {
                0% { background-position: 0% 50%; }
                25% { background-position: 50% 50%; }
                50% { background-position: 100% 50%; }
                75% { background-position: 50% 50%; }
                100% { background-position: 0% 50%; }
            }
        `;
        document.head.appendChild(style);
    }
}

// Enhanced Text Effects
class TextEffects {
    constructor() {
        this.addGlowEffects();
        this.addFloatingAnimation();
        this.addTypewriterEffect();
    }

    addGlowEffects() {
        const style = document.createElement('style');
        style.textContent = `
            .glow-text {
                text-shadow: 
                    0 0 10px rgba(186, 148, 79, 0.8),
                    0 0 20px rgba(186, 148, 79, 0.6),
                    0 0 30px rgba(186, 148, 79, 0.4),
                    0 0 40px rgba(186, 148, 79, 0.2);
                animation: textGlow 3s ease-in-out infinite alternate;
            }

            @keyframes textGlow {
                from {
                    text-shadow: 
                        0 0 10px rgba(186, 148, 79, 0.8),
                        0 0 20px rgba(186, 148, 79, 0.6),
                        0 0 30px rgba(186, 148, 79, 0.4);
                }
                to {
                    text-shadow: 
                        0 0 20px rgba(186, 148, 79, 1),
                        0 0 30px rgba(186, 148, 79, 0.8),
                        0 0 40px rgba(186, 148, 79, 0.6),
                        0 0 50px rgba(186, 148, 79, 0.4);
                }
            }

            .float-animation {
                animation: floatUpDown 4s ease-in-out infinite;
            }

            @keyframes floatUpDown {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-20px); }
            }

            .pulse-scale {
                animation: pulseScale 2s ease-in-out infinite;
            }

            @keyframes pulseScale {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }

            .sponsored-title, .ita-large, .galactic-title {
                position: relative;
            }

            .sponsored-title::after {
                content: '';
                position: absolute;
                bottom: -10px;
                left: 50%;
                transform: translateX(-50%);
                width: 80%;
                height: 2px;
                background: linear-gradient(90deg, 
                    transparent, 
                    rgba(186, 148, 79, 0.8), 
                    transparent
                );
                animation: shimmer 2s ease-in-out infinite;
            }

            @keyframes shimmer {
                0%, 100% { opacity: 0.3; }
                50% { opacity: 1; }
            }

            /* 3D Transform Effects */
            .transform-3d {
                transform-style: preserve-3d;
                perspective: 1000px;
            }

            .header-portrait {
                transition: transform 0.3s ease;
            }

            .header-portrait:hover {
                transform: rotateY(10deg) rotateX(5deg) scale(1.05);
                box-shadow: 
                    0 20px 60px rgba(186, 148, 79, 0.3),
                    0 0 40px rgba(186, 148, 79, 0.2);
            }

            /* Holographic Effect */
            .holographic {
                position: relative;
                overflow: hidden;
            }

            .holographic::before {
                content: '';
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: linear-gradient(
                    45deg,
                    transparent 30%,
                    rgba(186, 148, 79, 0.1) 50%,
                    transparent 70%
                );
                animation: holographicSweep 3s linear infinite;
            }

            @keyframes holographicSweep {
                0% { transform: translateX(-100%) translateY(-100%); }
                100% { transform: translateX(100%) translateY(100%); }
            }

            /* Neon Border Effect */
            .neon-border {
                position: relative;
                border: 2px solid rgba(186, 148, 79, 0.5);
                box-shadow: 
                    inset 0 0 20px rgba(186, 148, 79, 0.2),
                    0 0 20px rgba(186, 148, 79, 0.3);
                animation: neonPulse 2s ease-in-out infinite;
            }

            @keyframes neonPulse {
                0%, 100% {
                    box-shadow: 
                        inset 0 0 20px rgba(186, 148, 79, 0.2),
                        0 0 20px rgba(186, 148, 79, 0.3);
                }
                50% {
                    box-shadow: 
                        inset 0 0 30px rgba(186, 148, 79, 0.4),
                        0 0 40px rgba(186, 148, 79, 0.5);
                }
            }
        `;
        document.head.appendChild(style);

        // Apply effects to elements
        setTimeout(() => {
            document.querySelectorAll('.ita-large, .galactic-title').forEach(el => {
                el.classList.add('glow-text');
            });

            document.querySelectorAll('.gallery-item, .header-portrait').forEach(el => {
                el.classList.add('holographic');
            });

            document.querySelectorAll('.cta-button').forEach(el => {
                el.classList.add('neon-border', 'pulse-scale');
            });
        }, 100);
    }

    addFloatingAnimation() {
        const floatingElements = document.querySelectorAll('.grid-img, .about-image');
        floatingElements.forEach((el, index) => {
            el.style.animation = `floatUpDown ${3 + index * 0.5}s ease-in-out infinite`;
            el.style.animationDelay = `${index * 0.2}s`;
        });
    }

    addTypewriterEffect() {
        // Add subtle typing effect to welcome text
        const welcomeText = document.querySelector('.welcome-title');
        if (welcomeText) {
            welcomeText.style.overflow = 'hidden';
            welcomeText.style.borderRight = '3px solid rgba(186, 148, 79, 0.8)';
            welcomeText.style.whiteSpace = 'nowrap';
            welcomeText.style.animation = 'typing 2s steps(7) 1s 1 normal both, blink 0.7s infinite';

            const style = document.createElement('style');
            style.textContent = `
                @keyframes typing {
                    from { width: 0; }
                    to { width: 100%; }
                }
                @keyframes blink {
                    50% { border-color: transparent; }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Scroll-Triggered Animations
class CosmicScrollAnimations {
    constructor() {
        this.addParallaxEffects();
        this.addRevealOnScroll();
    }

    addParallaxEffects() {
        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const scrolled = window.pageYOffset;
                    
                    // Parallax for images
                    document.querySelectorAll('.grid-img, .header-portrait').forEach((el, index) => {
                        const speed = 0.5 + (index * 0.1);
                        el.style.transform = `translateY(${scrolled * speed * 0.1}px)`;
                    });

                    // Fade sections
                    document.querySelectorAll('section').forEach(section => {
                        const rect = section.getBoundingClientRect();
                        const inView = rect.top < window.innerHeight * 0.75;
                        if (inView) {
                            section.style.opacity = '1';
                            section.style.transform = 'translateY(0)';
                        }
                    });

                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    addRevealOnScroll() {
        const style = document.createElement('style');
        style.textContent = `
            section {
                opacity: 0;
                transform: translateY(50px);
                transition: opacity 0.8s ease, transform 0.8s ease;
            }

            section:first-child {
                opacity: 1;
                transform: translateY(0);
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize all effects when page loads
document.addEventListener('DOMContentLoaded', () => {
    new AnimatedBackground();
    new CosmicEffects();
    new TextEffects();
    new CosmicScrollAnimations();

    console.log('🌟 Cosmic effects initialized!');
});
