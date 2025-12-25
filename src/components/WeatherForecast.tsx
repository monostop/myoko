import { Fragment } from 'react'
import type { DayForecast } from '@/lib/weather-api'
import { getWeatherIcon } from '@/lib/weather-api'

interface WeatherForecastProps {
  days: DayForecast[]
}

export function WeatherForecastBar({ days }: WeatherForecastProps) {
  // Show up to 5 days
  const visibleDays = days.slice(0, 5)

  if (visibleDays.length === 0) {
    return null
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-center text-[10px] border-collapse">
        <thead>
          <tr>
            <th className="px-1 py-1 text-muted-foreground/50 font-normal"></th>
            {visibleDays.map((day, i) => (
              <th
                key={day.date}
                colSpan={3}
                className="px-1 py-1 font-medium border-l-2 border-border/50 first:border-l-0"
              >
                <div className="text-xs">{i === 0 ? 'Today' : day.dayName}</div>
                <div className="text-[9px] text-muted-foreground/60 font-normal">
                  {new Date(day.date).getDate()}
                </div>
              </th>
            ))}
          </tr>
          <tr className="text-[9px] text-muted-foreground/50">
            <td></td>
            {visibleDays.map((day, i) => (
              <Fragment key={day.date}>
                <td className={`px-1 ${i > 0 ? 'border-l-2 border-border/50' : ''}`}>AM</td>
                <td className="px-1">PM</td>
                <td className="px-1">night</td>
              </Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Weather icons row */}
          <tr>
            <td className="px-2 py-1 text-left text-muted-foreground/50"></td>
            {visibleDays.map((day, dayIndex) => (
              <Fragment key={day.date}>
                {['AM', 'PM', 'night'].map((period) => {
                  const p = day.periods.find((x) => x.period === period)
                  const isFirstOfDay = period === 'AM' && dayIndex > 0
                  return (
                    <td
                      key={`${day.date}-${period}-icon`}
                      className={`px-1 py-1 text-base ${isFirstOfDay ? 'border-l-2 border-border/50' : ''}`}
                    >
                      {p ? getWeatherIcon(p.weatherCode) : '—'}
                    </td>
                  )
                })}
              </Fragment>
            ))}
          </tr>
          {/* Snowfall row */}
          <tr className="bg-sky-50/50 dark:bg-sky-950/20">
            <td className="px-2 py-1 text-left text-muted-foreground/50">cm</td>
            {visibleDays.map((day, dayIndex) => (
              <Fragment key={day.date}>
                {['AM', 'PM', 'night'].map((period) => {
                  const p = day.periods.find((x) => x.period === period)
                  const snow = p?.snowfall ?? 0
                  const isFirstOfDay = period === 'AM' && dayIndex > 0
                  return (
                    <td
                      key={`${day.date}-${period}-snow`}
                      className={`px-1 py-1 tabular-nums ${isFirstOfDay ? 'border-l-2 border-border/50' : ''} ${
                        snow > 0
                          ? 'text-sky-600 dark:text-sky-400 font-medium'
                          : 'text-muted-foreground/40'
                      }`}
                    >
                      {snow > 0 ? Math.round(snow) : '—'}
                    </td>
                  )
                })}
              </Fragment>
            ))}
          </tr>
          {/* Temperature row */}
          <tr>
            <td className="px-2 py-1 text-left text-muted-foreground/50">°C</td>
            {visibleDays.map((day, dayIndex) => (
              <Fragment key={day.date}>
                {['AM', 'PM', 'night'].map((period) => {
                  const p = day.periods.find((x) => x.period === period)
                  const temp = p?.temperature
                  const isFirstOfDay = period === 'AM' && dayIndex > 0
                  return (
                    <td
                      key={`${day.date}-${period}-temp`}
                      className={`px-1 py-1 tabular-nums ${isFirstOfDay ? 'border-l-2 border-border/50' : ''} ${
                        temp !== undefined && temp < 0
                          ? 'text-cyan-600 dark:text-cyan-400'
                          : 'text-muted-foreground/70'
                      }`}
                    >
                      {temp !== undefined ? temp : '—'}
                    </td>
                  )
                })}
              </Fragment>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}
