import { useMemo } from 'react'
import { cn } from '@/lib/utils'

type WeatherCategory =
  | 'clear'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'snow'
  | 'thunderstorm'

type Intensity = 'light' | 'moderate' | 'heavy'

interface WeatherAnimation {
  category: WeatherCategory
  intensity: Intensity
}

function getWeatherAnimation(code: number): WeatherAnimation {
  // Clear (0)
  if (code === 0) return { category: 'clear', intensity: 'light' }

  // Cloudy (1-3)
  if (code >= 1 && code <= 3) {
    const intensity = code === 1 ? 'light' : code === 2 ? 'moderate' : 'heavy'
    return { category: 'cloudy', intensity }
  }

  // Fog (45-48)
  if (code >= 45 && code <= 48) {
    return { category: 'fog', intensity: code === 48 ? 'heavy' : 'moderate' }
  }

  // Drizzle (51-57)
  if (code >= 51 && code <= 57) {
    if (code <= 53) return { category: 'drizzle', intensity: 'light' }
    if (code <= 55) return { category: 'drizzle', intensity: 'moderate' }
    return { category: 'drizzle', intensity: 'heavy' }
  }

  // Rain (61-67)
  if (code >= 61 && code <= 67) {
    if (code === 61) return { category: 'rain', intensity: 'light' }
    if (code === 63) return { category: 'rain', intensity: 'moderate' }
    return { category: 'rain', intensity: 'heavy' }
  }

  // Snow (71-77)
  if (code >= 71 && code <= 77) {
    if (code === 71) return { category: 'snow', intensity: 'light' }
    if (code === 73) return { category: 'snow', intensity: 'moderate' }
    return { category: 'snow', intensity: 'heavy' }
  }

  // Showers (80-82)
  if (code >= 80 && code <= 82) {
    if (code === 80) return { category: 'rain', intensity: 'light' }
    if (code === 81) return { category: 'rain', intensity: 'moderate' }
    return { category: 'rain', intensity: 'heavy' }
  }

  // Snow Showers (85-86)
  if (code >= 85 && code <= 86) {
    return { category: 'snow', intensity: code === 85 ? 'moderate' : 'heavy' }
  }

  // Thunderstorm (95-99)
  if (code >= 95) return { category: 'thunderstorm', intensity: 'heavy' }

  return { category: 'clear', intensity: 'light' }
}

interface WeatherBackgroundProps {
  weatherCode: number
  className?: string
}

export function WeatherBackground({
  weatherCode,
  className,
}: WeatherBackgroundProps) {
  const animation = useMemo(
    () => getWeatherAnimation(weatherCode),
    [weatherCode]
  )

  // Particle count based on intensity
  const particleCount = {
    light: 6,
    moderate: 12,
    heavy: 20,
  }[animation.intensity]

  // Animation duration varies by intensity (faster = more intense)
  const baseDuration = {
    light: 4,
    moderate: 3,
    heavy: 2,
  }[animation.intensity]

  // Stable random values for particle positions (seeded by index)
  const particles = useMemo(() => {
    return Array.from({ length: particleCount }).map((_, i) => ({
      left: (i * 100) / particleCount + ((i * 7) % 5),
      delay: (i * baseDuration) / particleCount,
      duration: baseDuration + ((i * 3) % 2),
    }))
  }, [particleCount, baseDuration])

  if (animation.category === 'clear') {
    return null
  }

  return (
    <div
      className={cn(
        'weather-animation absolute inset-0 overflow-hidden rounded-xl pointer-events-none',
        className
      )}
      aria-hidden="true"
    >
      {/* Snow particles */}
      {animation.category === 'snow' && (
        <>
          {particles.map((p, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/50 dark:bg-white/40 rounded-full"
              style={{
                left: `${p.left}%`,
                animation: `snowfall ${p.duration}s linear infinite`,
                animationDelay: `${p.delay}s`,
              }}
            />
          ))}
        </>
      )}

      {/* Rain/drizzle streaks */}
      {(animation.category === 'rain' || animation.category === 'drizzle') && (
        <>
          {particles.map((p, i) => (
            <div
              key={i}
              className={cn(
                'absolute w-px bg-gradient-to-b from-transparent via-sky-400/40 to-transparent dark:via-sky-300/30',
                animation.category === 'rain' ? 'h-8' : 'h-4'
              )}
              style={{
                left: `${p.left}%`,
                animation: `rainfall ${p.duration * 0.5}s linear infinite`,
                animationDelay: `${p.delay * 0.5}s`,
              }}
            />
          ))}
        </>
      )}

      {/* Cloud overlay */}
      {animation.category === 'cloudy' && (
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-muted-foreground/8 to-transparent"
          style={{
            animation: `cloud-drift ${
              20 / (animation.intensity === 'heavy' ? 2 : 1)
            }s ease-in-out infinite`,
          }}
        />
      )}

      {/* Fog overlay */}
      {animation.category === 'fog' && (
        <div
          className="absolute inset-0 bg-gradient-to-t from-muted-foreground/20 to-transparent"
          style={{
            animation: 'fog-pulse 4s ease-in-out infinite',
          }}
        />
      )}

      {/* Thunderstorm: rain + flash */}
      {animation.category === 'thunderstorm' && (
        <>
          {particles.map((p, i) => (
            <div
              key={i}
              className="absolute w-px h-10 bg-gradient-to-b from-transparent via-sky-400/50 to-transparent dark:via-sky-300/40"
              style={{
                left: `${p.left}%`,
                animation: `rainfall 1s linear infinite`,
                animationDelay: `${p.delay * 0.3}s`,
              }}
            />
          ))}
          <div
            className="absolute inset-0 bg-white dark:bg-white/80"
            style={{
              animation: 'thunder-flash 8s ease-in-out infinite',
            }}
          />
        </>
      )}
    </div>
  )
}
