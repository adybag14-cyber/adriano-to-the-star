/**
 * Planet Discovery Event Calendar
 * Calendar view of planet discovery events and milestones
 */

class PlanetDiscoveryEventCalendar {
    constructor() {
        this.events = [];
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        this.init();
    }

    init() {
        this.loadEvents();
        console.log('📅 Event calendar initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_ev_en_tc_al_en_da_r_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    loadEvents() {
        this.events = [
            {
                id: 'event-1',
                title: 'Kepler-186f Discovery Anniversary',
                date: new Date(this.currentYear, 3, 17).toISOString(),
                type: 'anniversary',
                description: 'Anniversary of the discovery of the first Earth-sized planet in the habitable zone'
            },
            {
                id: 'event-2',
                title: 'New Planet Discovery Announcement',
                date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                type: 'discovery',
                description: 'NASA to announce new exoplanet discoveries'
            },
            {
                id: 'event-3',
                title: 'Exoplanet Conference',
                date: new Date(this.currentYear, 5, 15).toISOString(),
                type: 'conference',
                description: 'International exoplanet conference'
            }
        ];
    }

    renderEventCalendar(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        container.innerHTML = `
            <div class="event-calendar-container" style="margin-top: 2rem;">
                <h3 style="color: #ba944f; margin-bottom: 1.5rem; text-align: center;">📅 Event Calendar</h3>
                
                <div style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin-bottom: 2rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <button id="prev-month-btn" style="padding: 0.5rem 1rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 8px; color: #ba944f; cursor: pointer;">
                            ←
                        </button>
                        <h4 id="calendar-month-year" style="color: #ba944f; margin: 0;">
                            ${new Date(this.currentYear, this.currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h4>
                        <button id="next-month-btn" style="padding: 0.5rem 1rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 8px; color: #ba944f; cursor: pointer;">
                            →
                        </button>
                    </div>
                    <div id="calendar-grid" class="calendar-grid" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.5rem;">
                        ${this.renderCalendar()}
                    </div>
                </div>
                
                <div id="upcoming-events" class="upcoming-events" style="display: flex; flex-direction: column; gap: 1rem;">
                    <h4 style="color: #ba944f; margin-bottom: 1rem;">Upcoming Events</h4>
                    ${this.renderUpcomingEvents()}
                </div>
            </div>
        `;

        document.getElementById('prev-month-btn')?.addEventListener('click', () => {
            this.currentMonth--;
            if (this.currentMonth < 0) {
                this.currentMonth = 11;
                this.currentYear--;
            }
            this.renderEventCalendar(containerId);
        });

        document.getElementById('next-month-btn')?.addEventListener('click', () => {
            this.currentMonth++;
            if (this.currentMonth > 11) {
                this.currentMonth = 0;
                this.currentYear++;
            }
            this.renderEventCalendar(containerId);
        });
    }

    renderCalendar() {
        const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
        const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
        const monthEvents = this.getMonthEvents();

        let html = `
            <div style="text-align: center; padding: 0.5rem; font-weight: 600; color: #ba944f;">Sun</div>
            <div style="text-align: center; padding: 0.5rem; font-weight: 600; color: #ba944f;">Mon</div>
            <div style="text-align: center; padding: 0.5rem; font-weight: 600; color: #ba944f;">Tue</div>
            <div style="text-align: center; padding: 0.5rem; font-weight: 600; color: #ba944f;">Wed</div>
            <div style="text-align: center; padding: 0.5rem; font-weight: 600; color: #ba944f;">Thu</div>
            <div style="text-align: center; padding: 0.5rem; font-weight: 600; color: #ba944f;">Fri</div>
            <div style="text-align: center; padding: 0.5rem; font-weight: 600; color: #ba944f;">Sat</div>
        `;

        // Empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            html += `<div style="aspect-ratio: 1; background: rgba(0, 0, 0, 0.3); border-radius: 8px;"></div>`;
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(this.currentYear, this.currentMonth, day);
            const dayEvents = monthEvents.filter(e => {
                const eventDate = new Date(e.date);
                return eventDate.getDate() === day && eventDate.getMonth() === this.currentMonth;
            });

            const isToday = date.toDateString() === new Date().toDateString();
            const hasEvents = dayEvents.length > 0;

            html += `
                <div class="calendar-day" data-day="${day}" style="aspect-ratio: 1; background: ${isToday ? 'rgba(186, 148, 79, 0.3)' : 'rgba(0, 0, 0, 0.3)'}; border: ${isToday ? '2px solid #ba944f' : '1px solid rgba(186, 148, 79, 0.2)'}; border-radius: 8px; padding: 0.5rem; cursor: pointer; position: relative;">
                    <div style="font-weight: ${isToday ? 'bold' : 'normal'}; color: ${isToday ? '#ba944f' : 'rgba(255, 255, 255, 0.9)'};">
                        ${day}
                    </div>
                    ${hasEvents ? `
                        <div style="display: flex; gap: 0.25rem; margin-top: 0.25rem;">
                            ${dayEvents.slice(0, 3).map(e => `
                                <div style="width: 6px; height: 6px; background: #ba944f; border-radius: 50%;"></div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        }

        return html;
    }

    getMonthEvents() {
        return this.events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.getMonth() === this.currentMonth && eventDate.getFullYear() === this.currentYear;
        });
    }

    renderUpcomingEvents() {
        const upcoming = this.events
            .filter(e => new Date(e.date) >= new Date())
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 5);

        if (upcoming.length === 0) {
            return '<p style="opacity: 0.7;">No upcoming events</p>';
        }

        return upcoming.map(event => `
            <div class="event-item" style="background: rgba(0, 0, 0, 0.5); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 10px; padding: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                    <h5 style="color: #ba944f; margin: 0;">${event.title}</h5>
                    <span style="font-size: 0.85rem; opacity: 0.7;">${new Date(event.date).toLocaleDateString()}</span>
                </div>
                <p style="opacity: 0.8; font-size: 0.9rem; margin: 0;">${event.description}</p>
            </div>
        `).join('');
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscoveryEventCalendar = new PlanetDiscoveryEventCalendar();
}

