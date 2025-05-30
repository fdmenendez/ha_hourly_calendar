# Calendar Day View Card for Home Assistant

This is a custom card for Home Assistant that displays calendar events in a daily view similar to Google Calendar.

## Features

- Shows today's events in an hourly view
- Google Calendar-like format
- Displays start and end times for each event
- Responsive and modern design
- Support for multi-hour events

## Installation

1. Copy the `calendar-day-view.js` file to the `www` folder in your Home Assistant installation
   - If the `www` folder doesn't exist, create it in the root of your Home Assistant configuration

2. Add the reference to the card in your `configuration.yaml` file:
```yaml
frontend:
  extra_module_url:
    - /local/calendar-day-view.js
```

3. Restart Home Assistant

## Usage

Add the card to your dashboard using the UI editor or by adding the following code to your dashboard:

```yaml
type: 'custom:calendar-day-view'
entity: calendar.your_calendar
```

Replace `calendar.your_calendar` with your calendar's entity_id in Home Assistant.

## Customization

The card accepts the following configuration options:

- `entity` (required): The entity_id of the calendar you want to display
- `title` (optional): A custom title for the card

## Example

```yaml
type: 'custom:calendar-day-view'
entity: calendar.google_calendar
title: "My Calendar"
``` 