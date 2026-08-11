/**
 * Projects Experimental JS
 * Handles specialized visual effects for the Projects page
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('🧪 Experimental Projects Module Initialized');

    const reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const supportsIntersectionObserver = 'IntersectionObserver' in window;

    // 1. Intersection Observer for Scroll Animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const sections = Array.from(document.querySelectorAll('.phase-section'));
    if (!reduceMotion && supportsIntersectionObserver) {
        sections.forEach((section) => {
            section.querySelectorAll('.project-card').forEach((card) => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            });
        });
    }

    if (supportsIntersectionObserver) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    // Optional: Stagger children animation
                    const cards = entry.target.querySelectorAll('.project-card');
                    cards.forEach((card, index) => {
                        if (card.dataset.animated === 'true') return;
                        card.dataset.animated = 'true';

                        if (reduceMotion) {
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                            return;
                        }

                        setTimeout(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                        }, index * 100);
                    });

                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        sections.forEach(section => {
            observer.observe(section);
        });
    } else {
        document.querySelectorAll('.project-card').forEach((card) => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
            card.style.transition = '';
        });
    }

    // 2. Advanced Constellation Particle System
    const canvasContainer = document.getElementById('particles-js');
    if (canvasContainer && !reduceMotion) {
        const canvas = document.createElement('canvas');
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';
        canvas.width = canvasContainer.clientWidth;
        canvas.height = canvasContainer.clientHeight;
        canvasContainer.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const particles = [];
        const particleCount = window.innerWidth > 768 ? 80 : 40;
        const connectionDistance = 150;
        const mouse = { x: null, y: null };

        // Mouse interaction
        window.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        }, { passive: true });

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = (Math.random() - 0.5) * 0.5;
                this.size = Math.random() * 2 + 1;
                this.color = Math.random() > 0.5 ? '#00f3ff' : '#bc13fe'; // Neon Blue/Purple
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                // Mouse repulsion
                if (mouse.x != null) {
                    const dx = mouse.x - this.x;
                    const dy = mouse.y - this.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < 100) {
                        const angle = Math.atan2(dy, dx);
                        const force = (100 - distance) / 100;
                        const push = force * 2;
                        this.x -= Math.cos(angle) * push;
                        this.y -= Math.sin(angle) * push;
                    }
                }

                if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
                if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
            }

            draw() {
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }

        let rafId = null;
        const connectionDistanceSq = connectionDistance * connectionDistance;
        const targetFrameMs = 1000 / 30;
        let lastFrameTime = 0;

        const stopAnimation = () => {
            if (rafId != null) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
        };

        const startAnimation = () => {
            if (rafId == null) {
                animate();
            }
        };

        function animate(now = 0) {
            if (now - lastFrameTime < targetFrameMs) {
                rafId = requestAnimationFrame(animate);
                return;
            }
            lastFrameTime = now;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Update and Draw Particles
            particles.forEach(p => {
                p.update();
                p.draw();
            });

            // Draw Connections
            for (let a = 0; a < particles.length; a++) {
                for (let b = a; b < particles.length; b++) {
                    const dx = particles[a].x - particles[b].x;
                    const dy = particles[a].y - particles[b].y;
                    const distanceSq = dx * dx + dy * dy;

                    if (distanceSq < connectionDistanceSq) {
                        const distance = Math.sqrt(distanceSq);
                        const opacity = 1 - (distance / connectionDistance);
                        ctx.strokeStyle = `rgba(100, 100, 255, ${opacity * 0.2})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(particles[a].x, particles[a].y);
                        ctx.lineTo(particles[b].x, particles[b].y);
                        ctx.stroke();
                    }
                }
            }

            rafId = requestAnimationFrame(animate);
        }

        startAnimation();

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                stopAnimation();
                return;
            }

            startAnimation();
        });

        if (supportsIntersectionObserver) {
            const hero = document.querySelector('.experimental-hero');
            if (hero) {
                const heroObserver = new IntersectionObserver((entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting && !document.hidden) {
                            startAnimation();
                        } else {
                            stopAnimation();
                        }
                    });
                }, { threshold: 0.05 });

                heroObserver.observe(hero);
            }
        }

        // Resize handler
        window.addEventListener('resize', () => {
            canvas.width = canvasContainer.clientWidth;
            canvas.height = canvasContainer.clientHeight;
        }, { passive: true });
    }
});
