class CalendarDayView extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  setConfig(config) {
    this.config = config;
    this.render();
  }

  async render() {
    if (!this.config || !this.config.entity) {
      this.shadowRoot.innerHTML = `
        <ha-card>
          <div class="error">Please define a calendar entity</div>
        </ha-card>
      `;
      return;
    }

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const state = await this.getCalendarEvents();
    const events = this.processEvents(state, today);

    this.shadowRoot.innerHTML = `
      <ha-card>
        <div class="calendar-container">
          <div class="header">
            <div class="time-column"></div>
            <div class="events-column">
              <div class="date-header">${today.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
            </div>
          </div>
          <div class="calendar-body">
            ${hours.map(hour => `
              <div class="hour-row">
                <div class="time-column">
                  <div class="hour-label">${hour.toString().padStart(2, '0')}:00</div>
                </div>
                <div class="events-column">
                  ${this.renderEventsForHour(events, hour)}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </ha-card>
    `;

    this.applyStyles();
  }

  async getCalendarEvents() {
    const entity = this.config.entity;
    const state = await this.hass.callWS({
      type: 'calendar/list_events',
      entity_id: entity,
      start_date_time: new Date().toISOString(),
      end_date_time: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
    });
    return state;
  }

  processEvents(state, today) {
    return state.map(event => {
      const start = new Date(event.start.dateTime || event.start.date);
      const end = new Date(event.end.dateTime || event.end.date);
      return {
        ...event,
        start,
        end,
        startHour: start.getHours(),
        endHour: end.getHours(),
        startMinutes: start.getMinutes(),
        endMinutes: end.getMinutes(),
      };
    }).filter(event => {
      const eventDate = new Date(event.start);
      return eventDate.toDateString() === today.toDateString();
    });
  }

  renderEventsForHour(events, hour) {
    const hourEvents = events.filter(event => 
      (event.startHour === hour) || 
      (event.startHour < hour && event.endHour > hour)
    );

    return hourEvents.map(event => `
      <div class="event" style="
        top: ${event.startHour === hour ? (event.startMinutes / 60) * 100 : 0}%;
        height: ${this.calculateEventHeight(event, hour)}%;
        background-color: ${this.getEventColor(event)};">
        <div class="event-content">
          <div class="event-time">${this.formatTime(event.start)} - ${this.formatTime(event.end)}</div>
          <div class="event-title">${event.summary}</div>
        </div>
      </div>
    `).join('');
  }

  calculateEventHeight(event, currentHour) {
    if (event.startHour === currentHour) {
      const minutesInHour = 60;
      const startMinutes = event.startMinutes;
      const endMinutes = event.endHour === currentHour ? event.endMinutes : 60;
      return ((endMinutes - startMinutes) / minutesInHour) * 100;
    }
    return 100;
  }

  getEventColor(event) {
    return event.color || '#4285f4';
  }

  formatTime(date) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  applyStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .calendar-container {
        padding: 16px;
      }
      .header {
        display: flex;
        border-bottom: 1px solid #e0e0e0;
        padding-bottom: 8px;
        margin-bottom: 8px;
      }
      .date-header {
        font-size: 1.2em;
        font-weight: 500;
        text-transform: capitalize;
      }
      .calendar-body {
        position: relative;
      }
      .hour-row {
        display: flex;
        height: 60px;
        border-bottom: 1px solid #f0f0f0;
      }
      .time-column {
        width: 60px;
        padding-right: 8px;
        text-align: right;
        color: #666;
      }
      .events-column {
        flex: 1;
        position: relative;
        padding-left: 8px;
      }
      .hour-label {
        font-size: 0.8em;
        margin-top: -8px;
      }
      .event {
        position: absolute;
        left: 0;
        right: 0;
        margin: 0 4px;
        border-radius: 4px;
        padding: 4px;
        color: white;
        overflow: hidden;
        font-size: 0.9em;
      }
      .event-content {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .event-time {
        font-size: 0.8em;
        opacity: 0.9;
      }
      .event-title {
        font-weight: 500;
      }
      .error {
        padding: 16px;
        color: red;
      }
    `;
    this.shadowRoot.appendChild(style);
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }
}

customElements.define('calendar-day-view', CalendarDayView);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'calendar-day-view',
  name: 'Calendar Day View',
  description: 'A custom card that shows calendar events in a day view format',
}); 