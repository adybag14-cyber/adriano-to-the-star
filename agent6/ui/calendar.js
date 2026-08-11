class Calendar {
  constructor(element) { this.element = element; this.currentDate = new Date(); this.selectedDate = null; this.events = new Map(); this.view = 'month'; }
  setDate(date) { this.currentDate = new Date(date); this.render(); }
  setView(view) { this.view = view; this.render(); }
  selectDate(date) { this.selectedDate = new Date(date); this.render(); if (this.selectCallback) this.selectCallback(this.selectedDate); }
  getSelectedDate() { return this.selectedDate; }
  addEvent(date, event) {
    const dateKey = this.formatDate(date);
    if (!this.events.has(dateKey)) this.events.set(dateKey, []);
    this.events.get(dateKey).push(event);
    this.render();
  }
  removeEvent(date, eventId) {
    const dateKey = this.formatDate(date);
    const events = this.events.get(dateKey);
    if (events) {
      this.events.set(dateKey, events.filter(e => e.id !== eventId));
      this.render();
    }
  }
  getEvents(date) {
    const dateKey = this.formatDate(date);
    return this.events.get(dateKey) || [];
  }
  next() {
    if (this.view === 'month') {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    } else if (this.view === 'week') {
      this.currentDate.setDate(this.currentDate.getDate() + 7);
    } else if (this.view === 'day') {
      this.currentDate.setDate(this.currentDate.getDate() + 1);
    }
    this.render();
  }
  previous() {
    if (this.view === 'month') {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    } else if (this.view === 'week') {
      this.currentDate.setDate(this.currentDate.getDate() - 7);
    } else if (this.view === 'day') {
      this.currentDate.setDate(this.currentDate.getDate() - 1);
    }
    this.render();
  }
  today() { this.currentDate = new Date(); this.render(); }
  onSelect(callback) { this.selectCallback = callback; }
  onEventClick(callback) { this.eventClickCallback = callback; }
  formatDate(date) { return date.toISOString().split('T')[0]; }
  render() {
    if (!this.element) return;
    let html = `<div class="calendar-header">
      <button onclick="this.parentElement.calendar.previous()">‹</button>
      <span class="calendar-title">${this.currentDate.toLocaleDateString()}</span>
      <button onclick="this.parentElement.calendar.next()">›</button>
      <button onclick="this.parentElement.calendar.today()">Today</button>
    </div>`;
    if (this.view === 'month') {
      html += this.renderMonth();
    } else if (this.view === 'week') {
      html += this.renderWeek();
    } else if (this.view === 'day') {
      html += this.renderDay();
    }
    this.element.innerHTML = html;
    this.element.calendar = this;
  }
  renderMonth() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    let html = '<div class="calendar-grid">';
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
      html += `<div class="calendar-header-cell">${day}</div>`;
    });
    for (let i = 0; i < 42; i++) {
      const cellDate = new Date(startDate);
      cellDate.setDate(startDate.getDate() + i);
      const isCurrentMonth = cellDate.getMonth() === month;
      const isToday = this.formatDate(cellDate) === this.formatDate(new Date());
      const isSelected = this.selectedDate && this.formatDate(cellDate) === this.formatDate(this.selectedDate);
      const events = this.getEvents(cellDate);
      html += `<div class="calendar-cell ${isCurrentMonth ? 'current-month' : 'other-month'} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}"
                   onclick="this.parentElement.parentElement.calendar.selectDate('${cellDate.toISOString()}')">`;
      html += `<div class="calendar-date">${cellDate.getDate()}</div>`;
      if (events.length > 0) {
        html += `<div class="calendar-events">${events.length}</div>`;
      }
      html += '</div>';
    }
    html += '</div>';
    return html;
  }
  renderWeek() {
    return '<div class="calendar-week-view">Week view</div>';
  }
  renderDay() {
    return '<div class="calendar-day-view">Day view</div>';
  }
}
window.Calendar = Calendar;