import type { WeatherForecast, ResortConfig } from '@/types'

const CACHE_DURATION_MS = 60 * 60 * 1000 // 1 hour

interface OpenMeteoResponse {
  daily: {
    time: string[]
    snowfall_sum: number[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    precipitation_probability_max: number[]
    weather_code: number[]
    wind_speed_10m_max: number[]
  }
}

interface OpenMeteoHourlyResponse {
  hourly: {
    time: string[]
    temperature_2m: number[]
    snowfall: number[]
    weather_code: number[]
  }
}

export interface PeriodForecast {
  period: 'AM' | 'PM' | 'night'
  date: string
  weatherCode: number
  snowfall: number
  temperature: number
}

export interface DayForecast {
  date: string
  dayName: string
  periods: PeriodForecast[]
}

interface CachedWeather {
  data: WeatherForecast[]
  fetchedAt: number
}

function getCacheKey(resortId: string): string {
  return `weather-cache-${resortId}`
}

function getCachedWeather(resortId: string): WeatherForecast[] | null {
  try {
    const cached = localStorage.getItem(getCacheKey(resortId))
    if (!cached) return null

    const parsed: CachedWeather = JSON.parse(cached)
    const now = Date.now()

    if (now - parsed.fetchedAt > CACHE_DURATION_MS) {
      localStorage.removeItem(getCacheKey(resortId))
      return null
    }

    return parsed.data
  } catch {
    return null
  }
}

function setCachedWeather(resortId: string, data: WeatherForecast[]): void {
  const cached: CachedWeather = {
    data,
    fetchedAt: Date.now(),
  }
  localStorage.setItem(getCacheKey(resortId), JSON.stringify(cached))
}

export async function fetchWeatherForResort(
  resort: ResortConfig
): Promise<WeatherForecast[]> {
  // Check cache first
  const cached = getCachedWeather(resort.id)
  if (cached) return cached

  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', resort.latitude.toString())
  url.searchParams.set('longitude', resort.longitude.toString())
  url.searchParams.set(
    'daily',
    'snowfall_sum,temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code,wind_speed_10m_max'
  )
  url.searchParams.set('timezone', 'Asia/Tokyo')
  url.searchParams.set('forecast_days', '7')

  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error(`Failed to fetch weather: ${response.statusText}`)
  }

  const data: OpenMeteoResponse = await response.json()
  const fetchedAt = new Date().toISOString()

  const forecasts: WeatherForecast[] = data.daily.time.map((date, i) => ({
    date,
    snowfall24h: data.daily.snowfall_sum[i] ?? 0,
    temperatureMax: data.daily.temperature_2m_max[i] ?? 0,
    temperatureMin: data.daily.temperature_2m_min[i] ?? 0,
    precipitationProbability: data.daily.precipitation_probability_max[i] ?? 0,
    weatherCode: data.daily.weather_code[i] ?? 0,
    windSpeed: data.daily.wind_speed_10m_max[i] ?? 0,
    fetchedAt,
  }))

  // Cache the results
  setCachedWeather(resort.id, forecasts)

  return forecasts
}

export async function fetchWeatherForAllResorts(
  resorts: ResortConfig[]
): Promise<Map<string, WeatherForecast[]>> {
  const results = new Map<string, WeatherForecast[]>()

  await Promise.all(
    resorts.map(async (resort) => {
      try {
        const weather = await fetchWeatherForResort(resort)
        results.set(resort.id, weather)
      } catch (error) {
        console.error(`Failed to fetch weather for ${resort.name}:`, error)
      }
    })
  )

  return results
}

// Get weather description from WMO code
export function getWeatherDescription(code: number): string {
  const descriptions: Record<number, string> = {
    0: 'Clear',
    1: 'Mostly Clear',
    2: 'Partly Cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Rime Fog',
    51: 'Light Drizzle',
    53: 'Drizzle',
    55: 'Heavy Drizzle',
    56: 'Freezing Drizzle',
    57: 'Heavy Freezing Drizzle',
    61: 'Light Rain',
    63: 'Rain',
    65: 'Heavy Rain',
    66: 'Freezing Rain',
    67: 'Heavy Freezing Rain',
    71: 'Light Snow',
    73: 'Snow',
    75: 'Heavy Snow',
    77: 'Snow Grains',
    80: 'Light Showers',
    81: 'Showers',
    82: 'Heavy Showers',
    85: 'Light Snow Showers',
    86: 'Heavy Snow Showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with Hail',
    99: 'Severe Thunderstorm',
  }
  return descriptions[code] ?? 'Unknown'
}

