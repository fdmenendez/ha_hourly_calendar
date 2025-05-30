# Calendar Day View

This is a custom card for Home Assistant that displays calendar events in a daily view similar to Google Calendar.

## Features

- Shows today's events in an hourly view
- Google Calendar-like format
- Displays start and end times for each event
- Responsive and modern design
- Support for multi-hour events

## Installation

1. Install this repository using HACS
2. Add the card to your dashboard using the UI editor or by adding the following code to your dashboard:

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