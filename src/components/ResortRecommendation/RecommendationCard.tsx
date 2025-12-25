import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { getWeatherIcon } from '@/lib/weather-api'
import type { ResortState } from '@/types'
import type { RecommendationResult } from '@/types/recommendation'

interface RecommendationCardProps {
  resort: ResortState
  result: RecommendationResult
  isTopPick: boolean
}

export function RecommendationCard({
  resort,
  result,
  isTopPick,
}: RecommendationCardProps) {
  const { config, weather, manual } = resort
  const { score, explanations, highlights, warnings } = result

  const statusColors = {
    OPEN: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    PARTIAL: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    CLOSED: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
    UNKNOWN: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  }

  return (
    <div
      className={cn(
        'group relative rounded-xl border bg-card/50 backdrop-blur-sm transition-all duration-300',
        'hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20',
        'hover:-translate-y-0.5',
        isTopPick
          ? 'border-foreground/20 shadow-md shadow-black/5 dark:shadow-black/20'
          : 'border-border/50'
      )}
    >
      {/* Top Pick indicator */}
      {isTopPick && (
        <div className="absolute -top-px left-6 right-6">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-foreground to-transparent" />
        </div>
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-0.5">
            {isTopPick && (
              <span className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground/60 font-medium">
                Recommended
              </span>
            )}
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-light tracking-tight">{config.name}</h3>
              {weather && (
                <span className="text-lg" title={`Weather: ${weather.weatherCode}`}>
                  {getWeatherIcon(weather.weatherCode)}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground/60">{config.nameJp}</p>
          </div>
          <div className="text-right">
            <div
              className={cn(
                'text-2xl font-extralight tabular-nums tracking-tight',
                isTopPick ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {Math.round(score.total)}
            </div>
            <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/40">
              Score
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="mb-4">
          <div className="h-1 rounded-full bg-muted/50 overflow-hidden flex">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${score.terrain}%` }}
            />
            <div
              className="h-full bg-sky-500 transition-all duration-500"
              style={{ width: `${score.conditions}%` }}
            />
            <div
              className="h-full bg-amber-500 transition-all duration-500"
              style={{ width: `${score.convenience}%` }}
            />
            <div
              className="h-full bg-violet-500 transition-all duration-500"
              style={{ width: `${score.features}%` }}
            />
            <div
              className="h-full bg-rose-500 transition-all duration-500"
              style={{ width: `${score.novelty}%` }}
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4 py-3 border-y border-border/30">
          <div className="text-center">
            <div className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/50 mb-1">
              Drive
            </div>
            <div className="text-sm font-light tabular-nums">
              {config.driveMinutes}
              <span className="text-muted-foreground/40 ml-0.5">min</span>
            </div>
          </div>
          <div className="text-center border-x border-border/30">
            <div className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/50 mb-1">
              Snow
            </div>
            <div className="text-sm font-light tabular-nums">
              {weather?.snowfall24h ? (
                <>
                  {Math.round(weather.snowfall24h)}
                  <span className="text-muted-foreground/40 ml-0.5">cm</span>
                </>
              ) : (
                <span className="text-muted-foreground/30">—</span>
              )}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/50 mb-1">
              Status
            </div>
            <span
              className={cn(
                'inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full border',
                statusColors[manual.status]
              )}
            >
              {manual.status}
            </span>
          </div>
        </div>

        {/* Highlights */}
        {highlights.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {highlights.map((h, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="text-[10px] font-normal bg-muted/50 border-0 px-2"
              >
                {h}
              </Badge>
            ))}
          </div>
        )}

        {/* Explanations */}
        <ul className="space-y-1.5 mb-3">
          {explanations.slice(0, 3).map((exp, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-xs text-muted-foreground/80"
            >
              <span className="text-emerald-500/70 mt-0.5 text-[10px]">+</span>
              <span>{exp}</span>
            </li>
          ))}
        </ul>

        {/* Warnings */}
        {warnings.length > 0 && (
          <ul className="space-y-1.5">
            {warnings.map((warn, i) => {
              const isClosed = warn.toLowerCase().includes('closed')
              return (
                <li
                  key={i}
                  className={cn(
                    'flex items-start gap-2 text-xs',
                    isClosed
                      ? 'text-red-600 dark:text-red-400 font-semibold'
                      : 'text-amber-600/80 dark:text-amber-400/80'
                  )}
                >
                  <span className="mt-0.5 text-[10px]">!</span>
                  <span>{warn}</span>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Subtle corner accent for top pick */}
      {isTopPick && (
        <div className="absolute top-0 right-0 w-8 h-8 overflow-hidden rounded-tr-xl">
          <div className="absolute top-0 right-0 w-12 h-12 -translate-y-1/2 translate-x-1/2 rotate-45 bg-foreground/5" />
        </div>
      )}
    </div>
  )
}
