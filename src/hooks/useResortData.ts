import { useState, useEffect, useCallback } from 'react'
import type { ManualResortData, WeatherForecast, ResortState, ResortStatus } from '@/types'
import { RESORTS } from '@/data/resorts'
import { useLocalStorage } from './useLocalStorage'
import { fetchWeatherForAllResorts, fetchHourlyForecast, type DayForecast } from '@/lib/weather-api'

// Type for scraped data from resort-status.json
interface ScrapedResortData {
  status: ResortStatus
  baseDepthCm: number | null
  liftsOpen: number | null
  slopesOpen: number | null
  temperature: number | null
  weather: string | null
  scrapedAt: string
  error?: string
}

interface ScrapedData {
  scrapedAt: string | null
  resorts: Record<string, ScrapedResortData>
}

const DEFAULT_MANUAL_DATA: ManualResortData = {
  status: 'UNKNOWN',
  baseDepthCm: null,
  liftsOpen: null,
  slopesOpen: null,
  notes: '',
  updatedAt: '',
}

type ManualDataMap = Record<string, ManualResortData>

// Fetch scraped resort data
async function fetchScrapedData(): Promise<ScrapedData> {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}data/resort-status.json`)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.warn('Failed to fetch scraped data:', error)
    return { scrapedAt: null, resorts: {} }
  }
}

export function useResortData() {
  const [manualData, setManualData] = useLocalStorage<ManualDataMap>(
    'resort-manual-data',
    {}
  )
  const [scrapedData, setScrapedData] = useState<ScrapedData>({ scrapedAt: null, resorts: {} })
  const [weatherData, setWeatherData] = useState<Map<string, WeatherForecast[]>>(
    new Map()
  )
  const [hourlyForecast, setHourlyForecast] = useState<DayForecast[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch weather data and scraped data on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const [weather, hourly, scraped] = await Promise.all([
          fetchWeatherForAllResorts(RESORTS),
          fetchHourlyForecast(),
          fetchScrapedData(),
        ])
        setWeatherData(weather)
        setHourlyForecast(hourly)
        setScrapedData(scraped)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Get today's forecast for a resort
  const getTodayForecast = useCallback(
    (resortId: string): WeatherForecast | null => {
      const forecasts = weatherData.get(resortId)
      if (!forecasts || forecasts.length < 1) return null
      return forecasts[0] // Index 0 is today
    },
    [weatherData]
  )

  // Get combined resort state (merges scraped + manual data)
  const getResortStates = useCallback((): ResortState[] => {
    return RESORTS.map((config) => {
      const scraped = scrapedData.resorts[config.id]
      const manual = manualData[config.id] ?? DEFAULT_MANUAL_DATA

      // Merge scraped data with manual data (manual overrides scraped when set)
      const mergedManual: ManualResortData = {
        status: manual.status !== 'UNKNOWN' ? manual.status : (scraped?.status ?? 'UNKNOWN'),
        baseDepthCm: manual.baseDepthCm ?? scraped?.baseDepthCm ?? null,
        liftsOpen: manual.liftsOpen ?? scraped?.liftsOpen ?? null,
        slopesOpen: manual.slopesOpen ?? scraped?.slopesOpen ?? null,
        notes: manual.notes,
        updatedAt: manual.updatedAt || scraped?.scrapedAt || '',
      }

      return {
        config,
        weather: getTodayForecast(config.id),
        manual: mergedManual,
      }
    })
  }, [manualData, scrapedData, getTodayForecast])

  // Update manual data for a resort
  const updateManualData = useCallback(
    (resortId: string, data: Partial<ManualResortData>) => {
      setManualData((prev) => ({
        ...prev,
        [resortId]: {
          ...(prev[resortId] ?? DEFAULT_MANUAL_DATA),
          ...data,
          updatedAt: new Date().toISOString(),
        },
      }))
    },
    [setManualData]
  )

  return {
    resortStates: getResortStates(),
    hourlyForecast,
    isLoading,
    error,
    updateManualData,
    scrapedAt: scrapedData.scrapedAt,
  }
}