// Get weather icon based on code
export function getWeatherIcon(code: number): string {
  if (code === 0) return '☀️'
  if (code <= 3) return '⛅'
  if (code <= 48) return '🌫️'
  if (code <= 57) return '🌧️'
  if (code <= 67) return '🌧️'
  if (code <= 77) return '❄️'
  if (code <= 82) return '🌧️'
  if (code <= 86) return '🌨️'
  return '⛈️'
}

// Fetch hourly forecast for Akakura Kanko (for detailed period display)
export async function fetchHourlyForecast(): Promise<DayForecast[]> {
  const cacheKey = 'hourly-forecast-akakura'

  // Check cache
  try {
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      const parsed = JSON.parse(cached)
      if (Date.now() - parsed.fetchedAt < CACHE_DURATION_MS) {
        return parsed.data
      }
    }
  } catch {
    // Ignore cache errors
  }

  // Akakura Kanko coordinates
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', '36.8833')
  url.searchParams.set('longitude', '138.1667')
  url.searchParams.set('hourly', 'temperature_2m,snowfall,weather_code')
  url.searchParams.set('timezone', 'Asia/Tokyo')
  url.searchParams.set('forecast_days', '6')

  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error(`Failed to fetch hourly weather: ${response.statusText}`)
  }

  const data: OpenMeteoHourlyResponse = await response.json()
  const days = aggregateHourlyToPeriods(data)

  // Cache results
  localStorage.setItem(cacheKey, JSON.stringify({
    data: days,
    fetchedAt: Date.now(),
  }))

  return days
}

function aggregateHourlyToPeriods(data: OpenMeteoHourlyResponse): DayForecast[] {
  const dayMap = new Map<string, { periods: Map<string, { temps: number[]; snow: number[]; codes: number[] }> }>()

  data.hourly.time.forEach((timeStr, i) => {
    const date = new Date(timeStr)
    const dateKey = timeStr.split('T')[0]
    const hour = date.getHours()

    // Determine period: AM (6-12), PM (12-18), night (18-6)
    let period: 'AM' | 'PM' | 'night'
    if (hour >= 6 && hour < 12) {
      period = 'AM'
    } else if (hour >= 12 && hour < 18) {
      period = 'PM'
    } else {
      period = 'night'
    }

    if (!dayMap.has(dateKey)) {
      dayMap.set(dateKey, { periods: new Map() })
    }
    const day = dayMap.get(dateKey)!

    if (!day.periods.has(period)) {
      day.periods.set(period, { temps: [], snow: [], codes: [] })
    }
    const periodData = day.periods.get(period)!

    periodData.temps.push(data.hourly.temperature_2m[i])
    periodData.snow.push(data.hourly.snowfall[i])
    periodData.codes.push(data.hourly.weather_code[i])
  })

  // Convert to array format
  const days: DayForecast[] = []
  const sortedDates = Array.from(dayMap.keys()).sort()

  for (const dateKey of sortedDates) {
    const dayData = dayMap.get(dateKey)!
    const date = new Date(dateKey)
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })

    const periods: PeriodForecast[] = []
    for (const period of ['AM', 'PM', 'night'] as const) {
      const periodData = dayData.periods.get(period)
      if (periodData && periodData.temps.length > 0) {
        // Average temperature, sum snowfall, most common weather code
        const avgTemp = periodData.temps.reduce((a, b) => a + b, 0) / periodData.temps.length
        const totalSnow = periodData.snow.reduce((a, b) => a + b, 0)
        const dominantCode = getMostCommon(periodData.codes)

        periods.push({
          period,
          date: dateKey,
          weatherCode: dominantCode,
          snowfall: totalSnow,
          temperature: Math.round(avgTemp),
        })
      }
    }

    if (periods.length > 0) {
      days.push({ date: dateKey, dayName, periods })
    }
  }

  return days
}

function getMostCommon(arr: number[]): number {
  const counts = new Map<number, number>()
  let maxCount = 0
  let mostCommon = arr[0]

  for (const val of arr) {
    const count = (counts.get(val) ?? 0) + 1
    counts.set(val, count)
    if (count > maxCount) {
      maxCount = count
      mostCommon = val
    }
  }

  return mostCommon
}
