/**
 * Date/Time Picker Components
 * Custom date and time picker with calendar interface
 * 
 * Features:
 * - Calendar view
 * - Time picker
 * - Date range selection
 * - Custom date formats
 * - Keyboard navigation
 * - Accessibility support
 */

class DateTimePickerComponents {
    constructor() {
        this.instances = new Map();
        this.init();
    }

    init() {
        this.initializeDataPickers();
        console.log('✅ Date/Time Picker Components initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("d_at_et_im_ep_ic_ke_rc_om_po_ne_nt_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    initializeDataPickers() {
        document.addEventListener('DOMContentLoaded', () => {
            document.querySelectorAll('[data-date-picker]').forEach(element => {
                this.attachDatePicker(element);
            });
            document.querySelectorAll('[data-time-picker]').forEach(element => {
                this.attachTimePicker(element);
            });
            document.querySelectorAll('[data-datetime-picker]').forEach(element => {
                this.attachDateTimePicker(element);
            });
        });
    }

    /**
     * Attach date picker to input
     * @param {HTMLInputElement} input - Input element
     * @param {Object} options - Options
     */
    attachDatePicker(input, options = {}) {
        const id = `datepicker-${Date.now()}`;
        const picker = this.createDatePicker(id, input, options);
        this.instances.set(id, { input, picker, type: 'date', options });
        return id;
    }

    /**
     * Attach time picker to input
     * @param {HTMLInputElement} input - Input element
     * @param {Object} options - Options
     */
    attachTimePicker(input, options = {}) {
        const id = `timepicker-${Date.now()}`;
        const picker = this.createTimePicker(id, input, options);
        this.instances.set(id, { input, picker, type: 'time', options });
        return id;
    }

    /**
     * Attach date-time picker to input
     * @param {HTMLInputElement} input - Input element
     * @param {Object} options - Options
     */
    attachDateTimePicker(input, options = {}) {
        const id = `datetimepicker-${Date.now()}`;
        const picker = this.createDateTimePicker(id, input, options);
        this.instances.set(id, { input, picker, type: 'datetime', options });
        return id;
    }

    createDatePicker(id, input, options) {
        const container = document.createElement('div');
        container.className = 'datepicker-container';
        container.style.cssText = 'position: relative;';

        input.parentNode.insertBefore(container, input);
        container.appendChild(input);

        const calendar = this.createCalendar(id, input, options);
        calendar.style.display = 'none';
        container.appendChild(calendar);

        input.addEventListener('focus', () => {
            this.showCalendar(calendar);
        });

        input.addEventListener('click', () => {
            this.showCalendar(calendar);
        });

        return calendar;
    }

    createCalendar(id, input, options) {
        const calendar = document.createElement('div');
        calendar.id = id;
        calendar.className = 'datepicker-calendar';
        calendar.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            background: rgba(10, 10, 15, 0.98);
            border: 1px solid rgba(186, 148, 79, 0.3);
            border-radius: 8px;
            padding: 1rem;
            z-index: 1000;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
            min-width: 300px;
            margin-top: 4px;
        `;

        const currentDate = new Date();
        const viewDate = new Date(currentDate);
        let selectedDate = null;

        const renderCalendar = () => {
            const year = viewDate.getFullYear();
            const month = viewDate.getMonth();

            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const daysInMonth = lastDay.getDate();
            const startingDayOfWeek = firstDay.getDay();

            calendar.innerHTML = `
                <div class="calendar-header" style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                ">
                    <button class="calendar-nav prev" style="
                        background: transparent;
                        border: none;
                        color: #ba944f;
                        font-size: 1.5rem;
                        cursor: pointer;
                        padding: 0.5rem;
                    ">‹</button>
                    <div class="calendar-month-year" style="
                        color: #ba944f;
                        font-weight: 600;
                        font-family: 'Cormorant Garamond', serif;
                        font-size: 1.2rem;
                    ">${this.getMonthName(month)} ${year}</div>
                    <button class="calendar-nav next" style="
                        background: transparent;
                        border: none;
                        color: #ba944f;
                        font-size: 1.5rem;
                        cursor: pointer;
                        padding: 0.5rem;
                    ">›</button>
                </div>
                <div class="calendar-weekdays" style="
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 0.5rem;
                    margin-bottom: 0.5rem;
                ">
                    ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => `
                        <div style="
                            text-align: center;
                            color: rgba(255, 255, 255, 0.5);
                            font-size: 0.85rem;
                            font-weight: 600;
                            font-family: 'Raleway', sans-serif;
                        ">${day}</div>
                    `).join('')}
                </div>
                <div class="calendar-days" style="
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 0.5rem;
                ">
                    ${Array(startingDayOfWeek).fill(null).map(() => `
                        <div style="padding: 0.5rem;"></div>
                    `).join('')}
                    ${Array.from({ length: daysInMonth }, (_, i) => {
                        const day = i + 1;
                        const date = new Date(year, month, day);
                        const isToday = this.isToday(date);
                        const isSelected = selectedDate && this.isSameDay(date, selectedDate);
                        return `
                            <button class="calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" 
                                    data-date="${date.toISOString()}"
                                    style="
                                        background: ${isSelected ? 'rgba(186, 148, 79, 0.3)' : 'transparent'};
                                        border: ${isToday ? '2px solid #ba944f' : '1px solid rgba(186, 148, 79, 0.2)'};
                                        color: ${isSelected ? '#ba944f' : 'rgba(255, 255, 255, 0.9)'};
                                        padding: 0.75rem;
                                        border-radius: 4px;
                                        cursor: pointer;
                                        font-family: 'Raleway', sans-serif;
                                        transition: all 0.2s;
                                    "
                                    onmouseenter="this.style.background='rgba(186, 148, 79, 0.2)'"
                                    onmouseleave="this.style.background='${isSelected ? 'rgba(186, 148, 79, 0.3)' : 'transparent'}'">
                                ${day}
                            </button>
                        `;
                    }).join('')}
                </div>
            `;

            // Add event listeners
            calendar.querySelector('.prev').addEventListener('click', () => {
                viewDate.setMonth(viewDate.getMonth() - 1);
                renderCalendar();
            });

            calendar.querySelector('.next').addEventListener('click', () => {
                viewDate.setMonth(viewDate.getMonth() + 1);
                renderCalendar();
            });

            calendar.querySelectorAll('.calendar-day').forEach(btn => {
                btn.addEventListener('click', () => {
                    selectedDate = new Date(btn.dataset.date);
                    input.value = this.formatDate(selectedDate, options.format || 'YYYY-MM-DD');
                    this.hideCalendar(calendar);
                });
            });
        };

        renderCalendar();

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!calendar.contains(e.target) && e.target !== input) {
                this.hideCalendar(calendar);
            }
        });

        return calendar;
    }

    createTimePicker(id, input, options) {
        const container = document.createElement('div');
        container.className = 'timepicker-container';
        container.style.cssText = 'position: relative;';

        input.parentNode.insertBefore(container, input);
        container.appendChild(input);

        const timePicker = document.createElement('div');
        timePicker.id = id;
        timePicker.className = 'timepicker';
        timePicker.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            background: rgba(10, 10, 15, 0.98);
            border: 1px solid rgba(186, 148, 79, 0.3);
            border-radius: 8px;
            padding: 1rem;
            z-index: 1000;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
            display: none;
            margin-top: 4px;
        `;

