import { useResortData } from '@/hooks/useResortData'
import { ResortTable } from '@/components/ResortTable'
import { WeatherForecastBar } from '@/components/WeatherForecast'
import { ResortRecommendation } from '@/components/ResortRecommendation'

function getTodayDate(): string {
  const today = new Date()
  return today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

export default function App() {
  const { resortStates, hourlyForecast, updateConfigOverride } = useResortData()

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/80 dark:from-slate-950 dark:to-slate-900">
      {/* Subtle texture overlay */}
      <div
        className="fixed inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 py-12 md:py-20">
        {/* Header */}
        <header className="mb-12 md:mb-16">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl md:text-4xl font-light tracking-tight text-foreground">
                Myoko
                <span className="text-muted-foreground/40 ml-2 font-extralight">/</span>
                <span className="text-muted-foreground/60 ml-2">Nagano</span>
              </h1>
              <p className="text-sm text-muted-foreground font-light tracking-wide">
                Ski Day Planner
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl md:text-3xl font-light tabular-nums tracking-tight">
                {getTodayDate()}
              </p>
              <p className="text-xs text-muted-foreground/60 uppercase tracking-[0.2em] mt-1">
                Today
              </p>
            </div>
          </div>

          {/* Decorative line */}
          <div className="mt-8 h-px bg-gradient-to-r from-border via-border/60 to-transparent" />
        </header>

        {/* 5-Day Forecast */}
        <section className="mb-12">
          <div className="text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em] mb-3">
            Akakura Kanko — 5-Day Forecast
          </div>
          <WeatherForecastBar days={hourlyForecast} />
        </section>

        {/* Main Content */}
        <main className="space-y-0">
          <ResortTable
            resorts={resortStates}
            onUpdateConfigOverride={updateConfigOverride}
          />

          {/* Decorative separator */}
          <div className="pt-16">
            <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
          </div>

          <ResortRecommendation resorts={resortStates} />
        </main>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-border/30">
          <div className="flex items-center justify-center">
            <span className="text-[10px] text-muted-foreground/40 uppercase tracking-[0.2em]">
              Season 2025–26
            </span>
          </div>
        </footer>
      </div>
    </div>
  )
}
