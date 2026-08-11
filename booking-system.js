// Epic Booking System with Countdown & Graphics
class BookingSystem {
    constructor() {
        this.events = [
            {
                id: 1,
                title: 'Andromeda Galaxy Grand Opening',
                date: new Date('2025-02-01T19:00:00'),
                location: 'Virtual Reality Space',
                description: 'Join us for the official launch of the Andromeda Galaxy ownership program! Experience VR tours of your future celestial properties, meet fellow space enthusiasts, and claim exclusive launch-day discounts.',
                image: 'images/event-opening.png',
                capacity: 500,
                booked: 237,
                price: 'FREE',
                badge: 'Featured',
                type: 'virtual'
            },
            {
                id: 2,
                title: 'Kepler-452b Ownership Ceremony',
                date: new Date('2025-02-14T20:00:00'),
                location: 'Online Livestream',
                description: 'Special Valentine\'s Day event! Claim ownership of the most Earth-like exoplanet ever discovered. Perfect romantic gift for space lovers. Includes personalized certificate and romantic star-naming options.',
                image: 'images/bg-large.jpg',
                capacity: 200,
                booked: 87,
                price: '£49.99',
                badge: 'VIP',
                type: 'premium'
            },
            {
                id: 3,
                title: 'Cosmic Trivia Night - Win Free Planets',
                date: new Date('2025-02-21T21:00:00'),
                location: 'Discord + Twitch',
                description: 'Test your space knowledge and win FREE ownership of celestial bodies! 20 planets will be given away. Compete in astronomy trivia, exoplanet identification, and NASA mission challenges.',
                image: 'images/image_2.jpg',
                capacity: 1000,
                booked: 543,
                price: 'FREE',
                badge: 'Community',
                type: 'free'
            }
        ];

        this.init();
    }

    async init() {
        await this.loadData();
        this.renderEvents();
        this.createBookingModal();
        this.startCountdowns();
        this.addBookingGraphics();
        this.trackEvent('booking_initialized');
    }

    async loadData() {
        try {
            const response = await fetch('/api/booking-data');
            if (response.ok) {
                this.events = await response.json();
            }
        } catch (e) {
            console.warn('Failed to load booking data, using defaults');
        }
    }

    renderEvents() {
        const container = document.querySelector('.events-container');
        if (!container) return;

        container.innerHTML = `
            <div class="events-grid">
                ${this.events.map(event => this.createEventCard(event)).join('')}
            </div>
            </div>
        `;

        // Event delegation for book buttons
        container.addEventListener('click', (e) => {
            const btn = e.target.closest('.book-button');
            if (btn && btn.dataset.action === 'book') {
                const eventId = parseInt(btn.dataset.eventId);
                this.openBookingModal(eventId);
            }
        });
    }

    createEventCard(event) {
        // const daysUntil = Math.ceil((event.date - new Date()) / (1000 * 60 * 60 * 24)); // Unused
        const spotsLeft = event.capacity - event.booked;
        const percentFull = Math.round((event.booked / event.capacity) * 100);

        return `
            <div class="event-card" data-event-id="${event.id}">
                <div class="event-image-container">
                    <img src="${event.image}" alt="${event.title}" class="event-image">
                    <div class="event-badge ${event.type}">${event.badge}</div>
                </div>
                
                <div class="event-content">
                    <h3 class="event-title">${event.title}</h3>
                    
                    <div class="event-date">
                        📅 ${this.formatDate(event.date)}
                    </div>
                    
                    <div class="event-location">
                        📍 ${event.location}
                    </div>
                    
                    <p class="event-description">${event.description}</p>
                    
                    <div class="event-stats">
                        <div class="event-stat">
                            <span class="event-stat-value">${spotsLeft}</span>
                            <span class="event-stat-label">Spots Left</span>
                        </div>
                        <div class="event-stat">
                            <span class="event-stat-value">${percentFull}%</span>
                            <span class="event-stat-label">Booked</span>
                        </div>
                        <div class="event-stat">
                            <span class="event-stat-value">${event.price}</span>
                            <span class="event-stat-label">Price</span>
                        </div>
                    </div>
                    
                    <div class="event-countdown" data-date="${event.date.toISOString()}">
                        <div class="countdown-title">Event starts in:</div>
                        <div class="countdown-timer">
                            <div class="countdown-unit">
                                <span class="countdown-value days">00</span>
                                <span class="countdown-label">Days</span>
                            </div>
                            <div class="countdown-unit">
                                <span class="countdown-value hours">00</span>
                                <span class="countdown-label">Hours</span>
                            </div>
                            <div class="countdown-unit">
                                <span class="countdown-value minutes">00</span>
                                <span class="countdown-label">Minutes</span>
                            </div>
                            <div class="countdown-unit">
                                <span class="countdown-value seconds">00</span>
                                <span class="countdown-label">Seconds</span>
                            </div>
                        </div>
                    </div>
                    
                    <button class="book-button" data-action="book" data-event-id="${event.id}">
                        ${event.price === 'FREE' ? 'RSVP Now' : 'Book Tickets'}
                    </button>
                </div>
            </div>
        `;
    }

