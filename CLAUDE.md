# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server (Vite)
npm run build      # TypeScript compile + Vite build
npm run lint       # ESLint
npm run preview    # Preview production build
```

There are no tests in this project.

## Environment

Requires a `.env` file with:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Architecture

React 18 + TypeScript SPA built with Vite. Backend is entirely Supabase (PostgreSQL + Auth). No custom backend.

**Auth flow:** `AuthProvider` (context) wraps the app and manages Supabase session state. `AuthGuard` protects `/dashboard` — unauthenticated users are redirected to `/` (login). The app also has an `/access-denied` page.

**Data flow:** `useWeatherData` hook fetches from the `weather_data` Supabase table. It first tries the `get_available_years` RPC function; if unavailable, falls back to iterating years 2020–2030. Weather data is fetched month-by-month for the selected year, then aggregated client-side into `WeatherStats[]`. Data auto-refreshes every 60 minutes via `setInterval`.

**Data processing:** Raw rows contain `obs_timestamp` and `local_day_rain_accumulation`. The hook computes the daily maximum accumulation per day (the column resets daily, so the max value = that day's total rainfall), then aggregates into monthly stats: total days with data, rainy days (>0 mm), total mm, and rain percentage.

**Key types** (`src/types/weather.ts`):
- `WeatherData` — raw monthly aggregates from DB
- `WeatherStats` — extends `WeatherData` with computed `rain_percentage`

## UI Conventions

- Tailwind CSS only — do not add UI libraries
- Icons from `lucide-react` only — do not add icon packages
- Glassmorphism style: `bg-white/80 backdrop-blur-sm` cards on gradient backgrounds
- No unit tests; no test framework configured
