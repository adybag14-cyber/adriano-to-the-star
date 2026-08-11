/**
 * Calendar View for Time-based Data
 * Displays time-based data in a calendar format
 */
(function() {
    'use strict';

    class CalendarView {
        constructor() {
            this.currentDate = new Date();
            this.viewMode = 'month'; // month, week, day
            this.events = [];
            this.init();
        }

        init() {
            this.setupUI();
            this.setupEventListeners();
            this.loadEvents();
            this.trackEvent('calendar_view_initialized');
        }

        setupUI() {
            if (!document.getElementById('calendar-view')) {
                const container = document.createElement('div');
                container.id = 'calendar-view';
                container.className = 'calendar-view';
                container.innerHTML = `
                    <div class="calendar-header">
                        <button class="nav-btn prev" id="calendar-prev">‹</button>
                        <h2 class="calendar-title" id="calendar-title"></h2>
                        <button class="nav-btn next" id="calendar-next">›</button>
                        <select id="view-mode-select">
                            <option value="month">Month</option>
                            <option value="week">Week</option>
                            <option value="day">Day</option>
                        </select>
                    </div>
                    <div class="calendar-body" id="calendar-body"></div>
                    <button class="add-event-btn" id="add-event-btn">+ Add Event</button>
                `;
                document.body.appendChild(container);
            }
        }

        setupEventListeners() {
            document.getElementById('calendar-prev')?.addEventListener('click', () => {
                this.navigate(-1);
            });

            document.getElementById('calendar-next')?.addEventListener('click', () => {
                this.navigate(1);
            });

            document.getElementById('view-mode-select')?.addEventListener('change', (e) => {
                this.setViewMode(e.target.value);
            });

            document.getElementById('add-event-btn')?.addEventListener('click', () => {
                this.showAddEventModal();
            });
        }

        navigate(direction) {
            if (this.viewMode === 'month') {
                this.currentDate.setMonth(this.currentDate.getMonth() + direction);
            } else if (this.viewMode === 'week') {
                this.currentDate.setDate(this.currentDate.getDate() + (direction * 7));
            } else {
                this.currentDate.setDate(this.currentDate.getDate() + direction);
            }
            this.render();
        }

        setViewMode(mode) {
            this.viewMode = mode;
            this.render();
        }

        render() {
            const title = document.getElementById('calendar-title');
            const body = document.getElementById('calendar-body');
            if (!title || !body) return;

            // Update title
            title.textContent = this.getTitle();

            // Render based on view mode
            if (this.viewMode === 'month') {
                this.renderMonthView(body);
            } else if (this.viewMode === 'week') {
                this.renderWeekView(body);
            } else {
                this.renderDayView(body);
            }
        }

        getTitle() {
            if (this.viewMode === 'month') {
                return this.currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            } else if (this.viewMode === 'week') {
                const weekStart = this.getWeekStart();
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                return `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;
            } else {
                return this.currentDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
            }
        }

        renderMonthView(container) {
            const year = this.currentDate.getFullYear();
            const month = this.currentDate.getMonth();
            
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const daysInMonth = lastDay.getDate();
            const startingDayOfWeek = firstDay.getDay();

            let html = `
                <div class="calendar-month">
                    <div class="calendar-weekdays">
                        ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => 
                            `<div class="weekday">${day}</div>`
                        ).join('')}
                    </div>
                    <div class="calendar-days">
            `;

            // Empty cells for days before month starts
            for (let i = 0; i < startingDayOfWeek; i++) {
                html += `<div class="calendar-day empty"></div>`;
            }

            // Days of the month
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month, day);
                const dayEvents = this.getEventsForDate(date);
                html += `
                    <div class="calendar-day ${this.isToday(date) ? 'today' : ''}" 
                         data-date="${date.toISOString()}">
                        <div class="day-number">${day}</div>
                        <div class="day-events">
                            ${dayEvents.slice(0, 3).map(event => `
                                <div class="event-item" data-event-id="${event.id}">
                                    ${event.title}
                                </div>
                            `).join('')}
                            ${dayEvents.length > 3 ? 
                                `<div class="more-events">+${dayEvents.length - 3} more</div>` : 
                                ''}
                        </div>
                    </div>
                `;
            }

            html += `</div></div>`;
            container.innerHTML = html;

            // Add click handlers
            container.querySelectorAll('.calendar-day').forEach(day => {
                day.addEventListener('click', () => {
                    const dateStr = day.dataset.date;
                    if (dateStr) {
                        this.showDayDetails(new Date(dateStr));
                    }
                });
            });
        }

        renderWeekView(container) {
            const weekStart = this.getWeekStart();
            const days = [];

            for (let i = 0; i < 7; i++) {
                const date = new Date(weekStart);
                date.setDate(date.getDate() + i);
                days.push(date);
            }

            const html = `
                <div class="calendar-week">
                    <div class="week-header">
                        ${days.map(day => `
                            <div class="week-day-header">
                                <div class="day-name">${day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                <div class="day-number ${this.isToday(day) ? 'today' : ''}">
                                    ${day.getDate()}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="week-body">
                        ${days.map(day => {
                            const events = this.getEventsForDate(day);
                            return `
                                <div class="week-day-column" data-date="${day.toISOString()}">
                                    ${events.map(event => `
                                        <div class="event-item" data-event-id="${event.id}">
                                            <div class="event-time">${this.formatTime(event.startTime)}</div>
                                            <div class="event-title">${event.title}</div>
                                        </div>
                                    `).join('')}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;

            container.innerHTML = html;
        }

        renderDayView(container) {
            const events = this.getEventsForDate(this.currentDate);
            
            const html = `
                <div class="calendar-day-view">
                    <div class="day-timeline">
                        ${Array.from({ length: 24 }, (_, i) => {
                            const hour = i.toString().padStart(2, '0') + ':00';
                            const hourEvents = events.filter(e => {
                                const eventHour = new Date(e.startTime).getHours();
                                return eventHour === i;
                            });
                            return `
                                <div class="timeline-hour">
                                    <div class="hour-label">${hour}</div>
                                    <div class="hour-events">
                                        ${hourEvents.map(event => `
                                            <div class="event-item" data-event-id="${event.id}">
                                                ${event.title}
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

        getWeekStart() {
            const date = new Date(this.currentDate);
            const day = date.getDay();
            const diff = date.getDate() - day;
            return new Date(date.setDate(diff));
        }

        getEventsForDate(date) {
            return this.events.filter(event => {
                const eventDate = new Date(event.date || event.startTime);
                return eventDate.toDateString() === date.toDateString();
            });
        }

        isToday(date) {
            const today = new Date();
            return date.toDateString() === today.toDateString();
        }

        formatTime(timeString) {
            const date = new Date(timeString);
            return date.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit' 
            });
        }

        addEvent(event) {
            event.id = event.id || this.generateEventId();
            this.events.push(event);
            this.saveEvents();
            this.render();
        }

        generateEventId() {
            return 'event_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        showAddEventModal() {
            const modal = document.createElement('div');
            modal.className = 'event-modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Add Event</h3>
                        <button class="close-btn">×</button>
                    </div>
                    <form id="event-form">
                        <div class="form-field">
                            <label>Title</label>
                            <input type="text" name="title" required />
                        </div>
                        <div class="form-field">
                            <label>Date</label>
                            <input type="date" name="date" required />
                        </div>
                        <div class="form-field">
                            <label>Start Time</label>
                            <input type="time" name="startTime" />
                        </div>
                        <div class="form-field">
                            <label>End Time</label>
                            <input type="time" name="endTime" />
                        </div>
                        <div class="form-field">
                            <label>Description</label>
                            <textarea name="description"></textarea>
                        </div>
                        <button type="submit" class="btn-primary">Add Event</button>
                    </form>
                </div>
            `;
            document.body.appendChild(modal);

            // Set default date
            const dateInput = modal.querySelector('input[name="date"]');
            if (dateInput) {
                dateInput.value = this.currentDate.toISOString().split('T')[0];
            }

            modal.querySelector('form').addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const event = {
                    title: formData.get('title'),
                    date: formData.get('date'),
                    startTime: `${formData.get('date')}T${formData.get('startTime') || '00:00'}`,
                    endTime: formData.get('endTime') ? `${formData.get('date')}T${formData.get('endTime')}` : null,
                    description: formData.get('description')
                };
                this.addEvent(event);
                modal.remove();
            });

            modal.querySelector('.close-btn').addEventListener('click', () => {
                modal.remove();
            });
        }

        showDayDetails(date) {
            const events = this.getEventsForDate(date);
            const modal = document.createElement('div');
            modal.className = 'day-details-modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${date.toLocaleDateString()}</h3>
                        <button class="close-btn">×</button>
                    </div>
                    <div class="events-list">
                        ${events.length > 0 ? 
                            events.map(event => `
                                <div class="event-detail-item">
                                    <div class="event-time">${this.formatTime(event.startTime)}</div>
                                    <div class="event-info">
                                        <div class="event-title">${event.title}</div>
                                        ${event.description ? 
                                            `<div class="event-description">${event.description}</div>` : 
                                            ''}
                                    </div>
                                </div>
                            `).join('') :
                            '<div class="no-events">No events for this day</div>'
                        }
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            modal.querySelector('.close-btn').addEventListener('click', () => {
                modal.remove();
            });
        }

        saveEvents() {
            localStorage.setItem('calendarEvents', JSON.stringify(this.events));
        }

        loadEvents() {
            const stored = localStorage.getItem('calendarEvents');
            if (stored) {
                try {
                    this.events = JSON.parse(stored);
                } catch (error) {
                    console.error('Failed to load events:', error);
                    this.events = [];
                }
            }
            this.render();
        }

        trackEvent(eventName, data = {}) {
            try {
                if (window.performanceMonitoring) {
                    window.performanceMonitoring.recordMetric(`calendar_view_${eventName}`, 1, data);
                }
            } catch (e) { /* Silent fail */ }
        }
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.calendarView = new CalendarView();
        });
    } else {
        window.calendarView = new CalendarView();
    }
})();


