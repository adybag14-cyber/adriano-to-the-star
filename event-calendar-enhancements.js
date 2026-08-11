/**
 * Event Calendar Enhancements
 * Adds: User-created events, event reminders, more event sources
 */

class EventCalendarEnhancements {
    constructor(eventCalendar) {
        this.eventCalendar = eventCalendar;
        this.supabase = window.supabaseClient;
        this.currentUser = null;
        this.userEvents = [];
        this.reminders = [];
    }

    async init() {
        // Get current user
        if (window.authManager) {
            this.currentUser = window.authManager.getCurrentUser();
        } else if (this.supabase) {
            const { data: { user } } = await this.supabase.auth.getUser();
            this.currentUser = user;
        }

        if (this.currentUser) {
            await this.loadUserEvents();
            await this.loadReminders();
            this.setupEventListeners();
        }
        this.trackEvent('event_calendar_enh_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`event_calendar_enh_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    /**
     * Load user-created events
     */
    async loadUserEvents() {
        if (!this.currentUser || !this.supabase) return;

        try {
            const { data, error } = await this.supabase
                .from('user_events')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .order('event_date', { ascending: true });

            if (error) throw error;

            this.userEvents = (data || []).map(event => ({
                id: `user-${event.id}`,
                title: event.title,
                date: new Date(event.event_date),
                type: 'user',
                description: event.description || '',
                color: event.color || '#ba944f',
                reminder: event.reminder || false,
                reminder_time: event.reminder_time ? new Date(event.reminder_time) : null
            }));

            // Add to calendar events
            this.eventCalendar.events = [...this.eventCalendar.events, ...this.userEvents];
            this.eventCalendar.renderCalendar();
        } catch (error) {
            console.error('Error loading user events:', error);
        }
    }

    /**
     * Create new user event
     */
    async createEvent(title, date, description = '', color = '#ba944f', reminder = false, reminderTime = null) {
        if (!this.currentUser || !this.supabase) {
            // Fallback to localStorage
            return this.createEventLocal(title, date, description, color, reminder, reminderTime);
        }

        try {
            const { data, error } = await this.supabase
                .from('user_events')
                .insert({
                    user_id: this.currentUser.id,
                    title: title,
                    event_date: date.toISOString(),
                    description: description,
                    color: color,
                    reminder: reminder,
                    reminder_time: reminderTime ? reminderTime.toISOString() : null
                })
                .select()
                .single();

            if (error) throw error;

            // Add to local events
            const newEvent = {
                id: `user-${data.id}`,
                title: data.title,
                date: new Date(data.event_date),
                type: 'user',
                description: data.description || '',
                color: data.color || '#ba944f',
                reminder: data.reminder || false,
                reminder_time: data.reminder_time ? new Date(data.reminder_time) : null
            };

            this.userEvents.push(newEvent);
            this.eventCalendar.events.push(newEvent);
            this.eventCalendar.renderCalendar();

            // Setup reminder if needed
            if (reminder && reminderTime) {
                this.setupReminder(newEvent);
            }

            return data;
        } catch (error) {
            console.error('Error creating event:', error);
            return this.createEventLocal(title, date, description, color, reminder, reminderTime);
        }
    }

    /**
     * Create event in localStorage (fallback)
     */
    createEventLocal(title, date, description, color, reminder, reminderTime) {
        const eventId = `user-${Date.now()}`;
        const event = {
            id: eventId,
            title: title,
            date: date,
            type: 'user',
            description: description,
            color: color,
            reminder: reminder,
            reminder_time: reminderTime
        };

        // Save to localStorage
        const stored = JSON.parse(localStorage.getItem('user_events') || '[]');
        stored.push({
            id: eventId,
            title: title,
            event_date: date.toISOString(),
            description: description,
            color: color,
            reminder: reminder,
            reminder_time: reminderTime ? reminderTime.toISOString() : null
        });
        localStorage.setItem('user_events', JSON.stringify(stored));

        this.userEvents.push(event);
        this.eventCalendar.events.push(event);
        this.eventCalendar.renderCalendar();

        if (reminder && reminderTime) {
            this.setupReminder(event);
        }

        return event;
    }

    /**
     * Delete user event
     */
    async deleteEvent(eventId) {
        if (!eventId.startsWith('user-')) return; // Only user events

        const dbId = eventId.replace('user-', '');

        if (this.currentUser && this.supabase) {
            try {
                const { error } = await this.supabase
                    .from('user_events')
                    .delete()
                    .eq('id', dbId)
                    .eq('user_id', this.currentUser.id);

                if (error) throw error;
            } catch (error) {
                console.error('Error deleting event:', error);
            }
        }

        // Remove from localStorage
        const stored = JSON.parse(localStorage.getItem('user_events') || '[]');
        const filtered = stored.filter(e => e.id !== dbId);
        localStorage.setItem('user_events', JSON.stringify(filtered));

        // Remove from arrays
        this.userEvents = this.userEvents.filter(e => e.id !== eventId);
        this.eventCalendar.events = this.eventCalendar.events.filter(e => e.id !== eventId);
        this.eventCalendar.renderCalendar();
    }

    /**
     * Load reminders
     */
    async loadReminders() {
        if (!this.currentUser) return;

        // Get all events with reminders
        const eventsWithReminders = [...this.userEvents, ...this.eventCalendar.events]
            .filter(e => e.reminder && e.reminder_time);

        this.reminders = eventsWithReminders.map(event => ({
            event: event,
            reminderTime: event.reminder_time,
            notified: false
        }));

        // Setup reminders
        this.reminders.forEach(reminder => {
            this.setupReminder(reminder.event);
        });
    }

    /**
     * Setup reminder for event
     */
    setupReminder(event) {
        if (!event.reminder || !event.reminder_time) return;

        const now = new Date();
        const reminderTime = new Date(event.reminder_time);
        const timeUntil = reminderTime - now;

        if (timeUntil <= 0) {
            // Already past, show immediately
            this.showReminder(event);
            return;
        }

        // Schedule reminder
        setTimeout(() => {
            this.showReminder(event);
        }, timeUntil);
    }

    /**
     * Show reminder notification
     */
    showReminder(event) {
        // Browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`Event Reminder: ${event.title}`, {
                body: event.description || `Event scheduled for ${event.date.toLocaleString()}`,
                icon: './images/icon-192x192.png',
                badge: './images/icon-192x192.png',
                tag: `event-reminder-${event.id}`,
                requireInteraction: false
            });
        }

