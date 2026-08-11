/**
 * Space Events Calendar
 * Displays launches, discoveries, and space events
 */
/* global SpaceAPIIntegrations */

class EventCalendar {
    constructor() {
        this.spaceAPI = null;
        this.events = [];
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.viewMode = 'month'; // month, week, day, list
        this.init();
    }

    async init() {
        const container = document.getElementById('event-calendar-container');
        if (!container) {
            console.error('Event calendar container not found');
            return;
        }

        // Initialize Space API
        if (window.SpaceAPIIntegrations) {
            const nasaApiKey = window.NASA_API_KEY || null;
            this.spaceAPI = new SpaceAPIIntegrations({ nasaApiKey });
        }

        this.render();
        await this.loadEvents();
        this.trackEvent('event_calendar_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`event_calendar_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    /**
     * Render calendar UI
     */
    render() {
        const container = document.getElementById('event-calendar-container');
        if (!container) return;

        container.innerHTML = `
            <div class="event-calendar">
                <div class="calendar-header">
                    <h2>📅 Space Events Calendar</h2>
                    <div class="calendar-controls">
                        <button class="view-btn" id="view-month" data-view="month">Month</button>
                        <button class="view-btn" id="view-week" data-view="week">Week</button>
                        <button class="view-btn" id="view-day" data-view="day">Day</button>
                        <button class="view-btn" id="view-list" data-view="list">List</button>
                        <button class="nav-btn" id="prev-month">←</button>
                        <button class="nav-btn" id="today-btn">Today</button>
                        <button class="nav-btn" id="next-month">→</button>
                    </div>
                </div>

                <div class="calendar-view" id="calendar-view">
                    <!-- Calendar will be rendered here -->
                </div>

                <div class="event-details" id="event-details" style="display: none;">
                    <!-- Event details will be shown here -->
                </div>
            </div>
        `;

        this.setupEventListeners();
        this.renderCalendar();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // View mode buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.viewMode = btn.dataset.view;
                document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.renderCalendar();
            });
        });

        // Navigation buttons
        document.getElementById('prev-month').addEventListener('click', () => {
            if (this.viewMode === 'month') {
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            } else if (this.viewMode === 'week') {
                this.currentDate.setDate(this.currentDate.getDate() - 7);
            } else {
                this.currentDate.setDate(this.currentDate.getDate() - 1);
            }
            this.renderCalendar();
        });

        document.getElementById('next-month').addEventListener('click', () => {
            if (this.viewMode === 'month') {
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            } else if (this.viewMode === 'week') {
                this.currentDate.setDate(this.currentDate.getDate() + 7);
            } else {
                this.currentDate.setDate(this.currentDate.getDate() + 1);
            }
            this.renderCalendar();
        });

        document.getElementById('today-btn').addEventListener('click', () => {
            this.currentDate = new Date();
            this.selectedDate = new Date();
            this.renderCalendar();
        });
    }

    /**
     * Load events from APIs
     */
    async loadEvents() {
        if (!this.spaceAPI) return;

        try {
            const [launches, news] = await Promise.allSettled([
                this.spaceAPI.getSpaceXLaunches(20),
                this.spaceAPI.getAllSpaceNews(10)
            ]);

            this.events = [];

            // Add launches (only future ones)
            if (launches.status === 'fulfilled' && launches.value && launches.value.length > 0) {
                const now = new Date();
                launches.value.forEach(launch => {
                    const launchDate = new Date(launch.date || launch.date_local);
                    // Only add future launches
                    if (launchDate > now) {
                        this.events.push({
                            id: `launch-${launch.id}`,
                            title: launch.name || 'SpaceX Launch',
                            date: launchDate,
                            type: 'launch',
                            description: launch.details || '',
                            source: 'spacex',
                            data: launch
                        });
                    }
                });
            } else {
                // Fallback: Add mock future launches
                const now = new Date();

                // Launch 1: 2 days from now
                const d1 = new Date(now); d1.setDate(d1.getDate() + 2); d1.setHours(14, 30);
                this.events.push({
                    id: 'mock-launch-1',
                    title: 'Starship Orbital Test Flight',
                    date: d1,
                    type: 'launch',
                    description: 'Experimental orbital test flight of the Starship vehicle.',
                    source: 'spacex',
                    link: 'https://www.spacex.com/launches'
                });

                // Launch 2: 5 days from now
                const d2 = new Date(now); d2.setDate(d2.getDate() + 5); d2.setHours(9, 0);
                this.events.push({
                    id: 'mock-launch-2',
                    title: 'Falcon 9 Starlink Mission',
                    date: d2,
                    type: 'launch',
                    description: 'Batch deployment of Starlink satellites to low Earth orbit.',
                    source: 'spacex',
                    link: 'https://www.spacex.com/launches'
                });

                // Launch 3: 12 days from now
                const d3 = new Date(now); d3.setDate(d3.getDate() + 12); d3.setHours(23, 45);
                this.events.push({
                    id: 'mock-launch-3',
                    title: 'Europa Clipper Launch',
                    date: d3,
                    type: 'launch',
                    description: 'NASA mission to explore Jupiter\'s moon Europa.',
                    source: 'NASA',
                    link: 'https://www.nasa.gov'
                });
            }

            // Add news events (use publication date)
            if (news.status === 'fulfilled' && news.value) {
                news.value.forEach(item => {
                    if (item.pubDate) {
                        this.events.push({
                            id: `news-${Date.now()}-${Math.random()}`,
                            title: item.title || 'Space News',
                            date: new Date(item.pubDate),
                            type: 'news',
                            description: item.description || '',
                            source: item.source || 'unknown',
                            link: item.link,
                            data: item
                        });
                    }
                });
            }

            // Sort by date
            this.events.sort((a, b) => a.date - b.date);
            this.renderCalendar();
        } catch (error) {
            console.error('Error loading events:', error);
        }
    }

    /**
     * Render calendar based on view mode
     */
    renderCalendar() {
        const view = document.getElementById('calendar-view');
        if (!view) return;

        switch (this.viewMode) {
            case 'month':
                this.renderMonthView(view);
                break;
            case 'week':
                this.renderWeekView(view);
                break;
            case 'day':
                this.renderDayView(view);
                break;
            case 'list':
                this.renderListView(view);
                break;
        }
    }

    /**
     * Render month view
     */
    renderMonthView(container) {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - startDate.getDay());

        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        let html = `
            <div class="month-view">
                <div class="month-header">
                    <h3>${monthNames[month]} ${year}</h3>
                </div>
                <div class="calendar-grid">
                    <div class="calendar-weekdays">
                        ${dayNames.map(day => `<div class="weekday">${day}</div>`).join('')}
                    </div>
                    <div class="calendar-days">
        `;

        const currentDate = new Date(startDate);
        for (let week = 0; week < 6; week++) {
            for (let day = 0; day < 7; day++) {
                const dateStr = currentDate.toISOString().split('T')[0];
                const dayEvents = this.getEventsForDate(currentDate);
                const isCurrentMonth = currentDate.getMonth() === month;
                const isToday = this.isToday(currentDate);
                const isSelected = this.isSameDate(currentDate, this.selectedDate);

                html += `
                    <div class="calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}"
                         onclick="eventCalendar.selectDate(new Date('${currentDate.toISOString()}'))">
                        <div class="day-number">${currentDate.getDate()}</div>
                        <div class="day-events">
                            ${dayEvents.slice(0, 3).map(event => `
                                <div class="event-dot ${event.type}" title="${event.title}"></div>
                            `).join('')}
                            ${dayEvents.length > 3 ? `<div class="more-events">+${dayEvents.length - 3}</div>` : ''}
                        </div>
                    </div>
                `;

                currentDate.setDate(currentDate.getDate() + 1);
            }
        }

        html += `
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
        this.renderEventList();
    }

    /**
     * Render week view
     */
    renderWeekView(container) {
        const startOfWeek = new Date(this.currentDate);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

        const html = `
            <div class="week-view">
                <div class="week-header">
                    ${Array.from({ length: 7 }, (_, i) => {
            const date = new Date(startOfWeek);
            date.setDate(date.getDate() + i);
            const dayEvents = this.getEventsForDate(date);
            return `
                            <div class="week-day ${this.isToday(date) ? 'today' : ''}">
                                <div class="week-day-name">${date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                <div class="week-day-number">${date.getDate()}</div>
                                <div class="week-day-events">
                                    ${dayEvents.map(event => `
                                        <div class="week-event ${event.type}" onclick="eventCalendar.showEventDetails('${event.id}')">
                                            <div class="event-time">${this.formatTime(event.date)}</div>
                                            <div class="event-title">${event.title}</div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    /**
     * Render day view
     */
    renderDayView(container) {
        const dayEvents = this.getEventsForDate(this.currentDate);
        const dateStr = this.currentDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const html = `
            <div class="day-view">
                <div class="day-header">
                    <h3>${dateStr}</h3>
                </div>
                <div class="day-events-list">
                    ${dayEvents.length > 0 ? dayEvents.map(event => `
                        <div class="day-event-card ${event.type}" onclick="eventCalendar.showEventDetails('${event.id}')">
                            <div class="event-time">${this.formatTime(event.date)}</div>
                            <div class="event-content">
                                <h4>${event.title}</h4>
                                <p>${event.description || ''}</p>
                                ${event.link ? `<a href="${event.link}" target="_blank" rel="noopener">Read More →</a>` : ''}
                            </div>
                        </div>
                    `).join('') : '<p class="no-events">No events scheduled for this day</p>'}
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    /**
     * Render list view
     */
    renderListView(container) {
        const upcomingEvents = this.events.filter(e => e.date >= new Date()).slice(0, 50);

        const html = `
            <div class="list-view">
                <h3>Upcoming Events</h3>
                <div class="events-list">
                    ${upcomingEvents.length > 0 ? upcomingEvents.map(event => `
                        <div class="list-event-item ${event.type}" onclick="eventCalendar.showEventDetails('${event.id}')">
                            <div class="event-date">
                                <div class="event-month">${event.date.toLocaleDateString('en-US', { month: 'short' })}</div>
                                <div class="event-day">${event.date.getDate()}</div>
                                <div class="event-year">${event.date.getFullYear()}</div>
                            </div>
                            <div class="event-info">
                                <h4>${event.title}</h4>
                                <p>${event.description || ''}</p>
                                <div class="event-meta">
                                    <span class="event-type">${event.type}</span>
                                    <span class="event-time">${this.formatTime(event.date)}</span>
                                </div>
                            </div>
                        </div>
                    `).join('') : '<p class="no-events">No upcoming events</p>'}
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    /**
     * Render event list sidebar
     */
    renderEventList() {
        const todayEvents = this.getEventsForDate(new Date());
        const upcomingEvents = this.events.filter(e => e.date >= new Date()).slice(0, 5);

        const listContainer = document.querySelector('.event-list-sidebar');
        if (!listContainer) {
            const calendar = document.querySelector('.event-calendar');
            if (calendar) {
                const sidebar = document.createElement('div');
                sidebar.className = 'event-list-sidebar';
                sidebar.innerHTML = `
                    <h4>Today's Events</h4>
                    <div class="today-events">
                        ${todayEvents.length > 0 ? todayEvents.map(event => `
                            <div class="sidebar-event ${event.type}" onclick="eventCalendar.showEventDetails('${event.id}')">
                                <div class="event-time-small">${this.formatTime(event.date)}</div>
                                <div class="event-title-small">${event.title}</div>
                            </div>
                        `).join('') : '<p class="no-events-small">No events today</p>'}
                    </div>
                    <h4>Upcoming</h4>
                    <div class="upcoming-events">
                        ${upcomingEvents.map(event => `
                            <div class="sidebar-event ${event.type}" onclick="eventCalendar.showEventDetails('${event.id}')">
                                <div class="event-date-small">${event.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                                <div class="event-title-small">${event.title}</div>
                            </div>
                        `).join('')}
                    </div>
                `;
                calendar.appendChild(sidebar);
            }
        }
    }

    /**
     * Get events for a specific date
     */
    getEventsForDate(date) {
        return this.events.filter(event => {
            return this.isSameDate(new Date(event.date), date);
        });
    }

    /**
     * Check if two dates are the same day
     */
    isSameDate(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate();
    }

    /**
     * Check if date is today
     */
    isToday(date) {
        return this.isSameDate(date, new Date());
    }

    /**
     * Format time
     */
    formatTime(date) {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }

    /**
     * Select a date
     */
    selectDate(date) {
        this.selectedDate = date;
        this.currentDate = new Date(date);
        if (this.viewMode === 'day') {
            this.renderCalendar();
        } else {
            this.renderCalendar();
        }
    }

    /**
     * Show event details
     */
    showEventDetails(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;

        const details = document.getElementById('event-details');
        if (!details) return;

        details.style.display = 'block';
        details.innerHTML = `
            <div class="event-details-content">
                <button class="close-details" onclick="this.closest('.event-details').style.display='none'">&times;</button>
                <h3>${event.title}</h3>
                <div class="event-details-meta">
                    <span class="event-type-badge ${event.type}">${event.type}</span>
                    <span class="event-date-full">${event.date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        })}</span>
                </div>
                <div class="event-description">
                    ${event.description || 'No description available.'}
                </div>
                ${event.link ? `
                    <a href="${event.link}" target="_blank" rel="noopener" class="event-link">
                        Read Full Article →
                    </a>
                ` : ''}
            </div>
        `;
    }
}

// Initialize calendar when DOM is ready
let eventCalendarInstance = null;

function initEventCalendar() {
    if (!eventCalendarInstance) {
        eventCalendarInstance = new EventCalendar();
    }
    return eventCalendarInstance;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEventCalendar);
} else {
    initEventCalendar();
}

// Make available globally
window.EventCalendar = EventCalendar;
window.eventCalendar = eventCalendarInstance;

