# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun run dev      # Start dev server (localhost:5173)
bun run build    # Type-check and build for production
bun run lint     # Run ESLint
bun run preview  # Preview production build
```

## Architecture

This is a **Myoko Ski Day Planner** - a React dashboard for comparing ski resort conditions in the Myoko/Nagano region of Japan.

### Data Flow

```
Open-Meteo API → useResortData hook → ResortTable component
                       ↑
localStorage ←→ Manual input (status, base depth, lifts)
```

### Key Files

- `src/data/resorts.ts` - Static resort configuration (coordinates, elevations, lift counts)
- `src/lib/weather-api.ts` - Open-Meteo API client with 1-hour caching
- `src/hooks/useResortData.ts` - Main data hook combining weather + manual data
- `src/components/ResortTable.tsx` - Main comparison table
- `src/components/ManualInputDialog.tsx` - Form for editing resort conditions

### Data Sources

**Auto-fetched (Open-Meteo):** Snowfall forecast, temperature, weather conditions
**Manual input (localStorage):** Resort status (OPEN/PARTIAL/CLOSED), base depth, lifts open

### Key Types (`src/types/index.ts`)

- `ResortConfig` - Static resort data (coordinates, elevations, lift counts)
- `WeatherForecast` - Weather data from Open-Meteo
- `ManualResortData` - User-entered daily conditions
- `ResortState` - Combined view model for display

### Tech Stack

- Vite + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Path alias: `@/` → `src/`
- Deployed to GitHub Pages (base URL: `/myoko/`)

### Assets

Trail map images are stored in `public/maps/` and referenced via `import.meta.env.BASE_URL`.
