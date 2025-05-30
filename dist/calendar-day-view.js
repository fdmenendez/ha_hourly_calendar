class CalendarDayView extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  setConfig(config) {
    console.log('Calendar Day View: Setting config', config);
    this.config = {
      show_header: true,
      show_time: true,
      event_height: 60,
      event_color: '#4285f4',
      ...config
    };
    this.render();
  }

  async render() {
    console.log('Calendar Day View: Rendering');
    if (!this.config || !this.config.entity) {
      this.shadowRoot.innerHTML = `
        <ha-card>
          <div class="error">Please define a calendar entity</div>
        </ha-card>
      `;
      return;
    }

    try {
      const hours = Array.from({ length: 24 }, (_, i) => i);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      console.log('Calendar Day View: Fetching events for entity', this.config.entity);
      const state = await this.getCalendarEvents();
      console.log('Calendar Day View: Received events', state);

      const events = this.processEvents(state, today);
      console.log('Calendar Day View: Processed events', events);

      this.shadowRoot.innerHTML = `
        <ha-card>
          ${this.config.show_header ? `
            <div class="card-header">
              ${this.config.title || 'Calendar'}
            </div>
          ` : ''}
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
    } catch (error) {
      console.error('Calendar Day View: Error rendering', error);
      this.shadowRoot.innerHTML = `
        <ha-card>
          <div class="error">Error loading calendar: ${error.message}</div>
        </ha-card>
      `;
    }
  }

  async getCalendarEvents() {
    if (!this.hass) {
      throw new Error('Home Assistant instance not available');
    }

    const entity = this.config.entity;
    console.log('Calendar Day View: Requesting events for', entity);
    
    try {
      const state = await this.hass.callWS({
        type: 'calendar/list_events',
        entity_id: entity,
        start_date_time: new Date().toISOString(),
        end_date_time: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
      });
      
      if (!state || !Array.isArray(state)) {
        console.warn('Calendar Day View: No events received or invalid response', state);
        return [];
      }
      
      return state;
    } catch (error) {
      console.error('Calendar Day View: Error fetching events', error);
      throw new Error(`Failed to fetch calendar events: ${error.message}`);
    }
  }

  processEvents(state, today) {
    if (!state || !Array.isArray(state)) {
      console.warn('Calendar Day View: Invalid state received', state);
      return [];
    }

    return state.map(event => {
      try {
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
      } catch (error) {
        console.error('Calendar Day View: Error processing event', event, error);
        return null;
      }
    }).filter(event => {
      if (!event) return false;
      try {
        const eventDate = new Date(event.start);
        return eventDate.toDateString() === today.toDateString();
      } catch (error) {
        console.error('Calendar Day View: Error filtering event', event, error);
        return false;
      }
    });
  }

  renderEventsForHour(events, hour) {
    if (!events || !Array.isArray(events)) {
      console.warn('Calendar Day View: Invalid events array', events);
      return '';
    }

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
          ${this.config.show_time ? `
            <div class="event-time">${this.formatTime(event.start)} - ${this.formatTime(event.end)}</div>
          ` : ''}
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
    return event.color || this.config.event_color;
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
      .card-header {
        padding: 16px;
        font-size: 1.2em;
        font-weight: 500;
        border-bottom: 1px solid var(--divider-color);
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
        height: ${this.config.event_height}px;
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
    console.log('Calendar Day View: Setting hass instance');
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