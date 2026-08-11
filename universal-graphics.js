// Universal Graphics System - Applied to ALL Pages
class UniversalGraphics {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.nebulas = [];
        this.shootingStars = [];
        this.init();
    }

    init() {
        this.animationFrameId = null;
        this.resizeHandler = () => this.handleResize();
        this.mouseMoveHandler = (e) => this.handleMouseMove(e);
        
        this.createCanvas();
        this.createParticles();
        this.createNebulas();
        this.createShootingStars();
        this.animate();
        this.addMouseTrail();
        this.enhancePageElements();
        window.addEventListener('resize', this.resizeHandler);
    }
    
    handleMouseMove(e) {
        const mouseX = e.clientX;
        const mouseY = e.clientY;

        if (Math.random() > 0.85) {
            this.particles.push({
                x: mouseX + (Math.random() - 0.5) * 20,
                y: mouseY + (Math.random() - 0.5) * 20,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                radius: Math.random() * 2 + 1,
                opacity: 0.8,
                twinkle: -0.03,
                lifetime: 60
            });
        }

        this.particles = this.particles.filter(p => {
            if (p.lifetime !== undefined) {
                p.lifetime--;
                return p.lifetime > 0;
            }
            return true;
        });
    }
    
    cleanup() {
        // Clear intervals
        if (this.shootingStarInterval) {
            clearInterval(this.shootingStarInterval);
            this.shootingStarInterval = null;
        }
        
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
        this.canvas.id = 'universal-graphics-canvas';
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -5;
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
        const count = 100;
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                radius: Math.random() * 2 + 0.5,
                opacity: Math.random() * 0.5 + 0.2,
                twinkle: Math.random() * 0.02
            });
        }
    }

    createNebulas() {
        const count = 3;
        for (let i = 0; i < count; i++) {
            this.nebulas.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                radius: Math.random() * 200 + 100,
                hue: Math.random() * 360,
                opacity: Math.random() * 0.1 + 0.05,
                speed: Math.random() * 0.05 + 0.02,
                angle: Math.random() * Math.PI * 2
            });
        }
    }

    createShootingStars() {
        this.shootingStarInterval = setInterval(() => {
            if (this.canvas && Math.random() > 0.7) {
                this.shootingStars.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height * 0.3,
                    length: Math.random() * 80 + 40,
                    speed: Math.random() * 5 + 5,
                    angle: Math.random() * Math.PI / 4 + Math.PI / 4,
                    opacity: 1
                });
            }
        }, 3000);
    }

    drawParticles() {
        this.particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.opacity += particle.twinkle;

            if (particle.opacity > 0.7 || particle.opacity < 0.2) {
                particle.twinkle *= -1;
            }

            if (particle.x < 0) particle.x = this.canvas.width;
            if (particle.x > this.canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.canvas.height;
            if (particle.y > this.canvas.height) particle.y = 0;

            const gradient = this.ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.radius * 3
            );
            gradient.addColorStop(0, `rgba(186, 148, 79, ${particle.opacity})`);
            gradient.addColorStop(1, 'rgba(186, 148, 79, 0)');

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.radius * 3, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    drawNebulas() {
        this.nebulas.forEach(nebula => {
            nebula.x += Math.cos(nebula.angle) * nebula.speed;
            nebula.y += Math.sin(nebula.angle) * nebula.speed;

            if (nebula.x < -nebula.radius) nebula.x = this.canvas.width + nebula.radius;
            if (nebula.x > this.canvas.width + nebula.radius) nebula.x = -nebula.radius;
            if (nebula.y < -nebula.radius) nebula.y = this.canvas.height + nebula.radius;
            if (nebula.y > this.canvas.height + nebula.radius) nebula.y = -nebula.radius;

            const gradient = this.ctx.createRadialGradient(
                nebula.x, nebula.y, 0,
                nebula.x, nebula.y, nebula.radius
            );
            gradient.addColorStop(0, `hsla(${nebula.hue}, 80%, 60%, ${nebula.opacity})`);
            gradient.addColorStop(0.5, `hsla(${nebula.hue + 30}, 70%, 50%, ${nebula.opacity * 0.5})`);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(nebula.x, nebula.y, nebula.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    drawShootingStars() {
        this.shootingStars = this.shootingStars.filter(star => {
            star.x += Math.cos(star.angle) * star.speed;
            star.y += Math.sin(star.angle) * star.speed;
            star.opacity -= 0.02;

            if (star.opacity <= 0) return false;

            const endX = star.x - Math.cos(star.angle) * star.length;
            const endY = star.y - Math.sin(star.angle) * star.length;

            const gradient = this.ctx.createLinearGradient(star.x, star.y, endX, endY);
            gradient.addColorStop(0, `rgba(255, 255, 255, ${star.opacity})`);
            gradient.addColorStop(0.5, `rgba(186, 148, 79, ${star.opacity * 0.7})`);
            gradient.addColorStop(1, 'rgba(186, 148, 79, 0)');

            this.ctx.strokeStyle = gradient;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(star.x, star.y);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();

            return true;
        });
    }

    animate() {
        if (!this.canvas || !this.ctx) {
            return; // Canvas was removed, stop animation
        }
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawNebulas();
        this.drawParticles();
        this.drawShootingStars();

        this.animationFrameId = requestAnimationFrame(() => this.animate());
    }

    addMouseTrail() {
        document.addEventListener('mousemove', this.mouseMoveHandler);
    }

    enhancePageElements() {
        // Add glow to all headings
        const headings = document.querySelectorAll('h1, h2, h3');
        headings.forEach((heading, index) => {
            heading.style.textShadow = '0 0 20px rgba(186, 148, 79, 0.6)';
            heading.style.animation = `textGlowPulse 3s ease-in-out infinite`;
            heading.style.animationDelay = `${index * 0.1}s`;
        });

        // Add hover effects to all buttons and links
        const buttons = document.querySelectorAll('button, .cta-button, a[class*="button"]');
        buttons.forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                this.createBurst(
                    btn.getBoundingClientRect().left + btn.offsetWidth / 2,
                    btn.getBoundingClientRect().top + btn.offsetHeight / 2
                );
            });
        });

        // Add entrance animations to all sections
        const sections = document.querySelectorAll('section');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1 });

        sections.forEach(section => {
            section.style.opacity = '0';
            section.style.transform = 'translateY(30px)';
            section.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            observer.observe(section);
        });

        // Add CSS animations
        this.addGlobalStyles();
    }

    createBurst(x, y) {
        const count = 15;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                radius: Math.random() * 2 + 1,
                opacity: 1,
                twinkle: -0.05,
                lifetime: 30
            });
        }
    }

    addGlobalStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes textGlowPulse {
                0%, 100% {
                    text-shadow: 0 0 10px rgba(186, 148, 79, 0.4);
                }
                50% {
                    text-shadow: 0 0 20px rgba(186, 148, 79, 0.8),
                                 0 0 30px rgba(186, 148, 79, 0.6);
                }
            }

            body {
                background: linear-gradient(135deg, #000000 0%, #0a0a0f 50%, #000000 100%);
                background-attachment: fixed;
            }

            /* Enhanced image hover effects */
            img:not(.no-enhance) {
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            }

            img:not(.no-enhance):hover {
                transform: scale(1.05) translateY(-5px);
                box-shadow: 0 20px 60px rgba(186, 148, 79, 0.4);
                filter: brightness(1.2);
            }

            /* Enhanced card effects */
            .planet-card, .post-card, .event-card, .product-card,
            [class$="-card"], [class*="-card "], [class~="card"] {
                position: relative;
                overflow: hidden;
            }

            .planet-card::after, .post-card::after, .event-card::after,
            [class$="-card"]::after, [class*="-card "]::after, [class~="card"]::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 0;
                height: 0;
                border-radius: 50%;
                background: rgba(186, 148, 79, 0.2);
                transform: translate(-50%, -50%);
                transition: width 0.6s ease, height 0.6s ease;
                pointer-events: none;
            }

            .planet-card:hover::after, .post-card:hover::after,
            [class$="-card"]:hover::after, [class*="-card "]:hover::after, [class~="card"]:hover::after {
                width: 500px;
                height: 500px;
            }

            /* Scrollbar styling */
            ::-webkit-scrollbar {
                width: 12px;
            }

            ::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.5);
            }

            ::-webkit-scrollbar-thumb {
                background: linear-gradient(180deg, #ba944f, #ffd700);
                border-radius: 6px;
            }

            ::-webkit-scrollbar-thumb:hover {
                background: linear-gradient(180deg, #ffd700, #ba944f);
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize on all pages
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new UniversalGraphics();
        console.log('🌟 Universal Graphics System Activated!');
    });
} else {
    new UniversalGraphics();
    console.log('🌟 Universal Graphics System Activated!');
}