    formatDate(date) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return date.toLocaleDateString('en-GB', options);
    }

    startCountdowns() {
        setInterval(() => {
            document.querySelectorAll('.event-countdown').forEach(countdown => {
                const eventDate = new Date(countdown.dataset.date);
                const now = new Date();
                const diff = eventDate - now;

                if (diff > 0) {
                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

                    const daysEl = countdown.querySelector('.days');
                    const hoursEl = countdown.querySelector('.hours');
                    const minutesEl = countdown.querySelector('.minutes');
                    const secondsEl = countdown.querySelector('.seconds');
                    if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
                    if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
                    if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
                    if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');
                }
            });
        }, 1000);
    }

    createBookingModal() {
        const modal = document.createElement('div');
        modal.className = 'booking-modal';
        modal.id = 'booking-modal';
        modal.innerHTML = `
            <div class="booking-modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">Book Your Spot</h2>
                    <button class="modal-close" id="modal-close-btn">✕ Close</button>
                </div>
                <form class="booking-form" id="booking-form" novalidate>
                    <div class="form-group">
                        <label class="form-label" for="booking-name">Full Name</label>
                        <input type="text" id="booking-name" name="name" class="form-input" required minlength="2" placeholder="Enter your name">
                        <span class="error-message"></span>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="booking-email">Email Address</label>
                        <input type="email" id="booking-email" name="email" class="form-input" required placeholder="your.email@example.com">
                        <span class="error-message"></span>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="booking-tickets">Number of Tickets</label>
                        <select id="booking-tickets" name="tickets" class="form-input" required>
                            <option value="1">1 Ticket</option>
                            <option value="2">2 Tickets</option>
                            <option value="3">3 Tickets</option>
                            <option value="4">4 Tickets</option>
                            <option value="5">5 Tickets</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="booking-requests">Special Requests (Optional)</label>
                        <textarea id="booking-requests" name="requests" class="form-input" rows="3" placeholder="Any special requirements or questions?"></textarea>
                    </div>
                    <button type="submit" class="submit-button">
                        🚀 Confirm Booking
                    </button>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        // Event Listeners
        const closeBtn = modal.querySelector('#modal-close-btn');
        closeBtn.addEventListener('click', () => this.closeBookingModal());

        const form = modal.querySelector('#booking-form');
        form.addEventListener('submit', (e) => this.submitBooking(e));

        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeBookingModal();
            }
        });
    }

    openBookingModal(eventId) {
        const event = this.events.find(e => e.id === eventId);
        const modal = document.getElementById('booking-modal');

        if (event && modal) {
            const modalTitle = modal.querySelector('.modal-title');
            if (modalTitle) {
                modalTitle.textContent = `Book: ${event.title}`;
            }
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeBookingModal() {
        const modal = document.getElementById('booking-modal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    submitBooking(e) {
        e.preventDefault();

        // Create success animation
        const form = e.target;

        // Validation
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // Create success animation

        alert('🎉 Booking Confirmed!\n\nYour spot has been reserved.\nConfirmation email will be sent shortly.\n\n✨ See you among the stars!');

        this.closeBookingModal();
        form.reset();
    }

    addBookingGraphics() {
        // Add animated background particles specific to booking page
        const canvas = document.createElement('canvas');
        canvas.id = 'booking-particles';
        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -3;
            pointer-events: none;
        `;
        document.body.insertBefore(canvas, document.body.firstChild);

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Create ticket particles
        const tickets = [];
        for (let i = 0; i < 30; i++) {
            tickets.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 30 + 20,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.02,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                opacity: Math.random() * 0.3 + 0.1
            });
        }

        const animateTickets = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            tickets.forEach(ticket => {
                ticket.x += ticket.vx;
                ticket.y += ticket.vy;
                ticket.rotation += ticket.rotationSpeed;

                if (ticket.x < -50) ticket.x = canvas.width + 50;
                if (ticket.x > canvas.width + 50) ticket.x = -50;
                if (ticket.y < -50) ticket.y = canvas.height + 50;
                if (ticket.y > canvas.height + 50) ticket.y = -50;

                ctx.save();
                ctx.translate(ticket.x, ticket.y);
                ctx.rotate(ticket.rotation);
                ctx.fillStyle = `rgba(186, 148, 79, ${ticket.opacity})`;
                ctx.fillRect(-ticket.size / 2, -ticket.size / 4, ticket.size, ticket.size / 2);
                ctx.strokeStyle = `rgba(186, 148, 79, ${ticket.opacity * 0.5})`;
                ctx.lineWidth = 2;
                ctx.strokeRect(-ticket.size / 2, -ticket.size / 4, ticket.size, ticket.size / 2);
                ctx.restore();
            });

            requestAnimationFrame(animateTickets);
        };

        animateTickets();

        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`booking_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Initialize booking system
let bookingSystem;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        bookingSystem = new BookingSystem();
        console.log('🎟️ Booking System Loaded!');
    });
} else {
    const _bookingSystem = new BookingSystem();
    window.bookingSystem = _bookingSystem;
    console.log('🎟️ Booking System Loaded!');
}
