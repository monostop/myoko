import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { ResortState } from '@/types'
import type { RecommendationPreferences } from '@/types/recommendation'
import { DEFAULT_PREFERENCES } from '@/types/recommendation'
import { calculateRecommendations } from '@/lib/recommendation-engine'
import { PreferencesForm } from './PreferencesForm'
import { RecommendationCard } from './RecommendationCard'

interface ResortRecommendationProps {
  resorts: ResortState[]
}

export function ResortRecommendation({ resorts }: ResortRecommendationProps) {
  const [preferences, setPreferences] =
    useState<RecommendationPreferences>(DEFAULT_PREFERENCES)
  const [isExpanded, setIsExpanded] = useState(false)

  const recommendations = useMemo(
    () => calculateRecommendations(resorts, preferences),
    [resorts, preferences]
  )

  const resortMap = useMemo(
    () => new Map(resorts.map((r) => [r.config.id, r])),
    [resorts]
  )

  const displayedResults = isExpanded
    ? recommendations
    : recommendations.slice(0, 3)

  return (
    <section className="relative mt-16">
      {/* Subtle topographic pattern background */}
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 10c22 0 40 18 40 40s-18 40-40 40S10 72 10 50 28 10 50 10zm0 10c-16.5 0-30 13.5-30 30s13.5 30 30 30 30-13.5 30-30-13.5-30-30-30zm0 10c11 0 20 9 20 20s-9 20-20 20-20-9-20-20 9-20 20-20z' fill='none' stroke='currentColor' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '100px 100px',
        }}
      />

      <div className="relative space-y-8">
        {/* Section Header */}
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-extralight tracking-tight">
              Resort Finder
            </h2>
            <p className="text-xs text-muted-foreground/60 mt-1 tracking-wide">
              Personalized recommendations based on your preferences
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-[9px] text-muted-foreground/40">
            <span className="w-2 h-2 rounded-full bg-emerald-500/60" />
            <span>Terrain</span>
            <span className="w-2 h-2 rounded-full bg-sky-500/60 ml-2" />
            <span>Conditions</span>
            <span className="w-2 h-2 rounded-full bg-amber-500/60 ml-2" />
            <span>Convenience</span>
            <span className="w-2 h-2 rounded-full bg-violet-500/60 ml-2" />
            <span>Features</span>
          </div>
        </div>

        {/* Preferences Form Card */}
        <div className="relative rounded-2xl border border-border/40 bg-gradient-to-b from-card/80 to-card/40 backdrop-blur-sm p-6 md:p-8">
          {/* Subtle inner glow */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
          <div className="relative">
            <PreferencesForm
              preferences={preferences}
              onPreferencesChange={setPreferences}
            />
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {displayedResults.map((result, index) => {
            const resort = resortMap.get(result.resortId)
            if (!resort) return null
            return (
              <RecommendationCard
                key={result.resortId}
                resort={resort}
                result={result}
                isTopPick={index === 0}
              />
            )
          })}
        </div>

        {/* Show More/Less */}
        {recommendations.length > 3 && (
          <div className="flex justify-center">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn(
                'group flex items-center gap-2 px-4 py-2 rounded-full',
                'text-xs text-muted-foreground/60 hover:text-muted-foreground',
                'border border-transparent hover:border-border/50',
                'transition-all duration-200'
              )}
            >
              <span>{isExpanded ? 'Show less' : `Show all ${recommendations.length} resorts`}</span>
              <svg
                viewBox="0 0 24 24"
                className={cn(
                  'size-3.5 transition-transform duration-200',
                  isExpanded && 'rotate-180'
                )}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}

        {/* Mobile Score Legend */}
        <div className="sm:hidden flex justify-center gap-4 text-[9px] text-muted-foreground/40 pt-4">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500/60" /> Terrain
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-sky-500/60" /> Conditions
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500/60" /> Convenience
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-violet-500/60" /> Features
          </span>
        </div>
      </div>
    </section>
  )
}

export { PreferencesForm } from './PreferencesForm'
export { RecommendationCard } from './RecommendationCard'
