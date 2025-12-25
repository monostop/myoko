// Static resort configuration (never changes)
export interface ResortConfig {
  id: string
  name: string
  nameJp: string
  driveMinutes: number
  baseElevation: number
  summitElevation: number
  latitude: number
  longitude: number
  liftsTotal: number
  slopesTotal: number
  terrain: { beginner: number; intermediate: number; advanced: number }
  notes?: string
  websiteUrl: string
  liftStatusUrl?: string
  trailMapImage?: string | null
}

// Weather data from Open-Meteo (auto-fetched)
export interface WeatherForecast {
  date: string
  snowfall24h: number
  temperatureMin: number
  temperatureMax: number
  precipitationProbability: number
  weatherCode: number
  windSpeed: number
  fetchedAt: string
}

// Manual input data (user enters daily)
export type ResortStatus = 'OPEN' | 'PARTIAL' | 'CLOSED' | 'UNKNOWN'

export interface ManualResortData {
  status: ResortStatus
  baseDepthCm: number | null
  liftsOpen: number | null
  slopesOpen: number | null
  notes: string
  updatedAt: string
}

// Config overrides (user can customize static resort data)
export interface ConfigOverride {
  terrain?: { beginner: number; intermediate: number; advanced: number }
  driveMinutes?: number
  notes?: string
}

// Combined resort state for display
export interface ResortState {
  config: ResortConfig
  weather: WeatherForecast | null
  manual: ManualResortData
}
