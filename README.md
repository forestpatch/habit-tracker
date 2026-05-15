# Habit Garden

A private, offline-first habit tracker for building consistent daily routines. It runs entirely in the browser with no account, server, build step, or external dependency.

## Features

- Create, edit, complete, search, filter, and delete habits
- Daily, weekday, and weekend schedules
- Current streak and total-completion calculations
- Seven-day progress chart and weekly consistency score
- Automatic local persistence through `localStorage`
- Light and dark themes
- Validated JSON backup import and export
- Responsive and keyboard-accessible interface

## Run locally

Open `index.html` in a modern browser. For a local HTTP server, run:

```bash
python -m http.server 8080
```

Then visit `http://localhost:8080`.

## Project structure

```text
habit-tracker/
├── index.html   # Semantic application markup
├── styles.css   # Responsive themes and components
└── app.js       # State, persistence, streaks, and analytics
```

## Privacy

Habit data stays in the current browser profile. The application does not send analytics or personal data to a server. Use **Export** to create a local JSON backup before clearing browser storage.

## Browser support

Habit Garden targets current versions of Chrome, Edge, Firefox, and Safari.