        // In-app notification
        if (window.databaseAdvancedFeatures && window.databaseAdvancedFeatures.showNotification) {
            window.databaseAdvancedFeatures.showNotification(
                `🔔 Reminder: ${event.title} - ${event.date.toLocaleString()}`,
                'info'
            );
        }
    }

    /**
     * Setup event listeners for UI
     */
    setupEventListeners() {
        // Add "Create Event" button to calendar header
        const calendarHeader = document.querySelector('.calendar-header');
        if (calendarHeader && !document.getElementById('create-event-btn')) {
            const createBtn = document.createElement('button');
            createBtn.id = 'create-event-btn';
            createBtn.className = 'view-btn';
            createBtn.textContent = '+ Create Event';
            createBtn.addEventListener('click', () => this.showCreateEventDialog());
            calendarHeader.querySelector('.calendar-controls').appendChild(createBtn);
        }
    }

    /**
     * Show create event dialog
     */
    showCreateEventDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'event-dialog-overlay';
        dialog.innerHTML = `
            <div class="event-dialog">
                <h3>Create New Event</h3>
                <form id="create-event-form">
                    <div class="form-group">
                        <label>Title</label>
                        <input type="text" id="event-title" required>
                    </div>
                    <div class="form-group">
                        <label>Date & Time</label>
                        <input type="datetime-local" id="event-date" required>
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea id="event-description" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Color</label>
                        <input type="color" id="event-color" value="#ba944f">
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="event-reminder">
                            Set Reminder
                        </label>
                    </div>
                    <div class="form-group" id="reminder-time-group" style="display: none;">
                        <label>Reminder Time</label>
                        <input type="datetime-local" id="event-reminder-time">
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="cta-button">Create Event</button>
                        <button type="button" class="outline-btn" onclick="this.closest('.event-dialog-overlay').remove()">Cancel</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(dialog);

        // Show/hide reminder time based on checkbox
        document.getElementById('event-reminder').addEventListener('change', (e) => {
            document.getElementById('reminder-time-group').style.display = e.target.checked ? 'block' : 'none';
        });

        // Handle form submission
        document.getElementById('create-event-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('event-title').value;
            const date = new Date(document.getElementById('event-date').value);
            const description = document.getElementById('event-description').value;
            const color = document.getElementById('event-color').value;
            const reminder = document.getElementById('event-reminder').checked;
            const reminderTime = reminder && document.getElementById('event-reminder-time').value
                ? new Date(document.getElementById('event-reminder-time').value)
                : null;

            await this.createEvent(title, date, description, color, reminder, reminderTime);
            dialog.remove();

            if (window.databaseAdvancedFeatures && window.databaseAdvancedFeatures.showNotification) {
                window.databaseAdvancedFeatures.showNotification('Event created successfully!', 'success');
            }
        });
    }

    /**
     * Add more event sources
     */
    async loadAdditionalEventSources() {
        if (!this.eventCalendar.spaceAPI) return;

        try {
            // Add ESA events (if API available)
            // Add NASA events (if API available)
            // Add other space agency events

            // For now, we'll enhance existing sources
            const additionalEvents = await this.eventCalendar.spaceAPI.getAllSpaceNews(20);
            // Process and add to calendar
        } catch (error) {
            console.error('Error loading additional event sources:', error);
        }
    }
}

// Export
if (typeof window !== 'undefined') {
    window.EventCalendarEnhancements = EventCalendarEnhancements;
}

