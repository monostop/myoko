import { useState, useEffect, useCallback } from 'react'
import type { ManualResortData, WeatherForecast, ResortState } from '@/types'
import { RESORTS } from '@/data/resorts'
import { useLocalStorage } from './useLocalStorage'
import { fetchWeatherForAllResorts } from '@/lib/weather-api'

const DEFAULT_MANUAL_DATA: ManualResortData = {
  status: 'UNKNOWN',
  baseDepthCm: null,
  liftsOpen: null,
  slopesOpen: null,
  notes: '',
  updatedAt: '',
}

type ManualDataMap = Record<string, ManualResortData>

export function useResortData() {
  const [manualData, setManualData] = useLocalStorage<ManualDataMap>(
    'resort-manual-data',
    {}
  )
  const [weatherData, setWeatherData] = useState<Map<string, WeatherForecast[]>>(
    new Map()
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch weather data on mount
  useEffect(() => {
    const fetchWeather = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const weather = await fetchWeatherForAllResorts(RESORTS)
        setWeatherData(weather)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch weather')
      } finally {
        setIsLoading(false)
      }
    }

    fetchWeather()
  }, [])

  // Get tomorrow's forecast for a resort
  const getTomorrowForecast = useCallback(
    (resortId: string): WeatherForecast | null => {
      const forecasts = weatherData.get(resortId)
      if (!forecasts || forecasts.length < 2) return null
      return forecasts[1] // Index 1 is tomorrow
    },
    [weatherData]
  )

  // Get combined resort state
  const getResortStates = useCallback((): ResortState[] => {
    return RESORTS.map((config) => ({
      config,
      weather: getTomorrowForecast(config.id),
      manual: manualData[config.id] ?? DEFAULT_MANUAL_DATA,
    }))
  }, [manualData, getTomorrowForecast])

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

  // Refresh weather data
  const refreshWeather = useCallback(async () => {
    // Clear cache by removing localStorage items
    RESORTS.forEach((resort) => {
      localStorage.removeItem(`weather-cache-${resort.id}`)
    })

    setIsLoading(true)
    setError(null)
    try {
      const weather = await fetchWeatherForAllResorts(RESORTS)
      setWeatherData(weather)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather')
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    resortStates: getResortStates(),
    isLoading,
    error,
    updateManualData,
    refreshWeather,
  }
}