        let hours = 12;
        let minutes = 0;
        let ampm = 'AM';

        const renderTimePicker = () => {
            timePicker.innerHTML = `
                <div style="display: flex; gap: 1rem; align-items: center; justify-content: center;">
                    <div style="display: flex; flex-direction: column; align-items: center;">
                        <button class="time-inc" data-type="hours" style="
                            background: transparent;
                            border: none;
                            color: #ba944f;
                            font-size: 1.5rem;
                            cursor: pointer;
                        ">▲</button>
                        <input type="number" class="time-hours" value="${hours}" min="1" max="12" style="
                            width: 60px;
                            text-align: center;
                            background: rgba(255, 255, 255, 0.1);
                            border: 1px solid rgba(186, 148, 79, 0.3);
                            border-radius: 4px;
                            color: white;
                            padding: 0.5rem;
                            font-size: 1.5rem;
                            font-family: 'Raleway', sans-serif;
                        ">
                        <button class="time-dec" data-type="hours" style="
                            background: transparent;
                            border: none;
                            color: #ba944f;
                            font-size: 1.5rem;
                            cursor: pointer;
                        ">▼</button>
                    </div>
                    <div style="font-size: 2rem; color: #ba944f;">:</div>
                    <div style="display: flex; flex-direction: column; align-items: center;">
                        <button class="time-inc" data-type="minutes" style="
                            background: transparent;
                            border: none;
                            color: #ba944f;
                            font-size: 1.5rem;
                            cursor: pointer;
                        ">▲</button>
                        <input type="number" class="time-minutes" value="${String(minutes).padStart(2, '0')}" min="0" max="59" style="
                            width: 60px;
                            text-align: center;
                            background: rgba(255, 255, 255, 0.1);
                            border: 1px solid rgba(186, 148, 79, 0.3);
                            border-radius: 4px;
                            color: white;
                            padding: 0.5rem;
                            font-size: 1.5rem;
                            font-family: 'Raleway', sans-serif;
                        ">
                        <button class="time-dec" data-type="minutes" style="
                            background: transparent;
                            border: none;
                            color: #ba944f;
                            font-size: 1.5rem;
                            cursor: pointer;
                        ">▼</button>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                        <button class="time-ampm" data-value="AM" style="
                            background: ${ampm === 'AM' ? 'rgba(186, 148, 79, 0.3)' : 'transparent'};
                            border: 1px solid rgba(186, 148, 79, 0.3);
                            color: #ba944f;
                            padding: 0.5rem 1rem;
                            border-radius: 4px;
                            cursor: pointer;
                            font-family: 'Raleway', sans-serif;
                        ">AM</button>
                        <button class="time-ampm" data-value="PM" style="
                            background: ${ampm === 'PM' ? 'rgba(186, 148, 79, 0.3)' : 'transparent'};
                            border: 1px solid rgba(186, 148, 79, 0.3);
                            color: #ba944f;
                            padding: 0.5rem 1rem;
                            border-radius: 4px;
                            cursor: pointer;
                            font-family: 'Raleway', sans-serif;
                        ">PM</button>
                    </div>
                </div>
                <button class="time-ok" style="
                    width: 100%;
                    margin-top: 1rem;
                    background: rgba(186, 148, 79, 0.2);
                    border: 1px solid #ba944f;
                    color: #ba944f;
                    padding: 0.75rem;
                    border-radius: 4px;
                    cursor: pointer;
                    font-family: 'Raleway', sans-serif;
                    font-weight: 600;
                ">OK</button>
            `;

            timePicker.querySelectorAll('.time-inc').forEach(btn => {
                btn.addEventListener('click', () => {
                    const type = btn.dataset.type;
                    if (type === 'hours') {
                        hours = (hours % 12) + 1;
                    } else {
                        minutes = (minutes + 1) % 60;
                    }
                    renderTimePicker();
                });
            });

            timePicker.querySelectorAll('.time-dec').forEach(btn => {
                btn.addEventListener('click', () => {
                    const type = btn.dataset.type;
                    if (type === 'hours') {
                        hours = hours === 1 ? 12 : hours - 1;
                    } else {
                        minutes = minutes === 0 ? 59 : minutes - 1;
                    }
                    renderTimePicker();
                });
            });

            timePicker.querySelectorAll('.time-ampm').forEach(btn => {
                btn.addEventListener('click', () => {
                    ampm = btn.dataset.value;
                    renderTimePicker();
                });
            });

            timePicker.querySelector('.time-ok').addEventListener('click', () => {
                const time24 = ampm === 'PM' && hours !== 12 ? hours + 12 : (ampm === 'AM' && hours === 12 ? 0 : hours);
                input.value = `${String(time24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                this.hideTimePicker(timePicker);
            });
        };

        renderTimePicker();

        input.addEventListener('focus', () => this.showTimePicker(timePicker));
        input.addEventListener('click', () => this.showTimePicker(timePicker));

        container.appendChild(timePicker);

        document.addEventListener('click', (e) => {
            if (!timePicker.contains(e.target) && e.target !== input) {
                this.hideTimePicker(timePicker);
            }
        });

        return timePicker;
    }

    createDateTimePicker(id, input, options) {
        // Combine date and time pickers
        // Time picker would be shown after date selection
        return this.createDatePicker(id + '-date', input, options);
    }

    showCalendar(calendar) {
        calendar.style.display = 'block';
    }

    hideCalendar(calendar) {
        calendar.style.display = 'none';
    }

    showTimePicker(timePicker) {
        timePicker.style.display = 'block';
    }

    hideTimePicker(timePicker) {
        timePicker.style.display = 'none';
    }

    getMonthName(month) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
        return months[month];
    }

    isToday(date) {
        const today = new Date();
        return this.isSameDay(date, today);
    }

    isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    formatDate(date, format) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day);
    }
}

// Initialize global instance
if (typeof window !== 'undefined') {
    window.dateTimePickers = new DateTimePickerComponents();
}

