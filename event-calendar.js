/**
 * Space Events Calendar
 * Displays the same-origin, build-cached launch and space-news snapshot.
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
                        <button type="button" class="view-btn active" id="view-month" data-view="month" aria-pressed="true">Month</button>
                        <button type="button" class="view-btn" id="view-week" data-view="week" aria-pressed="false">Week</button>
                        <button type="button" class="view-btn" id="view-day" data-view="day" aria-pressed="false">Day</button>
                        <button type="button" class="view-btn" id="view-list" data-view="list" aria-pressed="false">List</button>
                        <button type="button" class="nav-btn" id="prev-month" aria-label="Previous calendar period">←</button>
                        <button type="button" class="nav-btn" id="today-btn">Today</button>
                        <button type="button" class="nav-btn" id="next-month" aria-label="Next calendar period">→</button>
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
                document.querySelectorAll('.view-btn').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
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
        if (!this.spaceAPI || typeof this.spaceAPI.getBuildCachedUpdates !== 'function') {
            this.events = [];
            this.renderCalendar();
            return;
        }

        try {
            const snapshot = await this.spaceAPI.getBuildCachedUpdates();
            const launches = { status: 'fulfilled', value: snapshot.launches || [] };
            const news = { status: 'fulfilled', value: snapshot.news || [] };

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
        this.setupRenderedInteractions(view);
    }

    setupRenderedInteractions(root) {
        root.querySelectorAll('[data-calendar-date]').forEach(control => {
            control.addEventListener('click', () => this.selectDate(new Date(control.dataset.calendarDate)));
        });
        root.querySelectorAll('[data-event-id]').forEach(control => {
            control.addEventListener('click', () => this.showEventDetails(control.dataset.eventId));
        });
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
                    <button type="button" class="calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}"
                         data-calendar-date="${currentDate.toISOString()}" aria-label="${currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}, ${dayEvents.length} events">
                        <div class="day-number">${currentDate.getDate()}</div>
                        <div class="day-events">
                            ${dayEvents.slice(0, 3).map(event => `
                                <div class="event-dot ${event.type}" title="${this.escapeHtml(event.title)}"></div>
                            `).join('')}
                            ${dayEvents.length > 3 ? `<div class="more-events">+${dayEvents.length - 3}</div>` : ''}
                        </div>
                    </button>
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
                                        <button type="button" class="week-event ${event.type}" data-event-id="${this.escapeHtml(event.id)}">
                                            <div class="event-time">${this.formatTime(event.date)}</div>
                                            <div class="event-title">${this.escapeHtml(event.title)}</div>
                                        </button>
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
                        <button type="button" class="day-event-card ${event.type}" data-event-id="${this.escapeHtml(event.id)}">
                            <div class="event-time">${this.formatTime(event.date)}</div>
                            <div class="event-content">
                                <h4>${this.escapeHtml(event.title)}</h4>
                                <p>${this.escapeHtml(event.description || '')}</p>
                                ${event.link ? '<span class="event-source-note">Source link available in details</span>' : ''}
                            </div>
                        </button>
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
        const listedEvents = [...this.events]
            .sort((a, b) => {
                const now = Date.now();
                const aFuture = a.date.getTime() >= now;
                const bFuture = b.date.getTime() >= now;
                if (aFuture !== bFuture) return aFuture ? -1 : 1;
                return aFuture ? a.date - b.date : b.date - a.date;
            })
            .slice(0, 50);

        const html = `
            <div class="list-view">
                <h3>Mission Snapshot</h3>
                <div class="events-list">
                    ${listedEvents.length > 0 ? listedEvents.map(event => `
                        <button type="button" class="list-event-item ${event.type}" data-event-id="${this.escapeHtml(event.id)}">
                            <div class="event-date">
                                <div class="event-month">${event.date.toLocaleDateString('en-US', { month: 'short' })}</div>
                                <div class="event-day">${event.date.getDate()}</div>
                                <div class="event-year">${event.date.getFullYear()}</div>
                            </div>
                            <div class="event-info">
                                <h4>${this.escapeHtml(event.title)}</h4>
                                <p>${this.escapeHtml(event.description || '')}</p>
                                <div class="event-meta">
                                    <span class="event-type">${event.type}</span>
                                    <span class="event-time">${this.formatTime(event.date)}</span>
                                </div>
                            </div>
                        </button>
                    `).join('') : '<p class="no-events">No events are present in this release snapshot</p>'}
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
        const futureEvents = this.events.filter(e => e.date >= new Date()).slice(0, 5);
        const upcomingEvents = futureEvents.length
            ? futureEvents
            : [...this.events].sort((a, b) => b.date - a.date).slice(0, 5);

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
                            <button type="button" class="sidebar-event ${event.type}" data-event-id="${this.escapeHtml(event.id)}">
                                <div class="event-time-small">${this.formatTime(event.date)}</div>
                                <div class="event-title-small">${this.escapeHtml(event.title)}</div>
                            </button>
                        `).join('') : '<p class="no-events-small">No events today</p>'}
                    </div>
                    <h4>${futureEvents.length ? 'Upcoming' : 'Latest snapshot'}</h4>
                    <div class="upcoming-events">
                        ${upcomingEvents.map(event => `
                            <button type="button" class="sidebar-event ${event.type}" data-event-id="${this.escapeHtml(event.id)}">
                                <div class="event-date-small">${event.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                                <div class="event-title-small">${this.escapeHtml(event.title)}</div>
                            </button>
                        `).join('')}
                    </div>
                `;
                calendar.appendChild(sidebar);
                this.setupRenderedInteractions(sidebar);
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
        const safeLink = this.safeExternalUrl(event.link);

        details.style.display = 'block';
        details.innerHTML = `
            <div class="event-details-content">
                <button type="button" class="close-details" aria-label="Close event details">&times;</button>
                <h3>${this.escapeHtml(event.title)}</h3>
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
                    ${this.escapeHtml(event.description || 'No description available.')}
                </div>
                ${safeLink ? `
                    <a href="${safeLink}" target="_blank" rel="noopener noreferrer" class="event-link">
                        Read Full Article →
                    </a>
                ` : ''}
            </div>
        `;
        details.querySelector('.close-details')?.addEventListener('click', () => {
            details.style.display = 'none';
        });
        details.querySelector('.close-details')?.focus();
    }

    escapeHtml(value) {
        const element = document.createElement('span');
        element.textContent = String(value ?? '');
        return element.innerHTML;
    }

    safeExternalUrl(value) {
        try {
            const url = new URL(value);
            return url.protocol === 'https:' ? this.escapeHtml(url.href) : '';
        } catch { return ''; }
    }
}

// Initialize calendar when DOM is ready
let eventCalendarInstance = null;

function initEventCalendar() {
    if (!eventCalendarInstance) {
        eventCalendarInstance = new EventCalendar();
        window.eventCalendar = eventCalendarInstance;
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
